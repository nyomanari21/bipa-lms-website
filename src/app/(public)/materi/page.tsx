"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import MateriCard from "@/components/public/MateriCard";

interface BipaLevel {
  id: number;
  level_name: string;
  theme: string;
}

interface Material {
  id: string;
  title: string;
  slug: string;
  bipa_level_id: number;
}

export default function MateriPage() {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [bipaLevels, setBipaLevels] = useState<BipaLevel[]>([]);
  const [loadingLevels, setLoadingLevels] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Ambil data level BIPA dari Supabase
  useEffect(() => {
    async function fetchBipaLevels() {
      setLoadingLevels(true);
      const { data: bipaData, error: bipaError } = await supabase
        .from("bipa_levels")
        .select("id, level_name, theme")
        .order("id", { ascending: true });

      if (bipaError) {
        console.error("Gagal mengambil data level BIPA:", bipaError.message);
      } else if (bipaData && bipaData.length > 0) {
        setBipaLevels(bipaData);
        // Set default level BIPA ke data pertama jika belum ada yang dipilih
        setSelectedLevel(bipaData[0].id);
      }
      setLoadingLevels(false);
    }

    fetchBipaLevels();
  }, []);

  // Ambil data materi dari Supabase
  useEffect(() => {
    async function fetchMaterials() {
      if (!selectedLevel) return;

      setLoadingMaterials(true);
      const { data: materialData, error: materialError } = await supabase
        .from("materials")
        .select("id, title, slug, bipa_level_id")
        .eq("bipa_level_id", selectedLevel)
        .order("order_index", { ascending: true });

      if (materialError) {
        console.error("Gagal mengambil data materi:", materialError.message);
      } else if (materialData) {
        setMaterials(materialData);
      }
      setLoadingMaterials(false);
    }

    fetchMaterials();
  }, [selectedLevel]);

  const currentLevelInfo = bipaLevels.find((lvl) => lvl.id === selectedLevel);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 relative pb-16">
      {/* Header Banner Sinematik Parahyangan */}
      <div className="relative bg-slate-900 text-white overflow-hidden shadow-md">
        {/* Foto Background Hero */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/west-java-nature-1.jpg"
            alt="Alam Parahyangan Jawa Barat"
            fill
            priority
            className="object-cover object-center scale-105"
          />
          {/* Multi-layer Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-r from-slate-950/90 via-slate-950/70 to-orange-950/50 backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent" />
        </div>

        {/* Konten Teks Banner */}
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-16 md:pt-16 md:pb-20 relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-orange-300 border border-orange-400/30">
            <span>🍃</span>
            <span>Katalog Pembelajaran BIPA RAGA</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Materi Pembelajaran
          </h1>

          <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed">
            Jelajahi modul bahasa Indonesia terstruktur berbasis konteks kekayaan gastronomi Kota Bandung.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-20 space-y-8">
        {/* Tab Pemilihan Level BIPA */}
        {loadingLevels ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse p-4 space-y-2">
                <div className="w-1/3 h-4 bg-slate-200 rounded-md"></div>
                <div className="w-2/3 h-3 bg-slate-100 rounded-md"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {bipaLevels.map((lvl) => {
              const isSelected = selectedLevel === lvl.id;

              return (
                <button
                  key={lvl.id}
                  onClick={() => setSelectedLevel(lvl.id)}
                  className={`p-4 rounded-2xl text-left transition-all border flex flex-col justify-between gap-2 cursor-pointer hover:-translate-y-1.5 duration-300 ${
                    isSelected
                      ? "bg-white border-orange-500 shadow-md ring-2 ring-orange-500/20"
                      : "bg-white/90 border-slate-200 hover:border-orange-300 hover:bg-white shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-extrabold uppercase tracking-wider ${
                      isSelected ? "text-orange-600" : "text-slate-500"
                    }`}>
                      {lvl.level_name}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isSelected ? "bg-orange-500 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}>
                      {isSelected ? "Aktif" : "Tersedia"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{lvl.level_name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{lvl.theme}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Ringkasan Info Level Terpilih */}
        {currentLevelInfo && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-slate-800">
                  Tema: {currentLevelInfo.theme}
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-md">
                  {currentLevelInfo.level_name}
                </span>
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">Total Modul</span>
              <span className="text-base font-black text-orange-600">
                {loadingMaterials ? "..." : `${materials.length} Bab Materi`}
              </span>
            </div>
          </div>
        )}

        {/* Grid Materi Card / Skeleton Loading */}
        {loadingMaterials ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 animate-pulse">
                <div className="w-12 h-6 bg-slate-200 rounded-lg"></div>
                <div className="w-3/4 h-5 bg-slate-200 rounded-lg"></div>
                <div className="w-full h-16 bg-slate-100 rounded-xl"></div>
                <div className="w-full h-10 bg-slate-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : materials.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {materials.map((materi) => (
              <MateriCard key={materi.id} material={materi} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-2">
            <span className="text-4xl">🍃</span>
            <h3 className="text-base font-bold text-slate-800">Belum Ada Materi</h3>
            <p className="text-xs text-slate-400">Materi untuk jenjang ini sedang disiapkan oleh dosen pengajar.</p>
          </div>
        )}
      </div>
    </div>
  );
}