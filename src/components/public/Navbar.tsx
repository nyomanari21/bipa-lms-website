'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const navLinks = [
  { href: "/", label: "Beranda" },
  { href: "/materi", label: "Materi Belajar" },
]

interface UserProfile {
  name: string;
  role: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isOpen, setIsOpen] = useState(false); // State mobile menu
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State dropdown profile
  const dropdownRef = useRef<HTMLDivElement>(null);

  // States untuk menampung data user yang login
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Ambil session & data profil user dari tabel public.users
  useEffect(() => {
    async function getSessionAndProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        // Ambil nama lengkap dari tabel public.users berdasarkan ID auth
        const { data: profileData } = await supabase
          .from("users")
          .select("name, role")
          .eq("id", session.user.id)
          .single();
        
        if (profileData) setProfile(profileData);
      } else {
        setUser(null);
        setProfile(null);
      }
    }

    getSessionAndProfile();

    // Dengarkan perubahan auth secara real-time (login/logout dari halaman lain)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: profileData } = await supabase
          .from("users")
          .select("name, role")
          .eq("id", session.user.id)
          .single();
        if (profileData) setProfile(profileData);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Efek untuk menutup menu ketika pindah halaman
  useEffect(() => {
    setIsOpen(false);
    setIsDropdownOpen(false);
  }, [pathname]);

  // Menutup dropdown profile jika user mengklik di luar area dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fungsi Logout / Keluar Akun
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push("/");
    router.refresh();
  };

  // Helper untuk mengambil inisial nama
  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <nav className="min-w-full bg-white/95 backdrop-blur-md border-b border-orange-100/80 sticky top-0 z-50 shadow-xs relative">
      {/* Background Mega Mendung */}
      <div className="absolute right-0 top-0 h-full w-[100%] pointer-events-none opacity-[0.1] select-none md:flex overflow-hidden">
        {[1, 2, 3].map((item) => (
          <div key={item} className="relative h-full flex-1">
            <Image
              src="/images/mega-mendung-outline-3.png"
              alt=""
              fill
              className="object-cover object-center"
              priority
            />
          </div>
        ))}
      </div>

      {/* Desktop & Main Nav Container */}
      <div className="max-w-6xl m-auto px-4 h-16 flex items-center justify-between relative z-10">
        <div className="hidden md:flex items-center justify-between w-full h-full">
          {/* Logo Beraksen Mega Mendung */}
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer hover:scale-103 transition-transform duration-300">
            <div className="relative w-32 h-16 rounded-xl flex items-center justify-center p-1">
              <Image
                src="/images/logo-upi.png"
                alt="Batik Icon"
                width={128}
                height={128}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight bg-linear-to-r from-orange-600 via-amber-600 to-red-600 bg-clip-text text-transparent leading-none">
                BIPA RAGA
              </span>
              <span className="text-[10px] font-bold tracking-wider text-slate-600 uppercase mt-0.5">
                Rasa Gastronomi
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6 font-medium text-sm text-slate-600">
            <ul className="flex items-center gap-1">
              {navLinks.map(({ href, label }) => {
                const isActive = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`relative px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? "text-orange-600 bg-orange-50"
                          : "text-slate-600 hover:text-orange-600 hover:bg-slate-50"
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Profile / Login Button */}
            {user && profile ? (
              /* Dropdown Avatar */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 py-1.5 pl-2 pr-3 rounded-full hover:bg-slate-100 transition focus:outline-none cursor-pointer"
                >
                  <div className="w-7 h-7 bg-linear-to-br from-orange-500 to-amber-600 text-white font-bold text-xs rounded-full flex items-center justify-center shadow-xs">
                    {getInitials(profile.name)}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 max-w-32 truncate">
                    {profile.name}
                  </span>
                  <span className="text-[10px] text-slate-400">▼</span>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/95 border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Peran</p>
                      <p className="text-xs font-bold text-orange-600 capitalize">{profile.role}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h6q.425 0 .713.288T12 4t-.288.713T11 5H5v14h6q.425 0 .713.288T12 20t-.288.713T11 21zm12.175-8H10q-.425 0-.712-.288T9 12t.288-.712T10 11h7.175L15.3 9.125q-.275-.275-.275-.675t.275-.7t.7-.313t.725.288L20.3 11.3q.3.3.3.7t-.3.7l-3.575 3.575q-.3.3-.712.288t-.713-.313q-.275-.3-.262-.712t.287-.688z" />
                      </svg>
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/masuk"
                className="bg-linear-to-r from-orange-500 to-amber-600 text-white px-5 py-2 rounded-xl hover:from-orange-600 hover:to-amber-700 transition shadow-sm font-bold text-xs"
              >
                Masuk Akun
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Header: Logo & Hamburger */}
        <div className="flex md:hidden items-center justify-between w-full">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-20 h-20 relative rounded-lg flex items-center justify-center p-1">
              <Image
                src="/images/logo-upi.png"
                alt="Batik Icon"
                width={128}
                height={128}
                className="object-contain"
              />
            </div>
            <span className="text-base font-extrabold bg-linear-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              BIPA RAGA
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {!user && (
              <Link
                href="/masuk"
                className="bg-orange-500 text-white px-3.5 py-1.5 rounded-lg hover:bg-orange-600 transition shadow-2xs text-xs font-bold"
              >
                Masuk
              </Link>
            )}

            {user && profile && (
              <div className="w-7 h-7 bg-orange-500 text-white font-bold text-xs rounded-full flex items-center justify-center shadow-inner">
                {getInitials(profile.name)}
              </div>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
              className="flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span className={`block w-5 h-0.5 bg-slate-700 rounded transition-all duration-300 ${isOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-5 h-0.5 bg-slate-700 rounded transition-all duration-300 ${isOpen ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-0.5 bg-slate-700 rounded transition-all duration-300 ${isOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Dropdown Content */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out px-4 ${isOpen ? "max-h-80 opacity-100 pb-4" : "max-h-0 opacity-0"}`}>
        <ul className="flex flex-col gap-1 pt-2 border-t border-slate-100">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive ? "text-orange-600 bg-orange-50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
          {user && (
            <li className="border-t border-slate-100 mt-2 pt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors rounded-xl gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h6q.425 0 .713.288T12 4t-.288.713T11 5H5v14h6q.425 0 .713.288T12 20t-.288.713T11 21zm12.175-8H10q-.425 0-.712-.288T9 12t.288-.712T10 11h7.175L15.3 9.125q-.275-.275-.275-.675t.275-.7t.7-.313t.725.288L20.3 11.3q.3.3.3.7t-.3.7l-3.575 3.575q-.3.3-.712.288t-.713-.313q-.275-.3-.262-.712t.287-.688z" />
                </svg>
                Keluar Akun
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}