import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { Router } from "express";
import { z } from "zod";
import { ah, HttpError } from "../lib/asyncHandler";
import { prisma } from "../lib/prisma";
import { LOW_STOCK_THRESHOLD, productInclude, serializeProduct, productStats } from "../lib/productSerialize";
import { buildSalesReport, jakartaDateStamp, periodFor, RANGE_KEYS, salesCsv } from "../lib/reports";
import { getWhatsappNumber, normalizeWhatsapp, setWhatsappNumber } from "../lib/settings";
import { insensitive } from "../lib/dbMode";
import { requireAdmin } from "../middleware/auth";
import { ORDER_STATUSES } from "./orders";
import { adminUploadRouter } from "./uploads";

export const adminRouter = Router();

adminRouter.use("/uploads", adminUploadRouter);
adminRouter.use(requireAdmin);

// All products, including hidden ones, with per-size stock.
adminRouter.get(
  "/products",
  ah(async (_req, res) => {
    const products = await prisma.product.findMany({
      include: productInclude,
      orderBy: { createdAt: "desc" },
    });
    const stats = await productStats();
    res.json(products.map((p) => serializeProduct(p, stats(p.id))));
  })
);

// Store-wide numbers that do not depend on a time range.
adminRouter.get(
  "/stats",
  ah(async (_req, res) => {
    const [byStatusRows, revenueRow, customers, products, lowStockRows] = await Promise.all([
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { total: true } }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.product.count(),
      prisma.productSize.findMany({
        where: { stock: { lte: LOW_STOCK_THRESHOLD } },
        include: { product: { select: { name: true, slug: true, published: true } } },
        orderBy: [{ stock: "asc" }, { id: "asc" }],
      }),
    ]);

    const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<string, number>;
    for (const row of byStatusRows) byStatus[row.status] = row._count._all;

    res.json({
      totals: {
        orders: Object.values(byStatus).reduce((a, b) => a + b, 0),
        needsAction: byStatus.PENDING + byStatus.PAID,
        revenue: revenueRow._sum.total ?? 0,
        customers,
        products,
        outOfStock: lowStockRows.filter((r) => r.stock === 0).length,
      },
      byStatus,
      lowStock: lowStockRows.slice(0, 10).map((r) => ({
        product: r.product.name,
        slug: r.product.slug,
        size: r.size,
        stock: r.stock,
        published: r.product.published,
      })),
      lowStockThreshold: LOW_STOCK_THRESHOLD,
    });
  })
);

const reportQuery = z.object({ range: z.enum(RANGE_KEYS).default("7d") });

async function ordersForRange(range: (typeof RANGE_KEYS)[number]) {
  const { prevStart } = periodFor(range, Date.now());
  return prisma.order.findMany({
    where: { createdAt: { gte: new Date(prevStart) } },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });
}

// Sales report for a time range, compared with the period just before it.
adminRouter.get(
  "/reports/sales",
  ah(async (req, res) => {
    const parsed = reportQuery.safeParse(req.query);
    if (!parsed.success) throw new HttpError("Rentang laporan tidak valid.");
    const { range } = parsed.data;
    res.json(buildSalesReport(range, await ordersForRange(range)));
  })
);

adminRouter.get(
  "/reports/sales.csv",
  ah(async (req, res) => {
    const parsed = reportQuery.safeParse(req.query);
    if (!parsed.success) throw new HttpError("Rentang laporan tidak valid.");
    const { range } = parsed.data;
    res.set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-penjualan-${range}-${jakartaDateStamp()}.csv"`,
    });
    res.send(salesCsv(range, await ordersForRange(range)));
  })
);

const usersQuery = z.object({ q: z.string().trim().max(100).optional() });

