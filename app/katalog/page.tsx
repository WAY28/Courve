import Link from "next/link";
import type { Metadata } from "next";
import FilterPanel from "@/components/FilterPanel";
import { ChevronDownIcon, CloseIcon } from "@/components/Icons";
import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/lib/api";
import {
  applyCatalog,
  catalogHref,
  categoryOptions,
  materialOptions,
  sizeOptions,
  sortOptions,
  type CatalogParams,
} from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Katalog Produk",
};

type SearchParams = { q?: string; sort?: string; size?: string; bahan?: string; kategori?: string };

export default async function KatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const raw = await searchParams;
  const params: CatalogParams = {
    q: raw.q?.trim() || undefined,
    sort: sortOptions.some((o) => o.value === raw.sort) ? raw.sort : undefined,
    size: raw.size || undefined,
    bahan: raw.bahan || undefined,
    kategori: raw.kategori || undefined,
  };

  const allProducts = await getProducts();
  const searched = params.q
    ? allProducts.filter((p) => p.name.toLowerCase().includes(params.q!.toLowerCase()))
    : allProducts;
  const products = applyCatalog(searched, params);

  const sizes = sizeOptions(allProducts);
  const materials = materialOptions(allProducts);
  const categories = categoryOptions(allProducts);
  const activeFilters = [
    params.q && { label: `Pencarian: “${params.q}”`, href: catalogHref(params, { q: undefined }) },
    params.size && { label: `Ukuran ${params.size}`, href: catalogHref(params, { size: undefined }) },
    params.bahan && { label: params.bahan, href: catalogHref(params, { bahan: undefined }) },
    params.kategori && { label: params.kategori, href: catalogHref(params, { kategori: undefined }) },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link href="/" className="hover:text-foreground">
          Beranda
        </Link>{" "}
        / <span className="text-foreground">Katalog</span>
      </nav>

      <header className="mt-5">
        <p className="eyebrow">Katalog</p>
        <h1 className="font-display mt-2 text-4xl font-bold tracking-tight">Semua piyama</h1>
        <p className="mt-2 text-sm text-muted">
          {products.length} dari {allProducts.length} produk
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside>
          <details className="card group lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold">
              <span>
                Filter &amp; urutkan
                {activeFilters.length > 0 && (
                  <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-white">
                    {activeFilters.length}
                  </span>
                )}
              </span>
              <ChevronDownIcon size={18} className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-border p-5">
              <FilterPanel params={params} sizes={sizes} materials={materials} categories={categories} />
            </div>
          </details>
          <div className="sticky top-28 hidden lg:block">
            <FilterPanel params={params} sizes={sizes} materials={materials} categories={categories} />
          </div>
        </aside>

        <div>
          {activeFilters.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {activeFilters.map((f) => (
                <Link
                  key={f.label}
                  href={f.href}
                  aria-label={`Hapus filter ${f.label}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3.5 py-1.5 text-sm font-medium text-accent-dark hover:bg-[#ddd4ee]"
                >
                  {f.label}
                  <CloseIcon size={14} />
                </Link>
              ))}
            </div>
          )}

          {products.length === 0 ? (
            <div className="card border-dashed px-6 py-16 text-center">
              <h2 className="font-display text-xl font-semibold">Produk tidak ditemukan</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                Coba ubah atau hapus filter. Jika produk tidak muncul sama sekali, pastikan server API
                berjalan di port 4000.
              </p>
              <Link href="/katalog" className="btn-primary btn-sm mt-6">
                Reset filter
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:gap-6 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
