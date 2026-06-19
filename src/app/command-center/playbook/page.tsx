import Link from "next/link";
import {
  Database,
  LayoutDashboard,
  Bot,
  Workflow,
  ScrollText,
  Trophy,
  ShieldCheck,
  Target,
  BookOpen,
  ArrowRight,
  Building2,
  Zap,
  CheckCircle2,
  Quote,
} from "lucide-react";
import { Panel, SectionLabel, StatTile, Pill, GlowBlob } from "@/components/command/ui";
import { company } from "@/lib/data";
import { mostUsedForms } from "@/lib/forms";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Playbook — the strategy behind the build.
   A confident strategy deck that maps each thing the AI Systems & Technology
   Integrator role asks for to a real Oregon real-estate workflow, benchmarks
   the best tools in the category, and shows what this Command Center builds.
   Sourced from docs/real-estate-systems-playbook.md.
   ────────────────────────────────────────────────────────────────────────── */

export const metadata = { title: "Playbook" };

/* ── Company stat row ─────────────────────────────────────────────────────── */
const STATS = [
  { label: "Annual Volume", value: company.stats.annualVolume, hint: "closed production" },
  { label: "Properties Sold", value: company.stats.propertiesSold, hint: "lifetime transactions" },
  { label: "Active Listings", value: company.stats.activeListings, hint: "on market now" },
  { label: "YoY Growth", value: company.stats.growth, hint: "year over year" },
  { label: "Marketing Spend", value: company.stats.marketing, hint: "demand engine" },
] as const;

/* ── The 6 pillars ────────────────────────────────────────────────────────── */
const PILLARS = [
  {
    n: 1,
    name: "Structured Data Systems",
    icon: Database,
    theirWords: "Replace spreadsheets & Google Forms with structured data.",
    reality:
      "Brokerages run on Excel pricing sheets, a “who-signed-what” tracker, paper open-house sheets, and Google-Form intake that dumps to a sheet nobody maintains.",
    built:
      "A branded, editable library of the real OREF forms plus structured intake flows that route straight into the CRM.",
    module: "Forms & Data Flows",
    href: "/command-center/forms",
  },
  {
    n: 2,
    name: "Centralized Dashboard",
    icon: LayoutDashboard,
    theirWords: "A centralized dashboard for real-time reporting.",
    reality:
      "Production lives scattered across the MLS, the CRM, a commission spreadsheet, and the broker’s head.",
    built:
      "Live KPIs, volume / lead / pipeline / funnel charts, an agent leaderboard, and a real-time activity feed.",
    module: "Command Center",
    href: "/command-center",
  },
  {
    n: 3,
    name: "AI Integration",
    icon: Bot,
    theirWords: "Integrate Claude / GPT / Gemini directly into the CRM.",
    reality:
      "Most “AI” is a bolt-on chatbot. The value is AI inside the daily workflow, not parked beside it.",
    built:
      "Claude (Opus 4.8) wired into the CRM draft-reply, the concierge, listing copy, CMAs, coaching, and contracts.",
    module: "CRM & Leads",
    href: "/command-center/crm",
  },
  {
    n: 4,
    name: "Automation",
    icon: Workflow,
    theirWords: "Build automations that eliminate busy work.",
    reality:
      "Speed-to-lead, follow-up, doc review, valuation, and compliance checks are stubbornly manual.",
    built:
      "An Automation Studio of n8n-style flows: speed-to-lead under 60s, listing launch, CMA nurture, under-contract concierge, database reactivation, review loop.",
    module: "Automations",
    href: "/command-center/automations",
  },
  {
    n: 5,
    name: "Contract Systems",
    icon: ScrollText,
    theirWords: "AI-powered listing & buyer agreement workflows.",
    reality:
      "Agents hand-key the same data into OREF forms over and over — and one missed disclosure is a liability.",
    built:
      "A guided Contract Builder that auto-fills from CRM / listing data, AI-drafts clauses, and runs a compliance check before send.",
    module: "Contract Builder",
    href: "/command-center/contracts",
  },
  {
    n: 6,
    name: "AI Coaching",
    icon: Trophy,
    theirWords: "AI coaching on contract writing & scenario training.",
    reality:
      "New agents learn objection-handling and contract language by trial and error on live deals.",
    built:
      "A Coaching Academy of scored scenario role-plays plus an AI contract-writing coach.",
    module: "Coaching Academy",
    href: "/command-center/coaching",
  },
] as const;

