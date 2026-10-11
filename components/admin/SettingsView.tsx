"use client";

import { useEffect, useState } from "react";
import { useAdminSession } from "@/context/AdminAuthContext";
import { getAdminSettings, saveAdminSettings } from "@/lib/api";
import { buildWaLink } from "@/lib/whatsapp";

export default function SettingsView() {
  const { token, ready, guard } = useAdminSession();
  const [saved, setSaved] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getAdminSettings(token).then((r) => {
      const res = guard(r);
      if (res.ok) {
        setSaved(res.data.whatsappNumber);
        setValue(res.data.whatsappNumber);
      } else {
        setError(res.error);
      }
    });
  }, [token, guard]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = guard(await saveAdminSettings(token, { whatsappNumber: value }));
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaved(res.data.whatsappNumber);
    setValue(res.data.whatsappNumber);
    setNotice(res.data.whatsappNumber ? "Nomor WhatsApp tersimpan." : "Nomor WhatsApp dihapus. Tombol WhatsApp di toko akan disembunyikan.");
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6" aria-busy="true">
        <div className="skeleton h-10 w-56" />
        <div className="skeleton mt-6 h-40" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Admin</p>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">Pengaturan toko</h1>

      <form onSubmit={save} className="card mt-6 p-6">
        <h2 className="font-display text-xl font-bold">Nomor WhatsApp toko</h2>
        <p className="mt-1 text-sm text-muted">
          Pesanan pembeli dikirim ke nomor ini lewat WhatsApp (detail pesanan terisi otomatis). Perubahan langsung
          berlaku tanpa build ulang.
        </p>
        <label htmlFor="wa-number" className="label mt-5">
          Nomor WhatsApp
        </label>
        <input
          id="wa-number"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          placeholder="081234567890"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="field max-w-sm"
          aria-describedby="wa-hint"
        />
        <p id="wa-hint" className="mt-1.5 text-xs text-muted">
          Boleh diawali 08, +62, atau 62. Kosongkan untuk menonaktifkan tombol WhatsApp.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-secondary-dark">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-3 text-sm font-medium text-sage-dark">
            {notice}
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Menyimpan..." : "Simpan"}
          </button>
          {saved ? (
            <a
              href={buildWaLink(saved, "Tes nomor WhatsApp toko Courve")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              Tes buka WhatsApp (+{saved})
            </a>
          ) : (
            <span className="text-sm text-muted">Belum ada nomor tersimpan.</span>
          )}
        </div>
      </form>
    </div>
  );
}
