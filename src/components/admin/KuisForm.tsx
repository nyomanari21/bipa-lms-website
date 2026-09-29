'use client';

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Quiz {
  id: string;
  title: string;
}

interface QuestionData {
  id?: string;
  quiz_id: string;
  question_text: string;
  question_type: "multiple_choice" | "short_answer" | "essay" | "speaking";
  options: string[] | null;
  correct_answer: string | null;
  question_number: number;
}

interface QuestionFormProps {
  quizzes?: Quiz[]; // Daftar kuis untuk dropdown pilih kuis
  initialData?: QuestionData;
}

export default function KuisForm({ quizzes, initialData }: QuestionFormProps) {
  const router = useRouter();
  const isUpdate = Boolean(initialData);

  // State Utama Form
  const [quizId, setQuizId] = useState(initialData?.quiz_id || (quizzes?.[0]?.id || ""));
  const [questionText, setQuestionText] = useState(initialData?.question_text || "");
  const [questionType, setQuestionType] = useState<QuestionData["question_type"]>(
    initialData?.question_type || "multiple_choice"
  );
  const [questionNumber, setQuestionNumber] = useState(initialData?.question_number || 1);

  // State Khusus Multiple Choice (4 Opsi)
  const [mcOptions, setMcOptions] = useState<string[]>(
    initialData?.options && initialData.options.length === 4
      ? initialData.options.map((opt) => opt.replace(/^[A-D]\.\s*/, "")) // Bersihkan prefix 'A. ' jika ada
      : ["", "", "", ""]
  );
  const [selectedCorrectMc, setSelectedCorrectMc] = useState<string>(
    initialData?.question_type === "multiple_choice" ? initialData.correct_answer || "0" : "0"
  );

  // State Khusus Short Answer
  const [shortAnswerKey, setShortAnswerKey] = useState<string>(
    initialData?.question_type === "short_answer" ? initialData.correct_answer || "" : ""
  );

  const [isLoading, setIsLoading] = useState(false);

  // Handle Perubahan Opsi A, B, C, D
  const handleOptionChange = (index: number, value: string) => {
    const updated = [...mcOptions];
    updated[index] = value;
    setMcOptions(updated);
  };

  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let finalOptions: string[] | null = null;
      let finalCorrectAnswer: string | null = null;

      // Olah data berdasarkan tipe soal
      if (questionType === "multiple_choice") {
        // Format opsi jadi: ["A. Jahe", "B. Kunyit", "C. Kencur", "D. Lengkuas"]
        const labels = ["A", "B", "C", "D"];
        finalOptions = mcOptions.map((opt, i) => `${labels[i]}. ${opt.trim()}`);
        finalCorrectAnswer = selectedCorrectMc; // Menyimpan indeks berupa string ("0", "1", "2", atau "3")
      } else if (questionType === "short_answer") {
        finalOptions = null;
        finalCorrectAnswer = shortAnswerKey.trim();
      } else {
        // Esai & Speaking
        finalOptions = null;
        finalCorrectAnswer = null;
      }

      const payload = {
        quiz_id: quizId,
        question_text: questionText,
        question_type: questionType,
        options: finalOptions,
        correct_answer: finalCorrectAnswer,
        question_number: Number(questionNumber),
      };

      if (isUpdate && initialData?.id) {
        const { error } = await supabase
          .from("questions")
          .update(payload)
          .eq("id", initialData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("questions")
          .insert([payload]);

        if (error) throw error;
      }

      alert(`Berhasil ${isUpdate ? "memperbarui" : "menambahkan"} data soal!`);
      router.push("/admin/kuis");
      router.refresh();
    } catch (err: any) {
      alert("Gagal menyimpan soal: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto p-6 bg-white rounded-2xl border border-slate-200 shadow-sm my-6">
      <h2 className="text-xl font-bold mb-6 text-slate-800">
        {isUpdate ? "Edit Pertanyaan Kuis" : "Tambah Pertanyaan Kuis Baru"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Pilih Kuis & Nomor Soal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Pilih Modul Materi
            </label>
            <select
              value={quizId}
              onChange={(e) => setQuizId(e.target.value)}
              required
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500 bg-white"
            >
              {quizzes?.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Nomor Soal
            </label>
            <input
              type="number"
              value={questionNumber}
              onChange={(e) => setQuestionNumber(Number(e.target.value))}
              required
              min={1}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Row 2: Tipe Soal */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Tipe Pertanyaan
          </label>
          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value as any)}
            className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500 bg-white"
          >
            <option value="multiple_choice">Pilihan Ganda (Multiple Choice)</option>
            <option value="short_answer">Isian Singkat (Short Answer)</option>
            <option value="essay">Esai (Essay)</option>
            <option value="speaking">Rekam Suara (Speaking)</option>
          </select>
        </div>

        {/* Row 3: Teks Pertanyaan / Instruksi Soal */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
            Teks Pertanyaan / Instruksi Soal
          </label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={3}
            placeholder={
              questionType === "speaking"
                ? "Contoh instruksi: Silakan baca kalimat berikut dengan lafal yang jelas: 'Bu, saya memesan Seblak Bandung...'"
                : "Tuliskan pertanyaan di sini..."
            }
            required
            className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* PILIHAN GANDA*/}
        {questionType === "multiple_choice" && (
          <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-3">
            <label className="block text-xs font-bold uppercase text-orange-800">
              Opsi Jawaban & Kunci Jawaban
            </label>
            
            <div className="space-y-2">
              {["A", "B", "C", "D"].map((label, idx) => (
                <div key={label} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correct_answer_radio"
                    value={idx.toString()}
                    checked={selectedCorrectMc === idx.toString()}
                    onChange={(e) => setSelectedCorrectMc(e.target.value)}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-400 cursor-pointer"
                    title={`Pilih ${label} sebagai jawaban benar`}
                  />
                  <span className="w-6 text-sm font-bold text-slate-700">{label}.</span>
                  <input
                    type="text"
                    value={mcOptions[idx]}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Isi opsi ${label}`}
                    required={questionType === "multiple_choice"}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-orange-600 italic">
              *Pilih radio button di sebelah kiri opsi yang merupakan <b>kunci jawaban benar</b>.
            </p>
          </div>
        )}

        {/* ISIAN SINGKAT*/}
        {questionType === "short_answer" && (
          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
            <label className="block text-xs font-bold uppercase text-blue-800 mb-1">
              Kunci Jawaban Singkat (Tepat)
            </label>
            <input
              type="text"
              value={shortAnswerKey}
              onChange={(e) => setShortAnswerKey(e.target.value)}
              placeholder="Contoh: kerupuk"
              required={questionType === "short_answer"}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-blue-600 mt-1.5">
              *Jawaban mahasiswa akan dicocokkan otomatis dengan kata kunci ini (case-insensitive).
            </p>
          </div>
        )}

        {/* ESAI & SPEAKING*/}
        {(questionType === "essay" || questionType === "speaking") && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
            <p className="text-xs font-semibold text-slate-600">
              ℹ️ Tipe soal <b>{questionType === "essay" ? "Esai" : "Rekam Suara (Speaking)"}</b> tidak memerlukan kunci jawaban otomatis. Penilaian akan dilakukan secara manual oleh Dosen pada menu Penilaian Mahasiswa.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.push("/admin/kuis")}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition disabled:bg-slate-300 cursor-pointer"
          >
            {isLoading ? "Memproses..." : isUpdate ? "Simpan Perubahan" : "Tambah Soal"}
          </button>
        </div>
      </form>
    </div>
  );
}