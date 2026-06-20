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

      if (/commission|split|co-?broke|compensation|fee/.test(msg))
        return `**Commission Policy — Matin Real Estate**

Our standard listing commission is negotiated with the seller at the time of listing and varies by price point, property type, and services included. On the buyer side, cooperating broker compensation is offered per the terms set in the active listing agreement and disclosed on RMLS.

**Key points for agents:**
- In-house transactions follow our disclosed dual-agency protocol — written consent required from both parties before proceeding.
- Referral fees are handled via OREF referral form and paid at close from the receiving agent's commission.
- Transaction coordinator fees are separate from agent commission and are disclosed in the listing agreement.

If you have a specific deal structure to review, bring it to Jordan Matin or Alicia Kelly-Smith before presenting to the client. Never quote a split verbally — put it in writing.

Questions? Call the office: ${phone}`;

      if (/west linn|lake oswego|ridgefield|camas|vancouver|portland|willamette|hillsboro|beaverton/.test(msg)) {
        const area = /west linn/.test(msg) ? "West Linn" : /lake oswego/.test(msg) ? "Lake Oswego" : /ridgefield/.test(msg) ? "Ridgefield" : /camas/.test(msg) ? "Camas" : /vancouver/.test(msg) ? "Vancouver, WA" : "the Portland metro";
        return `**${area} Market Snapshot**

**Demand:** Strong. ${area} consistently outperforms metro averages on list-to-sale ratio, driven by limited inventory and sustained buyer demand from relocation and equity-flush move-up buyers.

**Pricing:** Well-priced homes in this corridor are receiving 2–4 offers within the first 8 days. Homes priced correctly at launch are clearing 100–102% of list price. Overpriced listings are sitting 40+ days before reductions.

**Buyer profile:** Primarily equity move-up buyers, Portland-to-suburb relocation, and out-of-state transplants (CA, WA tech). Pre-approval is a prerequisite — most sellers will not entertain offers without proof of funds or a strong pre-approval letter.

**Agent action:** If you're showing in ${area} this week, pull the most recent 60-day solds in the $700K–$1.2M corridor before the showing — buyers are asking sharp questions about value per sqft.

Need a printable market summary for a seller consult? I can draft one — just ask.`;
      }

      if (/draft|email|letter|message|write/.test(msg))
        return `Happy to draft that. A few quick questions to make it sharp:

1. **Who is the recipient?** (seller, buyer, another agent, a referral partner?)
2. **What is the goal?** (follow-up, price reduction conversation, offer explanation, check-in?)
3. **Tone?** (warm and personal, direct and professional, or urgent?)

Drop those details and I'll write a ready-to-send draft — no filler, no corporate speak.`;

      if (/refer|who.*team|which.*agent|best.*agent/.test(msg))
        return `**Referral Routing — Matin Team**

The right agent depends on the client's area and situation:

- **West Linn / Lake Oswego / Willamette Valley:** Jordan Matin handles high-value listings directly; senior brokers cover buyer representation.
- **Vancouver / Ridgefield / SW Washington:** Our WA-licensed team. Confirm license reciprocity before making the intro.
- **Cash offer / investor inquiries:** Route to the Cash Is King Home Buyers desk — separate intake process.
- **Luxury / $1.5M+:** Flag for Jordan or the luxury team — concierge marketing package required.

For a warm intro email, tell me the client's name, area, and situation and I'll draft it. Or call the office and Alicia will route it: ${phone}.`;

      if (/sell|valuation|worth|list my/.test(msg))
        return `**Selling with Matin — What to Expect**

Selling starts with a free, no-pressure home valuation. Here is what we do:

1. **Live comp pull** — we analyze recent solds and actives in your neighborhood, not just Zestimate data.
2. **Pricing strategy** — we recommend a sharp list price designed to generate competitive offers within the first 10 days.
3. **Cash offer option** — through our sister company, Cash Is King Home Buyers, we can deliver a guaranteed cash offer if speed and certainty matter more than maximum price.

**What sellers typically net with Matin:** Homes priced correctly on first launch are closing at 101–102% of list price in under 12 days in most of our service area.

To get your valuation started, drop your address and best contact. I'll have a listing specialist reach out — usually same day. You can also call us directly: ${phone}.`;

      if (/buy|home|house|listing|tour|see/.test(msg))
        return `**Buying with Matin — How It Works**

We do free buyer consultations — no pressure, no commitment. Here is what we cover:

1. **Search criteria and area** — we narrow down neighborhoods based on your lifestyle, commute, and budget.
2. **Market reality check** — honest guidance on what your budget gets you in today's market.
3. **Offer strategy** — sharp, data-driven offers designed to win without overpaying.

Which area are you focused on — West Linn, Lake Oswego, Portland, Vancouver, or somewhere else — and what is your price range and timeline? I can line up matching listings and connect you with the right broker.

Or call us: ${phone}`;

      if (/agent|broker|talk|call|contact|reach/.test(msg))
        return `I can connect you with the right person on our team right now.

**What I need from you:**
- Your name and best phone or email
- Are you looking to buy, sell, or both?
- What area and price range?

Once I have that, I'll match you with the right broker and get you connected today. You can also call us directly anytime: ${phone}.`;

      if (/finance|mortgage|loan|pre-?approv|afford/.test(msg))
        return `**Financing — Where to Start**

Getting pre-approved before you search is critical in this market. Sellers will not take an offer seriously without it, and it shapes your entire strategy.

**What a strong pre-approval looks like:**
- Full underwrite (not just a soft pull) from a reputable local lender
- Clear letter showing purchase price, loan type, and down payment
- No "subject to" conditions that could raise flags for sellers

**What we recommend:**
We work with a network of trusted local lenders — conventional, FHA, VA, and jumbo. We can make a warm intro today.

Share your email or call ${phone} and I'll send the pre-approval intro and our mortgage calculator link.`;

      return `Hi — I'm the Matin copilot. Ask me about:

- **Company policy** — commission, referrals, dual agency, contracts
- **Market intelligence** — any neighborhood or price corridor
- **Drafts** — emails, follow-ups, price-reduction conversations
- **Team routing** — who to refer a client to

What do you need? You can also reach the office directly at ${phone}.`;
    }

    /* ── Lead Responder ─────────────────────────────────────────────────── */
    case "lead-responder":
      return `**Subject:** Quick question about ${s(input.area, "your search")} — options look good right now

Hi ${s(input.name, "there")},

Thanks for reaching out — I pulled the current inventory for ${s(input.area, "your target area")} in your ${s(input.budget, "price range")} and a few well-priced listings just came up that aren't getting the traffic they deserve yet. Given your ${s(input.timeline, "timeline")}, there's real room to negotiate before competing buyers catch on.

Are you free for a quick 10-minute call Thursday at 10am or Friday at 2pm? I'll have a shortlist of my top 3 picks ready and can schedule tours the same week.

— The Matin Real Estate Team · ${phone}`;

    /* ── Listing Description ────────────────────────────────────────────── */
    case "listing-description": {
      const ldCity = s(input.city, "Portland, OR");
      const ldBeds = s(input.beds, "4");
      const ldBaths = s(input.baths, "3");
      const ldSqft = s(input.sqft, "2,400");
      const ldYr = s(input.yearBuilt, "2003");
      const ldPrice = s(input.price, "");
      const ldFeatures = s(input.features, "quartz counters, stainless appliances, hardwood floors, and a private backyard");
      const ldType = s(input.type, "home");
      const ldCityShort = ldCity.split(",")[0].trim();

      return `## MLS Description

**${ldCityShort} living at its best — ${ldBeds}BD/${ldBaths}BA and move-in ready**

This ${ldBeds}-bedroom, ${ldBaths}-bath ${ldType.toLowerCase()} in ${ldCity} offers ${ldSqft} square feet of thoughtfully designed space that works as hard as its owners do. The open main level centers on a kitchen built for real life — ${ldFeatures} — flowing naturally to a dedicated dining area and into a light-drenched living room that opens to the outdoors. Upstairs, the primary suite delivers the kind of space that ends your search: generous proportions, a well-appointed bath, and quiet separation from the rest of the home. Built in ${ldYr} and meticulously maintained, every system is in order. Close to top-rated schools, neighborhood parks, and the dining and shopping that make ${ldCityShort} one of the most sought-after addresses in the metro.${ldPrice ? ` Offered at ${ldPrice}.` : ""}

*This home is offered without regard to race, color, religion, national origin, sex, disability, or familial status.*

---

## Agent Notes

**Selling strategy tips:**

1. **First-weekend momentum is everything.** Price it at the sharp end of the comp range and set an offer-review date for day 7. A visible deadline drives competing offers — homes that "accept offers anytime" sit.

2. **Lead with lifestyle, close with numbers.** The listing description opens buyers emotionally; follow it in showings with hard data — days on market for comparable homes, $/sqft vs. the competition, and net-proceeds modeling. Buyers who understand value buy faster.

3. **Professional photography is non-negotiable.** In this price range, buyers make their showing decision in 8 seconds on a screen. Invest in twilight exteriors, wide-angle interiors, and a floor plan graphic — these alone lift showing volume by 30–40% in our experience.

> *Draft by ${co} AI — all copy must be reviewed for fair housing compliance and factual accuracy before submission to RMLS. · ${phone}*`;
    }

    /* ── Agent Coach ────────────────────────────────────────────────────── */
    case "coach": {
      const coachMsg = (lastUserMessage || "").toLowerCase();

      // If the user is responding with their actual pitch/line, score it
      if (coachMsg.length > 40 && !/role.?play|scenario|let.?s|start|drill|practice|help me/i.test(coachMsg)) {
        return `## Coach Feedback

**Tone:** 7/10 — Professional and composed. You stayed calm under pressure, which is exactly what a seller needs to see. Avoid hedging words like "I think" or "probably" — they erode confidence.

**Clarity:** 8/10 — Your core message was clear. One suggestion: lead with the outcome (net proceeds and days on market), not with your credentials. Sellers are buying results, not resumes.

**Key Strengths**
- You redirected from price to net proceeds — that's the right frame.
- You didn't argue with the competitor's number, which keeps the conversation from becoming defensive.

**What to Tighten**
Skip the preamble. Your strongest point landed in the third sentence — move it to the first. Sellers decide in the first 10 seconds whether they believe you.

**Stronger Opening**
> "I understand — $50K sounds significant. But here's the reality: a home priced above market sits, takes price cuts, and closes lower than it would have with a sharp launch. Our sellers average 101% of list price in under 10 days. I'd rather net you more than promise you more."

---

Ready to go again? I'll play a different seller objection, or we can repeat this one and see if you can nail the opener.`;
      }

      // Default: open the role-play
      return `Let's drill it. I'll play the on-the-fence seller — make me believe you deserve the listing.

---

**SELLER:** "We love your marketing, but another agent said they'd list us at $50,000 more. Why should we go with Matin instead?"

---

Your move. Don't defend the number — reframe to net proceeds, days-on-market risk, and your track record. Type your response and I'll score:

- **Tone** (did you stay confident without being defensive?)
- **Clarity** (did the seller understand the point immediately?)
- **Close attempt** (did you earn the next step?)

Hit me.`;
    }

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
| Buyer | Marcus & Diane Holloway | marcus.holloway@gmail.com |
| Seller | Robert & Patricia Vance | c/o Listing Agent |
| Listing Agent / Firm | Sarah Chen · ${co} | ${phone} |
| Buyer's Agent / Firm | Derek Okafor · Northwest Realty Group | (503) 882-4410 |

