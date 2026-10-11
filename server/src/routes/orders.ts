import { Router } from "express";
import { z } from "zod";
import type { Order, OrderItem } from "@prisma/client";
import { ah, HttpError } from "../lib/asyncHandler";
import { prisma } from "../lib/prisma";
import { insensitive } from "../lib/dbMode";
import { createLimiter } from "../lib/rateLimit";
import { optionalAuth, requireAdmin, requireUser } from "../middleware/auth";

export const ordersRouter = Router();

const SHIPPING_FEE = 15000;

export const ORDER_STATUSES = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

// A shipped order cannot be cancelled (stock has left the warehouse), and
// COMPLETED / CANCELLED are final.
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(1).max(100),
    phone: z.string().trim().min(6).max(20),
    address: z.string().trim().min(1).max(500),
    city: z.string().trim().min(1).max(100),
    postalCode: z.string().trim().min(1).max(10),
  }),
  paymentMethod: z.enum(["transfer", "cod", "ewallet"]),
  // Subtotal the buyer saw; the order is refused if prices changed meanwhile.
  expectedSubtotal: z.number().int().nonnegative().optional(),
  items: z
    .array(
      z.object({
        slug: z.string().min(1).max(80),
        size: z.string().min(1).max(10),
        qty: z.number().int().positive().max(100),
      })
    )
    .min(1)
    .max(50),
});

const formatRupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function restock(tx: Tx, items: OrderItem[]) {
  for (const item of items) {
    if (item.productId == null) continue;
    await tx.productSize.updateMany({
      where: { productId: item.productId, size: item.size },
      data: { stock: { increment: item.qty } },
    });
  }
}

type OrderWithItems = Order & { items: OrderItem[] };

function serializeOrder(order: OrderWithItems) {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    allowedStatuses: STATUS_TRANSITIONS[order.status as OrderStatus] ?? [],
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    city: order.city,
    postalCode: order.postalCode,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    createdAt: order.createdAt,
    items: order.items.map((i) => ({
      name: i.productName,
      price: i.price,
      size: i.size,
      qty: i.qty,
    })),
  };
}

// Prices are always re-read from the database and stock is decremented with a
// conditional update inside one transaction, so two buyers can never both take
// the last item and a tampered request cannot change what gets charged.
ordersRouter.post(
  "/",
  optionalAuth,
  ah(async (req, res) => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(parsed.error.issues[0].message);
    const { customer, paymentMethod, items, expectedSubtotal } = parsed.data;

    const wanted = new Map<string, { slug: string; size: string; qty: number }>();
    for (const item of items) {
      const key = `${item.slug}|${item.size}`;
      const prev = wanted.get(key);
      wanted.set(key, { ...item, qty: (prev?.qty ?? 0) + item.qty });
    }

    const order = await prisma.$transaction(async (tx) => {
      const slugs = [...new Set(items.map((i) => i.slug))];
      const products = await tx.product.findMany({
        where: { slug: { in: slugs }, published: true },
        include: { sizes: true },
      });
      const bySlug = new Map(products.map((p) => [p.slug, p]));

      let subtotal = 0;
      const lines: { productId: number; productName: string; price: number; size: string; qty: number }[] = [];

      for (const w of wanted.values()) {
        const product = bySlug.get(w.slug);
        if (!product) {
          throw new HttpError("Ada produk di keranjang yang sudah tidak dijual. Hapus dari keranjang lalu coba lagi.", 409);
        }
        const sizeRow = product.sizes.find((s) => s.size === w.size);
        if (!sizeRow) throw new HttpError(`Ukuran ${w.size} tidak tersedia untuk ${product.name}.`);

        const taken = await tx.productSize.updateMany({
          where: { id: sizeRow.id, stock: { gte: w.qty } },
          data: { stock: { decrement: w.qty } },
        });
        if (taken.count === 0) {
          const fresh = await tx.productSize.findUnique({ where: { id: sizeRow.id } });
          throw new HttpError(
            fresh && fresh.stock > 0
              ? `Stok ${product.name} ukuran ${w.size} tinggal ${fresh.stock}.`
              : `${product.name} ukuran ${w.size} sudah habis.`,
            409
          );
        }
        subtotal += product.price * w.qty;
        lines.push({ productId: product.id, productName: product.name, price: product.price, size: w.size, qty: w.qty });
      }

      if (expectedSubtotal !== undefined && expectedSubtotal !== subtotal) {
        throw new HttpError(
          `Harga produk berubah. Subtotal terbaru ${formatRupiah(subtotal)}. Periksa lagi pesananmu lalu coba kirim ulang.`,
          409
        );
      }

      return tx.order.create({
        data: {
          orderNumber: `PY-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`,
          customerName: customer.name,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          postalCode: customer.postalCode,
          paymentMethod,
          subtotal,
          shipping: SHIPPING_FEE,
          total: subtotal + SHIPPING_FEE,
          userId: req.user?.sub ?? null,
          items: { create: lines },
        },
        include: { items: true },
      });
    });

    res.status(201).json(serializeOrder(order));
  })
);

