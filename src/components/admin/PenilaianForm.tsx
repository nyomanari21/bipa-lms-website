'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface AnswerItem {
  id: string;
  question_id: string;
  student_answer_text: string | null;
  student_answer_audio_url: string | null;
  is_correct: boolean | null;
  score: number | null;
  teacher_feedback: string | null;
  questions: {
    question_text: string;
    question_type: "multiple_choice" | "short_answer" | "essay" | "speaking";
    options: string[] | null;
    correct_answer: string | null;
    question_number: number;
  } | null;
}

interface AttemptData {
  id: string;
  final_score: number | null;
  status: string;
  attempted_at: string;
  users: { name: string; email: string } | { name: string; email: string }[] | null;
  quizzes: { title: string } | { title: string }[] | null;
}

interface GradingFormProps {
  attempt: AttemptData;
  initialAnswers: AnswerItem[];
}

export default function PenilaianForm({ attempt, initialAnswers }: GradingFormProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<AnswerItem[]>(initialAnswers);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper parser profile & quiz
  const student = Array.isArray(attempt.users) ? attempt.users[0] : attempt.users;
  const quiz = Array.isArray(attempt.quizzes) ? attempt.quizzes[0] : attempt.quizzes;

  // Handle perubahan nilai per soal (Manual Grading)
  const handleScoreChange = (index: number, val: string) => {
    const numericVal = val === "" ? null : Math.min(100, Math.max(0, Number(val)));
    const updated = [...answers];
    updated[index].score = numericVal;
    // Otomatis tandai benar jika nilai di atas 70 (opsional)
    if (numericVal !== null) {
      updated[index].is_correct = numericVal >= 70;
    }
    setAnswers(updated);
  };

  // Handle perubahan feedback/catatan dosen
  const handleFeedbackChange = (index: number, val: string) => {
    const updated = [...answers];
    updated[index].teacher_feedback = val;
    setAnswers(updated);
  };

  // Kalkulasi total rata-rata nilai akhir
  const calculatedFinalScore = () => {
    if (answers.length === 0) return 0;
    const total = answers.reduce((acc, curr) => acc + (curr.score || 0), 0);
    return Math.round(total / answers.length);
  };

  // Submit Penilaian ke Database
  const handleSaveGrading = async () => {
    setIsSubmitting(true);
    const finalScore = calculatedFinalScore();

    try {
      // Update setiap baris student_answers
      for (const item of answers) {
        const { error: ansError } = await supabase
          .from("student_answers")
          .update({
            score: item.score,
            is_correct: item.is_correct,
            teacher_feedback: item.teacher_feedback,
          })
          .eq("id", item.id);

        if (ansError) throw ansError;
      }

      // Update student_quiz_attempts (final_score & status -> graded)
      const { error: attemptError } = await supabase
        .from("student_quiz_attempts")
        .update({
          final_score: finalScore,
          status: "graded",
        })
        .eq("id", attempt.id);

      if (attemptError) throw attemptError;

      alert(`Penilaian berhasil disimpan! Skor akhir: ${finalScore}`);
      router.push("/admin/penilaian");
      router.refresh();
    } catch (err: any) {
      alert("Gagal menyimpan penilaian: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info Siswa & Kuis */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push("/admin/penilaian")}
            className="text-xs font-semibold text-slate-500 hover:text-orange-500 mb-2 flex items-center gap-1 transition cursor-pointer"
          >
            ← Kembali ke Daftar Penilaian
          </button>
          <h1 className="text-xl font-bold text-slate-800">{quiz?.title || "Evaluasi Siswa"}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Nama Siswa: <span className="font-semibold text-slate-700">{student?.name}</span> ({student?.email})
          </p>
        </div>

        <div className="flex items-center gap-4 bg-orange-50 px-5 py-3 rounded-2xl border border-orange-100">
          <div>
            <span className="block text-[10px] font-bold uppercase text-orange-600 tracking-wider">
              Kalkulasi Nilai Akhir
            </span>
            <span className="text-3xl font-black text-orange-600">{calculatedFinalScore()} / 100</span>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
            attempt.status === "graded" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          }`}>
            {attempt.status}
          </span>
        </div>
      </div>

      {/* Lembar Jawaban Soal per Soal */}
      <div className="space-y-4">
        {answers.map((item, index) => {
          const q = item.questions;
          const qType = q?.question_type || "multiple_choice";

          return (
            <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              {/* Info Nomor & Tipe Soal */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nomor {q?.question_number || index + 1} • <span className="text-orange-600">{qType.replace("_", " ")}</span>
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700">Skor (0-100):</label>
                  <input
                    disabled={attempt.status === "graded" ? true : false}
                    type="number"
                    min={0}
                    max={100}
                    value={item.score !== null ? item.score : ""}
                    onChange={(e) => handleScoreChange(index, e.target.value)}
                    className="w-20 p-1.5 text-center text-sm font-bold border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500 bg-slate-50"
                  />
                </div>
              </div>

              {/* Teks Pertanyaan */}
              <h3 className="text-sm md:text-base font-semibold text-slate-800 leading-relaxed">
                {q?.question_text}
              </h3>

              {/* Tampilan Khusus Berdasarkan Tipe Soal */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-400 block">Jawaban Siswa:</span>
                
                {/* Tipe Soal Latihan Berbicara (Audio Player) */}
                {qType === "speaking" && (
                  <div>
                    {item.student_answer_audio_url ? (
                      <div className="flex flex-col gap-2 pt-1">
                        <audio src={item.student_answer_audio_url} controls className="w-full h-10" />
                        <a
                          href={item.student_answer_audio_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-600 hover:underline inline-block"
                        >
                          🔗 Buka / Download file audio rekaman
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-red-500 italic">Siswa tidak menyertakan rekaman suara.</p>
                    )}
                  </div>
                )}

                {/* Tipe Soal Esai */}
                {qType === "essay" && (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                    {item.student_answer_text || <span className="text-red-500 italic">Tidak ada jawaban esai.</span>}
                  </p>
                )}

                {/* Tipe Soal Isian Singkat */}
                {qType === "short_answer" && (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800">
                      Jawaban Siswa: <span className="text-orange-600">{item.student_answer_text || "-"}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Kunci Jawaban: <span className="font-semibold text-green-700">{q?.correct_answer}</span>
                    </p>
                  </div>
                )}

                {/* Tipe Soal Pilihan Ganda */}
                {qType === "multiple_choice" && (
                  <div className="space-y-1 text-xs">
                    <p className="font-medium text-slate-700">
                      Pilihan Siswa:{" "}
                      <span className="font-bold text-orange-600">
                        {item.student_answer_text !== null && q?.options
                          ? q.options[Number(item.student_answer_text)] || item.student_answer_text
                          : "-"}
                      </span>
                    </p>
                    <p className="text-slate-500">
                      Kunci Jawaban:{" "}
                      <span className="font-bold text-green-700">
                        {q?.correct_answer !== null && q?.options
                          ? q.options[Number(q.correct_answer)] || q.correct_answer
                          : "-"}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Feedback / Catatan Dosen */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Catatan & Evaluasi Dosen (Feedback untuk Siswa)
                </label>
                <textarea
                  disabled={attempt.status === "graded" ? true : false}
                  rows={2}
                  value={item.teacher_feedback || ""}
                  onChange={(e) => handleFeedbackChange(index, e.target.value)}
                  placeholder="Beri umpan balik mengenai pelafalan, tata bahasa, atau ketepatan jawaban siswa..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-orange-500 transition"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-4 bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-lg flex items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          Total Soal: <span className="font-bold text-slate-800">{answers.length}</span> | Nilai Akhir:{" "}
          <span className="font-bold text-orange-600 text-sm">{calculatedFinalScore()}</span>
        </div>
        <div className="flex gap-2">
          {attempt.status === 'submitted' ? (
            <>
              <button
                type="button"
                onClick={() => router.push("/admin/penilaian")}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveGrading}
                className="px-5 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition shadow-md disabled:bg-slate-300 cursor-pointer"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan & Publikasi Nilai ✓"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/admin/penilaian")}
              className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition shadow-md disabled:bg-slate-300 cursor-pointer"
            >
              Kembali
            </button>
          )}
          
        </div>
      </div>
    </div>
  );
}