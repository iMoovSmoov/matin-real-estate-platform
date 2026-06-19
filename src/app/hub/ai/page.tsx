import Link from "next/link";
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

const TOOLS = [
  {
    href: "/hub/ai/lead-responder",
    name: "Lead Responder",
    icon: MessageSquareText,
    pillar: "Lead Conversion",
    desc: "Drafts a warm, personalized first reply to any inbound lead in seconds — referencing their area, budget, and intent. Loads directly from CRM.",
  },
  {
    href: "/hub/ai/listing-writer",
    name: "Listing Writer",
    icon: PenLine,
    pillar: "Marketing",
    desc: "Turns raw property facts into vivid, MLS-ready, fair-housing-compliant listing copy — load any active listing to auto-fill.",
  },
  {
    href: "/hub/ai/marketing-kit",
    name: "Marketing Kit",
    icon: Megaphone,
    pillar: "Marketing",
    desc: "One click generates five assets: MLS description, Instagram caption, Facebook post, email blast, and open house invite.",
  },
  {
    href: "/hub/ai/cma",
    name: "CMA Generator",
    icon: BarChart2,
    pillar: "Pricing",
    desc: "Produces a decisive comparative market analysis with a list-price range, comps talking points, and a one-line recommendation.",
  },
  {
    href: "/hub/ai/agreements",
    name: "Agreements",
    icon: FileSignature,
    pillar: "Contracts",
    desc: "Generates clear listing & buyer-representation agreement clause language with broker-review flags. Loads from CRM buyer agreements.",
  },
  {
    href: "/hub/ai/seller-intel",
    name: "Seller Intel",
    icon: PhoneCall,
    pillar: "Acquisitions",
    desc: "Pre-call intelligence brief — cash offer range, cash vs. list table, phone script opener, and urgency signals. Loads from the pipeline.",
  },
  {
    href: "/hub/ai/cash-offer",
    name: "Cash Offer Eval",
    icon: DollarSign,
    pillar: "Acquisitions",
    desc: "Estimates ARV, deductions, and net-to-seller range for any property. Full breakdown table ready to share with sellers.",
  },
  {
    href: "/hub/ai/coach",
    name: "Agent Coach",
    icon: GraduationCap,
    pillar: "Coaching",
    desc: "Live scenario role-play and tactical feedback — objection handling, listing presentations, buyer consults, and more.",
  },
  {
    href: "/hub/ai/ask",
    name: "Ask Matin",
    icon: MessageCircle,
    pillar: "Team Assistant",
    desc: "The internal company copilot — policies, market knowledge, referrals, and quick email drafts for the whole team.",
  },
];

export default function AiStudioPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 md:px-6 md:py-8">
      {/* Header */}
      <div className="pb-2">
        <h1 className="font-display text-2xl text-ink sm:text-3xl md:text-[2.3rem]">AI Toolkit</h1>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-slate">
          Nine purpose-built tools — each connected to your CRM, listings, and pipeline. Pick a tool, load your data, and generate in one click.
        </p>
      </div>

      {/* Tool grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.href}
              className="flex flex-col rounded-xl bg-white ring-1 ring-ink/[0.06] p-5 transition-shadow hover:ring-ink/[0.14] hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/[0.05] text-ink ring-1 ring-inset ring-ink/[0.08]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="mt-0.5 rounded-full bg-ink/[0.04] px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-ink/60">
                  {t.pillar}
                </span>
              </div>
              <h3 className="mt-4 font-semibold text-[1.02rem] text-ink">{t.name}</h3>
              <p className="mt-1.5 flex-1 text-[0.84rem] leading-relaxed text-slate">{t.desc}</p>
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
