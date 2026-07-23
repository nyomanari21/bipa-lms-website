// src/app/(public)/materi/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import MateriCard from "@/components/public/MateriCard";

const bipaLevels = [
  { id: 1, name: "BIPA 1", theme: "Gastronomi Bandung", active: true },
  // { id: 2, name: "BIPA 2", theme: "🔒 Terkunci", active: false },
  // { id: 3, name: "BIPA 3", theme: "🔒 Terkunci", active: false },
  // { id: 4, name: "BIPA 4", theme: "🔒 Terkunci", active: false },
];

// Definisikan tipe data sesuai kolom database
interface Material {
  id: string;
  title: string;
  slug: string;
  bipa_level_id: number;
}

export default function MateriPage() {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  // Ambil data dari Supabase
  useEffect(() => {
    async function fetchMaterials() {
      setLoading(true);
      const { data, error } = await supabase
        .from("materials")
        .select("id, title, slug, bipa_level_id")
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Gagal mengambil data materi:", error.message);
      } else if (data) {
        setMaterials(data);
      }
      setLoading(false);
    }

    fetchMaterials();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-10 bg-slate-50 text-slate-800">
      <div className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Materi Pembelajaran</h1>
        <p className="text-sm text-slate-500 mt-1">Jelajahi modul belajar untuk tingkat BIPA 1.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {bipaLevels.map((level) => (
          <button
            key={level.id}
            onClick={() => level.active && setSelectedLevel(level.id)}
            disabled={!level.active}
            className={`px-5 py-3 rounded-xl font-bold text-sm transition flex flex-col items-start ${
              selectedLevel === level.id ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "bg-white border border-slate-200 text-slate-700"
            } ${!level.active && "bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed"}`}
          >
            <span>{level.name}</span>
            <span className="text-[10px] font-medium mt-0.5">{level.theme}</span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">Memuat materi dari database...</div>
      ) : selectedLevel === 1 ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {materials.map((materi) => (
              <MateriCard key={materi.id} material={materi} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">🔒 Materi Belum Tersedia</div>
      )}
    </div>
  );
}