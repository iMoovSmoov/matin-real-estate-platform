"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Bath,
  BedDouble,
  ChevronDown,
  Grid2X2,
  Heart,
  List,
  Map,
  MapPin,
  Maximize,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { ListingCard } from "@/components/site/ListingCard";
import { scrollIntoViewSafe } from "@/components/site/useScrollReveal";
import { cn, compactUsd, num, usd } from "@/lib/utils";
import { listingPhoto } from "@/lib/data";
import type { Listing, ListingStatus } from "@/lib/types";

const PropertyMap = dynamic(() => import("@/components/site/PropertyMap"), { ssr: false });

const TYPES = ["Single Family", "Condo", "Townhouse", "Acreage Estate"] as const;
const STATUSES: ListingStatus[] = ["Active", "New", "Pending", "Coming Soon", "Sold"];
const BEDS = [1, 2, 3, 4, 5] as const;
const BATHS = [1, 2, 3] as const;

type Sort = "newest" | "price-asc" | "price-desc" | "beds-desc";
type View = "grid" | "list" | "map";

const SORTS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price low to high" },
  { value: "price-desc", label: "Price high to low" },
  { value: "beds-desc", label: "Most bedrooms" },
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
  const [view, setView] = useState<View>("map");
  const [selectedId, setSelectedId] = useState<string | null>(listings[0]?.id ?? null);
  const resultsRef = useRef<HTMLDivElement>(null);

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
    setFiltersOpen(false);
  }

  function setFilter(update: () => void) {
    update();
    revealResults();
  }

  return (
    <section className="bg-paper">
      <div className="sticky top-[58px] z-30 border-b border-ink/[0.08] bg-cloud/92 shadow-[0_1px_0_rgba(6,6,6,.04)] backdrop-blur-xl">
        <div className="container-x py-3">
          <div className="overflow-hidden rounded-2xl border border-ink/[0.08] bg-cloud shadow-soft">
            <div className="grid gap-px bg-ink/[0.07] md:grid-cols-[1.5fr_0.8fr_0.8fr_0.9fr_auto]">
              <label className="flex min-h-[56px] items-center gap-3 bg-cloud px-4">
                <Search className="h-4 w-4 shrink-0 text-ink/45" />
                <span className="sr-only">Search location</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="City, county, address, school, or ZIP"
                  className="w-full bg-transparent text-[0.94rem] text-ink outline-none placeholder:text-slate"
                />
                {query ? (
                  <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-slate hover:text-ink">
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </label>

              <SelectBlock label="Status" value={status || "For Sale"} onChange={(v) => setFilter(() => setStatus(v === "For Sale" ? "" : v))}>
                <option value="For Sale">For Sale</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </SelectBlock>

              <SelectBlock label="Price" value={sort} onChange={(v) => setSort(v as Sort)}>
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </SelectBlock>

              <SelectBlock label="Beds" value={minBeds ? `${minBeds}` : "Any"} onChange={(v) => setFilter(() => setMinBeds(v === "Any" ? 0 : Number(v)))}>
                <option value="Any">Any beds</option>
                {BEDS.map((b) => (
                  <option key={b} value={b}>{b}+ beds</option>
                ))}
              </SelectBlock>

              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                className={cn(
                  "flex min-h-[56px] items-center justify-center gap-2 bg-cloud px-4 text-[0.88rem] font-semibold text-ink transition-colors hover:bg-paper",
                  filtersOpen && "bg-paper",
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[0.68rem] text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            </div>

            <div className={cn("grid gap-4 border-t border-ink/[0.07] px-4 py-4 lg:grid-cols-[1fr_1fr_1fr_auto]", !filtersOpen && "hidden")}>
              <FilterGroup label="Property type">
                <Chip active={type === ""} onClick={() => setFilter(() => setType(""))}>Any</Chip>
                {TYPES.map((t) => (
                  <Chip key={t} active={type === t} onClick={() => setFilter(() => setType(type === t ? "" : t))}>
                    {t === "Acreage Estate" ? "Acreage" : t}
                  </Chip>
                ))}
              </FilterGroup>
              <FilterGroup label="Bathrooms">
                <Chip active={minBaths === 0} onClick={() => setFilter(() => setMinBaths(0))}>Any</Chip>
                {BATHS.map((b) => (
                  <Chip key={b} active={minBaths === b} onClick={() => setFilter(() => setMinBaths(minBaths === b ? 0 : b))}>
                    {b}+
                  </Chip>
                ))}
              </FilterGroup>
              <FilterGroup label="Price range">
                <div className="flex items-center gap-2">
                  <PriceInput value={minPrice} onChange={setMinPrice} placeholder="No min" />
                  <span className="text-slate">-</span>
                  <PriceInput value={maxPrice} onChange={setMaxPrice} placeholder="No max" />
                </div>
                {(minPrice || maxPrice) ? (
                  <p className="mt-2 text-[0.76rem] text-slate">
                    {minPrice ? compactUsd(Number(minPrice)) : "$0"} to {maxPrice ? compactUsd(Number(maxPrice)) : "any"}
                  </p>
                ) : null}
              </FilterGroup>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={reset}
                  className="min-h-[40px] rounded-full border border-ink/[0.12] px-4 text-[0.82rem] font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.95rem] font-semibold text-ink" aria-live="polite">
                {results.length} current Matin {results.length === 1 ? "listing" : "listings"}
              </p>
              <p className="text-[0.82rem] text-slate">
                {query ? `Filtered by "${query}"` : "All listings"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ViewButton active={view === "grid"} onClick={() => setView("grid")} icon={<Grid2X2 className="h-4 w-4" />}>Grid</ViewButton>
              <ViewButton active={view === "list"} onClick={() => setView("list")} icon={<List className="h-4 w-4" />}>List</ViewButton>
              <ViewButton active={view === "map"} onClick={() => setView("map")} icon={<Map className="h-4 w-4" />}>Map</ViewButton>
              <button
                type="button"
                className="hidden min-h-[42px] items-center gap-2 rounded-xl bg-ink px-4 text-[0.85rem] font-semibold text-white shadow-soft transition-colors hover:bg-ink-800 sm:inline-flex"
              >
                <Heart className="h-4 w-4" />
                Save search
              </button>
            </div>
          </div>
        </div>
      </div>

      <div ref={resultsRef} className="container-x scroll-mt-32 py-6 lg:py-8">
        {results.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl bg-cloud px-6 py-16 text-center shadow-soft ring-1 ring-ink/[0.06]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink text-white">
              <MapPin className="h-7 w-7" />
            </div>
            <h3 className="mt-5 font-display text-2xl text-ink">No homes match your search</h3>
            <p className="mt-2 max-w-md text-[0.95rem] text-slate">
              Try widening your price range, clearing a filter, or searching a nearby community.
            </p>
            <button type="button" onClick={reset} className="mt-6 rounded-full bg-ink px-5 py-2.5 text-[0.9rem] font-semibold text-white">
              Clear filters
            </button>
          </div>
        ) : view === "map" ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.92fr)]">
            <div className="overflow-hidden rounded-3xl border border-ink/[0.08] bg-[#e9eee9] shadow-soft lg:sticky lg:top-[150px] lg:h-[calc(100vh-178px)]">
              <PropertyMap listings={results} selectedId={selectedId ?? undefined} onSelect={setSelectedId} className="h-[62vh] min-h-[440px] lg:h-full" />
            </div>
            <div className="flex max-h-none flex-col gap-3 lg:max-h-[calc(100vh-178px)] lg:overflow-y-auto lg:pr-1">
              {results.map((l) => (
                <SearchResultRow
                  key={l.id}
                  listing={l}
                  active={selectedId === l.id}
                  onFocus={() => setSelectedId(l.id)}
                />
              ))}
            </div>
          </div>
        ) : view === "list" ? (
          <div className="mx-auto max-w-5xl space-y-3">
            {results.map((l) => (
              <SearchResultRow key={l.id} listing={l} active={selectedId === l.id} onFocus={() => setSelectedId(l.id)} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SearchResultRow({
  listing,
  active,
  onFocus,
}: {
  listing: Listing;
  active: boolean;
  onFocus: () => void;
}) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      onMouseEnter={onFocus}
      onFocus={onFocus}
      className={cn(
        "group grid gap-4 rounded-2xl border bg-cloud p-3 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift sm:grid-cols-[150px_1fr_auto]",
        active ? "border-gold/80 ring-2 ring-gold/10" : "border-ink/[0.08]",
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-paper-200 sm:aspect-auto">
        <Image
          src={listingPhoto(listing)}
          alt={listing.address}
          fill
          sizes="180px"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="min-w-0 self-center">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn(
            "rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em]",
            listing.status === "Active" || listing.status === "New"
              ? "bg-gold-soft text-gold-ink"
              : "bg-paper text-slate ring-1 ring-ink/[0.08]",
          )}>
            {listing.status}
          </span>
          <span className="text-[0.78rem] text-slate">{listing.daysOnMarket === 0 ? "Just listed" : `${listing.daysOnMarket} days on market`}</span>
        </div>
        <h3 className="mt-2 truncate text-[1.05rem] font-semibold text-ink">{listing.address}</h3>
        <p className="mt-0.5 text-[0.9rem] text-slate">{listing.city}, {listing.state} {listing.zip}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-[0.78rem] text-slate">
          <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5 text-ink/50" /> {listing.beds} BD</span>
          <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5 text-ink/50" /> {listing.baths} BA</span>
          <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5 text-ink/50" /> {num(listing.sqft)} SF</span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-3 sm:flex-col sm:items-end sm:self-stretch">
        <div className="font-display text-[1.45rem] font-semibold leading-none text-ink">{usd(listing.price)}</div>
        <span className="rounded-xl bg-[#d6ad55] px-3.5 py-2 text-[0.82rem] font-bold text-ink transition-colors group-hover:bg-[#e4bf69]">
          Tour {listing.address.split(" ")[0]}
        </span>
      </div>
    </Link>
  );
}

function SelectBlock({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative flex min-h-[56px] flex-col justify-center bg-cloud px-4">
      <span className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-slate">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full appearance-none bg-transparent pr-6 text-[0.9rem] font-semibold text-ink outline-none"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
    </label>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate">{label}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
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
        "min-h-[36px] rounded-full px-3.5 py-1.5 text-[0.8rem] font-semibold transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40",
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
    <div className="flex flex-1 items-center rounded-xl bg-white px-3 ring-1 ring-ink/[0.1] focus-within:ring-ink/35">
      <span className="text-[0.85rem] text-slate">$</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={() => scrollIntoViewSafe(null)}
        placeholder={placeholder}
        className="w-full bg-transparent py-2.5 pl-1 text-[0.85rem] text-ink placeholder:text-slate/60 focus:outline-none"
      />
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-[42px] items-center gap-2 rounded-xl px-3.5 text-[0.84rem] font-bold transition-colors",
        active ? "bg-ink text-white" : "bg-cloud text-ink ring-1 ring-ink/[0.08] hover:bg-paper",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </button>
  );
}
