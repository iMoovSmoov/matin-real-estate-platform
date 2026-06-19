"use client";

import { useState } from "react";
import Image from "next/image";
import { Images, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Gallery({ photos, alt = "Listing photo" }: { photos: string[]; alt?: string }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const safe = photos.length ? photos : ["/matin/exteriors/exteriors-01.jpg"];
  const current = safe[Math.min(active, safe.length - 1)];

  function prev() { setActive((i) => (i - 1 + safe.length) % safe.length); }
  function next() { setActive((i) => (i + 1) % safe.length); }

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-[1fr_120px]">
        {/* Main image */}
        <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden rounded-2xl bg-paper-200 shadow-lift ring-1 ring-ink/[0.06]">
          <Image
            key={current}
            src={current}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 70vw"
            className="object-cover"
          />

          {/* Mobile: prev/next arrows */}
          {safe.length > 1 && (
            <>
              <button
                aria-label="Previous photo"
                onClick={prev}
                className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-white backdrop-blur-sm transition hover:bg-ink/80"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                aria-label="Next photo"
                onClick={next}
                className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-white backdrop-blur-sm transition hover:bg-ink/80"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Counter badge */}
          <div className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-3 py-1 text-[0.78rem] font-medium text-white backdrop-blur-sm">
            {active + 1} / {safe.length}
          </div>

          {/* Mobile: "View all X photos" button */}
          {safe.length > 1 && (
            <button
              onClick={() => setLightboxOpen(true)}
              className="sm:hidden absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5 text-[0.78rem] font-semibold text-white backdrop-blur-sm transition hover:bg-ink/90"
            >
              <Images className="h-3.5 w-3.5" />
              View all {safe.length} photos
            </button>
          )}

          {/* Desktop: "View all photos" overlay button */}
          {safe.length > 1 && (
            <button
              onClick={() => setLightboxOpen(true)}
              className="hidden sm:flex absolute bottom-3 left-3 items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5 text-[0.78rem] font-semibold text-white backdrop-blur-sm transition hover:bg-ink/90"
            >
              <Images className="h-3.5 w-3.5" />
              View all {safe.length} photos
            </button>
          )}
        </div>

        {/* Thumbnail strip — hidden on mobile, visible sm+, vertical on lg */}
        {safe.length > 1 && (
          <div className="hidden sm:flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
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

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/95 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            aria-label="Close gallery"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="relative flex h-full w-full max-w-5xl flex-col items-center justify-center px-4 py-16"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main lightbox image */}
            <div className="relative w-full flex-1 overflow-hidden rounded-xl max-h-[calc(100vh-8rem)]">
              <Image
                key={`lb-${active}`}
                src={safe[active]}
                alt={`${alt} photo ${active + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            {/* Lightbox controls */}
            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={prev}
                aria-label="Previous"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-white/70">{active + 1} / {safe.length}</span>
              <button
                onClick={next}
                aria-label="Next"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Thumbnail strip in lightbox */}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 max-w-full">
              {safe.map((src, i) => (
                <button
                  key={`lb-thumb-${i}`}
                  onClick={() => setActive(i)}
                  aria-label={`Jump to photo ${i + 1}`}
                  className={cn(
                    "relative h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition-all",
                    i === active ? "ring-white" : "ring-transparent opacity-50 hover:opacity-80",
                  )}
                >
                  <Image src={src} alt={`Thumbnail ${i + 1}`} fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
