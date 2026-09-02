'use client';

import { useState, ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";
import ExcelJS from "exceljs";

interface Quiz {
  id: string;
  title: string;
}

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizzes: Quiz[];
  onSuccess: () => void;
}

export default function ImportExcelModal({
  isOpen,
  onClose,
  quizzes,
  onSuccess,
}: ImportExcelModalProps) {
  const [selectedQuizId, setSelectedQuizId] = useState(quizzes[0]?.id || "");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Handle download template Excel
  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Template Soal");
  
    // Header
    const headers = [
      "question_text",
      "question_type",
      "option_a",
      "option_b",
      "option_c",
      "option_d",
      "correct_answer",
      "order_index",
    ];
    worksheet.addRow(headers);
  
    // Header excel bold
    worksheet.getRow(1).font = { bold: true };
  
    // Contoh baris data untuk dosen
    const templateData = [
      [
        "Rempah khusus apa yang memberikan aroma wangi khas pada masakan Seblak?",
        "multiple_choice",
        "Jahe",
        "Kunyit",
        "Kencur",
        "Lengkuas",
        "C",
        1,
      ],
      [
        "Sebutkan bahan utama seblak yang memiliki tekstur kenyal setelah direbus!",
        "short_answer",
        "",
        "",
        "",
        "",
        "Kerupuk",
        2,
      ],
      [
        "Ceritakan pengalaman Anda saat memesan makanan pedas di Bandung!",
        "essay",
        "",
        "",
        "",
        "",
        "",
        3,
      ],
      [
        "Bacalah kalimat ini: 'Bu, saya pesan seblak satu porsi.'",
        "speaking",
        "",
        "",
        "",
        "",
        "",
        4,
      ],
    ];
    templateData.forEach((row) => worksheet.addRow(row));
  
    // Dropdown data validation untuk kolom B (question_type), baris 2-100
    for (let i = 2; i <= 100; i++) {
      worksheet.getCell(`B${i}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"multiple_choice,short_answer,essay,speaking"'],
        showErrorMessage: true,
        errorTitle: "Tipe Soal Tidak Valid",
        error: "Silakan pilih tipe soal yang tersedia dari daftar dropdown!",
      };
    }
  
    // Auto width kolom (opsional)
    worksheet.columns.forEach((col) => {
      col.width = 25;
    });
  
    // Generate buffer & trigger download di browser
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Template_Import_Soal_BIPA.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Fungsi membaca file Excel & diubah menjadi array of objects
  async function parseExcelFile(file: File): Promise<Record<string, any>[]> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
  
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return [];
  
    // Ambil header dari baris pertama
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      headers[colNumber] = cell.value?.toString().trim() || "";
    });
  
    const rows: Record<string, any>[] = [];
  
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
  
      const rowData: Record<string, any> = {};
      let isEmpty = true;
  
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const key = headers[colNumber];
        if (!key) return;
  
        let value: any = cell.value;
  
        // Handle hasil formula (object dengan property `result`)
        if (value && typeof value === "object" && "result" in value) {
          value = value.result;
        }
        // Handle rich text
        else if (value && typeof value === "object" && "richText" in value) {
          value = value.richText.map((rt: any) => rt.text).join("");
        }
        // Handle date object dari ExcelJS (opsional, jaga-jaga)
        else if (value instanceof Date) {
          value = value.toISOString();
        }
  
        if (value !== null && value !== undefined && value !== "") {
          isEmpty = false;
        }
  
        rowData[key] = value ?? "";
      });
  
      if (!isEmpty) {
        rows.push(rowData);
      }
    });
  
    return rows;
  }
 
  // Handle upload & parse data Excel ke Supabase
  const handleImport = async () => {
    if (!file) {
      alert("Silakan pilih file Excel terlebih dahulu!");
      return;
    }
    if (!selectedQuizId) {
      alert("Pilih kuis tujuan terlebih dahulu!");
      return;
    }
  
    setIsLoading(true);
  
    try {
      const rawRows = await parseExcelFile(file);
  
      if (rawRows.length === 0) {
        throw new Error("File Excel kosong atau format tidak sesuai.");
      }
  
      // Formatting setiap baris agar sesuai dengan skema tabel questions
      const formattedQuestions = rawRows.map((row, index) => {
        const type = (row.question_type || "multiple_choice").toString().trim().toLowerCase();
  
        let options: string[] | null = null;
        let correctAnswer: string | null = null;
  
        if (type === "multiple_choice") {
          // Susun array opsi A-D
          options = [
            `A. ${(row.option_a || "").toString().trim()}`,
            `B. ${(row.option_b || "").toString().trim()}`,
            `C. ${(row.option_c || "").toString().trim()}`,
            `D. ${(row.option_d || "").toString().trim()}`,
          ];
  
          // Mapping jawaban benar (A->0, B->1, C->2, D->3 atau angka 1->0, 2->1, dst)
          const rawAns = (row.correct_answer || "").toString().trim().toUpperCase();
          if (["A", "1"].includes(rawAns)) correctAnswer = "0";
          else if (["B", "2"].includes(rawAns)) correctAnswer = "1";
          else if (["C", "3"].includes(rawAns)) correctAnswer = "2";
          else if (["D", "4"].includes(rawAns)) correctAnswer = "3";
          else correctAnswer = "0"; // Fallback ke A jika tidak valid
        } else if (type === "short_answer") {
          options = null;
          correctAnswer = (row.correct_answer || "").toString().trim();
        } else {
          // Essay & Speaking
          options = null;
          correctAnswer = null;
        }
  
        return {
          quiz_id: selectedQuizId,
          question_text: row.question_text || `Pertanyaan ${index + 1}`,
          question_type: type,
          options: options,
          correct_answer: correctAnswer,
          question_number: row.order_index ? Number(row.order_index) : index + 1,
        };
      });
  
      // Bulk insert ke Supabase
      const { error } = await supabase
        .from("questions")
        .insert(formattedQuestions);
  
      if (error) throw error;
  
      alert(`Berhasil mengimpor ${formattedQuestions.length} soal kuis!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert("Gagal mengimpor file Excel: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">Import Soal via Excel</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Pilih Kuis Tujuan */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Kuis / Bab Tujuan
            </label>
            <select
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-orange-500"
            >
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
          </div>

          {/* Unduh Template Button */}
          <div className="p-3.5 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-between">
            <div className="text-xs text-orange-900">
              <p className="font-bold">Belum punya formatnya?</p>
              <p className="text-[11px] text-orange-700">Unduh berkas template Excel .xlsx</p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="cursor-pointer px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition shadow-sm"
            >
              Unduh Template
            </button>
          </div>

          {/* Upload Input */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Pilih Berkas Excel (.xlsx)
            </label>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={isLoading || !file}
              className="cursor-pointer px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition disabled:bg-slate-300"
            >
              {isLoading ? "Mengunggah..." : "Mulai Impor Data"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}