import { createSupabaseServerClient } from "@/lib/supabase.server";
import Link from "next/link";
import LogoutButton from "@/components/admin/LogoutButton";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();

  // Fetch count paralel
  const [
    { count: totalStudents },
    { count: totalMaterials },
    { count: pendingReviews },
    { data: recentSubmissions },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("materials").select("*", { count: "exact", head: true }),
    supabase.from("student_quiz_attempts").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("student_quiz_attempts")
      .select("id, status, attempted_at, users:student_id(name), quizzes:quiz_id(title)")
      .eq("status", "submitted")
      .order("attempted_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <div className="space-y-6 sm:top-20">
      {/* Header Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Utama</h1>
          <p className="text-xs text-slate-400 mt-1">Selamat datang kembali di panel manajemen LMS BIPA.</p>
        </div>
        {/* <LogoutButton /> */}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Mahasiswa</span>
          <p className="text-3xl font-black text-slate-800 mt-2">{totalStudents || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Materi Aktif</span>
          <p className="text-3xl font-black text-slate-800 mt-2">{totalMaterials || 0}</p>
        </div>
        <div className="bg-orange-50/60 p-5 rounded-2xl border border-orange-100 shadow-sm">
          <span className="text-xs font-bold text-orange-700 uppercase">Perlu Diperiksa</span>
          <p className="text-3xl font-black text-orange-600 mt-2">{pendingReviews || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase mb-2">Aksi Cepat</span>
          <Link
            href="/admin/materi/create"
            className="text-center py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            + Tambah Materi
          </Link>
        </div>
      </div>

      {/* Antrean Koreksi Terbaru */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-800">Antrean Evaluasi Siswa (Perlu Dinilai)</h2>
          <Link href="/admin/penilaian" className="text-xs font-semibold text-orange-600 hover:underline">
            Lihat Semua →
          </Link>
        </div>

        {recentSubmissions && recentSubmissions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentSubmissions.map((sub: any) => {
              const studentName = Array.isArray(sub.users) ? sub.users[0]?.name : sub.users?.name;
              const quizTitle = Array.isArray(sub.quizzes) ? sub.quizzes[0]?.title : sub.quizzes?.title;

              return (
                <div key={sub.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{studentName || "Siswa"}</p>
                    <p className="text-xs text-slate-400">{quizTitle}</p>
                  </div>
                  <Link
                    href={`/admin/penilaian/${sub.id}`}
                    className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition"
                  >
                    Periksa
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-6">
            🎉 Semua tugas kuis siswa sudah selesai dinilai!
          </p>
        )}
      </div>
    </div>
  );
}