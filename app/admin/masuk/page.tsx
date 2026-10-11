"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AdminMasukPage() {
  const { admin, loading, login } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && admin) router.replace("/admin");
  }, [loading, admin, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const err = await login(email, password);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    router.replace("/admin");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <div className="card p-8">
        <p className="eyebrow">Khusus pengelola toko</p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">Masuk admin</h1>
        <p className="mt-2 text-sm text-muted">
          Halaman ini terpisah dari login pelanggan. Akun pelanggan tidak bisa masuk di sini.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
          <div>
            <label htmlFor="admin-email" className="label">
              Email admin
            </label>
            <input
              id="admin-email"
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="label">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                required
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field pr-24"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-semibold text-accent-dark hover:bg-accent-tint"
              >
                {showPassword ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-secondary/40 bg-secondary-soft px-4 py-3 text-sm font-medium text-secondary-dark"
            >
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary mt-1 w-full">
            {submitting ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
      <p className="mt-5 text-center text-xs text-muted">
        Sesi admin berakhir otomatis saat tab ditutup atau setelah 8 jam.
      </p>
    </div>
  );
}
