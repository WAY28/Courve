import type { OrderStatus } from "@/lib/api";

export const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Menunggu Pembayaran",
  PAID: "Sudah Dibayar",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const statusStyles: Record<OrderStatus, string> = {
  PENDING: "bg-secondary-soft text-secondary-dark",
  PAID: "bg-accent-soft text-accent-dark",
  SHIPPED: "bg-accent-soft text-accent-dark",
  COMPLETED: "bg-sage text-sage-dark",
  CANCELLED: "bg-border text-muted",
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
