"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoonMark } from "@/components/Icons";
import { useAuth } from "@/context/AuthContext";

// Only allow same-site paths, never an absolute or protocol-relative URL.
function safeNext(next?: string) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/akun";
}

export default function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const { login, register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";
  const target = safeNext(next);
  const suffix = next && target !== "/akun" ? `?next=${encodeURIComponent(target)}` : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const err = isRegister ? await register(name, email, password) : await login(email, password);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    router.push(target);
  }

  return (
    <div className="mx-auto grid max-w-5xl overflow-hidden px-4 py-10 sm:px-6 md:my-10 md:grid-cols-2 md:rounded-3xl md:border md:border-border md:bg-surface md:p-0">
      <div className="relative hidden min-h-[560px] md:block">
        <Image
          src="/images/products/courve-floral.jpg"
          alt=""
          fill
          priority
          sizes="480px"
          className="object-cover object-[28%_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <p className="font-display absolute bottom-8 left-8 right-8 text-2xl font-semibold leading-snug text-white">
          Not just sleepwear,
          <br />
          it&apos;s an expression.
        </p>
      </div>

      <div className="mx-auto w-full max-w-md md:flex md:flex-col md:justify-center md:p-12">
        <MoonMark size={40} />
        <h1 className="font-display mt-5 text-3xl font-bold tracking-tight">
          {isRegister ? "Buat akun" : "Selamat datang kembali"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {isRegister
            ? "Daftar untuk menyimpan riwayat pesananmu."
            : "Masuk untuk melihat riwayat pesananmu."}
        </p>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
          {isRegister && (
            <div>
              <label htmlFor="auth-name" className="label">
                Nama lengkap
              </label>
              <input
                id="auth-name"
                required
                minLength={2}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field"
              />
            </div>
          )}
          <div>
            <label htmlFor="auth-email" className="label">
              Email
            </label>
            <input
              id="auth-email"
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="label">
              Password
            </label>
            <div className="relative">
              <input
                id="auth-password"
                required
                type={showPassword ? "text" : "password"}
                minLength={isRegister ? 8 : 1}
                autoComplete={isRegister ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field pr-20"
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
            {isRegister ? (
              <p className="mt-1.5 text-xs text-muted">Minimal 8 karakter.</p>
            ) : (
              <p className="mt-1.5 text-xs">
                <Link href="/lupa-password" className="font-semibold text-accent-dark hover:underline">
                  Lupa password?
                </Link>
              </p>
            )}
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
            {submitting ? "Memproses..." : isRegister ? "Daftar" : "Masuk"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {isRegister ? "Sudah punya akun? " : "Belum punya akun? "}
          <Link
            href={`${isRegister ? "/masuk" : "/daftar"}${suffix}`}
            className="font-semibold text-accent-dark hover:underline"
          >
            {isRegister ? "Masuk" : "Daftar sekarang"}
          </Link>
        </p>
      </div>
    </div>
  );
}
