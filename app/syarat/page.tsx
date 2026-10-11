import type { Metadata } from "next";
import Link from "next/link";
import InfoPage from "@/components/InfoPage";

export const metadata: Metadata = { title: "Syarat & ketentuan" };

export default function SyaratPage() {
  return (
    <InfoPage eyebrow="Ketentuan" title="Syarat & ketentuan">
      <section>
        <h2>Pemesanan</h2>
        <p>
          Pesanan dianggap sah setelah dikonfirmasi admin lewat WhatsApp. Harga dan stok yang berlaku adalah yang tampil
          saat pesanan dibuat; keranjang akan menyesuaikan jika harga atau stok berubah.
        </p>
      </section>
      <section>
        <h2>Pembayaran</h2>
        <p>
          Pembayaran dilakukan lewat transfer bank / QRIS sesuai informasi dari admin, atau COD. Pesanan diproses
          setelah pembayaran dikonfirmasi.
        </p>
      </section>
      <section>
        <h2>Pembatalan</h2>
        <p>
          Pesanan yang belum dibayar dapat dibatalkan sendiri dari halaman <Link href="/akun">akun</Link>. Untuk pesanan
          yang sudah dibayar, hubungi admin lewat WhatsApp.
        </p>
      </section>
      <section>
        <h2>Penukaran &amp; pengembalian</h2>
        <p>Hubungi admin lewat WhatsApp dengan menyertakan nomor pesanan untuk membahas penukaran atau pengembalian.</p>
      </section>
      <section>
        <h2>Data pribadi</h2>
        <p>
          Nama, nomor HP, dan alamat hanya dipakai untuk memproses dan mengirim pesananmu, dan tidak dibagikan ke pihak
          lain di luar keperluan pengiriman.
        </p>
      </section>
    </InfoPage>
  );
}
