/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — TerritoryMap shared types + constants   (ref G-C)

   Plain TS (no leaflet, no "use client") so BOTH the server-importable wrapper
   (TerritoryMap.tsx) and the client-only Leaflet impl (TerritoryMapInner.tsx)
   can share these without pulling `leaflet` (which touches `window`) into the
   server module graph. Re-exported through TerritoryMap.tsx / the barrel.
   ────────────────────────────────────────────────────────────────────────── */

// ── Real Matin offices (from tmp/matin-scrape/locations.json) ──────────────
export type TerritoryOffice = {
  name: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  hq?: boolean;
};

export const MATIN_OFFICES: TerritoryOffice[] = [
  {
    name: "Matin Real Estate — West Linn HQ",
    label: "West Linn HQ",
    address: "18825 Willamette Dr, West Linn, OR 97068",
    lat: 45.3897394,
    lng: -122.6446416,
    hq: true,
  },
  {
    name: "Matin Real Estate — Vancouver WA",
    label: "Vancouver, WA",
    address: "1220 Main St Ste 400, Vancouver, WA 98660",
    lat: 45.6307508,
    lng: -122.6718,
  },
];

/** Portland metro center (matches site/PropertyMap default). */
export const PORTLAND_METRO_CENTER: [number, number] = [45.5231, -122.6765];

/** Minimal listing marker shape — structurally compatible with lib `Listing`. */
export type TerritoryListing = {
  id: string;
  address: string;
  price: number;
  lat: number;
  lng: number;
  city?: string;
  beds?: number;
  baths?: number;
  href?: string;
};

/** Minimal community marker shape (real Matin service communities). */
export type TerritoryCommunity = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  count?: number;
  href?: string;
};

export type TerritoryMapProps = {
  /** Active-listing pins (price-labeled). Optional. */
  listings?: TerritoryListing[];
  /** Community pins (gold dot). Optional. */
  communities?: TerritoryCommunity[];
  /** Override the two default office pins if needed. */
  offices?: TerritoryOffice[];
  /** Map center; defaults to Portland metro. */
  center?: [number, number];
  /** Initial zoom; defaults to 10. */
  zoom?: number;
  /** Fixed pixel height (overrides the responsive aspect box). */
  height?: number | string;
  /** Extra classes on the outer wrapper. */
  className?: string;
  /** Callback when a listing pin is clicked. */
  onSelectListing?: (id: string) => void;
};
