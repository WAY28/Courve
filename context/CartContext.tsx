"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { formatPrice, getProducts, type Product } from "@/lib/api";

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  image: string;
  size: string;
  qty: number;
  /** Stock left for this size, filled in when the cart is checked against the catalogue. */
  stock?: number;
};

type State = { items: CartItem[]; hydrated: boolean; notices: string[] };

type Action =
  | { type: "HYDRATE"; items: CartItem[] }
  | { type: "ADD"; item: CartItem }
  | { type: "REMOVE"; slug: string; size: string }
  | { type: "SET_QTY"; slug: string; size: string; qty: number }
  | { type: "SYNC"; products: Product[] }
  | { type: "DISMISS_NOTICES" }
  | { type: "CLEAR" };

const STORAGE_KEY = "piyama-cart";

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE":
      return { items: action.items, hydrated: true, notices: [] };
    case "ADD": {
      const idx = state.items.findIndex(
        (i) => i.slug === action.item.slug && i.size === action.item.size
      );
      if (idx > -1) {
        const items = [...state.items];
        items[idx] = { ...items[idx], qty: items[idx].qty + action.item.qty };
        return { ...state, items };
      }
      return { ...state, items: [...state.items, action.item] };
    }
    case "REMOVE":
      return {
        ...state,
        items: state.items.filter(
          (i) => !(i.slug === action.slug && i.size === action.size)
        ),
      };
    case "SET_QTY":
      return {
        ...state,
        items: state.items.map((i) =>
          i.slug === action.slug && i.size === action.size
            ? { ...i, qty: Math.max(1, action.qty) }
            : i
        ),
      };
    case "SYNC": {
      // Align the cart with the live catalogue: current price, stock, availability.
      const bySlug = new Map(action.products.map((p) => [p.slug, p]));
      const notices: string[] = [];
      const items: CartItem[] = [];
      for (const item of state.items) {
        const product = bySlug.get(item.slug);
        const stock = product?.stock[item.size] ?? 0;
        if (!product) {
          notices.push(`${item.name} sudah tidak dijual dan dihapus dari keranjang.`);
          continue;
        }
        if (stock <= 0) {
          notices.push(`${item.name} ukuran ${item.size} sudah habis dan dihapus dari keranjang.`);
          continue;
        }
        let next: CartItem = { ...item, name: product.name, image: product.images[0] ?? item.image, stock };
        if (product.price !== item.price) {
          notices.push(
            `Harga ${item.name} berubah dari ${formatPrice(item.price)} menjadi ${formatPrice(product.price)}.`
          );
          next = { ...next, price: product.price };
        }
        if (item.qty > stock) {
          notices.push(`Stok ${item.name} ukuran ${item.size} tinggal ${stock}, jumlah disesuaikan.`);
          next = { ...next, qty: stock };
        }
        items.push(next);
      }
      return { ...state, items, notices: notices.length ? notices : state.notices };
    }
    case "DISMISS_NOTICES":
      return { ...state, notices: [] };
    case "CLEAR":
      return { ...state, items: [] };
    default:
      return state;
  }
}

const CartContext = createContext<{
  items: CartItem[];
  hydrated: boolean;
  notices: string[];
  dispatch: Dispatch<Action>;
  /** Re-check prices and stock against the live catalogue. */
  refresh: () => Promise<void>;
} | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], hydrated: false, notices: [] });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      dispatch({ type: "HYDRATE", items: raw ? JSON.parse(raw) : [] });
    } catch {
      dispatch({ type: "HYDRATE", items: [] });
    }
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // ignore write errors (e.g. private mode)
    }
  }, [state.items, state.hydrated]);

  const refresh = useCallback(async () => {
    const products = await getProducts();
    // An empty list means the catalogue could not be loaded; keep the cart as is.
    if (products.length > 0) dispatch({ type: "SYNC", products });
  }, []);

  const value = useMemo(
    () => ({ items: state.items, hydrated: state.hydrated, notices: state.notices, dispatch, refresh }),
    [state.items, state.hydrated, state.notices, refresh]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
