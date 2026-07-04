import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* NAVBAR */}
      <Navbar />

      {/* Public Page */}
      <main className="grow">
        {children}
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}