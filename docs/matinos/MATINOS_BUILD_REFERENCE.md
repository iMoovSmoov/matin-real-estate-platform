# MatinOS Build Reference — Single Source of Truth

> **Authority note.** This document is the authoritative visual + structural build reference for MatinOS, synthesized from production-UI teardowns of 11 top brokerage SaaS tools (Follow Up Boss, Lofty, BoldTrail, Sierra Interactive, Fello, SkySlope, Real Geeks, MoxiWorks, Structurely, Sisu) plus the 12 MatinOS custom wireframes. It is consistent with — and the visual layer on top of — the existing source specs in `docs/matinos/source/` (component names, data objects, API contracts, schema). When this doc and a `source/NN_*.md` file overlap, **this doc wins on look/feel/layout; the source file wins on data objects, API routes, and acceptance criteria.** 12 parallel build agents follow this. Do not invent new patterns — compose the ones defined here.

**Stack constraint (read first):** This is a modified Next.js where APIs/conventions may differ from training data — per `AGENTS.md`, read the relevant guide in `node_modules/next/dist/docs/` before writing route/layout code. Tokens live in `src/app/globals.css` (Tailwind v4 `@theme`).

---

## PART 1 — GLOBAL DESIGN LANGUAGE

### 1.0 Design thesis (the one-paragraph north star)

MatinOS is a **dense, calm, premium operator workspace** — a charcoal-railed command center, not a generic admin dashboard and not a marketing page. Every real tool we studied converges on the same spine: a **dark sidebar + light high-density workspace + optional right drawer**, with **one rationed accent color reserved for active-state and AI**, **status carried by color-on-the-number / chips / dots**, and **AI docked beside real records as evidence-backed proposed actions, never a separate chatbot toy**. We render that spine in Matin's monochrome-luxe brand (ink/paper/Fraunces) and ration **gold strictly to AI affordances**.

### 1.1 The color system (resolve the brand tension — READ CAREFULLY)

The **marketing site** (`matin-realestate.vercel.app`) is strict monochrome luxe: *no brown, no gold, no blue* (per `globals.css` header). **MatinOS is a separate app surface** and is allowed ONE additional disciplined accent — **gold** — used the way Follow Up Boss uses blue and Lofty uses indigo: **only for active states and AI**. This does not pollute the marketing palette; it lives in the `(app)` route group.

Reuse the existing `@theme` tokens. Add the MatinOS app-accent layer:

```css
/* EXISTING repo tokens — reuse verbatim */
--color-ink: #060606;        /* primary text, dark sidebar, +Create button, dark callout cards */
--color-ink-900: #0d0d0e;    /* sidebar base / dark AI panel base */
--color-ink-800: #161617;    /* dark card surface */
--color-ink-700: #232325;    /* dark card border / hairline on dark */
--color-ink-600: #34343a;
--color-ink-500: #5a5a64;    /* muted icon on dark */
--color-paper: #f6f6f5;      /* workspace canvas (warm off-white) */
--color-paper-200: #ececeb;  /* nested panel / table header fill */
--color-mist: #dededc;       /* hairline dividers on light */
--color-cloud: #ffffff;      /* card surface */
--color-slate: #62626a;      /* secondary/muted text on light */
--color-slate-300: #c3c3c9;  /* muted text on dark */
--color-success: #56a07d;    /* good / complete / up / on-pace / connected */
--color-danger:  #c0584a;    /* bad / overdue / failed / cost / down / at-risk */
--color-warn:    #c1934a;    /* in-progress / attention / pending */
--color-info:    #7b818a;    /* neutral / scheduled */
--font-display: var(--font-fraunces) ...;  /* H1/H2/H3 section titles only */
--font-sans:    var(--font-inter) ...;      /* ALL body, labels, data, numbers */
--font-mono:    var(--font-geist-mono) ...; /* schema notes, IDs, code, $ tabular */

/* ADD — MatinOS app accent (gold), scoped to the (app) route group only */
--color-gold:        #b8924a;  /* THE accent. Ask AI, Run, active nav pill underline-or-fill, AI Assist pill */
--color-gold-bright: #d2a050;  /* gold hover / score-ring fill */
--color-gold-soft:   #f0e6d2;  /* pale gold chip fill (AI-handled tag, score chip bg) */
--color-gold-ink:    #5c4a24;  /* text on pale-gold chips */
```

