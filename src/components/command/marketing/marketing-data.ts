/* ──────────────────────────────────────────────────────────────────────────
   Marketing Studio — derived domain data + helpers

   Pure data/logic (no JSX) shared across the Marketing Studio panes. Keeps the
   page and components thin: campaign owners, the listing each studio template
   composes for, channel-deliverable seed copy, and the markdown→channel mapper
   that turns a streamed `marketing-kit` into per-channel preview bodies.

   Everything here resolves against the REAL data layer (campaigns,
   marketingAssets) so KPI math, drawers, and previews reconcile.
   ────────────────────────────────────────────────────────────────────────── */

import { marketingAssets } from "@/lib/data";
import type { Campaign, MarketingAsset } from "@/lib/types";

/* The canonical listing this studio composes a launch kit for. */
export const STUDIO_LISTING = {
  address: "1248 NW Cedar Hills Dr",
  city: "Beaverton, OR",
  cityShort: "Beaverton",
  beds: "4",
  baths: "3",
  sqft: "2,580",
  yearBuilt: "2016",
  price: "$845,000",
  features: "primary on main, quartz chef's kitchen, 3-car garage",
  highlights: "backs to greenspace, top-rated schools, walk to trails",
  campaignId: "CMP-001",
  /** Stable seed so every PropertyThumb of this listing renders the same photo. */
  seedIndex: 7,
};

export const PREVIEW_CHANNELS = [
  "Email",
  "Social",
  "Flyer",
  "Ad",
  "Web page",
] as const;
export type PreviewChannel = (typeof PREVIEW_CHANNELS)[number];

/* ── Campaign owners — each campaign is run by a real Matin person. Marketing
   is owned by Nina (Marketing Director); listing launches pair the listing
   agent; recruiting sits with the broker. Avatar resolves these slugs to real
   headshots, falling back to initials for synthetic names. ──────────────── */
export const CAMPAIGN_OWNER: Record<string, { name: string; slug: string }> = {
  "CMP-001": { name: "Ava Brooks", slug: "ava-brooks" }, // Cedar Hills listing agent
  "CMP-002": { name: "Nina Patel", slug: "nina-patel" },
  "CMP-003": { name: "Nina Patel", slug: "nina-patel" },
  "CMP-004": { name: "Ava Brooks", slug: "ava-brooks" },
  "CMP-005": { name: "Marcus Lee", slug: "marcus-lee" },
  "CMP-006": { name: "Nina Patel", slug: "nina-patel" },
  "CMP-007": { name: "Nina Patel", slug: "nina-patel" },
  "CMP-008": { name: "Jordan Matin", slug: "jordan-matin" },
};

export function campaignOwner(id: string) {
  return CAMPAIGN_OWNER[id] ?? { name: "Nina Patel", slug: "nina-patel" };
}

/* Deterministic property photo per campaign so cards/drawers stay consistent. */
export function campaignSeed(id: string): number {
  // Derive a stable small int from the campaign id digits.
  const n = Number(id.replace(/\D/g, "")) || 1;
  return (n * 3 + 2) % 22;
}

/* ── Template catalog (also drives the library pane). No banned icons — domain
   glyphs only; the icon names map to lucide imports in the component. ────── */
export type TemplateKey =
  | "listing-launch"
  | "open-house"
  | "price-reduction"
  | "just-sold"
  | "seller-nurture"
  | "recruiting"
  | "agent-spotlight"
  | "cash-offer";

export type MarketingTemplate = {
  key: TemplateKey;
  label: string;
  blurb: string;
  channels: PreviewChannel[];
  assetCount: number;
  popular?: boolean;
  /** Seed for the template-row thumbnail. */
  seedIndex: number;
  /** Headline shown in the preview canvas when this template is selected. */
  headline: string;
};

