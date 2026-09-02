'use client';
import Link from "next/link";
import Image from "next/image";

// Definisikan tipe data sesuai kolom database
interface MaterialProps {
  id: string;
  title: string;
  slug: string;
  bipa_level_id: number;
}

interface MaterialCardProps {
  material: MaterialProps;
}

export default function MateriCard({ material }: MaterialCardProps) {
  return (
    <Link
      href={`/materi/${material.slug}`}
      className="group relative bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-orange-400/80 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 overflow-hidden cursor-pointer"
    >
      {/* Watermark Mega Mendung di Sudut Kartu */}
      <div className="absolute -right-6 -bottom-6 w-64 h-64 opacity-[0.05] group-hover:opacity-[0.15] transition-opacity duration-300 pointer-events-none select-none">
        <Image
          src="/images/mega-mendung-outline-3.png"
          alt=""
          fill
          className="object-contain"
        />
      </div>

      <div className="space-y-4 relative z-10">
        {/* Top Header Kartu: Ikon & Tag Badge */}
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-2xl shadow-2xs group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
            🍲
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50/80 px-2.5 py-1 rounded-full border border-orange-200/60">
            BIPA {material.bipa_level_id || 1}
          </span>
        </div>

        {/* Judul & Deskripsi */}
        <div className="space-y-1.5">
          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 group-hover:text-orange-600 transition-colors leading-snug line-clamp-2">
            {material.title}
          </h3>
        </div>
      </div>

      {/* Footer Kartu: Tombol Aksi */}
      <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between relative z-10">
        <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-500 transition-colors">
          Bahan Ajar & Latihan
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 group-hover:translate-x-1 transition-transform">
          Buka Materi <span>&rarr;</span>
        </span>
      </div>
    </Link>
  );
}