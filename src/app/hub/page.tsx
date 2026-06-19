import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  DollarSign,
  UserPlus,
  Target,
  ArrowUpRight,
  ArrowRight,
  Database,
  Bot,
  FileSignature,
  MessageSquareText,
  PenSquare,
  Calculator,
  Users,
  Clock,
  Home,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { metrics, agentLeaderboard, company } from "@/lib/data";
import { usd, compactUsd, num } from "@/lib/utils";
import {
  Panel,
  PanelHeader,
  StatTile,
  LiveDot,
  ProgressBar,
} from "@/components/command/ui";
import {
  VolumeAreaChart,
  LeadsBySourceChart,
  PipelineByStageChart,
  ConversionFunnelChart,
  SourceRoiChart,
} from "@/components/command/DashboardCharts";

/* ── Static data ────────────────────────────────────────────────────────── */

const k = metrics.kpis;

/** Alert chips rendered below the header */
const ALERTS = [
  {
    label: "3 stale leads",
    href: "/hub/crm?filter=stale",
    tone: "danger" as const,
    count: 3,
  },
  {
    label: "2 unsigned buyer agreements",
    href: "/hub/buyer-agreements",
    tone: "danger" as const,
    count: 2,
  },
  {
    label: "1 listing missing photos",
    href: "/hub/listing-launch",
    tone: "warn" as const,
    count: 1,
  },
];

