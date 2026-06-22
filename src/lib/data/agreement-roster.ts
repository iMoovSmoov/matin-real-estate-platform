/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Section-local roster + listing-match helpers  (S5 + S7)

   Shared by Buyer-Agreements (S5) and Forms & Docs (S7). Both sections used to
   hardcode a small invented staff list (the `AGENTS`/`OWNERS` consts). This
   module sources every picker from the REAL 40-agent roster in agents.json and
   the real role-slots in roles.ts, and adds a deterministic "matched listings"
   resolver that surfaces REAL listings (real address/price/photo) inside a
   buyer's budget band so the agreement/packet reads as real software.

   Imported DIRECTLY by path (not via the shared data.ts barrel).
   ────────────────────────────────────────────────────────────────────────── */

import agentsJson from "./agents.json";
import listingsJson from "./listings.json";
import { roles } from "./roles";
import { listingPhoto } from "./listing-photo";
import type { Agent, Listing } from "../types";

const agents = agentsJson as Agent[];
const listings = listingsJson as Listing[];

/* ── Real-agent picker option ──────────────────────────────────────────────── */

export type RosterOption = {
  slug: string;
  name: string;
  /** Real published title (e.g. "Principal Broker", "Listing Coordinator"). */
  title: string;
  /** Best-effort single license string for the signature block. */
  license?: string;
  phone: string;
  email: string;
};

/** Parse a single license number out of the live `licenseRaw`/`licenseNumbers`. */
export function agentLicense(a: Agent): string | undefined {
  if (a.licenseNumbers) {
    const or = a.licenseNumbers["OR"];
    const first = or ?? Object.values(a.licenseNumbers)[0];
    if (first) return first;
  }
  if (a.licenseRaw) {
    const m = a.licenseRaw.match(/(\d{6,})/);
    if (m) return m[1];
  }
  return undefined;
}

function toOption(a: Agent): RosterOption {
  return {
    slug: a.slug,
    name: a.name,
    title: a.title,
    license: agentLicense(a),
    phone: a.phone,
    email: a.email,
  };
}

/** Look up a real agent by slug → roster option (for signature blocks etc.). */
export function rosterOption(slug: string): RosterOption | undefined {
  const a = agents.find((x) => x.slug === slug);
  return a ? toOption(a) : undefined;
}

/** Every real sales/broker agent (excludes pure support staff), name-sorted. */
export const SALES_ROSTER: RosterOption[] = agents
  .filter((a) => !a.support)
  .map(toOption)
  .sort((a, b) => a.name.localeCompare(b.name));

/** The full 40-agent roster (includes coordinators / support), name-sorted. */
export const FULL_ROSTER: RosterOption[] = [...agents]
  .map(toOption)
  .sort((a, b) => a.name.localeCompare(b.name));

/* ── Real role slots, resolved to full options (Forms ownership / S5 broker) ── */

export const PRINCIPAL_BROKER = rosterOption(roles.principalBroker)!;
export const LISTING_COORDINATORS: RosterOption[] = roles.listingCoordinators
  .map(rosterOption)
  .filter(Boolean) as RosterOption[];
export const TRANSACTION_COORDINATORS: RosterOption[] = roles.transactionCoordinators
  .map(rosterOption)
  .filter(Boolean) as RosterOption[];

/**
 * Coordinator/owner options for the Forms "+ New packet" drawer, keyed by the
 * packet template type. Listing/disclosure packets default to a real Listing
 * Coordinator; offer/closing packets to a real Transaction Coordinator; the
 * principal broker is always available for broker-review.
 */
export function packetOwnerOptions(
  templateId: "listing" | "buyer" | "offer" | "disclosure",
): RosterOption[] {
  const lc = LISTING_COORDINATORS;
  const tc = TRANSACTION_COORDINATORS;
  const broker = PRINCIPAL_BROKER;
  const dedupe = (list: RosterOption[]) => {
    const seen = new Set<string>();
    return list.filter((o) => (seen.has(o.slug) ? false : (seen.add(o.slug), true)));
  };
  if (templateId === "listing" || templateId === "disclosure") {
    return dedupe([...lc, broker, ...tc]);
  }
  return dedupe([...tc, broker, ...lc]);
}

/* ── Matched listings (real address/price/photo within a budget band) ──────── */

export type MatchedListing = {
  id: string;
  address: string;
  city: string;
  state: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  photo: string;
  status: string;
};

const NON_SELLABLE = new Set(["Sold"]);

/**
 * Real listings that fit a buyer's representation area + budget band. Matches by
 * city name (case-insensitive) against the area list, filters to the price band
 * (with a soft ±8% cushion so the band is never empty for a realistic budget),
 * sorts by closeness to the band midpoint, and returns the top `limit`.
 * Each result carries a real `photo` via the deterministic listing-photo
 * resolver (real `photos[0]` when present, else an id-keyed exterior).
 */
export function matchedListings(
  areas: string[],
  budgetMin: number,
  budgetMax: number,
  limit = 3,
): MatchedListing[] {
  const wantedCities = areas
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);
  if (wantedCities.length === 0) return [];

  const lo = budgetMin > 0 ? budgetMin * 0.92 : 0;
  const hi = budgetMax > 0 ? budgetMax * 1.08 : Number.POSITIVE_INFINITY;
  const mid = budgetMin && budgetMax ? (budgetMin + budgetMax) / 2 : hi;

  const candidates = listings.filter((l) => {
    if (NON_SELLABLE.has(l.status)) return false;
    const cityMatch = wantedCities.some(
      (c) => l.city.toLowerCase() === c || l.city.toLowerCase().includes(c) || c.includes(l.city.toLowerCase()),
    );
    if (!cityMatch) return false;
    return l.price >= lo && l.price <= hi;
  });

  return candidates
    .sort((a, b) => Math.abs(a.price - mid) - Math.abs(b.price - mid))
    .slice(0, limit)
    .map((l) => ({
      id: l.id,
      address: l.address,
      city: l.city,
      state: l.state,
      price: l.price,
      beds: l.beds,
      baths: l.baths,
      sqft: l.sqft,
      photo: listingPhoto(l),
      status: l.status,
    }));
}
