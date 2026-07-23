'use client';

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LogoutButton() {
    const router = useRouter();
    
    // Logout Function
    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/masuk");
    };

    return (
        <button 
            onClick={handleLogout}
            className="w-fit bg-red-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-red-600 transition-colors cursor-pointer shadow-sm"
        >
            Keluar
        </button>
    )
}