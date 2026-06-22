"use client";

import { useRef, useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { CommunityCard } from "@/components/site/CommunityCard";
import { scrollIntoViewSafe } from "@/components/site/useScrollReveal";
import { cn } from "@/lib/utils";
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
      {/* ---- Search + Region tabs ---- */}
      <div className="sticky top-[60px] z-20 border-b border-ink/[0.07] bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          {/* Search */}
          <div className="relative mb-4 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate/50" />
            <input
              type="search"
              placeholder="Search neighborhoods..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(
                "h-10 w-full rounded-full border border-ink/[0.12] bg-paper pl-10 pr-4",
                "text-[0.88rem] text-ink placeholder:text-slate/50",
                "transition-all duration-150 focus:border-azure focus:outline-none focus:ring-2 focus:ring-azure/20",
              )}
            />
          </div>

          {/* Region tab pills */}
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => selectRegion(r)}
                aria-pressed={region === r}
                className={cn(
                  "rounded-full px-3.5 py-2 text-[0.8rem] font-medium ring-1 transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40",
                  region === r
                    ? "bg-ink text-white ring-ink shadow-soft"
                    : "bg-white text-ink/70 ring-ink/10 hover:bg-ink/[0.05] hover:text-ink",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Grid ---- */}
      <div ref={resultsRef} className="mx-auto max-w-7xl scroll-mt-40 px-4 py-10 pb-24 sm:px-6 sm:py-14 sm:pb-14 lg:px-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <p className="font-display text-2xl text-ink">No communities found</p>
            <p className="mt-2 text-[0.95rem] text-slate">
              Try a different search term or reset the region filter.
            </p>
            <button
              type="button"
              onClick={() => { setQuery(""); setRegion("All"); }}
              className="mt-5 inline-flex min-h-[44px] items-center rounded-full bg-ink px-5 py-2 text-[0.85rem] font-medium text-white shadow-soft transition hover:bg-ink/80 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <>
            <p className="mb-6 text-[0.85rem] text-slate" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? "community" : "communities"}{region !== "All" ? ` in ${region}` : ""}
            </p>
            {/* Keyed on the active filters so the grid gently re-reveals when
                the result set changes — subtle "it updated" feedback. */}
            <div
              key={`${region}|${query}`}
              className="grid grid-cols-1 gap-5 motion-safe:animate-[fade_0.35s_ease-out] sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((c, i) => (
                <Reveal key={c.slug} delay={(i % 6) * 0.05}>
                  <CommunityCard community={c} />
                </Reveal>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
