"use client";

import Image from "@/components/ProductImage";
import { useState } from "react";

export default function ProductGallery({
  images,
  name,
  badge,
}: {
  images: string[];
  name: string;
  badge?: string;
}) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-border bg-accent-soft">
        {badge && (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-bold text-white">
            {badge}
          </span>
        )}
        <Image
          src={images[active]}
          alt={name}
          fill
          priority
          sizes="(min-width: 1024px) 560px, 100vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Lihat foto ${i + 1}`}
              aria-current={i === active}
              className={`relative h-20 w-16 overflow-hidden rounded-xl border-2 transition-colors ${
                i === active ? "border-accent" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
