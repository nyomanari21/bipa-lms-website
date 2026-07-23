// src/app/(public)/materi/[slug]/kuis/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Question {
  id: string;
  question_text: string;
  question_type: "multiple_choice" | "short_answer" | "essay" | "speaking";
  options: string[] | null;
  correct_answer: string | null;
}

export default function KuisPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Objek menyimpan jawaban user: { indeksSoal: string/number }
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
  const [quizFinished, setQuizFinished] = useState(false);

  // State Audio Recorder untuk Soal Speaking
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Ambil Data Kuis & Soal dari Supabase berdasarkan slug materi
  useEffect(() => {
    async function fetchQuizData() {
      setLoading(true);
      try {
        // Ambil id materi berdasarkan slug
        const { data: materialData, error: matError } = await supabase
          .from("materials")
          .select("id")
          .eq("slug", slug)
          .single();

        if (matError || !materialData) {
          console.error("Material tidak ditemukan:", matError?.message);
          setLoading(false);
          return;
        }

        // Ambil kuis yang terikat dengan materi (Gunakan select biasa tanpa .single untuk menghindari crash PGRST116)
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("id")
          .eq("material_id", materialData.id);

        // Cek apakah kuisnya ada di dalam array
        if (quizError || !quizData || quizData.length === 0) {
          console.error("Kuis tidak ditemukan untuk materi ini");
          setLoading(false);
          return;
        }

        const activeQuizId = quizData[0].id;

        // Ambil semua soalnya
        const { data: questionData, error: qError } = await supabase
          .from("questions")
          .select("id, question_text, question_type, options, correct_answer")
          .eq("quiz_id", activeQuizId)
          .order("question_number", { ascending: true });

        if (qError) {
          console.error("Gagal mengambil soal:", qError.message);
        } else if (questionData) {
          setQuestions(questionData);
        }
      } catch (err) {
        console.error("Terjadi kesalahan ambil data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (slug) fetchQuizData();
  }, [slug]);

  // Fungsi Rekam Suara
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Format audio recording
      let options = { mimeType: "audio/mp4" };

      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        // Bungkus blob sesuai mimeType yang aktif digunakan
        const blob = new Blob(chunks, { type: recorder.mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Simpan ke state jawaban user
        setUserAnswers((prev) => ({ ...prev, [currentQuestionIndex]: url }));
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert("Gagal mengakses mikrofon perangkat Anda. Pastikan izin mikrofon sudah diaktifkan di browser.");
    }
  };

  // Fungsi Menghentikan Rekam Suara
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = userAnswers[currentQuestionIndex] !== undefined ? userAnswers[currentQuestionIndex] : null;

  // Kalkulasi Nilai Hardcode (Hanya mengecek Multiple Choice & Short Answer)
  const hitungNilaiAkhir = () => {
    let correctCount = 0;
    let scorableQuestions = 0;

    questions.forEach((q, index) => {
      if (q.question_type === "multiple_choice") {
        scorableQuestions++;
        if (String(userAnswers[index]) === q.correct_answer) correctCount++;
      } else if (q.question_type === "short_answer") {
        scorableQuestions++;
        const userAnswerClean = String(userAnswers[index] || "").trim().toLowerCase();
        const correctAnswerClean = String(q.correct_answer || "").trim().toLowerCase();
        if (userAnswerClean === correctAnswerClean) correctCount++;
      }
      // Note: Untuk Esai & Speaking nilainya 0 karena harus diperiksa dosen manual via dashboard admin nanti
    });

    return scorableQuestions > 0 ? Math.round((correctCount / scorableQuestions) * 100) : 100;
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-500 font-medium">Memuat kuis dari database...</div>;
  if (questions.length === 0) return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-400">Belum ada soal latihan untuk bab ini.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:px-6 md:py-10 bg-slate-50 text-slate-800">
      {quizFinished ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
          <div className="text-5xl">🎉</div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Latihan Selesai Diajukan!</h2>
            <p className="text-xs text-slate-400 mt-1">Nilai pilihan ganda & isian terhitung otomatis. Soal esai & rekaman suara Anda akan diperiksa oleh Dosen.</p>
          </div>
          <div className="inline-block bg-orange-50 border border-orange-100 rounded-2xl px-8 py-4">
            <span className="block text-xs font-semibold text-orange-600 uppercase tracking-wider">Skor Sementara (PG & Isian)</span>
            <span className="text-5xl font-black text-orange-500">{hitungNilaiAkhir()} / 100</span>
          </div>
          <div className="pt-4 flex justify-center gap-3">
            <button onClick={() => router.push("/materi")} className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition shadow-md cursor-pointer">
              Kembali ke Materi
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Evaluasi BIPA 1</span>
              <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">Tipe Soal: {currentQuestion.question_type.replace("_", " ").toUpperCase()}</h1>
            </div>
            <span className="text-xs font-semibold bg-slate-200 text-slate-700 px-3 py-1 rounded-full">Soal {currentQuestionIndex + 1} dari {questions.length}</span>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-base md:text-lg font-bold text-slate-900 leading-relaxed">{currentQuestion.question_text}</h3>

            {/* RENDER KOMPONEN INPUT DINAMIS BERDASARKAN TIPE SOAL */}
            
            {/* A. PILIHAN GANDA */}
            {currentQuestion.question_type === "multiple_choice" && currentQuestion.options && (
              <div className="grid gap-3">
                {currentQuestion.options.map((option, idx) => {
                  const isCurrentSelected = selectedAnswer !== null && Number(selectedAnswer) === idx;

                  return (
                    <button
                      key={idx}
                      onClick={() => setUserAnswers((prev) => ({ ...prev, [currentQuestionIndex]: idx }))}
                      className={`w-full p-4 rounded-xl text-left text-sm font-medium transition border flex items-center justify-between cursor-pointer ${
                        isCurrentSelected
                          ? "bg-orange-50 border-orange-500 text-orange-900 font-semibold" 
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span>{option}</span>
                      {isCurrentSelected && <span className="text-orange-500">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* B. ISIAN SINGKAT */}
            {currentQuestion.question_type === "short_answer" && (
              <input
                type="text"
                placeholder="Ketik jawaban singkat Anda di sini..."
                value={selectedAnswer || ""}
                onChange={(e) => setUserAnswers((prev) => ({ ...prev, [currentQuestionIndex]: e.target.value }))}
                className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-orange-500 transition"
              />
            )}

            {/* C. ESAI */}
            {currentQuestion.question_type === "essay" && (
              <textarea
                rows={4}
                placeholder="Tuliskan jawaban penjelasan panjang Anda di sini..."
                value={selectedAnswer || ""}
                onChange={(e) => setUserAnswers((prev) => ({ ...prev, [currentQuestionIndex]: e.target.value }))}
                className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-orange-500 transition"
              />
            )}

            {/* D. REKAMAN AUDIO */}
            {currentQuestion.question_type === "speaking" && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center gap-4">
                <p className="text-xs text-slate-400">Klik tombol mikrofon untuk mulai berbicara, klik stop jika sudah selesai.</p>
                <div className="flex gap-3">
                  {!isRecording ? (
                    <button onClick={startRecording} className="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-600 transition flex items-center gap-1 cursor-pointer">
                      🔴 Mulai Rekam Suara
                    </button>
                  ) : (
                    <button onClick={stopRecording} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold animate-pulse flex items-center gap-1 cursor-pointer">
                      ⏹️ Hentikan Rekaman
                    </button>
                  )}
                </div>
                {selectedAnswer && (
                  <div className="w-full pt-2 border-t border-slate-200 flex flex-col items-center gap-2">
                    <span className="text-[10px] text-green-600 font-bold">✓ Rekaman Berhasil Tersimpan Secara Lokal</span>
                    <audio src={selectedAnswer} controls className="h-8 max-w-xs" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* NAVIGASI KUIS */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => {
                setCurrentQuestionIndex((prev) => prev - 1);
                setAudioUrl(null);
              }}
              disabled={currentQuestionIndex === 0}
              className={`px-5 py-3 rounded-xl font-bold text-sm border transition ${
                currentQuestionIndex > 0 ? "bg-white border-slate-200 text-slate-700 cursor-pointer" : "bg-slate-100 text-slate-300 cursor-not-allowed opacity-50"
              }`}
            >
              ← Soal Sebelumnya
            </button>

            <button
              onClick={() => {
                if (currentQuestionIndex + 1 < questions.length) {
                  setCurrentQuestionIndex((prev) => prev + 1);
                  setAudioUrl(null);
                } else {
                  setQuizFinished(true);
                }
              }}
              disabled={selectedAnswer === null || selectedAnswer === ""}
              className={`px-6 py-3 rounded-xl font-bold text-sm shadow-md transition ${
                selectedAnswer !== null && selectedAnswer !== "" ? "bg-orange-500 text-white hover:bg-orange-600 cursor-pointer" : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              }`}
            >
              {currentQuestionIndex + 1 === questions.length ? "Selesai Kuis" : "Soal Berikutnya →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}