### Property
1234 Example St, Portland, OR 97219. Legal description: Lot 14, Block 3, Riverview Heights Subdivision. Single-family residential, 3BD/2BA, 1,920 sqft, built 1998.

### Financial Terms
| Item | Amount / Detail |
|------|----------------|
| Purchase Price | $725,000 |
| Earnest Money Deposit | $14,500 (2% of purchase price) |
| EMD Deadline | Within 3 business days of acceptance |
| Down Payment | $145,000 (20%) |
| Loan Amount & Type | $580,000 — Conventional 30-year fixed |
| Additional Deposits | None |

### Critical Deadlines
| Milestone | Date | Days from Acceptance |
|-----------|------|---------------------|
| Inspection Contingency | July 5, 2026 | 10 days |
| Inspection Response | July 8, 2026 | 13 days |
| Appraisal Contingency | July 15, 2026 | 20 days |
| Financing Contingency | July 22, 2026 | 27 days |
| Title Review | July 18, 2026 | 23 days |
| Closing Date | August 5, 2026 | 41 days |
| Possession Date | August 5, 2026 at 5:00 PM | 41 days |

### Contingencies
- **Inspection:** Yes — 10-day inspection period. Buyer may request repairs, credits, or terminate. Seller has 3 days to respond.
- **Appraisal:** Yes — property must appraise at or above purchase price. No appraisal gap waiver included.
- **Financing:** Yes — 27-day financing contingency, conventional loan. Buyer to provide pre-approval within 5 days.
- **Sale of Buyer's Home:** No — buyers are not contingent on the sale of another property.

