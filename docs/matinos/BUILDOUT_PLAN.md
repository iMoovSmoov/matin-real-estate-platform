# MatinOS Build-Out Plan — High-End, Real-Data, Fully-Branded, Mobile-Excellent

**Owner:** Lead engineer · **Date:** 2026-06-21 · **Status:** Approved for parallel build
**Source of truth:** the 12 per-section audits + 5 live-site scrapes in `tmp/matin-scrape/*.json`
**North star:** every screen must read as production brokerage software — real Matin data, real branded deliverables, real charts, dense operator surfaces, flawless on a phone. Kill every "skeleton" tell (gray ruled lines, fake "M" boxes, seeded stock photos, hardcoded KPIs, gray-initials avatars).

Verified during planning:
- `src/lib/data/` holds all 24 canonical JSON modules (agents, listings, leads, seller-leads, transactions, listing-pipeline, work-queue, company, communities, report-metrics, integrations, coaching-scenarios, etc.).
- Scrapes landed in `tmp/matin-scrape/`: `agents.json` (40 real agents + real phones/licenses/photo URLs), `locations.json` (2 real offices + 11 counties + 29 communities), `communities.json` (26 augmenting real city/county pages), `listings.json` (26 real active listings $192.8K–$1.85M), `brand.json` (real tagline/colors/logo assets/socials/legal).
- Components that ALREADY EXIST and are under-used: `src/components/brand/Logo.tsx`, `src/components/os/DocumentPreview.tsx`, `src/components/os/ScoreRing.tsx`, `src/components/command/DashboardCharts.tsx`, `src/components/command/reports/ReportCharts.tsx`, `src/components/site/CommunityMap.tsx`, `src/components/site/PropertyMap.tsx`.
- Deps already installed: `recharts@3.8.1`, `leaflet@1.9.4` + `react-leaflet@5.0.0`, `@anthropic-ai/sdk@0.105.0`. **No new dependency is required for the entire plan.**

---

## PART 1 — GLOBAL WORKSTREAMS (build these FIRST; every section depends on them)

### G-A. Real-Data Integration (`tmp/matin-scrape/*` → `src/lib/data/*`)

**Goal:** replace fabricated agents/phones/addresses/photos with the real scraped Matin data WITHOUT breaking the canonical demo records that the section scripts pin to (e.g. work-queue `WQ-006`, listing-pipeline `LP-008`, transactions `TX-3998/TX-3999`).

**The 4 fabricated agents to purge everywhere:** `ava-brooks`, `evan-carter`, `marcus-lee`, `nina-patel` (flagged `localOnlyNotOnLiveSite` in the scrape; they have NO headshot on disk → every avatar that references them renders gray initials). They appear as default/canonical owners across Today, CRM, Cash-Offer, Listing-Launch, Buyer-Agreements, Transactions, Forms, Marketing, Reports, Systems-Health, Admin.

