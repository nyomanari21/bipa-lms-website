import { supabase } from "@/lib/supabase";
import MateriTable from "@/components/admin/MateriTable";

export const revalidate = 0;

export default async function DashboardPage() {
    const { data: materials, error } = await supabase
        .from('materials')
        .select('*')
        .order('order_index', { ascending: false })

    if (error) {
        return <div className="p-10">Gagal ambil data: {error.message}</div>
    }

    return (
        <div className="space-y-6 sm:top-20">
            {/* Header Catalog */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Daftar Materi</h1>
                    <p className="text-xs text-slate-400 mt-1">Selamat datang kembali di panel manajemen LMS BIPA.</p>
                </div>
            </div>

            {/* Table */}
            <MateriTable initialMateri={materials || []} />
        </div>
    );
}