"use client";

import { useId, useRef, useState } from "react";
import Image from "@/components/ProductImage";
import { uploadImage, type Result } from "@/lib/api";

const MAX_BYTES = 3 * 1024 * 1024;
const MAX_IMAGES = 8;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

export default function ImageUploader({
  images,
  onChange,
  token,
  guard,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  token: string;
  guard: <T>(res: Result<T>) => Result<T>;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const problems: string[] = [];
    const added: string[] = [];
    setBusy(true);

    for (const file of Array.from(files)) {
      if (images.length + added.length >= MAX_IMAGES) {
        problems.push(`Maksimal ${MAX_IMAGES} foto per produk.`);
        break;
      }
      if (!ACCEPT.includes(file.type)) {
        problems.push(`${file.name}: gunakan JPG, PNG, atau WebP.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        problems.push(`${file.name}: ukuran melebihi 3 MB.`);
        continue;
      }
      const res = guard(await uploadImage(token, file));
      if (res.ok) added.push(res.data.url);
      else problems.push(`${file.name}: ${res.error}`);
    }

    if (added.length > 0) onChange([...images, ...added]);
    setErrors(problems);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label htmlFor={inputId} className="label">
        Foto produk <span className="font-normal text-muted">(foto pertama jadi foto utama)</span>
      </label>

      {images.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((src, i) => (
            <li key={src} className="flex flex-col gap-1.5">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-border bg-accent-soft">
                <Image src={src} alt={`Foto ${i + 1}`} fill sizes="120px" className="object-cover" />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                    Utama
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange([src, ...images.filter((u) => u !== src)])}
                    className="flex-1 rounded-lg border border-border px-1 py-1.5 text-[11px] font-medium hover:border-accent"
                  >
                    Jadikan utama
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onChange(images.filter((u) => u !== src))}
                  aria-label={`Hapus foto ${i + 1}`}
                  className="flex-1 rounded-lg border border-secondary/40 px-1 py-1.5 text-[11px] font-medium text-secondary-dark hover:bg-secondary-soft"
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT.join(",")}
        multiple
        disabled={busy || images.length >= MAX_IMAGES}
        onChange={(e) => handleFiles(e.target.files)}
        className="block w-full rounded-xl border border-dashed border-input bg-surface p-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-accent-dark disabled:opacity-60"
      />
      <p className="mt-1.5 text-xs text-muted" aria-live="polite">
        {busy ? "Mengunggah…" : "JPG, PNG, atau WebP, maksimal 3 MB per foto."}
      </p>
      {errors.length > 0 && (
        <ul role="alert" className="mt-2 text-sm font-medium text-secondary-dark">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
