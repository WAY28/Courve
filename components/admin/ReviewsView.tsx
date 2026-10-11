"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminSession } from "@/context/AdminAuthContext";
import { deleteReview, getAdminReviews, setReviewHidden, type AdminReview } from "@/lib/api";

export default function ReviewsView() {
  const { token, ready, guard } = useAdminSession();
  const [reviews, setReviews] = useState<AdminReview[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const res = guard(await getAdminReviews(token));
    if (res.ok) {
      setReviews(res.data);
      setError(null);
    } else {
      setError(res.error);
    }
  }, [token, guard]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function toggle(r: AdminReview) {
    if (!token) return;
    const res = guard(await setReviewHidden(token, r.id, !r.hidden));
    if (!res.ok) setError(res.error);
    await load();
  }

  async function remove(r: AdminReview) {
    if (!token) return;
    if (!window.confirm(`Hapus permanen ulasan dari ${r.customer}?`)) return;
    const res = guard(await deleteReview(token, r.id));
    if (!res.ok) setError(res.error);
    await load();
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
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">Ulasan</h1>
      <p className="mt-2 text-sm text-muted">
        Ulasan yang disembunyikan tidak tampil di toko dan tidak dihitung dalam rating.
      </p>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-secondary-dark">
          {error}
        </p>
      )}
      {!reviews && !error && <div className="skeleton mt-6 h-40" aria-busy="true" />}
      {reviews && reviews.length === 0 && (
        <div className="card mt-6 border-dashed px-6 py-14 text-center text-sm text-muted">Belum ada ulasan.</div>
      )}

      <ul className="mt-6 flex flex-col gap-4">
        {reviews?.map((r) => (
          <li key={r.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{r.product}</div>
                <div className="text-sm text-muted">
                  {r.customer} &middot; {r.email} &middot;{" "}
                  {new Date(r.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold" aria-label={`Rating ${r.rating} dari 5`}>
                  {r.rating}/5 ★
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    r.hidden ? "bg-border text-muted" : "bg-sage text-sage-dark"
                  }`}
                >
                  {r.hidden ? "Disembunyikan" : "Tampil"}
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm">{r.comment}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => toggle(r)}
                aria-label={`${r.hidden ? "Tampilkan" : "Sembunyikan"} ulasan dari ${r.customer} untuk ${r.product}`}
                className="btn-outline btn-sm"
              >
                {r.hidden ? "Tampilkan" : "Sembunyikan"}
              </button>
              <button
                onClick={() => remove(r)}
                aria-label={`Hapus ulasan dari ${r.customer} untuk ${r.product}`}
                className="btn-sm inline-flex items-center justify-center rounded-full border border-secondary/50 px-4 text-sm font-semibold text-secondary-dark hover:bg-secondary-soft"
              >
                Hapus
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
