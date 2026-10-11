"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { HeartIcon } from "@/components/Icons";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useWishlist } from "@/context/WishlistContext";

export default function WishlistButton({
  slug,
  name,
  variant = "icon",
}: {
  slug: string;
  name: string;
  variant?: "icon" | "inline";
}) {
  const { token } = useAuth();
  const { has, toggle } = useWishlist();
  const { show } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const saved = has(slug);

  async function onClick() {
    if (!token) {
      router.push(`/masuk?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setBusy(true);
    const err = await toggle(slug);
    setBusy(false);
    show(
      err
        ? { message: err }
        : saved
          ? { message: "Dihapus dari wishlist." }
          : { message: "Disimpan ke wishlist.", href: "/wishlist", actionLabel: "Lihat" }
    );
  }

  const label = saved ? `Hapus ${name} dari wishlist` : `Simpan ${name} ke wishlist`;

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-pressed={saved}
        className="btn-outline w-full"
      >
        <HeartIcon size={18} filled={saved} className={saved ? "text-secondary" : ""} />
        {saved ? "Tersimpan di wishlist" : "Simpan ke wishlist"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={saved}
      aria-label={label}
      className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-foreground shadow-sm transition-colors hover:bg-white"
    >
      <HeartIcon size={19} filled={saved} className={saved ? "text-secondary-dark" : ""} />
    </button>
  );
}