**Accent discipline (non-negotiable, the #1 thing that makes it look real):**
- **Gold appears ONLY on:** the `Ask AI` button, AI `Run`/`Approve` buttons, the persistent `AI Assist: Ready` sidebar pill, the AI sidecar accent rail, the AI "Coach" label, and score rings/score chips. Nothing decorative. (Mirrors FUB-blue / Lofty-indigo / BoldTrail-magenta restraint — they reserve their one hue exclusively for active affordances.)
- **`+Create` and primary non-AI buttons are `--color-ink` (near-black) filled**, not gold. Gold = AI; ink = primary human action. This two-tier hierarchy (BoldTrail/Real Geeks model) is load-bearing.
- **Active nav item** = solid white/`--color-cloud` rounded pill with ink text on the charcoal rail (wireframe 01/02 spec). Inactive = `--color-slate-300` text.

**Status color language (identical app-wide — define once, reuse everywhere):**

| Meaning | Token | Used as |
|---|---|---|
| Good / complete / up / connected / on-pace | `--color-success` #56a07d | chip fill-tint, dot, progress fill, ▲ delta, score-bar, the *number itself* (Sisu) |
| Bad / overdue / failed / at-risk / cost / down | `--color-danger` #c0584a | chip, dot, ▼ delta, red-outline empty checkbox, the *cost number* (Sisu), risk pill |
| In-progress / pending / needs-action / mid | `--color-warn` / gold-family | partial progress bar, "needs initials" chip, mid score-bar |
| Scheduled / neutral / informational | `--color-info` #7b818a | "Scheduled" pill, neutral chips, default dots |
| Terminal (Closing/Won) | `--color-ink` #060606 | final milestone node, black pill |

> **Color-as-data rule (steal from Sisu):** for scoreboard/ROI numbers, **color the metric VALUE text itself** green (good) or red (cost/bad) — *no badge, no background fill*. This single move turns any table into an accountability scoreboard.

### 1.2 Typography rules

- **Fraunces (display)** — section H1/H2/H3 titles ONLY (e.g. "Today Command Center", card titles like "Human Work Queue"). Weight 400, `letter-spacing: -0.01em`. Validated by SkySlope's editorial-serif-title + sans-body pairing.
- **Inter (sans)** — *everything else*: body, labels, table data, **all numbers/KPIs**, buttons, chips. KPI numerals are Inter, not Fraunces (numbers must be tabular and tight).
- **Eyebrow / column headers** — Inter, `0.72rem`, `font-weight:600`, `letter-spacing:0.26em`, UPPERCASE, `--color-slate` (use the existing `.eyebrow` class). This is the Sisu/MoxiWorks/Lofty small-caps letterspaced micro-label.
- **Type scale carries hierarchy, not color** (Structurely rule): KPI number ~28–32px/700, label ~12px/500 `--color-slate`, meta ~11px/400 `--color-slate`. Big number dominates; supporting text recedes in gray.
- **Tabular numerals** for all metrics/money: `font-variant-numeric: tabular-nums`.

### 1.3 App-shell structure (build ONCE, reuse on EVERY route)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ TOP COMMAND BAR  (sticky, h≈64px, paper bg, bottom hairline --color-mist)   │
│  [Page H1 — Fraunces]            [search pill ⌘K] [+Create ◼ink] [Ask AI ◆gold] [🔔] │
├──────────────┬──────────────────────────────────────────────┬──────────────┤
│ SIDEBAR      │ MAIN WORKSPACE  (canvas --color-paper)         │ RIGHT DRAWER │
│ ~280px fixed │  ┌─ KPI STRIP (5–6 tiles, one row) ─────────┐ │ (optional,   │
│ --color-ink-900 │  └────────────────────────────────────────┘ │  360–440px)  │
│              │  ┌─ FILTER / SAVED-VIEW PILL TABS ──────────┐ │ record OR    │
│ MATIN        │  └────────────────────────────────────────┘ │ AI sidecar   │
│ Brokerage OS │  ┌─ PRIMARY WORK SURFACE ───────────────────┐ │ (dark if AI) │
│              │  │  table | kanban | timeline | checklist   │ │              │
│ ◻ Today      │  │  + secondary panels                      │ │              │
│ ◻ CRM&Leads  │  └────────────────────────────────────────┘ │              │
│ … (11 items) │                                              │              │
│ ──divider──  │                                              │              │
│ ◻ Admin      │                                              │              │
│ Role·Team    │                                              │              │
│ ◆AI Assist:Ready                                            │              │
└──────────────┴──────────────────────────────────────────────┴──────────────┘
```

**Sidebar (`SidebarNav`)** — fixed full-height, `--color-ink-900` (near-black ~#0d0d0e), ~280px desktop / collapsible to a ~64px icon rail (Structurely/MoxiWorks collapse pattern; bottom-pinned items keep their own box).
- **Brand block top:** quiet wordmark — `MATIN` (Inter bold caps, white) over `Brokerage OS` (smaller, `--color-slate-300`). No loud logo (wireframe 02: "keep premium and quiet").
- **Nav order (canonical, wireframe 02 — do not reorder):** Today · CRM & Leads · Seller / Cash Offers · Listing Launch · Buyer Agreements · Transactions · Forms & Docs · Marketing Studio · Coaching · Reports · Systems Health — then a **divider** — then **Admin** (de-emphasized below the line).
- **Active state:** solid white rounded pill, ink text. Inactive: `--color-slate-300` text, no fill. Hover: subtle white 6% wash.
- **Bottom block:** `Role: Leadership · Team: Oregon` context line (filters the SAME records into agent/TC/leadership default views) + the gold-outline **`AI Assist: Ready`** pill.

**Top command bar (`TopCommandBar`)** — sticky, on every page:
- Left: page **H1 (Fraunces)**.
- Right cluster (in order): rounded **search pill** (`--color-paper-200` fill, magnifier glyph, inline `⌘K` shortcut chip — Structurely), near-black **`+ Create`** pill (ink fill, white text), **`Ask AI`** pill (gold fill `--color-gold`, ink text), notification **🔔** with red count badge (BoldTrail). Some pages add page-scoped filters between H1 and the cluster.

**Right drawer (`RecordDrawer` / `AISidecar`)** — slides over the right ~32–40% of the workspace; row-click opens drawer, NOT a full-page nav (interaction standard). Two flavors:
- **Record drawer** = LIGHT (white card). Dark header bar with title + ✕ (Follow Up Boss "Lead Details" pattern), internal tab strip (Info/Comms/Notes/Tasks/Plans-style), scrolling activity timeline, bottom action bar.
- **AI sidecar** = DARK (`--color-ink-800` panel). See §1.8.

**Density:** medium-airy in lists (tall rows ~64–72px with large avatars where leads are the unit — FUB/Real Geeks) BUT high-density in operator tables/timelines/checklists. Card radius `--radius` (10px) / `--radius-lg` (16px) for KPI tiles; `--shadow-soft`; hairline borders `--color-mist`. Outer page padding ~24–32px; card gutters ~16–20px; card padding ~20–24px.

### 1.4 KPI strip anatomy (`KpiCard` — the most reused atom)

Standard across Today, Reports, every section header, and campaign/automation detail. Two valid renders:

**(A) Separate tiles (default for section KPI rows):** a single row of 5–6 **equal white rounded cards** (`--color-cloud`, `--radius-lg`, 1px `--color-mist`, ~16–20px padding). Each tile stacks:
1. small status icon + **label** (Inter ~12px, `--color-slate`, may be uppercase-tracked),
2. **big value** (Inter ~28–32px/700, ink; money number colored `--color-success` if it's *revenue/positive money*),
3. **delta caption** (~11px `--color-slate`) — supports two-value breakdowns, not just %: `+25% vs yesterday`, `Yes 28 · No 6`, `4 answered · 2 missed`. (Structurely/Lofty.)

**(B) Segmented single card (Lofty/Fello/SkySlope style):** ONE bordered card divided into N equal cells by thin vertical rules — same label/number/sub-stat per cell. Use for tight financial strips (Volume | Closings | GCI | Revenue). **Revenue/money metric green; others ink.**

Every KPI tile **drills down** to its source records (acceptance criterion: "KPI cards match underlying report queries"). A money-weighted KPI may pair a count + attributed $ in one cell: `Real Sellers (154) · $85,450,000` (Fello) to prove ROI.

### 1.5 Table anatomy (`DataTable`)

The workhorse for CRM, Forms, Reports, Admin, offer lists. Recipe (Lofty listings grid + Sierra two-line rows + FUB):
- **Utility row above header:** `Showing N` + filter funnel (left); bulk-action buttons + export/trash (right). Bulk actions appear only when rows are selected → contextual set (Compare / Share / Assign / Message — SkySlope).
- **Saved-view pill tabs above the table** (FUB): `Label (count)` — `All People (127)`, `Hot (2)`, `New today`, `Needs call`, `Unassigned`. Active = ink fill or ink underline; counts in lighter gray. This is the primary list filter on every list surface.
- **Header row:** checkbox | columns with **sortable up/down carets**, labels in `.eyebrow` style, hairline divider beneath.
- **Data row** (the canonical CRM/listing row): `[checkbox] + [avatar OR colored status dot] + [two-line primary cell: bold name + muted sub-line] + [domain columns] + [right-aligned status/score] + [trailing icon-action cluster: send/open/⋯ or 6-up quick actions]`. Owner shown as **circular initials token** (JL/AG) inside dense cells, not a full avatar+name column (FUB).
- **Status per row:** colored dot (4-color: green active / warn pending / danger issue / info new — Sierra/Lofty) and/or score in a pale-gold chip.
- **Metric-with-delta cell:** value + a colored secondary line beneath (`▼ -5%` red / `▲ +10%` green) — Lofty price-delta.
- No zebra striping, no vertical gridlines — open ledger rhythm, full-width hairlines only (Sisu).
- **Provenance:** `Last Updated [date] by [person]` and `Enrolled via • Source` (source bolded) where relevant (BoldTrail/Structurely).

### 1.6 Kanban anatomy (`KanbanBoard`)

For Seller/Cash Offers and listing pipelines (BoldTrail/wireframe 06). Columns = stages with a `Stage (count)` header; cards flow left→right. **Card formula:** bold signal/action title + entity name + a **pale-gold score chip** (`--color-gold-soft` fill, `--color-gold-ink` text) e.g. `92 score`. Columns visually separate **AI-automated stages** (e.g. "AI nurture") from **human stages** ("Human follow-up"). Optionally append a **dark "Backend logic" column** (`--color-ink-800`, light text) listing scoring inputs + a mono list of DB tables — makes the system feel transparent (wireframe 06). Drag between columns that triggers automation opens a **confirmation drawer** (interaction standard).

### 1.7 Activity-feed / timeline anatomy (`ActivityTimeline`)

Two forms, both color-coded by event type:
- **Feed rows** (Structurely/Lofty/Real Geeks): `[leading channel/status glyph] + [bold name] + [color-coded event tag] + [gray actor/meta] + [right-aligned relative timestamp]`, hairline-separated, grouped by **relative-time headers** (`Now`, `7 Minutes Ago`, `TODAY`). **Channel-typed left icons** encode call/text/email/system without text labels (FUB). Visually distinguish **"Automated Email Sent" (system/AI)** from **"Email Received" (human)** — critical for AI transparency.
- **Vertical milestone timeline** (Transactions — wireframe 09): connecting line + **colored node dots** + bold milestone + date. Node colors use the status palette; **terminal node (Closing) = ink/black**. "Date-driven and audit-friendly."

Event tags use inline color text (green success / red failure / warn appointment), not heavy badge chips, to stay compact (Structurely).

### 1.8 AI surfaces — sidecar, action card, dark callout (the differentiator)

**AI is a docked SIDECAR beside the real record — NEVER a separate page** (wireframe 05 is explicit). Visual law: **AI/system surfaces are DARK** (`--color-ink-800`/`-900`, light text) docked beside the **LIGHT** workspace record — strong figure/ground. This dark-card language is reused for: the AI sidecar, "AI overnight summary", "AI Risk Note", the kanban "Backend logic" column, and the coaching "Coach" bubble. **Light cards = data; dark cards = AI/system commentary.**

**`AISidecar`** (dark panel) contains:
1. Header: `Matin AI` + a **`Context:` line binding it to the current record** (`Context: Listing Launch / 7428 SW Maple`).
2. Chat with **citations** (which source events/fields were used). User bubble darker, AI reply lighter on the dark panel.
3. **`Proposed actions`** list — each = **`AIActionCard`**.

**`AIActionCard`** anatomy (the must-build AI unit):
```
┌─ AI ACTION CARD (on dark panel) ───────────────────────────┐
│ [bold action title]                      [risk tag, muted] │  risk tag ∈ {Approval required | Ready | Auto-safe}
│ Evidence: short plain-English why + cited fields/events     │  (Fello "Has 6.5% ARM, expires 2yr" style)
│ Confidence/quality signal (e.g. ●●●○ or "High")            │
│ [✎ Edit]  [✕ Reject]              [ ◆ Run / Approve ]gold  │
└────────────────────────────────────────────────────────────┘
```
- **Gold `Run`/`Approve`** is the only saturated element — signals "AI-executable."
- **Approval-gated:** AI drafts → human approves. AI output **never silently overwrites** human content; save as draft/version (interaction standard). Human approval REQUIRED for client-facing messages, legal docs, broker/compliance changes, irreversible workflows.
- Every AI output carries: source record, evidence/citations, confidence signal, approval state, audit trail (shared backend rule → writes to `ai_actions`).
- AI can pre-seed a **Notes/draft textarea** so the human edits rather than starts blank (Real Geeks call-log → AI summary hook).

**Dark callout card** (standalone, not full sidecar): a `--color-ink-800` block with light text for overnight summaries / risk notes — e.g. "Inspection period expires in 2 days. Email thread mentions roof concern but no addendum exists. Suggest drafting inspection response." Always ends with a suggested action.

**AI score visualizations** (Lofty/Fello): a **0–100 circular score ring** (gold arc on neutral track, centered number) for lead/seller-intent priority; a **radar/spider chart** for multi-dimensional lead score (Home Price, Timeline, Contact Validity, Interaction, Web Activity) with lead-vs-benchmark overlay; **AI insight chips** (pale-gold pill + leading icon + plain-English derived fact).

### 1.9 Drawer anatomy (`RecordDrawer`)

Right-side, light. Dark header (title + ✕). Body: identity summary (avatar/name + hero value/score), internal **tab strip** (Info/Comms/Notes/Tasks/Plans or All/Calls/Texts/Emails/Docs), scrolling **activity timeline**, bottom **action bar** of compact buttons (Call dark-filled primary + Text/Email/Schedule/Assign light pills). Row-click opens it; never navigate away for routine inspection.

### 1.10 Other reusable primitives

- **Status pill / chip:** rounded; solid-fill for urgency states (Transactions: `2 days left` rust / `Scheduled` blue / `Clear` green), pale-fill for scores/automation-state (green=complete/ready, gray=pending/scheduled). Lifecycle taxonomy (BoldTrail): Active Lead/Client/Closed/Contract/New Lead/Prospect/Sphere/Archived, each a semantic dot color.
- **Progress bars:** labeled horizontal bar + right-aligned % (green=done, gold/warn=partial) for multi-step records (Listing Launch checklist, AI sidecar). Goal-pacing bar layers **actual fill + dashed "Pace" marker + dashed "Forecast" marker** + sentence-status headline (Lofty signature → Coaching/Reports).
- **Checklist row:** numbered item + colored status pill + paperclip attach + inline comment input + **state-driven action buttons** (Accept/Reject when pending, Unaccept when done) + `+ Add New` (SkySlope). Or checkbox form: green-check done vs **red-outline empty** outstanding (wireframe 09).
- **Document preview (`DocumentPreview`):** ruled placeholder lines + a literal boxed **signature field** + green completion checkmarks + `Page X of N` paginator + action stack (Preview/Download/Print/Send for signature). "Click to inspect missing fields" surfaces exactly what's incomplete and where (`needs initials · page 4`).
- **Comparison matrix (Offers):** frozen left attribute-label column + repeating per-offer value columns; each offer column header = big price + agent + favorite flag + per-column `Accept`/`Add Notes`; carousel arrows page across.
- **Empty states are ACTIONABLE:** headline + one-line explainer + the exact tool to resolve (e.g. copyable share link + Copy + Share via Email). Never a decorative spot illustration alone.
- **Schema/automation transparency notes:** monospace bordered notes — `Record data AI can use`, `Backend record joins` (`contacts > saved_searches > tasks + agreements`), `Automation after send` (envelope + CRM log + reminder + notify + checklist update). These make it feel like real software, not a mock.

### 1.11 Spacing / density quick-reference

| Element | Value |
|---|---|
| Page padding | 24–32px |
| Card padding | 20–24px |
| Card gutters | 16–20px |
| Card radius | 10px (cards) / 16px (KPI tiles, drawers) |
| List/table row | 56–72px (taller where a lead is the unit) |
| Timeline row | 44–56px |
| Hairline | 1px `--color-mist` (light) / `--color-ink-700` (dark) |
| Shadow | `--shadow-soft` cards, `--shadow-lift` drawers/popovers |
| KPI number | 28–32px / 700 / tabular |
| Label | 12px / 500 / `--color-slate` |

---

## PART 2 — PER-SECTION BUILD GUIDE

> Each section uses the **same shell** (§1.3) and **same primitives** (§1.4–1.10). Below: competitor patterns to apply, exact layout, KPI strip, primary surface, AI behavior, must-have realism details. Data objects / API routes / acceptance criteria are in the matching `docs/matinos/source/NN_*.md` — honor those.

### 2.1 Today Command Center  → `app/(app)/today`
- **Apply:** BoldTrail behavior-driven activity feed + floating Vital-score KPI; Structurely 3-band skeleton (command bar → 6 KPI → 58/42 split); MoxiWorks tile-grid; wireframe 01.
- **KPI strip (5–6):** New leads `47` · Hot seller signals `12` · Listing launches `8` · Transactions at risk `3` (danger) · AI drafts waiting · Workflow errors. Include the risk metrics in `--color-danger`.
- **Primary surface:** **`Human Work Queue` table** — sub: "Only tasks requiring human judgment; automation handles the rest." Rows = leftmost colored category chip (Call/Review/Approve/Coach/Send) + lead/listing name + one-line "why" + right-aligned time. Tabs: My Work / Team / High Risk / AI Drafts / Failed Automations.
- **Right rail / below:** **dark `AI overnight summary` callout** ("Grouped 181 lead events into 22 priorities, drafted 14 replies…"); `Live Pipeline` stacked labeled bars; `Brokerage Calendar + Risk Alerts` (dot + bold title + date).
- **AI:** prioritizes the queue, explains why a task is urgent, drafts the response for a selected item; failed workflows are **retryable from the row**.
- **Realism musts:** every queue item links to a source record; KPI numbers reconcile to report queries; one gold "next-best-action"/Ask-AI emphasis tile max.

### 2.2 CRM & Leads  → `app/(app)/leads`
- **Apply:** FUB saved-view tabs + Lead-Details 360 drawer; Real Geeks 3-region lead card + 6-up quick actions + Call-Ended modal; Fello intent score ring + signal chips + avatar-ring temperature; wireframes 03/04.
- **KPI strip:** New leads · Uncontacted · Hot buyers · Hot sellers · Avg first-response time · Appointments set.
- **Saved-view pill tabs:** New today · Hot leads · Seller intent · Needs call · Unassigned (+ location saved-lists: Portland, Lake Oswego).
- **Primary surface:** **master–detail on one screen.** Left ~62% `Lead Inbox` table — row formula: `name + type + signal + next-best-action + score`. Right ~34% **selected-lead drawer**: status chips, **`Next best action`** AI sentence with reasoning inline, vertical timeline (type-colored dots), bottom action bar (Call dark-filled, Text, Email, Schedule, Assign). Below table: inline horizontal-bar **`Lead source analysis`** mini-chart.
- **Lead 360 (`/leads/[id]`, deeper than drawer):** 3 columns — profile spine (avatar + label/value facts) | tabbed activity feed (All/Calls/Texts/Emails/Docs) + monospace `Backend record joins` note | **AI Next Actions** stack (Send 3 homes / Schedule consult / Draft buyer agreement).
- **AI:** next-best-action per lead; draft reply (saved as draft); score ring + radar explainer ("why this score"); Call-Ended modal pre-seeds an AI call summary into Notes + structured `Call Result` dropdown.
- **Realism musts:** verified badge + `Online Now` chip; recency nudge ("It's been 17 days since you last contacted this lead"); provenance source (`MatinRealEstate.com / 32K`); avatar ring gold=hot / gray=cold.

### 2.3 Seller / Cash Offers  → `app/(app)/seller-opportunities`
- **Apply:** Fello seller-intent score ring + equity/timeline gauges + database-lights-up; BoldTrail behavioral pipeline; wireframe 06.
- **KPI strip (4):** Database owners `38,420` · Likely sellers `1,286` · Cash offer requests `74` · Agent appts `21`.
- **Primary surface:** **Kanban board** — columns `Signal detected → AI nurture → Human follow-up`, each card = signal title + owner + pale-gold score chip; append the dark **`Backend logic`** column (scoring inputs + mono table list: `contacts, properties, ownership_signals, valuations, seller_campaigns, cash_offer_requests, agent_appointments, ai_actions`).
- **Cash-offer detail:** SkySlope **frozen-column offer comparison matrix** (terms as rows, offers as columns, per-offer Accept/Add-Notes); **Net Sheet** summary card (hero $ + underline + label/value line-items w/ legend dots); home-value hero-number creative with sparkline.
- **AI:** computes seller-intent score; generates plain-English signals (`Has 6.5% ARM, expires in 2 years`, `High equity`) as gold insight chips; drafts home-value/cash-offer outreach; auto-ranks offers and flags weak terms in the comparison grid.
- **Realism musts:** score is the at-a-glance "who to call"; offer-comparison `(i)` popover upgraded to AI verdict; share-link offer intake for buyer agents.

### 2.4 Listing Launch  → `app/(app)/listings`
- **Apply:** wireframe 07 coordinator workbench; MoxiWorks listing-presentation header + 4-cell PropertyStats; MoxiWorks/Moxi template-chooser preview-before-publish.
- **KPI strip:** Active launches · Blocked · Photos pending · MLS drafts · Launching this week.
- **Primary surface:** **left ~50% listing record** — header `7428 SW Maple Ave` + meta (`Lake Oswego · $895,000 target · Launch in 5 days`), then a **multi-track color-coded checklist as labeled progress bars** (Intake green / Disclosures rust / Photos gold / MLS blue / Marketing purple / Broker-approval red), each workstream its own hue; auto-generated seller-update note (forwardable plain English). **Right top: `Output previews` grid** (3×2 mini asset cards: MLS remarks / Listing checklist 6/11 / Seller email / Open-house flyer / Social carousel / YouTube script — each name + status + dark `View`). **Right bottom: context-sensitive `Action Drawer`** whose buttons change with the selected checklist item, led by an AI explanation + dark-filled primary + light secondaries.
- **AI:** identifies blockers with specifics ("missing initials p.4, name/title mismatch"), pre-drafts the fix, generates each marketing asset; sidecar bound to the listing record.
- **Realism musts:** outputs show REAL preview/download/print/send states, not placeholders; `Record data AI can use` mono note.

### 2.5 Buyer Agreements  → `app/(app)/buyer-agreements`
- **Apply:** wireframe 08 three-pane builder; Real Geeks inline document preview-and-send + green completion checks; BoldTrail Qualifications accordion.
- **KPI strip:** Agreements out · Awaiting signature · Signed this week · Expiring soon · Missing-field flags.
- **Primary surface:** **3 columns** — `Structured intake form` (label-above-field; every field maps to a DB column/template; buyer, agent, representation area, budget, expiration, broker clauses) with `Generate packet` (dark) + `Save draft` (light) → `Live document preview` (ruled lines + boxed signature field; "what will be signed before sending") → **`Automation state`** column (label + chip: Draft generated ✓ green / Broker rules checked ✓ / Missing initials None / Send envelope Ready / CRM timeline Will-update gray / Reminder 3 days gray).
- **AI:** drafts the agreement from contact data (agent reviews not authors); validates broker rules; flags missing initials with location.
- **Realism musts:** OREF/Oregon context (C-565 mandatory per HB 4058); downstream effects shown beside the build action; two-tone chip system (green ready / gray pending).

### 2.6 Transactions  → `app/(app)/transactions`
- **Apply:** SkySlope transaction header + tab nav + checklist-as-table + three-pane compliance review; wireframe 09; Lofty/dotloop milestone pattern.
- **KPI strip:** Under contract · Closing this week · At risk (danger) · Inspections due · Pending docs.
- **Primary surface:** **one-deal screen, 3 columns** — `Deal summary` (address + `Buyer side · Under Contract · Close Jul 22`; status rows w/ solid colored pills: Inspection `2 days left` rust / Appraisal `Scheduled` blue / Loan `Conditional` gold / Title `Clear` green) | **`Milestone timeline`** (connecting line + colored node dots + dates; Closing node black) | `Checklist + Risk` (green-check vs red-outline-empty boxes) + **dark `AI Risk Note`** card.
- **Compliance review mode (SkySlope):** three-pane — doc-tree left (grouped by requirement, status pills) + PDF viewer center + transaction-metadata/contacts rail right, with docked green **Accept** / red **Reject** verdict buttons; the right rail hosts the AI risk callouts.
- **AI:** cross-references the email thread against deal state ("email mentions roof concern but no addendum exists"), flags risk + suggests the draft; deadlines inside 48h auto-create a Today risk item.
- **Realism musts:** audit-friendly chronology; every status change writes an activity_event.

### 2.7 Forms & Docs  → `app/(app)/documents`
- **Apply:** SkySlope template library card grid + three-pane review; wireframe 10.
- **KPI strip:** Packets in progress · Awaiting signature · Missing fields · Completed this week · Templates.
- **Primary surface:** **3 panes** — `Packet list` (reusable templates; selected = dark-filled row: Listing packet / Buyer agreement / Offer packet / Seller disclosure / Closing packet…) → `Document preview stack` (2-col grid of doc cards: title + ruled page + status chip green=complete / amber=needs-initials|required|draft) → `Selected document actions` (Preview / Download PDF / Print light, **`Send for signature`** dark-filled, Request correction / Mark broker exception) + bordered **`Automation after send`** note.
- **AI:** missing-field checker surfaces exactly what's incomplete and where (`needs initials · page 4`); packet builder auto-fills from the record.
- **Realism musts:** preview is functional (inspect fields/signatures), grid scrolls past the fold like a real library; per-card kebab for rename/duplicate/delete.

### 2.8 Marketing Studio  → `app/(app)/marketing`
- **Apply:** wireframe 11 three-pane; MoxiWorks template-chooser + preview-before-publish + atomic ListingCard; Fello campaign/automation detail header + funnel-tooltip chart; Sierra automation node/connector builder.
- **KPI strip:** Campaigns live · Assets generated · Avg open rate · Avg reply rate · Attributed pipeline `$` (Fello money-weighted).
- **Primary surface:** **3 panes** — `Template library` (approved brokerage templates: Listing launch / Open house / Price reduction / Just sold / Seller nurture / Recruiting / Cash offer) → **channel-tabbed `Asset previews`** (Email / Social / Flyer / Ad / Web page tabs over ONE preview canvas — "use tabs, not separate pages"; realistic: headline + hero-image placeholder + body lines + `Send test`) → **`Generation controls`** guardrailed form (Audience / Tone / Channels / Budget / Approval) ending in wide dark **`Generate full campaign`**.
- **Automation detail:** header = back-arrow + title + inline green `Active` status pill + right-pinned primary; date-range + granularity filter dropdowns; bar chart with **decomposing tooltip** (Scans/Opens/Clicks/Leads).
- **AI:** obeys brand + compliance rules; drafts merge-field copy and shows "here's what we'll send" before any automated send (BoldTrail Smart Assistant).
- **Realism musts:** previews look like real deliverables; nodes+connectors (solid=committed, dashed=pending) for sequence builder; `Most popular` badge on recommended template.

### 2.9 Coaching  → `app/(app)/coaching`
- **Apply:** wireframe 12 three-pane; Lofty goal-pacing + per-agent leaderboard; Sisu accountability scoreboard (color-as-data).
- **KPI strip:** Practice sessions · Avg scorecard · Agents behind pace · Reviews due · Scenarios run.
- **Primary surface:** **3 panes** — `Scenario library` (broker-approved objection drills; selected dark-filled: Seller wants too high price / Buyer refuses agreement / Inspection objection / Commission objection / Cash offer explanation) → `Roleplay transcript` (labeled speaker bubbles AI Seller / Agent, culminating in a **dark `Coach` feedback bubble with gold "Coach" label**) → **`Scorecard`** (skill label + colored score bar + number: Empathy 85 green / Pricing 62 rust / Next-step close 54 rust / CRM hygiene 92 green / Speed-to-lead 78 gold) + bordered **`Auto-created coaching plan`** (converts score → concrete CRM tasks).
- **Goal-pacing (leadership view):** Lofty bar with actual fill + dashed Pace + dashed Forecast + sentence-status headline; per-agent leaderboard, bar flips blue→coral when behind.
- **AI:** roleplay partner + scorer; auto-creates the coaching plan tied to real CRM tasks ("call two active sellers today").
- **Realism musts:** ties soft-skill coaching to measurable CRM-connected outcomes.

### 2.10 Reports  → `app/(app)/reports`
- **Apply:** Sierra report grammar (title+logo → 2-col KPI tables → primary time-series → secondary chart row, per-panel carousel pager); Lofty reporting shell + dataset tabs (Overview/Table/Funnel) + per-card metric toggle; Sisu color-as-data scoreboard cards; Structurely pipeline ramp.
- **KPI strip / hero:** segmented financial card — Volume | Closings | GCI | **Revenue (green)** — each label + big number + period sub-stat. Date/team/source filters in the command bar.
- **Primary surface:** grid of report cards — **Team ROI scoreboard** (per lead-source/agent rows; ROI% in green, Cost-Per-Lead in red — *value text colored, no badges*); a primary time-series (current solid vs prior-period faint line, dark tooltip stating BOTH periods + BOTH values); pipeline-stage bar chart with progressive **gold/amber single-hue ramp** + named stages; donut share-by-X with legend.
- **AI:** "Ask AI why this metric changed" → dark callout with cited drivers.
- **Realism musts:** KPI cards drill into source records; per-panel `‹1/4›` metric pager; highlighted selected table row.

### 2.11 Systems Health  → `app/(app)/systems-health`
- **Apply:** FUB integrations marketplace (pill chips, logos supply color) + node/edge data-flow; BoldTrail Run-Validation result card; Structurely usage/quota card; wireframe 06 backend-logic transparency.
- **KPI strip:** Integrations connected · Automations running · Webhook errors (danger) · Data-quality flags · Last sync.
- **Primary surface:** **`IntegrationStatusGrid`** of pill-shaped integration chips (thin border, vendor logo + wordmark, green/gold status dot per row) + a **`WorkflowRunTimeline`** (trigger → steps → logs → retry state; failures NEVER hidden — surfaced here and in Today). Data-quality rows = import-source + freshness date + problem label (`Missing address`) rendered as risk chips.
- **AI:** validation/enrichment as one-click actions returning **timestamped verified-result cards** ("Validation Run · No additional details found"); explains a failing automation.
- **Realism musts:** every failed workflow retryable; usage/quota cards (interval line + X/Y + thin progress bar); monospace field-mapping editor.

### 2.12 Admin  → `app/(app)/admin`  (below the divider, de-emphasized)
- **Apply:** BoldTrail Ownership/Access + Lead-Routing rules table + Alerts-vs-Automation config; SkySlope office/scope filter + account top-bar; settings-by-category sidebar.
- **KPI strip (light):** Users · Teams/Offices · Active rules · Pending invites · Audit events today.
- **Primary surface:** category settings sidebar → content. **`Lead Routing` rules table** (Source | multi-line Criteria | Type Blast/Round-Robin | Members | per-row **Priority reorder arrows** | Edit/Clone/Delete) + green `+ New Rule` + recipient builder (Agent vs Office segmented, Set-Weights, ordered priority list). **Record-level Ownership/Access** card (Owned By / Assigned To / Shared With / Access: Private) + trust chips (Validated, Private Contact). **Behavioral Alerts vs Automation** two-column config (left = what notifies, right = what the system does) with per-status toggle grid (semantic dot colors).
- **AI:** shows the exact merge-field templated message a rule will send before it fires.
- **Realism musts:** office/scope dropdown re-scopes dashboards; every admin change writes an `audit_log`; server-side authorization (not hidden UI buttons).

---

## PART 3 — ANTI-SLOP RULES (what keeps it from looking AI-generated)

**DO:**
1. **Every card earns its place with an action or drilldown.** A card with no click target, no action button, and no source link must not ship.
2. **Use real, dense, plausible data** — 47 leads, $895,000 target, "Close Jul 22", scores 92/85/78, "It's been 17 days." Numbers reconcile (a KPI equals the rows it summarizes).
3. **Status = a real chip/dot/colored-number tied to a state machine**, not decoration. Green/red/gold/blue mean exactly what §1.1 says, everywhere.
4. **Ration gold to AI only.** Primary human action = ink-filled. If gold appears on something that isn't AI/active-state, it's a bug.
5. **AI = evidence + confidence + approve/edit/reject**, docked beside the record, with a `Context:` line and citations. Drafts, never silent overwrites.
6. **Tables get:** saved-view tabs with counts, sortable headers, owner initials token, status, next-action, source/provenance, right-drawer on row click, bulk actions when selected.
7. **Show the plumbing** where it builds trust: monospace `Backend record joins` / `Record data AI can use` / `Automation after send` notes.
8. **Every screen lets the user DO work immediately** (master-detail, action bars, contextual drawers) — not a read-only dashboard.
9. **Actionable empty states** (headline + explainer + the tool to fix it). **Skeleton loading** that preserves layout. **Human-readable errors** with retry + Systems Health link.
10. **Type scale + spacing carry hierarchy**; color is reserved for status and the one accent.

**DON'T:**
1. **No fake glowing/pulsing dots, no animated sparkles, no gradient-for-vibes.** (The marketing-site `.gold-shimmer`/`pulse-dot` effects do NOT belong in the operator workspace.)
2. **No decorative-only hero cards, mascots, or 3D spot art inside the workspace.** Spot illustrations are for marketing surfaces only; workspace empty states are tool-first.
3. **No purely cosmetic KPI tiles** that don't drill into data.
4. **No rainbow status systems** or inventing new accent colors. No magenta/coral/indigo borrowed from competitors — those were *their* accent; ours is gold (AI) on the ink/paper base.
5. **No AI chatbot floating bubble** as the AI strategy. AI is the sidecar beside workflows. No "Ask the assistant anything" empty page.
6. **No Fraunces on numbers/data/buttons** — display serif is titles only; data is Inter tabular.
7. **No lorem ipsum, no `[placeholder]`, no "Card Title / subtitle goes here."** Every label is a real domain term (OREF-001, "Earnest money due", "Conditional", "Round Robin").
8. **No zebra-striped, gridline-heavy tables.** Open ledger rhythm, hairlines only.
9. **No silent automation.** Workflow failures surface in Today + Systems Health and are retryable; automated AI sends require approval.
10. **No full-page navigation for routine record inspection** — open the drawer.
11. **No vendor logos for "powered by"** unless it's a neutral integration slot; brand stays Matin.

---

### Build order for parallel agents
Build `AppShell` + `SidebarNav` + `TopCommandBar` + the shared primitives (`KpiCard`, `DataTable`, `KanbanBoard`, `RecordDrawer`, `ActivityTimeline`, `AISidecar`, `AIActionCard`, `StatusChip`, `PriorityBadge`, `DocumentPreview`, `ChecklistPanel`) FIRST and exactly once. The 12 section pages then compose those primitives — they must not re-implement shell, tables, drawers, or AI cards. Tokens go in `src/app/globals.css` under `@theme`, scoped to the `(app)` route group so the marketing site stays monochrome.
