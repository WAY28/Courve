"use client";

import { useCart } from "@/context/CartContext";

export default function CartNotices() {
  const { notices, dispatch } = useCart();
  if (notices.length === 0) return null;
  return (
    <div
      role="status"
      className="mt-6 rounded-xl border border-secondary/40 bg-secondary-soft px-4 py-3 text-sm text-secondary-dark"
    >
      <p className="font-semibold">Keranjangmu diperbarui</p>
      <ul className="mt-1 list-disc pl-5">
        {notices.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => dispatch({ type: "DISMISS_NOTICES" })}
        className="mt-2 text-xs font-semibold underline underline-offset-4"
      >
        Mengerti
      </button>
    </div>
  );
}
