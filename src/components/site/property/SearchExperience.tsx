"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
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
  X,
} from "lucide-react";
import { ListingCard } from "@/components/site/ListingCard";
import { scrollIntoViewSafe } from "@/components/site/useScrollReveal";
import { cn, num, usd } from "@/lib/utils";
import { listingPhoto } from "@/lib/data";
import type { Listing, ListingStatus } from "@/lib/types";

// Real interactive map (Leaflet) — client-only, lazy-loaded with the exact
// `dynamic(..., { ssr: false })` split the repo uses for CommunityMap →
// PropertyMap, so it never blocks SSR or the build. The design's #w-search
// shows a map with live price pins + a featured-listing overlay; this renders
// the real map (real lat/lng pins) inside the design's rounded frame.
const PropertyMap = dynamic(() => import("@/components/site/PropertyMap"), {
  ssr: false,
  loading: () => null,
});

const TYPES = ["Single Family", "Condo", "Townhouse", "Acreage Estate"] as const;
const STATUSES: ListingStatus[] = ["Active", "New", "Pending", "Coming Soon", "Sold"];
const BEDS = [1, 2, 3, 4, 5] as const;
const BATHS = [1, 2, 3] as const;

type Sort = "newest" | "price-asc" | "price-desc" | "beds-desc";
type View = "grid" | "list" | "map";

const SORTS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price low" },
  { value: "price-desc", label: "Price high" },
  { value: "beds-desc", label: "Most beds" },
];