/* ── Oregon forms that matter (curated from the doc) ──────────────────────── */
const CORE_FORM_CODES = ["OREF-001", "OREF-015", "C-565", "C-530", "SPDS", "LBP"] as const;
const CORE_FORMS = CORE_FORM_CODES.map((code) =>
  mostUsedForms.find((f) => f.code === code),
).filter((f): f is NonNullable<typeof f> => Boolean(f));

const INTERNAL_FORMS = [
  "New Client Intake",
  "Pre-Listing Questionnaire",
  "Showing Feedback",
  "Vendor / Referral (W-9) Onboarding",
  "Open House Sign-In",
] as const;

/* ── Competitor benchmark ─────────────────────────────────────────────────── */
const COMPETITORS = [
  {
    name: "Dotloop / SkySlope / Brokermint",
    category: "Transactions & Forms",
    greatAt:
      "Reusable templates set up once, MLS auto-fill to kill duplicate entry, one-click e-signature handoffs, and a compliance audit trail on every action — SkySlope’s “Smart Assist” detects signatures and flags missing fields.",
  },
  {
    name: "Follow Up Boss / BoldTrail",
    category: "CRM & Lead Engine",
    greatAt:
      "Automated action plans (drip + tasks), AI assistants that qualify leads and book showings, and an AI “next best action” surfaced on every contact.",
  },
  {
    name: "Lofty / Ylopo",
    category: "AI Lead Conversion",
    greatAt:
      "AI-driven lead nurture, dynamic search sites, and conversational AI (text/voice) that re-engages stale databases and routes the warm ones to an agent.",
  },
] as const;

/* ── Bottleneck → solution table ──────────────────────────────────────────── */
const BOTTLENECKS = [
  {
    pain: "Slow lead response — the #1 conversion killer",
    fix: "Speed-to-Lead automation drafts and sends an AI reply in under 60s; the CRM shows a “Draft AI reply” on every lead.",
  },
  {
    pain: "Duplicate data entry across MLS / CRM / forms",
    fix: "One structured record auto-fills every form and agreement.",
  },
  {
    pain: "Spreadsheets & Google Forms with no source of truth",
    fix: "Structured intake flows route into the CRM; the forms library replaces the trackers.",
  },
  {
    pain: "Missed disclosures / compliance risk",
    fix: "Forms auto-attach by rule (e.g. Lead-Based Paint when year-built < 1978); every delivery is logged.",
  },
  {
    pain: "Pricing & valuation research eats hours",
    fix: "An AI CMA generates a defensible pricing opinion in seconds.",
  },
  {
    pain: "New-agent ramp is slow & inconsistent",
    fix: "Coaching Academy scenario role-plays plus a contract-writing coach.",
  },
  {
    pain: "Reporting is stale and manual",
    fix: "A real-time dashboard with exportable reporting.",
  },
] as const;

const REAL = [
  "The entire UI — every screen, fully built and navigable",
  "Real Matin brand, agents, and assets throughout",
  "Live Claude (Opus 4.8) streaming on every AI feature, with a graceful canned fallback so the demo never breaks",
  "Working forms, contract, and coaching workflows",
  "Client-side CSV export of the data you see",
] as const;

const DEMO = [
  "Leads, transactions, and metrics are realistic synthetic records",
  "Integrations show a simulated connection state",
  "No live MLS / CRM is wired — that’s the actual day-one job",
] as const;

