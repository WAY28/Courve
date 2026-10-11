import { prisma } from "./prisma";
import type { Product, ProductSize } from "@prisma/client";

export type ProductWithSizes = Product & { sizes: ProductSize[] };

export const productInclude = { sizes: { orderBy: { id: "asc" as const } } };

export const LOW_STOCK_THRESHOLD = 5;

export type ProductStats = { sold: number; rating: number; reviews: number };
const NO_STATS: ProductStats = { sold: 0, rating: 0, reviews: 0 };

export function serializeProduct(product: ProductWithSizes, stats: ProductStats = NO_STATS) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: product.price,
    oldPrice: product.oldPrice,
    category: product.category,
    material: product.material,
    colorway: product.colorway,
    sizes: product.sizes.map((s) => s.size),
    stock: Object.fromEntries(product.sizes.map((s) => [s.size, s.stock])) as Record<string, number>,
    images: JSON.parse(product.imagesJson) as string[],
    sold: stats.sold,
    rating: stats.rating,
    reviews: stats.reviews,
    published: product.published,
  };
}

/** Units sold (cancelled orders excluded) and visible-review rating, per product. */
export async function productStats(): Promise<(id: number) => ProductStats> {
  const [soldRows, reviewRows] = await Promise.all([
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { productId: { not: null }, order: { status: { not: "CANCELLED" } } },
      _sum: { qty: true },
    }),
    prisma.review.groupBy({
      by: ["productId"],
      where: { hidden: false },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);
  const sold = new Map(soldRows.map((r) => [r.productId as number, r._sum.qty ?? 0]));
  const reviews = new Map(reviewRows.map((r) => [r.productId, r]));
  return (id) => ({
    sold: sold.get(id) ?? 0,
    rating: Math.round((reviews.get(id)?._avg.rating ?? 0) * 10) / 10,
    reviews: reviews.get(id)?._count._all ?? 0,
  });
}
