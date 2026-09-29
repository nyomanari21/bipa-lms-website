// src/app/(public)/materi/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Definisi tipe data untuk detail materi
interface MaterialDetail {
  id: string;
  title: string;
  slug: string;
  content_text: string;
  embed_media_urls: string;
  bipa_level_id: number;
}

// Definisi tipe data untuk pengerjaan kuis
interface QuizAttemptDetail {
  id: string;
  final_score: number,
  status: string,
  attempted_at: string;
}

export default function DetailMateriPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [quizId, setQuizId] = useState<{ id: string } | null>(null);
  const [questionsAvailable, setQuestionsAvailable] = useState(false);
  const [attempt, setAttempt] = useState<QuizAttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMaterialDetail() {
      setLoading(true);
      
      // Ambil data satu materi yang cocok dengan slug di URL
      const { data: materialData, error: materialError } = await supabase
        .from("materials")
        .select("id, title, slug, content_text, embed_media_urls, bipa_level_id")
        .eq("slug", slug)
        .single();

      if (materialError) {
        console.error("Gagal mengambil detail materi:", materialError.message);
        setMaterial(null);
      } else if (materialData) {
        setMaterial(materialData);
      }

      // Ambil data kuis yang terkait dengan materi
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("id")
        .eq("material_id", materialData?.id)
        .single();
        
      if (quizError) {
        console.error("Gagal mengambil data kuis:", quizError.message);
      }

      if (quizData) {
        setQuizId(quizData.id);

        // Cek apakah kuis memiliki pertanyaan
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("id")
          .eq("quiz_id", quizData.id);

        if (questionsError) {
          console.error("Gagal mengambil data pertanyaan:", questionsError.message);
        }

        if (questionsData && questionsData.length > 0) {
          setQuestionsAvailable(true);

          // Jika ada pertanyaan dari kuis yang terkait, cek apakah siswa sudah pernah mengerjakan kuis
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: userQuizAttempt, error: attemptError } = await supabase
              .from("student_quiz_attempts")
              .select("id, final_score, status, attempted_at")
              .match({
                student_id: session.user.id,
                quiz_id: quizData?.id
              })
              .maybeSingle();
  
            if (userQuizAttempt) {
              setAttempt(userQuizAttempt);
            }
          }
        }

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

      {/* Section Evaluasi / Kuis Materi */}
      {quizId && questionsAvailable && (
        <>
          {attempt ? (
            /* Jika Sudah Mengerjakan */
            <div className="bg-white border border-emerald-100 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Sisi Kiri: Status & Info Waktu */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-emerald-700 font-bold text-base">
                    ✓ Kuis Telah Selesai
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md tracking-wider ${
                      attempt.status === "graded"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {attempt.status === "graded" ? "Selesai Dinilai" : "Menunggu Review"}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Dikerjakan pada{" "}
                  {new Date(attempt.attempted_at).toLocaleString("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>

              {/* Sisi Kanan: Nilai & Tombol Review */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                {attempt.status === "graded" && (
                  <>
                    <div className="text-left sm:text-right pr-2">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">
                        Nilai Akhir
                      </span>
                      <span className="text-xl font-black text-emerald-600">
                        {attempt.final_score ?? 0} <span className="text-xs font-semibold text-slate-400">/ 100</span>
                      </span>
                    </div>
                    <button
                      onClick={() => router.push(`/materi/${material.slug}/${attempt.id}`)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      Lihat Review →
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Jika Belum Mengerjakan */
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-orange-900 text-base">
                  Sudah Paham dengan Materi Ini?
                </h4>
                <p className="text-xs text-orange-600 mt-0.5">
                  Uji kemampuan Bahasa Indonesia-mu lewat kuis di akhir bab.
                </p>
              </div>
              <button
                onClick={() => router.push(`/materi/${material.slug}/kuis`)}
                className="bg-orange-500 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-orange-600 transition shadow-md shadow-orange-500/10 whitespace-nowrap cursor-pointer"
              >
                Mulai Kuis &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}