import { Router } from "express";
import { ah, HttpError } from "../lib/asyncHandler";
import { prisma } from "../lib/prisma";
import { productInclude, productStats, serializeProduct } from "../lib/productSerialize";
import { requireUser } from "../middleware/auth";

export const wishlistRouter = Router();

wishlistRouter.use(requireUser);

// Published products only; a hidden product simply drops out of the list.
wishlistRouter.get(
  "/",
  ah(async (req, res) => {
    const rows = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.sub, product: { published: true } },
      include: { product: { include: productInclude } },
      orderBy: { createdAt: "desc" },
    });
    const stats = await productStats();
    res.json(rows.map((r) => serializeProduct(r.product, stats(r.productId))));
  })
);

wishlistRouter.put(
  "/:slug",
  ah(async (req, res) => {
    const product = await prisma.product.findFirst({ where: { slug: req.params.slug, published: true } });
    if (!product) throw new HttpError("Produk tidak ditemukan.", 404);
    const userId = req.user!.sub;
    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId: product.id } },
      create: { userId, productId: product.id },
      update: {},
    });
    res.status(204).end();
  })
);

wishlistRouter.delete(
  "/:slug",
  ah(async (req, res) => {
    const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
    if (product) {
      await prisma.wishlistItem.deleteMany({ where: { userId: req.user!.sub, productId: product.id } });
    }
    res.status(204).end();
  })
);
