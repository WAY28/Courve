import type { Product } from "@/lib/api";

export type CatalogParams = {
  q?: string;
  sort?: string;
  size?: string;
  bahan?: string;
  kategori?: string;
};

export const sortOptions = [
  { value: "terbaru", label: "Terbaru" },
  { value: "terlaris", label: "Terlaris" },
  { value: "harga-asc", label: "Harga terendah" },
  { value: "harga-desc", label: "Harga tertinggi" },
  { value: "rating", label: "Rating tertinggi" },
];

const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export function sizeOptions(products: Product[]) {
  const all = new Set(products.flatMap((p) => p.sizes.filter((s) => (p.stock[s] ?? 0) > 0)));
  return [...all].sort((a, b) => {
    const ia = sizeOrder.indexOf(a);
    const ib = sizeOrder.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

export function categoryOptions(products: Product[]) {
  return [...new Set(products.map((p) => p.category))].sort();
}

export function materialOptions(products: Product[]) {
  return [...new Set(products.map((p) => p.material))].sort();
}

export function applyCatalog(products: Product[], params: CatalogParams) {
  let result = products;
  if (params.size) result = result.filter((p) => (p.stock[params.size!] ?? 0) > 0);
  if (params.kategori) result = result.filter((p) => p.category === params.kategori);
  if (params.bahan) result = result.filter((p) => p.material === params.bahan);

  const sorted = [...result];
  switch (params.sort) {
    case "harga-asc":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "harga-desc":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      sorted.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
      break;
    case "terlaris":
      sorted.sort((a, b) => b.sold - a.sold);
      break;
  }
  return sorted;
}

export function catalogHref(params: CatalogParams, changes: Partial<CatalogParams>) {
  const next = { ...params, ...changes };
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (!value) continue;
    if (key === "sort" && value === "terbaru") continue;
    sp.set(key, value);
  }
  const qs = sp.toString();
  return qs ? `/katalog?${qs}` : "/katalog";
}
