import { createSupabaseServerClient } from "@/lib/supabase.server";
import KuisForm from "@/components/admin/KuisForm";
import { notFound } from "next/navigation";

export default async function UpdateKuisPage({
  params
}: {
  params: Promise<{ id: String }>
}) {
  const supabase = await createSupabaseServerClient();
  
  const { id } = await params;

  const { data: quizzData, error: errQuiz } = await supabase
    .from('quizzes')
    .select(`id, title`)

  if (errQuiz) {
    return <div className="p-10">Gagal ambil data kuis: {errQuiz.message}</div>
  }

  const { data: questionData, error: errQuestion } = await supabase
    .from('questions')
    .select(`
      id,
      quiz_id,
      question_text,
      question_type,
      options,
      correct_answer,
      question_number
    `)
    .eq('id', id)
    .maybeSingle()

  if (errQuestion) {
    return <div className="p-10">Gagal ambil data pertanyaan: {errQuestion.message}</div>
  }

  if (!questionData) {
    return notFound();
  }

  return (
    <div className="space-y-6 sm:top-20">
      {/* Header Catalog */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Data Soal & Kuis</h1>
          <p className="text-xs text-slate-400 mt-1">Halaman untuk edit data soal dan kuis</p>
        </div>
      </div>

      {/* Create Form */}
      <KuisForm quizzes={quizzData} initialData={questionData} />
    </div>
  );
}