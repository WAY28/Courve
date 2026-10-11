import Image from "@/components/ProductImage";
import Link from "next/link";
import Stars from "@/components/Stars";
import WishlistButton from "@/components/WishlistButton";
import { formatPrice, type Product } from "@/lib/api";

export default function ProductCard({ product }: { product: Product }) {
  const inStockSizes = product.sizes.filter((s) => (product.stock[s] ?? 0) > 0);
  const soldOut = inStockSizes.length === 0;
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <div className="relative">
    <Link
      href={`/produk/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(43,36,32,0.35)]"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-accent-soft">
        {soldOut && (
          <span className="absolute bottom-3 left-3 z-10 rounded-full bg-foreground px-3 py-1 text-xs font-bold text-white">
            Stok habis
          </span>
        )}
        {discount > 0 && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-white">
            Hemat {discount}%
          </span>
        )}
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 340px, (min-width: 640px) 33vw, 50vw"
          className={`object-cover transition-transform duration-500 group-hover:scale-105 ${soldOut ? "opacity-60" : ""}`}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-xs font-medium text-muted">
          {product.material} &middot; {product.colorway}
        </div>
        <h3 className="text-[15px] font-semibold leading-snug text-foreground">{product.name}</h3>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
          <span className="text-lg font-bold text-accent-dark">{formatPrice(product.price)}</span>
          {product.oldPrice && (
            <span className="text-sm text-muted line-through">{formatPrice(product.oldPrice)}</span>
          )}
        </div>
        <Stars rating={product.rating} reviews={product.reviews} />
        <div className="text-xs text-muted">
          {soldOut ? "Semua ukuran habis" : `Ukuran ${inStockSizes.join(", ")}`}
          {product.sold > 0 && <> &middot; Terjual {product.sold}</>}
        </div>
      </div>
    </Link>
    <WishlistButton slug={product.slug} name={product.name} />
    </div>
  );
}
