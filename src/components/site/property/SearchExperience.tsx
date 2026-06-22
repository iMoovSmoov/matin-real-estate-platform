"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Search, SlidersHorizontal, X, MapPinned, ChevronDown, Map, List } from "lucide-react";
import { ListingCard } from "@/components/site/ListingCard";
import { Button } from "@/components/ui/button";
import { scrollIntoViewSafe } from "@/components/site/useScrollReveal";
import { cn, compactUsd } from "@/lib/utils";
import type { Listing, ListingStatus } from "@/lib/types";

const PropertyMap = dynamic(() => import("@/components/site/PropertyMap"), { ssr: false });

const TYPES = ["Single Family", "Condo", "Townhouse", "Acreage Estate"] as const;
const STATUSES: ListingStatus[] = ["Active", "New", "Pending", "Coming Soon", "Sold"];
const BEDS = [1, 2, 3, 4, 5] as const;
const BATHS = [1, 2, 3] as const;

type Sort = "newest" | "price-asc" | "price-desc" | "beds-desc";
type View = "list" | "map";

const SORTS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price — Low to High" },
  { value: "price-desc", label: "Price — High to Low" },
  { value: "beds-desc", label: "Most Beds" },
];

export function SearchExperience({
  listings,
  initialQuery = "",
  initialType = "",
}: {
  listings: Listing[];
  initialQuery?: string;
  initialType?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);
  const [status, setStatus] = useState<string>("");
  const [minBeds, setMinBeds] = useState<number>(0);
  const [minBaths, setMinBaths] = useState<number>(0);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sort, setSort] = useState<Sort>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<View>("list");
  const resultsRef = useRef<HTMLDivElement>(null);

  // After a filter/sort change, surface the updated results. Only fires below
  // lg, where the list scrolls in the page flow beneath the filter accordion;
  // at lg+ the list is its own scroll pane and already visible.
  function revealResults() {
    scrollIntoViewSafe(resultsRef.current, { block: "start", onlyBelowLg: true });
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) : 0;
    const max = maxPrice ? Number(maxPrice) : Infinity;

    const filtered = listings.filter((l) => {
      if (q) {
        const hay = `${l.city} ${l.state} ${l.communitySlug} ${l.address} ${l.zip}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (type && l.type !== type) return false;
      if (status && l.status !== status) return false;
      if (minBeds && l.beds < minBeds) return false;
      if (minBaths && l.baths < minBaths) return false;
      if (l.price < min || l.price > max) return false;
      return true;
    });

    const sorted = [...filtered];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "beds-desc") sorted.sort((a, b) => b.beds - a.beds);
    else sorted.sort((a, b) => a.daysOnMarket - b.daysOnMarket);
    return sorted;
  }, [listings, query, type, status, minBeds, minBaths, minPrice, maxPrice, sort]);

  const activeFilterCount =
    (type ? 1 : 0) +
    (status ? 1 : 0) +
    (minBeds ? 1 : 0) +
    (minBaths ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0);

  function reset() {
    setQuery("");
    setType("");
    setStatus("");
    setMinBeds(0);
    setMinBaths(0);
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
  }

  return (
    <div className="flex flex-col lg:flex-row" style={{ minHeight: "calc(100vh - 4rem)" }}>

      {/* ══════════════════════════════════════════════
          MOBILE VIEW TOGGLE — sticky bar at the top
      ══════════════════════════════════════════════ */}
      <div className="sticky top-16 z-20 flex gap-1 border-b border-ink/[0.08] bg-white px-4 py-2.5 lg:hidden">
        <button
          type="button"
          onClick={() => setView("list")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition-all",
            view === "list" ? "bg-ink text-white" : "text-slate hover:text-ink",
          )}
        >
          <List className="h-4 w-4" /> List
        </button>
        <button
          type="button"
          onClick={() => setView("map")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition-all",
            view === "map" ? "bg-ink text-white" : "text-slate hover:text-ink",
          )}
        >
          <Map className="h-4 w-4" /> Map
        </button>
      </div>

      {/* ══════════════════════════════════════════════
          LEFT PANEL — filters + results list
          Hidden on mobile when map view is active
      ══════════════════════════════════════════════ */}
      <div
        className={cn(
          "flex flex-col bg-white",
          view === "map" ? "hidden lg:flex" : "flex",
          "lg:w-[44%] lg:border-r lg:border-ink/[0.08] lg:overflow-y-auto lg:sticky lg:top-16",
        )}
        style={{ height: "calc(100vh - 4rem)" }}
      >
        {/* ── Filter sidebar (paper bg) ── */}
        <div className="bg-paper/60 border-b border-ink/[0.07] px-4 pt-4 pb-0">
          {/* Search box */}
          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 shadow-soft ring-1 ring-ink/[0.1] focus-within:ring-azure/40">
            <Search className="h-5 w-5 shrink-0 text-azure" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="City, neighborhood, or ZIP"
              className="w-full bg-transparent py-3 text-[0.95rem] text-ink placeholder:text-slate/70 focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search" className="text-slate hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Mobile: collapsible filter accordion toggle */}
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="mt-3 flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-medium text-ink shadow-soft ring-1 ring-ink/[0.1] lg:hidden"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-azure" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-azure px-1.5 text-[0.68rem] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </span>
            <ChevronDown className={cn("h-4 w-4 text-slate transition-transform duration-200", filtersOpen && "rotate-180")} />
          </button>

          {/* Filter fields — always visible on desktop, collapsible on mobile */}
          <div className={cn("mt-4 space-y-6 pb-5", !filtersOpen && "hidden lg:block")}>
            {/* Property type */}
            <FilterGroup label="Property type">
              <div className="flex flex-wrap gap-2">
                <Chip active={type === ""} onClick={() => { setType(""); revealResults(); }}>Any</Chip>
                {TYPES.map((t) => (
                  <Chip key={t} active={type === t} onClick={() => { setType(type === t ? "" : t); revealResults(); }}>
                    {t === "Acreage Estate" ? "Acreage" : t}
                  </Chip>
                ))}
              </div>
            </FilterGroup>

            {/* Status */}
            <FilterGroup label="Status">
              <div className="flex flex-wrap gap-2">
                <Chip active={status === ""} onClick={() => { setStatus(""); revealResults(); }}>Any</Chip>
                {STATUSES.map((s) => (
                  <Chip key={s} active={status === s} onClick={() => { setStatus(status === s ? "" : s); revealResults(); }}>
                    {s}
                  </Chip>
                ))}
              </div>
            </FilterGroup>

            {/* Beds */}
            <FilterGroup label="Min bedrooms">
              <div className="flex flex-wrap gap-2">
                <Chip active={minBeds === 0} onClick={() => { setMinBeds(0); revealResults(); }}>Any</Chip>
                {BEDS.map((b) => (
                  <Chip key={b} active={minBeds === b} onClick={() => { setMinBeds(minBeds === b ? 0 : b); revealResults(); }}>
                    {b}+
                  </Chip>
                ))}
              </div>
            </FilterGroup>

            {/* Baths */}
            <FilterGroup label="Min bathrooms">
              <div className="flex flex-wrap gap-2">
                <Chip active={minBaths === 0} onClick={() => { setMinBaths(0); revealResults(); }}>Any</Chip>
                {BATHS.map((b) => (
                  <Chip key={b} active={minBaths === b} onClick={() => { setMinBaths(minBaths === b ? 0 : b); revealResults(); }}>
                    {b}+
                  </Chip>
                ))}
              </div>
            </FilterGroup>

            {/* Price range */}
            <FilterGroup label="Price range">
              <div className="flex items-center gap-2">
                <PriceInput value={minPrice} onChange={setMinPrice} placeholder="No min" />
                <span className="text-slate">—</span>
                <PriceInput value={maxPrice} onChange={setMaxPrice} placeholder="No max" />
              </div>
              {(minPrice || maxPrice) && (
                <p className="mt-2 text-[0.78rem] text-slate">
                  {minPrice ? compactUsd(Number(minPrice)) : "$0"} — {maxPrice ? compactUsd(Number(maxPrice)) : "any"}
                </p>
              )}
            </FilterGroup>

            {(activeFilterCount > 0 || query) && (
              <Button variant="outline" size="sm" onClick={reset} className="w-full">
                <X className="h-4 w-4 mr-1" /> Reset all filters
              </Button>
            )}
          </div>
        </div>

        {/* ── Results list ── */}
        <div ref={resultsRef} className="flex-1 scroll-mt-28 overflow-y-auto px-4 pb-8">
          {/* Results count + sort */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.08] py-4">
            <p className="text-sm text-slate" aria-live="polite">
              Showing{" "}
              <span className="font-display text-2xl font-bold text-ink">{results.length}</span>{" "}
              <span className="font-medium text-ink/80">{results.length === 1 ? "home" : "homes"}</span>
              {query && (
                <>
                  {" "}for <span className="font-medium text-ink">&ldquo;{query}&rdquo;</span>
                </>
              )}
            </p>
            <label className="flex items-center gap-2 text-sm text-slate">
              Sort by
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="appearance-none rounded-full bg-cloud py-2 pl-4 pr-9 text-[0.85rem] font-medium text-ink shadow-soft ring-1 ring-ink/[0.08] focus:outline-none focus-visible:ring-azure/40"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
              </div>
            </label>
          </div>

          {results.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          ) : (
            /* ── Empty state ── */
            <div className="mt-8 flex flex-col items-center justify-center rounded-2xl bg-cloud px-6 py-20 text-center shadow-soft ring-1 ring-ink/[0.06]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-azure/10 text-azure">
                <MapPinned className="h-8 w-8" />
              </div>
              <h3 className="mt-5 font-display text-2xl text-ink">No homes match your search</h3>
              <p className="mt-2 max-w-md text-[0.95rem] text-slate">
                Try widening your price range, clearing a filter, or searching a nearby community.
              </p>
              <Button variant="primary" size="md" onClick={reset} className="mt-6">
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          RIGHT PANEL — map
          Full screen on mobile when map tab is active
      ══════════════════════════════════════════════ */}
      <div
        className={cn(
          view === "list" ? "hidden lg:block" : "block",
          "lg:flex-1 lg:sticky lg:top-16",
        )}
        style={{ height: "calc(100vh - 4rem)" }}
      >
        <PropertyMap listings={results} className="h-full w-full" />
      </div>
    </div>
  );
}

/* ────────────────────────────────────── helpers ── */

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2.5 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-slate/70">{label}</h3>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-[36px] rounded-full px-3.5 py-1.5 text-[0.8rem] font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-1",
        active
          ? "bg-ink text-white shadow-[0_4px_14px_rgba(6,6,6,.25)]"
          : "bg-white text-ink/70 ring-1 ring-ink/[0.12] hover:ring-ink/40 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function PriceInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-1 items-center rounded-xl bg-white px-3 shadow-soft ring-1 ring-ink/[0.1] focus-within:ring-azure/40">
      <span className="text-[0.85rem] text-slate">$</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder={placeholder}
        className="w-full bg-transparent py-2.5 pl-1 text-[0.85rem] text-ink placeholder:text-slate/60 focus:outline-none"
      />
    </div>
  );
}
