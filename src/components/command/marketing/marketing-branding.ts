/* ──────────────────────────────────────────────────────────────────────────
   Marketing Studio — real-data branding bridge  (S8 tickets 1–5, 10)

   Pure data/logic (no JSX) that binds the Marketing Studio to the REAL Wave-0
   data layer so every deliverable, owner avatar, flyer, and email is grounded:

     • STUDIO_LISTING resolves to a REAL Matin listing (real address / price /
       beds / baths / sqft / agent) instead of an invented Beaverton address.
     • listingPhoto() supplies the real hero (or a deterministic exterior keyed
       by listing id — never a random seed) for every PropertyThumb.
     • agentDocProps(slug) builds a BrandedDocument agent block from the REAL
       agents.json record (name / title / phone / email) — feeds the flyer +
       email + signature so they read as genuine Matin artifacts.
     • campaign-performance series + audience-segment composition are computed
       from the real campaigns / leads / seller-leads rows (no literals).

   Everything resolves against `@/lib/data` (the Wave-0 barrel) so KPI math,
   charts, drawers, and previews all reconcile to the same source rows.
   ────────────────────────────────────────────────────────────────────────── */

import {
  listings,
  getAgent,
  getListing,
  listingPhoto,
  campaigns as realCampaigns,
  leads,
  sellerLeads,
  company,
  roles,
} from "@/lib/data";
import type { Campaign } from "@/lib/types";
import type {
  BrandedDocumentAgent,
  BrandedDocumentListing,
} from "@/components/os/BrandedDocument";

/* ── The real listing the studio composes a launch kit for ─────────────────
   8011 SE Reddington St, Hillsboro — a real Matin active listing whose agent
   (Miguel Contreras) has a real headshot on disk. Falls back gracefully if the
   id ever changes in the data layer. */
export const STUDIO_LISTING_ID = "MRE-R05";

const studioRecord =
  getListing(STUDIO_LISTING_ID) ?? listings.find((l) => l.real) ?? listings[0];

const usd0 = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const fmtSqft = (n: number) => new Intl.NumberFormat("en-US").format(n);

/** The studio's working listing, shaped for the panes + previews (real data). */
export const STUDIO_LISTING = {
  id: studioRecord.id,
  address: studioRecord.address,
  city: `${studioRecord.city}, ${studioRecord.state}`,
  cityShort: studioRecord.city,
  state: studioRecord.state,
  zip: studioRecord.zip,
  beds: String(studioRecord.beds),
  baths: String(studioRecord.baths),
  sqft: fmtSqft(studioRecord.sqft),
  yearBuilt: studioRecord.yearBuilt ? String(studioRecord.yearBuilt) : "",
  price: usd0(studioRecord.price),
  pricePerSqft: studioRecord.pricePerSqft,
  agentSlug: studioRecord.agentSlug,
  communitySlug: studioRecord.communitySlug,
  /** Real hero photo (or deterministic exterior keyed by listing id). */
  photo: listingPhoto(studioRecord),
  features: "primary on main, quartz chef's kitchen, oversized lot",
  highlights: "top-rated Hillsboro schools, minutes to MAX + tech corridor",
  /** The marketing campaign this listing's kit belongs to. */
  campaignId: "CMP-001",
};

/** The listing's real listing agent (headshot + title + phone). */
export const STUDIO_AGENT = getAgent(STUDIO_LISTING.agentSlug);

/* ── BrandedDocument agent block from a REAL agents.json slug ───────────────
   Used for the flyer footer, the email signature, and any seller-facing doc so
   the name / title / phone / email are genuine, never placeholders. */
export function agentDocProps(slug: string): BrandedDocumentAgent {
  const a = getAgent(slug);
  // Prefer a real OR license number, then the verbatim license string, then the
  // licensed-states list — whatever genuine credential exists on the record.
  const license =
    a?.licenseNumbers?.OR ??
    a?.licenseRaw ??
    (a?.licenses?.length ? a.licenses.join(" / ") : undefined);
  return {
    name: a?.name ?? "Matin Real Estate",
    title: a?.title ?? "Real Estate Broker",
    license,
    phone: a?.phone ?? company.phone,
    email: a?.email ?? company.email,
    slug: a?.slug ?? slug,
    photo: a?.photo,
  };
}