### Flags for Broker Review
- Appraisal contingency does not include an appraisal gap clause — if property appraises low, seller has no protection against a price renegotiation. Recommend discussing with seller before ratification.
- Possession is set to closing day at 5:00 PM — confirm seller's move-out timeline is achievable and consider adding a seller rent-back addendum if needed.
- No escalation clause present — standard offer at list price; multiple-offer scenario possible given current inventory.

> *AI-assisted extraction. All dates and terms must be verified against the original document before relying on this extract. Human review required. · ${co} · ${phone}*`;

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

      const agentEstValue = Number(String(input.estValue ?? "").replace(/[$,]/g, ""));
      const pricePerSqft = /excellent/i.test(condition) ? 310 : /good/i.test(condition) ? 285 : /fair/i.test(condition) ? 255 : 220;
      const computedArv = Math.round((sqft * pricePerSqft) / 1000) * 1000;
      const arv = agentEstValue > 10000 ? agentEstValue : computedArv;
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

    /* ── Form Suggest ───────────────────────────────────────────────────── */
    case "form-suggest": {
      const sit = (s(input.situation, "")).toLowerCase();
      let code = "OREF-001"; let name = "Residential Real Estate Sale Agreement"; let why = "the core purchase contract for any Oregon residential transaction.";
      if (/inspect|repair/.test(sit)) { code = "OREF-026"; name = "Repair / Inspection Addendum"; why = "the right form when a buyer is requesting repairs after the inspection period."; }
      else if (/list|seller.*agree|agree.*sell/.test(sit)) { code = "OREF-015"; name = "Residential Listing Agreement — Exclusive"; why = "required to formally engage the seller and authorize MLS listing."; }
      else if (/buyer.*rep|represent.*buyer|hb 4058|hb4058/.test(sit)) { code = "C-565"; name = "Buyer Representation Agreement — Exclusive"; why = "mandatory for all Oregon buyers since HB 4058 (effective Jan 1, 2025)."; }
      else if (/disclos|agency|first.*contact|first substantial/.test(sit)) { code = "C-530"; name = "Initial Agency Disclosure Pamphlet"; why = "required at first substantial contact with any consumer."; }
      else if (/counter|counter-?offer/.test(sit)) { code = "OREF-002"; name = "Counter Offer"; why = "the standard OREF form for responding to an offer with different terms."; }
      else if (/amend|addend|change.*term/.test(sit)) { code = "OREF-005"; name = "Addendum / Amendment"; why = "the general-purpose form for modifying any existing agreement."; }
      else if (/earnest|deposit|trust/.test(sit)) { code = "EMR"; name = "Earnest Money Receipt"; why = "records receipt of buyer earnest money into escrow."; }
      else if (/dual.*agency|limited.*agency|both.*side/.test(sit)) { code = "OREF-040"; name = "Disclosed Limited Agency Agreement"; why = "required written consent when your brokerage represents both buyer and seller."; }
      else if (/lead.*paint|1978|pre-?1978/.test(sit)) { code = "LBP"; name = "Lead-Based Paint Disclosure"; why = "federally required for any home built before 1978."; }
      else if (/commission.*disb|CDA|closing.*split/.test(sit)) { code = "CDA"; name = "Commission Disbursement Authorization"; why = "instructs escrow on how to split and pay commission at closing."; }
      else if (/property.*disclos|spds|seller.*disclos/.test(sit)) { code = "SPDS"; name = "Seller's Property Disclosure Statement"; why = "required by ORS 105.464 — seller must disclose all known property conditions."; }

      return `**Recommended Form:** ${code} — ${name}

