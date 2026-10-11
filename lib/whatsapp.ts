import { formatPrice, type OrderResult } from "@/lib/api";

// The shop's WhatsApp number is set by the admin (Admin > Pengaturan) and read
// through SettingsContext; this builds the wa.me link for a given number.
export function buildWaLink(number: string, text: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export const PAYMENT_LABELS: Record<string, string> = {
  transfer: "Transfer bank / QRIS",
  cod: "COD (bayar di tempat)",
  ewallet: "E-Wallet / QRIS",
};

type MessageOrder = Pick<
  OrderResult,
  "orderNumber" | "customerName" | "phone" | "address" | "city" | "postalCode" | "items" | "subtotal" | "shipping" | "total" | "paymentMethod"
>;

export function orderMessage(order: MessageOrder) {
  const lines = order.items.map(
    (i, n) => `${n + 1}. ${i.name} (${i.size}) x${i.qty} - ${formatPrice(i.price * i.qty)}`
  );
  const cod = order.paymentMethod === "cod";
  return [
    "Halo Courve! Saya ingin konfirmasi pesanan:",
    "",
    `*No. pesanan:* ${order.orderNumber}`,
    `*Nama:* ${order.customerName}`,
    `*No. HP:* ${order.phone}`,
    `*Alamat:* ${order.address}, ${order.city} ${order.postalCode}`,
    "",
    "*Pesanan:*",
    ...lines,
    "",
    `Subtotal: ${formatPrice(order.subtotal)}`,
    `Ongkos kirim: ${formatPrice(order.shipping)}`,
    `*Total: ${formatPrice(order.total)}*`,
    "",
    `*Pembayaran:* ${PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}`,
    cod ? "Mohon dikonfirmasi ya, terima kasih!" : "Mohon info nomor rekening / QRIS untuk pembayarannya. Terima kasih!",
  ].join("\n");
}
