import Link from "next/link";
import { MoonMark } from "@/components/Icons";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
      <div className="flex justify-center">
        <MoonMark size={56} />
      </div>
      <p className="eyebrow mt-6">Error 404</p>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">Halaman tidak ditemukan</h1>
      <p className="mt-3 text-sm text-muted">
        Halaman yang kamu cari tidak ada atau sudah dipindahkan. Yuk kembali ke katalog.
      </p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/" className="btn-outline">
          Ke beranda
        </Link>
        <Link href="/katalog" className="btn-primary">
          Lihat katalog
        </Link>
      </div>
    </div>
  );
}
