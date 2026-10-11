"use client";

import { useCallback, useEffect, useState } from "react";
import Stars from "@/components/Stars";
import { useAuth } from "@/context/AuthContext";
import { getReviews, postReview, type ReviewsData } from "@/lib/api";

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Rating" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} bintang`}
          onClick={() => onChange(n)}
          className={`flex h-11 w-11 items-center justify-center rounded-lg text-2xl transition-colors hover:bg-accent-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            n <= value ? "text-gold" : "text-border"
          }`}
        >
          <span aria-hidden="true">★</span>
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({ slug, name }: { slug: string; name: string }) {
  const { token } = useAuth();
  const [data, setData] = useState<ReviewsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const res = await getReviews(slug, token);
    if (res.ok) {
      setData(res.data);
      if (res.data.mine) {
        setRating(res.data.mine.rating);
        setComment(res.data.mine.comment);
      }
    }
  }, [slug, token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    const res = await postReview(token, slug, { rating, comment });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    await load();
    setSaved(true);
  }

  return (
    <section className="mt-20" aria-labelledby="ulasan">
      <h2 id="ulasan" className="font-display text-2xl font-bold tracking-tight">
        Ulasan pembeli
      </h2>
      {data && (
        <div className="mt-2">
          <Stars rating={data.average} reviews={data.count} size="md" />
        </div>
      )}

      {data && data.canReview && (
        <form onSubmit={submit} className="card mt-6 max-w-xl p-6">
          <h3 className="font-semibold">{data.mine ? "Ubah ulasanmu" : `Bagaimana ${name}?`}</h3>
          <div className="mt-3">
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <label htmlFor="review-comment" className="label mt-4">
            Ulasanmu
          </label>
          <textarea
            id="review-comment"
            required
            minLength={3}
            maxLength={500}
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="field"
            placeholder="Ceritakan bahan, ukuran, dan kenyamanannya"
          />
          {error && (
            <p role="alert" className="mt-3 text-sm font-medium text-secondary-dark">
              {error}
            </p>
          )}
          {saved && (
            <p role="status" className="mt-3 text-sm font-medium text-sage-dark">
              Terima kasih, ulasanmu tersimpan.
            </p>
          )}
          <button type="submit" disabled={busy || rating === 0} className="btn-primary mt-4">
            {busy ? "Menyimpan..." : data.mine ? "Perbarui ulasan" : "Kirim ulasan"}
          </button>
          {rating === 0 && <p className="mt-2 text-xs text-muted">Pilih jumlah bintang dulu.</p>}
        </form>
      )}
      {data && !data.canReview && (
        <p className="mt-4 text-sm text-muted">
          {token
            ? "Kamu bisa menulis ulasan setelah pesanan produk ini berstatus Selesai."
            : "Masuk dan selesaikan pesanan untuk menulis ulasan."}
        </p>
      )}

      {data && data.reviews.length === 0 && <p className="mt-6 text-sm text-muted">Belum ada ulasan untuk produk ini.</p>}
      <ul className="mt-6 flex max-w-2xl flex-col gap-4">
        {data?.reviews.map((r) => (
          <li key={r.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">{r.name}</span>
              <span className="text-xs text-muted">
                {new Date(r.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            <div className="mt-1">
              <Stars rating={r.rating} reviews={1} />
            </div>
            <p className="mt-3 text-sm leading-relaxed">{r.comment}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
