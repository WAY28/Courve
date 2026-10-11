import { Router } from "express";
import { z } from "zod";
import { ah, HttpError } from "../lib/asyncHandler";
import { insensitive } from "../lib/dbMode";
import { prisma } from "../lib/prisma";
import { productInclude, serializeProduct, productStats } from "../lib/productSerialize";
import { requireAdmin } from "../middleware/auth";
import { deleteUnreferencedUploads } from "./uploads";

export const productsRouter = Router();

// Public catalogue: only published products are visible.
productsRouter.get(
  "/",
  ah(async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const category = typeof req.query.category === "string" ? req.query.category : undefined;

    const products = await prisma.product.findMany({
      where: {
        published: true,
        ...(search ? { name: { contains: search, ...insensitive } } : {}),
        ...(category ? { category } : {}),
      },
      include: productInclude,
      orderBy: { createdAt: "desc" },
    });
    const stats = await productStats();
    res.json(products.map((p) => serializeProduct(p, stats(p.id))));
  })
);

productsRouter.get(
  "/:slug",
  ah(async (req, res) => {
    const product = await prisma.product.findFirst({
      where: { slug: req.params.slug, published: true },
      include: productInclude,
    });
    if (!product) return res.status(404).json({ error: "Produk tidak ditemukan." });
    const stats = await productStats();
    res.json(serializeProduct(product, stats(product.id)));
  })
);

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung.");

// Only photos from the project's image folder or uploaded through the admin.
const imagePath = z
  .string()
  .regex(/^(\/images\/products\/[\w.-]+|\/uploads\/[\w-]+)$/, "Path gambar tidak valid.");

const sizeInput = z.object({
  size: z.string().trim().min(1, "Nama ukuran wajib diisi.").max(10),
  stock: z.number({ message: "Stok harus berupa angka." }).int().min(0, "Stok tidak boleh negatif.").max(1_000_000),
});

const productSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1, "Nama produk wajib diisi.").max(150),
  description: z.string().trim().min(1, "Deskripsi wajib diisi.").max(5000),
  price: z.number().int().positive("Harga harus lebih dari 0.").max(1_000_000_000),
  oldPrice: z.number().int().positive().max(1_000_000_000).nullable().optional(),
  category: z.string().trim().min(1, "Kategori wajib diisi.").max(60),
  material: z.string().trim().min(1, "Bahan wajib diisi.").max(60),
  colorway: z.string().trim().min(1, "Warna/motif wajib diisi.").max(60),
  sizes: z
    .array(sizeInput)
    .min(1, "Minimal satu ukuran.")
    .max(20)
    .refine((list) => new Set(list.map((s) => s.size.toUpperCase())).size === list.length, "Nama ukuran tidak boleh kembar."),
  images: z.array(imagePath).min(1, "Minimal satu foto.").max(8),
  published: z.boolean().optional(),
});

const updateSchema = productSchema.omit({ slug: true }).partial();

productsRouter.post(
  "/",
  requireAdmin,
  ah(async (req, res) => {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(parsed.error.issues[0].message);
    const { sizes, images, published, ...rest } = parsed.data;

    if (rest.oldPrice != null && rest.oldPrice <= rest.price) {
      throw new HttpError("Harga coret harus lebih besar dari harga jual.");
    }
    if (await prisma.product.findUnique({ where: { slug: rest.slug } })) {
      throw new HttpError("Slug produk sudah dipakai.", 409);
    }

    const product = await prisma.product.create({
      data: {
        ...rest,
        oldPrice: rest.oldPrice ?? null,
        imagesJson: JSON.stringify(images),
        published: published ?? true,
        sizes: { create: sizes.map((s) => ({ size: s.size, stock: s.stock })) },
      },
      include: productInclude,
    });
    res.status(201).json(serializeProduct(product));
  })
);

productsRouter.put(
  "/:slug",
  requireAdmin,
  ah(async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(parsed.error.issues[0].message);
    const { sizes, images, published, ...rest } = parsed.data;

    const existing = await prisma.product.findUnique({ where: { slug: req.params.slug } });
    if (!existing) throw new HttpError("Produk tidak ditemukan.", 404);

    const price = rest.price ?? existing.price;
    const oldPrice = rest.oldPrice === undefined ? existing.oldPrice : rest.oldPrice;
    if (oldPrice != null && oldPrice <= price) {
      throw new HttpError("Harga coret harus lebih besar dari harga jual.");
    }

    await prisma.$transaction(async (tx) => {
      if (sizes) {
        await tx.productSize.deleteMany({
          where: { productId: existing.id, size: { notIn: sizes.map((s) => s.size) } },
        });
        for (const s of sizes) {
          await tx.productSize.upsert({
            where: { productId_size: { productId: existing.id, size: s.size } },
            update: { stock: s.stock },
            create: { productId: existing.id, size: s.size, stock: s.stock },
          });
        }
      }
      await tx.product.update({
        where: { id: existing.id },
        data: {
          ...rest,
          ...(images ? { imagesJson: JSON.stringify(images) } : {}),
          ...(published !== undefined ? { published } : {}),
        },
      });
    });

    if (images) {
      const removed = (JSON.parse(existing.imagesJson) as string[]).filter((u) => !images.includes(u));
      await deleteUnreferencedUploads(removed);
    }

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: existing.id },
      include: productInclude,
    });
    res.json(serializeProduct(product));
  })
);

productsRouter.delete(
  "/:slug",
  requireAdmin,
  ah(async (req, res) => {
    const existing = await prisma.product.findUnique({ where: { slug: req.params.slug } });
    if (!existing) throw new HttpError("Produk tidak ditemukan.", 404);

    await prisma.product.delete({ where: { id: existing.id } });
    await deleteUnreferencedUploads(JSON.parse(existing.imagesJson) as string[]);
    res.status(204).send();
  })
);
