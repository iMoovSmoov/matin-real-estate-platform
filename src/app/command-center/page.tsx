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
  Gauge,
  Bot,
  Workflow,
  FileSignature,
  GraduationCap,
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

const PILLARS = [
  { n: 1, name: "Structured Data Systems", module: "CRM & Leads", href: "/command-center/crm", icon: Database, note: "Spreadsheets → live database" },
  { n: 2, name: "Centralized Dashboard", module: "Real-time Reporting", href: "/command-center/reporting", icon: Gauge, note: "One source of truth" },
  { n: 3, name: "AI Integration", module: "AI Studio", href: "/command-center/ai", icon: Bot, note: "Claude in every workflow" },
  { n: 4, name: "Automation", module: "Automation Studio", href: "/command-center/automations", icon: Workflow, note: "8 flows eliminating busywork" },
  { n: 5, name: "Contract Systems", module: "AI Agreements", href: "/command-center/ai/agreements", icon: FileSignature, note: "Listing & buyer agreements" },
  { n: 6, name: "AI Coaching", module: "Agent Coach", href: "/command-center/ai/coach", icon: GraduationCap, note: "Scenario role-play training" },
];

const topVolume = agentLeaderboard[0]?.volume || 1;

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 md:px-6 md:py-8">
      {/* Greeting / hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-ink-800/80 via-ink-900/60 to-ink-900/80 px-6 py-7">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-azure/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <LiveDot tone="success" />
              <SectionLabel>Operations Command Center · Live</SectionLabel>
            </div>
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
              href="/command-center/crm"
              className="inline-flex items-center gap-1.5 rounded-xl bg-azure px-4 py-2.5 text-[0.85rem] font-semibold text-white shadow-glow transition-colors hover:bg-azure-bright"
            >
              Work the queue <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/command-center/ai"
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
              <Link href="/command-center/reporting" className="text-[0.74rem] font-semibold text-azure-bright hover:text-azure-300">
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

      {/* 6 pillars system status */}
      <Panel>
        <PanelHeader
          title="System Architecture — The 6 Pillars"
          subtitle="Every capability in the job spec, mapped to a live module"
          icon={<Gauge className="h-4 w-4" />}
          action={
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-success/12 px-2.5 py-1 text-[0.72rem] font-semibold text-success ring-1 ring-inset ring-success/20">
              <LiveDot tone="success" /> 6 / 6 live
            </span>
          }
        />
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.n}
                href={p.href}
                className="group relative flex items-start gap-3 rounded-xl border border-white/10 bg-ink-800/40 p-4 transition-all hover:border-azure/40 hover:bg-azure/[0.06]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-azure/12 text-azure-bright ring-1 ring-inset ring-azure/20">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-300/55">
                      Pillar {p.n}
                    </span>
                    <LiveDot tone="success" className="h-1.5 w-1.5" />
                  </div>
                  <p className="mt-0.5 text-[0.88rem] font-semibold text-white">{p.name}</p>
                  <p className="mt-0.5 text-[0.74rem] text-slate-300/75">{p.note}</p>
                  <p className="mt-1.5 inline-flex items-center gap-1 text-[0.72rem] font-semibold text-azure-bright opacity-80 transition-opacity group-hover:opacity-100">
                    {p.module} <ArrowUpRight className="h-3 w-3" />
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </Panel>

      <p className="pb-2 text-center text-[0.72rem] text-slate-300/45">
        {company.name} · {company.stats.annualVolume} annual volume · {company.stats.agents} agents · {usd(metrics.kpis.pipelineValue)} active pipeline
      </p>
    </div>
  );
}
