import { listings, listingPhoto } from "@/lib/data";
import type { Listing } from "@/lib/types";

/* ──────────────────────────────────────────────────────────────────────────
   Today / CRM — REAL matched-listing resolver (S1.7 / S2.5)

   The intent-aware AI cards must cite REAL listings from `listings.json` — same
   community + inside the buyer's budget band — with real addresses, prices, and
   hero photos (never invented "1248 NW Cedar Hills" filler). This pure module
   resolves a buyer's (communitySlug, budgetMin..budgetMax) to up to N active
   real listings, widening to the broader metro only if the exact community has
   no active match, so the card always has real evidence to show.
   ────────────────────────────────────────────────────────────────────────── */

export type MatchedListing = {
  id: string;
  address: string;
  city: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  communitySlug: string;
  photo: string;
};

const isActive = (l: Listing) => l.status !== "Sold" && l.status !== "Pending";

function toMatch(l: Listing): MatchedListing {
  return {
    id: l.id,
    address: l.address,
    city: l.city,
    price: l.price,
    beds: l.beds,
    baths: l.baths,
    sqft: l.sqft,
    communitySlug: l.communitySlug,
    photo: listingPhoto(l),
  };
}

/**
 * Resolve up to `limit` REAL active listings for a buyer in the given community
 * inside [min, max]. Tiers, best first:
 *   1. same community + inside budget band
 *   2. same community (any price), nearest to mid-budget
 *   3. metro-wide inside budget band, nearest to mid-budget
 * Deterministic ordering (price asc within a tier) so the same lead always
 * surfaces the same homes.
 */
export function matchedListingsFor(
  communitySlug: string,
  budgetMin: number,
  budgetMax: number,
  limit = 3,
): MatchedListing[] {
  const min = budgetMin || 0;
  const max = budgetMax || Number.MAX_SAFE_INTEGER;
  const mid = (min + (budgetMax || min)) / 2 || max;
  const active = listings.filter(isActive);

  const inCommunityBudget = active
    .filter((l) => l.communitySlug === communitySlug && l.price >= min * 0.9 && l.price <= max * 1.1)
    .sort((a, b) => a.price - b.price);

  const inCommunity = active
    .filter((l) => l.communitySlug === communitySlug)
    .sort((a, b) => Math.abs(a.price - mid) - Math.abs(b.price - mid));

  const inBudget = active
    .filter((l) => l.price >= min * 0.9 && l.price <= max * 1.1)
    .sort((a, b) => Math.abs(a.price - mid) - Math.abs(b.price - mid));

  const picked = new Map<string, Listing>();
  for (const pool of [inCommunityBudget, inCommunity, inBudget]) {
    for (const l of pool) {
      if (picked.size >= limit) break;
      if (!picked.has(l.id)) picked.set(l.id, l);
    }
    if (picked.size >= limit) break;
  }
  return [...picked.values()].slice(0, limit).map(toMatch);
}
