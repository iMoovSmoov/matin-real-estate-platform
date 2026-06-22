"use client";

import { BrandedDocument } from "@/components/os";
import {
  STUDIO_LISTING,
  studioFlyerListing,
  agentDocProps,
} from "./marketing-branding";

/* ──────────────────────────────────────────────────────────────────────────
   Marketing Studio — CampaignFlyer  (S8 ticket 5, branded flyer via G-B)

   A REAL branded print flyer rendered through the shared BrandedDocument
   `flyer` variant: Matin logo header (ink band, white wordmark) + the real
   listing hero photo + a 4-cell spec block (beds/baths/sqft/year) + the real
   listing-agent footer (headshot / name / title / phone) + the Matin mark +
   Equal-Housing line, at 8.5×11 print proportion. Download/Print produces the
   branded artifact (not a toast). All values resolve from the REAL studio
   listing + agents.json — no placeholders.
   ────────────────────────────────────────────────────────────────────────── */

export function CampaignFlyer() {
  return (
    <BrandedDocument
      variant="flyer"
      title={`${STUDIO_LISTING.address}, ${STUDIO_LISTING.cityShort}`}
      listing={studioFlyerListing()}
      agent={agentDocProps(STUDIO_LISTING.agentSlug)}
    />
  );
}
