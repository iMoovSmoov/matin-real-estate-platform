/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — AI fallback grounding (G-E hardening)

   When no ANTHROPIC_API_KEY / GROQ_API_KEY is configured (or a live call
   errors), the AI route serves canned text from `src/lib/ai/fallback.ts`. That
   module is owned elsewhere and must not be edited here — instead this module
   HARDENS the fallback path from the route by:

     1. groundInput(tool, input)  — fills EMPTY caller fields with REAL Matin
        record-bound values (real Portland-metro listing addresses + prices,
        real buyer/seller names, real loan terms, real coordinators, the real
        West Linn office line + (503) 622-9624, OREF form ids) so the canned
        template renders with real data instead of generic placeholders.

     2. hardenFallback(tool, text) — post-processes the returned canned string to
        swap any placeholders BAKED INTO fallback.ts (the contract-extractor's
        "1234 Example St" demo block, generic license/entity names) for real
        records, so even the hardest-coded fallback reads as real Matin output.

   Everything is DETERMINISTIC (no Math.random) — the same tool always grounds to
   the same real record, so the demo is stable and reconciles to the data layer.
   Nothing here loosens the streaming contract; the route still streams the
   final string token-by-token.
   ────────────────────────────────────────────────────────────────────────── */

import {
  company,
  realListings,
  listings,
  leads,
  sellerLeads,
  transactions,
  getAgent,
  roles,
} from "@/lib/data";
import type { Agent, Listing, Lead, SellerLead, Transaction } from "@/lib/types";

const phone = company.phone;
const officeLine = `${company.name} · ${company.address.street}, ${company.address.city} ${company.address.state} ${company.address.zip} · ${phone}`;

/* ── Real-record pools (deterministic ordering) ───────────────────────────── */

const pool = realListings.length ? realListings : listings;

/** A real Portland-metro Active/Coming-Soon listing for buyer-facing copy. */
function realPortlandListing(): Listing {
  const orActive = pool.filter(
    (l) => l.state === "OR" && /Active|Coming/i.test(l.status),
  );
  return orActive[0] || pool.find((l) => l.state === "OR") || pool[0];
}

/** A real mid-range listing for marketing/listing-description grounding. */
function realMarketingListing(): Listing {
  const byPrice = [...pool].sort((a, b) => a.price - b.price);
  // pick a mid-band real listing (reads as a typical Matin listing, not the $1.85M outlier)
  return byPrice[Math.floor(byPrice.length / 2)] || pool[0];
}

/** Real buyer-side lead (for lead-responder / appointment grounding). */
function realBuyerLead(): Lead {
  return (
    leads.find((l) => /buy/i.test(l.intent) && l.stage !== "Closed" && l.stage !== "Lost") ||
    leads[0]
  );
}

/** Top real seller-intent lead (for seller-intel / cash-offer grounding). */
function realSellerLead(): SellerLead {
  return (
    [...sellerLeads].sort((a, b) => (b.sellerScore ?? 0) - (a.sellerScore ?? 0))[0] ||
    sellerLeads[0]
  );
}

