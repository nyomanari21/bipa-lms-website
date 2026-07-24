// src/app/(public)/materi/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Definisikan tipe data untuk detail materi
interface MaterialDetail {
  id: string;
  title: string;
  slug: string;
  content_text: string;
  embed_media_urls: string;
  bipa_level_id: number;
}

export default function DetailMateriPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMaterialDetail() {
      setLoading(true);
      
      // Ambil data satu materi yang cocok dengan slug di URL
      const { data, error } = await supabase
        .from("materials")
        .select("id, title, slug, content_text, embed_media_urls, bipa_level_id")
        .eq("slug", slug)
        .single();

      if (error) {
        console.error("Gagal mengambil detail materi:", error.message);
        setMaterial(null);
      } else if (data) {
        setMaterial(data);
      }
      
      setLoading(false);
    }

    if (slug) {
      fetchMaterialDetail();
    }
  }, [slug]);

  // Ambil ID video dari link youtube
  function getYouTubeId(url: string) {
    if (!url) return null;
    
    // Regex untuk menangkap ID dari berbagai format URL YouTube
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);

    return (match && match[2].length === 11) ? match[2] : null;
  }

  // Loading State
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500 font-medium">
        Memuat isi materi...
      </div>
    );
  }

  // Jika Materi Tidak Ditemukan di Database
  if (!material) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <span className="text-4xl">🔍</span>
        <h1 className="text-2xl font-bold text-slate-800 mt-4">Materi Tidak Ditemukan</h1>
        <p className="text-slate-500 text-sm mt-1">Materi dengan link ini tidak tersedia atau telah dihapus.</p>
        <button 
          onClick={() => router.push("/materi")} 
          className="mt-4 text-orange-500 font-bold hover:underline"
        >
          &larr; Kembali ke Daftar Materi
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-10 bg-slate-50 text-slate-800">
      {/* Breadcrumb & Meta */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
        <button onClick={() => router.push("/materi")} className="hover:text-orange-500 transition cursor-pointer">
          Materi
        </button>
        <span>&bull;</span>
        <span className="text-orange-500">BIPA {material.bipa_level_id}</span>
      </div>

      {/* Judul Materi */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
        {material.title}
      </h1>

      {/* Embed YouTube Video */}
      {material.embed_media_urls && (
        <div className="mb-10 aspect-video w-full md:max-w-3xl mx-auto bg-slate-200 rounded-2xl overflow-hidden shadow-sm border border-slate-200">
          {(() => {
            const videoId = getYouTubeId(material.embed_media_urls);
            
            if (videoId) {
              return (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                ></iframe>
              );
            } else {
              return (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  Format link YouTube tidak valid.
                </div>
              );
            }
          })()}
        </div>
      )}

      {/* Konten Materi (Render HTML Rich Text Editor dari Supabase) */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm mb-10 overflow-hidden">
        <div 
          className="prose max-w-none text-sm md:text-base leading-relaxed text-slate-700 wrap-break-word
                    [&_p]:mb-4 [&_p]:min-h-4
                    [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:text-slate-900 [&_h1]:mt-6 [&_h1]:mb-3
                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-5 [&_h2]:mb-2.5
                    [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mt-4 [&_h3]:mb-2
                    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3
                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3
                    [&_li]:mb-1
                    [&_img]:rounded-xl [&_img]:my-4 [&_img]:max-h-112.5 [&_img]:w-auto [&_img]:object-cover
                    [&_blockquote]:border-l-4 [&_blockquote]:border-orange-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:bg-slate-50 [&_blockquote]:py-2 [&_blockquote]:rounded-r-lg"
          dangerouslySetInnerHTML={{ __html: material.content_text }}
        />
      </div>

      {/* Navigasi Ke Latihan Soal */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-orange-900 text-base">Sudah Paham dengan Materi Ini?</h4>
          <p className="text-xs text-orange-600 mt-0.5">Uji kemampuan Bahasa Indonesia-mu lewat latihan soal di akhir bab.</p>
        </div>
        <button
          onClick={() => router.push(`/materi/${material.slug}/kuis`)}
          className="bg-orange-500 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-orange-600 transition shadow-md shadow-orange-500/10 whitespace-nowrap cursor-pointer">
          Mulai Latihan Soal &rarr;
        </button>
      </div>
    </div>
  );
}