const B = "/matin/brand";

export type BlogPost = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  readTime: string;
  image: string;
  /** Static HTML body — rendered with article-body CSS class */
  body: string;
  /** h2/h3 headings for the TOC sidebar */
  toc: { id: string; label: string; level: 2 | 3 }[];
  /** Slug of the agent who authored this post */
  authorSlug: string;
};

export const allPosts: BlogPost[] = [
  {
    slug: "selling-home-oregon-2026-playbook",
    title: "Selling Your Home in Oregon: The 2026 Playbook",
    category: "Selling",
    excerpt:
      "Pricing, prep, marketing, and timing — the complete, no-nonsense guide to selling your Oregon home for top dollar, straight from the team that moves 305+ homes a year.",
    readTime: "9 min read",
    image: `${B}/14584-home-selling-oregon-preview.jpg`,
    authorSlug: "alicia-smith",
    toc: [
      { id: "price-it-right", label: "Price It Right", level: 2 },
      { id: "prepare-your-home", label: "Prepare Your Home", level: 2 },
      { id: "marketing-that-works", label: "Marketing That Works", level: 2 },
      { id: "negotiation-tactics", label: "Negotiation Tactics", level: 3 },
      { id: "closing-the-deal", label: "Closing the Deal", level: 2 },
    ],
    body: `
<h2 id="price-it-right">Price It Right</h2>
<p>The single biggest mistake Oregon sellers make is overpricing at launch. A home that sits generates doubt — buyers assume something is wrong, and agents stop showing it. The right list price is the one that creates immediate competition.</p>
<p>Your Matin broker will pull a detailed Comparative Market Analysis (CMA) — looking at homes sold within the past 90 days, within a half-mile radius, with similar square footage and condition. We cross-reference active competition and pending sales to find the price that attracts multiple offers on day one.</p>
<blockquote>Homes priced within 2% of fair market value sell 18 days faster and 3.2% closer to list price than homes that require a price drop.</blockquote>

<h2 id="prepare-your-home">Prepare Your Home</h2>
<p>Buyers decide in eight seconds whether they like a home. Your job is to remove every friction point in that first impression — starting at the curb and ending in the garage.</p>
<ul>
  <li><strong>Deep clean and declutter.</strong> Rent a storage unit if you need to. Packed closets signal "not enough space."</li>
  <li><strong>Fresh neutral paint.</strong> One coat of agreeable gray or warm white returns $3–5 per dollar spent in Oregon markets.</li>
  <li><strong>Landscaping.</strong> Mow, edge, mulch fresh, and plant a few seasonal flowers near the entrance.</li>
  <li><strong>Pre-listing inspection.</strong> Find the issues before buyers do — and fix the ones that matter. Surprises kill deals.</li>
</ul>

<h2 id="marketing-that-works">Marketing That Works</h2>
<p>The MLS is just the start. Matin Real Estate's full marketing stack for every listing includes professional photography (twilight shots when applicable), Matterport 3D tours, drone aerials for properties over a quarter-acre, and targeted social campaigns across Meta and Google.</p>
<p>Every listing gets a dedicated property website, email blast to our buyer database of 4,200+ active buyers, and agent-to-agent marketing to the 800+ brokers in our referral network.</p>

<h3 id="negotiation-tactics">Negotiation Tactics</h3>
<p>Oregon is a dual-agency disclosure state. Make sure your listing agent is working exclusively for you. When offers come in, resist the urge to accept the highest price without reading the full picture — contingencies, earnest money, closing timeline, and financing strength all affect whether that number lands at closing.</p>
<p>Our brokers are trained negotiators. We advise on counter-offer strategy, escalation clauses, and when to call a multiple-offer review to drive competitive bids.</p>

<h2 id="closing-the-deal">Closing the Deal</h2>
<p>Oregon is an escrow state — a neutral third party manages funds and paperwork. Typical closing timelines run 30–45 days from accepted offer. Your checklist: stay responsive to the title company, complete agreed repairs on time, and keep utilities on for the final walkthrough.</p>
<p>The average Matin seller nets 99.4% of their asking price. The playbook above is why.</p>
    `.trim(),
  },
  {
    slug: "closing-costs-oregon",
    title: "Closing Costs in Oregon: What You'll Actually Pay",
    category: "Buying",
    excerpt:
      "A clear, line-by-line breakdown of buyer and seller closing costs in Oregon — and which ones are negotiable.",
    readTime: "6 min read",
    image: `${B}/14838-closing-costs-oregon-preview.jpg`,
    authorSlug: "alicia-smith",
    toc: [
      { id: "buyer-costs", label: "Buyer Closing Costs", level: 2 },
      { id: "seller-costs", label: "Seller Closing Costs", level: 2 },
      { id: "whats-negotiable", label: "What's Negotiable", level: 2 },
    ],
    body: `
<h2 id="buyer-costs">Buyer Closing Costs</h2>
<p>Oregon buyers typically pay 2–3% of the purchase price at closing. On a $450,000 home, that's $9,000–$13,500. Here's where it goes:</p>
<ul>
  <li><strong>Loan origination fee:</strong> 0.5–1% of the loan amount</li>
  <li><strong>Appraisal:</strong> $500–$800</li>
  <li><strong>Title insurance (lender's policy):</strong> $500–$900</li>
  <li><strong>Escrow/closing fee:</strong> $800–$1,500 split with seller</li>
  <li><strong>Recording fees:</strong> $100–$200</li>
  <li><strong>Prepaid interest, insurance, and property taxes:</strong> varies</li>
</ul>
<p>You'll receive a Loan Estimate within three business days of applying — this document lists every anticipated cost and is your best comparison tool when shopping lenders.</p>

<h2 id="seller-costs">Seller Closing Costs</h2>
<p>Sellers bear the larger share, primarily because real estate commissions come out of the sale proceeds. Total seller costs typically run 7–9% of the sale price.</p>
<ul>
  <li><strong>Real estate commission:</strong> negotiated with your broker</li>
  <li><strong>Oregon transfer tax:</strong> $1.00 per $1,000 of sale price (county) + $1.00 per $1,000 (state in most counties)</li>
  <li><strong>Escrow/closing fee:</strong> $800–$1,500 split with buyer</li>
  <li><strong>Title insurance (owner's policy):</strong> $600–$1,200</li>
  <li><strong>Pro-rated property taxes:</strong> varies by closing date</li>
</ul>

<h2 id="whats-negotiable">What's Negotiable</h2>
<p>Almost everything except government fees. In a buyer's market, sellers routinely cover the buyer's closing costs as a concession — adding the amount to the sale price so both sides walk away cleaner. Ask your Matin broker about seller concessions when crafting your offer strategy.</p>
    `.trim(),
  },
  {
    slug: "home-inspections-demystified",
    title: "Home Inspections, Demystified",
    category: "Buying",
    excerpt:
      "What inspectors look for, which red flags actually matter, and how to use findings to negotiate.",
    readTime: "5 min read",
    image: `${B}/6737-home-inspections-preview.jpg`,
    authorSlug: "alicia-smith",
    toc: [
      { id: "what-gets-inspected", label: "What Gets Inspected", level: 2 },
      { id: "red-flags", label: "Red Flags That Matter", level: 2 },
      { id: "using-report-to-negotiate", label: "Using the Report to Negotiate", level: 2 },
    ],
    body: `
<h2 id="what-gets-inspected">What Gets Inspected</h2>
<p>A standard Oregon home inspection covers the structure, roof, foundation, electrical panel, plumbing, HVAC, insulation, and all visible components. The inspector documents what they see — not what's behind walls — and rates items from informational to safety hazard.</p>
<p>Specialized inspections are separate: sewer scope, radon test, oil tank sweep (critical in older Portland-area homes), and pest inspection each run $100–$300 and are well worth the cost.</p>

<h2 id="red-flags">Red Flags That Matter</h2>
<p>Not every inspection finding is a deal-breaker. Focus energy on issues that affect safety, structure, or cost more than $5,000 to fix:</p>
<ul>
  <li><strong>Foundation cracks with movement</strong> — horizontal cracks in a block foundation are serious. Vertical hairline cracks often aren't.</li>
  <li><strong>Active roof leaks</strong> — especially if sheathing is compromised</li>
  <li><strong>Knob-and-tube wiring</strong> — some insurers won't cover it, others require replacement</li>
  <li><strong>Sewer line condition</strong> — a sewer scope is non-optional on homes 30+ years old</li>
  <li><strong>Buried oil tanks</strong> — decommissioned tanks still carry liability in Oregon</li>
</ul>

<h2 id="using-report-to-negotiate">Using the Report to Negotiate</h2>
<p>Oregon's inspection contingency gives you leverage. You can request repairs, a price reduction, or a seller credit to cover costs — or walk away entirely. Your Matin broker will help you identify which items to push on and which to accept. The goal is a fair deal, not a perfect house.</p>
    `.trim(),
  },
  {
    slug: "house-hunting-checklist",
    title: "The Ultimate House-Hunting Checklist",
    category: "Buying",
    excerpt:
      "Stay organized and decisive on every tour with the checklist our buyer's agents swear by.",
    readTime: "4 min read",
    image: `${B}/17391-house-hunting-checklist-preview.jpg`,
    authorSlug: "alicia-smith",
    toc: [
      { id: "before-you-tour", label: "Before You Tour", level: 2 },
      { id: "at-the-property", label: "At the Property", level: 2 },
      { id: "after-the-showing", label: "After the Showing", level: 2 },
    ],
    body: `
<h2 id="before-you-tour">Before You Tour</h2>
<ul>
  <li>Get pre-approved — not just pre-qualified — so you can move fast</li>
  <li>Define your non-negotiables vs. nice-to-haves before you walk into a single home</li>
  <li>Research the neighborhood: school ratings, commute time, walkability, flood zone</li>
  <li>Look up the home's history on county records: prior sales, tax assessment, permits pulled</li>
</ul>

<h2 id="at-the-property">At the Property</h2>
<ul>
  <li>Test every door, window, faucet, light switch, and outlet</li>
  <li>Look at the ceiling corners in every room — water stains indicate leaks</li>
  <li>Check attic access for insulation depth and signs of moisture</li>
  <li>Run the dishwasher and garbage disposal</li>
  <li>Walk the perimeter: grading, gutters, downspout extensions, and driveway condition</li>
  <li>Ask the agent: why is the seller moving? How long has it been listed?</li>
</ul>

<h2 id="after-the-showing">After the Showing</h2>
<p>Write notes immediately — you'll forget details after the third house. Rate each property 1–10 on your non-negotiables. When one clears your threshold, move fast. In Oregon's competitive markets, good homes don't wait.</p>
    `.trim(),
  },
  {
    slug: "types-of-mortgages",
    title: "Types of Mortgages: Which Loan Fits You?",
    category: "Financing",
    excerpt:
      "Conventional, FHA, VA, jumbo — a plain-English guide to the loan that matches your situation.",
    readTime: "7 min read",
    image: `${B}/6748-types-of-mortgages-preview.jpg`,
    authorSlug: "alicia-smith",
    toc: [
      { id: "conventional", label: "Conventional Loans", level: 2 },
      { id: "fha", label: "FHA Loans", level: 2 },
      { id: "va", label: "VA Loans", level: 2 },
      { id: "jumbo", label: "Jumbo Loans", level: 2 },
      { id: "which-is-right", label: "Which Is Right for You?", level: 2 },
    ],
    body: `
<h2 id="conventional">Conventional Loans</h2>
<p>Conventional loans conform to Fannie Mae/Freddie Mac guidelines. They're the most common loan type in Oregon. You'll need a minimum 620 credit score and 3–20% down depending on the program. Put down less than 20% and you'll pay PMI until you reach 20% equity.</p>

<h2 id="fha">FHA Loans</h2>
<p>Backed by the Federal Housing Administration, FHA loans allow down payments as low as 3.5% with a 580+ credit score. The trade-off: mortgage insurance premium (MIP) for the life of the loan if you put down less than 10%. FHA loans have loan limits — in most Oregon counties the 2026 limit is $524,225 for a single-family home.</p>

<h2 id="va">VA Loans</h2>
<p>Available to eligible veterans, active-duty service members, and surviving spouses. Zero down payment, no PMI, and competitive rates. Oregon has a large VA loan market — if you qualify, this is usually the best loan available to you. Expect a VA funding fee (typically 2.15% for first use) added to the loan balance.</p>

<h2 id="jumbo">Jumbo Loans</h2>
<p>Any loan above the conforming limit ($766,550 in most Oregon counties) is a jumbo. Higher credit score requirements (720+), larger reserves, and stricter debt-to-income ratios. Rates are competitive but underwriting takes longer — plan for a 45-day close minimum.</p>

<h2 id="which-is-right">Which Is Right for You?</h2>
<p>First-time buyer with solid credit and limited savings? Look at FHA or the Oregon Bond Residential Loan program. Military background? VA, no question. Strong credit, 10%+ down, home under conforming limit? Conventional. Buying in the Portland West Hills or Lake Oswego above $800K? Jumbo territory — get two lender quotes.</p>
    `.trim(),
  },
  {
    slug: "short-sales-explained",
    title: "Short Sales Explained for Oregon Homeowners",
    category: "Selling",
    excerpt:
      "How short sales work, when they make sense, and what to expect from lenders and timelines.",
    readTime: "8 min read",
    image: `${B}/17945-short-sales-preview.jpg`,
    authorSlug: "alicia-smith",
    toc: [
      { id: "what-is-a-short-sale", label: "What Is a Short Sale?", level: 2 },
      { id: "when-it-makes-sense", label: "When It Makes Sense", level: 2 },
      { id: "the-timeline", label: "The Timeline", level: 2 },
      { id: "credit-impact", label: "Credit Impact", level: 2 },
    ],
    body: `
<h2 id="what-is-a-short-sale">What Is a Short Sale?</h2>
<p>A short sale is when a homeowner sells their property for less than what's owed on the mortgage — and the lender agrees to accept the shortfall. It's an alternative to foreclosure that benefits everyone: the homeowner avoids foreclosure, the lender recoups more than they would through the foreclosure process, and the buyer gets a property at a discount.</p>

<h2 id="when-it-makes-sense">When It Makes Sense</h2>
<p>A short sale is worth exploring if you're experiencing a financial hardship (job loss, medical bills, divorce, ARM reset) and owe more than your home is worth. You'll need to demonstrate the hardship to the lender with documentation: bank statements, tax returns, a hardship letter, and a BPO (broker price opinion) showing the home's current market value.</p>
<p>If you have equity — even a small amount — a traditional sale is faster and cleaner. Short sales are for underwater homeowners.</p>

<h2 id="the-timeline">The Timeline</h2>
<p>Short sales are slow. Once you accept an offer, it goes to the lender for approval. That process typically takes 60–120 days — and can stretch longer if the loan has been sold or securitized. Buyers must be patient, and contracts include short sale addenda extending standard contingency periods. Matin's short sale specialists manage lender communication throughout to keep things moving.</p>

<h2 id="credit-impact">Credit Impact</h2>
<p>A short sale typically drops your credit score 100–150 points, compared to 200–300 for a foreclosure. You may be able to purchase again in 2–4 years (conventional) or 3 years (FHA) after a short sale vs. 7 years post-foreclosure. Consult a HUD-approved housing counselor and a tax professional — the IRS has specific rules around forgiven debt that may or may not apply to your situation.</p>
    `.trim(),
  },
  {
    slug: "home-appraisals-how-value-gets-set",
    title: "Home Appraisals: How Value Gets Set",
    category: "Selling",
    excerpt:
      "What appraisers measure, why deals hinge on it, and how to prepare for a clean appraisal.",
    readTime: "5 min read",
    image: `${B}/18072-home-appraisals-preview.jpg`,
    authorSlug: "alicia-smith",
    toc: [
      { id: "what-appraisers-measure", label: "What Appraisers Measure", level: 2 },
      { id: "why-deals-hinge-on-it", label: "Why Deals Hinge on It", level: 2 },
      { id: "prepare-for-appraisal", label: "How to Prepare", level: 2 },
    ],
    body: `
<h2 id="what-appraisers-measure">What Appraisers Measure</h2>
<p>Appraisers establish fair market value by analyzing your property's size, condition, location, and comparable recent sales ("comps"). They visit in person and produce a report within 3–7 days. The appraised value is the ceiling most lenders will finance against — if the home appraises below the contract price, the deal is in jeopardy.</p>

<h2 id="why-deals-hinge-on-it">Why Deals Hinge on It</h2>
<p>When a lender funds a purchase loan, they're essentially investing in the property as collateral. They won't lend more than it's worth. If an appraisal comes in at $430,000 on a $450,000 contract, the buyer must either bring an extra $20,000 to closing, the seller must reduce the price, or they renegotiate the split — or the deal falls apart.</p>
<p>In competitive markets, buyers sometimes waive the appraisal contingency to make offers more attractive. This is high-risk without substantial cash reserves.</p>

<h2 id="prepare-for-appraisal">How to Prepare</h2>
<ul>
  <li>Clean and declutter — appraisers note condition</li>
  <li>Make minor repairs visible before the visit: patch holes, replace broken hardware</li>
  <li>Prepare a list of all improvements made in the past 5 years with dates and costs</li>
  <li>Pull comps yourself with your broker — if the appraiser misses a relevant sale, you can submit a rebuttal with evidence</li>
  <li>Be available to answer questions (or have your agent present)</li>
</ul>
    `.trim(),
  },
  {
    slug: "final-walkthrough-checklist",
    title: "The Final Walkthrough: Your Last-Minute Checklist",
    category: "Buying",
    excerpt:
      "The 12 things to verify before you sign — so move-in day brings zero surprises.",
    readTime: "4 min read",
    image: `${B}/15964-final-walkthrough-preview.jpg`,
    authorSlug: "alicia-smith",
    toc: [
      { id: "purpose", label: "Purpose of the Walkthrough", level: 2 },
      { id: "the-checklist", label: "The 12-Point Checklist", level: 2 },
      { id: "what-to-do-if", label: "What to Do If Something's Wrong", level: 2 },
    ],
    body: `
<h2 id="purpose">Purpose of the Walkthrough</h2>
<p>The final walkthrough happens 24–48 hours before closing. It's not a second inspection — it's a confirmation that the home is in the condition you agreed to purchase it in, that agreed-upon repairs were completed, and that nothing has changed since you made your offer.</p>

<h2 id="the-checklist">The 12-Point Checklist</h2>
<ul>
  <li>All agreed repairs have been completed — get receipts if possible</li>
  <li>No new damage from the seller's move-out (walls, floors, fixtures)</li>
  <li>All appliances included in the sale are present and working</li>
  <li>All light fixtures included in the sale are present</li>
  <li>HVAC operates in both heat and cool modes</li>
  <li>Hot water heater produces hot water</li>
  <li>All faucets run without leaks or pressure issues</li>
  <li>No new water stains on ceilings or walls</li>
  <li>Garage door openers are present and functioning</li>
  <li>All window treatments included in the sale are present</li>
  <li>Trash has been fully removed from the property</li>
  <li>Seller has left keys, garage openers, alarm codes, and manuals</li>
</ul>

<h2 id="what-to-do-if">What to Do If Something's Wrong</h2>
<p>Don't close until it's resolved — or until you have a written credit or holdback agreement. Your Matin agent will negotiate with the seller's agent to either delay closing, secure a cash credit at close, or establish a repair holdback in escrow. Don't accept verbal assurances. Get everything in writing.</p>
    `.trim(),
  },
  {
    slug: "how-to-sell-house-fast",
    title: "How to Sell Your House Fast (Without Leaving Money Behind)",
    category: "Selling",
    excerpt:
      "Speed and price aren't a trade-off when you do it right. Here's how to sell quickly and well.",
    readTime: "6 min read",
    image: `${B}/17930-how-to-sell-fast-preview.jpg`,
    authorSlug: "alicia-smith",
    toc: [
      { id: "price-to-create-urgency", label: "Price to Create Urgency", level: 2 },
      { id: "compress-the-timeline", label: "Compress the Timeline", level: 2 },
      { id: "make-it-easy-to-buy", label: "Make It Easy to Buy", level: 2 },
    ],
    body: `
<h2 id="price-to-create-urgency">Price to Create Urgency</h2>
<p>The fastest sales start with aggressive but defensible pricing. Price slightly below comparable sold homes — not dramatically (that triggers skepticism) but enough to create a "this is a deal" feeling in buyers who've been watching the market. Multiple offers in the first weekend compress your timeline to 7–14 days to pending.</p>

<h2 id="compress-the-timeline">Compress the Timeline</h2>
<p>Schedule photography, video, and the 3D tour before you list. Launch on a Thursday or Friday to capture the weekend buyer wave. Set a formal offer review date 4–5 days after listing — this signals scarcity and keeps buyers from lowballing with "we're the only offer" tactics.</p>
<ul>
  <li>Pre-listing disclosure packet ready on day one</li>
  <li>Pre-listing inspection done — remove contingency risk for buyers</li>
  <li>Flexible showing availability: lockbox so agents can show any time</li>
  <li>Offer deadline creates urgency without appearing desperate</li>
</ul>

<h2 id="make-it-easy-to-buy">Make It Easy to Buy</h2>
<p>The fastest offers come from buyers with the least friction. Accept financed buyers with strong pre-approvals — the loan type matters less than the lender's track record. Offer a reasonable possession date. Don't require a sale contingency from the buyer if you can avoid it. The more conditions you put on buyers, the fewer offers you get.</p>
<p>Matin's median days to pending is 8. That's not luck — it's the system above, executed every time.</p>
    `.trim(),
  },
];

export const getPost = (slug: string) => allPosts.find((p) => p.slug === slug);

export const getRelatedPosts = (slug: string, count = 3) => {
  const post = getPost(slug);
  if (!post) return allPosts.slice(0, count);
  // prefer same category, fall back to others
  const sameCategory = allPosts.filter((p) => p.slug !== slug && p.category === post.category);
  const other = allPosts.filter((p) => p.slug !== slug && p.category !== post.category);
  return [...sameCategory, ...other].slice(0, count);
};
