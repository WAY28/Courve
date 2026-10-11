import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AddToCartForm from "@/components/AddToCartForm";
import ProductReviews from "@/components/ProductReviews";
import Stars from "@/components/Stars";
import WishlistButton from "@/components/WishlistButton";
import { CardIcon, ChevronDownIcon, LeafIcon, TruckIcon } from "@/components/Icons";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import { formatPrice, getProduct, getProducts } from "@/lib/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return {
    title: product ? product.name : "Produk tidak ditemukan",
    description: product?.description,
  };
}

function Accordion({
  title,
  children,
  open,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details open={open} className="group border-b border-border py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-semibold">
        {title}
        <ChevronDownIcon size={18} className="text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 text-sm leading-relaxed text-muted">{children}</div>
    </details>
  );
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, all] = await Promise.all([getProduct(slug), getProducts()]);

  if (!product) notFound();

  const related = all.filter((p) => p.slug !== product.slug).slice(0, 3);
  const saved = product.oldPrice ? product.oldPrice - product.price : 0;
  const discount = product.oldPrice ? Math.round((saved / product.oldPrice) * 100) : 0;

  const perks = [
    { icon: LeafIcon, text: product.material },
    { icon: TruckIcon, text: "Ongkir flat Rp 15.000" },
    { icon: CardIcon, text: "Transfer / QRIS, COD" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link href="/" className="hover:text-foreground">
          Beranda
        </Link>{" "}
        /{" "}
        <Link href="/katalog" className="hover:text-foreground">
          Katalog
        </Link>{" "}
        / <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <ProductGallery
          images={product.images}
          name={product.name}
          badge={discount > 0 ? `Hemat ${discount}%` : undefined}
        />

        <div className="lg:pt-2">
          <p className="eyebrow">{product.category}</p>
          <h1 className="font-display mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
            <Stars rating={product.rating} reviews={product.reviews} size="md" />
            {product.sold > 0 && <span className="text-sm text-muted">Terjual {product.sold} pcs</span>}
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-3xl font-bold text-accent-dark">
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-base text-muted line-through">{formatPrice(product.oldPrice)}</span>
            )}
            {saved > 0 && (
              <span className="rounded-full bg-sage px-3 py-1 text-xs font-semibold text-sage-dark">
                Hemat {formatPrice(saved)}
              </span>
            )}
          </div>

          <p className="mt-5 text-[15px] leading-relaxed text-muted">{product.description}</p>

          <ul className="mt-6 grid gap-2.5 sm:grid-cols-3">
            {perks.map(({ icon: IconCmp, text }) => (
              <li
                key={text}
                className="flex items-center gap-2.5 rounded-xl bg-accent-tint px-3.5 py-3 text-xs font-medium text-foreground"
              >
                <IconCmp size={18} className="shrink-0 text-accent" />
                {text}
              </li>
            ))}
          </ul>

          <div className="mt-8 border-t border-border pt-8">
            <AddToCartForm product={product} />
            <div className="mt-3">
              <WishlistButton slug={product.slug} name={product.name} variant="inline" />
            </div>
          </div>

          <div className="mt-8 border-t border-border">
            <Accordion title="Detail produk" open>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
                <dt className="text-foreground">Bahan</dt>
                <dd>{product.material}</dd>
                <dt className="text-foreground">Warna / motif</dt>
                <dd>{product.colorway}</dd>
                <dt className="text-foreground">Kategori</dt>
                <dd>{product.category}</dd>
                <dt className="text-foreground">Ukuran tersedia</dt>
                <dd>{product.sizes.filter((s) => (product.stock[s] ?? 0) > 0).join(", ") || "Habis"}</dd>
              </dl>
            </Accordion>
            <Accordion title="Pengiriman & pembayaran">
              Ongkos kirim flat Rp 15.000. Setelah pesanan dibuat, kamu diarahkan ke WhatsApp admin untuk
              pembayaran via transfer bank / QRIS, atau pilih bayar di tempat (COD). Status pesanan bisa
              dipantau dari halaman akun atau Lacak pesanan.
            </Accordion>
          </div>
        </div>
      </div>

      <ProductReviews slug={product.slug} name={product.name} />

      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="related">
          <h2 id="related" className="font-display mb-6 text-2xl font-bold tracking-tight">
            Produk lainnya
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
