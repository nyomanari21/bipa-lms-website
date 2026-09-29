import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase.server";
import MateriForm from "@/components/admin/MateriForm";

export default async function UpdateMateriPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const supabase = await createSupabaseServerClient();
    
    const { id } = await params;

    const { data: bipa_levels, error: bipaError } = await supabase
        .from('bipa_levels')
        .select('id, level_name')
        .order('id', { ascending: true })

    if (bipaError) {
        return <div className="p-10">Gagal ambil data: {bipaError.message}</div>
    }

    const { data: material, error: materialError } = await supabase
        .from('materials')
        .select(`
            id,
            bipa_level_id,
            title,
            slug,
            content_text,
            image_urls,
            embed_media_urls,
            order_index
        `)
        .eq('id', id)
        .maybeSingle()
    
    if (materialError) {
        return <div className="p-10">Gagal ambil data: {materialError.message}</div>
    }

    if (!material) {
        return notFound();
    }

    return (
        <div className="space-y-6 sm:top-20">
            {/* Header Catalog */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Edit Data Materi</h1>
                    <p className="text-xs text-slate-400 mt-1">Halaman untuk edit data materi</p>
                </div>
            </div>

            {/* Create Form */}
            <MateriForm bipaLevelData={bipa_levels} initialData={material}  />
        </div>
    );
}