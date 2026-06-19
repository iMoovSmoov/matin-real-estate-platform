import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  DollarSign,
  Handshake,
  UserPlus,
  Timer,
  Target,
  CalendarClock,
  Scale,
  ArrowUpRight,
  Database,
  Bot,
  FileSignature,
  MessageSquareText,
  PenSquare,
  Calculator,
  Users,
} from "lucide-react";
import { metrics, agentLeaderboard, activities, company } from "@/lib/data";
import { usd, compactUsd, num, timeAgo } from "@/lib/utils";
import { Panel, PanelHeader, StatTile, LiveDot, ProgressBar, SectionLabel } from "@/components/command/ui";
import {
  VolumeAreaChart,
  LeadsBySourceChart,
  PipelineByStageChart,
  ConversionFunnelChart,
} from "@/components/command/DashboardCharts";

const k = metrics.kpis;

const KPIS = [
  { label: "Pipeline Value", value: compactUsd(k.pipelineValue), delta: { value: "8.4%", dir: "up" as const }, icon: <DollarSign className="h-4 w-4" />, accent: true },
  { label: "MTD Volume", value: compactUsd(k.mtdVolume), delta: { value: "12.1%", dir: "up" as const }, icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Active Deals", value: num(k.activeDeals), delta: { value: "5", dir: "up" as const }, icon: <Handshake className="h-4 w-4" /> },
  { label: "New Leads Today", value: num(k.newLeadsToday), delta: { value: "9", dir: "up" as const }, icon: <UserPlus className="h-4 w-4" /> },
  { label: "Avg Response", value: `${k.avgResponseMins}m`, delta: { value: "31% faster", dir: "up" as const }, icon: <Timer className="h-4 w-4" /> },
  { label: "Conversion", value: `${k.conversionRate}%`, delta: { value: "1.2pt", dir: "up" as const }, icon: <Target className="h-4 w-4" /> },
  { label: "Avg Days on Market", value: `${k.avgDaysOnMarket}d`, delta: { value: "3d", dir: "up" as const }, icon: <CalendarClock className="h-4 w-4" /> },
  { label: "List-to-Sold", value: `${k.listVsSold}%`, delta: { value: "0.4pt", dir: "up" as const }, icon: <Scale className="h-4 w-4" /> },
];

const TOOLS = [
  { label: "Draft a lead reply", href: "/hub/ai/lead-responder", icon: MessageSquareText },
  { label: "Write a listing", href: "/hub/ai/listing-writer", icon: PenSquare },
  { label: "Run a CMA", href: "/hub/ai/cma", icon: Calculator },
  { label: "New agreement", href: "/hub/ai/agreements", icon: FileSignature },
  { label: "Manage leads", href: "/hub/crm", icon: Users },
  { label: "Generate a form", href: "/hub/forms", icon: Database },
];

const topVolume = agentLeaderboard[0]?.volume || 1;

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 md:px-6 md:py-8">
      {/* Greeting / hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-white/[0.05] px-6 py-7">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-azure/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl text-white md:text-[2.4rem]">
              Good morning, {company.founder.split(" ")[0]}.
            </h1>
            <p className="mt-1.5 max-w-xl text-[0.92rem] text-slate-300">
              {num(k.newLeadsToday)} new leads in the queue, {num(k.activeDeals)} deals in flight, and{" "}
              {compactUsd(k.pipelineValue)} of pipeline working for you right now.
            </p>
          </div>
          <div className="flex shrink-0 gap-2.5">
            <Link
              href="/hub/crm"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-[0.85rem] font-semibold text-ink transition-colors hover:bg-paper-200"
            >
              Work the queue <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/hub/ai"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-[0.85rem] font-semibold text-white transition-colors hover:border-azure/40 hover:bg-white/[0.07]"
            >
              <Bot className="h-4 w-4 text-azure-bright" /> AI Studio
            </Link>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {KPIS.map((kpi) => (
          <StatTile key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Your tools */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-xl text-white">Your tools</h2>
          <span className="text-[0.78rem] text-slate-300/60">Open a tool, get a result.</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-5 text-center transition-all hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.07]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.08] text-white ring-1 ring-inset ring-white/10 transition group-hover:bg-white/15">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[0.82rem] font-medium leading-tight text-white">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Sales Volume"
            subtitle="Trailing 12 months · closed volume"
            icon={<TrendingUp className="h-4 w-4" />}
            action={
              <span className="rounded-lg bg-success/12 px-2.5 py-1 text-[0.72rem] font-semibold text-success ring-1 ring-inset ring-success/20">
                +12.1% YoY
              </span>
            }
          />
          <div className="h-64 px-3 py-4">
            <VolumeAreaChart />
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Lead Sources" subtitle="By channel, this quarter" icon={<UserPlus className="h-4 w-4" />} />
          <div className="h-64 px-3 py-4">
            <LeadsBySourceChart />
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Pipeline by Stage" subtitle="Open deal value across the funnel" icon={<DollarSign className="h-4 w-4" />} />
          <div className="h-64 px-3 py-4">
            <PipelineByStageChart />
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Conversion Funnel" subtitle="Leads → closed, last 12 months" icon={<Target className="h-4 w-4" />} />
          <div className="h-64 px-3 py-4">
            <ConversionFunnelChart />
          </div>
        </Panel>
      </div>

      {/* Leaderboard + activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Agent Leaderboard"
            subtitle="Top producers by closed volume"
            icon={<TrendingUp className="h-4 w-4" />}
            action={
              <Link href="/hub/reporting" className="text-[0.74rem] font-semibold text-azure-bright hover:text-azure-300">
                Full report →
              </Link>
            }
          />
          <ul className="divide-y divide-white/[0.06]">
            {agentLeaderboard.map((a, i) => (
              <li key={a.slug} className="flex items-center gap-3 px-5 py-3">
                <span className="w-5 shrink-0 text-center font-display text-base text-slate-300/70">{i + 1}</span>
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
                  <Image src={a.photo} alt={a.name} fill sizes="36px" className="object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-[0.86rem] font-semibold text-white">{a.name}</p>
                    <p className="shrink-0 font-display text-[0.95rem] text-white tabular-nums">{compactUsd(a.volume)}</p>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <ProgressBar value={(a.volume / topVolume) * 100} className="flex-1" />
                    <span className="shrink-0 text-[0.7rem] text-slate-300/70 tabular-nums">{num(a.homesSold)} sold</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader
            title="Live Activity"
            subtitle="Real-time across the brokerage"
            icon={<LiveDot tone="azure" />}
          />
          <ul className="max-h-[26rem] space-y-px overflow-y-auto px-2 py-2">
            {activities.map((act) => (
              <li key={act.id} className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.04]">
                <span className="relative mt-0.5 h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
                  <Image src={act.photo} alt={act.agent} fill sizes="28px" className="object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.82rem] leading-snug text-slate-300">
                    <span className="font-semibold text-white">{act.agent}</span> {act.text}
                  </p>
                  <p className="mt-0.5 text-[0.68rem] text-slate-300/55">{timeAgo(act.minsAgo)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>


      <p className="pb-2 text-center text-[0.72rem] text-slate-300/45">
        {company.name} · {company.stats.annualVolume} annual volume · {company.stats.agents} agents · {usd(metrics.kpis.pipelineValue)} active pipeline
      </p>
    </div>
  );
}
