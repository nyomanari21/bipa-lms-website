"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Masuk() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false); // Switch login/register
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

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
        
        // Jika sukses login, arahkan ke halaman utama materi
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan, silakan coba lagi." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative">
        <button
          className="cursor-pointer"
          onClick={() => router.back()}
        >
          <div className="flex items-center gap-2 text-gray-500 text-sm hover:text-orange-400 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="16" viewBox="0 0 12 24">
              <path d="M0 0h12v24H0z" fill="none" />
              <path fill="currentColor" fill-rule="evenodd" d="m3.343 12l7.071 7.071L9 20.485l-7.778-7.778a1 1 0 0 1 0-1.414L9 3.515l1.414 1.414z" />
            </svg>
            Kembali
          </div>
        </button>

        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isRegister ? "Buat Akun Baru" : "Selamat Datang Kembali"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isRegister
              ? "Daftar untuk mulai belajar bahasa & budaya Indonesia"
              : "Masuk untuk melanjutkan pembelajaran BIPA Anda"}
          </p>
        </div>

        {/* Notifikasi Message */}
        {message && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold border ${
              message.type === "success"
                ? "bg-green-50 border-green-100 text-green-700"
                : "bg-red-50 border-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masukkan nama lengkap Anda"
                className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-orange-500 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-md transition mt-2 ${
              loading
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/10 cursor-pointer"
            }`}
          >
            {loading ? "Memproses..." : isRegister ? "Daftar Akun" : "Masuk Aplikasi"}
          </button>
        </form>

        {/* Toggle Login / Register */}
        <div className="text-center pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setMessage(null);
            }}
            className="text-xs font-bold text-orange-500 hover:text-orange-600 transition cursor-pointer"
          >
            {isRegister
              ? "Sudah punya akun? Masuk di sini"
              : "Belum punya akun? Daftar gratis di sini"}
          </button>
        </div>
      </div>
    </div>
  );
}