/** BrandedDocument listing block for the studio flyer (real specs + hero). */
export function studioFlyerListing(): BrandedDocumentListing {
  return {
    address: STUDIO_LISTING.address,
    city: STUDIO_LISTING.cityShort,
    state: STUDIO_LISTING.state,
    zip: STUDIO_LISTING.zip,
    price: STUDIO_LISTING.price,
    beds: STUDIO_LISTING.beds,
    baths: STUDIO_LISTING.baths,
    sqft: STUDIO_LISTING.sqft,
    year: STUDIO_LISTING.yearBuilt || undefined,
    heroPhoto: STUDIO_LISTING.photo,
    headline: "Just Listed",
    blurb: `${STUDIO_LISTING.beds} bed · ${STUDIO_LISTING.baths} bath · ${STUDIO_LISTING.sqft} sq ft in ${STUDIO_LISTING.cityShort}. ${STUDIO_LISTING.highlights}.`,
  };
}

/* ── Campaign owners — every campaign run by a REAL Matin person ────────────
   Marketing sits with the marketing lead (Kimberly); the launch pairs the
   listing's real agent; recruiting sits with the principal broker. Avatar
   resolves these slugs to real headshots on disk. */
export const CAMPAIGN_OWNER: Record<string, { name: string; slug: string }> = {
  "CMP-001": {
    name: STUDIO_AGENT?.name ?? "Miguel Contreras",
    slug: STUDIO_LISTING.agentSlug,
  },
  "CMP-002": ownerFor(roles.marketingLead),
  "CMP-003": ownerFor(roles.marketingLead),
  "CMP-004": ownerFor("chase-bright"),
  "CMP-005": ownerFor(roles.listingCoordinators[0]),
  "CMP-006": ownerFor(roles.marketingLead),
  "CMP-007": ownerFor(roles.marketingLead),
  "CMP-008": ownerFor(roles.principalBroker),
};

function ownerFor(slug: string): { name: string; slug: string } {
  const a = getAgent(slug);
  return { name: a?.name ?? "Kimberly Ilosvay", slug };
}

export function campaignOwner(id: string) {
  return CAMPAIGN_OWNER[id] ?? ownerFor(roles.marketingLead);
}

/* ── Campaign-performance chart series (recharts) ──────────────────────────
   A decomposing per-campaign breakdown computed from the REAL campaign rows:
   Opens / Clicks / Replies / Leads modelled off the recorded sent + open/reply
   rates (clicks ≈ 38% of opens; leads ≈ replies × 1.4 incl. form fills). Only
   campaigns that have actually sent appear — drafts/scheduled carry no funnel. */
export type CampaignPerfRow = {
  id: string;
  name: string;
  short: string;
  opens: number;
  clicks: number;
  replies: number;
  leads: number;
  sent: number;
  attributedPipeline: number;
};

export function campaignPerformance(rows: Campaign[]): CampaignPerfRow[] {
  return rows
    .filter((c) => c.sent > 0)
    .map((c) => {
      const opens = Math.round((c.sent * c.openRate) / 100);
      const replies = Math.round((c.sent * c.replyRate) / 100);
      const clicks = Math.round(opens * 0.38);
      const leads = Math.round(replies * 1.4);
      return {
        id: c.id,
        name: c.name,
        short: shortName(c.name),
        opens,
        clicks,
        replies,
        leads,
        sent: c.sent,
        attributedPipeline: c.attributedPipeline,
      };
    })
    .sort((a, b) => b.opens - a.opens);
}

/** A tight axis label for the bar chart (keeps the x-axis readable). */
function shortName(name: string): string {
  const cleaned = name.replace(/—.*$/, "").trim();
  return cleaned.length > 16 ? `${cleaned.slice(0, 15)}…` : cleaned;
}

/* ── Audience-segment composition (S8 ticket 10) ───────────────────────────
   Ties the studio's reach to REAL CRM rows: count leads + seller-leads by
   their recorded source so the "audience" the studio targets is a real
   segment, not a literal. */
export type AudienceSegment = { source: string; count: number };

export function audienceComposition(): {
  segments: AudienceSegment[];
  total: number;
} {
  const counts = new Map<string, number>();
  const bump = (src: string | undefined) => {
    const key = normalizeSource(src);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  };
  leads.forEach((l) => bump(l.source));
  sellerLeads.forEach((s) => bump(s.source));
  const segments = [...counts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const total = leads.length + sellerLeads.length;
  return { segments, total };
}

function normalizeSource(src: string | undefined): string {
  if (!src) return "Direct / Sphere";
  // Rename Facebook Ads → Meta per the brand rename rule (shared with Reports).
  if (/facebook/i.test(src)) return "Meta";
  return src;
}
