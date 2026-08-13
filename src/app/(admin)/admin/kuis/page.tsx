import { supabase } from "@/lib/supabase";
import KuisTable from "@/components/admin/KuisTable";

export const revalidate = 0;

export default async function DashboardPage() {
    const { data: questions, error: errQuestions } = await supabase
      .from('questions')
      .select(`
        *,
        quizzes(id,title)
      `)
      .order('created_at', { ascending: false })

    if (errQuestions) {
      return <div className="p-10">Gagal ambil data soal: {errQuestions.message}</div>
    }

    const { data: quizzes, error: errQuizzes } = await supabase
      .from('quizzes')
      .select('*')
    
    if (errQuizzes) {
      return <div className="p-10">Gagal ambil data kuis: {errQuizzes.message}</div>
    }

    return (
      <div className="space-y-6 sm:top-20">
        {/* Header Catalog */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Daftar Soal & Kuis</h1>
            <p className="text-xs text-slate-400 mt-1">Selamat datang kembali di panel manajemen LMS BIPA.</p>
          </div>
        </div>

        {/* Table */}
        <KuisTable quizzes={quizzes} initialQuestions={questions || []} />
      </div>
    );
}