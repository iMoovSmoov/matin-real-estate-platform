"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EXTERIORS } from "@/lib/assets";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — PropertyThumb

   Real-property image used in listing cards, transaction headers, kanban
   cards, and asset previews. Resolves from `src` when given, otherwise picks a
   deterministic exterior from the pool by `seedIndex` so the same record always
   shows the same photo. On a missing file it degrades to a neutral placeholder
   (a Building2 glyph on bg-paper-200) — never a broken image.
   ────────────────────────────────────────────────────────────────────────── */

const RATIO: Record<"square" | "video" | "wide", string> = {
  square: "aspect-square",
  video: "aspect-video", // 16:9
  wide: "aspect-[21/9]",
};

export function PropertyThumb({
  src,
  seedIndex = 0,
  alt = "Property",
  ratio = "video",
  rounded = true,
  className,
}: {
  /** explicit image path; overrides pool selection */
  src?: string;
  /** deterministic pick from the exteriors pool when no `src` */
  seedIndex?: number;
  alt?: string;
  ratio?: "square" | "video" | "wide";
  rounded?: boolean;
  className?: string;
}) {
  const safeSeed = Number.isFinite(seedIndex) ? Math.abs(Math.trunc(seedIndex)) : 0;
  const resolved = src ?? EXTERIORS[safeSeed % EXTERIORS.length];
  const [failed, setFailed] = useState(false);

  // Reset the error flag during render when the source changes — adjust-state-
  // on-prop-change pattern, no effect needed.
  const [lastSrc, setLastSrc] = useState(resolved);
  if (resolved !== lastSrc) {
    setLastSrc(resolved);
    setFailed(false);
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-paper-200",
        RATIO[ratio],
        rounded && "rounded-xl",
        className,
      )}
    >
      {/* Faint placeholder ALWAYS behind the image — so a lazy-loading (or
          missing) thumb reads as an intentional property tile, never a flat
          empty-gray box on first paint. The loaded photo covers it. */}
      <div className="absolute inset-0 flex items-center justify-center text-slate/25">
        <Building2 className="h-1/4 w-1/4 min-h-5 min-w-5" aria-hidden />
        <span className="sr-only">{alt}</span>
      </div>
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element -- runtime onError fallback to placeholder; next/image can't swap on a missing public file
        <img
          src={resolved}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="relative h-full w-full object-cover"
        />
      )}
    </div>
  );
}