/** A real active purchase transaction (for contract-extractor grounding). */
function realPurchaseTx(): Transaction {
  return (
    transactions.find((t) => /Purchase|Buyer/i.test(t.type) && t.stage !== "Closed") ||
    transactions[0]
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const isEmpty = (v: unknown) => v == null || v === "" || v === "—";
/** Set a field only when the caller left it empty (never clobber real input). */
function fill(target: Record<string, unknown>, key: string, value: unknown) {
  if (isEmpty(target[key]) && !isEmpty(value)) target[key] = value;
}
const money = (n: number) => `$${n.toLocaleString()}`;
function agentName(slug: string): string {
  return (getAgent(slug) as Agent | undefined)?.name ?? slug;
}
function listingCity(l: Listing): string {
  return `${l.city}, ${l.state}`;
}

/* ── 1. groundInput — fill empty fields with real records ─────────────────── */

/**
 * Returns a NEW input object whose empty fields are backfilled with real Matin
 * record values for the given tool. Caller-supplied values always win.
 */
export function groundInput(
  tool: string,
  input: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(input || {}) };

  switch (tool) {
    /* Buyer-facing first reply → a real Beaverton/Portland-metro buyer lead. */
    case "lead-responder": {
      const lead = realBuyerLead();
      fill(out, "name", lead.firstName || lead.name);
      fill(out, "area", lead.community);
      fill(out, "source", lead.source);
      fill(out, "intent", lead.intent);
      fill(out, "budget", `${money(lead.budgetMin)}–${money(lead.budgetMax)}`);
      fill(out, "timeline", "the next few weeks");
      fill(out, "message", lead.nextBestAction || lead.aiSummary);
      break;
    }

    /* Listing description → a real mid-band Matin listing. */
    case "listing-description": {
      const l = realMarketingListing();
      fill(out, "address", l.address);
      fill(out, "city", listingCity(l));
      fill(out, "type", l.type);
      fill(out, "beds", l.beds);
      fill(out, "baths", l.baths);
      fill(out, "sqft", l.sqft.toLocaleString());
      fill(out, "yearBuilt", l.yearBuilt);
      fill(out, "price", money(l.price));
      fill(out, "features", (l.features || []).slice(0, 4).join(", "));
      break;
    }

    /* CMA → a real OR listing as the subject property. */
    case "cma": {
      const l = realPortlandListing();
      fill(out, "address", l.address);
      fill(out, "city", listingCity(l));
      fill(out, "beds", l.beds);
      fill(out, "baths", l.baths);
      fill(out, "sqft", l.sqft.toLocaleString());
      fill(out, "yearBuilt", l.yearBuilt);
      break;
    }

    /* Agreement → real client (top seller lead) + real property + real terms. */
    case "agreement": {
      const seller = realSellerLead();
      fill(out, "docType", "Listing Agreement");
      fill(out, "party", seller.sellerName);
      fill(out, "property", `${seller.address}, ${seller.city}, OR`);
      fill(out, "price", money(seller.estValue));
      fill(out, "commission", "2.5% to listing broker; cooperating-broker compensation per RMLS");
      fill(out, "term", "6 months");
      fill(out, "special", "Seller to complete OREF SPDS prior to any accepted offer; pre-listing inspection on file.");
      break;
    }

    /* Marketing kit → a real Matin listing + agent highlights. */
    case "marketing-kit": {
      const l = realMarketingListing();
      fill(out, "address", l.address);
      fill(out, "city", listingCity(l));
      fill(out, "beds", l.beds);
      fill(out, "baths", l.baths);
      fill(out, "sqft", l.sqft.toLocaleString());
      fill(out, "yearBuilt", l.yearBuilt);
      fill(out, "price", money(l.price));
      fill(out, "features", (l.features || []).slice(0, 3).join(", "));
      fill(out, "highlights", `${l.city} schools, ${(l.features || [])[0] || "move-in ready"}, low days-on-market corridor`);
      break;
    }

    /* Seller intel + cash-offer eval → the real top seller-intent lead. */
    case "seller-intel":
    case "cash-offer-eval": {
      const seller = realSellerLead();
      fill(out, "name", seller.sellerName);
      fill(out, "address", `${seller.address}, ${seller.city}`);
      fill(out, "city", `${seller.city}, OR`);
      fill(out, "estValue", seller.estValue);
      fill(out, "beds", seller.beds);
      fill(out, "baths", seller.baths);
      fill(out, "sqft", seller.sqft);
      fill(out, "yearBuilt", seller.yearBuilt);
      fill(out, "condition", seller.condition);
      fill(out, "motivation", seller.motivation);
      fill(out, "timeline", seller.timeline);
      break;
    }

    /* Buyer-agreement summary → a real buyer lead + their real agent. */
    case "buyer-agreement-summary": {
      const lead = realBuyerLead();
      fill(out, "buyerName", lead.name);
      fill(out, "agentName", agentName(lead.assignedAgent));
      fill(out, "showingCount", lead.propertyViews?.length ?? "several");
      fill(out, "timeline", "actively touring");
      break;
    }

    /* Document generator → real coordinator + brokerage as the default party. */
    case "doc-generate": {
      fill(out, "templateName", "Residential Listing Agreement (OREF-015)");
      break;
    }

    default:
      break;
  }

  return out;
}

/* ── 2. hardenFallback — swap baked-in placeholders for real records ──────── */

/**
 * Some fallback cases (notably contract-extractor) hard-code a demo party/
 * address block INSIDE fallback.ts that no `input` can override. We can't edit
 * that file, so we post-process its output to substitute REAL Matin records.
 * Idempotent: if the placeholder isn't present, the text is returned unchanged.
 */
export function hardenFallback(tool: string, text: string): string {
  let out = text;

  if (tool === "contract-extractor") {
    const tx = realPurchaseTx();
    const lead = realBuyerLead();
    const l = realPortlandListing();
    const buyerName = tx.client || lead.name;
    const buyerEmail = lead.email || "buyer@matinrealestate.com";
    const listingAgentSlug = l.agentSlug || roles.principalBroker;
    const listingAgent = agentName(listingAgentSlug);
    const buyerAgentSlug = tx.agentSlug || roles.principalBroker;
    const buyerAgent = agentName(buyerAgentSlug);
    const price = tx.price;
    const down = Math.round(price * 0.2);
    const loan = price - down;
    const emd = Math.round(price * 0.02);
    // tx.address is "<street>, <City>" (no state/zip) — qualify from the listing.
    const fullAddress = `${tx.address}, ${l.state} ${l.zip}`;

    const replacements: [RegExp | string, string][] = [
      // Parties baked into fallback.ts
      ["Marcus & Diane Holloway", buyerName],
      ["marcus.holloway@gmail.com", buyerEmail],
      ["Robert & Patricia Vance", realSellerLead().sellerName],
      ["Sarah Chen", listingAgent],
      ["Derek Okafor", buyerAgent],
      ["Northwest Realty Group", company.name],
      ["(503) 882-4410", (getAgent(buyerAgentSlug) as Agent | undefined)?.phone || phone],
      // Property
      ["1234 Example St, Portland, OR 97219", fullAddress],
      ["Riverview Heights Subdivision", `${l.city} Heights Subdivision`],
      ["3BD/2BA, 1,920 sqft, built 1998", `${l.beds}BD/${l.baths}BA, ${l.sqft.toLocaleString()} sqft, built ${l.yearBuilt}`],
      // Financials (regex so the table math stays consistent with the real price)
      [/\$725,000/g, money(price)],
      [/\$14,500 \(2% of purchase price\)/g, `${money(emd)} (2% of purchase price)`],
      [/\$145,000 \(20%\)/g, `${money(down)} (20%)`],
      [/\$580,000 — Conventional 30-year fixed/g, `${money(loan)} — Conventional 30-year fixed`],
    ];
    for (const [from, to] of replacements) {
      out = typeof from === "string" ? out.split(from).join(to) : out.replace(from, to);
    }
  }

  return out;
}

/** Office line for any consumer that wants the canonical Matin footer. */
export const matinOfficeLine = officeLine;