export function SearchExperience({
  listings,
  initialQuery = "",
  initialType = "",
  initialMinBeds = 0,
  initialMaxPrice = "",
}: {
  listings: Listing[];
  initialQuery?: string;
  initialType?: string;
  initialMinBeds?: number;
  initialMaxPrice?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);
  const [status, setStatus] = useState<string>("");
  const [minBeds, setMinBeds] = useState<number>(initialMinBeds);
  const [minBaths, setMinBaths] = useState<number>(0);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>(initialMaxPrice);
  const [sort, setSort] = useState<Sort>("price-desc");
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

  const selected = results.find((l) => l.id === selectedId) ?? results[0];

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
    setSort("price-desc");
    setFiltersOpen(false);
  }

  function setFilter(update: () => void) {
    update();
    revealResults();
  }

  return (
    <section className="min-h-screen bg-paper">
      <div className="relative z-30 border-b border-ink/[0.08] bg-cloud/94 backdrop-blur-xl lg:sticky lg:top-[58px]">
        <div className="container-x py-3">
          <div className="flex flex-col gap-2 rounded-2xl border border-ink/[0.08] bg-cloud p-3 shadow-soft lg:flex-row lg:items-center">
            <label className="flex min-h-10 flex-1 items-center gap-2 rounded-[9px] border border-ink/[0.14] px-3.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              <span className="sr-only">Search location</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="West Linn, OR"
                className="min-w-0 flex-1 bg-transparent text-[0.9rem] font-medium text-ink outline-none placeholder:text-ink"
              />
              {query ? (
                <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-slate hover:text-ink">
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </label>

            <SelectPill label="For Sale" value={status || "For Sale"} onChange={(v) => setFilter(() => setStatus(v === "For Sale" ? "" : v))}>
              <option value="For Sale">For Sale</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </SelectPill>

            <SelectPill label="Price" value={sort} onChange={(v) => setSort(v as Sort)}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </SelectPill>

            <SelectPill label="Beds & Baths" value={minBeds ? `${minBeds}` : "Any"} onChange={(v) => setFilter(() => setMinBeds(v === "Any" ? 0 : Number(v)))}>
              <option value="Any">Beds & Baths</option>
              {BEDS.map((b) => (
                <option key={b} value={b}>{b}+ beds</option>
              ))}
            </SelectPill>

            <SelectPill label="Home Type" value={type || "Any"} onChange={(v) => setFilter(() => setType(v === "Any" ? "" : v))}>
              <option value="Any">Home Type</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </SelectPill>

            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className={cn(
                "inline-flex min-h-10 items-center justify-center gap-2 rounded-[9px] border border-ink/[0.14] px-3.5 text-[0.84rem] font-medium text-ink transition-colors hover:bg-paper",
                filtersOpen && "bg-paper",
              )}
            >
              More
              <ChevronDown className="h-3.5 w-3.5" />
              {activeFilterCount ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[0.68rem] text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>

            <div className="hidden items-center gap-3 lg:ml-auto lg:flex">
              <span className="text-[0.83rem] text-slate tabular-nums">
                <b className="font-semibold text-ink">{results.length}</b> homes
              </span>
              <button type="button" className="btn-accent inline-flex min-h-10 items-center gap-2 rounded-[9px] px-4 text-[0.84rem] font-semibold">
                <span className="font-display flex h-[15px] w-[15px] items-center justify-center rounded bg-white/20 text-[10px]">M</span>
                Save search
              </button>
            </div>
          </div>

          <div className={cn("grid gap-4 border-x border-b border-ink/[0.08] bg-cloud px-4 py-4 lg:grid-cols-[1fr_1fr_auto]", !filtersOpen && "hidden")}>
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
            </FilterGroup>
            <div className="flex items-end">
              <button
                type="button"
                onClick={reset}
                className="min-h-10 rounded-full border border-ink/[0.12] px-4 text-[0.82rem] font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
              >
                Reset
              </button>
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
            <div className="flex items-center gap-2 rounded-xl border border-ink/[0.08] bg-cloud p-1 shadow-soft">
              <ViewButton active={view === "grid"} onClick={() => setView("grid")} icon={<Grid2X2 className="h-4 w-4" />}>Grid</ViewButton>
              <ViewButton active={view === "list"} onClick={() => setView("list")} icon={<List className="h-4 w-4" />}>List</ViewButton>
              <ViewButton active={view === "map"} onClick={() => setView("map")} icon={<Map className="h-4 w-4" />}>Map</ViewButton>
              <button
                type="button"
                className="hidden min-h-10 items-center gap-2 rounded-[9px] bg-ink px-4 text-[0.84rem] font-semibold text-white shadow-soft transition-colors hover:bg-ink-800 sm:inline-flex lg:hidden"
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
          <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="h-auto min-w-0 overflow-y-auto rounded-2xl bg-paper lg:h-[648px] lg:pr-1">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-[0.84rem] text-slate">
                  Homes in <b className="text-ink">West Linn</b> & nearby
                </p>
                <p className="text-[0.84rem] font-medium text-ink">Sort: Price (high)</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {results.slice(0, 10).map((l) => (
                  <SearchGridCard
                    key={l.id}
                    listing={l}
                    active={selected?.id === l.id}
                    onFocus={() => setSelectedId(l.id)}
                  />
                ))}
              </div>
            </div>
            <ResultsMap
              listings={results.slice(0, 10)}
              selected={selected}
              onSelect={setSelectedId}
            />
          </div>
        ) : view === "list" ? (
          <div className="mx-auto max-w-5xl space-y-3">
            {results.map((l) => (
              <SearchResultRow key={l.id} listing={l} active={selected?.id === l.id} onFocus={() => setSelectedId(l.id)} />
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

function SearchGridCard({
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
        "group block min-w-0 overflow-hidden rounded-[13px] border bg-white shadow-[0_1px_2px_rgba(20,20,22,.05),0_10px_26px_rgba(20,20,22,.06)] transition-all hover:-translate-y-0.5 hover:shadow-lift",
        active ? "border-gold/45 ring-2 ring-gold/10" : "border-ink/[0.08]",
      )}
    >
      <div className="relative h-[148px] overflow-hidden">
        <Image
          src={listingPhoto(listing)}
          alt={listing.address}
          fill
          sizes="(max-width: 768px) 100vw, 330px"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-ink/55 px-2.5 py-1 text-[0.65rem] font-semibold text-white backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-[#56e0a0]" />
          {listing.status === "Active" ? "For Sale" : listing.status}
        </span>
      </div>
      <div className="p-3.5">
        <div className="font-display text-[1.18rem] font-medium leading-none text-ink">{usd(listing.price)}</div>
        <div className="mt-2 truncate text-[0.82rem] font-medium text-ink/80">{listing.address}</div>
        <div className="mt-0.5 text-[0.75rem] text-slate">{listing.city}, {listing.state}</div>
        <div className="mt-3 flex gap-3 border-t border-ink/[0.07] pt-3 text-[0.73rem] text-slate">
          <span><b className="text-ink">{listing.beds}</b> bd</span>
          <span><b className="text-ink">{listing.baths}</b> ba</span>
          <span><b className="text-ink">{num(listing.sqft)}</b> sf</span>
        </div>
      </div>
    </Link>
  );
}

function ResultsMap({
  listings,
  selected,
  onSelect,
}: {
  listings: Listing[];
  selected?: Listing;
  onSelect: (id: string) => void;
}) {
  // Faithful port of #w-search's right column: the design's rounded map frame
  // (its decorative grid/blob base shows under load as the green-grey gradient)
  // with the real Leaflet map (live price pins from each listing's lat/lng) and
  // the design's signature featured-listing card overlaid bottom-left.
  const card = selected ?? listings[0];

  return (
    <div className="relative h-[420px] min-w-0 overflow-hidden rounded-2xl border border-ink/[0.08] bg-[linear-gradient(160deg,#e9ece6,#dfe4dc)] shadow-soft lg:sticky lg:top-[172px] lg:h-[648px]">
      <PropertyMap listings={listings} selectedId={card?.id} onSelect={onSelect} />

      {card ? (
        <Link
          href={`/listings/${card.id}`}
          className="absolute bottom-4 left-4 z-[550] w-[228px] max-w-[calc(100%-2rem)] overflow-hidden rounded-[13px] border border-ink/[0.06] bg-white shadow-[0_14px_36px_rgba(6,6,6,.28)] transition-transform hover:-translate-y-0.5"
        >
          <div className="relative h-[104px] overflow-hidden">
            <Image src={listingPhoto(card)} alt={card.address} fill sizes="228px" className="object-cover" />
            <span className="absolute left-2 top-2 rounded-full bg-gold/95 px-2 py-1 text-[0.62rem] font-semibold text-white">
              {card.status === "Active" ? "For Sale" : card.status}
            </span>
          </div>
          <div className="p-3">
            <div className="font-display text-[1.12rem] font-medium leading-none text-ink">{usd(card.price)}</div>
            <div className="mt-1 truncate text-[0.75rem] font-medium text-ink/80">{card.address}</div>
            <div className="mt-1.5 text-[0.72rem] text-slate tabular-nums">{card.beds} bd · {card.baths} ba · {num(card.sqft)} sf</div>
          </div>
        </Link>
      ) : null}
    </div>
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
        <span className="rounded-xl bg-gold px-3.5 py-2 text-[0.82rem] font-bold text-white transition-colors group-hover:bg-gold-bright">
          Tour {listing.address.split(" ")[0]}
        </span>
      </div>
    </Link>
  );
}

function SelectPill({
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
    <label className="relative min-h-10 shrink-0 rounded-[9px] border border-ink/[0.14] px-3.5">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 appearance-none bg-transparent pr-5 text-[0.84rem] font-medium text-ink outline-none"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate" />
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
        "min-h-9 rounded-full px-3.5 py-1.5 text-[0.8rem] font-semibold transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40",
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
        "inline-flex min-h-9 items-center gap-2 rounded-[9px] px-3 text-[0.84rem] font-bold transition-colors",
        active ? "bg-ink text-white" : "bg-cloud text-ink hover:bg-paper",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </button>
  );
}
