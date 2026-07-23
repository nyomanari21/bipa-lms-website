export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 text-slate-800">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Kuasai Bahasa Indonesia Melalui <span className="text-orange-500">BIPA Digital Platform</span>
        </h1>
        <p className="text-lg text-slate-600">
          Media pembelajaran interaktif Bahasa Indonesia bagi Penutur Asing (BIPA) yang dirancang secara komprehensif berbasis kebudayaan dan kearifan lokal.
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <a href="/materi" className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition shadow-md shadow-orange-500/20">
            Mulai Belajar Sekarang
          </a>
          <a href="/masuk" className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 transition">
            Daftar Akun Baru
          </a>
        </div>
      </div>

      {/* Rencana Jenjang Level Belajar BIPA 1-7 */}
      <div className="mt-24 space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Kurikulum Belajar Terstruktur</h2>
          <p className="text-sm text-slate-500 mt-2">Setiap tingkatan BIPA memiliki fokus kompetensi bahasa dan tema kontekstual yang disesuaikan untuk pelajar asing.</p>
        </div>

        <div className="max-w-72 mx-auto pt-4">
          {/* Card BIPA 1 - Aktif */}
          <div className="bg-white p-5 rounded-2xl border-2 border-orange-500 shadow-sm relative overflow-hidden">
            <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Tersedia</span>
            <h4 className="font-extrabold text-lg text-orange-500">BIPA 1 (Dasar)</h4>
            <p className="text-xs font-semibold text-slate-400 mt-1">Tema: Wisata Gastronomi Bandung</p>
            <p className="text-slate-600 text-xs mt-3 leading-relaxed">Fokus pada pengenalan kosakata dasar, ekspresi sehari-hari, dan simulasi interaktif melalui konteks kuliner khas Bandung.</p>
          </div>

          
        </div>
      </div>

      {/* Metode Pembelajaran */}
      <div className="grid md:grid-cols-2 gap-8 mt-24 border-t border-slate-200 pt-16">
        {/* <div className="space-y-2">
          <div className="text-2xl">📋</div>
          <h3 className="font-bold text-base text-slate-800">1. Placement Test</h3>
          <p className="text-slate-600 text-xs leading-relaxed">Sistem uji penempatan otomatis untuk mendeteksi kemampuan awal bahasa Anda, agar materi yang dipelajari tepat sasaran.</p>
        </div> */}
        <div className="space-y-2">
          <div className="text-2xl">🎥</div>
          <h3 className="font-bold text-base text-slate-800">1. Multimedia Materi</h3>
          <p className="text-slate-600 text-xs leading-relaxed">Materi tidak hanya berupa teks, melainkan dilengkapi dengan media audio dan video pengajar untuk mengoptimalkan pemahaman.</p>
        </div>
        <div className="space-y-2">
          <div className="text-2xl">🗣️</div>
          <h3 className="font-bold text-base text-slate-800">2. Evaluasi Menyeluruh</h3>
          <p className="text-slate-600 text-xs leading-relaxed">Dilengkapi latihan membaca, menulis (isian/esai), hingga latihan berbicara langsung menggunakan rekaman audio yang dinilai oleh pengajar.</p>
        </div>
      </div>
    </div>
  );
}