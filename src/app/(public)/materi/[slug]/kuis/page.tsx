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

  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Objek menyimpan jawaban user: { indeksSoal: string/number }
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [finalScore, setFinalScore] = useState<number>(0);

  // State Audio Recorder
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Ambil Data Kuis & Soal dari Supabase
  useEffect(() => {
    async function fetchQuizData() {
      setLoading(true);
      try {
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

        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("id")
          .eq("material_id", materialData.id);

        if (quizError || !quizData || quizData.length === 0) {
          console.error("Kuis tidak ditemukan untuk materi ini");
          setLoading(false);
          return;
        }

        const qId = quizData[0].id;
        setActiveQuizId(qId);

        const { data: questionData, error: qError } = await supabase
          .from("questions")
          .select("id, question_text, question_type, options, correct_answer")
          .eq("quiz_id", qId)
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
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/mp4" });
        const localUrl = URL.createObjectURL(blob);
        
        // Simpan objek Blob dan Local URL ke state jawaban
        setUserAnswers((prev) => ({
          ...prev,
          [currentQuestionIndex]: { blob, localUrl },
        }));
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert("Gagal mengakses mikrofon. Pastikan izin mikrofon diizinkan di browser.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // Kalkulasi Skor Otomatis (Khusus Multiple Choice & Short Answer)
  const hitungNilaiOtomatis = () => {
    let correctCount = 0;
    let scorableQuestions = 0;

    questions.forEach((q, index) => {
      if (q.question_type === "multiple_choice") {
        scorableQuestions++;
        if (String(userAnswers[index]) === String(q.correct_answer)) correctCount++;
      } else if (q.question_type === "short_answer") {
        scorableQuestions++;
        const userClean = String(userAnswers[index] || "").trim().toLowerCase();
        const correctClean = String(q.correct_answer || "").trim().toLowerCase();
        if (userClean === correctClean) correctCount++;
      }
    });

    return scorableQuestions > 0 ? Math.round((correctCount / scorableQuestions) * 100) : 100;
  };

  // Submit data kuis ke Supabase database & storage
  const handleSubmitQuiz = async () => {
    if (!activeQuizId) return;
    setIsSubmitting(true);

    try {
      // Ambil session user mahasiswa
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Anda harus login untuk mengirim kuis.");

      const autoScore = hitungNilaiOtomatis();

      // Buat baris baru di tabel student_quiz_attempts
      const { data: attempt, error: attemptError } = await supabase
        .from("student_quiz_attempts")
        .insert({
          quiz_id: activeQuizId,
          student_id: user.id,
          final_score: autoScore,
          status: "submitted",
        })
        .select("id")
        .single();

      if (attemptError) throw attemptError;

      // Loop setiap jawaban untuk disusun ke student_answers
      const answerPayloads = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const rawAnswer = userAnswers[i];

        let answerText: string | null = null;
        let answerAudioUrl: string | null = null;
        let isCorrect: boolean | null = null;
        let itemScore: number | null = null;

        // Jika Tipe Soal Latihan Berbicara/Speaking
        if (q.question_type === "speaking" && rawAnswer?.blob) {
          const fileExt = rawAnswer.blob.type.includes("webm") ? "webm" : "mp4";
          const filePath = `speaking/${user.id}/${attempt.id}_q${q.id}.${fileExt}`;

          // Upload ke Supabase Storage (audio-answers)
          const { error: uploadErr } = await supabase.storage
            .from("audio-answers")
            .upload(filePath, rawAnswer.blob, {
              contentType: rawAnswer.blob.type || "audio/mp4",
              upsert: true,
            });

          if (uploadErr) throw uploadErr;

          // Dapatkan Public URL
          const { data: urlData } = supabase.storage
            .from("audio-answers")
            .getPublicUrl(filePath);

          answerAudioUrl = urlData.publicUrl; // Masuk ke kolom student_answer_audio_url
          answerText = null;
          isCorrect = null;
          itemScore = null; // Menunggu penilaian dosen
        } 
        
        // Jika Tipe Soal Pilihan Ganda
        else if (q.question_type === "multiple_choice") {
          answerText = String(rawAnswer ?? "");
          isCorrect = String(rawAnswer) === String(q.correct_answer);
          itemScore = isCorrect ? 100 : 0;
          answerAudioUrl = null;
        } 
        
        // Jika Tipe Soal Isian Singkat
        else if (q.question_type === "short_answer") {
          answerText = String(rawAnswer ?? "").trim();
          const userClean = answerText.toLowerCase();
          const correctClean = String(q.correct_answer || "").trim().toLowerCase();
          isCorrect = userClean === correctClean;
          itemScore = isCorrect ? 100 : 0;
          answerAudioUrl = null;
        } 
        
        // Jika Tipe Soal Esai
        else {
          answerText = String(rawAnswer ?? "").trim();
          answerAudioUrl = null;
          isCorrect = null;
          itemScore = null; // Menunggu penilaian dosen
        }

        answerPayloads.push({
          attempt_id: attempt.id,
          question_id: q.id,
          student_answer_text: answerText,
          student_answer_audio_url: answerAudioUrl,
          is_correct: isCorrect,
          score: itemScore,
          teacher_feedback: null, // Masih kosong saat dikirim mahasiswa
        });
      }

      // Bulk insert jawaban ke tabel student_answers
      const { error: ansError } = await supabase
        .from("student_answers")
        .insert(answerPayloads);

      if (ansError) throw ansError;

      setFinalScore(autoScore);
      setQuizFinished(true);
    } catch (err: any) {
      alert("Gagal mengirim jawaban kuis: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = userAnswers[currentQuestionIndex] !== undefined ? userAnswers[currentQuestionIndex] : null;

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-500 font-medium">Memuat kuis dari database...</div>;
  if (questions.length === 0) return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-400">Belum ada soal latihan untuk bab ini.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:px-6 md:py-10 bg-slate-50 text-slate-800">
      {quizFinished ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-5xl">🎉</div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Latihan Selesai Diajukan!</h2>
            <p className="text-xs text-slate-400 mt-1">Jawaban Anda berhasil disimpan. Nilai esai & rekaman suara akan diperiksa oleh Dosen.</p>
          </div>
          <div className="inline-block bg-orange-50 border border-orange-100 rounded-2xl px-8 py-4">
            <span className="block text-xs font-semibold text-orange-600 uppercase tracking-wider">Skor Sementara (PG & Isian)</span>
            <span className="text-5xl font-black text-orange-500">{finalScore} / 100</span>
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
              <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Evaluasi BIPA</span>
              <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">Tipe Soal: {currentQuestion.question_type.replace("_", " ").toUpperCase()}</h1>
            </div>
            <span className="text-xs font-semibold bg-slate-200 text-slate-700 px-3 py-1 rounded-full">Soal {currentQuestionIndex + 1} dari {questions.length}</span>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-base md:text-lg font-bold text-slate-900 leading-relaxed">{currentQuestion.question_text}</h3>

            {/* Pilihan Ganda */}
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

            {/* Isian Singkat */}
            {currentQuestion.question_type === "short_answer" && (
              <input
                type="text"
                placeholder="Ketik jawaban singkat Anda di sini..."
                value={selectedAnswer || ""}
                onChange={(e) => setUserAnswers((prev) => ({ ...prev, [currentQuestionIndex]: e.target.value }))}
                className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-orange-500 transition"
              />
            )}

            {/* Esai */}
            {currentQuestion.question_type === "essay" && (
              <textarea
                rows={4}
                placeholder="Tuliskan jawaban penjelasan panjang Anda di sini..."
                value={selectedAnswer || ""}
                onChange={(e) => setUserAnswers((prev) => ({ ...prev, [currentQuestionIndex]: e.target.value }))}
                className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-orange-500 transition"
              />
            )}

            {/* Latihan Berbicara */}
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
                {selectedAnswer?.localUrl && (
                  <div className="w-full pt-2 border-t border-slate-200 flex flex-col items-center gap-2">
                    <span className="text-[10px] text-green-600 font-bold">✓ Rekaman Berhasil Tersimpan Secara Lokal</span>
                    <audio src={selectedAnswer.localUrl} controls className="h-8 max-w-xs" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* NAVIGASI KUIS */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
              disabled={currentQuestionIndex === 0 || isSubmitting}
              className={`px-5 py-3 rounded-xl font-bold text-sm border transition ${
                currentQuestionIndex > 0 ? "bg-white border-slate-200 text-slate-700 cursor-pointer" : "bg-slate-100 text-slate-300 cursor-not-allowed opacity-50"
              }`}
            >
              ← Soal Sebelumnya
            </button>

            {currentQuestionIndex + 1 === questions.length ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={selectedAnswer === null || selectedAnswer === "" || isSubmitting}
                className="px-6 py-3 rounded-xl font-bold text-sm bg-green-600 text-white hover:bg-green-700 transition shadow-md disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
              >
                {isSubmitting ? "Mengirim Jawaban..." : "Selesai & Kirim Kuis ✓"}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                disabled={selectedAnswer === null || selectedAnswer === "" || isSubmitting}
                className="px-6 py-3 rounded-xl font-bold text-sm bg-orange-500 text-white hover:bg-orange-600 transition shadow-md disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
              >
                Soal Berikutnya →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}