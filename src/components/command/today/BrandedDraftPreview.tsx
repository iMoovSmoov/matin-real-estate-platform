"use client";

import { BrandedDocument } from "@/components/os";
import { listingPipeline, getAgent, roles, listings, derived } from "@/lib/data";
import type { WorkQueueItem, AIAction } from "@/lib/types";

/* ──────────────────────────────────────────────────────────────────────────
   Today — Branded AI-draft preview (S1.7)

   Client-facing AI drafts (WQ-006 MLS remarks, WQ-015 seller email blast) must
   render inside the Matin BrandedDocument letterhead — not as raw text on a dark
   card. This resolves the work-queue item to its real source record and chooses
   the right BrandedDocument variant, binding every field to live data (real
   listing facts, real agent signature, real West Linn office line).

   Returns null when the selected item is NOT one of the branded client-facing
   draft types — the drawer falls back to the standard streaming AIActionCard.
   ────────────────────────────────────────────────────────────────────────── */

const usd0 = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export function brandedDraftFor(item: WorkQueueItem, action?: AIAction): boolean {
  // MLS remarks for a listing, or the seller-nurture email blast.
  return (
    (action?.id === "AI-002" || item.sourceId === "AI-002") ||
    (action?.id === "AI-006" || item.sourceId === "AI-006") ||
    item.id === "WQ-006" ||
    item.id === "WQ-015"
  );
}

export function BrandedDraftPreview({
  item,
  action,
  draft,
}: {
  item: WorkQueueItem;
  action?: AIAction;
  /** The streamed/edited draft body, if the user has generated one. */
  draft?: string;
}) {
  const isMls = item.id === "WQ-006" || action?.id === "AI-002";
  const isBlast = item.id === "WQ-015" || action?.id === "AI-006";

  if (isMls) {
    // 7428 SW Maple Ave — resolve the real listing-pipeline record.
    const lp = listingPipeline.find((l) => l.id === "LP-000B") ?? listingPipeline.find((l) => l.address.includes("Maple"));
    const agent = getAgent(lp?.agentSlug ?? roles.principalBroker);
    const fields = lp
      ? [
          { label: "Address", value: `${lp.address}, ${lp.city}` },
          { label: "Target price", value: usd0(lp.price) },
          { label: "Beds / baths", value: `${lp.beds} BR · ${lp.baths} BA` },
          { label: "Square feet", value: `${lp.sqft.toLocaleString()} sqft` },
          { label: "Year built", value: String(lp.yearBuilt) },
          { label: "Stage", value: lp.stage },
        ]
      : [];

    return (
      <BrandedDocument
        variant="letter"
        formId="MLS · Public Remarks"
        title="MLS Listing Remarks"
        recipient={lp ? `${lp.address}, ${lp.city}` : undefined}
        agent={
          agent
            ? {
                name: agent.name,
                title: agent.title,
                license: agent.licenseRaw ?? agent.licenses?.[0],
                phone: agent.phone,
                email: agent.email,
                slug: agent.slug,
              }
            : undefined
        }
        fields={fields}
        body={
          <p className="whitespace-pre-wrap">
            {draft ||
              (lp
                ? `Welcome to ${lp.address} — a beautifully maintained ${lp.beds}-bedroom, ${lp.baths}-bath home in ${lp.city} offering ${lp.sqft.toLocaleString()} square feet of light-filled living. Built in ${lp.yearBuilt}, the home pairs ${lp.features?.slice(0, 2).join(" and ") || "thoughtful updates"} with a layout made for both everyday living and entertaining. Minutes from parks, top-rated schools, and the heart of ${lp.city}, this is a rare opportunity in one of the area's most sought-after pockets. Offered at ${usd0(lp.price)}. Shown by appointment — contact the listing team to schedule your private tour.`
                : "Generate the MLS remarks to populate this letterhead.")}
          </p>
        }
        page={1}
        pages={1}
      />
    );
  }

  if (isBlast) {
    // Spring Seller Nurture — real likely-seller audience count + marketing lead.
    const agent = getAgent(roles.marketingLead);
    const sellersAudience = derived.sellerSignalsTracked;
    const sample = listings.find((l) => l.real && l.status === "Sold") ?? listings.find((l) => l.real);

    return (
      <BrandedDocument
        variant="email"
        title="Spring Seller Nurture"
        emailSubject="Curious what your home is worth this spring?"
        fromName={`Matin Real Estate · ${agent?.name ?? "Listings Team"}`}
        mergeTokens={["{{first_name}}", "{{address}}", "{{est_value}}", "{{community}}"]}
        agent={
          agent
            ? {
                name: agent.name,
                title: agent.title,
                phone: agent.phone,
                email: agent.email,
                slug: agent.slug,
              }
            : undefined
        }
        body={
          <div className="space-y-3">
            <p>Hi {"{{first_name}}"},</p>
            <p>
              {draft ||
                `Spring is the strongest seller's window we see all year in ${sample?.city ?? "the Portland metro"} — inventory is tight and well-prepared homes are moving fast. We've been tracking value movement on ${"{{address}}"}, and based on recent ${"{{community}}"} sales your estimated value is around ${"{{est_value}}"}.`}
            </p>
            <p>
              If you&rsquo;re even a little curious, we&rsquo;ll prepare a free, no-obligation
              valuation and a side-by-side cash-offer comparison so you can see every option in one
              place. Reply here or tap below and we&rsquo;ll take it from there.
            </p>
            <p>
              Warmly,
              <br />
              {agent?.name ?? "The Matin Listings Team"}
              {agent?.title ? `, ${agent.title}` : ""}
            </p>
            <p className="text-[0.72rem] text-slate">
              Sending to {sellersAudience.toLocaleString()} likely sellers we&rsquo;re tracking · held for
              your approval before scheduling.
            </p>
          </div>
        }
      />
    );
  }

  return null;
}
