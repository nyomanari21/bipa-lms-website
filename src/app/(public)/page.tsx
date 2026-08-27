import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-b from-orange-50/40 via-white to-slate-50 text-slate-800 relative overflow-hidden">
      {/* Background Mega Mendung */}
      <div className="absolute top-10 -left-20 w-128 h-128 pointer-events-none opacity-[0.1] select-none rotate-12">
        <Image
          src="/images/mega-mendung-outline-3.png"
          alt=""
          fill
          className="object-contain"
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 space-y-24 relative z-10">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Kolom Kiri: Copywriting & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/70 border border-orange-200 text-orange-800 text-xs font-bold tracking-wide">
              <span>🍃</span>
              <span>Sampurasun! Belajar Bahasa Indonesia Berkonteks Budaya</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
              BIPA <span className="bg-linear-to-r from-orange-500 via-amber-500 to-red-600 bg-clip-text text-transparent">RAGA</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              <strong className="text-slate-800 font-bold">Bahasa Indonesia bagi Penutur Asing Rasa Gastronomi.</strong> Pendekatan interaktif mempelajari tata bahasa dan kosakata melalui kekayaan kuliner khas Kota Bandung.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                href="/materi"
                className="w-full sm:w-auto text-center bg-orange-500 hover:bg-orange-600 text-white px-7 py-3.5 rounded-2xl font-bold text-sm transition shadow-lg shadow-orange-500/25 cursor-pointer"
              >
                Mulai Belajar Sekarang →
              </Link>
              <Link
                href="/masuk"
                className="w-full sm:w-auto text-center bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-7 py-3.5 rounded-2xl font-bold text-sm transition shadow-xs"
              >
                Daftar Akun Baru
              </Link>
            </div>

            {/* Quick Badges */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Audio Native Speaker
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Praktik Berbicara Langsung
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Visual Card Kuliner Sunda */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Bingkai Foto Utama */}
              <div className="relative aspect-4/3 rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                <Image
                  src="/images/mie-kocok.jpeg"
                  alt="Mie Kocok Bandung"
                  fill
                  priority
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-300">
                    Wisata Gastronomi
                  </span>
                  <h3 className="text-lg font-bold">Mie Kocok Bandung</h3>
                  <p className="text-xs text-slate-200 line-clamp-1">Media pembelajaran kontekstual budaya & kosakata.</p>
                </div>
              </div>

              <div className="absolute right-3 bottom-2">
                <p className="text-slate-300 text-xs">commons.wikimedia.org/Thetaran</p>
              </div>

            </div>
          </div>
        </div>

        {/* Section Kurikulum Belajar */}
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Kurikulum Belajar Terstruktur
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Tingkatan BIPA dengan fokus kompetensi bahasa dan tema kontekstual kuliner lokal.
            </p>
          </div>

          <div className="max-w-lg mx-auto pt-2">
            {/* Kartu BIPA */}
            <div className="group bg-white rounded-3xl border-2 border-orange-500/80 shadow-md p-6 relative overflow-hidden flex flex-col justify-between transition hover:-translate-y-1 duration-200">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-orange-500/10 rounded-full blur-xl pointer-events-none"></div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="bg-orange-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    Tersedia
                  </span>
                  <span className="text-2xl">🍜</span>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-orange-600 transition">
                    BIPA 1 (Tingkat Dasar)
                  </h3>
                  <p className="text-xs font-semibold text-orange-600 mt-1">
                    Tema: Wisata Gastronomi Bandung
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Pengenalan kosakata dasar, ekspresi sehari-hari, cara memesan makanan, dan simulasi berbicara interaktif melalui menu kuliner khas Sunda.
                </p>
              </div>

              <div className="pt-6">
                <Link
                  href="/materi"
                  className="block text-center w-full py-2.5 bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white rounded-xl text-xs font-bold transition"
                >
                  Buka Modul BIPA 1 →
                </Link>
              </div>
            </div>

            {/* Kartu BIPA 2 (Segera Hadir) */}
            {/* <div className="bg-slate-50/80 rounded-3xl border border-slate-200 p-6 flex flex-col justify-between opacity-80">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="bg-slate-200 text-slate-600 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    Segera Hadir
                  </span>
                  <span className="text-2xl">🌿</span>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-700">BIPA 2 (Lanjutan)</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Tema: Tradisi & Budaya Priangan</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Mendalami percakapan formal, tata krama bertamu, dan eksplorasi kesenian tradisional Jawa Barat.
                </p>
              </div>
              <div className="pt-6">
                <span className="block text-center w-full py-2.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-semibold">
                  Dalam Pengembangan
                </span>
              </div>
            </div> */}

            {/* Kartu BIPA 3 (Segera Hadir) */}
            {/* <div className="bg-slate-50/80 rounded-3xl border border-slate-200 p-6 flex flex-col justify-between opacity-80 sm:col-span-2 lg:col-span-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="bg-slate-200 text-slate-600 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    Segera Hadir
                  </span>
                  <span className="text-2xl">📜</span>
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-700">BIPA 3 (Mahir)</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Tema: Cerita Rakyat & Narasi Sejarah</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Penguasaan struktur kalimat kompleks melalui penulisan esai naratif dan apresiasi sastra lokal.
                </p>
              </div>
              <div className="pt-6">
                <span className="block text-center w-full py-2.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-semibold">
                  Dalam Pengembangan
                </span>
              </div>
            </div> */}

          </div>
        </div>

        {/* Metode & Fitur Pembelajaran */}
        <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-200/80">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-2xl flex items-center justify-center shrink-0">
              🎥
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-base">1. Pembelajaran Multimedia</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Materi disajikan lewat artikel interaktif, audio pelafalan asli, dan video dokumenter kuliner untuk memperkuat pemahaman konteks.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 text-2xl flex items-center justify-center shrink-0">
              🎙️
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-base">2. Evaluasi Praktik Berbicara</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Siswa merekam suara secara langsung di dalam aplikasi untuk dinilai aspek kelancaran dan artikulasinya oleh dosen pengajar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}