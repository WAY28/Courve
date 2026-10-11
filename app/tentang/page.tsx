import type { Metadata } from "next";
import Link from "next/link";
import InfoPage from "@/components/InfoPage";

export const metadata: Metadata = { title: "Tentang Courve" };

export default function TentangPage() {
  return (
    <InfoPage eyebrow="Tentang kami" title="Not just sleepwear, it's an expression.">
      <p>
        Courve adalah toko piyama yang percaya bahwa pakaian tidur bukan sekadar pelengkap malam, tetapi bagian dari
        cara kamu mengekspresikan diri, bahkan saat bersantai di rumah.
      </p>
      <section>
        <h2>Yang kami tawarkan</h2>
        <ul>
          <li>Piyama berbahan katun pilihan yang adem, ringan, dan lembut di kulit.</li>
          <li>Desain motif yang manis, termasuk set couple yang serasi untuk berdua.</li>
          <li>Pemesanan yang sederhana: pilih, isi alamat, lalu konfirmasi lewat WhatsApp.</li>
        </ul>
      </section>
      <section>
        <h2>Punya pertanyaan?</h2>
        <p>
          Lihat <Link href="/bantuan">cara pesan &amp; pembayaran</Link> atau langsung hubungi kami lewat WhatsApp dari
          halaman tersebut.
        </p>
      </section>
    </InfoPage>
  );
}