/** 5-tile KPI strip */
const KPIS = [
  {
    label: "Active Listings",
    value: "18",
    delta: { value: "3", dir: "up" as const },
    icon: <Home className="h-4 w-4" />,
  },
  {
    label: "Volume MTD",
    value: "$8.4M",
    delta: { value: "12.1%", dir: "up" as const },
    icon: <TrendingUp className="h-4 w-4" />,
    accent: true,
  },
  {
    label: "Leads in Pipeline",
    value: "47",
    delta: { value: "9", dir: "up" as const },
    icon: <Users className="h-4 w-4" />,
  },
  {
    label: "Avg Response",
    value: "4.2 min",
    delta: { value: "31% faster", dir: "up" as const },
    icon: <Clock className="h-4 w-4" />,
  },
  {
    label: "Closings This Month",
    value: "6",
    delta: { value: "1", dir: "up" as const },
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
];

/** Speed-to-lead table — deterministic, no randomness */
const SPEED_DATA = [
  { name: "Jordan Matin",  initials: "JM", avgMin: 1.8,  leads: 3,  vsDelta: -2.4 },
  { name: "Joshua Rose",   initials: "JR", avgMin: 2.1,  leads: 8,  vsDelta: -1.9 },
  { name: "Sarah Chen",    initials: "SC", avgMin: 4.7,  leads: 12, vsDelta: 0.5  },
  { name: "Marcus Webb",   initials: "MW", avgMin: 6.3,  leads: 5,  vsDelta: 2.1  },
  { name: "Keanu Makoa",   initials: "KM", avgMin: 11.2, leads: 9,  vsDelta: 7.0  },
];

/** Recent activity feed — hardcoded realistic entries */
const FEED = [
  {
    initials: "JR",
    text: "Joshua Rose closed 47 Hillside Dr, Lake Oswego",
    sub: "$689,000",
    ago: "2h ago",
  },
  {
    initials: "SC",
    text: "Sarah Chen submitted buyer agreement for Kevin & Maria Torres",
    sub: "",
    ago: "4h ago",
  },
  {
    initials: "MW",
    text: "Marcus Webb scheduled showing at 1204 NW Lovejoy St",
    sub: "$1.15M",
    ago: "5h ago",
  },
  {
    initials: "KM",
    text: "Keanu Makoa received new lead via Zillow — Portland",
    sub: "",
    ago: "6h ago",
  },
  {
    initials: "JM",
    text: "Jordan Matin updated price on 8312 SW Beaverton-Hillsdale",
    sub: "$574,900",
    ago: "8h ago",
  },
  {
    initials: "JR",
    text: "Joshua Rose opened transaction file for 2901 NE Glisan St",
    sub: "$445,000",
    ago: "10h ago",
  },
];

/** Quick-tool launcher cards */
const TOOLS = [
  { label: "Draft a reply",    href: "/hub/ai/lead-responder",  icon: MessageSquareText },
  { label: "Write a listing",  href: "/hub/ai/listing-writer",  icon: PenSquare         },
  { label: "Run a CMA",        href: "/hub/ai/cma",             icon: Calculator        },
  { label: "New agreement",    href: "/hub/ai/agreements",      icon: FileSignature     },
  { label: "Cash offer eval",  href: "/hub/ai/cash-offer",      icon: DollarSign        },
  { label: "Generate a form",  href: "/hub/forms",              icon: Database          },
];

const topVolume = agentLeaderboard[0]?.volume || 1;

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-4 md:px-6 md:py-8">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-ink/[0.08] bg-gradient-to-br from-ink/[0.04] via-ink/[0.02] to-ink/[0.03] px-6 py-7">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-ink/[0.08] blur-3xl" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          {/* Left — heading + alert chips */}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl text-ink sm:text-3xl md:text-[2.4rem]">
              Jordan&rsquo;s Dashboard
            </h1>
            <p className="mt-1 text-[0.92rem] text-slate">
              {num(k.newLeadsToday)} new leads in the queue &mdash; {num(k.activeDeals)} deals in flight &mdash; {compactUsd(k.pipelineValue)} pipeline.
            </p>

            {/* Alert chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {ALERTS.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.72rem] font-semibold transition-colors",
                    a.tone === "danger"
                      ? "border-danger/20 bg-danger/10 text-danger hover:bg-danger/15"
                      : "border-warn/20 bg-warn/10 text-warn hover:bg-warn/15",
                  ].join(" ")}
                >
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {a.label}
                  <ArrowRight className="h-3 w-3 shrink-0 opacity-60" />
                </Link>
              ))}
            </div>
          </div>

          {/* Right — CTA buttons */}
          <div className="flex shrink-0 flex-wrap gap-2.5">
            <Link
              href="/hub/crm"
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-[0.85rem] font-semibold text-white transition-colors hover:bg-ink/90"
            >
              Work the queue <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/hub/ai"
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-[0.85rem] font-semibold text-ink transition-colors hover:border-ink/20 hover:bg-paper"
            >
              <Bot className="h-4 w-4 text-ink" /> AI Studio
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI stat tiles ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {KPIS.map((kpi) => (
          <StatTile key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* ── Quick Tools ─────────────────────────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-xl text-ink">Quick Tools</h2>
          <span className="text-[0.78rem] text-slate/60">Open a tool, get a result.</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className="group flex flex-col items-start gap-3 rounded-xl border border-ink/[0.08] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-lift"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-paper text-ink ring-1 ring-inset ring-ink/[0.06] transition group-hover:bg-ink/[0.06]">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex w-full items-center justify-between gap-1">
                  <span className="text-[0.82rem] font-medium leading-tight text-ink">
                    {t.label}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate/40 transition group-hover:text-ink" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Charts: volume area (2 col) + lead sources ──────────────────── */}
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
          <PanelHeader
            title="Lead Sources"
            subtitle="By channel, this quarter"
            icon={<UserPlus className="h-4 w-4" />}
          />
          <div className="h-64 px-3 py-4">
            <LeadsBySourceChart />
          </div>
        </Panel>
      </div>

      {/* ── Pipeline by stage + conversion funnel ───────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Pipeline by Stage"
            subtitle="Open deal value across the funnel"
            icon={<DollarSign className="h-4 w-4" />}
          />
          <div className="h-64 px-3 py-4">
            <PipelineByStageChart />
          </div>
        </Panel>
        <Panel>
          <PanelHeader
            title="Conversion Funnel"
            subtitle="Leads to closed, last 12 months"
            icon={<Target className="h-4 w-4" />}
          />
          <div className="h-64 px-3 py-4">
            <ConversionFunnelChart />
          </div>
        </Panel>
      </div>

      {/* ── Speed-to-Lead table ──────────────────────────────────────────── */}
      <Panel>
        <PanelHeader
          title="Response Time — This Week"
          subtitle="Speed-to-lead by agent"
          icon={<Clock className="h-4 w-4" />}
          action={
            <Link
              href="/hub/reporting"
              className="text-[0.74rem] font-semibold text-ink hover:opacity-70"
            >
              Full report →
            </Link>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-[0.82rem]">
            <thead>
              <tr className="border-b border-ink/[0.06]">
                <th className="px-5 py-2.5 text-left text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
                  Agent
                </th>
                <th className="px-3 py-2.5 text-left text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
                  Avg Response
                </th>
                <th className="px-3 py-2.5 text-right text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
                  Leads Handled
                </th>
                <th className="px-5 py-2.5 text-right text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
                  vs Team
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.04]">
              {SPEED_DATA.map((agent, i) => {
                const responseColor =
                  agent.avgMin < 5
                    ? "text-success font-semibold"
                    : agent.avgMin <= 15
                    ? "text-warn font-semibold"
                    : "text-danger font-semibold";
                const deltaLabel =
                  agent.vsDelta < 0
                    ? `${agent.vsDelta.toFixed(1)} min`
                    : `+${agent.vsDelta.toFixed(1)} min`;
                const deltaColor =
                  agent.vsDelta < 0 ? "text-success" : "text-danger";
                return (
                  <tr
                    key={agent.name}
                    className={i % 2 === 0 ? "bg-white" : "bg-[#f4f4f3]/60"}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/[0.07] text-[0.7rem] font-semibold text-ink">
                          {agent.initials}
                        </span>
                        <span className="font-medium text-ink">{agent.name}</span>
                      </div>
                    </td>
                    <td className={`px-3 py-3 tabular-nums ${responseColor}`}>
                      {agent.avgMin.toFixed(1)} min
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate">
                      {agent.leads}
                    </td>
                    <td className={`px-5 py-3 text-right tabular-nums text-[0.78rem] font-semibold ${deltaColor}`}>
                      {deltaLabel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ── Source ROI chart + Activity feed ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Marketing ROI by Channel"
            subtitle="Spend vs. revenue closed, this quarter"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <div className="h-[280px] px-3 py-4">
            <SourceRoiChart />
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Recent Activity"
            subtitle="Latest actions across the brokerage"
            icon={<LiveDot tone="azure" />}
          />
          <ul className="divide-y divide-ink/[0.04] py-1">
            {FEED.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-paper/60"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/[0.07] text-[0.7rem] font-semibold text-ink">
                  {item.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.83rem] leading-snug text-slate">
                    {item.text}
                    {item.sub && (
                      <span className="ml-1.5 font-semibold text-ink">{item.sub}</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[0.68rem] text-slate/50">{item.ago}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* ── Agent Leaderboard ────────────────────────────────────────────── */}
      <Panel>
        <PanelHeader
          title="Agent Leaderboard"
          subtitle="Top producers by closed volume"
          icon={<TrendingUp className="h-4 w-4" />}
          action={
            <Link
              href="/hub/reporting"
              className="text-[0.74rem] font-semibold text-ink hover:opacity-70"
            >
              Full report →
            </Link>
          }
        />
        <ul className="divide-y divide-ink/[0.06]">
          {agentLeaderboard.map((a, i) => (
            <li key={a.slug} className="flex items-center gap-3 px-5 py-3">
              <span className="w-5 shrink-0 text-center font-display text-base text-slate/70">
                {i + 1}
              </span>
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-ink/[0.06]">
                <Image
                  src={a.photo}
                  alt={a.name}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-[0.86rem] font-semibold text-ink">
                    {a.name}
                  </p>
                  <p className="shrink-0 font-display text-[0.95rem] text-ink tabular-nums">
                    {compactUsd(a.volume)}
                  </p>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <ProgressBar value={(a.volume / topVolume) * 100} className="flex-1" />
                  <span className="shrink-0 text-[0.7rem] text-slate/70 tabular-nums">
                    {num(a.homesSold)} sold
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <p className="pb-2 text-center text-[0.72rem] text-slate/45">
        {company.name} &middot; {company.stats.annualVolume} annual volume &middot;{" "}
        {company.stats.agents} agents &middot; {usd(metrics.kpis.pipelineValue)} active pipeline
      </p>
    </div>
  );
}
