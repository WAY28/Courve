import type { Metadata } from "next";
import Link from "next/link";
import InfoPage from "@/components/InfoPage";
import WaLink from "@/components/WaLink";

export const metadata: Metadata = { title: "Cara pesan & pembayaran" };

export default function BantuanPage() {
  return (
    <InfoPage eyebrow="Bantuan" title="Cara pesan & pembayaran">
      <section>
        <h2>Cara memesan</h2>
        <ol>
          <li>Pilih piyama di <Link href="/katalog">katalog</Link>, tentukan ukuran dan jumlah, lalu masukkan ke keranjang.</li>
          <li>Buka keranjang, lanjut ke checkout, dan isi alamat pengiriman.</li>
          <li>Pilih metode pembayaran lalu tekan &ldquo;Buat pesanan&rdquo;.</li>
          <li>
            Kamu diarahkan ke WhatsApp admin dengan detail pesanan yang sudah terisi otomatis. Tekan kirim untuk
            konfirmasi.
          </li>
          <li>Admin membalas dengan nomor rekening / QRIS (atau konfirmasi COD). Setelah dibayar, pesanan dikirim.</li>
        </ol>
      </section>
      <section>
        <h2>Metode pembayaran</h2>
        <ul>
          <li><strong>Transfer bank / QRIS</strong>: nomor rekening atau QRIS dikirim admin lewat WhatsApp.</li>
          <li><strong>COD</strong>: bayar tunai ke kurir saat pesanan sampai.</li>
        </ul>
      </section>
      <section>
        <h2>Pengiriman</h2>
        <p>Ongkos kirim flat Rp 15.000 ke seluruh alamat. Nomor pesanan bisa dipakai untuk <Link href="/lacak">melacak status pesanan</Link>.</p>
      </section>
      <section>
        <h2>Butuh bantuan?</h2>
        <p>
          <WaLink text="Halo Courve, saya butuh bantuan.">Chat admin lewat WhatsApp</WaLink>
        </p>
      </section>
    </InfoPage>
  );
}
