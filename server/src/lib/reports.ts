import type { Order, OrderItem } from "@prisma/client";

export const RANGE_KEYS = ["1d", "7d", "1m", "3m", "6m", "9m", "1y"] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];
export type Granularity = "hour" | "day" | "week" | "month";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
// Asia/Jakarta is UTC+7 all year (no daylight saving).
const OFFSET = 7 * HOUR;

type Period = {
  granularity: Granularity;
  starts: number[]; // real UTC ms, one entry per bucket
  start: number;
  prevStart: number;
};

const jakartaMidnight = (now: number) => Math.floor((now + OFFSET) / DAY) * DAY - OFFSET;

function monthStart(now: number, monthsBack: number) {
  const s = new Date(now + OFFSET);
  return Date.UTC(s.getUTCFullYear(), s.getUTCMonth() - monthsBack, 1) - OFFSET;
}

export function periodFor(range: RangeKey, now: number): Period {
  const today = jakartaMidnight(now);
  const build = (count: number, size: number, last: number) =>
    Array.from({ length: count }, (_, i) => last - (count - 1 - i) * size);

  switch (range) {
    case "1d": {
      const hour = Math.floor((now + OFFSET) / HOUR) * HOUR - OFFSET;
      const starts = build(24, HOUR, hour);
      return { granularity: "hour", starts, start: starts[0], prevStart: starts[0] - 24 * HOUR };
    }
    case "7d": {
      const starts = build(7, DAY, today);
      return { granularity: "day", starts, start: starts[0], prevStart: starts[0] - 7 * DAY };
    }
    case "1m": {
      const starts = build(30, DAY, today);
      return { granularity: "day", starts, start: starts[0], prevStart: starts[0] - 30 * DAY };
    }
    case "3m": {
      // 13 weekly buckets of 7 days, the last one ending today.
      const starts = build(13, 7 * DAY, today - 6 * DAY);
      return { granularity: "week", starts, start: starts[0], prevStart: starts[0] - 91 * DAY };
    }
    default: {
      const months = range === "6m" ? 6 : range === "9m" ? 9 : 12;
      const starts = Array.from({ length: months }, (_, i) => monthStart(now, months - 1 - i));
      return { granularity: "month", starts, start: starts[0], prevStart: monthStart(now, months * 2 - 1) };
    }
  }
}

type OrderWithItems = Order & { items: OrderItem[] };

const pctChange = (current: number, previous: number) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;

export function buildSalesReport(range: RangeKey, orders: OrderWithItems[], now = Date.now()) {
  const period = periodFor(range, now);
  const inCurrent = orders.filter((o) => o.createdAt.getTime() >= period.start);
  const inPrevious = orders.filter(
    (o) => o.createdAt.getTime() >= period.prevStart && o.createdAt.getTime() < period.start
  );

  const counted = (list: OrderWithItems[]) => list.filter((o) => o.status !== "CANCELLED");
  const revenueOf = (list: OrderWithItems[]) => counted(list).reduce((sum, o) => sum + o.total, 0);

  const buckets = period.starts.map((s) => ({ start: new Date(s).toISOString(), revenue: 0, orders: 0 }));
  for (const o of counted(inCurrent)) {
    const t = o.createdAt.getTime();
    let idx = period.starts.length - 1;
    while (idx > 0 && t < period.starts[idx]) idx -= 1;
    buckets[idx].revenue += o.total;
    buckets[idx].orders += 1;
  }

  const sold = new Map<string, { name: string; qty: number; revenue: number }>();
  let itemsSold = 0;
  for (const o of counted(inCurrent)) {
    for (const item of o.items) {
      const row = sold.get(item.productName) ?? { name: item.productName, qty: 0, revenue: 0 };
      row.qty += item.qty;
      row.revenue += item.price * item.qty;
      sold.set(item.productName, row);
      itemsSold += item.qty;
    }
  }

  const byStatus: Record<string, number> = { PENDING: 0, PAID: 0, SHIPPED: 0, COMPLETED: 0, CANCELLED: 0 };
  for (const o of inCurrent) byStatus[o.status] += 1;

  const revenue = revenueOf(inCurrent);
  const orderCount = counted(inCurrent).length;
  const prevRevenue = revenueOf(inPrevious);
  const prevOrders = counted(inPrevious).length;

  return {
    range,
    granularity: period.granularity,
    from: new Date(period.start).toISOString(),
    buckets,
    summary: {
      revenue,
      orders: orderCount,
      averageOrder: orderCount > 0 ? Math.round(revenue / orderCount) : 0,
      itemsSold,
      cancelled: byStatus.CANCELLED,
      previousRevenue: prevRevenue,
      previousOrders: prevOrders,
      revenueChange: pctChange(revenue, prevRevenue),
      ordersChange: pctChange(orderCount, prevOrders),
    },
    byStatus,
    topProducts: [...sold.values()].sort((a, b) => b.qty - a.qty || b.revenue - a.revenue).slice(0, 5),
  };
}

// Spreadsheet apps run cells that start with these characters as formulas.
const csvCell = (value: string | number) => {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const jakartaStamp = (d: Date) => new Date(d.getTime() + OFFSET).toISOString().slice(0, 16).replace("T", " ");

export function salesCsv(range: RangeKey, orders: OrderWithItems[], now = Date.now()) {
  const { start } = periodFor(range, now);
  const rows = orders.filter((o) => o.createdAt.getTime() >= start);
  const header = [
    "Nomor pesanan",
    "Tanggal (WIB)",
    "Pelanggan",
    "Telepon",
    "Kota",
    "Metode bayar",
    "Status",
    "Subtotal",
    "Ongkir",
    "Total",
    "Item",
  ];
  const lines = rows.map((o) =>
    [
      o.orderNumber,
      jakartaStamp(o.createdAt),
      o.customerName,
      o.phone,
      o.city,
      o.paymentMethod,
      o.status,
      o.subtotal,
      o.shipping,
      o.total,
      o.items.map((i) => `${i.productName} (${i.size}) x${i.qty}`).join("; "),
    ]
      .map(csvCell)
      .join(",")
  );
  // BOM so Excel reads the file as UTF-8.
  return "﻿" + [header.map(csvCell).join(","), ...lines].join("\r\n") + "\r\n";
}

export const jakartaDateStamp = (now = Date.now()) => new Date(now + OFFSET).toISOString().slice(0, 10);
