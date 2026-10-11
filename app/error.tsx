"use client";

import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
      <p className="eyebrow">Terjadi kesalahan</p>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">Ups, ada yang tidak beres</h1>
      <p className="mt-3 text-sm text-muted">
        Halaman gagal dimuat. Pastikan server API berjalan, lalu coba lagi.
      </p>
      <button onClick={() => retry()} className="btn-primary mt-7">
        Coba lagi
      </button>
    </div>
  );
}
