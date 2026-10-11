"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "@/components/Icons";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { formatPrice, type Product } from "@/lib/api";

const LOW_STOCK = 5;
const MAX_QTY = 20;

export default function AddToCartForm({ product }: { product: Product }) {
  const { dispatch } = useCart();
  const { show } = useToast();
  const router = useRouter();

  const stockOf = (size: string) => product.stock[size] ?? 0;
  const firstAvailable = product.sizes.find((s) => stockOf(s) > 0) ?? "";

  const [size, setSize] = useState(firstAvailable);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const soldOut = firstAvailable === "";
  const maxQty = Math.min(MAX_QTY, stockOf(size));
  const safeQty = Math.max(1, Math.min(qty, maxQty));

  function addItem() {
    dispatch({
      type: "ADD",
      item: {
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images[0],
        size,
        qty: safeQty,
      },
    });
  }

  function addToCart() {
    addItem();
    show({
      message: `${safeQty} × ${product.name} (${size}) ditambahkan`,
      href: "/keranjang",
      actionLabel: "Lihat keranjang",
    });
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 2000);
  }

  function buyNow() {
    addItem();
    router.push("/checkout");
  }

  if (soldOut) {
    return (
      <div className="rounded-2xl border border-border bg-accent-tint p-5 text-sm">
        <p className="font-semibold">Stok habis</p>
        <p className="mt-1 text-muted">Semua ukuran produk ini sedang habis. Cek lagi nanti atau lihat produk lainnya.</p>
      </div>
    );
  }

  return (
    <div>
      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold">
          Ukuran <span className="font-normal text-muted">— pilih satu</span>
        </legend>
        <div className="flex flex-wrap gap-2.5">
          {product.sizes.map((s) => {
            const empty = stockOf(s) === 0;
            return (
              <label key={s} className={empty ? "cursor-not-allowed" : "cursor-pointer"}>
                <input
                  type="radio"
                  name="size"
                  value={s}
                  checked={size === s}
                  disabled={empty}
                  onChange={() => {
                    setSize(s);
                    setQty(1);
                  }}
                  className="peer sr-only"
                />
                <span
                  className={`flex h-12 min-w-14 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${
                    empty
                      ? "border-border text-muted line-through opacity-60"
                      : "border-input peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-white hover:border-foreground"
                  }`}
                >
                  {s}
                  {empty && <span className="sr-only"> (habis)</span>}
                </span>
              </label>
            );
          })}
        </div>
        {stockOf(size) <= LOW_STOCK && (
          <p className="mt-2.5 text-sm font-medium text-secondary-dark" role="status">
            Sisa {stockOf(size)} untuk ukuran {size}
          </p>
        )}
      </fieldset>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2.5 text-sm font-semibold" id="qty-label">
            Jumlah
          </div>
          <div
            role="group"
            aria-labelledby="qty-label"
            className="inline-flex h-12 items-center overflow-hidden rounded-xl border border-input"
          >
            <button
              type="button"
              onClick={() => setQty(Math.max(1, safeQty - 1))}
              disabled={safeQty <= 1}
              className="flex h-full w-12 items-center justify-center text-lg hover:bg-accent-tint disabled:opacity-40"
              aria-label="Kurangi jumlah"
            >
              −
            </button>
            <output className="flex h-full w-12 items-center justify-center text-sm font-semibold" aria-live="polite">
              {safeQty}
            </output>
            <button
              type="button"
              onClick={() => setQty(Math.min(maxQty, safeQty + 1))}
              disabled={safeQty >= maxQty}
              className="flex h-full w-12 items-center justify-center text-lg hover:bg-accent-tint disabled:opacity-40"
              aria-label="Tambah jumlah"
            >
              +
            </button>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted">Subtotal</div>
          <div className="font-display text-2xl font-bold text-accent-dark">
            {formatPrice(product.price * safeQty)}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={addToCart} className="btn-outline">
          {added ? (
            <>
              <CheckIcon size={18} /> Ditambahkan
            </>
          ) : (
            "Tambah ke keranjang"
          )}
        </button>
        <button type="button" onClick={buyNow} className="btn-primary">
          Beli sekarang
        </button>
      </div>
    </div>
  );
}
