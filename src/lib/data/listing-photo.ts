/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Listing photo binding (G-A task 6)

   Replaces the random `PropertyThumb({ seed })` calls scattered across the app
   (Today queue, CRM tracked-interest, Cash-Offer hero, Listing-Launch card +
   asset previews, Forms packets, Transactions hero, Reports recent-closings)
   with a single deterministic resolver:

       listingPhoto(listingIdOrListing)

   - If the listing has a real hero photo (`photos[0]`), return it.
   - Otherwise return a DETERMINISTIC `/matin/exteriors` fallback keyed by the
     listing id (NOT a random seed) — so the same listing always shows the same
     exterior, every render, every surface.

   There are 22 exterior images on disk (exteriors-00 … exteriors-21).
   ────────────────────────────────────────────────────────────────────────── */

import type { Listing } from "../types";

/** Count of /matin/exteriors/exteriors-NN.jpg files on disk. */
export const EXTERIOR_COUNT = 22;

/** Stable 32-bit hash of a string (FNV-ish), deterministic across runs. */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Deterministic exterior fallback path keyed by a listing id. */
export function exteriorFallback(listingId: string): string {
  const n = hashId(listingId || "MRE-0") % EXTERIOR_COUNT;
  return `/matin/exteriors/exteriors-${String(n).padStart(2, "0")}.jpg`;
}

/**
 * Resolve the hero photo for a listing. Accepts either a listing id string or a
 * Listing-shaped object (anything with `id` and optional `photos`). Always
 * returns a usable image path — real hero when present, else a deterministic
 * exterior keyed by id.
 */
export function listingPhoto(
  input: string | { id: string; photos?: string[] } | null | undefined,
): string {
  if (!input) return exteriorFallback("MRE-0");
  if (typeof input === "string") {
    // bare id: we can't see its photos here, so use the deterministic fallback.
    // Callers that have the full record should pass it for the real hero.
    return exteriorFallback(input);
  }
  const real = input.photos?.[0];
  if (real) return real;
  return exteriorFallback(input.id);
}

/**
 * Resolve a hero photo from the canonical listings collection by id — returns
 * the real `photos[0]` when the listing exists and has photos, else the
 * deterministic id-keyed exterior. Bound in data.ts (which has the listings).
 */
export function makeListingPhotoResolver(listings: Listing[]) {
  const byId = new Map(listings.map((l) => [l.id, l]));
  return function resolve(listingId: string): string {
    const l = byId.get(listingId);
    if (l?.photos?.[0]) return l.photos[0];
    return exteriorFallback(listingId);
  };
}
