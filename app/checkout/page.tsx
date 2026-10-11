"use client";

import Image from "@/components/ProductImage";
import Link from "next/link";
import { useEffect, useState } from "react";
import CartNotices from "@/components/CartNotices";
import { CheckIcon } from "@/components/Icons";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { createOrder, formatPrice, type OrderResult } from "@/lib/api";
import { useWhatsApp } from "@/context/SettingsContext";
import { orderMessage } from "@/lib/whatsapp";

const SHIPPING_FEE = 15000;

const paymentMethods = [
  {
    id: "transfer",
    label: "Transfer bank / QRIS",
    hint: "Nomor rekening atau QRIS dikirim admin lewat WhatsApp.",
  },
  {
    id: "cod",
    label: "Bayar di tempat (COD)",
    hint: "Bayar tunai ke kurir saat pesanan sampai.",
  },
] as const;

const REDIRECT_SECONDS = 5;

type PaymentId = (typeof paymentMethods)[number]["id"];

function Steps({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Keranjang", "Pengiriman & pembayaran", "Selesai"];
  return (
    <ol className="flex items-center gap-2 text-sm" aria-label="Langkah checkout">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                done || active ? "bg-accent text-white" : "bg-border text-muted"
              }`}
            >
              {done ? <CheckIcon size={14} /> : n}
            </span>
            <span className={`${active ? "font-semibold text-foreground" : "text-muted"} ${active ? "" : "hidden sm:inline"}`}>
              {label}
            </span>
            {n < steps.length && <span className="mx-1 h-px w-6 bg-border sm:w-10" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

export default function CheckoutPage() {
  const { items, hydrated, dispatch, refresh } = useCart();
  const { token, user } = useAuth();
  const [payment, setPayment] = useState<PaymentId>("transfer");
  const [nameInput, setNameInput] = useState<string | null>(null);
  const [form, setForm] = useState({ phone: "", address: "", city: "", postalCode: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const wa = useWhatsApp();

  useEffect(() => {
    if (hydrated && !order) refresh();
  }, [hydrated, order, refresh]);

  // After an order is placed, send the buyer to the shop's WhatsApp with the
  // order details prefilled (they can cancel the automatic redirect).
  const waUrl = order ? (wa.link(orderMessage(order)) ?? "") : "";
  useEffect(() => {
    if (countdown === null) return;
    if (!waUrl) return;
    if (countdown <= 0) {
      window.location.assign(waUrl);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown, waUrl]);

  const name = nameInput ?? user?.name ?? "";
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shipping = items.length > 0 ? SHIPPING_FEE : 0;
  const total = subtotal + shipping;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createOrder(
      {
        customer: { name, ...form },
        paymentMethod: payment,
        expectedSubtotal: subtotal,
        items: items.map((i) => ({ slug: i.slug, size: i.size, qty: i.qty })),
      },
      token
    );

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      refresh();
      return;
    }
    setOrder(result.data);
    setCountdown(wa.number ? REDIRECT_SECONDS : null);
    dispatch({ type: "CLEAR" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 sm:px-6">
        <div className="mb-8 flex justify-center">
          <Steps current={3} />
        </div>
        <div className="card p-8 text-center sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage text-sage-dark">
            <CheckIcon size={32} />
          </span>
          <h1 className="font-display mt-5 text-3xl font-bold tracking-tight">Pesanan berhasil dibuat</h1>
          <p className="mt-2 text-sm text-muted">Terima kasih, {order.customerName}!</p>
          {!waUrl ? (
            <p className="mt-4 rounded-xl bg-secondary-soft px-4 py-3 text-sm font-medium text-secondary-dark">
              Pesananmu sudah tersimpan. Simpan nomor pesanan di bawah dan hubungi admin toko untuk pembayaran;
              nomor WhatsApp toko belum diatur di sistem.
            </p>
          ) : (
          <>
          <p className="mt-4 rounded-xl bg-accent-tint px-4 py-3 text-sm font-medium">
            Satu langkah lagi: kirim detail pesananmu ke WhatsApp admin untuk{" "}
            {order.paymentMethod === "cod" ? "konfirmasi pesanan" : "mendapatkan nomor rekening / QRIS dan konfirmasi pembayaran"}.
          </p>
          <div className="mt-4 flex flex-col items-center gap-2">
            <a href={waUrl} className="btn-primary w-full sm:w-auto">
              Kirim pesanan ke WhatsApp
            </a>
            {countdown !== null && (
              <p className="text-sm text-muted" role="status">
                Mengalihkan ke WhatsApp dalam {countdown} detik…{" "}
                <button
                  type="button"
                  onClick={() => setCountdown(null)}
                  className="font-semibold text-accent-dark underline underline-offset-4"
                >
                  Tetap di halaman ini
                </button>
              </p>
            )}
          </div>
          </>
          )}

          <div className="mt-6 rounded-2xl bg-accent-tint p-5 text-left text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Nomor pesanan</span>
              <span className="font-mono font-semibold">{order.orderNumber}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-muted">Status</span>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-3 border-t border-border pt-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between py-1">
                  <span>
                    {item.name} ({item.size}) × {item.qty}
                  </span>
                  <span>{formatPrice(item.price * item.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 text-muted">
                <span>Ongkos kirim</span>
                <span>{formatPrice(order.shipping)}</span>
              </div>
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-3 text-base font-bold">
              <span>Total</span>
              <span className="text-accent-dark">{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {token && (
              <Link href="/akun" className="btn-outline">
                Lihat pesanan saya
              </Link>
            )}
            <Link href="/lacak" className="btn-outline">
              Lacak pesanan
            </Link>
            <Link href="/katalog" className="btn-outline">
              Lanjut belanja
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (hydrated && items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-2xl font-bold">Keranjang masih kosong</h1>
        <p className="mt-2 text-sm text-muted">Tambahkan produk dulu sebelum checkout.</p>
        <Link href="/katalog" className="btn-primary mt-7">
          Lihat katalog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Steps current={2} />
      <h1 className="font-display mt-6 text-3xl font-bold tracking-tight">Checkout</h1>
      <CartNotices />

      <form onSubmit={handleSubmit} className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <section className="card p-6" aria-labelledby="alamat">
            <h2 id="alamat" className="font-display text-xl font-bold">
              Alamat pengiriman
            </h2>
            {!user && (
              <p className="mt-1 text-sm text-muted">
                Sudah punya akun?{" "}
                <Link href="/masuk?next=/checkout" className="font-semibold text-accent-dark hover:underline">
                  Masuk
                </Link>{" "}
                agar pesanan tersimpan di riwayatmu.
              </p>
            )}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="label">
                  Nama lengkap
                </label>
                <input
                  id="name"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="phone" className="label">
                  Nomor HP
                </label>
                <input
                  id="phone"
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  minLength={6}
                  placeholder="08xxxxxxxxxx"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="field"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="address" className="label">
                  Alamat lengkap
                </label>
                <textarea
                  id="address"
                  required
                  rows={3}
                  autoComplete="street-address"
                  placeholder="Nama jalan, nomor rumah, RT/RW, kecamatan"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="city" className="label">
                  Kota
                </label>
                <input
                  id="city"
                  required
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="postal" className="label">
                  Kode pos
                </label>
                <input
                  id="postal"
                  required
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  className="field"
                />
              </div>
            </div>
          </section>

          <fieldset className="card p-6">
            <legend className="sr-only">Metode pembayaran</legend>
            <h2 className="font-display text-xl font-bold" aria-hidden="true">
              Metode pembayaran
            </h2>
            <div className="mt-5 flex flex-col gap-3">
              {paymentMethods.map((m) => (
                <label key={m.id} className="cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value={m.id}
                    checked={payment === m.id}
                    onChange={() => setPayment(m.id)}
                    className="peer sr-only"
                  />
                  <span className="flex min-h-14 items-center gap-3 rounded-xl border border-input px-4 text-sm font-medium transition-colors peer-checked:border-accent peer-checked:bg-accent-tint peer-checked:ring-1 peer-checked:ring-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        payment === m.id ? "border-accent" : "border-input"
                      }`}
                      aria-hidden="true"
                    >
                      {payment === m.id && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
                    </span>
                    <span>
                      {m.label}
                      <span className="block text-xs font-normal text-muted">{m.hint}</span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-secondary/40 bg-secondary-soft px-4 py-3 text-sm font-medium text-secondary-dark"
            >
              {error}
            </div>
          )}
        </div>

        <aside className="card p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-xl font-bold">Ringkasan pesanan</h2>
          <ul className="mt-5 flex flex-col gap-4">
            {items.map((item) => (
              <li key={`${item.slug}-${item.size}`} className="flex gap-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-accent-soft">
                  <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />
                  <span className="absolute -right-0 -top-0 flex h-5 min-w-5 items-center justify-center rounded-bl-lg bg-foreground px-1 text-[11px] font-bold text-white">
                    {item.qty}
                  </span>
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-medium leading-snug">{item.name}</div>
                  <div className="text-xs text-muted">Ukuran {item.size}</div>
                </div>
                <div className="text-sm font-medium">{formatPrice(item.price * item.qty)}</div>
              </li>
            ))}
          </ul>
          <dl className="mt-5 flex flex-col gap-3 border-t border-border pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Ongkos kirim</dt>
              <dd className="font-medium">{formatPrice(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-4 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-display text-2xl font-bold text-accent-dark">{formatPrice(total)}</dd>
            </div>
          </dl>
          <button type="submit" disabled={submitting || items.length === 0} className="btn-primary mt-6 w-full">
            {submitting ? "Memproses..." : "Buat pesanan"}
          </button>
          <p className="mt-3 text-center text-xs text-muted">
            Setelah pesanan dibuat, kamu diarahkan ke WhatsApp admin untuk konfirmasi.
          </p>
        </aside>
      </form>
    </div>
  );
}
