"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Gallery({ photos, alt = "Listing photo" }: { photos: string[]; alt?: string }) {
  const [active, setActive] = useState(0);
  const safe = photos.length ? photos : ["/matin/exteriors/exteriors-01.jpg"];
  const current = safe[Math.min(active, safe.length - 1)];

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_120px]">
      {/* Main image */}
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-paper-200 shadow-lift ring-1 ring-ink/[0.06]">
        <Image
          key={current}
          src={current}
          alt={alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 70vw"
          className="object-cover"
        />
        <div className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-3 py-1 text-[0.78rem] font-medium text-white backdrop-blur-sm">
          {active + 1} / {safe.length}
        </div>
      </div>

      {/* Thumbnail strip — vertical on desktop, horizontal scroll on mobile */}
      {safe.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {safe.map((src, i) => (
            <button
              key={`${src}-${i}`}
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
              className={cn(
                "relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl ring-1 transition-all duration-200 lg:aspect-[16/10] lg:w-full",
                i === active
                  ? "ring-2 ring-azure"
                  : "ring-ink/[0.08] opacity-70 hover:opacity-100",
              )}
            >
              <Image src={src} alt={`${alt} thumbnail ${i + 1}`} fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
