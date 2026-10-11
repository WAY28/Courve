"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import ImageUploader from "@/components/admin/ImageUploader";
import SizeStockEditor, { type SizeRow } from "@/components/admin/SizeStockEditor";
import Image from "@/components/ProductImage";
import { useAdminSession } from "@/context/AdminAuthContext";
import {
  createProduct,
  deleteProduct,
  formatPrice,
  getAdminProducts,
  updateProduct,
  type Product,
} from "@/lib/api";

const LOW_STOCK = 5;

type FormState = {
  slug: string;
  name: string;
  description: string;
  price: string;
  oldPrice: string;
  category: string;
  material: string;
  colorway: string;
  published: boolean;
  sizes: SizeRow[];
  images: string[];
};

const emptyForm: FormState = {
  slug: "",
  name: "",
  description: "",
  price: "",
  oldPrice: "",
  category: "",
  material: "",
  colorway: "",
  published: true,
  sizes: [
    { size: "S", stock: "0" },
    { size: "M", stock: "0" },
    { size: "L", stock: "0" },
    { size: "XL", stock: "0" },
  ],
  images: [],
};

function toForm(p: Product): FormState {
  return {
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: String(p.price),
    oldPrice: p.oldPrice ? String(p.oldPrice) : "",
    category: p.category,
    material: p.material,
    colorway: p.colorway,
    published: p.published,
    sizes: p.sizes.map((s) => ({ size: s, stock: String(p.stock[s] ?? 0) })),
    images: p.images,
  };
}

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function Field({ label, hint, children }: { label: string; hint?: string; children: (id: string) => React.ReactNode }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children(id)}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default function ProductsView() {
  const { token, ready, guard } = useAdminSession();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const categoryListId = useId();

  const load = useCallback(async () => {
    if (!token) return;
    const res = guard(await getAdminProducts(token));
    if (res.ok) setProducts(res.data);
    else setError(res.error);
  }, [token, guard]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function reset() {
    setForm(emptyForm);
    setEditingSlug(null);
    setSlugTouched(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    setNotice(null);

    const body = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      category: form.category.trim(),
      material: form.material.trim(),
      colorway: form.colorway.trim(),
      published: form.published,
      sizes: form.sizes.map((r) => ({ size: r.size.trim(), stock: Number(r.stock) })),
      images: form.images,
    };

    if (body.images.length === 0) {
      setError("Tambahkan minimal satu foto produk.");
      setSaving(false);
      return;
    }

    const res = guard(editingSlug ? await updateProduct(token, editingSlug, body) : await createProduct(token, body));
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setNotice(editingSlug ? `“${body.name}” berhasil diperbarui.` : `“${body.name}” berhasil ditambahkan.`);
    reset();
    await load();
  }

  async function togglePublished(p: Product) {
    if (!token) return;
    const res = guard(await updateProduct(token, p.slug, { published: !p.published }));
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setNotice(`“${p.name}” sekarang ${p.published ? "disembunyikan dari toko" : "tampil di toko"}.`);
    await load();
  }

  async function handleDelete(p: Product) {
    if (!token) return;
    if (!window.confirm(`Hapus produk "${p.name}" secara permanen? Foto yang diunggah ikut terhapus.`)) return;
    const res = guard(await deleteProduct(token, p.slug));
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (editingSlug === p.slug) reset();
    setNotice(`“${p.name}” dihapus.`);
    await load();
  }

  if (!ready || !token) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-busy="true">
        <div className="skeleton h-10 w-56" />
        <div className="skeleton mt-6 h-40" />
      </div>
    );
  }

  const categories = [...new Set((products ?? []).map((p) => p.category))].sort();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Admin</p>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">Produk &amp; stok</h1>

      {notice && (
        <p role="status" className="mt-4 rounded-xl bg-sage px-4 py-3 text-sm font-medium text-sage-dark">
          {notice}
        </p>
      )}

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1fr_400px]">
        <div>
          {!products && !error && <div className="skeleton h-40" aria-busy="true" />}
          {products && products.length === 0 && (
            <div className="card border-dashed px-6 py-14 text-center text-sm text-muted">Belum ada produk.</div>
          )}
          <ul className="flex flex-col gap-3">
            {products?.map((p) => {
              const totalStock = p.sizes.reduce((n, s) => n + (p.stock[s] ?? 0), 0);
              return (
                <li key={p.slug} className="card p-4">
                  <div className="flex gap-4">
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-accent-soft">
                      <Image src={p.images[0]} alt="" fill sizes="80px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{p.name}</span>
                        {!p.published && (
                          <span className="rounded-full bg-border px-2.5 py-0.5 text-xs font-semibold text-muted">
                            Disembunyikan
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-sm text-muted">
                        {formatPrice(p.price)} · {p.category} · /{p.slug}
                      </div>
                      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={`Stok ${p.name}`}>
                        {p.sizes.map((s) => {
                          const n = p.stock[s] ?? 0;
                          return (
                            <li
                              key={s}
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                n === 0
                                  ? "bg-secondary-soft text-secondary-dark"
                                  : n <= LOW_STOCK
                                    ? "bg-accent-soft text-accent-dark"
                                    : "bg-sage text-sage-dark"
                              }`}
                            >
                              {s}: {n === 0 ? "habis" : n}
                            </li>
                          );
                        })}
                        <li className="px-1 py-0.5 text-xs text-muted">Total {totalStock}</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                    <button
                      onClick={() => {
                        setEditingSlug(p.slug);
                        setSlugTouched(true);
                        setForm(toForm(p));
                        setError(null);
                        setNotice(null);
                        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="btn-outline btn-sm"
                    >
                      Ubah
                    </button>
                    <button onClick={() => togglePublished(p)} className="btn-soft btn-sm">
                      {p.published ? "Sembunyikan" : "Tampilkan"}
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="btn-sm inline-flex items-center justify-center rounded-full border border-secondary/50 px-5 text-sm font-semibold text-secondary-dark transition-colors hover:bg-secondary-soft"
                    >
                      Hapus
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="card flex flex-col gap-4 p-6 lg:sticky lg:top-6">
          <h2 className="font-display text-xl font-bold">{editingSlug ? "Ubah produk" : "Tambah produk"}</h2>

          <Field label="Nama produk">
            {(id) => (
              <input
                id={id}
                required
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: editingSlug || slugTouched ? f.slug : slugify(name) }));
                }}
                className="field"
              />
            )}
          </Field>
          <Field label="Slug" hint="Dipakai di alamat halaman produk. Terisi otomatis dari nama.">
            {(id) => (
              <input
                id={id}
                required
                value={form.slug}
                disabled={!!editingSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value);
                }}
                className="field disabled:opacity-60"
              />
            )}
          </Field>
          <Field label="Deskripsi">
            {(id) => (
              <textarea id={id} required rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} className="field" />
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Harga (Rp)">
              {(id) => (
                <input id={id} required type="number" min={1} inputMode="numeric" value={form.price} onChange={(e) => set("price", e.target.value)} className="field" />
              )}
            </Field>
            <Field label="Harga coret (opsional)">
              {(id) => (
                <input id={id} type="number" min={1} inputMode="numeric" value={form.oldPrice} onChange={(e) => set("oldPrice", e.target.value)} className="field" />
              )}
            </Field>
          </div>
          <Field label="Kategori" hint="Pilih yang sudah ada atau ketik kategori baru.">
            {(id) => (
              <>
                <input
                  id={id}
                  required
                  list={categoryListId}
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  className="field"
                />
                <datalist id={categoryListId}>
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bahan">
              {(id) => <input id={id} required value={form.material} onChange={(e) => set("material", e.target.value)} className="field" />}
            </Field>
            <Field label="Warna / motif">
              {(id) => <input id={id} required value={form.colorway} onChange={(e) => set("colorway", e.target.value)} className="field" />}
            </Field>
          </div>

          <SizeStockEditor rows={form.sizes} onChange={(rows) => set("sizes", rows)} />
          <ImageUploader images={form.images} onChange={(images) => set("images", images)} token={token} guard={guard} />

          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-accent-tint p-3 text-sm">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => set("published", e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-accent"
            />
            <span>
              <span className="font-semibold">Tampilkan di toko</span>
              <span className="block text-muted">Matikan untuk menyembunyikan produk (draf) tanpa menghapusnya.</span>
            </span>
          </label>

          {error && (
            <div role="alert" className="rounded-xl border border-secondary/40 bg-secondary-soft px-3 py-2 text-sm font-medium text-secondary-dark">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Menyimpan..." : editingSlug ? "Simpan perubahan" : "Tambah produk"}
            </button>
            {(editingSlug || form.name || form.images.length > 0) && (
              <button type="button" onClick={reset} className="btn-outline">
                {editingSlug ? "Batal" : "Kosongkan"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
