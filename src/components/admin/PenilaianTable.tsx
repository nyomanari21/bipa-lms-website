// src/components/admin/PenilaianTable.tsx
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

// Perbarui Interface agar toleran terhadap Tipe Array dari Supabase Join
interface AttemptItem {
  id: string;
  final_score: number | null;
  status: string;
  attempted_at: string;
  users: { name: string; email: string } | { name: string; email: string }[] | null;
  quizzes: { title: string } | { title: string }[] | null;
}

interface PenilaianTableProps {
  initialAttempts: AttemptItem[];
}

export default function PenilaianTable({ initialAttempts }: PenilaianTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Helper untuk mengekstrak data tunggal dari Array/Object Supabase
  const getUserData = (users: AttemptItem["users"]) => {
    if (!users) return null;
    return Array.isArray(users) ? users[0] || null : users;
  };

  const getQuizData = (quizzes: AttemptItem["quizzes"]) => {
    if (!quizzes) return null;
    return Array.isArray(quizzes) ? quizzes[0] || null : quizzes;
  };

  // Live Search berdasarkan Nama Siswa atau Judul Kuis
  const filteredAttempts = initialAttempts.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const student = getUserData(item.users);
    const quiz = getQuizData(item.quizzes);

    const studentName = student?.name?.toLowerCase() || "";
    const quizTitle = quiz?.title?.toLowerCase() || "";
    return studentName.includes(searchLower) || quizTitle.includes(searchLower);
  });

  // Pagination Logic
  const totalItems = filteredAttempts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAttempts.slice(indexOfFirstItem, indexOfLastItem);

  const goToPage = (pageNumber: number) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); 
  };

  const handleReview = (attemptId: string) => {
    router.push(`/admin/penilaian/${attemptId}`);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex justify-between gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center w-full max-w-md gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.603 10.601z" />
          </svg>
          <input 
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Cari nama siswa atau judul kuis..." 
            className="w-full bg-transparent text-sm outline-none text-gray-700 placeholder:text-gray-400"
          />
          {searchTerm && (
            <button onClick={() => { setSearchTerm(""); setCurrentPage(1); }} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-sm text-left">
            <thead className="text-xs font-bold text-gray-700 uppercase bg-gray-50/70 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-center w-12">No</th>
                <th className="px-4 py-3">Nama Siswa</th>
                <th className="px-4 py-3">Judul Kuis</th>
                <th className="px-4 py-3 text-center">Nilai</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Waktu Pengajuan</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-100 text-gray-600 bg-white">
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => {
                  const student = getUserData(item.users);
                  const quiz = getQuizData(item.quizzes);

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5 text-center font-medium text-gray-400">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-gray-800">
                        {student?.name || "Siswa Tanpa Nama"}
                        <span className="block text-[11px] font-normal text-gray-400">{student?.email}</span>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs font-medium text-slate-700">
                        {quiz?.title || "Kuis Tidak Diketahui"}
                      </td>
                      <td className="px-4 py-3.5 text-center font-extrabold text-orange-600">
                        {item.final_score !== null ? item.final_score : 0}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          item.status === 'submitted' 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500">
                        {new Date(item.attempted_at).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button 
                          type="button" 
                          onClick={() => handleReview(item.id)} 
                          className={`py-1.5 px-3 rounded-xl font-semibold text-xs shadow-sm border cursor-pointer ${
                            item.status === 'submitted'
                              ? 'text-white bg-orange-500 hover:bg-orange-600 transition-colors border-0'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors'
                          }`}
                        >
                          {item.status === 'submitted'
                            ? "Periksa & Nilai"
                            : "Sudah Dinilai"
                          }
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-xs">
                    Belum ada riwayat pengerjaan kuis dari siswa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controller */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-50 bg-gray-50/30 text-xs">
            <span className="text-gray-500">
              Menampilkan <span className="font-semibold text-gray-700">{indexOfFirstItem + 1}</span> - <span className="font-semibold text-gray-700">{Math.min(indexOfLastItem, totalItems)}</span> dari <span className="font-semibold text-gray-700">{totalItems}</span> total data
            </span>
            
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 font-medium text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                &larr; Prev
              </button>
            
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-7 h-7 rounded-lg text-center font-medium transition-colors cursor-pointer ${
                      currentPage === page
                        ? "bg-orange-500 text-white"
                        : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 font-medium text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}