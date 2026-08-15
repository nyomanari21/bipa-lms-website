'use client';

import { useRouter } from "next/navigation";

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
  quizzes: { title: string } | { title: string }[] | null;
}

interface ReviewKuisFormProps {
  attempt: AttemptData;
  initialAnswers: AnswerItem[];
}

export default function ReviewKuisForm({ attempt, initialAnswers }: ReviewKuisFormProps) {
  const router = useRouter();
  const quiz = Array.isArray(attempt.quizzes) ? attempt.quizzes[0] : attempt.quizzes;

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-10 bg-slate-50 text-slate-800">
      {/* Header Info Nilai & Kuis */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="text-xs font-semibold text-slate-500 hover:text-orange-500 mb-2 flex items-center gap-1 transition cursor-pointer"
          >
            ← Kembali ke Detail Materi
          </button>
          <h1 className="text-xl font-bold text-slate-800">{quiz?.title || "Review Evaluasi"}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Dikerjakan pada{" "}
            {new Date(attempt.attempted_at).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-100">
          <div>
            <span className="block text-[10px] font-bold uppercase text-emerald-700 tracking-wider">
              Nilai Akhir
            </span>
            <span className="text-3xl font-black text-emerald-600">
              {attempt.final_score ?? 0} <span className="text-sm font-bold text-slate-400">/ 100</span>
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-200 text-emerald-800">
            Selesai Dinilai
          </span>
        </div>
      </div>

      {/* Lembar Hasil Review Soal per Soal */}
      <div className="space-y-4">
        {initialAnswers.map((item, index) => {
          const q = item.questions;
          const qType = q?.question_type || "multiple_choice";
          const isCorrect = item.is_correct;

          return (
            <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              {/* Header Soal & Badge Status */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nomor {q?.question_number || index + 1} • <span className="text-orange-600">{qType.replace("_", " ")}</span>
                </span>
                
                <div className="flex items-center gap-2">
                  {/* Badge Benar/Salah (Untuk PG/Isian) atau Skor (Untuk Esai/Speaking) */}
                  {isCorrect !== null && (
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      isCorrect 
                        ? "bg-emerald-100 text-emerald-700" 
                        : "bg-rose-100 text-rose-700"
                    }`}>
                      {isCorrect ? "✓ Benar" : "✗ Kurang Tepat"}
                    </span>
                  )}
                  <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                    Skor: {item.score ?? 0}
                  </span>
                </div>
              </div>

              {/* Teks Pertanyaan */}
              <h3 className="text-sm md:text-base font-semibold text-slate-800 leading-relaxed">
                {q?.question_text}
              </h3>

              {/* Area Jawaban Siswa & Kunci */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                {/* 1. Tipe Soal Speaking */}
                {qType === "speaking" && (
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1.5">
                      Rekaman Suara Kamu:
                    </span>
                    {item.student_answer_audio_url ? (
                      <div className="flex flex-col gap-2">
                        <audio src={item.student_answer_audio_url} controls className="w-full h-10" />
                        <a
                          href={item.student_answer_audio_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-600 hover:underline inline-block"
                        >
                          🔗 Unduh / Dengarkan rekaman ulang
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-rose-500 italic">Kamu tidak menyertakan rekaman suara.</p>
                    )}
                  </div>
                )}

                {/* 2. Tipe Soal Esai */}
                {qType === "essay" && (
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                      Jawaban Esai Kamu:
                    </span>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {item.student_answer_text || <span className="text-rose-500 italic">Tidak ada jawaban.</span>}
                    </p>
                  </div>
                )}

                {/* 3. Tipe Soal Isian Singkat */}
                {qType === "short_answer" && (
                  <div className="space-y-1.5 text-xs">
                    <p className="font-medium text-slate-700">
                      Jawaban Kamu:{" "}
                      <span className={`font-bold ${isCorrect ? "text-emerald-600" : "text-rose-600"}`}>
                        {item.student_answer_text || "-"}
                      </span>
                    </p>
                    <p className="text-slate-500">
                      Kunci Jawaban:{" "}
                      <span className="font-bold text-emerald-700">{q?.correct_answer}</span>
                    </p>
                  </div>
                )}

                {/* 4. Tipe Soal Pilihan Ganda */}
                {qType === "multiple_choice" && (
                  <div className="space-y-1.5 text-xs">
                    <p className="font-medium text-slate-700">
                      Pilihan Kamu:{" "}
                      <span className={`font-bold ${isCorrect ? "text-emerald-600" : "text-rose-600"}`}>
                        {item.student_answer_text !== null && q?.options
                          ? q.options[Number(item.student_answer_text)] || item.student_answer_text
                          : "-"}
                      </span>
                    </p>
                    <p className="text-slate-500">
                      Kunci Jawaban yang Benar:{" "}
                      <span className="font-bold text-emerald-700">
                        {q?.correct_answer !== null && q?.options
                          ? q.options[Number(q.correct_answer)] || q.correct_answer
                          : "-"}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Feedback / Umpan Balik dari Dosen */}
              {item.teacher_feedback ? (
                <div className="p-3.5 bg-orange-50/70 border border-orange-100 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-orange-900 uppercase flex items-center gap-1">
                    💬 Catatan Dosen:
                  </span>
                  <p className="text-xs text-orange-950 whitespace-pre-wrap leading-relaxed">
                    {item.teacher_feedback}
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">Tidak ada catatan tambahan dari dosen.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}