"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchIcon } from "@/components/Icons";
import { useAdminSession } from "@/context/AdminAuthContext";
import { adminResetPassword, formatPrice, getAdminUsers, setUserActive, type AdminUser } from "@/lib/api";

export default function CustomersView() {
  const { token, ready, guard } = useAdminSession();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const res = guard(await getAdminUsers(token, q || undefined));
    if (res.ok) {
      setUsers(res.data);
      setError(null);
    } else {
      setError(res.error);
    }
  }, [token, q, guard]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function toggle(u: AdminUser) {
    if (!token) return;
    const next = !u.active;
    const message = next
      ? `Aktifkan kembali akun ${u.email}?`
      : `Nonaktifkan akun ${u.email}? Pelanggan ini tidak bisa masuk atau berbelanja dengan akunnya sampai diaktifkan lagi.`;
    if (!window.confirm(message)) return;
    const res = guard(await setUserActive(token, u.id, next));
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setNotice(`Akun ${u.email} ${next ? "diaktifkan" : "dinonaktifkan"}.`);
    await load();
  }

  async function resetPassword(u: AdminUser) {
    if (!token) return;
    if (!window.confirm(`Buat password sementara untuk ${u.email}? Password lama tidak berlaku lagi.`)) return;
    const res = guard(await adminResetPassword(token, u.id));
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError(null);
    setTempPassword({ email: res.data.email, password: res.data.temporaryPassword });
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-busy="true">
        <div className="skeleton h-10 w-56" />
        <div className="skeleton mt-6 h-40" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Admin</p>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">Pelanggan</h1>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(qInput.trim());
        }}
        className="mt-6 flex gap-2"
      >
        <label htmlFor="cari-pelanggan" className="sr-only">
          Cari pelanggan
        </label>
        <div className="flex h-12 flex-1 items-center gap-2 rounded-xl border border-input bg-surface px-4 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
          <SearchIcon size={16} className="shrink-0 text-muted" />
          <input
            id="cari-pelanggan"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Cari nama atau email"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
        <button type="submit" className="btn-primary">
          Cari
        </button>
        {q && (
          <button
            type="button"
            onClick={() => {
              setQInput("");
              setQ("");
            }}
            className="btn-outline"
          >
            Reset
          </button>
        )}
      </form>

      {notice && (
        <p role="status" className="mt-4 rounded-xl bg-sage px-4 py-3 text-sm font-medium text-sage-dark">
          {notice}
        </p>
      )}
      {tempPassword && (
        <div role="status" className="mt-4 rounded-xl border border-border bg-accent-tint px-4 py-3 text-sm">
          <p>
            Password sementara untuk <strong>{tempPassword.email}</strong> (hanya ditampilkan sekali; kirim ke pelanggan
            lewat WhatsApp dan minta diganti setelah masuk):
          </p>
          <p className="mt-2 font-mono text-base font-bold">{tempPassword.password}</p>
          <button type="button" onClick={() => setTempPassword(null)} className="mt-2 text-xs font-semibold underline underline-offset-4">
            Tutup
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-secondary-dark">
          {error}
        </p>
      )}
      {!users && !error && <div className="skeleton mt-6 h-40" aria-busy="true" />}

      {users && users.length === 0 && (
        <div className="card mt-6 border-dashed px-6 py-14 text-center text-sm text-muted">
          {q ? "Tidak ada pelanggan yang cocok." : "Belum ada pelanggan terdaftar."}
        </div>
      )}

      {users && users.length > 0 && (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <caption className="sr-only">Daftar pelanggan</caption>
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th scope="col" className="px-5 py-3 font-semibold">Pelanggan</th>
                <th scope="col" className="px-3 py-3 font-semibold">Terdaftar</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">Pesanan</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">Total belanja</th>
                <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-4">
                    <div className="font-semibold">{u.name}</div>
                    <div className="text-muted">{u.email}</div>
                  </td>
                  <td className="px-3 py-4 text-muted">
                    {new Date(u.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-3 py-4 text-right">{u.orders}</td>
                  <td className="px-3 py-4 text-right font-medium">{formatPrice(u.totalSpent)}</td>
                  <td className="px-3 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        u.active ? "bg-sage text-sage-dark" : "bg-secondary-soft text-secondary-dark"
                      }`}
                    >
                      {u.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => resetPassword(u)}
                      aria-label={`Reset password ${u.email}`}
                      className="btn-outline btn-sm mr-2"
                    >
                      Reset password
                    </button>
                    <button
                      onClick={() => toggle(u)}
                      aria-label={`${u.active ? "Nonaktifkan" : "Aktifkan"} akun ${u.email}`}
                      className={
                        u.active
                          ? "btn-sm inline-flex items-center justify-center rounded-full border border-secondary/50 px-4 text-sm font-semibold text-secondary-dark hover:bg-secondary-soft"
                          : "btn-soft btn-sm"
                      }
                    >
                      {u.active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
