"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Search, SlidersHorizontal, X, MapPinned, ChevronDown, Map, List } from "lucide-react";
import { ListingCard } from "@/components/site/ListingCard";
import { Button } from "@/components/ui/button";
import { cn, compactUsd } from "@/lib/utils";
import type { Listing, ListingStatus } from "@/lib/types";

const PropertyMap = dynamic(() => import("@/components/site/PropertyMap"), { ssr: false });

const TYPES = ["Single Family", "Condo", "Townhouse", "Acreage Estate"] as const;
const STATUSES: ListingStatus[] = ["Active", "New", "Pending", "Coming Soon", "Sold"];
const BEDS = [1, 2, 3, 4, 5] as const;

type Sort = "newest" | "price-asc" | "price-desc";
type View = "list" | "map";

const SORTS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price — Low to High" },
  { value: "price-desc", label: "Price — High to Low" },
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
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sort, setSort] = useState<Sort>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<View>("list");

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
      if (l.price < min || l.price > max) return false;
      return true;
    });

    const sorted = [...filtered];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else sorted.sort((a, b) => a.daysOnMarket - b.daysOnMarket);
    return sorted;
  }, [listings, query, type, status, minBeds, minPrice, maxPrice, sort]);

  const activeFilterCount =
    (type ? 1 : 0) + (status ? 1 : 0) + (minBeds ? 1 : 0) + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0);

  function reset() {
    setQuery("");
    setType("");
    setStatus("");
    setMinBeds(0);
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      {/* ═══ LEFT PANEL: filters + list ═══ */}
      <div
        className={cn(
          "flex flex-col",
          // On mobile: hide entirely when map view is active
          view === "map" ? "hidden lg:flex lg:flex-col" : "flex flex-col",
          // Desktop: fixed-width sidebar with scroll
          "lg:w-[44%] lg:border-r lg:border-ink/[0.08] lg:overflow-y-auto lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16",
        )}
      >
        {/* Mobile view toggle bar */}
        <div className="flex gap-1 p-3 border-b border-ink/[0.08] bg-white lg:hidden">
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-all",
              view === "list"
                ? "bg-ink text-white"
                : "bg-transparent text-slate",
            )}
          >
            <List className="h-4 w-4" /> List
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-all",
              view === "map"
                ? "bg-ink text-white"
                : "bg-transparent text-slate",
            )}
          >
            <Map className="h-4 w-4" /> Map
          </button>
        </div>

        {/* Search + filter sidebar (inner) */}
        <div className="p-4 pb-0">
          {/* Search box */}
          <div className="flex items-center gap-2 rounded-2xl bg-cloud px-4 shadow-soft ring-1 ring-ink/[0.08] focus-within:ring-azure/40">
            <Search className="h-5 w-5 shrink-0 text-azure" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="City, neighborhood, or ZIP"
              className="w-full bg-transparent py-3 text-[0.95rem] text-ink placeholder:text-slate focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search" className="text-slate hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Mobile filter accordion toggle */}
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="mt-3 flex w-full items-center justify-between rounded-xl bg-cloud px-4 py-3 text-sm font-medium text-ink shadow-soft ring-1 ring-ink/[0.08] lg:hidden"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-azure" /> Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-azure px-2 py-0.5 text-[0.7rem] text-white">{activeFilterCount}</span>
              )}
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", filtersOpen && "rotate-180")} />
          </button>

          <div className={cn("mt-4 space-y-7 pb-4", !filtersOpen && "hidden lg:block")}>
            {/* Type */}
            <FilterGroup label="Property type">
              <div className="flex flex-wrap gap-2">
                <Chip active={type === ""} onClick={() => setType("")}>Any</Chip>
                {TYPES.map((t) => (
                  <Chip key={t} active={type === t} onClick={() => setType(type === t ? "" : t)}>
                    {t === "Acreage Estate" ? "Acreage" : t}
                  </Chip>
                ))}
              </div>
            </FilterGroup>

            {/* Status */}
            <FilterGroup label="Status">
              <div className="flex flex-wrap gap-2">
                <Chip active={status === ""} onClick={() => setStatus("")}>Any</Chip>
                {STATUSES.map((s) => (
                  <Chip key={s} active={status === s} onClick={() => setStatus(status === s ? "" : s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            </FilterGroup>

            {/* Beds */}
            <FilterGroup label="Bedrooms (min)">
              <div className="flex flex-wrap gap-2">
                <Chip active={minBeds === 0} onClick={() => setMinBeds(0)}>Any</Chip>
                {BEDS.map((b) => (
                  <Chip key={b} active={minBeds === b} onClick={() => setMinBeds(b)}>
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
                  {minPrice ? compactUsd(Number(minPrice)) : "$0"} to {maxPrice ? compactUsd(Number(maxPrice)) : "any"}
                </p>
              )}
            </FilterGroup>

            {(activeFilterCount > 0 || query) && (
              <Button variant="outline" size="sm" onClick={reset} className="w-full">
                <X className="h-4 w-4" /> Reset all filters
              </Button>
            )}
          </div>
        </div>

        {/* Results list */}
        <div className="flex-1 px-4 pb-6">
          {/* Results heading + sort */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.08] py-4">
            <p className="text-[0.95rem] text-slate">
              <span className="font-display text-2xl text-ink">{results.length}</span>{" "}
              {results.length === 1 ? "home" : "homes"}
              {query && (
                <>
                  {" "}for <span className="font-medium text-ink">&ldquo;{query}&rdquo;</span>
                </>
              )}
            </p>
            <label className="flex items-center gap-2 text-sm text-slate">
              Sort
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
            <div className="mt-8 flex flex-col items-center justify-center rounded-2xl bg-cloud px-6 py-20 text-center shadow-soft ring-1 ring-ink/[0.06]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-azure/10 text-azure">
                <MapPinned className="h-8 w-8" />
              </div>
              <h3 className="mt-5 font-display text-2xl text-ink">No homes match your search</h3>
              <p className="mt-2 max-w-md text-[0.95rem] text-slate">
                Try widening your price range, clearing a filter, or searching a nearby community.
              </p>
              <Button variant="primary" size="md" onClick={reset} className="mt-6">
                Reset filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ RIGHT PANEL: map ═══ */}
      <div
        className={cn(
          // Mobile: full-screen when map view active, hidden when list view active
          view === "list"
            ? "hidden lg:block lg:flex-1 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)]"
            : "flex flex-1 h-[calc(100vh-14rem)] lg:flex-1 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)]",
        )}
      >
        {/* Mobile "back to list" toggle shown above map on mobile */}
        {view === "map" && (
          <div className="flex gap-1 p-3 border-b border-ink/[0.08] bg-white lg:hidden">
            <button
              type="button"
              onClick={() => setView("list")}
              className="flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold bg-transparent text-slate"
            >
              <List className="h-4 w-4" /> List
            </button>
            <button
              type="button"
              onClick={() => setView("map")}
              className="flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold bg-ink text-white"
            >
              <Map className="h-4 w-4" /> Map
            </button>
          </div>
        )}
        <div className="h-full w-full">
          <PropertyMap listings={results} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate">{label}</h3>
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
      className={cn(
        "rounded-full px-3.5 py-1.5 text-[0.8rem] font-medium transition-all duration-200",
        active
          ? "bg-azure text-white shadow-[0_6px_16px_rgba(46,144,224,.28)]"
          : "bg-cloud text-ink/75 ring-1 ring-ink/[0.1] hover:ring-azure/40 hover:text-ink",
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
    <div className="flex flex-1 items-center rounded-xl bg-cloud px-3 shadow-soft ring-1 ring-ink/[0.08] focus-within:ring-azure/40">
      <span className="text-[0.85rem] text-slate">$</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder={placeholder}
        className="w-full bg-transparent py-2.5 pl-1 text-[0.85rem] text-ink placeholder:text-slate focus:outline-none"
      />
    </div>
  );
}
