'use client';

import { useState, useMemo, useRef, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";
import "react-quill-new/dist/quill.snow.css"; // Atau "react-quill/dist/quill.snow.css"

// Dynamic import ReactQuill agar tidak error di Next.js SSR
const ReactQuill = dynamic(async () => {
  const { default: RQ } = await import("react-quill-new"); // Bisa diganti 'react-quill'
  return function comp({ forwardedRef, ...props }: any) {
    return <RQ ref={forwardedRef} {...props} />;
  };
}, { ssr: false });

interface MaterialData {
  id: string;
  bipa_level_id: number;
  title: string;
  slug: string;
  content_text: string;
  image_urls: string[] | null;
  embed_media_urls: string | null;
  order_index: number;
}

interface MateriFormProps {
  initialData?: MaterialData;
}

export default function MateriForm({ initialData }: MateriFormProps) {
  const router = useRouter();
  const quillRef = useRef<any>(null);
  const isUpdate = Boolean(initialData);

  // Form State
  const [formData, setFormData] = useState({
    bipa_level_id: initialData?.bipa_level_id || 1,
    title: initialData?.title || "",
    embed_media_urls: initialData?.embed_media_urls || "",
    order_index: initialData?.order_index || 1,
  });

  const [contentText, setContentText] = useState(initialData?.content_text || "");
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>(
    initialData?.image_urls || []
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Image Handler untuk React Quill
  const imageHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        setIsLoading(true);

        // Kompres Gambar
        const compressedOptions = {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1200,
        };
        const compressedFile = await imageCompression(file, compressedOptions);

        // Upload ke Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `materials/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("reference-images")
          .upload(fileName, compressedFile);

        if (uploadError) throw uploadError;

        // Ambil public URL gambar yang diupload
        const { data: urlData } = supabase.storage
          .from("reference-images")
          .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        // Insert Gambar ke React Quill
        const editor = quillRef.current.getEditor();
        const range = editor.getSelection(true);
        editor.insertEmbed(range.index, "image", publicUrl);
        editor.setSelection(range.index + 1);

        // Tambahkan URL ke daftar image_urls
        setUploadedImageUrls((prev) => [...prev, publicUrl]);
      } catch (err: any) {
        alert("Gagal mengunggah gambar: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };
  };

  // Modul Toolbar React Quill
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image", "video"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler, // Mengganti fungsi handler image bawaan
        },
      },
    }),
    []
  );

  // Generate slug materi
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const slug = generateSlug(formData.title);

      const payload = {
        bipa_level_id: Number(formData.bipa_level_id),
        title: formData.title,
        slug: slug,
        content_text: contentText,
        image_urls: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
        embed_media_urls: formData.embed_media_urls || null,
        order_index: Number(formData.order_index),
      };

      if (isUpdate && initialData) {
        const oldImageUrls = initialData?.image_urls;
        if (oldImageUrls && oldImageUrls.length > 0) {
          // Ekstrak relative path dari setiap public url
          const filePaths = oldImageUrls.map((url) => {
            const fileName = url.split("/").pop();
            return `materials/${fileName}`;
          });

          const { error: storageError } = await supabase.storage
            .from("reference-images")
            .remove(filePaths);

          if (storageError) {
            console.error("Gagal menghapus beberapa berkas gambar dari storage:", storageError.message);
          } else {
            console.log(`${filePaths.length} gambar berhasil dibersihkan dari Storage!`);
          }
        }

        const { error } = await supabase
          .from("materials")
          .update(payload)
          .eq("id", initialData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("materials")
          .insert([payload]);

        if (error) throw error;
      }

      router.push("/admin/materi");
      router.refresh();
    } catch (err: any) {
      alert("Gagal menyimpan materi: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto p-6 bg-white rounded-2xl border border-slate-200 shadow-sm my-6">
      <h2 className="text-xl font-bold mb-6 text-slate-800">
        {isUpdate ? "Edit Materi Pembelajaran" : "Tambah Materi Pembelajaran Baru"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Level BIPA */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Level BIPA</label>
            <select
              name="bipa_level_id"
              value={formData.bipa_level_id}
              onChange={handleInputChange}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
            >
              <option value={1}>BIPA 1</option>
              <option value={2}>BIPA 2</option>
              <option value={3}>BIPA 3</option>
            </select>
          </div>

          {/* Urutan Materi */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Urutan Materi (Order)</label>
            <input
              type="number"
              name="order_index"
              value={formData.order_index}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Embed Video Youtube */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Link URL Video YouTube</label>
            <input
              type="url"
              name="embed_media_urls"
              value={formData.embed_media_urls}
              onChange={handleInputChange}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Judul Materi */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Judul Materi</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Contoh: Mengenal Seblak Bandung yang Pedas"
            required
            className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Rich Text Editor (React Quill) */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Isi Materi</label>
          <div className="bg-white overflow-hidden">
            <ReactQuill
              forwardedRef={quillRef}
              theme="snow"
              value={contentText}
              onChange={setContentText}
              modules={modules}
              className="min-h-62.5"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.push("/admin/materi")}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition disabled:bg-slate-300 cursor-pointer"
          >
            {isLoading ? "Memproses..." : isUpdate ? "Simpan Perubahan" : "Tambah Materi"}
          </button>
        </div>
      </form>
    </div>
  );
}