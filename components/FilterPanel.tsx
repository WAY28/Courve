import Link from "next/link";
import { catalogHref, sortOptions, type CatalogParams } from "@/lib/catalog";

const chip = (active: boolean) =>
  `inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors ${
    active
      ? "border-accent bg-accent text-white"
      : "border-border bg-surface text-foreground hover:border-accent"
  }`;

export default function FilterPanel({
  params,
  sizes,
  materials,
  categories,
}: {
  params: CatalogParams;
  sizes: string[];
  materials: string[];
  categories: string[];
}) {
  const sort = params.sort ?? "terbaru";
  const hasFilter = !!(params.size || params.bahan || params.kategori || params.q || params.sort);

  return (
    <div className="flex flex-col gap-7">
      <section aria-labelledby="f-urut">
        <h2 id="f-urut" className="mb-3 text-xs font-bold tracking-[0.12em] text-muted uppercase">
          Urutkan
        </h2>
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((o) => (
            <Link
              key={o.value}
              href={catalogHref(params, { sort: o.value })}
              aria-current={sort === o.value ? "true" : undefined}
              className={chip(sort === o.value)}
            >
              {o.label}
            </Link>
          ))}
        </div>
      </section>

      {categories.length > 1 && (
        <section aria-labelledby="f-kategori">
          <h2 id="f-kategori" className="mb-3 text-xs font-bold tracking-[0.12em] text-muted uppercase">
            Kategori
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c}
                href={catalogHref(params, { kategori: params.kategori === c ? undefined : c })}
                aria-current={params.kategori === c ? "true" : undefined}
                className={chip(params.kategori === c)}
              >
                {c}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="f-ukuran">
        <h2 id="f-ukuran" className="mb-3 text-xs font-bold tracking-[0.12em] text-muted uppercase">
          Ukuran
        </h2>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <Link
              key={s}
              href={catalogHref(params, { size: params.size === s ? undefined : s })}
              aria-current={params.size === s ? "true" : undefined}
              className={`${chip(params.size === s)} min-w-12 justify-center`}
            >
              {s}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="f-bahan">
        <h2 id="f-bahan" className="mb-3 text-xs font-bold tracking-[0.12em] text-muted uppercase">
          Bahan
        </h2>
        <div className="flex flex-wrap gap-2">
          {materials.map((m) => (
            <Link
              key={m}
              href={catalogHref(params, { bahan: params.bahan === m ? undefined : m })}
              aria-current={params.bahan === m ? "true" : undefined}
              className={chip(params.bahan === m)}
            >
              {m}
            </Link>
          ))}
        </div>
      </section>

      {hasFilter && (
        <Link href="/katalog" className="text-sm font-semibold text-accent-dark underline-offset-4 hover:underline">
          Reset semua filter
        </Link>
      )}
    </div>
  );
}
