'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ImportExcelModal from "./ImportExcelModal";

interface Quizzes {
  id: string;
  title: string;
}

interface Questions {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  correct_answer: string | null;
  question_number: number;
  created_at: string;
  quizzes: Quizzes;
}

interface QuestionsTableProps {
  initialQuestions: Questions[];
  quizzes: Quizzes[];
}

export default function KuisTable({ quizzes, initialQuestions }: QuestionsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isImportOpen, setIsImportOpen] = useState(false);

  // State untuk menyimpan daftar ID soal yang dicentang (Multiple Delete)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  // Helper untuk mengonversi indeks angka (0, 1, 2, 3, 4) menjadi huruf (A, B, C, D, E)
  const getOptionLetter = (indexStr: string | null) => {
    if (indexStr === null || indexStr === undefined) return "-";
    const index = parseInt(indexStr, 10);
    if (isNaN(index)) return indexStr;
    return String.fromCharCode(65 + index);
  };

  // Live Search
  const filteredProducts = initialQuestions.filter((question) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      question.question_text.toLowerCase().includes(searchLower) ||
      question.quizzes.title.toLowerCase().includes(searchLower)
    );
  });

  // Pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  // Cek status checkbox header untuk halaman yang sedang aktif
  const currentPageIds = currentItems.map((item) => item.id);
  const isAllCurrentPageSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedIds.includes(id));
  const isSomeCurrentPageSelected =
    currentPageIds.some((id) => selectedIds.includes(id)) &&
    !isAllCurrentPageSelected;

  // Atur status indeterminate (-) pada checkbox header seperti di Supabase
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isSomeCurrentPageSelected;
    }
  }, [isSomeCurrentPageSelected]);

  // Toggle centang semua item di halaman saat ini
  const handleSelectAllCurrentPage = (checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    } else {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    }
  };

  // Toggle centang satu baris
  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Fungsi pengubah halaman
  const goToPage = (pageNumber: number) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  // Reset nomor halaman ke 1 setiap kali user mengetik di search bar
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCreateData = () => {
    router.push('/admin/kuis/create');
  };

  // Delete single data handler
  const handleDeleteData = async (id: string, question_text: string) => {
    if (window.confirm(`Apakah yakin ingin menghapus soal '${question_text}'?`)) {
      try {
        const { error: deleteError } = await supabase
          .from("questions")
          .delete()
          .eq("id", id);

        if (deleteError) throw deleteError;

        // Bersihkan ID dari daftar terpilih jika kebetulan sedang dicentang
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        alert("Soal berhasil dihapus!");
        router.refresh();
      } catch (err: any) {
        alert(`Gagal menghapus soal: ${err.message}`);
      }
    }
  };

  // Delete multiple data handler
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus ${selectedIds.length} soal yang dipilih? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    setIsBulkDeleting(true);
    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;

      alert(`${selectedIds.length} soal berhasil dihapus!`);
      setSelectedIds([]);
      router.refresh();
    } catch (err: any) {
      alert(`Gagal menghapus soal terpilih: ${err.message}`);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Update data handler
  const handleUpdateData = (id: string) => {
    router.push(`/admin/kuis/update/${id}`);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center w-full max-w-md gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 text-gray-400 shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.603 10.601z"
            />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Cari pertanyaan atau judul materi..."
            className="w-full bg-transparent text-sm outline-none text-gray-700 placeholder:text-gray-400"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Bulk Delete (Muncul hanya jika ada data yang dicentang) */}
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="cursor-pointer bg-red-600 text-white text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-red-700 transition shadow-sm disabled:bg-slate-300 flex items-center gap-1.5"
            >
              <span>🗑️</span>
              <span>
                {isBulkDeleting
                  ? "Menghapus..."
                  : `Hapus Terpilih (${selectedIds.length})`}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="cursor-pointer bg-emerald-600 text-white text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-emerald-700 transition"
          >
            📊 Import Excel
          </button>

          <button
            type="button"
            onClick={handleCreateData}
            className="cursor-pointer bg-green-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-green-600 transition"
          >
            + Tambah Data
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-sm text-left">
            <thead className="text-xs font-bold text-gray-700 uppercase bg-gray-50/70 border-b border-gray-100">
              <tr>
                {/* Checkbox Select All */}
                <th className="px-4 py-3 text-center w-10">
                  <input
                    ref={selectAllCheckboxRef}
                    type="checkbox"
                    checked={isAllCurrentPageSelected}
                    onChange={(e) => handleSelectAllCurrentPage(e.target.checked)}
                    disabled={currentItems.length === 0}
                    aria-label="Pilih semua soal di halaman ini"
                    className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer accent-orange-500"
                  />
                </th>
                <th className="px-4 py-3 text-center w-12">No</th>
                <th className="px-4 py-3">Modul Materi</th>
                <th className="px-4 py-3">Pertanyaan</th>
                <th className="px-4 py-3">Opsi</th>
                <th className="px-4 py-3">Jawaban</th>
                <th className="px-4 py-3">Nomor Soal</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-gray-600 bg-white">
              {currentItems.length > 0 ? (
                currentItems.map((item, index) => {
                  const isChecked = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isChecked
                          ? "bg-orange-50/50 hover:bg-orange-50/80"
                          : "hover:bg-gray-50/50"
                      }`}
                    >
                      {/* Checkbox Per Baris */}
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                          aria-label={`Pilih soal ${item.question_text}`}
                          className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer accent-orange-500"
                        />
                      </td>
                      <td className="px-4 py-3.5 text-center font-medium text-gray-400">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-gray-800">
                        {item.quizzes.title}
                      </td>
                      <td className="px-4 py-3.5 max-w-xs truncate">
                        {item.question_text}
                      </td>
                      {/* Kolom Opsi */}
                      <td className="px-4 py-3.5 max-w-xs">
                        {item.options && item.options.length > 0 ? (
                          <div className="flex flex-col gap-0.5 text-xs">
                            {item.options.map((opt, optIndex) => (
                              <span
                                key={optIndex}
                                className="text-slate-600 block truncate"
                              >
                                {opt}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">-</span>
                        )}
                      </td>
                      {/* Kolom Jawaban */}
                      <td className="px-4 py-3.5 max-w-xs font-medium">
                        {item.question_type === "multiple_choice" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200">
                            {getOptionLetter(item.correct_answer)}
                          </span>
                        ) : item.question_type === "short_answer" ? (
                          <span className="text-slate-700 font-semibold text-xs">
                            {item.correct_answer || "-"}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Penilaian Manual
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 max-w-xs truncate">
                        {item.question_number}
                      </td>
                      <td className="px-4 py-3.5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteData(item.id, item.question_text)
                          }
                          className="bg-red-500 text-white border border-gray-200 py-1 px-2 rounded-xl hover:bg-red-600 transition-colors cursor-pointer font-medium text-sm shadow-sm"
                        >
                          Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateData(item.id)}
                          className="bg-yellow-500 text-white border border-gray-200 py-1 px-2 rounded-xl hover:bg-yellow-600 transition-colors cursor-pointer font-medium text-sm shadow-sm"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-gray-400 text-xs"
                  >
                    Tidak ada soal yang cocok dengan pencarianmu.
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
              Menampilkan{" "}
              <span className="font-semibold text-gray-700">
                {indexOfFirstItem + 1}
              </span>{" "}
              -{" "}
              <span className="font-semibold text-gray-700">
                {Math.min(indexOfLastItem, totalItems)}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-gray-700">{totalItems}</span>{" "}
              total data
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
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
                  )
                )}
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

        {/* Panggil Modal Import */}
        <ImportExcelModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          quizzes={quizzes}
          onSuccess={() => router.refresh()}
        />
      </div>
    </div>
  );
}