"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase"; // Sesuaikan path import supabase client kamu

// Logika Form login
function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Cek reason dari query param (idle timeout)
  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason === "idle_timeout") {
      setMessage({
        type: "error",
        text: "Sesi Anda telah berakhir karena tidak ada aktivitas. Silakan masuk kembali.",
      });
    }
  }, [searchParams]);

  // Handler Submit Login / Register
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isRegister) {
        // Daftar Akun
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: "student", // Default role sebagai mahasiswa
            },
          },
        });

        if (error) throw error;
        setMessage({ type: "success", text: "Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi." });
      } else {
        // Masuk Akun
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        // Cek role user yang login dan arahkan ke halaman sesuai role
        const { data: { user } } = await supabase.auth.getUser()
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user?.id)
          .single()
        
        if (profile?.role === "student") {
          router.refresh();
          router.push("/");
        }
        else if (profile?.role === "admin") {
          router.refresh();
          router.push("/admin");
        }
        router.refresh();
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan, silakan coba lagi." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white p-7 sm:p-9 rounded-3xl border border-slate-200/80 shadow-xl shadow-orange-500/5 relative z-10 space-y-6">
      {/* Watermark Mega Mendung di Sudut Kartu */}
      <div className="absolute right-4 top-6 w-64 h-64 opacity-[0.08] -rotate-12 pointer-events-none select-none overflow-hidden">
        <Image
          src="/images/mega-mendung-outline-3.png"
          alt=""
          fill
          className="object-contain"
        />
      </div>
      
      {/* Header Form */}
      <div className="flex items-center justify-between">
        <button
          className="p-2 rounded-xl bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-600 transition cursor-pointer text-xs font-bold flex items-center gap-1.5"
          onClick={() => router.push("/")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span>Beranda</span>
        </button>

        <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200/60 px-2.5 py-1 rounded-full">
          <div className="w-16 h-4 relative">
            <Image
              src="/images/logo-upi.png"
              alt="Batik Icon"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-[10px] font-black tracking-wider text-orange-600 uppercase">
            BIPA RAGA
          </span>
        </div>
      </div>

      <div className="text-center space-y-1.5 pt-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {isRegister ? "Buat Akun Baru" : "Wilujeng Sumping!"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
          {isRegister
            ? "Daftar untuk mulai belajar bahasa & gastronomi Sunda"
            : "Masuk untuk melanjutkan pembelajaran dan latihan evaluasi Anda"}
        </p>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          <span>{message.type === "success" ? "✓" : "⚠️"}</span>
          <span>{message.text}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {isRegister && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Nyoman Ari"
              className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 text-sm font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/10 transition"
            />
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Alamat Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 text-sm font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/10 transition"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Kata Sandi
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kata sandi"
            className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 text-sm font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/10 transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-md transition-all cursor-pointer mt-2 ${
            loading
              ? "bg-slate-300 cursor-not-allowed shadow-none"
              : "bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/20 active:scale-[0.99]"
          }`}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Memproses...
            </span>
          ) : isRegister ? (
            "Daftar Akun BIPA Sekarang →"
          ) : (
            "Masuk ke Aplikasi →"
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setMessage(null);
          }}
          className="text-xs font-bold text-orange-600 hover:text-orange-700 transition cursor-pointer"
        >
          {isRegister
            ? "Sudah punya akun? Masuk di sini"
            : "Belum punya akun? Daftar gratis di sini"}
        </button>
      </div>
    </div>
  );
}

export default function MasukPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-orange-50/40 via-white to-slate-50 px-4 py-12 relative overflow-hidden text-slate-800">
      {/* Background Watermark Mega Mendung */}
      <div className="absolute -top-12 -right-12 w-80 h-80 opacity-[0.05] pointer-events-none select-none">
        <Image
          src="/images/mega-mendung-outline.png"
          alt=""
          fill
          className="object-contain"
        />
      </div>
      <div className="absolute -bottom-16 -left-16 w-96 h-96 opacity-[0.04] pointer-events-none select-none rotate-180">
        <Image
          src="/images/mega-mendung-outline.png"
          alt=""
          fill
          className="object-contain"
        />
      </div>

      {/* Suspense Boundary */}
      <Suspense
        fallback={
          <div className="max-w-md w-full bg-white p-12 rounded-3xl border border-slate-200/80 shadow-sm text-center text-slate-400 text-xs font-bold animate-pulse">
            Memuat formulir...
          </div>
        }
      >
        <AuthForm />
      </Suspense>
    </div>
  );
}