/* ────────────────────────────────────────────────────────────────────────── */
export default function PlaybookPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-12 px-4 py-6 md:px-6 md:py-10">
      {/* ── 1 · HERO ──────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-ink-800/80 via-ink-900/60 to-ink-900/80 px-6 py-10 md:px-10 md:py-14">
        <GlowBlob className="-right-16 -top-24 h-72 w-72" />
        <GlowBlob className="-left-10 bottom-0 h-56 w-56 opacity-60" />
        <div className="grid-tech pointer-events-none absolute inset-0 opacity-[0.35]" />
        <div className="relative max-w-3xl">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-azure/15 text-azure-bright ring-1 ring-inset ring-azure/25">
              <BookOpen className="h-4 w-4" />
            </span>
            <SectionLabel>Strategy</SectionLabel>
          </div>
          <h1 className="font-display text-4xl leading-[1.05] text-white md:text-[3.4rem]">
            The strategy behind the build.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
            The role isn’t about bolting another tool onto the stack. It’s about
            connecting{" "}
            <span className="font-semibold text-white">CRM</span>,{" "}
            <span className="font-semibold text-white">transactions</span>,{" "}
            <span className="font-semibold text-white">forms</span>,{" "}
            <span className="font-semibold text-white">marketing</span>, and{" "}
            <span className="font-semibold text-white">reporting</span> into one
            platform — with AI threaded through the whole thing instead of parked
            beside it. This Command Center is a working demo of exactly that
            system, grounded in how {company.name} actually does business in
            Oregon.
          </p>

          {/* Company stat row */}
          <div className="mt-9">
            <SectionLabel className="mb-3">{company.name} · by the numbers</SectionLabel>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {STATS.map((s, i) => (
                <StatTile
                  key={s.label}
                  label={s.label}
                  value={s.value}
                  hint={s.hint}
                  accent={i === 0}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── 2 · THE 6 PILLARS ─────────────────────────────────────────────── */}
      <section>
        <SectionHeading
          eyebrow="The job, decoded"
          title="Six pillars, one platform"
          lead="Every capability in the posting, mapped to the real-estate pain it solves and the live module that answers it."
        />
        <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <Panel
                key={p.n}
                as="article"
                className="group flex flex-col p-5 transition-colors hover:border-azure/35"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-azure/12 text-azure-bright ring-1 ring-inset ring-azure/20">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-2xl text-white/15 tabular-nums">
                    0{p.n}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-xl text-white">{p.name}</h3>

                <dl className="mt-4 space-y-3.5 text-[0.82rem] leading-relaxed">
                  <Detail label="Their words" tone="azure">
                    <span className="italic text-slate-300">“{p.theirWords}”</span>
                  </Detail>
                  <Detail label="Real-estate reality" tone="warn">
                    {p.reality}
                  </Detail>
                  <Detail label="What we built" tone="success">
                    {p.built}
                  </Detail>
                </dl>

                <Link
                  href={p.href}
                  className="mt-5 inline-flex items-center gap-1.5 self-start rounded-lg border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[0.78rem] font-semibold text-azure-bright transition-colors hover:border-azure/40 hover:bg-azure/[0.08] hover:text-azure-300"
                >
                  Open {p.module}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Panel>
            );
          })}
        </div>
      </section>

      {/* ── 3 · THE FORMS THAT MATTER (Oregon) ────────────────────────────── */}
      <section>
        <SectionHeading
          eyebrow="Oregon, specifically"
          title="The forms that actually matter"
          lead="Oregon agents work almost entirely in the OREF standard library plus federal disclosures. We modeled the high-frequency set — not a generic e-sign template pile."
        />

        <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel className="p-5 lg:col-span-2">
            <div className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-azure-bright" />
              <SectionLabel>Core OREF &amp; federal disclosures</SectionLabel>
            </div>
            <ul className="mt-4 divide-y divide-white/[0.06]">
              {CORE_FORMS.map((f) => (
                <li key={f.code} className="flex items-start gap-3 py-3">
                  <span className="mt-0.5 inline-flex shrink-0 items-center rounded-md bg-azure/12 px-2 py-0.5 font-mono text-[0.7rem] font-semibold text-azure-bright ring-1 ring-inset ring-azure/25">
                    {f.code}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.88rem] font-semibold text-white">{f.name}</p>
                    <p className="mt-0.5 text-[0.8rem] leading-snug text-slate-300">
                      {f.description}
                    </p>
                    {f.compliance && (
                      <p className="mt-1 text-[0.72rem] text-slate-300/60">{f.compliance}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.78rem] text-slate-300">
              <Pill tone="neutral">Also modeled</Pill>
              <span>Counter Offer</span>
              <Dot />
              <span>Repair / Inspection Addendum</span>
              <Dot />
              <span>Addendum / Amendment</span>
              <Dot />
              <span>Earnest Money Receipt</span>
              <Dot />
              <span>Commission Disbursement Authorization</span>
            </div>
          </Panel>

          <div className="space-y-4">
            {/* HB 4058 callout */}
            <Panel glow className="bg-azure/[0.06] p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-azure-bright" />
                <SectionLabel>Compliance, baked in</SectionLabel>
              </div>
              <p className="mt-3 text-[0.92rem] leading-relaxed text-white">
                Buyer representation is now <span className="text-azure-300">mandatory</span>{" "}
                for every Oregon buyer.
              </p>
              <p className="mt-2 text-[0.82rem] leading-relaxed text-slate-300">
                <span className="font-semibold text-white">C-565</span> has been required since{" "}
                <span className="font-semibold text-white">HB 4058</span> took effect{" "}
                <span className="font-semibold text-white">January 1, 2025</span>. The builder
                attaches it by rule — and auto-attaches the federal Lead-Based Paint disclosure
                whenever a listing’s year-built is before 1978.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Pill tone="azure">HB 4058 · 2025</Pill>
                <Pill tone="warn">ORS 105.464</Pill>
                <Pill tone="warn">42 U.S.C. §4852d</Pill>
              </div>
            </Panel>

            {/* Internal ops = spreadsheets in disguise */}
            <Panel className="p-5">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-azure-bright" />
                <SectionLabel>Spreadsheets in disguise → flows</SectionLabel>
              </div>
              <p className="mt-3 text-[0.8rem] leading-relaxed text-slate-300">
                The internal ops “forms” that are really Google Forms and trackers — rebuilt as
                structured intake flows that route into the CRM.
              </p>
              <ul className="mt-3 space-y-1.5">
                {INTERNAL_FORMS.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[0.82rem] text-slate-300">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      </section>

      {/* ── 4 · COMPETITOR BENCHMARK ──────────────────────────────────────── */}
      <section>
        <SectionHeading
          eyebrow="We studied the best"
          title="How the category leaders do it"
          lead="The competition is excellent — within its lane. Every one of these is a silo. The integrator’s job is to connect the lanes."
        />

        <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {COMPETITORS.map((c) => (
            <Panel key={c.name} className="flex flex-col p-5">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-300" />
                <SectionLabel>{c.category}</SectionLabel>
              </div>
              <h3 className="mt-2 font-display text-lg leading-snug text-white">{c.name}</h3>
              <p className="mt-3 text-[0.82rem] leading-relaxed text-slate-300">
                <span className="font-semibold text-azure-300">Great at: </span>
                {c.greatAt}
              </p>
            </Panel>
          ))}
        </div>

        {/* The gap we exploit */}
        <Panel glow className="mt-4 overflow-hidden bg-gradient-to-br from-azure/[0.1] to-transparent p-6 md:p-8">
          <GlowBlob className="-right-12 -top-16 h-56 w-56" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-azure-bright" />
                <SectionLabel>The gap we exploit</SectionLabel>
              </div>
              <p className="font-display text-xl leading-snug text-white md:text-2xl">
                These tools are separate silos.
              </p>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-slate-300">
                The integrator’s job is to{" "}
                <span className="font-semibold text-white">
                  connect CRM + transactions + forms + marketing + reporting into one platform
                </span>
                , with AI threaded through the whole thing. That’s exactly what this Command
                Center demonstrates.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Pill tone="azure">Unified</Pill>
              <Pill tone="azure">AI-threaded</Pill>
              <Pill tone="success">One source of truth</Pill>
            </div>
          </div>
        </Panel>
      </section>

      {/* ── 5 · BOTTLENECK → SOLUTION ─────────────────────────────────────── */}
      <section>
        <SectionHeading
          eyebrow="Pain → fix"
          title="Office bottlenecks, solved"
          lead="The seven recurring drags on a brokerage’s day — and the part of this build that removes each one."
        />

        <Panel className="mt-7 overflow-hidden">
          {/* header row (desktop) */}
          <div className="hidden grid-cols-[1.1fr_1.4fr] gap-4 border-b border-white/10 px-5 py-3 md:grid">
            <SectionLabel>Bottleneck — the pain</SectionLabel>
            <SectionLabel>The fix in this build</SectionLabel>
          </div>
          <ul className="divide-y divide-white/[0.06]">
            {BOTTLENECKS.map((b, i) => (
              <li
                key={b.pain}
                className="grid grid-cols-1 gap-2 px-5 py-4 transition-colors hover:bg-white/[0.02] md:grid-cols-[1.1fr_1.4fr] md:gap-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 font-display text-sm text-slate-300/40 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[0.88rem] font-semibold leading-snug text-white">{b.pain}</p>
                </div>
                <div className="flex items-start gap-2.5 md:pl-0">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-azure-bright" />
                  <p className="text-[0.85rem] leading-relaxed text-slate-300">{b.fix}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      {/* ── 6 · REAL vs DEMO ──────────────────────────────────────────────── */}
      <section>
        <SectionHeading
          eyebrow="Honesty note"
          title="What’s real vs. what’s demo"
          lead="A senior integrator is precise about the line between a working system and a portfolio simulation. Here’s exactly where it sits."
        />

        <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel className="border-success/20 p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/12 text-success ring-1 ring-inset ring-success/25">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <SectionLabel className="text-success/80">Real</SectionLabel>
                <p className="text-[0.92rem] font-semibold text-white">Genuinely working</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5">
              {REAL.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[0.85rem] leading-relaxed text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel className="p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warn/15 text-warn ring-1 ring-inset ring-warn/25">
                <Target className="h-4 w-4" />
              </span>
              <div>
                <SectionLabel className="text-warn/80">Demo</SectionLabel>
                <p className="text-[0.92rem] font-semibold text-white">Simulated for the portfolio</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5">
              {DEMO.map((d) => (
                <li key={d} className="flex items-start gap-2.5 text-[0.85rem] leading-relaxed text-slate-300">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
                  {d}
                </li>
              ))}
            </ul>
            <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-[0.8rem] leading-relaxed text-slate-300">
              Wiring the live MLS and CRM is the real first sprint of the role — the architecture
              here is built to receive it.
            </p>
          </Panel>
        </div>
      </section>

      {/* ── CLOSING CTA ───────────────────────────────────────────────────── */}
      <Panel glow className="relative overflow-hidden bg-gradient-to-br from-ink-800/80 to-ink-900/80 px-6 py-10 text-center md:px-10 md:py-14">
        <GlowBlob className="left-1/2 top-0 h-64 w-64 -translate-x-1/2" />
        <div className="relative mx-auto max-w-3xl">
          <Quote className="mx-auto h-7 w-7 text-azure-bright/60" />
          <h2 className="mt-4 font-display text-2xl leading-snug text-white md:text-[2.2rem]">
            One platform. AI in every workflow. Built the way an integrator would actually build it.
          </h2>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-slate-300">
            This Command Center is the answer to the{" "}
            <span className="font-semibold text-white">AI Systems &amp; Technology Integrator</span>{" "}
            role at {company.name} in {company.address.city}, {company.address.state} — proof that
            the six pillars aren’t a pitch, they’re a working system.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/command-center"
              className="inline-flex items-center gap-1.5 rounded-xl bg-azure px-5 py-2.5 text-[0.88rem] font-semibold text-white shadow-glow transition-colors hover:bg-azure-bright"
            >
              <LayoutDashboard className="h-4 w-4" />
              See it live
            </Link>
            <Link
              href="/command-center/forms"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-2.5 text-[0.88rem] font-semibold text-white transition-colors hover:border-azure/40 hover:bg-white/[0.07]"
            >
              Start with the data layer
              <ArrowRight className="h-4 w-4 text-azure-bright" />
            </Link>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Local presentational helpers (server-safe, no state).
   ────────────────────────────────────────────────────────────────────────── */

function SectionHeading({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead: string;
}) {
  return (
    <div className="max-w-2xl">
      <SectionLabel className="text-azure-bright/80">{eyebrow}</SectionLabel>
      <h2 className="mt-2 font-display text-2xl text-white md:text-[2rem]">{title}</h2>
      <p className="mt-2 text-[0.92rem] leading-relaxed text-slate-300">{lead}</p>
    </div>
  );
}

function Detail({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "azure" | "warn" | "success";
  children: React.ReactNode;
}) {
  const dot: Record<typeof tone, string> = {
    azure: "bg-azure-bright",
    warn: "bg-warn",
    success: "bg-success",
  };
  return (
    <div>
      <dt className="mb-1 flex items-center gap-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-slate-300/60">
        <span className={cn("h-1.5 w-1.5 rounded-full", dot[tone])} />
        {label}
      </dt>
      <dd className="text-slate-300">{children}</dd>
    </div>
  );
}

function Dot() {
  return <span aria-hidden className="text-slate-300/30">·</span>;
}
