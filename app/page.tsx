import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, CardIcon, HeartsIcon, LeafIcon } from "@/components/Icons";
import ProductCard from "@/components/ProductCard";
import { formatPrice, getProducts } from "@/lib/api";

const features = [
  {
    icon: LeafIcon,
    title: "Bahan katun pilihan",
    text: "Katun premium, katun rayon, hingga katun Jepang yang adem, ringan, dan lembut di kulit.",
  },
  {
    icon: HeartsIcon,
    title: "Desain berpasangan",
    text: "Set couple dengan motif serasi, siap dipakai berdua untuk tidur maupun bersantai.",
  },
  {
    icon: CardIcon,
    title: "Bayar sesuai kebutuhan",
    text: "Transfer bank / QRIS lewat WhatsApp atau COD. Ongkos kirim flat Rp 15.000.",
  },
];

const steps = [
  { title: "Pilih piyama", text: "Tentukan ukuran dan jumlah, lalu masukkan ke keranjang." },
  { title: "Isi alamat", text: "Lengkapi alamat, lalu pesananmu dikirim ke WhatsApp admin untuk pembayaran." },
  { title: "Pantau pesanan", text: "Cek status pesanan kapan saja lewat akunmu atau halaman Lacak pesanan." },
];

export default async function HomePage() {
  const products = await getProducts();
  const bestSellers = [...products].sort((a, b) => b.sold - a.sold);
  const minPrice = products.length ? Math.min(...products.map((p) => p.price)) : null;
  const materialCount = new Set(products.map((p) => p.material)).size;

  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-10 pt-8 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pt-14">
        <div>
          <p className="eyebrow fade-up">Koleksi terbaru 2026</p>
          <h1 className="fade-up delay-1 font-display mt-4 text-[2.6rem] font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
            Tidur nyaman,
            <br />
            <span className="text-accent">tampil menawan.</span>
          </h1>
          <p className="fade-up delay-2 mt-5 max-w-md text-base leading-relaxed text-muted">
            Piyama berbahan katun lembut dan adem, dirancang untuk kenyamanan tidur sekaligus tampil
            manis di rumah.
          </p>
          <div className="fade-up delay-3 mt-8 flex flex-wrap gap-3">
            <Link href="/katalog" className="btn-primary">
              Belanja sekarang
              <ArrowRightIcon size={18} />
            </Link>
            <Link href="#terlaris" className="btn-outline">
              Lihat terlaris
            </Link>
          </div>
          <dl className="fade-up delay-4 mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-border pt-6">
            {materialCount > 0 && (
              <div>
                <dt className="text-xs text-muted">Pilihan bahan</dt>
                <dd className="font-display text-xl font-semibold">{materialCount} jenis katun</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-muted">Metode bayar</dt>
              <dd className="font-display text-xl font-semibold">3 pilihan</dd>
            </div>
            {minPrice && (
              <div>
                <dt className="text-xs text-muted">Mulai dari</dt>
                <dd className="font-display text-xl font-semibold">{formatPrice(minPrice)}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="fade-up delay-2 relative mx-auto h-[420px] w-full max-w-[520px] sm:h-[540px]">
          <div className="absolute right-[4%] top-[6%] h-[78%] w-[78%] rounded-full bg-accent-soft" aria-hidden="true" />
          <div className="absolute right-0 top-0 h-[88%] w-[62%] overflow-hidden rounded-t-[999px] rounded-b-3xl border border-border shadow-[0_30px_60px_-30px_rgba(43,36,32,0.5)]">
            <Image
              src="/images/products/courve-floral.jpg"
              alt="Piyama set Courve Floral Premium"
              fill
              priority
              sizes="(min-width: 640px) 320px, 62vw"
              className="object-cover object-[26%_32%]"
            />
          </div>
          <div className="absolute bottom-[4%] left-0 h-[48%] w-[46%] overflow-hidden rounded-3xl border-4 border-background shadow-xl">
            <Image
              src="/images/products/couple-gajah.jpg"
              alt="Set piyama couple motif gajah"
              fill
              sizes="(min-width: 640px) 240px, 46vw"
              className="object-cover object-[50%_45%]"
            />
          </div>
          <div className="absolute bottom-0 right-[6%] h-28 w-28 overflow-hidden rounded-full border-4 border-background shadow-xl sm:h-32 sm:w-32">
            <Image
              src="/images/products/couple-floral-abu.jpg"
              alt="Set piyama couple motif bunga abu"
              fill
              sizes="128px"
              className="object-cover object-[50%_40%]"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {features.map(({ icon: IconCmp, title, text }) => (
            <div key={title} className="card flex gap-4 p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-tint text-accent">
                <IconCmp size={24} />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="terlaris" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Pilihan pelanggan</p>
            <h2 className="font-display mt-2 text-3xl font-bold tracking-tight">Produk terlaris</h2>
          </div>
          <Link
            href="/katalog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:underline"
          >
            Lihat semua <ArrowRightIcon size={16} />
          </Link>
        </div>

        {bestSellers.length === 0 ? (
          <div className="card border-dashed p-10 text-center text-sm text-muted">
            Produk belum bisa dimuat. Pastikan server API berjalan di port 4000.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid overflow-hidden rounded-3xl bg-accent-tint md:grid-cols-2">
          <div className="relative min-h-[320px] md:min-h-[400px]">
            <Image
              src="/images/products/couple-gajah.jpg"
              alt="Dua mannequin memakai set piyama couple motif gajah"
              fill
              sizes="(min-width: 768px) 560px, 100vw"
              className="object-cover object-[50%_35%]"
            />
          </div>
          <div className="flex flex-col justify-center p-8 sm:p-12">
            <p className="eyebrow">Set couple</p>
            <h2 className="font-display mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Kembaran dengan pasangan, tidur jadi lebih seru.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
              Pilih motif favoritmu, lengkap dengan potongan atasan dan celana panjang yang nyaman
              dipakai berdua.
            </p>
            <Link href="/katalog" className="btn-primary mt-7 w-fit">
              Lihat set couple
              <ArrowRightIcon size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <p className="eyebrow">Mudah &amp; cepat</p>
          <h2 className="font-display mt-2 text-3xl font-bold tracking-tight">Cara memesan</h2>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="card p-6">
              <span className="font-display flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-white">
                {i + 1}
              </span>
              <h3 className="font-display mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
