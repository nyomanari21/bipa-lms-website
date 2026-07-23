import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/admin/LogoutButton";

export const revalidate = 0;

export default async function AdminPage() {
    return (
        <div className="space-y-6 sm:top-20">
            {/* Header Dashboard */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard Utama</h1>
                    <p className="text-xs text-slate-400 mt-1">Selamat datang kembali di panel manajemen LMS BIPA.</p>
                </div>
                <LogoutButton />
            </div>

            {/* Main Content */}
        </div>
    );
}