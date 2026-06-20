import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  MessageSquareText,
  PenLine,
  GraduationCap,
  BarChart2,
  FileSignature,
  MessageCircle,
  Megaphone,
  DollarSign,
  PhoneCall,
  ArrowRight,
  Wand2,
  Zap,
  Database,
  Layers,
} from "lucide-react";
import {
  StatTile,
  Pill,
  SectionLabel,
  LiveDot,
} from "@/components/command/ui";
import { AiHubRecentStrip } from "@/components/command/AiHubRecentStrip";

/* ── Tool metadata ──────────────────────────────────────────────────────── */

type ToolMeta = {
  href: string;
  name: string;
  icon: LucideIcon;
  pillar: string;
  desc: string;
  crmLinked: boolean;
  toolKey: string;
};

const TOOL_META: ToolMeta[] = [
  {
    href: "/hub/ai/lead-responder",
    name: "Lead Responder",
    icon: MessageSquareText,
    pillar: "Lead Conversion",
    desc: "Drafts a warm, personalized first reply to any inbound lead in seconds — referencing their area, budget, and intent. Loads directly from CRM.",
    crmLinked: true,
    toolKey: "lead-responder",
  },
  {
    href: "/hub/ai/listing-writer",
    name: "Listing Writer",
    icon: PenLine,
    pillar: "Marketing",
    desc: "Turns raw property facts into vivid, MLS-ready, fair-housing-compliant listing copy — load any active listing to auto-fill.",
    crmLinked: true,
    toolKey: "listing-description",
  },
  {
    href: "/hub/ai/marketing-kit",
    name: "Marketing Kit",
    icon: Megaphone,
    pillar: "Marketing",
    desc: "One click generates five assets: MLS description, Instagram caption, Facebook post, email blast, and open house invite.",
    crmLinked: true,
    toolKey: "marketing-kit",
  },
  {
    href: "/hub/ai/cma",
    name: "CMA Generator",
    icon: BarChart2,
    pillar: "Pricing",
    desc: "Produces a decisive comparative market analysis with a list-price range, comps talking points, and a one-line recommendation.",
    crmLinked: true,
    toolKey: "cma",
  },
  {
    href: "/hub/ai/agreements",
    name: "Agreements",
    icon: FileSignature,
    pillar: "Contracts",
    desc: "Generates clear listing & buyer-representation agreement clause language with broker-review flags. Loads from CRM buyer agreements.",
    crmLinked: true,
    toolKey: "agreement",
  },
  {
    href: "/hub/ai/seller-intel",
    name: "Seller Intel",
    icon: PhoneCall,
    pillar: "Acquisitions",
    desc: "Pre-call intelligence brief — cash offer range, cash vs. list table, phone script opener, and urgency signals. Loads from the pipeline.",
    crmLinked: true,
    toolKey: "seller-intel",
  },
  {
    href: "/hub/ai/cash-offer",
    name: "Cash Offer Eval",
    icon: DollarSign,
    pillar: "Acquisitions",
    desc: "Estimates ARV, deductions, and net-to-seller range for any property. Full breakdown table ready to share with sellers.",
    crmLinked: true,
    toolKey: "cash-offer-eval",
  },
  {
    href: "/hub/ai/coach",
    name: "Agent Coach",
    icon: GraduationCap,
    pillar: "Coaching",
    desc: "Live scenario role-play and tactical feedback — objection handling, listing presentations, buyer consults, and more.",
    crmLinked: false,
    toolKey: "coach",
  },
  {
    href: "/hub/ai/ask",
    name: "Ask Matin",
    icon: MessageCircle,
    pillar: "Team Assistant",
    desc: "The internal company copilot — policies, market knowledge, referrals, and quick email drafts for the whole team.",
    crmLinked: false,
    toolKey: "ask-matin",
  },
];

/* ── Stats bar ──────────────────────────────────────────────────────────── */

const STATS = [
  {
    label: "Tools Available",
    value: "9",
    icon: <Wand2 className="h-4 w-4" />,
  },
  {
    label: "Pillar Coverage",
    value: "6",
    hint: "Lead · Marketing · Pricing · Contracts · Acquisitions · Coaching",
    icon: <Layers className="h-4 w-4" />,
  },
  {
    label: "Avg. Output Time",
    value: "~8s",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    label: "CRM Connected",
    value: "Live",
    icon: <Database className="h-4 w-4" />,
  },
];

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function AiStudioPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-4 px-4 pt-3 md:px-6">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink/[0.06] pb-3">
        <h1 className="font-display text-[1.05rem] font-semibold text-ink">AI Studio</h1>
        <div className="flex items-center gap-1.5">
          <LiveDot tone="success" />
          <SectionLabel>9 tools active</SectionLabel>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS.map((s) => (
          <StatTile
            key={s.label}
            label={s.label}
            value={s.value}
            hint={s.hint}
            icon={s.icon}
          />
        ))}
      </div>

      {/* Grid label */}
      <SectionLabel className="mt-2">Choose a tool</SectionLabel>

      {/* Tool grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOL_META.map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.href}
              className="flex flex-col rounded-xl bg-white ring-1 ring-ink/[0.06] p-5 transition-shadow hover:ring-ink/[0.14] hover:shadow-sm"
            >
              {/* Icon + pills row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/[0.05] text-ink ring-1 ring-inset ring-ink/[0.08]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1.5">
                  {t.crmLinked && <Pill tone="success">CRM</Pill>}
                  <Pill tone="neutral">{t.pillar}</Pill>
                </div>
              </div>

              {/* Name */}
              <h3 className="mt-4 font-semibold text-[1.02rem] text-ink">{t.name}</h3>

              {/* Description */}
              <p className="mt-1.5 flex-1 text-[0.84rem] leading-relaxed text-slate line-clamp-3">
                {t.desc}
              </p>

              {/* Recent output strip — client island, reads localStorage */}
              <AiHubRecentStrip toolKey={t.toolKey} />

              {/* Launch button */}
              <Link
                href={t.href}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[0.82rem] font-semibold text-white transition-colors hover:bg-ink/90"
              >
                Launch <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
