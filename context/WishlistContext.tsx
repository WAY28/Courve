"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { addToWishlist, getWishlist, removeFromWishlist } from "@/lib/api";

type WishlistState = {
  slugs: Set<string>;
  has: (slug: string) => boolean;
  /** Returns an error message, or null on success. */
  toggle: (slug: string) => Promise<string | null>;
  reload: () => void;
};

const WishlistContext = createContext<WishlistState | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [slugs, setSlugs] = useState<Set<string>>(new Set());
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      Promise.resolve().then(() => !cancelled && setSlugs(new Set()));
      return () => {
        cancelled = true;
      };
    }
    getWishlist(token).then((res) => {
      if (!cancelled && res.ok) setSlugs(new Set(res.data.map((p) => p.slug)));
    });
    return () => {
      cancelled = true;
    };
  }, [token, version]);

  const toggle = useCallback(
    async (slug: string) => {
      if (!token) return "Masuk dulu untuk memakai wishlist.";
      const adding = !slugs.has(slug);
      setSlugs((prev) => {
        const next = new Set(prev);
        if (adding) next.add(slug);
        else next.delete(slug);
        return next;
      });
      const res = adding ? await addToWishlist(token, slug) : await removeFromWishlist(token, slug);
      if (!res.ok) {
        setVersion((v) => v + 1); // resync from the server after a failure
        return res.error;
      }
      return null;
    },
    [token, slugs]
  );

  const value = useMemo(
    () => ({ slugs, has: (slug: string) => slugs.has(slug), toggle, reload: () => setVersion((v) => v + 1) }),
    [slugs, toggle]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
