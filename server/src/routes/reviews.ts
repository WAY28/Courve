import { Router } from "express";
import { z } from "zod";
import { ah, HttpError } from "../lib/asyncHandler";
import { prisma } from "../lib/prisma";
import { optionalAuth, requireUser } from "../middleware/auth";

export const reviewsRouter = Router();

// "Budi Santoso" -> "Budi S." so reviews do not expose full customer names.
const publicName = (name: string) => {
  const [first, ...rest] = name.trim().split(/\s+/);
  return rest.length ? `${first} ${rest[rest.length - 1][0].toUpperCase()}.` : first;
};

async function publishedProduct(slug: string) {
  const product = await prisma.product.findFirst({ where: { slug, published: true }, select: { id: true } });
  if (!product) throw new HttpError("Produk tidak ditemukan.", 404);
  return product;
}

// Only buyers whose order for this product is COMPLETED can review it.
async function hasCompletedOrder(userId: number, productId: number) {
  const item = await prisma.orderItem.findFirst({
    where: { productId, order: { userId, status: "COMPLETED" } },
    select: { id: true },
  });
  return item !== null;
}

reviewsRouter.get(
  "/:slug/reviews",
  optionalAuth,
  ah(async (req, res) => {
    const product = await publishedProduct(req.params.slug);
    const rows = await prisma.review.findMany({
      where: { productId: product.id, hidden: false },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const count = rows.length;
    const average = count ? Math.round((rows.reduce((n, r) => n + r.rating, 0) / count) * 10) / 10 : 0;

    let mine: { rating: number; comment: string; hidden: boolean } | null = null;
    let canReview = false;
    if (req.user) {
      const own = await prisma.review.findUnique({
        where: { productId_userId: { productId: product.id, userId: req.user.sub } },
      });
      if (own) mine = { rating: own.rating, comment: own.comment, hidden: own.hidden };
      canReview = await hasCompletedOrder(req.user.sub, product.id);
    }

    res.json({
      average,
      count,
      canReview,
      mine,
      reviews: rows.map((r) => ({
        id: r.id,
        name: publicName(r.user.name),
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
    });
  })
);

const reviewSchema = z.object({
  rating: z.number().int().min(1, "Pilih rating 1 sampai 5.").max(5, "Pilih rating 1 sampai 5."),
  comment: z.string().trim().min(3, "Tulis ulasan minimal 3 karakter.").max(500, "Ulasan maksimal 500 karakter."),
});

// Creates the review, or updates the buyer's existing one.
reviewsRouter.post(
  "/:slug/reviews",
  requireUser,
  ah(async (req, res) => {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(parsed.error.issues[0].message);
    const product = await publishedProduct(req.params.slug);
    const userId = req.user!.sub;
    if (!(await hasCompletedOrder(userId, product.id))) {
      throw new HttpError("Ulasan hanya bisa ditulis setelah pesanan produk ini selesai.", 403);
    }
    const review = await prisma.review.upsert({
      where: { productId_userId: { productId: product.id, userId } },
      create: { productId: product.id, userId, ...parsed.data },
      update: parsed.data,
    });
    res.status(201).json({ id: review.id, rating: review.rating, comment: review.comment });
  })
);
