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

  // Objek menyimpan status penilaian dan tipe soal pada kuis (dengan PG & isian singkat atau tidak)
  const [finalStatus, setFinalStatus] = useState<string | null>(null);
  const [withMCOrShortAnswer, setWithMCOrShortAnswer] = useState(false);

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

    const score = scorableQuestions > 0 ? Math.round((correctCount / scorableQuestions) * 100) : 100;

    return {
      score,
      scorableQuestions,
    }
  };

  // Submit data kuis ke Supabase database & storage
  const handleSubmitQuiz = async () => {
    if (!activeQuizId) return;
    setIsSubmitting(true);

    try {
      // Ambil session user mahasiswa
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Anda harus login untuk mengirim kuis.");

      // const autoScore = hitungNilaiOtomatis();
      const { score: autoScore, scorableQuestions } = hitungNilaiOtomatis();
      const totalQuestion = questions.length;

      // Jika semua soalnya bertipe PG/isian singkat, set statusnya menjadi "graded"
      // Jika ada soal bertipe esai/latihan berbicara, set statusnya menjadi "submitted"
      const finalStatus = scorableQuestions === totalQuestion ? "graded" : "submitted";

      // Buat baris baru di tabel student_quiz_attempts
      const { data: attempt, error: attemptError } = await supabase
        .from("student_quiz_attempts")
        .insert({
          quiz_id: activeQuizId,
          student_id: user.id,
          final_score: autoScore,
          status: finalStatus,
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
      setFinalStatus(finalStatus);
      setWithMCOrShortAnswer(scorableQuestions > 0);
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
    <div className="min-h-screen bg-slate-50/60 text-slate-800 pb-16">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {quizFinished ? (
          /* Halaman Kuis Selesai */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 md:p-10 text-center max-w-lg mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl shadow-2xs border bg-slate-50 border-slate-100">
              {finalStatus === "graded" ? "🏆" : "📝"}
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {finalStatus === "graded" ? "Latihan Selesai Dikerjakan!" : "Latihan Berhasil Dikirim!"}
              </h2>
              <p className="text-xs md:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                {finalStatus === "graded"
                  ? "Jawaban kamu telah tersimpan dan terhitung secara otomatis."
                  : "Jawaban tersimpan. Bagian esai dan rekaman suara akan ditinjau oleh Dosen terlebih dahulu."}
              </p>
            </div>

            {finalStatus === "graded" || withMCOrShortAnswer ? (
              <div
                className={`rounded-2xl p-5 border transition-all ${
                  finalStatus === "graded"
                    ? "bg-emerald-50/60 border-emerald-100"
                    : "bg-orange-50/60 border-orange-100"
                }`}
              >
                <span
                  className={`block text-[11px] font-bold uppercase tracking-wider ${
                    finalStatus === "graded" ? "text-emerald-700" : "text-orange-700"
                  }`}
                >
                  {finalStatus === "graded" ? "Nilai Akhir" : "Skor Sementara (PG & Isian)"}
                </span>
                <div className="mt-1 flex items-baseline justify-center gap-1">
                  <span
                    className={`text-5xl font-black tracking-tight ${
                      finalStatus === "graded" ? "text-emerald-600" : "text-orange-600"
                    }`}
                  >
                    {finalScore}
                  </span>
                  <span className="text-sm font-bold text-slate-400">/ 100</span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-4 bg-slate-50 border border-slate-100 text-xs text-slate-600 font-medium">
                ⏳ Status: <span className="text-orange-600 font-bold">Menunggu Evaluasi Dosen</span>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => router.push("/materi")}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-xs transition cursor-pointer ${
                  finalStatus === "graded"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                Kembali ke Daftar Materi
              </button>
            </div>
          </div>
        ) : (
          /* Halaman Pengerjaan Kuis */
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header Progress & Tipe Soal */}
            <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200/60">
                    {currentQuestion.question_type.replace("_", " ")}
                  </span>
                  <h1 className="text-lg md:text-xl font-extrabold text-slate-900 mt-2">
                    Lembar Evaluasi Mandiri
                  </h1>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-slate-700">
                    Soal {currentQuestionIndex + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {" "}/ {questions.length}
                  </span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Kartu Pertanyaan & Area Menjawab */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Pertanyaan
                </span>
                <h2 className="text-base md:text-lg font-bold text-slate-900 leading-relaxed">
                  {currentQuestion.question_text}
                </h2>
              </div>

              {/* Tipe Pilihan Ganda */}
              {currentQuestion.question_type === "multiple_choice" && currentQuestion.options && (
                <div className="grid gap-3 pt-2">
                  {currentQuestion.options.map((option, idx) => {
                    const isCurrentSelected =
                      selectedAnswer !== null && Number(selectedAnswer) === idx;

                    return (
                      <button
                        key={idx}
                        onClick={() =>
                          setUserAnswers((prev) => ({ ...prev, [currentQuestionIndex]: idx }))
                        }
                        className={`w-full p-4 rounded-2xl text-left text-sm font-semibold transition-all border flex items-center justify-between cursor-pointer ${
                          isCurrentSelected
                            ? "bg-orange-50/70 border-orange-500 text-orange-950 shadow-2xs ring-1 ring-orange-500"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-xl text-xs font-bold flex items-center justify-center border transition-colors ${
                              isCurrentSelected
                                ? "bg-orange-500 text-white border-orange-500"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{option}</span>
                        </div>

                        {isCurrentSelected && (
                          <span className="text-orange-600 font-extrabold text-sm">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tipe Isian Singkat */}
              {currentQuestion.question_type === "short_answer" && (
                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="Ketik jawaban singkat Anda di sini..."
                    value={selectedAnswer || ""}
                    onChange={(e) =>
                      setUserAnswers((prev) => ({
                        ...prev,
                        [currentQuestionIndex]: e.target.value,
                      }))
                    }
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/10 transition"
                  />
                </div>
              )}

              {/* Tipe Esai */}
              {currentQuestion.question_type === "essay" && (
                <div className="pt-2">
                  <textarea
                    rows={5}
                    placeholder="Tuliskan jawaban penjelasan panjang Anda di sini..."
                    value={selectedAnswer || ""}
                    onChange={(e) =>
                      setUserAnswers((prev) => ({
                        ...prev,
                        [currentQuestionIndex]: e.target.value,
                      }))
                    }
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/10 transition"
                  />
                </div>
              )}

              {/* Tipe Latihan Berbicara (Speaking) */}
              {currentQuestion.question_type === "speaking" && (
                <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-200/80 flex flex-col items-center gap-4 text-center">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">Praktik Pelafalan Bahasa</p>
                    <p className="text-xs text-slate-400">
                      Klik tombol untuk merekam pelafalan kata/kalimat sesuai instruksi soal.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                        Mulai Rekam Suara
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold animate-pulse flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <span>⏹️</span> Hentikan Rekaman
                      </button>
                    )}
                  </div>

                  {selectedAnswer?.localUrl && (
                    <div className="w-full pt-4 border-t border-slate-200 flex flex-col items-center gap-2">
                      <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        ✓ Rekaman Berhasil Disimpan
                      </span>
                      <audio src={selectedAnswer.localUrl} controls className="h-9 w-full max-w-sm mt-1" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Bar Navigasi Kuis */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                disabled={currentQuestionIndex === 0 || isSubmitting}
                className={`px-5 py-3 rounded-2xl font-bold text-xs border transition ${
                  currentQuestionIndex > 0
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                    : "bg-slate-100 border-transparent text-slate-300 cursor-not-allowed"
                }`}
              >
                ← Soal Sebelumnya
              </button>

              {currentQuestionIndex + 1 === questions.length ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={
                    selectedAnswer === null ||
                    selectedAnswer === "" ||
                    isSubmitting
                  }
                  className="px-6 py-3 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-md disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none cursor-pointer"
                >
                  {isSubmitting ? "Mengirim..." : "Selesai & Kirim Kuis ✓"}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  disabled={
                    selectedAnswer === null ||
                    selectedAnswer === "" ||
                    isSubmitting
                  }
                  className="px-6 py-3 rounded-2xl font-bold text-xs bg-orange-500 hover:bg-orange-600 text-white transition shadow-md shadow-orange-500/15 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none cursor-pointer"
                >
                  Soal Berikutnya →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}