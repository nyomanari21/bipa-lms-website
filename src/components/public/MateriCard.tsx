'use client';
import Link from "next/link";

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
    <div key={material.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
      <div className="space-y-3">
        <div className="text-4xl bg-slate-50 w-14 h-14 flex items-center justify-center rounded-xl border border-slate-100">🍲</div>
        <h3 className="font-bold text-lg text-slate-900 leading-snug hover:text-orange-500 transition">
          <a href={`/materi/${material.slug}`}>{material.title}</a>
        </h3>
        <p className="text-slate-500 text-xs">Klik untuk mempelajari kosakata & percakapan materi ini.</p>
      </div>
      <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
        <a href={`/materi/${material.slug}`} className="text-orange-500 font-bold text-xs flex items-center gap-0.5">
          Buka Materi &rarr;
        </a>
      </div>
    </div>
  )
}