import Link from "next/link";
import { MoonMark } from "@/components/Icons";

const columns = [
  {
    title: "Belanja",
    links: [
      { href: "/katalog", label: "Semua produk" },
      { href: "/keranjang", label: "Keranjang" },
      { href: "/checkout", label: "Checkout" },
      { href: "/lacak", label: "Lacak pesanan" },
    ],
  },
  {
    title: "Akun",
    links: [
      { href: "/masuk", label: "Masuk" },
      { href: "/daftar", label: "Daftar" },
      { href: "/akun", label: "Pesanan saya" },
      { href: "/wishlist", label: "Wishlist" },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { href: "/tentang", label: "Tentang Courve" },
      { href: "/bantuan", label: "Cara pesan & pembayaran" },
      { href: "/syarat", label: "Syarat & ketentuan" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-20 bg-foreground text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <MoonMark size={30} />
            <span className="font-display text-xl font-bold text-white">Courve</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
            Not just sleepwear, it&apos;s an expression. Piyama berbahan katun lembut untuk tidur
            nyaman dan bersantai di rumah.
          </p>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-sm font-semibold text-white">{col.title}</h2>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/70 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-5 text-center text-xs text-white/60 sm:px-6 sm:text-left">
          &copy; {new Date().getFullYear()} Courve. Seluruh hak cipta dilindungi.
        </div>
      </div>
    </footer>
  );
}