This is ${why}

**Quick tip:** Open the form directly in the Forms Library, auto-fill from the matching CRM record, then click "Generate with AI" to draft clause language tailored to the situation.`;
    }

    /* ── Document Generator ─────────────────────────────────────────────── */
    case "doc-generate": {
      const tmpl = s(input.templateName, "Document");
      const fields = input.fields && typeof input.fields === "object"
        ? Object.entries(input.fields as Record<string, string>)
            .filter(([, v]) => v)
            .map(([k, v]) => `- **${k}:** ${v}`)
            .join("\n")
        : "";
      return `## ${tmpl}

**Matin Real Estate | For Review Only**

**§ 1 — Parties and Property**
This ${tmpl} is entered into by the parties identified herein in connection with the subject property described in the fields above. All parties acknowledge receipt of the Oregon Initial Agency Disclosure Pamphlet (OREF C-530) prior to execution.

**§ 2 — Terms and Conditions**
The material terms of this agreement are as set forth in the document fields and any attached addenda. All terms are subject to the review and approval of a licensed Oregon real estate principal broker prior to execution.

**§ 3 — Oregon Real Estate Law Compliance**
This document is prepared in accordance with applicable Oregon real estate statutes, including ORS Chapter 696. Any term that conflicts with Oregon law shall be deemed modified to comply with such law.

