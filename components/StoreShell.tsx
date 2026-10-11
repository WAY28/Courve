"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

// The admin area has its own header (see app/admin/layout.tsx), so the
// storefront header and footer are not rendered there.
export default function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <>
      {!isAdmin && <Header />}
      <main id="konten" className="flex-1">
        {children}
      </main>
      {!isAdmin && <Footer />}
    </>
  );
}
