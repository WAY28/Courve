"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { getWishlist, type Product } from "@/lib/api";

export default function WishlistPage() {
  const { token, loading } = useAuth();
  const { slugs } = useWishlist();
  const router = useRouter();
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!token) {
      router.replace("/masuk?next=/wishlist");
      return;
    }
    getWishlist(token).then((res) => setProducts(res.ok ? res.data : []));
  }, [loading, token, router]);

  // Hearts toggled on this page disappear from the list right away.
  const visible = products?.filter((p) => slugs.has(p.slug)) ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Akun</p>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">Wishlist</h1>

      {visible === null && <div className="skeleton mt-8 h-72" aria-busy="true" />}
      {visible && visible.length === 0 && (
        <div className="card mt-8 border-dashed px-6 py-14 text-center">
          <p className="font-medium">Wishlist masih kosong</p>
          <p className="mt-1 text-sm text-muted">Tekan ikon hati pada produk untuk menyimpannya di sini.</p>
          <Link href="/katalog" className="btn-primary btn-sm mt-5">
            Lihat katalog
          </Link>
        </div>
      )}
      {visible && visible.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
          {visible.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
