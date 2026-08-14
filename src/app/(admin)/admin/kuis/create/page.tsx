import { createSupabaseServerClient } from "@/lib/supabase.server";
import KuisForm from "@/components/admin/KuisForm";

export default async function CreateKuisPage() {
  const supabase = await createSupabaseServerClient();
  
  const { data: quizzData, error } = await supabase
    .from('quizzes')
    .select(`id, title`)

  if (error) {
    return <div className="p-10">Gagal ambil data: {error.message}</div>
  }

  return (
    <div className="space-y-6 sm:top-20">
      {/* Header Catalog */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tambah Data Soal & Kuis</h1>
          <p className="text-xs text-slate-400 mt-1">Halaman untuk tambah data soal dan kuis</p>
        </div>
      </div>

      {/* Create Form */}
      <KuisForm quizzes={quizzData} />
    </div>
  );
}