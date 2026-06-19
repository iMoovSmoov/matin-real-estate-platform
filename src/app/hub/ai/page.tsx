import Link from "next/link";
import {
  MessageSquareText,
  PenSquare,
  GraduationCap,
  Calculator,
  FileSignature,
  Sparkles,
  ArrowUpRight,
  Bot,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { Panel, SectionLabel, LiveDot } from "@/components/command/ui";

const TOOLS = [
  {
    href: "/hub/ai/lead-responder",
    name: "Lead Responder",
    icon: MessageSquareText,
    pillar: "Lead Conversion",
    desc: "Drafts a warm, personalized first reply to any inbound lead in seconds — referencing their area, budget, and intent.",
  },
  {
    href: "/hub/ai/listing-writer",
    name: "Listing Writer",
    icon: PenSquare,
    pillar: "Marketing",
    desc: "Turns raw property facts into vivid, MLS-ready, fair-housing-compliant listing copy — load any active listing to start.",
  },
  {
    href: "/hub/ai/coach",
    name: "Agent Coach",
    icon: GraduationCap,
    pillar: "Coaching",
    desc: "Live scenario role-play and tactical feedback — objection handling, listing presentations, buyer consults.",
  },
  {
    href: "/hub/ai/cma",
    name: "CMA Generator",
    icon: Calculator,
    pillar: "Pricing",
    desc: "Produces a decisive comparative market analysis with a list-price range, comps talking points, and a recommendation.",
  },
  {
    href: "/hub/ai/agreements",
    name: "Agreements",
    icon: FileSignature,
    pillar: "Contracts",
    desc: "Generates clear listing & buyer-representation agreement language from your terms, with broker-review flags.",
  },
  {
    href: "/hub/ai/ask",
    name: "Ask Matin",
    icon: Sparkles,
    pillar: "Team Assistant",
    desc: "The internal company copilot — policies, market knowledge, referrals, and quick email drafts for the whole team.",
  },
];

const TRUST = [
  { icon: Zap, label: "Streams live", note: "Token-by-token, no waiting" },
  { icon: ShieldCheck, label: "Grounded", note: "Knows Matin's data & playbook" },
  { icon: Bot, label: "AI", note: "Always-on intelligence" },
];

export default function AiStudioPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 md:px-6 md:py-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-ink-800/80 to-ink-900/80 px-6 py-7">
        <div className="pointer-events-none absolute -right-10 top-0 h-56 w-56 rounded-full bg-azure/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="mb-2 flex items-center gap-2">
            <LiveDot tone="success" />
            <SectionLabel>AI Studio</SectionLabel>
          </div>
          <h1 className="font-display text-3xl text-white md:text-[2.3rem]">
            AI is wired into every workflow.
          </h1>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-slate-300">
            Six purpose-built tools put AI directly into the hands of agents and
            operations — drafting replies, writing listings, generating CMAs and contracts, and coaching the team.
            Every tool streams a live result and is grounded in Matin&apos;s real data.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {TRUST.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.label}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
                >
                  <Icon className="h-4 w-4 text-azure-bright" />
                  <span className="text-[0.8rem] font-semibold text-white">{t.label}</span>
                  <span className="text-[0.74rem] text-slate-300/65">· {t.note}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tool grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="group relative flex flex-col rounded-2xl border border-white/10 bg-ink-900/70 p-5 transition-all hover:-translate-y-0.5 hover:border-azure/40 hover:bg-azure/[0.05] hover:shadow-glow"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-azure/12 text-azure-bright ring-1 ring-inset ring-azure/20 transition-colors group-hover:bg-azure/20">
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-slate-300/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-azure-bright" />
              </div>
              <p className="mt-4 text-[0.62rem] font-semibold uppercase tracking-wider text-azure-300/80">
                {t.pillar}
              </p>
              <h3 className="mt-1 font-display text-xl text-white">{t.name}</h3>
              <p className="mt-1.5 flex-1 text-[0.84rem] leading-relaxed text-slate-300/85">{t.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[0.78rem] font-semibold text-azure-bright opacity-80 transition-opacity group-hover:opacity-100">
                Open tool <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          );
        })}
      </div>

      <Panel className="px-5 py-4">
        <p className="text-[0.8rem] leading-relaxed text-slate-300/80">
          <span className="font-semibold text-white">Grounded in Matin.</span> Every tool is trained on the
          brokerage&apos;s real data — listings, agents, communities, and process — so the output is on-brand and
          ready to use, not generic.
        </p>
      </Panel>
    </div>
  );
}
