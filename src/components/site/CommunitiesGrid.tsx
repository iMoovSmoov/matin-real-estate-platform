"use client";

import { useRef, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { scrollIntoViewSafe } from "@/components/site/useScrollReveal";
import { cn, compactUsd } from "@/lib/utils";
import type { Community } from "@/lib/types";

// ---- region → slug list mapping -----------------------------------------
type Region = "All" | "Portland" | "East Portland" | "Lake Oswego" | "West Linn" | "SW Washington" | "Beaverton" | "Other";

const REGION_SLUGS: Record<Region, string[] | null> = {
  All:            null, // null = show all
  Portland:       ["portland-or"],
  "East Portland":["happy-valley-or", "milwaukie-or", "oregon-city-or"],
  "Lake Oswego":  ["lake-oswego-or"],
  "West Linn":    ["west-linn-or"],
  "SW Washington":["vancouver-wa", "camas-wa", "ridgefield-wa"],
  Beaverton:      ["beaverton-or"],
  Other:          [
    "hillsboro-or", "tualatin-or", "tigard-or", "sherwood-or",
    "wilsonville-or", "salem-or", "mcminnville-or", "newberg-or",
  ],
};

const REGIONS: Region[] = [
  "All", "Portland", "East Portland", "Lake Oswego",
  "West Linn", "SW Washington", "Beaverton", "Other",
];

interface Props {
  communities: Community[];
}

export function CommunitiesGrid({ communities }: Props) {
  const [query, setQuery]       = useState("");
  const [region, setRegion]     = useState<Region>("All");
  const resultsRef = useRef<HTMLDivElement>(null);

  function selectRegion(r: Region) {
    setRegion(r);
    // On narrow screens the grid sits below the sticky filter bar — reveal it.
    scrollIntoViewSafe(resultsRef.current, { block: "start", onlyBelowLg: true });
  }

  const filtered = useMemo(() => {
    let list = communities;

    // Region filter
    const slugs = REGION_SLUGS[region];
    if (slugs) {
      list = list.filter((c) => slugs.includes(c.slug));
    }

    // Search filter
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.county.toLowerCase().includes(q) ||
          c.vibe.some((v) => v.toLowerCase().includes(q)) ||
          c.blurb.toLowerCase().includes(q),
      );
    }

    return list;
  }, [communities, region, query]);

  return (
    <div>
      {/* ---- Search + Region chips (design filter bar) ---- */}
      <div
        className="sticky top-[58px] z-30 border-b border-ink/[0.07]"
        style={{ background: "rgba(246,246,245,0.85)", backdropFilter: "blur(14px) saturate(160%)", WebkitBackdropFilter: "blur(14px) saturate(160%)" }}
      >
        <div className="container-x py-4">
          <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
            {/* Region chips */}
            <div className="flex flex-wrap gap-2 min-w-0">
              {REGIONS.map((r) => {
                const active = region === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => selectRegion(r)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-lg px-3.5 py-2 text-[13px] leading-none transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gold/50",
                      active
                        ? "bg-ink font-semibold text-white"
                        : "border border-ink/[0.14] font-medium text-ink-600 hover:border-ink/30 hover:text-ink",
                    )}
                  >
                    {r}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative w-full shrink-0 lg:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
              <input
                type="search"
                placeholder="Search neighborhoods…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-full rounded-[10px] border border-ink/[0.16] bg-[#fbfbfa] pl-10 pr-4 text-[14px] text-ink-600 placeholder:text-slate/70 transition-colors focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ---- Grid ---- */}
      <div ref={resultsRef} className="container-x scroll-mt-32 py-10 pb-24 sm:py-12">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <p className="font-display text-2xl text-ink">No communities found</p>
            <p className="mt-2 text-[0.95rem] text-slate">
              Try a different search term or reset the region filter.
            </p>
            <button
              type="button"
              onClick={() => { setQuery(""); setRegion("All"); }}
              className="mt-5 inline-flex min-h-[44px] items-center rounded-[10px] bg-ink px-5 py-2 text-[0.85rem] font-semibold text-white transition hover:bg-ink/85 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <>
            <p className="mb-6 text-[0.85rem] text-slate tabular-nums" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? "community" : "communities"}{region !== "All" ? ` in ${region}` : ""}
            </p>
            {/* Keyed on the active filters so the grid gently re-reveals when
                the result set changes — subtle "it updated" feedback. */}
            <div
              key={`${region}|${query}`}
              className="grid grid-cols-1 gap-[18px] motion-safe:animate-[fade_0.35s_ease-out] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filtered.map((c, i) => (
                <Reveal key={c.slug} delay={(i % 8) * 0.04}>
                  <CommunityTile community={c} />
                </Reveal>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Design community card (faithful port of #w-communities grid tile):
   130px image with the name overlaid bottom-left (Fraunces), a Median row, and
   a hairline-divided stats row (active · DOM · schools-in-green). Built inline
   here so the shared <CommunityCard> (also used by the home page) stays
   untouched. Links to the real /communities/[slug] route.
   ------------------------------------------------------------------------- */
function CommunityTile({ community: c }: { community: Community }) {
  return (
    <Link
      href={`/communities/${c.slug}`}
      className="group block min-w-0 overflow-hidden rounded-[13px] border border-ink/[0.08] bg-white transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2"
      style={{ boxShadow: "0 1px 2px rgba(20,20,22,.05), 0 10px 26px rgba(20,20,22,.06)" }}
    >
      <div className="relative h-[130px] overflow-hidden">
        <Image
          src={c.thumb}
          alt={c.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg,transparent 40%,rgba(6,6,6,.6))" }}
        />
        <div className="absolute bottom-2.5 left-3 right-3 truncate font-display text-[18px] font-medium text-white">
          {c.name}
        </div>
      </div>
      <div className="px-3.5 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] text-[#9a9aa0]">Median</span>
          <span className="font-display text-[18px] font-medium tabular-nums text-ink">
            {compactUsd(c.medianPrice)}
          </span>
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-ink/[0.07] pt-2.5 text-[11.5px] tabular-nums text-slate">
          <span>{c.activeListings} active</span>
          <span>{c.avgDaysOnMarket}d DOM</span>
          <span className="font-semibold text-gold">{c.schoolRating}/10</span>
        </div>
      </div>
    </Link>
  );
}