export const TEMPLATES: MarketingTemplate[] = [
  {
    key: "listing-launch",
    label: "Listing launch",
    blurb: "Coming-soon → live kit across every channel",
    channels: ["Email", "Social", "Flyer", "Ad", "Web page"],
    assetCount: 11,
    popular: true,
    seedIndex: 7,
    headline: "Just Listed in Beaverton",
  },
  {
    key: "open-house",
    label: "Open house",
    blurb: "Weekend invite + saved-search match blast",
    channels: ["Email", "Social", "Flyer"],
    assetCount: 6,
    seedIndex: 3,
    headline: "Open House This Weekend",
  },
  {
    key: "price-reduction",
    label: "Price reduction",
    blurb: "Re-engage saved searches on a price drop",
    channels: ["Email", "Social"],
    assetCount: 4,
    seedIndex: 11,
    headline: "Price Improved — See It First",
  },
  {
    key: "just-sold",
    label: "Just sold",
    blurb: "Sphere proof + neighborhood valuation hook",
    channels: ["Social", "Flyer", "Web page"],
    assetCount: 5,
    seedIndex: 14,
    headline: "Just Sold in Lake Oswego",
  },
  {
    key: "seller-nurture",
    label: "Seller nurture",
    blurb: "Home-value drip for the likely-seller list",
    channels: ["Email", "Social"],
    assetCount: 7,
    seedIndex: 5,
    headline: "What's Your Home Worth Today?",
  },
  {
    key: "recruiting",
    label: "Recruiting",
    blurb: "Top-producer outreach + careers landing",
    channels: ["Ad", "Web page", "Email"],
    assetCount: 4,
    seedIndex: 18,
    headline: "Top Producers Run on MatinOS",
  },
  {
    key: "agent-spotlight",
    label: "Agent spotlight",
    blurb: "Production milestone + review highlight reel",
    channels: ["Social", "Web page"],
    assetCount: 3,
    seedIndex: 9,
    headline: "Agent Spotlight — This Quarter's Movers",
  },
  {
    key: "cash-offer",
    label: "Cash offer",
    blurb: "48-hour offer funnel + net-sheet explainer",
    channels: ["Ad", "Email", "Web page"],
    assetCount: 5,
    seedIndex: 16,
    headline: "Get a Cash Offer in 48 Hours",
  },
];

export function templateByKey(key: string): MarketingTemplate {
  return TEMPLATES.find((t) => t.key === key) ?? TEMPLATES[0];
}

/* ── Per-channel seed copy. Listing-launch pulls the REAL Cedar Hills assets so
   the canvas reads complete before any generate. Other templates carry their
   own plausible copy so switching templates actually changes the canvas. ── */
const CEDAR_ASSETS: MarketingAsset[] = marketingAssets.filter(
  (a) => a.campaignId === STUDIO_LISTING.campaignId,
);
function cedar(type: MarketingAsset["type"]): string {
  return CEDAR_ASSETS.find((a) => a.type === type)?.body ?? "";
}

const ADDR = STUDIO_LISTING.address;
const CITY = STUDIO_LISTING.city;

const TEMPLATE_SEEDS: Record<TemplateKey, Record<PreviewChannel, string>> = {
  "listing-launch": {
    Email: cedar("Email"),
    Social: cedar("Social"),
    Flyer: cedar("Flyer"),
    Ad: "Just listed in Beaverton — 4BR on Cedar Hills Dr, primary on main, backs to greenspace. Tour this week before it's gone. Tap to book a private showing.",
    "Web page": cedar("Web"),
  },
  "open-house": {
    Email:
      "You're invited: open house this Saturday 11–1 at 1248 NW Cedar Hills Dr, Beaverton. Three saved-search matches on one street — bring your pre-approval, we'll have coffee ready.",
    Social:
      "OPEN HOUSE this weekend 🏡 1248 NW Cedar Hills Dr · Beaverton · Sat 11–1. Primary on main, quartz kitchen, greenspace out back. Tap for directions + tour times.",
    Flyer:
      "OPEN HOUSE · Sat 11AM–1PM · 1248 NW Cedar Hills Dr, Beaverton · $845,000 · 4 bed / 3 bath / 2,580 sqft · Hosted by Ava Brooks, Matin Real Estate.",
    Ad: "",
    "Web page": "",
  },
  "price-reduction": {
    Email:
      "Good news on a home you saved: the price just improved to $845,000. It now fits your budget — want a private showing before this weekend's rush in Beaverton?",
    Social:
      "PRICE IMPROVED 📉 1248 NW Cedar Hills Dr is now $845,000 — 4BR, primary on main, backs to greenspace. Serious value in Beaverton. DM for a tour.",
    Flyer: "",
    Ad: "",
    "Web page": "",
  },
  "just-sold": {
    Email: "",
    Social:
      "SOLD in Lake Oswego 🔑 Another smooth close, another happy seller. Curious what your home could fetch this spring? We'd love to run your number.",
    Flyer:
      "JUST SOLD on your street. Want to know what that means for your value? Scan the code for an instant estimate from Matin Real Estate.",
    Ad: "",
    "Web page":
      "We just closed another Lake Oswego sale at full ask. See the result, the strategy, and what comparable homes nearby are worth today.",
  },
  "seller-nurture": {
    Email:
      "Homes near you are moving fast this spring — days-on-market is down to 17. Curious what yours could fetch today? Get a no-pressure home value and a same-week market report in 30 seconds.",
    Social:
      "Portland metro sellers: inventory is tight and well-priced homes go in under 10 days. If you've thought about listing, this is the window. Tap to see your home's number.",
    Flyer: "",
    Ad: "",
    "Web page": "",
  },
  recruiting: {
    Email:
      "Top producers keep more of their deals on MatinOS — AI speed-to-lead, automated listing launches, and a coordinator team that handles the paperwork. Worth a confidential conversation?",
    Social: "",
    Flyer: "",
    Ad: "Run your business on MatinOS. AI speed-to-lead + a coordinator team that handles the paperwork, so you keep more of every deal. For OR/WA agents doing 20+ a year.",
    "Web page":
      "Careers at Matin Real Estate — top producers run on MatinOS: AI speed-to-lead, automated listing launches, and a TC team that handles the paperwork. See how we work.",
  },
  "agent-spotlight": {
    Email: "",
    Social:
      "Spotlight on a record quarter ✨ Real production, real reviews — meet the broker behind the numbers and see why clients keep coming back to Matin Real Estate.",
    Flyer: "",
    Ad: "",
    "Web page":
      "Meet the agent: a production milestone, a wall of 5-star reviews, and the local market knowledge that closes. Full bio, recent sales, and how to connect inside.",
  },
  "cash-offer": {
    Email:
      "Skip the showings. Get a competitive cash offer on your Portland-area home in 48 hours — and compare it side-by-side with what a traditional sale could net you.",
    Social: "",
    Flyer: "",
    Ad: "Skip the showings. Competitive cash offer on your home in 48 hours, compared side-by-side with a market sale. No obligation. See your net.",
    "Web page":
      "Here's exactly what a cash offer looks like next to a market sale: price, fees, timeline, and your estimated net — no guesswork, no obligation.",
  },
};

