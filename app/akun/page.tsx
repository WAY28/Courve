"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import {
  cancelMyOrder,
  changePassword,
  formatPrice,
  getMyOrders,
  updateProfile,
  type OrderResult,
} from "@/lib/api";
import { useWhatsApp } from "@/context/SettingsContext";
import { orderMessage } from "@/lib/whatsapp";

function ProfileSettings() {
  const { user, token, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    const res = await updateProfile(token, name);
    setBusy(false);
    if (res.ok) {
      updateUser(res.data);
      setProfileMsg({ ok: true, text: "Nama berhasil diperbarui." });
    } else {
      setProfileMsg({ ok: false, text: res.error });
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    const res = await changePassword(token, { currentPassword: current, newPassword: next });
    setBusy(false);
    if (res.ok) {
      setCurrent("");
      setNext("");
      setPassMsg({ ok: true, text: "Password berhasil diganti." });
    } else {
      setPassMsg({ ok: false, text: res.error });
    }
  }

  const msgClass = (ok: boolean) =>
    `mt-3 text-sm font-medium ${ok ? "text-sage-dark" : "text-secondary-dark"}`;

  return (
    <details className="card mt-4 p-6">
      <summary className="cursor-pointer font-semibold">Pengaturan akun</summary>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <form onSubmit={saveProfile}>
          <h2 className="font-display text-lg font-bold">Ubah nama</h2>
          <label htmlFor="profile-name" className="label mt-3">
            Nama lengkap
          </label>
          <input
            id="profile-name"
            required
            minLength={2}
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field"
          />
          <button type="submit" disabled={busy} className="btn-outline btn-sm mt-3">
            Simpan nama
          </button>
          {profileMsg && (
            <p role={profileMsg.ok ? "status" : "alert"} className={msgClass(profileMsg.ok)}>
              {profileMsg.text}
            </p>
          )}
        </form>

        <form onSubmit={savePassword}>
          <h2 className="font-display text-lg font-bold">Ganti password</h2>
          <label htmlFor="pw-current" className="label mt-3">
            Password saat ini
          </label>
          <input
            id="pw-current"
            type="password"
            required
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="field"
          />
          <label htmlFor="pw-new" className="label mt-3">
            Password baru
          </label>
          <input
            id="pw-new"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="field"
          />
          <p className="mt-1.5 text-xs text-muted">Minimal 8 karakter.</p>
          <button type="submit" disabled={busy} className="btn-outline btn-sm mt-3">
            Ganti password
          </button>
          {passMsg && (
            <p role={passMsg.ok ? "status" : "alert"} className={msgClass(passMsg.ok)}>
              {passMsg.text}
            </p>
          )}
        </form>
      </div>
    </details>
  );
}

export default function AkunPage() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const wa = useWhatsApp();

  useEffect(() => {
    if (loading) return;
    if (!token) {
      router.replace("/masuk");
      return;
    }
    getMyOrders(token).then((res) => {
      if (res.ok) setOrders(res.data);
      else setError(res.error);
    });
  }, [loading, token, router]);

  async function cancel(order: OrderResult) {
    if (!token) return;
    if (!window.confirm(`Batalkan pesanan ${order.orderNumber}? Pesanan yang dibatalkan tidak bisa dipulihkan.`)) return;
    const res = await cancelMyOrder(token, order.orderNumber);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError(null);
    setNotice(`Pesanan ${order.orderNumber} dibatalkan.`);
    setOrders((list) => list?.map((o) => (o.orderNumber === order.orderNumber ? res.data : o)) ?? null);
  }

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6" aria-busy="true">
        <div className="skeleton h-28" />
        <div className="skeleton mt-8 h-40" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="card flex flex-wrap items-center justify-between gap-5 p-6">
        <div className="flex items-center gap-4">
          <span className="font-display flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight">Halo, {user.name}</h1>
            <p className="text-sm text-muted">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="btn-outline btn-sm"
          >
            Keluar
          </button>
        </div>
      </div>

      <ProfileSettings />

      <h2 className="font-display mb-4 mt-10 text-2xl font-bold tracking-tight">Riwayat pesanan</h2>

      {notice && (
        <p role="status" className="mb-4 rounded-xl bg-sage px-4 py-3 text-sm font-medium text-sage-dark">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-4 text-sm font-medium text-secondary-dark">
          {error}
        </p>
      )}
      {!error && orders === null && <div className="skeleton h-40" aria-busy="true" />}
      {orders && orders.length === 0 && (
        <div className="card border-dashed px-6 py-14 text-center">
          <p className="font-medium">Belum ada pesanan</p>
          <p className="mt-1 text-sm text-muted">Pesanan yang kamu buat akan muncul di sini.</p>
          <Link href="/katalog" className="btn-primary btn-sm mt-5">
            Mulai belanja
          </Link>
        </div>
      )}

      <ul className="flex flex-col gap-4">
        {orders?.map((order) => (
          <li key={order.orderNumber} className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-mono text-sm font-semibold">{order.orderNumber}</div>
                <div className="text-xs text-muted">
                  {new Date(order.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <ul className="mt-4 flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span>
                    {item.name} <span className="text-muted">({item.size}) × {item.qty}</span>
                  </span>
                  <span className="shrink-0 text-muted">{formatPrice(item.price * item.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-border pt-4 font-bold">
              <span>Total</span>
              <span className="text-accent-dark">{formatPrice(order.total)}</span>
            </div>
            {order.status === "PENDING" && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                {wa.link(orderMessage(order)) && (
                  <a href={wa.link(orderMessage(order))!} className="btn-primary btn-sm">
                    Kirim ke WhatsApp
                  </a>
                )}
                <button type="button" onClick={() => cancel(order)} className="btn-outline btn-sm">
                  Batalkan pesanan
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
