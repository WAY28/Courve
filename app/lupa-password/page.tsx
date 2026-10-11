import type { Metadata } from "next";
import Link from "next/link";
import InfoPage from "@/components/InfoPage";
import WaLink from "@/components/WaLink";

export const metadata: Metadata = { title: "Lupa password" };

export default function LupaPasswordPage() {
  return (
    <InfoPage eyebrow="Akun" title="Lupa password?">
      <p>
        Courve belum memakai pengiriman email, jadi password direset lewat admin. Kirim permintaan ke WhatsApp admin
        dengan email akunmu, lalu admin akan memberi password sementara. Setelah masuk, segera ganti di menu
        &ldquo;Pengaturan akun&rdquo;.
      </p>
      <p>
        <WaLink text="Halo Courve, saya lupa password akun saya. Email akun: (isi email kamu)" className="btn-primary">
          Minta reset lewat WhatsApp
        </WaLink>
      </p>
      <p>
        Sudah ingat? <Link href="/masuk">Kembali ke halaman masuk</Link>.
      </p>
    </InfoPage>
  );
}
