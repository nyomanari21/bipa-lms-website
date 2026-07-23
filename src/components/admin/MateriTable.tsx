'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Materi {
    id: string;
    bipa_level_id: string;
    title: string;
    slug: string;
    content_text: string;
    image_urls: string | null;
    embed_media_urls: string | null;
    order_index: number;
    created_at: string;
}

interface MateriTableProps {
    initialMateri: Materi[];
}

export default function MateriTable({ initialMateri }: MateriTableProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const handleCreateData = () => {
        router.push('/admin/materi/create');
    };

    // Live Search
    const filteredProducts = initialMateri.filter((product) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            product.title.toLowerCase().includes(searchLower)
        );
    });

    // Pagination
    const totalItems = filteredProducts.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Potong array data berdasarkan halaman yang aktif saat ini
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

    // Fungsi pengubah halaman
    const goToPage = (pageNumber: number) => {
        setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
    };

    // Reset nomor halaman ke 1 setiap kali user mengetik di search bar
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); 
    };

    // Delete data handler
    // const handleDeleteData = async (id: string, name: string, imageUrl: string | null) => {
    //     if (window.confirm(`Apakah yakin ingin menghapus data '${name}'?`)) {
    //         try {
    //             // Delete image from storage if exist
    //             if (imageUrl) {
    //                 const fileName = imageUrl.split('/').pop();
    //                 const filePath = `catalog/${fileName}`;

    //                 const { error } = await supabase
    //                     .storage
    //                     .from('reference-images')
    //                     .remove([filePath]);

    //                 if (error) {
    //                     console.error("Gagal hapus file di storage:", error.message);
    //                 } else {
    //                     console.log(`File ${filePath} berhasil dihapus!`);
    //                 }
    //             }

    //             // Delete data
    //             const { error } = await supabase
    //                 .from('products')
    //                 .delete()
    //                 .eq('id', id)

    //             if (error) throw error;

    //             // Reload page
    //             alert('Berhasil dihapus!');
    //             router.refresh();
    //         } catch (err: any) {
    //             alert(`Gagal menghapus data: ${err.message}`);
    //         }
    //     }
    // }

    // Update data handler
    const handleUpdateData = (id: string) => {
        router.push(`/admin/catalog/update/${id}`)
    }

    return (
        <div className="space-y-4">
            {/* Search Bar Element */}
            <div className="flex justify-between gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center w-full max-w-md gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.603 10.601z" />
                    </svg>
                    <input 
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Cari judul materi..." 
                        className="w-full bg-transparent text-sm outline-none text-gray-700 placeholder:text-gray-400"
                    />
                    {searchTerm && (
                        <button onClick={() => { setSearchTerm(""); setCurrentPage(1); }} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">
                            Clear
                        </button>
                    )}
                </div>
                <button 
                    onClick={handleCreateData}
                    className="w-fit bg-green-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-green-600 transition-colors cursor-pointer shadow-sm"
                >
                    Tambah Data
                </button>
            </div>

            {/* Table Content */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table-auto w-full text-sm text-left">
                        <thead className="text-xs font-bold text-gray-700 uppercase bg-gray-50/70 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-center w-12">No</th>
                                <th className="px-4 py-3">Level BIPA</th>
                                <th className="px-4 py-3">Judul</th>
                                <th className="px-4 py-3">Slug</th>
                                <th className="px-4 py-3 w-24">Isi Konten</th>
                                <th className="px-4 py-3">Link Youtube</th>
                                <th className="px-4 py-3">Nomor Urut</th>
                                <th className="px-4 py-3">Aksi</th>
                            </tr>
                        </thead>
                        
                        <tbody className="divide-y divide-gray-100 text-gray-600 bg-white">
                            {currentItems.length > 0 ? (
                                currentItems.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3.5 text-center font-medium text-gray-400">
                                        {indexOfFirstItem + index + 1}
                                    </td>
                                    <td className="px-4 py-3.5 font-semibold text-gray-800">{item.bipa_level_id}</td>
                                    <td className="px-4 py-3.5 max-w-xs truncate">{item.title}</td>
                                    <td className="px-4 py-3.5 max-w-xs truncate">{item.slug}</td>
                                    <td className="px-4 py-3.5 max-w-xs truncate">{item.content_text}</td>
                                    <td className="px-4 py-3.5">
                                        {item.embed_media_urls ? (
                                          <span>{item.embed_media_urls}</span>
                                        ) : (
                                          "Tidak Ada Link Youtube"
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 max-w-xs truncate">{item.order_index}</td>
                                    <td className="px-4 py-3.5 flex flex-wrap gap-2">
                                        {/* <button type="button" onClick={() => handleDeleteData(item.id, item.name, item.image_url)} className="bg-red-500 text-white border border-gray-200 py-1 px-2 rounded-md hover:bg-red-600 transition-colors cursor-pointer font-medium text-sm shadow-sm">
                                            Hapus
                                        </button> */}
                                        <button type="button" onClick={() => handleUpdateData(item.id)} className="bg-yellow-500 text-white border border-gray-200 py-1 px-2 rounded-md hover:bg-yellow-600 transition-colors cursor-pointer font-medium text-sm shadow-sm">
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-xs">
                                        Tidak ada produk buket yang cocok dengan pencarianmu.
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
                            Menampilkan <span className="font-semibold text-gray-700">{indexOfFirstItem + 1}</span> - <span className="font-semibold text-gray-700">{Math.min(indexOfLastItem, totalItems)}</span> dari <span className="font-semibold text-gray-700">{totalItems}</span> total produk
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