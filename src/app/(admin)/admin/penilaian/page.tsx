// src/app/(admin)/admin/penilaian/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase.server";
import PenilaianTable from "@/components/admin/PenilaianTable";

export const revalidate = 0;

export default async function AdminPenilaianPage() {
  const supabase = await createSupabaseServerClient();

  // Ambil data attempt kuis siswa beserta relasi ke tabel users dan quizzes
  const { data: attempts, error } = await supabase
    .from('student_quiz_attempts')
    .select(`
      id,
      final_score,
      status,
      attempted_at,
      users:student_id ( name, email ),
      quizzes:quiz_id ( title )
    `)
    .order('attempted_at', { ascending: false });

    console.log("data attempts:", attempts);

  if (error) {
    return <div className="p-10 text-red-500 font-semibold">Gagal ambil data penilaian: {error.message}</div>;
  }

  return (
    <div className="space-y-6 sm:top-20">
      {/* Header Penilaian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Penilaian Siswa</h1>
          <p className="text-xs text-slate-400 mt-1">Kelola dan berikan nilai untuk jawaban esai serta rekaman suara siswa.</p>
        </div>
      </div>

      {/* Table Component */}
      <PenilaianTable initialAttempts={attempts || []} />
    </div>
  );
}