**Tasks (do in order):**
1. **Reconcile `agents.json`.** Merge real fields from `tmp/matin-scrape/agents.json` into `src/lib/data/agents.json`: real `phone` (replace `(503) 555-01xx` placeholders for all 40), exact `title`/license, and confirm `photo: /matin/agents/<slug>.jpg` (all 40 verified present). Apply name fixes: `Chris Zurita` → `Chris Zurita-Orozco`; confirm `sierra-palmeri` = "Sierra Seggerman", `benjamin-fabian` = "Ben Fabian".
2. **Define real role-slots** the sections need (currently invented): Principal Broker = `jordan-matin`; pick real Listing Coordinators and Transaction Coordinators from the real roster (audits name Marcus Lee/Nina Patel/Evan Carter as the FAKE coordinators — replace with real agents whose titles/photos exist, e.g. `sierra-palmeri` for listing coordination, and real brokers for TC). Publish a single exported map `src/lib/data/roles.ts` → `{ principalBroker, listingCoordinators[], transactionCoordinators[], marketingLead, leadership[] }` of REAL slugs, and have every section import roles from here instead of hardcoding names.
3. **Build an agent-remap shim.** Add `src/lib/data/agent-remap.ts` exporting `remapAgent(slug) => realSlug` that maps the 4 fabricated slugs to real agents (deterministic, stable so the same fake always becomes the same real face). Run it (one-time codemod) over: `work-queue.json`, `leads.json`, `seller-leads.json`, `listing-pipeline.json`, `transactions.json`, `marketing-assets.json`/`campaigns.json`, `report-metrics.json` (`agentLeaderboard`), `coaching` seeds, `integrations.json` owners, and `adminData.ts`. Acceptance: `grep -r "ava-brooks\|evan-carter\|marcus-lee\|nina-patel" src/` returns **zero** hits in data + components.
4. **Merge `locations.json`.** Extend `company.json` to carry BOTH real offices (OR HQ 18825 Willamette Dr, West Linn 97068 @ 45.3897394,-122.6446416; WA 1220 Main St Ste 400, Vancouver 98660 @ 45.6307508,-122.6718), the 11 real counties, and 29 real communities. Add `company.offices[]` (don't drop the single-office consumers — keep `company.address` = OR HQ for back-compat).
5. **Merge `communities.json` + `listings.json`.** Append the 14 new real cities, 9 county pages, 3 regional hubs to `src/lib/data/communities.json`. Add the 26 real listings (real address/city/zip/beds/baths/sqft/price/status/DOM/agent) to `src/lib/data/listings.json` as a `real: true` cohort. Where a canonical demo record's address can be swapped to a REAL one in the same community/price band (e.g. the invented "1248 NW Cedar Hills Dr, Beaverton" marketing listing), point it at a real listing id.
6. **Listing-photo binding utility.** Add `src/lib/data/listing-photo.ts` → `listingPhoto(listingId)` returning the listing's real hero (`photos[0]` when present) else a deterministic `/matin/exteriors` fallback keyed by the listing's id (NOT a random seed). Replace EVERY `PropertyThumb` seed call across the app (Today queue, CRM tracked-interest, Cash-Offer hero, Listing-Launch record card + asset previews, Forms packets, Transactions hero, Reports recent-closings) with `listingPhoto(record.listingId)`.
7. **KPI-derivation pass.** Replace hardcoded KPI literals with values computed from the data layer so every count reconciles to its rows (anti-slop §3.2). Centralize in `src/lib/data/derive.ts`: `newLeads`, `hotSellerSignals`, `listingLaunches`, `txAtRisk`, `aiDraftsWaiting`, `workflowErrors`, etc. Every section's KPI strip and AI summary prose binds to these (no more `NEW_LEADS=47` literals; no more "3 failed automations" prose that can drift from `failedWorkflowRuns.length`).
8. **Resolve-or-fail audit.** Write `scripts/verify-data-refs.mjs` that walks every `sourceId`/`agentSlug`/`listingId` referenced by the section scripts and asserts each resolves to a real record (no empty `base` shape). Wire into CI/prebuild. Acceptance: 0 dangling refs.

**Guardrail:** canonical demo IDs (the records the scripts pin to for the "hero" state) must keep resolving. The remap changes the *face/phone/photo*, not the record id.

---

### G-B. Matin-Branded Document System (one component, used everywhere generation happens)

**Goal:** every generated/previewed client-facing artifact (Forms packets, Buyer Agreements, Transactions docs, Marketing email/flyer, Listing-Launch seller note, Cash-Offer net sheet, Coaching plan, Reports export) renders as a REAL Matin-branded, printable, downloadable document — not gray ruled lines, not raw text on a dark card.

**FIRST, fix the logo asset bug (blocking — do before any branded surface ships):**
`Logo.tsx` maps the "dark-on-light wordmark" to `/matin/brand/logo-268-20240626125130.jpg`, which the Admin audit identified as a **Willamette Valley MLS logo, NOT Matin**. Source/confirm a real dark Matin wordmark; if none exists on disk, render the white wordmark (`logo-3586_logo_logo-white-20211102123653.png`) on an ink chip for "dark" contexts and never show the MLS jpg. Verify both `variant=full theme=light|dark` paths show only Matin marks.

**Build `src/components/os/BrandedDocument.tsx`** (a real letterhead shell), props: `{ formId?, title, recipient?, agent?, fields?, body, signatureBlock?, variant: 'letter'|'agreement'|'flyer'|'email'|'netsheet'|'report', completion? }`. It renders:
- **Letterhead band:** real Matin wordmark (`<Logo variant="full"/>`), office line from `company.json` (`Matin Real Estate · 18825 Willamette Dr, West Linn OR 97068 · (503) 622-9624`), a gold hairline rule, and `formId` (e.g. `OREF C-565`) where applicable.
- **Structured field grid:** label:value rows bound to LIVE record values (not placeholders), with **green completion checkmarks** for filled fields and **red-outline** for missing (the §1.7/§1.10 pattern); clicking a missing item focuses/scrolls to the source input.
- **Real body:** for agreements, 3–5 numbered section headers + dense justified legal-paragraph text + inline labeled fillable rectangles (`Purchase Price $__`, initials boxes) at the density of the SkySlope reference — replacing `DocumentPreview`'s gray dashes for client-facing types.
- **Signature block + brand footer:** agent name/title/license/phone (real, from `agents.json`) + `Matin Real Estate · West Linn, OR · Equal Housing Opportunity` + `Page X of N` pager.
- **Print + download:** `@media print` stylesheet that strips app chrome; a `Download PDF`/`Print` action that renders THIS branded artifact (not a toast). Keep the existing `DocumentPreview` for INTERNAL docs (checklist exports); route all client-facing types through `BrandedDocument`.

**Variants to ship:**
- `flyer`: 8.5×11 proportion — Matin logo header + real listing hero photo + price/beds/baths spec block + agent headshot/name/license/phone footer + QR + Equal-Housing logo.
- `email`: branded from-bar (real `<MatinMark/>`, never a hand-rolled "M" box), visible merge tokens (`{{first_name}}`, `{{address}}`), branded footer with real West Linn office line.
- `netsheet`: "Estimated Seller Net Proceeds" Matin header + a waterfall/stacked bar (gross → payoff → commission → costs → net) + compliance footnote.

**Acceptance:** `grep -r "Signature field" / gray ruled placeholder` no longer appears for any client-facing preview; every generated doc shows the Matin wordmark + real office footer; Download produces a branded artifact.

---

### G-C. Map Element (real offices + listings + communities)

**Goal:** a real interactive/static map surfacing the two real Matin offices and real listing/community geocoordinates — used in Admin → Territories, Communities, and a listing/territory locator. Leaflet + react-leaflet already installed; `CommunityMap.tsx` + `PropertyMap.tsx` already exist.

**Tasks:**
1. **`src/components/os/TerritoryMap.tsx`** (wrap/reuse `CommunityMap`): centered on Portland metro, pins for the 2 real offices (West Linn HQ + Vancouver WA, real lat/lng from `locations.json`), the 11 real counties, and real listing markers (from the merged real `listings.json`). Monochrome-luxe tile style (no default blue OSM look that fights the brand); office pins use the Matin mark.
2. **Admin → Territories/Routing:** render `TerritoryMap` beside the routing table so "Area: Portland Metro / Lake Oswego" rules are spatial, not just text chips. Tie team markets to the real Matin service communities (Lake Oswego, West Linn, Tualatin, Tigard, Sherwood, Wilsonville, Oregon City + WA: Vancouver, Battle Ground, Washougal).
3. **Communities surface / listing locator:** a compact `TerritoryMap` with the 29 real communities + active-listing pins so the brokerage's footprint is visible.
4. **Mobile:** lazy-load (dynamic import, `ssr:false`), fixed aspect on phone, tap-to-expand to full-screen; never block first paint.

---

### G-D. Mobile Excellence — Global Responsive Rules (apply to ALL 12 sections)

Codify these as shared utilities/classes and a checklist every section ticket must pass. The recurring failures across all audits: panes split only at `xl`, tables horizontal-scroll hiding the most important column, KPI strips orphan a tile at 2-up, drawers not full-width, tap targets < 44px, hover-only affordances invisible on touch.

**R1 — Multi-pane → mobile pattern.** Any 2- or 3-pane workspace must (a) split no later than `lg`, and (b) below `lg` use a **segmented pane-switcher** (e.g. `List · Detail · Actions` / `Templates · Preview · Controls` / `Summary · Timeline · Checklist · Docs`) showing ONE pane at a time — NOT a DOM dump where the user scrolls past a 47-row table to reach the detail. Selecting a row in the list jumps to the Detail pane. (Replaces the `xl`-only splits in Today, CRM, Cash-Offer, Listing-Launch, Buyer-Agreements, Transactions, Forms, Marketing, Coaching, Systems-Health, Admin.)

**R2 — Master-detail on phone = slide-over drawer.** Below the split breakpoint, tapping a list row opens the existing `RecordDrawer` as a full-width (`w-full`) slide-over with an immediate visible result — never updates a panel rendered 40 rows down. Standardize all `RecordDrawer`/`*FullDrawer` to `w-full max-w-[440px]` desktop, `w-full` phone.

**R3 — Tables → cards below `lg`.** Any data table with > 3 columns renders as stacked full-width cards under `lg` (avatar + name + score/temperature on line 1; signal + next-action + owner below). Keep the dense table at `lg+`. Add a reusable `responsive` card-mode to `DataTable`. The single most important column (score / next-best-action / attributed $) must be visible without horizontal scroll. (CRM, Transactions, Marketing campaigns, Reports leaderboard, Forms, Systems-Health integration table, Admin routing.)

**R4 — KPI strips.** Never let N tiles orphan one at 2-up. Standard: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-N` OR a horizontal scroll-snap rail on phone for 5–6 tiles. Tighten tile `p-5`→ smaller padding on phone; hide the icon chip `< sm`; show 3 hero tiles + "More metrics" expander where there are 6. No long hint text wrapping to 3 lines.

**R5 — Tap targets & touch affordances.** Every interactive control ≥ 44px on phone (kebabs, View, paginators, send buttons, checkboxes, chips, inline Reset/Ask-Matin). Remove ALL hover-only reveals (`opacity-0 group-hover:opacity-100` Eye icons) on touch — show a persistent chevron/affordance. Add `flex-wrap` to every action-bar row that currently has none (drawer bottom bars, AI-draft action rows, DocumentPreview footers).

**R6 — Tab strips & filters.** Saved-view tab rows and channel tabs become horizontally scrollable (`overflow-x-auto snap`) on phone, never wrap with a broken underline. Search inputs stop being fixed-narrow (`w-32`) in flex-wrap headers.

**R7 — Bottom-bar safe area.** Drawers/toasts must clear the fixed `h-16` mobile tab bar (safe-area bottom padding; raise toast z-index above the nav). Fix the toast/tab-bar `z-40` collision (Admin).

**R8 — Fixed pixel grids.** Replace inline `gridTemplateColumns: repeat(N, ...)` that overrides responsive intent (Reports `SegmentedKpis`) and hard 3-col grids with no breakpoint (Admin `AlertsAutomationGrid`, Coaching workbench) with real responsive Tailwind classes.

Deliver R1–R8 as: a `usePaneSwitcher` hook + `<PaneSwitcher>`, a `DataTable` card-mode prop, a `<KpiStrip responsive>` variant, and a lint/checklist item. Each section ticket references the rule numbers it must satisfy.

---

### G-E. AI Live Wiring + ANTHROPIC_API_KEY

- The app uses `streamAi` (`@anthropic-ai/sdk` installed) and **falls back to canned text when `ANTHROPIC_API_KEY` is unset** (per memory). Today it is NOT set on Vercel, so every "Ask Matin"/draft surface is in fallback.
- **Action:** set `ANTHROPIC_API_KEY` in Vercel project env (Production + Preview) to make AI surfaces live. Until then, **harden the fallbacks** so they read as real: each fallback must merge REAL record fields (buyer name, real listing address, term, real Matin office/BIC policy) and produce realistic OREF/CMA/outreach copy — never lorem/generic filler. Route fallback drafts through `BrandedDocument` so even fallback output is branded.
- Add a tiny status pill (`Matin AI · live` vs `· sample`) so reviewers know which mode is active; never block UI on the key.
- Model id note: this app targets Claude via the Anthropic SDK; keep model ids configurable via env, do not hardcode a deprecated id.

---

## PART 2 — PER-SECTION BUILD TICKETS

Each ticket lists ordered, concrete fixes. All inherit G-A (real data), G-B (branded docs), G-D (R1–R8 mobile), and the KPI-derivation pass. "§n" refers to the build reference.

### S1 — Today Command Center (`/hub`)
1. **Operable queue rows:** add a right-aligned per-row quick-action cluster to `QueueRow` (Call/Text/Email for lead/seller; Approve & draft for AI; Retry for failed) — operable without opening the drawer (BoldTrail 4-button footer). Keep row-click → drawer as deep view.
2. **Derive all 6 KPIs** from the data layer (G-A #7) so they reconcile to rows; add a two-value delta caption to EVERY tile; bind AI overnight summary numbers ("3 deals at risk", "3 failed automations") to `txAtRisk`/`failedWorkflowRuns.length`.
3. **Brokerage Vital Score hero:** import the existing `ScoreRing` (never used on `/hub`) for a composite health ring (speed-to-lead, at-risk %, drafts pending) — the signature premium win.
4. **Real chart:** replace the 8 `ProgressTrack` "Live Pipeline" bars with a recharts stacked/area pipeline chart (current vs prior, dark tooltip, $ total).
5. **Recent-activity feed** in the right rail (reuse `ActivityTimeline` + `activities.json`/`NOTIFICATIONS`): ~6 timestamped events, bold colored event tags, relative-time groups — fills the column to the fold.
6. **Mobile (R1/R3/R4):** on `< xl` render AI summary + Risk Alerts ABOVE the queue; keep thumbnail/avatar visible on phone (drop `hidden sm:block`); 3 hero KPI tiles + "More metrics" expander; queue rows full-width with inline actions.
7. **Branding (G-B):** put the full Matin wordmark on the AI overnight summary header; render client-facing drafts (WQ-006 MLS remarks, WQ-015 email blast) inside `BrandedDocument` letterhead.
8. **Utility row + chips:** add "Showing N" count, sortable due/score, filled `CATEGORY_TONE` chips + channel glyphs for list rhythm.
9. **Data:** verify every `work-queue` `sourceId`/agent slug resolves (G-A #8); swap seeded `PropertyThumb` for real listing photo; back the Brokerage Calendar/RISK_ALERTS rows with transactions/listing data, not hand-authored alerts.

### S2 — CRM & Leads (`/hub/crm`)
1. **Mobile master-detail (R2):** below `xl`, row-tap opens `LeadDetailPanel` as a full-width slide-over `RecordDrawer` (not stacked 47 rows down).
2. **Responsive table (R3):** dense table at `lg+`; stacked cards below `lg` with avatar + name + temperature ring/score on one line.
3. **Real-Geeks row density:** per-row temperature avatar-ring (gold ≥80 / gray cold), promote `ScoreRing` into the row, compact engagement strip (derive Searches/Props/Visits/Favs + "Last Search" string + "Last Active Xm" from real budget/community/propertyViews/lastContactDaysAgo), 6-up quick-action icon cluster.
4. **Real owners (G-A #3):** reassign LD-1999 Daniel Cho + all synthetic-agent leads to real Matin agents with headshots; the default-selected owner must show a real face.
5. **Intent-aware AI cards:** seller/likelySeller → CMA/home-value drafts; buyers → matched-listing sends pulled from REAL `listings.json` (same community+budget), citing real addresses/prices.
6. **Brand the AI draft (G-B):** render streamed text in a Matin message preview + real agent signature; "Approve" produces the branded artifact, not a raw clipboard copy.
7. **Real chart:** rebuild `LeadSourceAnalysis` from hand-rolled flat bars into a recharts chart (already a dep) with value labels, hover tooltip, hot-vs-total split.
8. **Hero value:** surface budget band/LTV as a large gold/ink tabular number under the name (FUB "$1M" pattern).
9. **Real saved-views:** add Portland/Lake Oswego/Beaverton location lists driven by `communitySlug` with live counts (18 real communities unused today).
10. **Secondary desktop band + brand footer:** pipeline-by-stage mini or appointments strip so wide screens aren't empty paper; real Matin office contact + quiet brand mark in panel footer/empty states; pull TopCommandBar notifications from real records.

### S3 — Seller / Cash Offers (`/hub/cash-offer`)
1. **Score intensity gauges:** add Equity/Timeline/Engagement horizontal track bars with a positioned marker + Low/Med/High labels to the `OpportunityDrawer` (Fello "Current Owner Low→High") — the #1 "looks basic" fix; derive from `equityBand()`/timeline/signals.
2. **Home-value sparkline (recharts):** a 12-month estimated-value line beside the drawer hero $; add a per-column net-to-seller mini bar in the comparison matrix so the winner is obvious.
3. **Money-weighted KPIs:** every tile gets a $ sub-stat (e.g. "Likely sellers 1,286 · $912M est. equity") + a 6px ramp; anchor base numbers to a real Matin farm figure (G-A).
4. **Densify kanban card:** estimated-value bar, source chip, last-touch relative time, inline score ring; consider splitting "Human follow-up" into "Offers out" + "Won/Listing" so columns populate.
5. **Mobile matrix (R3/R5):** sticky frozen label column gets OPAQUE bg (`bg-cloud`), horizontal-scroll shadow affordance, smaller column min-width, note editor moved out of `<th>` into a popover; **default to LIST view < lg**, kanban only as desktop default.
6. **Branded intake preview (G-B):** the "Buyer-agent intake" card shows a Matin-wordmark mini-preview of the public offer-submission page; change share domain from fake `matinos.app` to a real Matin host.
7. **Branded outputs (G-B):** home-value outreach in a Matin email shell; Net Sheet gets a Matin "Estimated Seller Net Proceeds" header + waterfall bar + exportable branded PDF via `BrandedDocument`.
8. **Dock a seller-intel AISidecar** beside the record (Rank offers / Schedule consult / Send CMA) with a "Context: 5127 SW Cedar Hills Blvd" line (§1.8).
9. **Data:** verify every `assignedAgent` slug resolves to a real photo; wire real `agent.phone` (drop hardcoded office-line fallback); replace filler buyer entities with plausible Portland-metro names / real cash-buyer partner brands.

### S4 — Listing Launch (`/hub/listing-launch`)
1. **Wire real property photos** (G-A #6): `listingPhoto()` into `ListingRecordCard` header (16:9 hero) AND each `OutputPreviews` card as a mini crop — the single biggest skeleton→product jump.
2. **Fix the fake agent:** reassign 7428 SW Maple Ave from `ava-brooks` to a real agent w/ headshot; render via `Avatar` in header + seller-note signature; replace universal hardcoded "Broker Jordan Matin" with role-derived broker (G-A #2).
3. **4-cell PropertyStats strip** (BED·BATH·SQFT·LOT/YEAR or PRICE/PPSF) + `ScoreRing` for launch readiness % in the header.
4. **Record-drive ALL outputs:** replace hardcoded "Sarah Mitchell"/"disclosure page 4/twilight photo" with text from the selected record's real `blockers[]` + checklist groups; wire each asset status to its checklist group (no "flyer Generated" on an Intake-stage record).
5. **Branded deliverables (G-B):** `BrandedDocument` letterhead for seller email + MLS remarks; build a composed branded **flyer** (hero photo band + logo + price + agent block).
6. **Responsive (R1):** add an `md` breakpoint — phone = record → compact outputs → AI drawer; tablet = 2-col; desktop = 2/5/5. Selector → horizontal chip row/dropdown below `lg`. KPI strip explicit 2/3/6. Stack action-drawer buttons full-width on phone.
7. **Density:** each `ProgressTrack` shows count (6/11), owner avatar, due date, inline next-action; add a launch activity timeline (`ActivityTimeline`) or vendor schedule strip.
8. **Schema-transparency note** (mono "Backend record joins": listings, checklist_items, documents, marketing_assets, ai_actions).
9. **Output-preview cards** → mini visual proxies (flyer hero-crop, carousel stacked-frame, MLS ruled-page, email letterhead) with real status chips; single card-level click target to kill the row of identical black buttons.

### S5 — Buyer Agreements (`/hub/buyer-agreements`)
1. **Rebuild the document (G-B, highest impact):** `BrandedDocument variant="agreement"` — Matin letterhead + `OREF C-565`, a structured field grid bound to LIVE intake values, per-field green checks / red-outline-empty, real C-565 paragraph blocks, branded signature block, `Page 1 of 4`.
2. **Per-field completion checklist** wired to actual form values; clicking a missing item scrolls/focuses that input (replace the 2 static strings in `previewStatus()`).
3. **Responsive grid (R1):** inner builder `grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3`; record list co-exists with 3 columns only at `2xl` (eliminate the cramped 1024–1279px band). Phone: reorder preview → actions → form, or sticky "Send for signature" bar.
4. **Real roster (G-A):** delete the hardcoded `AGENTS` const in `NewAgreementForm.tsx`; source the picker from `agents.json`; tie buyer to a real `leads.json` contact id (truthful "backend record joins").
5. **Ground the data:** representation-area photo = real listing/community image for the named area; surface 1–3 real matched listing addresses/prices in the budget band.
6. **Densify KPI strip:** money sub-stats (signed $ volume, attributed pipeline, avg term); `sm:grid-cols-3 lg:grid-cols-5` to avoid the orphan.
7. **Branded template picker row** (Matin Buyer Agreement / OREF C-565 / Disclosure) as small branded cards above the builder (SkySlope parity).
8. **Automation chain visual:** envelope → activity_event → reminder → notify{agent} → checklist timeline + a branded "what the buyer receives" envelope thumbnail.
9. **Mobile polish (R5):** all `grid-cols-2` intake rows → `grid-cols-1 sm:grid-cols-2`; clause checkboxes/insight chips ≥ 40px; `flex-wrap` on the DocumentPreview footer; cap record-list aside height only at `lg+`.
10. **Expand readiness:** render all `readinessFactors` (not `slice(0,2)`) + a compact radar/bar breakdown alongside `ScoreRing`.

### S6 — Transactions (`/hub/transactions`)
1. **Three-pane compliance review (§2.6):** left doc-tree grouped by requirement (Contract/Disclosures/Contingencies/Financing/Closing) w/ status pills; center branded `BrandedDocument` viewer; right metadata + contacts + AI-risk rail w/ docked Accept/Reject. Replace the 2-up DocCard→narrow-drawer pattern.
2. **Checklist-as-table (SkySlope):** per row a colored status pill, paperclip Docs-attach, inline comment input, state-driven verdict buttons (Attach + Accept/Reject pending; Unaccept when done) + a "+ Add New" row.
3. **8+ field metadata band:** Buyer, Seller, Co-op agent, Lender, Title/Escrow officer, Escrow #, Acceptance date, Close of escrow, $/SF — from real transaction+agent data. **Fix the scripted contradictions:** TX-3999 = Listing/Melissa Grant, TX-3998 = Purchase/Daniel Cho; use a real TC for the coordinator slot, real broker for lead agent (G-A #2).
4. **Branded docs (G-B):** Matin letterhead on `DocumentPreview` (OREF-001, addendum, Closing Disclosure, lender letter) + the AI-drafted repair response; differentiate density by page count.
5. **Contextual deal-action bar** above the checklist (Order Home Warranty / Order NHD / Update Agent / Docs to Review / Generate seller update).
6. **Responsive (R1):** stack the deal screen at `lg` not `xl`; add an in-deal tab nav (Summary · Timeline · Checklist · Docs · Activity) for `< xl`; sticky selected-deal header above the stacked list; remove hover-only Eye reveal (persistent chevron).
7. **Mobile-safe action rows (R5/R7):** `flex-wrap` on AI-draft row, drawer bottom bar, doc-card footers; hit areas ≥ 40px; drawer clears the `h-16` tab bar.
8. **Denser contract-to-close tracker:** per-milestone day-remaining counts, owner/status chip per node, horizontal stage variant.
9. **Enrich KPIs:** count + attributed $ ("Pending docs 14 · $2.1M in play"), mini trend/delta, fix the 5-tile mobile orphan.
10. **Plumbing + branded outbound:** mono "Automation after accept" / "Backend record joins" note; brand the "Send for signature" envelope; Activity channel-filter tabs (All · Docs · Emails · System); real listing imagery keyed to address; verify Accept/Reject styling matches the §1 two-tier hierarchy (green = status, ink = human primary).

### S7 — Forms & Docs (`/hub/forms`)
1. **Real branded OREF/Matin PDF preview (G-B, highest impact):** `BrandedDocument` in both the doc-card grid and the `DocumentDrawer` center pane (letterhead + real legal title + numbered sections + dense paragraph text + labeled fillable rectangles).
2. **Fix ownership (G-A #2):** reassign packet owners to REAL coordinators (Listing/Disclosure → real listing coordinators; Offer/Closing → real TCs; Jordan Matin only on broker-review). Replace the 2 hardcoded `OWNERS` in `NewPacketDrawer` with an `agents.json`-sourced dropdown.
3. **Bind packets to real listings/leads (G-A):** replace invented addresses/clients with real `listings.json`/`leads.json`/`seller-leads.json` records; bind `PropertyThumb` to the real hero photo.
4. **Saved-view pill tabs + utility row:** persistent All/In-progress/Awaiting/Missing/Completed (counts), "Showing N", right-side bulk-action cluster; checkboxes → multi-select → bulk Send/Download/Assign (send a whole packet at once).
5. **Mobile tab switcher (R1):** below `lg`, segmented `List · Documents · Actions` (one pane at a time); full-width drawers; tap targets ≥ 44px; cap pane heights on mobile too.
6. **Wire the orphaned template library:** `FormsLibrary.tsx` + `FormTemplate.tsx` are fully built but imported nowhere — surface `FormsLibrary` as the "Templates" KPI drilldown or a 4th tab (SkySlope-style 3-up template grid w/ form-count badges).
7. **Densify Pane 1 + KPIs:** per-row progress bar (done/total) + doc-count + relative-time; deltas on every KPI tile; doc grid `xl:grid-cols-3`; KPI horizontal-scroll rail on phone.
8. **Branded output artifacts:** Download/PDF renders an actual branded preview (not a toast); "Send for signature" shows a Matin-branded e-sign envelope; seeded docs in `NewPacketDrawer` are branded.

### S8 — Marketing Studio (`/hub/marketing`)
1. **Fix avatars (G-A, highest-impact/smallest change):** remap `CAMPAIGN_OWNER` + the `approvers` array in `marketing-data.ts`/`page.tsx` to REAL agent slugs with photos (instantly replaces gray AB/NP/ML initials).
2. **Real logo on every channel:** replace the hand-rolled "M" boxes in `AssetPreview.tsx` (`MatinFromBar` + Social/Ad/Web headers) with real `<MatinMark/>`/`<Logo/>`; add a real brand-kit footer (logo + "Equal Housing Opportunity" + real West Linn office line from `company.json`).
3. **Real listing binding:** point `STUDIO_LISTING` + all `PropertyThumb`s at a REAL `listings.json` listing (real address/price/photo).
4. **Build the missing chart (biggest density win):** recharts campaign-performance bar chart (Opens/Clicks/Replies/Leads) with a decomposing dark tooltip (§2.8), above/beside the campaigns table.
5. **Real branded flyer (G-B):** logo header + listing photo + spec block + real agent footer + QR + Equal-Housing logo at print proportion; make the "brand frame + logo lockup" caption TRUE by actually overlaying the frame.
6. **Working email composer (BoldTrail):** rich-text toolbar row, To: recipient pill, "Search templates", visible merge tokens (`{{first_name}}`,`{{address}}`), inline "Use Matin AI" button.
7. **Sequence/automation builder (§2.8):** a node/connector flow (Trigger → AI draft → Approval → Email → Wait 3d → Follow-up) with solid=committed / dashed=pending connectors + step rail + green "Active" pill + date-range/granularity dropdowns.
8. **Mobile (R1/R3/R5):** three panes → mobile pane-switcher (Templates · Preview · Controls) `< xl`; channel tab strip horizontally scrollable; campaigns table → mobile cards (keep Campaign + Status + Attributed $); 44px tap targets.
9. **Per-asset email telemetry:** delivered/opened/clicked counters + an "Email has not been opened — View" tile.
10. **Real audience binding:** tie `AUDIENCE_REACH` to real CRM segment counts from leads/seller-leads; surface a segment-composition breakdown by source.

### S9 — Coaching (`/hub/coaching`)
1. **Sisu-style ROI leaderboard (biggest fidelity win):** add real money/outcome columns (Closings this qtr, Conversion %, GCI) and **color the value TEXT itself** (green good / red below-target); drop the gold avg-score chip for a colored tabular number; tall open-ledger rows + big Fraunces "Team Coaching ROI" title.
2. **Real data module:** create `src/lib/data/coaching-scorecards.json` (per-agent practiceSessions, rubric{empathy,pricing,close,crm,speed}, lastAttempt, managerReviewDue, conversionLift) consumed by KPIs + leaderboard — replace all `homesSold % 22` formulas; drop the magic `+2` on reviewsDue.
3. **Consolidate the 3 scenario datasets** (`coaching-scenarios.json` + `scenarios.ts` + inline `SEEDS`) into ONE source; bind persona context to real `listings.json` addresses/communities.
4. **Real per-agent pacing chart (recharts):** team practice/conversion over the quarter (current vs prior); per-agent pacing bars that flip success→danger when behind (§2.9).
5. **Saved-view pill tabs** (All / Behind pace / Top performers / Reviews due) via `DataTable.savedViews` + a rank column + ▲▼ delta-vs-last-quarter.
6. **Responsive workbench (R1/R8):** `lg:grid-cols-[260px_1fr_330px]` → md two-column + lg three-column; KPI strip `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`; shorten hints.
7. **Mobile tap targets (R5):** composer send + inline Reset/Ask-Matin ≥ 44px; wrap-guard persona strip; full-width `RecordDrawer`; wrap hero score row.
8. **Branded coaching plan (G-B):** render the auto-created plan as a Matin-letterhead `BrandedDocument` (logo + agent + West Linn office + date + manager sign-off line); quiet Matin wordmark footer on the Scorecard.
9. **Per-pane count/summary stats** in the three workbench headers ("7 broker-approved drills", "Attempt 3 · last scored 2d ago", score badge).
10. **Real KPI deltas** (+N vs last quarter, ▲/▼, colored) replacing filler "this quarter"/"all-time".

### S10 — Reports & Accountability (`/hub/reporting`)
1. **Fix `SegmentedKpis` mobile overflow (R8, highest-impact/smallest):** remove the inline `gridTemplateColumns`; use `grid-cols-2` mobile, `sm:grid-cols-4`+.
2. **Real recent closings (G-A):** replace the 4 hardcoded addresses with the 4 real "Sold" listings; `PropertyThumb` src = real `listing.photos[0]`.
3. **Swap synthetic `ava-brooks`** out of `report-metrics.json` `agentLeaderboard` for a real agent with a photo (all 8 rows must show real faces).
4. **Branded export (G-B, top branding gap):** an "Export report" action producing a Matin-letterhead PDF (wordmark + West Linn office + phone + date-range/team/source scope + scorecard + leaderboard + source-ROI). Add `@media print` fallback.
5. **Per-row data-viz on the leaderboard:** a per-row GCI bar OR a Lofty stacked Leads/Appts/Signed activity bar; mobile stacked-card fallback.
6. **Sisu "Team ROI by Lead Source" card:** clean 3-col SOURCE | ROI% (bold green) | COST/LEAD (bold red), large type, uppercase letterspaced headers; rename "Facebook Ads" → "Meta".
7. **Dataset tab strip** (Overview / Performance Table / Funnel Table) + a metric toggle (Volume/Closings/GCI/Revenue) on `TimeSeriesChart`.
8. **Hero activity card:** 3–4 circular donut gauges (Calls/Emails/Texts/Appts set from real scorecard data).
9. **Hero financial strip:** taller band, ~2.4–2.8rem numerals, `$` glyph prefix, a Revenue/Net cell, colored ▲/▼ vs-prior in every cell.
10. **Mobile polish (R6):** collapse filter chip row; shorten "Ask Matin why this changed" → "Ask Matin" `< sm`; reduce `TimeSeriesChart` x-tick count on phone; 2-line mobile layout for SourceRoiPanel/FunnelRamp/PipelineRamp; iOS safe-area padding on the drawer action bar.

### S11 — Systems Health (`/hub/systems-health`)
1. **Real vendor logos (biggest skeleton tell):** replace the 2-letter gray tokens with real vendor marks (Follow Up Boss, Lofty, Sierra Interactive, RMLS/NWMLS, SkySlope, Dotloop, DocuSign, Meta, Google, SendGrid, OpenAI, Anthropic, Gemini, Make, n8n, Zapier, Supabase, Airtable, Twilio, QuickBooks) at ~24–28px in a white chip + status dot; use the Matin mark for the owned "MatinRealEstate.com IDX" connector.
2. **Node/edge data-flow diagram (§2.11):** SOURCES (Zillow/Meta/IDX/RMLS) → MatinOS core (Matin mark) → SYSTEMS (CRM/Transactions/Marketing/AI), curved SVG connectors green=healthy/red=failing, as the left-column hero.
3. **Real time-series chart (Lofty):** "Sync & error activity (last 7 days)" area/line (successful vs failed runs) with a dark hover tooltip; reuse the Reports chart lib — no more flat bars.
4. **KPI trend deltas + mini-sparklines;** derive "Last sync" from the freshest connector `lastSync` (not the hardcoded "2 min").
5. **Usage/quota card upgrade:** interval line behind each quota + thin bar that goes red at ≥ 90%.
6. **Matin branding:** render the wordmark in a compact section lockup + a grounding context line from `company.json` ("Matin Real Estate · West Linn, OR · 40 agents · primary store: Supabase Postgres").
7. **Branded-doc thumbnail in `WorkflowRunDrawer`** for doc-producing runs — especially the FAILED "Render branded PDF" (WR-007): show a Matin-letterhead CMA preview via `BrandedDocument`.
8. **Mobile (R4/R1):** fix the 5-tile 2+2+1 orphan (scroll-snap rail); move the left/right split to `lg` (float the Ask-Matin panel up on mobile); collapse the integration table to stacked cards `< sm`; truncate the run step-trail to "step1 → step2 → +4" on phone instead of wrapping 4 lines.
9. **Densify the right rail:** recent-audit-log feed (writes → workflow_runs/ai_actions/audit_logs) + per-connector latency mini-list.
10. **Visual hierarchy:** data-quality list gets a colored left-border-by-severity + a flagged-vs-total proportion bar per rule; each section leads with its hero metric.

### S12 — Admin / Settings (`/hub/settings`)
1. **Fix the logo asset bug FIRST (G-B blocker):** replace `/matin/brand/logo-268-...jpg` (a Willamette Valley MLS logo) with a real dark Matin wordmark; verify `Logo.tsx` light/dark mappings. Nothing branded ships until correct.
2. **Replace ALL invented operators (G-A):** purge Ava Brooks/Marcus Lee/Nina Patel/Evan Carter/Taylor Reed/Priya Shah from `adminData.ts`; rebuild `ALL_AGENTS`, `userRows`, `teamRows` leads, routing members, ownership from the 40 real agents + real titles so no `slugForName` gray-initials fallback ever appears.
3. **Rebuild `BrandKitView`:** render the real Matin wordmark (white-on-dark + dark-on-light lockups) + M-mark; add the gold AI-accent tokens (#b8924a/#d2a050/#f0e6d2) to the swatch grid; add a Matin-letterhead document preview + a branded email-header preview.
4. **Responsive `AlertsAutomationGrid` (R8):** add `md:` so the hard 3-col grid stacks to 1 column under md; add a "fired N× / 7d" or last-triggered stat per row.
5. **Routing table → stacked cards `< 640px` (R3):** source + criteria chips + overlapping member avatars + a single kebab (Edit/Clone/Delete/Pause); 44px action targets.
6. **Labeled criteria chips** (Price: $600k+ / Type: Buyer / Area: Portland Metro) instead of plain stacked sentences (BoldTrail density).
7. **Live recipient/priority editor** in the right column for the selected rule (Agent vs Entire Office segmented + weighted ordered list), replacing the filler "routing engine health"/SLA cards; keep the AiPanel below; add the `TerritoryMap` (G-C) beside the routing table.
8. **Wire `onDrill` on all 5 KPI tiles** to switch `AdminWorkspace` category+filter (no dead cosmetic counts).
9. **"Leads routed (30d)" horizontal-bar mini-chart** under the routing table using existing `leadsRouted30d` (184/96/41/58/33/0).
10. **Rebuild the Templates preview** from 5 gray skeleton bars into a `BrandedDocument` (letterhead + ruled lines + boxed signature field + green completion checks + Page X of N).
11. **Mobile nav (R1):** category sidebar → horizontal scrollable pill row/select `< lg`; add missing count badges to Brand Kit + Audit Log.
12. **Toast above the tab bar (R7):** raise/offset the confirmation toast above the 64px mobile tab bar + bump z-index; Brand Kit `grid-cols-5` → responsive `grid-cols-2/3` so hex labels stop clipping.

---

## PART 3 — RECOMMENDED PARALLEL-AGENT EXECUTION ORDER

**Wave 0 — Foundations (BLOCKING; merge before any section work).** 3 agents, run in parallel, then merge:
- **Agent A — Real data (G-A):** reconcile `agents.json`, build `roles.ts` + `agent-remap.ts` + `listing-photo.ts` + `derive.ts`, merge `locations/communities/listings`, run the remap codemod, write `scripts/verify-data-refs.mjs`. **Gate:** `grep` for the 4 fake slugs = 0; verify script passes.
- **Agent B — Branded document system (G-B):** fix the Logo asset bug (also unblocks S12), build `BrandedDocument.tsx` + all variants (letter/agreement/flyer/email/netsheet/report) + print/download. **Gate:** a storybook/demo route renders each variant with real `company.json` data.
- **Agent C — Mobile primitives + Map (G-D + G-C):** ship `<PaneSwitcher>`/`usePaneSwitcher`, `DataTable` card-mode, `<KpiStrip responsive>`, the R1–R8 checklist, and `TerritoryMap.tsx`. **Gate:** primitives demoed at 360px.

**Wave 0.5 — AI wiring (G-E):** set `ANTHROPIC_API_KEY` on Vercel + harden fallbacks. Small; can ride alongside Wave 0.

**Wave 1 — Section build-out (12 sections in parallel across ~6 agents, 2 sections each).** All inherit Wave-0 primitives. Pair by surface similarity to share context:
- **Agent 1:** S1 Today + S2 CRM (queue/lead density, mobile master-detail, real charts).
- **Agent 2:** S3 Cash-Offer + S4 Listing-Launch (photos, score gauges, branded outputs).
- **Agent 3:** S5 Buyer-Agreements + S7 Forms (the BrandedDocument-heavy pair; share the doc rebuild).
- **Agent 4:** S6 Transactions + S11 Systems-Health (three-pane review, vendor logos, flow diagram, charts).
- **Agent 5:** S8 Marketing + S10 Reports (recharts-heavy: campaign chart, ROI scoreboard, branded export).
- **Agent 6:** S9 Coaching + S12 Admin (real data modules, Sisu scoreboard, BrandKit rebuild, TerritoryMap wiring).

**Sequencing rules:**
1. No Wave-1 agent starts before Wave-0 A+B+C are merged (they all import the shared primitives/data).
2. Agent 3 owns the canonical `BrandedDocument` agreement/forms density; Agents 1/2/4/5/6 consume it read-only — no parallel forks of the doc component.
3. Each section ticket is "done" only when it passes the R1–R8 mobile checklist (verify at 360/768/1280px), shows zero gray-initials avatars, zero seeded-stock photos on real listings, zero hardcoded KPIs (all bound to `derive.ts`), and renders client-facing output through `BrandedDocument`.

**Wave 2 — Integration & polish.** One agent runs `verify-data-refs.mjs` + a cross-section reconciliation pass (a listing/lead/agent referenced in CRM must resolve identically in Listings/Transactions/Forms), a full mobile sweep, and a Vercel deploy verification (confirm READY, not assumed — per the build-ceiling/deploy-freeze lessons).

---