/** Seed body for a template+channel; empty string when that channel isn't part
 *  of the template (the canvas then shows an actionable "not in this kit" cue). */
export function seedFor(templateKey: string, channel: PreviewChannel): string {
  const t = TEMPLATE_SEEDS[(templateKey as TemplateKey)] ?? TEMPLATE_SEEDS["listing-launch"];
  return t[channel] ?? "";
}

/** Map a streamed `marketing-kit` markdown (## MLS / Instagram / Facebook /
 *  Email Blast / Open House) onto a preview channel. */
export function sectionFromKit(full: string, channel: PreviewChannel): string {
  const grab = (header: string) => {
    const re = new RegExp(
      `##\\s*${header}[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|$)`,
      "i",
    );
    const m = full.match(re);
    return m ? m[1].replace(/^\s*---\s*$/gm, "").trim() : "";
  };
  switch (channel) {
    case "Email":
      return grab("Email Blast");
    case "Social":
      return grab("Instagram Caption") || grab("Facebook Post");
    case "Flyer":
      return grab("Open House Invite");
    case "Ad":
      return grab("Facebook Post");
    case "Web page":
      return grab("MLS Description");
  }
}

/* ── Channel meta for the preview canvas (CTA + merge-field count per channel) */
export const CHANNEL_META: Record<
  PreviewChannel,
  { cta: string; mergeFields: number; kicker: string }
> = {
  Email: { cta: "Book a private tour", mergeFields: 3, kicker: "Email blast" },
  Social: { cta: "DM for a showing", mergeFields: 1, kicker: "Instagram + Facebook" },
  Flyer: { cta: "Scan to RSVP", mergeFields: 2, kicker: "Print flyer · 8.5×11" },
  Ad: { cta: "Tap to book", mergeFields: 2, kicker: "Paid social ad" },
  "Web page": { cta: "Request a tour", mergeFields: 4, kicker: "Single-property page" },
};

/* ── KPI math (reconciles to the campaigns + report data) ───────────────── */
export function studioKpis(rows: Campaign[]) {
  const live = rows.filter((c) => c.status === "live");
  const scheduled = rows.filter((c) => c.status === "scheduled").length;
  const draft = rows.filter((c) => c.status === "draft").length;
  const paused = rows.filter((c) => c.status === "paused").length;
  const assetsGenerated = marketingAssets.length;
  const sentRows = rows.filter((c) => c.sent > 0);
  const avgOpen =
    sentRows.reduce((s, c) => s + c.openRate, 0) / (sentRows.length || 1);
  const avgReply =
    sentRows.reduce((s, c) => s + c.replyRate, 0) / (sentRows.length || 1);
  const attributed = rows.reduce((s, c) => s + c.attributedPipeline, 0);
  return {
    liveCount: live.length,
    scheduled,
    draft,
    paused,
    assetsGenerated,
    avgOpen,
    avgReply,
    attributed,
  };
}
