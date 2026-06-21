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
} from "lucide-react";
import { Pill, SectionLabel, LiveDot } from "@/components/command/ui";

/* ── Tool metadata ──────────────────────────────────────────────────────── */

type ToolMeta = {
  href: string;
  name: string;
  icon: LucideIcon;
  category: string;
  desc: string;
};

type ToolGroup = {
  label: string;
  tools: ToolMeta[];
};

const TOOL_GROUPS: ToolGroup[] = [
  {
    label: "Lead Conversion",
    tools: [
      {
        href: "/hub/ai/lead-responder",
        name: "Lead Responder",
        icon: MessageSquareText,
        category: "Lead Conversion",
        desc: "Drafts a warm, personalized first reply to any inbound lead in seconds — referencing their area, budget, and intent.",
      },
      {
        href: "/hub/ai/seller-intel",
        name: "Seller Intel",
        icon: PhoneCall,
        category: "Lead Conversion",
        desc: "Pre-call intelligence brief — cash offer range, cash vs. list table, phone script opener, and urgency signals.",
      },
    ],
  },
  {
    label: "Listings & Marketing",
    tools: [
      {
        href: "/hub/ai/listing-writer",
        name: "Listing Writer",
        icon: PenLine,
        category: "Listings & Marketing",
        desc: "Turns raw property facts into vivid, MLS-ready, fair-housing-compliant listing copy.",
      },
      {
        href: "/hub/ai/marketing-kit",
        name: "Marketing Kit",
        icon: Megaphone,
        category: "Listings & Marketing",
        desc: "One click generates five assets: MLS description, Instagram caption, Facebook post, email blast, and open house invite.",
      },
    ],
  },
  {
    label: "Pricing & Valuation",
    tools: [
      {
        href: "/hub/ai/cma",
        name: "CMA Generator",
        icon: BarChart2,
        category: "Pricing & Valuation",
        desc: "Produces a decisive comparative market analysis with a list-price range, comps talking points, and a one-line recommendation.",
      },
      {
        href: "/hub/ai/cash-offer",
        name: "Cash Offer Evaluator",
        icon: DollarSign,
        category: "Pricing & Valuation",
        desc: "Estimates ARV, deductions, and net-to-seller range for any property. Full breakdown table ready to share with sellers.",
      },
    ],
  },
  {
    label: "Contracts & Compliance",
    tools: [
      {
        href: "/hub/ai/agreements",
        name: "Agreements",
        icon: FileSignature,
        category: "Contracts & Compliance",
        desc: "Generates clear listing & buyer-representation agreement clause language with broker-review flags.",
      },
    ],
  },
  {
    label: "Training",
    tools: [
      {
        href: "/hub/ai/coach",
        name: "Agent Coach",
        icon: GraduationCap,
        category: "Training",
        desc: "Live scenario role-play and tactical feedback — objection handling, listing presentations, buyer consults, and more.",
      },
    ],
  },
  {
    label: "Team Assistant",
    tools: [
      {
        href: "/hub/ai/ask",
        name: "Ask Matin",
        icon: MessageCircle,
        category: "Team Assistant",
        desc: "The internal company copilot — policies, market knowledge, referrals, and quick email drafts for the whole team.",
      },
    ],
  },
];

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function AiStudioPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-8 px-4 pt-3 pb-12 md:px-6">

      {/* Page header */}
      <div className="border-b border-ink/[0.06] pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-[1.25rem] font-semibold tracking-tight text-ink">
              AI Studio
            </h1>
            <p className="mt-0.5 text-[0.84rem] text-slate">
              9 specialized AI tools built into your workflow
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <LiveDot tone="success" />
            <span className="text-[0.75rem] font-medium text-slate">9 tools active</span>
          </div>
        </div>
      </div>

      {/* Category-grouped tool list */}
      <div className="space-y-8">
        {TOOL_GROUPS.map((group) => (
          <section key={group.label}>
            {/* Category label */}
            <SectionLabel className="mb-3">{group.label}</SectionLabel>

            {/* Tool rows */}
            <div className="rounded-xl border border-ink/[0.07] bg-white overflow-hidden">
              {group.tools.map((tool, idx) => {
                const Icon = tool.icon;
                const isLast = idx === group.tools.length - 1;
                return (
                  <div
                    key={tool.href}
                    className={`flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-[#f8f8f7] ${
                      !isLast ? "border-b border-ink/[0.06]" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f4f4f3] text-ink ring-1 ring-inset ring-ink/[0.06]">
                      <Icon className="h-4.5 w-4.5 h-[1.125rem] w-[1.125rem]" />
                    </div>

                    {/* Name + description */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.9rem] font-medium text-ink leading-snug">
                        {tool.name}
                      </p>
                      <p className="mt-0.5 text-[0.8rem] text-slate leading-relaxed line-clamp-1">
                        {tool.desc}
                      </p>
                    </div>

                    {/* Category badge + open link */}
                    <div className="flex shrink-0 items-center gap-3">
                      <Pill tone="neutral">{tool.category}</Pill>
                      <Link
                        href={tool.href}
                        className="inline-flex items-center gap-1 text-[0.8rem] font-medium text-ink/70 transition-colors hover:text-ink"
                      >
                        Open <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
