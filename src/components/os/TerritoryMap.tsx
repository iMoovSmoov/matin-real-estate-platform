"use client";

import dynamic from "next/dynamic";
import { type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { TerritoryMapProps } from "./TerritoryMap.shared";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — TerritoryMap   (ref G-C)

   A real interactive map of the Matin footprint: the two REAL offices
   (West Linn HQ + Vancouver WA), plus optional active-listing and community
   markers passed by the consumer. The Leaflet engine lives in
   TerritoryMapInner.tsx and is lazy-loaded here via `dynamic(…, {ssr:false})`,
   mirroring the repo's CommunityMap → PropertyMap split, so it NEVER blocks
   first paint and `leaflet` (which touches `window`) never runs on the server.

   Mobile (G-C #4): fixed aspect on phone (no CLS), monochrome-luxe tiles
   (CARTO Positron — no loud default blue), office pins use the Matin mark.

   Usage:
     import { TerritoryMap } from "@/components/os";
     <TerritoryMap
       listings={activeListings}          // optional listing pins (price label)
       communities={serviceCommunities}   // optional community pins (gold dot)
       height={420}                        // optional; else responsive aspect
       className="rounded-2xl"
     />
   The two office pins always render; everything else is opt-in via props.
   ────────────────────────────────────────────────────────────────────────── */

// Re-export the shared types + office constants for consumers (and the barrel).
export {
  MATIN_OFFICES,
  PORTLAND_METRO_CENTER,
} from "./TerritoryMap.shared";
export type {
  TerritoryMapProps,
  TerritoryOffice,
  TerritoryListing,
  TerritoryCommunity,
} from "./TerritoryMap.shared";

// Lazy-load the Leaflet engine, client-only.
const TerritoryMapInner = dynamic(() => import("./TerritoryMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-paper text-[0.82rem] text-slate">
      Loading map…
    </div>
  ),
});

export function TerritoryMap({ className, height, ...inner }: TerritoryMapProps) {
  // Explicit pixel height wins; otherwise a responsive fixed-aspect box keeps
  // first paint stable on phone (never block paint, never CLS).
  const style: CSSProperties | undefined = height != null ? { height } : undefined;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-mist bg-paper shadow-soft",
        height == null && "aspect-[4/3] sm:aspect-[16/9] lg:aspect-[2/1]",
        className,
      )}
      style={style}
    >
      <div className="absolute inset-0">
        <TerritoryMapInner {...inner} />
      </div>
    </div>
  );
}