adminRouter.get(
  "/users",
  ah(async (req, res) => {
    const parsed = usersQuery.safeParse(req.query);
    if (!parsed.success) throw new HttpError("Parameter pencarian tidak valid.");
    const { q } = parsed.data;

    const users = await prisma.user.findMany({
      where: {
        role: "USER",
        ...(q ? { OR: [{ name: { contains: q, ...insensitive } }, { email: { contains: q, ...insensitive } }] } : {}),
      },
      select: { id: true, name: true, email: true, active: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const ids = users.map((u) => u.id);
    // Order count includes every order; money spent excludes cancelled ones.
    const [allOrders, paidOrders] = await Promise.all([
      prisma.order.groupBy({ by: ["userId"], where: { userId: { in: ids } }, _count: { _all: true } }),
      prisma.order.groupBy({
        by: ["userId"],
        where: { userId: { in: ids }, status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
    ]);
    const countByUser = new Map(allOrders.map((o) => [o.userId, o._count._all]));
    const spentByUser = new Map(paidOrders.map((o) => [o.userId, o._sum.total ?? 0]));

    res.json(
      users.map((u) => ({
        ...u,
        orders: countByUser.get(u.id) ?? 0,
        totalSpent: spentByUser.get(u.id) ?? 0,
      }))
    );
  })
);

const userPatch = z.object({ active: z.boolean() });

// Deactivated customers cannot sign in and their existing sessions stop working.
adminRouter.patch(
  "/users/:id",
  ah(async (req, res) => {
    const parsed = userPatch.safeParse(req.body);
    if (!parsed.success) throw new HttpError("Data tidak valid.");
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError("ID tidak valid.");

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new HttpError("Pengguna tidak ditemukan.", 404);
    if (target.role !== "USER") throw new HttpError("Hanya akun pelanggan yang bisa diubah di sini.", 403);

    const updated = await prisma.user.update({
      where: { id },
      data: { active: parsed.data.active },
      select: { id: true, name: true, email: true, active: true },
    });
    res.json(updated);
  })
);

// Customers have no email-based reset (no mail service), so they ask the shop
// over WhatsApp and the admin issues a one-time temporary password here.
adminRouter.post(
  "/users/:id/reset-password",
  ah(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError("ID tidak valid.");
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new HttpError("Pengguna tidak ditemukan.", 404);
    if (target.role !== "USER") throw new HttpError("Hanya akun pelanggan yang bisa direset di sini.", 403);

    const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = randomBytes(12);
    const temporaryPassword = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
    await prisma.user.update({
      where: { id },
      data: { passwordHash: await bcrypt.hash(temporaryPassword, 10) },
    });
    res.json({ email: target.email, temporaryPassword });
  })
);

// ---- Review moderation ----------------------------------------------------

adminRouter.get(
  "/reviews",
  ah(async (_req, res) => {
    const reviews = await prisma.review.findMany({
      include: { product: { select: { name: true, slug: true } }, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json(
      reviews.map((r) => ({
        id: r.id,
        product: r.product.name,
        slug: r.product.slug,
        customer: r.user.name,
        email: r.user.email,
        rating: r.rating,
        comment: r.comment,
        hidden: r.hidden,
        createdAt: r.createdAt,
      }))
    );
  })
);

adminRouter.patch(
  "/reviews/:id",
  ah(async (req, res) => {
    const parsed = z.object({ hidden: z.boolean() }).safeParse(req.body);
    const id = Number(req.params.id);
    if (!parsed.success || !Number.isInteger(id)) throw new HttpError("Data tidak valid.");
    const exists = await prisma.review.findUnique({ where: { id } });
    if (!exists) throw new HttpError("Ulasan tidak ditemukan.", 404);
    const updated = await prisma.review.update({ where: { id }, data: { hidden: parsed.data.hidden } });
    res.json({ id: updated.id, hidden: updated.hidden });
  })
);

adminRouter.delete(
  "/reviews/:id",
  ah(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError("ID tidak valid.");
    const exists = await prisma.review.findUnique({ where: { id } });
    if (!exists) throw new HttpError("Ulasan tidak ditemukan.", 404);
    await prisma.review.delete({ where: { id } });
    res.status(204).end();
  })
);

// ---- Shop settings ----------------------------------------------------------

adminRouter.get(
  "/settings",
  ah(async (_req, res) => {
    res.json({ whatsappNumber: await getWhatsappNumber() });
  })
);

adminRouter.put(
  "/settings",
  ah(async (req, res) => {
    const parsed = z.object({ whatsappNumber: z.string().trim().max(30) }).safeParse(req.body);
    if (!parsed.success) throw new HttpError("Data tidak valid.");
    const whatsappNumber = normalizeWhatsapp(parsed.data.whatsappNumber);
    await setWhatsappNumber(whatsappNumber);
    res.json({ whatsappNumber });
  })
);
