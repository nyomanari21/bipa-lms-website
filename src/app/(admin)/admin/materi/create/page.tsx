import { supabase } from "@/lib/supabase";
import MateriForm from "@/components/admin/MateriForm";

export default async function DashboardPage() {
    return (
        <div className="space-y-6 sm:top-20">
            {/* Header Catalog */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Tambah Data Materi</h1>
                    <p className="text-xs text-slate-400 mt-1">Halaman untuk tambah data materi</p>
                </div>
            </div>

            {/* Create Form */}
            <MateriForm />
        </div>
    );
}