ordersRouter.get(
  "/mine",
  requireUser,
  ah(async (req, res) => {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.sub },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders.map(serializeOrder));
  })
);

// Customers may cancel their own order while it is still unpaid.
ordersRouter.post(
  "/:orderNumber/cancel",
  requireUser,
  ah(async (req, res) => {
    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { orderNumber: req.params.orderNumber },
        include: { items: true },
      });
      if (!order || order.userId !== req.user!.sub) throw new HttpError("Pesanan tidak ditemukan.", 404);
      if (order.status !== "PENDING") {
        throw new HttpError("Pesanan yang sudah dibayar tidak bisa dibatalkan sendiri. Hubungi admin lewat WhatsApp.", 409);
      }
      await restock(tx, order.items);
      return tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" }, include: { items: true } });
    });
    res.json(serializeOrder(updated));
  })
);

const trackLimiter = createLimiter({ max: 20, windowMs: 15 * 60 * 1000 });
const trackSchema = z.object({
  orderNumber: z.string().trim().min(1).max(40),
  phone: z.string().trim().min(6).max(20),
});

// Compare phones by digits only, treating 08xx and +628xx as the same number.
const normalizePhone = (p: string) => p.replace(/\D/g, "").replace(/^62/, "0");

// Guests track an order with order number + the phone number used at checkout.
// Address and phone are never returned, and every miss gives the same answer.
ordersRouter.post(
  "/track",
  ah(async (req, res) => {
    const ip = req.ip ?? "unknown";
    const wait = trackLimiter.blockedFor(ip);
    if (wait > 0) {
      res.set("Retry-After", String(wait));
      throw new HttpError("Terlalu banyak percobaan. Coba lagi nanti.", 429);
    }
    const parsed = trackSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError("Isi nomor pesanan dan nomor HP.");
    trackLimiter.hit(ip);

    const order = await prisma.order.findUnique({
      where: { orderNumber: parsed.data.orderNumber.toUpperCase() },
      include: { items: true },
    });
    if (!order || normalizePhone(order.phone) !== normalizePhone(parsed.data.phone)) {
      throw new HttpError("Pesanan tidak ditemukan. Periksa nomor pesanan dan nomor HP.", 404);
    }
    const { phone: _phone, address: _address, postalCode: _postal, allowedStatuses: _allowed, ...safe } = serializeOrder(order);
    res.json(safe);
  })
);

const listQuery = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

// Admin: search by order number / customer / phone, filter by status, paginate.
ordersRouter.get(
  "/",
  requireAdmin,
  ah(async (req, res) => {
    const parsed = listQuery.safeParse(req.query);
    if (!parsed.success) throw new HttpError("Parameter pencarian tidak valid.");
    const { status, q, page, pageSize } = parsed.data;

    const search = q
      ? {
          OR: [
            { orderNumber: { contains: q, ...insensitive } },
            { customerName: { contains: q, ...insensitive } },
            { phone: { contains: q } },
          ],
        }
      : {};
    const where = { ...search, ...(status ? { status } : {}) };

    const [orders, total, grouped] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
      prisma.order.groupBy({ by: ["status"], where: search, _count: { _all: true } }),
    ]);

    const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
    for (const g of grouped) counts[g.status as OrderStatus] = g._count._all;

    res.json({
      orders: orders.map(serializeOrder),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      counts,
    });
  })
);

const statusSchema = z.object({ status: z.enum(ORDER_STATUSES) });

ordersRouter.patch(
  "/:orderNumber/status",
  requireAdmin,
  ah(async (req, res) => {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError("Status tidak valid.");
    const next = parsed.data.status;

    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { orderNumber: req.params.orderNumber },
        include: { items: true },
      });
      if (!order) throw new HttpError("Pesanan tidak ditemukan.", 404);

      const allowed = STATUS_TRANSITIONS[order.status as OrderStatus] ?? [];
      if (!allowed.includes(next)) {
        throw new HttpError(`Status tidak bisa diubah dari ${order.status} ke ${next}.`, 409);
      }

      // Cancelling returns the reserved stock (CANCELLED is final, so this
      // can only happen once per order).
      if (next === "CANCELLED") await restock(tx, order.items);

      return tx.order.update({
        where: { id: order.id },
        data: { status: next },
        include: { items: true },
      });
    });

    res.json(serializeOrder(updated));
  })
);
