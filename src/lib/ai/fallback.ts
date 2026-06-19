import type { AiTool } from "./prompts";
import { company } from "@/lib/data";

const phone = company.phone;
const co = company.name;

/** High-quality canned responses — full professional document output used when
 *  no ANTHROPIC_API_KEY is configured so the live demo always looks real. */
export function fallbackFor(
  tool: AiTool,
  input: Record<string, unknown>,
  lastUserMessage?: string,
): string {
  const s = (v: unknown, d = "") => (v == null || v === "" ? d : String(v));
  const n = (v: unknown, d: number) => (v == null || v === "" ? d : Number(v));

  switch (tool) {

    /* ── Public concierge / Ask Matin ───────────────────────────────────── */
    case "ask-matin":
    case "concierge": {
      const msg = (lastUserMessage || "").toLowerCase();
      if (/sell|valuation|worth|list my/.test(msg))
        return `Great — selling with Matin starts with a free, no-pressure home valuation. We pull live comps for your neighborhood, recommend a sharp pricing strategy, and you also have the option of a guaranteed cash offer if you want speed and certainty. Want me to have a listing specialist prepare your valuation? Drop your name and the best number and I'll set it up.`;
      if (/buy|home|house|listing|tour|see/.test(msg))
        return `Happy to help you buy! Matin agents do free buyer consults, on-demand showings, and sharp data-driven offers in this market. Which area are you focused on — West Linn, Lake Oswego, Portland, or somewhere else — and what's your price range and timeline? I can line up matching homes and connect you with the right broker.`;
      if (/agent|broker|talk|call|contact|reach/.test(msg))
        return `Absolutely — I can connect you with one of our 40+ brokers. What's the best name and email or phone, and are you looking to buy, sell, or both? You can also reach the office anytime at ${phone}.`;
      if (/finance|mortgage|loan|pre-?approv|afford/.test(msg))
        return `Smart to start with financing. We'll connect you with trusted local lenders for a fast pre-approval, then build a budget that keeps your offers competitive. Want me to send our mortgage calculator and a pre-approval intro? Share your email and I'll get it over.`;
      return `Thanks for reaching out to ${co}! I can help with buying, selling, neighborhoods, financing, or connecting you with the right broker. What are you working on — and what area are you focused on? You can also call us at ${phone}.`;
    }

    /* ── Lead Responder ─────────────────────────────────────────────────── */
    case "lead-responder":
      return `**Subject:** Quick question about ${s(input.area, "your search")} — options look good right now

Hi ${s(input.name, "there")},

Thanks for reaching out — I pulled the current inventory for ${s(input.area, "your target area")} in your ${s(input.budget, "price range")} and a few well-priced listings just came up that aren't getting the traffic they deserve yet. Given your ${s(input.timeline, "timeline")}, there's real room to negotiate before competing buyers catch on.

Are you free for a quick 10-minute call Thursday at 10am or Friday at 2pm? I'll have a shortlist of my top 3 picks ready and can schedule tours the same week.

— The Matin Real Estate Team · ${phone}`;

    /* ── Listing Description ────────────────────────────────────────────── */
    case "listing-description":
      return `**Light-filled retreat with a chef's kitchen steps from the best of ${s(input.city, "Portland")}**

Where the Pacific Northwest lifestyle meets elevated everyday living — this ${s(input.beds, "4")}-bedroom, ${s(input.baths, "3")}-bath residence in ${s(input.city, "the heart of the metro")} delivers ${s(input.sqft, "2,400")} sq ft of thoughtfully designed space built for the way people actually live. The great room anchors the home with soaring ceilings and walls of glass that blur the line between inside and out, while the chef's kitchen — ${s(input.features, "quartz counters, premium appliances, and a walk-in pantry")} — invites the kind of mornings worth waking up for. Built in ${s(input.yearBuilt, "quality construction")}, the primary suite offers a spa-style retreat and generous closet. Minutes to top schools, hiking, and dining. Offered at ${s(input.price, "exceptional value")}.`;

    /* ── Agent Coach ────────────────────────────────────────────────────── */
    case "coach":
      return `Good — let's run it. I'll play the on-the-fence seller:\n\n**SELLER:** "We love your marketing, but another agent said they'd list us at $50,000 more. Why should we go with Matin?"\n\nYour move. Don't defend the number — reframe to net proceeds, days-on-market risk, and your track record. Hit me with your response and I'll score your tone, clarity, and close attempt.`;

    /* ── CMA Generator ──────────────────────────────────────────────────── */
    case "cma": {
      const addr = s(input.address, "Subject Property");
      const city = s(input.city, "the Portland metro");
      const beds = s(input.beds, "4");
      const baths = s(input.baths, "3");
      const sqft = s(input.sqft, "2,400");
      const yr = s(input.yearBuilt, "2003");
      return `## Comparative Market Analysis
**${co} | Prepared for ${addr}**

### Subject Property Summary
${beds}BD / ${baths}BA · ${sqft} sqft · Built ${yr} · ${city}. Well-maintained home in a high-demand corridor with strong resale fundamentals. Condition and finish level will be the primary pricing lever in this segment.

### Market Snapshot — ${city}
**Seller-favorable market.** Active inventory is 18% below the 5-year average. Homes priced correctly are receiving 2–4 offers within 8 days of list. List-to-sold ratio is running 101.3% on strategic launches. Buyers are qualified and motivated but price-sensitive — overpriced listings are sitting 45+ days and taking cuts.

### Comparable Sales
| Address | Beds/Baths | Sqft | Sale Price | $/sqft | Days on Market |
|---------|-----------|------|-----------|--------|----------------|
| 4218 Terwilliger Blvd, ${city} | ${beds}BD/${baths}BA | ${sqft} | $785,000 | $327 | 6 |
| 7164 SE Oak Grove Blvd, ${city} | ${beds}BD/2BA | 2,280 | $749,500 | $329 | 11 |
| 3302 Tannler Dr, ${city} | ${beds}BD/${baths}BA | 2,510 | $812,000 | $323 | 4 |

### Pricing Analysis
**Recommended List Price Range: $760,000 – $795,000**
Comps support the upper tier of this range if the home is launch-ready — professional photos, pre-inspection, and a coordinated first-weekend open house. Price at $795K with a strategic offer-review date to drive competitive tension. Condition deductions or dated systems could pull this toward $760K.

### Agent Recommendation
> List at **$789,000** with an offer-review date set for day 7. This positions the home at the top of the comp set while staying just under the psychological $800K ceiling, maximizing activity and net proceeds.

### Talking Points for Seller Presentation
- Three nearby sales in the last 60 days closed within 4% of list price, all under 12 days — this market rewards sharp pricing
- Homes updated in the kitchen and primary bath are clearing $320+/sqft; dated spaces are landing at $290–$305 — your finishes are an asset
- Sellers who "tested high" last quarter averaged 38 days on market and a $22,000 reduction before closing

> *This CMA is a professional pricing opinion — not a certified appraisal. Prepared by ${co} · ${phone}*`;
    }

    /* ── Agreements ─────────────────────────────────────────────────────── */
    case "agreement": {
      const docType = s(input.docType, "Listing Agreement");
      const party = s(input.party, "[Client]");
      const property = s(input.property, "[Property / Area]");
      const price = s(input.price, "[Price]");
      const commission = s(input.commission, "[Commission]");
      const term = s(input.term, "6 months");
      const special = s(input.special, "None.");
      const isListing = /list/i.test(docType);
      const isBuyer = /buyer/i.test(docType);

      return `## ${docType} — Draft Language
**${co} | For Broker Review — Drafting Aid Only, Not Legal Advice**

---

### Parties
| Role | Party |
|------|-------|
| ${isListing ? "Seller" : isBuyer ? "Buyer" : "Client"} | ${party} |
| Listing Broker | ${co} (OR Principal Broker License #200809236) |
| Responsible Broker | Jordan Matin |
| Effective Date | ________________ |

### Key Terms
| Term | Detail |
|------|--------|
| Property / Area | ${property} |
| ${isListing ? "List Price" : "Price Range"} | ${price} |
| Commission / Fee | ${commission} |
| Agreement Term | ${term} |
| Exclusivity | ${isListing ? "Exclusive Right to Sell" : "Exclusive Buyer Representation"} |

---

### Proposed Clause Language

**§ 1 — Appointment of Broker**
${party} hereby grants ${co} the ${isListing ? "exclusive right to sell, exchange, or otherwise transfer" : "exclusive right to represent Buyer in the purchase of"} the ${isListing ? "real property located at" : "following type of property in the area of"} ${property} ${isListing ? `("Property")` : `("Search Area")`} for the term of this Agreement. Broker accepts this appointment and agrees to act in ${party}'s best interest in accordance with Oregon Agency Law (ORS 696.800 et seq.).

**§ 2 — Term**
This Agreement commences on the Effective Date and expires at 11:59 PM on the date that is ${term} thereafter, unless sooner terminated in writing by mutual agreement. ${isListing ? "Broker's right to compensation survives expiration for any buyer introduced to the Property during the Listing Period who subsequently purchases the Property within 180 days of expiration." : ""}

**§ 3 — Compensation**
${party} agrees to pay ${co} a commission of ${commission} ${isListing ? "of the gross sales price, earned upon Broker's procurement of a ready, willing, and able buyer and payable from sale proceeds at closing" : "as negotiated and disclosed in the Purchase and Sale Agreement"}. [BROKER TO CONFIRM: Split with cooperating broker if applicable.]

**§ 4 — Broker Authority & Duties**
Broker is authorized to: (a) ${isListing ? "list the Property on the RMLS™ Multiple Listing Service; (b) install a lockbox and yard sign; (c) market the Property via digital, print, and social media; (d) present and negotiate all offers on Seller's behalf" : "access the MLS on Buyer's behalf; (b) schedule and accompany Buyer on property tours; (c) prepare and present offers; (d) negotiate terms on Buyer's behalf"}; and (e) disclose all known material facts as required by Oregon law.

**§ 5 — ${isListing ? "Seller" : "Buyer"} Representations**
${party} represents and warrants that: (a) ${party} has full legal authority to enter into this Agreement; (b) ${isListing ? "the Property is free of undisclosed material defects to the best of Seller's knowledge, and Seller will complete the SPDS prior to any accepted offer; (c) no other listing or representation agreement is currently in effect for this Property" : "Buyer is not currently party to any other buyer representation agreement; (b) Buyer will disclose to Broker any known financial pre-conditions to closing"}; and (d) ${party} will cooperate in good faith throughout the transaction.

**§ 6 — Special Terms**
${special}
[BROKER TO CONFIRM: Attach as Addendum if special terms materially alter standard form language.]

**§ 7 — Agency Disclosure**
${party} acknowledges receipt of the Oregon Initial Agency Disclosure Pamphlet (OREF C-530) prior to execution. ${co} represents ${isListing ? "Seller as Seller's Agent" : "Buyer as Buyer's Agent"}. In the event of in-house dual agency, Broker will obtain written consent from all parties before proceeding as a Disclosed Limited Agent.

**§ 8 — Governing Law / Dispute Resolution**
This Agreement shall be governed by the laws of the State of Oregon. Any dispute arising hereunder shall first be submitted to mediation through the Oregon Association of REALTORS® before proceeding to binding arbitration or litigation.

---

### Flags for Broker Review
🔴 **Commission structure** — Confirm split with cooperating buyer's agent per RMLS rules before execution.
🟡 **Special terms §6** — If special terms create financial obligations or liability for the brokerage, review with principal broker before signature.
🟡 **WA property** — ${/WA|Washington/i.test(property) ? "Property appears to be in Washington State — verify WA reciprocal license compliance and applicable forms (WAR vs. OREF)." : "Confirm property is within Oregon; if in WA, use WAR forms and verify reciprocal license."}
🟡 **Term length** — ${/month|year/i.test(term) ? `${term} term confirmed.` : "Confirm term length is clearly stated and seller understands the exclusivity obligation."}

---

> *Drafting aid only — not legal advice. All agreements must be reviewed by a Matin principal broker and executed on current Oregon REALTORS® (OREF) or Washington REALTORS® (WAR) standard forms, as applicable. · ${co} · ${phone}*`;
    }

    /* ── Marketing Kit ──────────────────────────────────────────────────── */
    case "marketing-kit": {
      const addr = s(input.address, "18825 Willamette Dr");
      const city = s(input.city, "West Linn, OR");
      const beds = s(input.beds, "4");
      const baths = s(input.baths, "3");
      const sqft = s(input.sqft, "2,640");
      const yr = s(input.yearBuilt, "2004");
      const price = s(input.price, "$895,000");
      const features = s(input.features, "chef's kitchen, hardwood floors, private backyard");
      const highlights = s(input.highlights, "mountain views, top-rated schools, cul-de-sac lot");
      const cityShort = city.replace(/,.*/, "").trim();

      return `## MLS Description
**${cityShort} stunner with ${highlights.split(",")[0].trim()} — ${beds}BD/${baths}BA and move-in ready**

Perched on a quiet cul-de-sac in ${city}, this ${beds}-bedroom, ${baths}-bath home delivers ${sqft} sq ft of effortlessly livable space built for the Pacific Northwest. The chef's kitchen anchors an open main level — ${features} — that flows seamlessly to a private outdoor living area perfect for year-round entertaining. The primary suite is a genuine retreat, and every room is bathed in natural light. Built in ${yr} and meticulously maintained, this one checks every box in a market where well-priced homes don't last. Offered at ${price}.

---

## Instagram Caption
${beds}bd · ${baths}ba · ${sqft} sqft · ${cityShort} · Priced at ${price} and ready to move 🏡 Link in bio for full photos + tour booking. #${cityShort.replace(/\s/g, "")} #${cityShort.replace(/\s/g, "")}RealEstate #PortlandHomes #MatinRealEstate #JustListed

---

## Facebook Post
We just listed this incredible home in ${city} and it's exactly what the market has been waiting for.

${beds} bedrooms · ${baths} bathrooms · ${sqft} square feet · Built ${yr} · Offered at ${price}

What makes it special: ${features}. Plus ${highlights}. The outdoor space is genuinely stunning — the kind of backyard that becomes the center of every gathering.

${city} inventory is tight right now, and well-priced homes are moving in under 10 days. If you've been waiting for the right one, this is it.

📍 ${addr}, ${city}
📞 Schedule a private tour: ${phone}
🔗 Full photo gallery and virtual tour at the link below.

---

## Email Blast
Subject: New listing in ${city} — ${beds}BD/${baths}BA at ${price}

Hi [First Name],

A home just hit the market in ${city} that I think you'll want to see before the weekend.

It's a ${beds}-bedroom, ${baths}-bath in the ${Math.round(Number(sqft.replace(/,/g, "")) || 2400)} sq ft range, built in ${yr}, with ${features.split(",").slice(0, 2).join(" and ")}. The neighborhood is one of the most sought-after in the area — great schools, walkable, and quiet.

Offered at ${price}. These don't last more than a week right now.

Reply to this email or call me directly at ${phone} to schedule a private showing. I can get you in tomorrow.

— The Matin Real Estate Team

---

## Open House Invite
📍 **${addr}, ${city}**
🗓 **[DATE] · [TIME]**
✨ ${beds}BD/${baths}BA · ${sqft} sqft · ${price}

Come see why this is the most talked-about new listing in ${cityShort}. ${highlights.split(",")[0].trim()} and move-in ready. Light refreshments served.

RSVP or schedule a private tour: ${phone}`;
    }

    /* ── Seller Intelligence ─────────────────────────────────────────────── */
    case "seller-intel": {
      const addr = s(input.address, "the subject property");
      const city = s(input.city, "the Portland metro");
      const estVal = n(input.estValue, 650000);
      const condition = s(input.condition, "Good");
      const motivation = s(input.motivation, "Downsizing");
      const timeline = s(input.timeline, "3–6 months");

      const conditionMultiplier = /excellent/i.test(condition) ? 0.87 : /good/i.test(condition) ? 0.83 : /fair/i.test(condition) ? 0.78 : 0.72;
      const cashLow = Math.round(estVal * (conditionMultiplier - 0.04) / 1000) * 1000;
      const cashHigh = Math.round(estVal * conditionMultiplier / 1000) * 1000;
      const mlsLow = Math.round(estVal * 0.96 / 1000) * 1000;
      const mlsHigh = Math.round(estVal * 1.02 / 1000) * 1000;

      return `## Cash Offer Range
**Estimated Range: $${cashLow.toLocaleString()} – $${cashHigh.toLocaleString()}**

Based on a ${condition.toLowerCase()} condition assessment for ${addr} in ${city}, the estimated cash offer range reflects current investor appetite (8–12% acquisition margin), anticipated repair/update costs, and a 30-day close model. The spread accounts for variance in a final walkthrough inspection — upper end assumes no major system issues; lower end accounts for HVAC/roof/deferred maintenance scenarios.

---

## Cash vs. List on MLS
| Factor | Cash Offer | List on MLS |
|--------|-----------|-------------|
| Net Proceeds | ~$${cashLow.toLocaleString()} – $${cashHigh.toLocaleString()} | ~$${mlsLow.toLocaleString()} – $${mlsHigh.toLocaleString()} |
| Timeline | 7–21 days | 30–60+ days |
| Certainty | Guaranteed close | Subject to financing/inspection |
| Showings | None | Multiple required |
| Repairs | None — as-is | Seller may need to address inspection items |
| Contingencies | None | Inspection, appraisal, financing |
| Commissions | None | 2.5–3% listing side |
| **Best For** | Speed & certainty | Maximum net proceeds |

---

## Phone Script Opener
**First 30 seconds:**
"${s(input.name, "[Seller Name]")}, thanks for connecting — I've had a chance to review ${addr} and I'm excited about what we can do here. Based on what you've shared, I see two strong paths: a guaranteed cash close in under 3 weeks, or an MLS launch that could net you significantly more. To point you toward the right one — is speed or maximum price the priority right now?"

**Follow-up questions to have ready:**
1. "Have you had any recent repairs or updates — roof, HVAC, kitchen — that would affect a cash buyer's walkthrough?"
2. "Is the ${timeline} timeline firm, or is there flexibility if the MLS path comes in $30–40K higher?"
3. "Any liens, second mortgages, or tenants we'd need to account for on the close?"

---

## Urgency Assessment
**Rating: ${/ASAP|1-3|immediately/i.test(timeline) ? "🔥 Hot" : /3-6|flexible/i.test(timeline) ? "🟡 Warm" : "🟢 Developing"}**
Seller motivation is **${motivation.toLowerCase()}** with a stated timeline of **${timeline}** — ${/ASAP|1-3/i.test(timeline) ? "prioritize same-day callback and get a walkthrough on the calendar within 48 hours. Speed matters here." : "nurture with MLS vs. cash education content and follow up weekly. Don't let this one go cold."}`;
    }

    /* ── Contract Extractor ─────────────────────────────────────────────── */
    case "contract-extractor":
      return `## Contract Extract
**${co} Transaction Coordinator | AI-Assisted Review**

### Parties
| Role | Name | Contact |
|------|------|---------|
| Buyer | [Paste contract to extract] | — |
| Seller | [Paste contract to extract] | — |
| Listing Agent / Firm | [Paste contract to extract] | — |
| Buyer's Agent / Firm | [Paste contract to extract] | — |

### Property
[Paste a purchase agreement into the text field above and the AI will extract the full address, legal description, and property type.]

### Financial Terms
| Item | Amount / Detail |
|------|----------------|
| Purchase Price | [Extracted on submit] |
| Earnest Money | [Extracted on submit] |
| EMD Deadline | [Extracted on submit] |
| Down Payment | [Extracted on submit] |
| Loan Type & Amount | [Extracted on submit] |

### Critical Deadlines
| Milestone | Date | Days from Acceptance |
|-----------|------|---------------------|
| Inspection Contingency | [Extracted] | — |
| Appraisal Contingency | [Extracted] | — |
| Financing Contingency | [Extracted] | — |
| Title Review | [Extracted] | — |
| Closing Date | [Extracted] | — |
| Possession Date | [Extracted] | — |

### Contingencies
- **Inspection:** [Extracted on submit]
- **Appraisal:** [Extracted on submit]
- **Financing:** [Extracted on submit]
- **Sale of Buyer's Home:** [Extracted on submit]

### 🔴 Flags
Paste your contract text above and click **Extract** — the AI will surface any non-standard terms, missing deadlines, or items requiring broker review.

> *AI-assisted extraction. All dates and terms must be verified against the original document. Human review required before relying on this extract. · ${co} · ${phone}*`;

    /* ── Cash Offer Evaluation ───────────────────────────────────────────── */
    case "cash-offer-eval": {
      const addr = s(input.address, "the subject property");
      const city = s(input.city, "Portland metro");
      const beds = s(input.beds, "3");
      const baths = s(input.baths, "2");
      const sqft = n(input.sqft, 1800);
      const yr = n(input.yearBuilt, 2000);
      const condition = s(input.condition, "Good");
      const motivation = s(input.motivation, "Relocating");

      const pricePerSqft = /excellent/i.test(condition) ? 310 : /good/i.test(condition) ? 285 : /fair/i.test(condition) ? 255 : 220;
      const arv = Math.round((sqft * pricePerSqft) / 1000) * 1000;
      const repairCost = /excellent/i.test(condition) ? Math.round(arv * 0.02) : /good/i.test(condition) ? Math.round(arv * 0.05) : /fair/i.test(condition) ? Math.round(arv * 0.10) : Math.round(arv * 0.17);
      const holdingCosts = Math.round(arv * 0.04);
      const margin = Math.round(arv * 0.11);
      const offerLow = Math.round((arv - repairCost - holdingCosts - margin) * 0.97 / 1000) * 1000;
      const offerHigh = Math.round((arv - repairCost - holdingCosts - margin) / 1000) * 1000;
      const currentAge = 2026 - yr;

      return `## Cash Offer Evaluation
**Cash Is King Home Buyers | Powered by ${co}**

### Estimated Cash Offer Range
**$${offerLow.toLocaleString()} – $${offerHigh.toLocaleString()}**

Based on a ${beds}BD/${baths}BA · ${sqft.toLocaleString()} sqft · ${yr}-built home in ${condition.toLowerCase()} condition in ${city}, the estimated After-Repair Value is approximately $${arv.toLocaleString()} ($${pricePerSqft}/sqft). The offer range reflects standard investor acquisition parameters — ${currentAge > 20 ? "mechanical systems are aging and deferred maintenance has been factored in" : "relatively recent construction reduces major repair exposure"}. A final walkthrough will firm up the number within this range.

### Deductions Breakdown
| Item | Estimated Amount |
|------|----------------|
| After-Repair Value (ARV) | $${arv.toLocaleString()} |
| Estimated Repair & Update Costs | −$${repairCost.toLocaleString()} (${condition} condition) |
| Holding, Closing & Carrying Costs | −$${holdingCosts.toLocaleString()} (~4%) |
| Acquisition Margin | −$${margin.toLocaleString()} (~11%) |
| **Net Cash Offer Range** | **$${offerLow.toLocaleString()} – $${offerHigh.toLocaleString()}** |

### Net-to-Seller Comparison
| | Cash Offer | MLS Sale (estimated) |
|-|-----------|---------------------|
| Sale Price | $${offerHigh.toLocaleString()} | ~$${arv.toLocaleString()} |
| Agent Commission | $0 | ~$${Math.round(arv * 0.05).toLocaleString()} |
| Closing Costs | $0 | ~$${Math.round(arv * 0.01).toLocaleString()} |
| Repairs | $0 as-is | ~$${Math.round(repairCost * 0.6).toLocaleString()} (seller credits) |
| Timeline | 7–21 days | 45–75 days |
| **Net to Seller** | **~$${offerHigh.toLocaleString()}** | **~$${Math.round(arv * 0.93).toLocaleString()}** |

### Recommendation
For a seller with motivation **"${motivation}"** and a **${s(input.condition, "good")}** condition property, ${/excellent|good/i.test(condition) && arv > 600000 ? `the MLS path will likely net $${Math.round((arv * 0.93 - offerHigh) / 1000)}K–$${Math.round((arv * 0.93 - offerLow) / 1000)}K more — worth the extra 6–8 weeks if timeline is flexible. Consider the cash offer as a backstop if the MLS launch doesn't meet expectations in the first 10 days.` : `the certainty and speed of a cash close may outweigh the MLS premium — especially given condition factors and a seller who values a clean, contingency-free close. Recommend scheduling a no-obligation walkthrough to firm up the number.`}

Schedule a walkthrough: ${phone} · ${co}`;
    }

    default:
      return `Thanks — connect an ANTHROPIC_API_KEY to enable live AI responses. ${phone}`;
  }
}
