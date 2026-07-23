import Navbar from "@/components/admin/Navbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="flex-1 w-full p-4 sm:p-6 md:p-8 pt-4 md:pt-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}