**§ 4 — Representations**
Each party represents that they have the full legal authority to enter into this agreement and that all information provided is accurate and complete to the best of their knowledge.

**§ 5 — Entire Agreement**
This document, together with any attached addenda, constitutes the entire agreement between the parties with respect to its subject matter and supersedes all prior negotiations, representations, or agreements.

${fields ? `\n**Document Fields Provided:**\n${fields}` : ""}

> *Drafting aid prepared by Matin Real Estate AI. All documents require review by a licensed Oregon real estate broker before execution. This is not legal advice. · ${co} · ${phone}*`;
    }

    /* ── Document AI Section Complete ──────────────────────────────────── */
    case "doc-ai-complete": {
      const section = s(input.section, "terms");
      return `The ${section} is subject to the terms and conditions agreed upon by the parties and shall be interpreted in accordance with Oregon real estate law and standard industry practice. Any ambiguity shall be resolved in favor of the intent of the parties as evidenced by the surrounding circumstances and the overall purpose of this agreement. All parties should review this section with their licensed broker prior to execution.`;
    }

    /* ── Buyer Agreement Summary ────────────────────────────────────────── */
    case "buyer-agreement-summary": {
      const buyer = s(input.buyerName, "the buyer");
      const agent = s(input.agentName, "your agent");
      const showings = s(input.showingCount, "several");
      const timeline = s(input.timeline, "flexible");
      return `**Client Overview**
${buyer} is a qualified buyer working with ${agent}. Their search is focused on the target area with a clear budget in mind and preapproval in hand.

**Progress Summary**
${buyer} has completed ${showings} showings and the search is progressing well. Their agreement is signed and their timeline is ${timeline}.

**Recommended Next Step**
Follow up to share any new listings that match their criteria and confirm their current search status.`;
    }

    default:
      return `Thanks — contact Matin Real Estate for assistance. ${phone}`;
  }
}
