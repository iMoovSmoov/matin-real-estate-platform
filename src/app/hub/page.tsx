"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  DollarSign,
  UserPlus,
  Target,
  ArrowRight,
  Database,
  FileSignature,
  MessageSquareText,
  PenSquare,
  Calculator,
  Users,
  Clock,
  TriangleAlert,
  AlertCircle,
  Calendar,
  Activity,
  Zap,
  Timer,
} from "lucide-react";
import { metrics, agentLeaderboard, salesAgents, company } from "@/lib/data";
import { usd, compactUsd } from "@/lib/utils";
import {
  Panel,
  PanelHeader,
} from "@/components/command/ui";
import {
  VolumeAreaChart,
  LeadsBySourceChart,
  PipelineByStageChart,
  ConversionFunnelChart,
  SourceRoiChart,
} from "@/components/command/DashboardCharts";

/* ── Static data ─────────────────────────────────────────────────────────── */

const k = metrics.kpis;

/** Needs-attention alert chips — numbers driven by data where available */
const staleCount = metrics.staleLeadsCount ?? 0;
const ALERTS = [
  {
    label: `${staleCount} stale leads`,
    href: "/hub/crm?filter=stale",
    icon: TriangleAlert,
    tone: "red" as const,
  },
  {
    label: "8 missing buyer agreements",
    href: "/hub/buyer-agreements",
    icon: AlertCircle,
    tone: "red" as const,
  },
  {
    label: "3 contract deadlines this week",
    href: "/hub/transactions",
    icon: Calendar,
    tone: "amber" as const,
  },
];

/** 4 KPI tiles — simplified to the four most actionable metrics */
const KPIS = [
  {
    label: "MTD Volume",
    value: "$8.4M",
    delta: { value: "+12% vs last month", dir: "up" as const },
    icon: <TrendingUp className="h-4 w-4" />,
    accent: true,
    href: null,
    chip: null,
  },
  {
    label: "Active Leads",
    value: "47",
    delta: { value: "8 new today", dir: "up" as const },
    icon: <Users className="h-4 w-4" />,
    href: null,
    chip: null,
  },
  {
    label: "Speed to Lead",
    value: `${metrics.speedToLeadMin ?? k.avgResponseMins ?? 4} min`,
    delta: null,
    icon: <Zap className="h-4 w-4" />,
    accent: false,
    href: null,
    chip: { label: "Benchmark: <5 min", tone: "green" as const },
  },
  {
    label: "Stale Leads",
    value: String(metrics.staleLeadsCount ?? 0),
    delta: null,
    icon: <Timer className="h-4 w-4" />,
    accent: false,
    href: "/hub/crm?filter=stale",
    chip: { label: "Need follow-up", tone: "amber" as const },
  },
];

/** Recent activity feed */
const ACTIVITY = [
  {
    text: "New lead from Zillow — Sarah M.",
    sub: "Lake Oswego · buyer inquiry",
    ago: "2m ago",
    dot: "bg-azure",
  },
  {
    text: "Offer accepted on 8457 NW Lakeshore",
    sub: "Listed at $1.15M",
    ago: "18m ago",
    dot: "bg-emerald-500",
  },
  {
    text: "CMA opened by Kim Tran",
    sub: "Lake Oswego lead · viewed 3 pages",
    ago: "2h ago",
    dot: "bg-azure",
  },
  {
    text: "Inspection scheduled for TX-4003",
    sub: "Thursday 9 AM · 2 days away",
    ago: "3h ago",
    dot: "bg-amber-400",
  },
  {
    text: "Buyer agreement signed — Reyes family",
    sub: "Showing confirmed for Saturday",
    ago: "5h ago",
    dot: "bg-emerald-500",
  },
  {
    text: "5-star review from the Harrisons",
    sub: "West Linn · posted on Google",
    ago: "7h ago",
    dot: "bg-emerald-500",
  },
];

/** Lead pipeline stages */
const PIPELINE_STAGES = [
  { label: "New", count: 18, color: "bg-azure" },
  { label: "Contacted", count: 12, color: "bg-azure/70" },
  { label: "Showing", count: 7, color: "bg-azure/50" },
  { label: "Under Contract", count: 4, color: "bg-emerald-500" },
];
const PIPELINE_MAX = 18;

/** Agent leaderboard — this month */
const LEADERBOARD = [
  {
    name: "Jordan Matin",
    initials: "JM",
    photo: "/matin/agents/jordan-matin.jpg",
    closings: 6,
    volume: "$4.2M",
    dom: 22,
    responseTime: "1.8 min",
    highlight: true,
  },
  {
    name: "Joshua Rose",
    initials: "JR",
    photo: null,
    closings: 5,
    volume: "$3.1M",
    dom: 27,
    responseTime: "2.1 min",
    highlight: false,
  },
  {
    name: "Sarah Chen",
    initials: "SC",
    photo: null,
    closings: 4,
    volume: "$2.8M",
    dom: 31,
    responseTime: "4.7 min",
    highlight: false,
  },
  {
    name: "Marcus Webb",
    initials: "MW",
    photo: null,
    closings: 3,
    volume: "$1.9M",
    dom: 35,
    responseTime: "6.3 min",
    highlight: false,
  },
  {
    name: "Keanu Makoa",
    initials: "KM",
    photo: null,
    closings: 2,
    volume: "$1.1M",
    dom: 44,
    responseTime: "11.2 min",
    highlight: false,
  },
];

/** Quick-tool launcher cards */
const TOOLS = [
  { label: "Draft a reply",   href: "/hub/ai/lead-responder", icon: MessageSquareText },
  { label: "Write a listing", href: "/hub/ai/listing-writer", icon: PenSquare         },
  { label: "Run a CMA",       href: "/hub/ai/cma",            icon: Calculator        },
  { label: "New agreement",   href: "/hub/ai/agreements",     icon: FileSignature     },
  { label: "Cash offer eval", href: "/hub/ai/cash-offer",     icon: DollarSign        },
  { label: "Generate a form", href: "/hub/forms",             icon: Database          },
];

const topVolume = agentLeaderboard[0]?.volume || 1;

/** Source ROI table data */
const SOURCE_ROI = metrics.sourceRoi ?? [
  { source: "Google Ads",       leads: 189, closed: 14, revenue: 4900000, spend: 52000  },
  { source: "Facebook Ads",     leads: 88,  closed: 8,  revenue: 2800000, spend: 28000  },
  { source: "Instagram",        leads: 310, closed: 22, revenue: 7700000, spend: 18000  },
  { source: "Zillow",           leads: 98,  closed: 9,  revenue: 3150000, spend: 42000  },
  { source: "Organic / Website",leads: 306, closed: 28, revenue: 9800000, spend: 8000   },
  { source: "Referral",         leads: 193, closed: 31, revenue: 10850000,spend: 0      },
  { source: "Cash Offer Funnel",leads: 47,  closed: 12, revenue: 4200000, spend: 6000   },
];

/** Compute ROI multiple: revenue/spend, or Infinity for $0 spend */
function roiMultiple(revenue: number, spend: number): string {
  if (spend === 0) return "∞";
  return `${(revenue / spend).toFixed(1)}x`;
}

/** Best-ROI row: highest multiple (finite wins over infinite for highlight purposes) */
const bestRoiSource = SOURCE_ROI.reduce<string>((best, row) => {
  const prev = SOURCE_ROI.find((r) => r.source === best);
  if (!prev) return row.source;
  const prevR = prev.spend === 0 ? Infinity : prev.revenue / prev.spend;
  const curR  = row.spend  === 0 ? Infinity : row.revenue  / row.spend;
  // prefer finite best; if both infinite pick first
  if (prevR === Infinity && curR === Infinity) return best;
  if (prevR === Infinity) return best;
  if (curR  === Infinity) return row.source;
  return curR > prevR ? row.source : best;
}, SOURCE_ROI[0]?.source ?? "");

/** Agent speed-to-lead ranking — top 6 by responseTimeMins from agents data */
const RESPONSE_RANKING = [...salesAgents]
  .filter((a) => a.responseTimeMins != null)
  .sort((a, b) => (a.responseTimeMins ?? 99) - (b.responseTimeMins ?? 99))
  .slice(0, 6)
  .map((a) => {
    const mins = a.responseTimeMins ?? 0;
    const status: "fast" | "mid" | "slow" =
      mins < 5 ? "fast" : mins <= 15 ? "mid" : "slow";
    // leadsThisMonth from metrics.agentLeaderboard if available
    const metricsEntry = (metrics.agentLeaderboard ?? []).find(
      (m) => m.slug === a.slug,
    );
    return { ...a, leadsThisMonth: metricsEntry?.leadsThisMonth ?? 0, status };
  });

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function alertChipClass(tone: "amber" | "red" | "blue") {
  if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-700";
  if (tone === "red") return "border-red-200 bg-red-50 text-red-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

/* ── Tab types ───────────────────────────────────────────────────────────── */

type Tab = "overview" | "team" | "analytics";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview",   label: "Overview"  },
  { id: "team",       label: "Team"      },
  { id: "analytics",  label: "Analytics" },
];

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("overview");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 md:px-6 md:py-8">

      {/* ── Header (always visible) ───────────────────────────────────────── */}
      <div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-xl text-ink sm:text-2xl md:text-3xl">
              Good morning, Jordan.
            </h1>
            <p className="mt-0.5 text-[0.85rem] text-slate/60">{today}</p>
          </div>
          {/* Follow-up chip */}
          <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[0.78rem] font-semibold text-amber-700 sm:self-auto">
            <TriangleAlert className="h-3.5 w-3.5" />
            8 leads need follow-up today
          </span>
        </div>

        {/* Needs-attention chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {ALERTS.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80",
                  alertChipClass(a.tone),
                ].join(" ")}
              >
                <Icon className="h-3 w-3 shrink-0" />
                {a.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-ink/[0.08] mb-6">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={[
              "px-4 py-2.5 text-[0.88rem] font-medium rounded-t-lg transition-colors",
              tab === id
                ? "text-ink border-b-2 border-ink -mb-px"
                : "text-slate/60 hover:text-ink",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* KPI tiles (2x2 → 4x1) */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {KPIS.map((kpi) => {
              const inner = (
                <div
                  key={kpi.label}
                  className={[
                    "flex flex-col rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-[0_1px_4px_rgb(0,0,0,0.05)] transition-all",
                    kpi.href ? "hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-lift cursor-pointer" : "",
                  ].join(" ")}
                >
                  {/* Icon + label */}
                  <div className="flex items-center justify-between">
                    <span className="text-[0.7rem] font-bold uppercase tracking-wider text-slate/60">
                      {kpi.label}
                    </span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink/[0.05] text-slate/60">
                      {kpi.icon}
                    </span>
                  </div>
                  {/* Value */}
                  <span className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
                    {kpi.value}
                  </span>
                  {/* Delta or chip */}
                  {kpi.delta ? (
                    <span
                      className={[
                        "mt-3 inline-flex items-center gap-1 self-start rounded-full px-2 py-0.5 text-xs font-semibold",
                        kpi.delta.dir === "up"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700",
                      ].join(" ")}
                    >
                      <TrendingUp className="h-3 w-3" />
                      {kpi.delta.value}
                    </span>
                  ) : kpi.chip ? (
                    <span
                      className={[
                        "mt-3 inline-flex items-center gap-1 self-start rounded-full px-2 py-0.5 text-xs font-semibold",
                        kpi.chip.tone === "green"
                          ? "bg-emerald-50 text-emerald-700"
                          : kpi.chip.tone === "amber"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600",
                      ].join(" ")}
                    >
                      {kpi.chip.label}
                    </span>
                  ) : null}
                </div>
              );
              return kpi.href ? (
                <Link key={kpi.label} href={kpi.href} className="block">
                  {inner}
                </Link>
              ) : (
                <div key={kpi.label}>{inner}</div>
              );
            })}
          </div>

          {/* Speed-to-Lead panel + Stale Leads alert — 2-col */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Speed-to-Lead */}
            <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-[0_1px_4px_rgb(0,0,0,0.05)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-[1.05rem] font-semibold text-ink">
                    <Zap className="h-4 w-4 text-slate/40" />
                    Speed to Lead
                  </h2>
                  <p className="mt-0.5 text-[0.73rem] text-slate/50">
                    Industry benchmark: &lt;5 minutes
                  </p>
                </div>
                <Link href="/hub/reporting" className="text-[0.74rem] font-semibold text-azure hover:opacity-70">
                  Full report
                </Link>
              </div>
              {/* Big number */}
              <div className="mb-4 flex items-end gap-3">
                <span className={[
                  "font-display text-5xl font-bold tabular-nums",
                  (metrics.speedToLeadMin ?? k.avgResponseMins ?? 4) < 5
                    ? "text-emerald-600"
                    : (metrics.speedToLeadMin ?? k.avgResponseMins ?? 4) <= 10
                    ? "text-amber-600"
                    : "text-red-600",
                ].join(" ")}>
                  {metrics.speedToLeadMin ?? k.avgResponseMins ?? 4} min
                </span>
                <span className="mb-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.72rem] font-semibold text-emerald-700">
                  Team avg
                </span>
              </div>
              {/* Mini leaderboard — top 3 by response time */}
              <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-wider text-slate/40">
                Top responders
              </p>
              <div className="space-y-2.5">
                {RESPONSE_RANKING.slice(0, 3).map((agent, i) => (
                  <div key={agent.slug} className="flex items-center gap-3">
                    <span className={[
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.68rem] font-bold",
                      i === 0 ? "bg-amber-100 text-amber-700" : "bg-ink/[0.05] text-slate/60",
                    ].join(" ")}>
                      {i + 1}
                    </span>
                    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-ink/[0.06]">
                      {agent.photo ? (
                        <Image
                          src={agent.photo}
                          alt={agent.name}
                          fill
                          sizes="28px"
                          className="object-cover object-top"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[0.62rem] font-semibold text-ink/60">
                          {agent.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <span className="flex-1 text-[0.83rem] font-medium text-ink">{agent.name}</span>
                    <span className={[
                      "text-[0.78rem] font-semibold tabular-nums",
                      (agent.responseTimeMins ?? 99) < 5 ? "text-emerald-600" : (agent.responseTimeMins ?? 99) <= 15 ? "text-amber-600" : "text-red-600",
                    ].join(" ")}>
                      {agent.responseTimeMins ?? "—"} min
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stale Leads alert panel */}
            <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 shadow-[0_1px_4px_rgb(0,0,0,0.04)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-[1.05rem] font-semibold text-ink">
                  <Timer className="h-4 w-4 text-red-500" />
                  Stale Leads
                </h2>
              </div>
              {/* Big badge */}
              <div className="mb-4 flex items-center gap-3">
                <span className="font-display text-5xl font-bold tabular-nums text-red-600">
                  {metrics.staleLeadsCount ?? 0}
                </span>
                <span className="rounded-full border border-red-200 bg-red-100 px-2.5 py-0.5 text-[0.75rem] font-semibold text-red-700">
                  need attention
                </span>
              </div>
              <p className="mb-4 text-[0.82rem] text-slate/60">
                Leads with no contact for more than 7 days. Each day without contact reduces close probability.
              </p>
              <Link
                href="/hub/crm?filter=stale"
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-[0.82rem] font-semibold text-red-700 transition-colors hover:bg-red-50"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                View stale leads
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Source ROI panel */}
          <div className="rounded-2xl border border-ink/[0.08] bg-white shadow-[0_1px_4px_rgb(0,0,0,0.05)]">
            <div className="flex items-center justify-between border-b border-ink/[0.06] px-5 py-4">
              <div>
                <h2 className="font-display text-[1.05rem] font-semibold text-ink">
                  Source ROI
                </h2>
                <p className="mt-0.5 text-[0.73rem] text-slate/50">
                  Leads, closings, and revenue by marketing channel
                </p>
              </div>
              <Link href="/hub/analytics?tab=marketing" className="text-[0.74rem] font-semibold text-azure hover:opacity-70">
                Full breakdown
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-ink/[0.05]">
                    <th className="px-5 py-3 text-left text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">Source</th>
                    <th className="px-3 py-3 text-center text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">Leads</th>
                    <th className="px-3 py-3 text-center text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">Closed</th>
                    <th className="px-5 py-3 text-right text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {SOURCE_ROI.map((row) => (
                    <tr key={row.source} className="border-b border-ink/[0.05] text-sm last:border-0 hover:bg-paper/50">
                      <td className="px-5 py-3 font-medium text-ink">{row.source}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="rounded-full bg-ink/[0.05] px-2 py-0.5 text-[0.72rem] font-medium text-ink">
                          {row.leads}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums text-slate">{row.closed}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-semibold text-ink">
                        {compactUsd(row.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Tools */}
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

          {/* Activity feed + Lead pipeline */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Recent activity */}
            <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-[0_1px_4px_rgb(0,0,0,0.05)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-[1.05rem] font-semibold text-ink">
                  <Activity className="h-4 w-4 text-slate/50" />
                  Recent activity
                </h2>
                <Link
                  href="/hub/crm"
                  className="text-[0.75rem] font-semibold text-azure hover:opacity-70"
                >
                  View all
                </Link>
              </div>
              <ul className="space-y-3">
                {ACTIVITY.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className={[
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        item.dot,
                      ].join(" ")}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-ink">{item.text}</p>
                      <p className="mt-0.5 text-[0.72rem] text-slate/55">{item.sub}</p>
                    </div>
                    <span className="shrink-0 text-[0.68rem] text-slate/40">{item.ago}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Lead pipeline */}
            <div className="rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-[0_1px_4px_rgb(0,0,0,0.05)]">
              <div className="mb-4">
                <h2 className="font-display text-[1.05rem] font-semibold text-ink">
                  Lead pipeline
                </h2>
                <p className="mt-0.5 text-[0.75rem] text-slate/50">Active leads by stage</p>
              </div>
              <div className="space-y-4">
                {PIPELINE_STAGES.map((stage) => (
                  <div key={stage.label}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[0.83rem] font-medium text-ink">{stage.label}</span>
                      <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[0.72rem] font-semibold text-ink">
                        {stage.count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-ink/[0.06]">
                      <div
                        className={["h-full rounded-full transition-all", stage.color].join(" ")}
                        style={{ width: `${(stage.count / PIPELINE_MAX) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Pipeline total */}
              <div className="mt-5 flex items-center justify-between border-t border-ink/[0.06] pt-4">
                <span className="text-[0.75rem] text-slate/55">Total in pipeline</span>
                <span className="font-display text-lg font-semibold text-ink">
                  {PIPELINE_STAGES.reduce((s, st) => s + st.count, 0)} leads
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Team ────────────────────────────────────────────────────── */}
      {tab === "team" && (
        <div className="space-y-6">
          {/* Team leaderboard */}
          <div className="rounded-2xl border border-ink/[0.08] bg-white shadow-[0_1px_4px_rgb(0,0,0,0.05)]">
            <div className="flex items-center justify-between border-b border-ink/[0.06] px-5 py-4">
              <div>
                <h2 className="font-display text-[1.05rem] font-semibold text-ink">
                  Team leaderboard &mdash; this month
                </h2>
                <p className="mt-0.5 text-[0.73rem] text-slate/50">Top producers by closed volume</p>
              </div>
              <Link
                href="/hub/reporting"
                className="text-[0.74rem] font-semibold text-azure hover:opacity-70"
              >
                Full report
              </Link>
            </div>
            {LEADERBOARD.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
                <Users className="h-8 w-8 text-slate/30" />
                <p className="text-[0.88rem] text-slate">No leaderboard data this month yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="border-b border-ink/[0.05]">
                      <th className="px-5 py-3 text-left text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                        Rank
                      </th>
                      <th className="px-3 py-3 text-left text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                        Agent
                      </th>
                      <th className="px-3 py-3 text-right text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                        Closings
                      </th>
                      <th className="px-3 py-3 text-right text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                        Volume
                      </th>
                      <th className="px-3 py-3 text-right text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                        Avg DOM
                      </th>
                      <th className="px-5 py-3 text-right text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                        Response
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {LEADERBOARD.map((agent, i) => (
                      <tr
                        key={agent.name}
                        className={[
                          "border-b border-ink/[0.05] text-sm transition-colors last:border-0",
                          agent.highlight
                            ? "bg-azure/[0.04]"
                            : "hover:bg-paper/60",
                        ].join(" ")}
                      >
                        <td className="px-5 py-3 text-center">
                          <span
                            className={[
                              "font-display text-base",
                              agent.highlight ? "font-bold text-azure" : "text-slate/50",
                            ].join(" ")}
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-ink/[0.06]">
                              {agent.photo ? (
                                <Image
                                  src={agent.photo}
                                  alt={agent.name}
                                  fill
                                  sizes="32px"
                                  className="object-cover object-top"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-[0.68rem] font-semibold text-ink/60">
                                  {agent.initials}
                                </span>
                              )}
                            </div>
                            <span
                              className={[
                                "text-[0.85rem]",
                                agent.highlight ? "font-bold text-ink" : "font-medium text-ink",
                              ].join(" ")}
                            >
                              {agent.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate">
                          {agent.closings}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums font-semibold text-ink">
                          {agent.volume}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate">
                          {agent.dom} days
                        </td>
                        <td
                          className={[
                            "px-5 py-3 text-right tabular-nums text-[0.82rem] font-semibold",
                            parseFloat(agent.responseTime) < 5 ? "text-emerald-600" : "text-slate",
                          ].join(" ")}
                        >
                          {agent.responseTime}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Agent Response Time Ranking */}
          <div className="rounded-2xl border border-ink/[0.08] bg-white shadow-[0_1px_4px_rgb(0,0,0,0.05)]">
            <div className="flex items-center justify-between border-b border-ink/[0.06] px-5 py-4">
              <div>
                <h2 className="font-display text-[1.05rem] font-semibold text-ink">
                  Response time ranking
                </h2>
                <p className="mt-0.5 text-[0.73rem] text-slate/50">
                  Top 6 agents by speed-to-lead &mdash; goal: under 5 minutes
                </p>
              </div>
              <Link
                href="/hub/reporting"
                className="text-[0.74rem] font-semibold text-azure hover:opacity-70"
              >
                Full report
              </Link>
            </div>
            {RESPONSE_RANKING.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
                <Clock className="h-8 w-8 text-slate/30" />
                <p className="text-[0.88rem] text-slate">No response time data available yet.</p>
                <p className="text-[0.76rem] text-slate/55">Data will appear once agents start receiving leads.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr className="border-b border-ink/[0.05]">
                      <th className="px-5 py-3 text-left text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                        Agent
                      </th>
                      <th className="px-3 py-3 text-right text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                        Avg Response
                      </th>
                      <th className="px-3 py-3 text-right text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                        Leads Today
                      </th>
                      <th className="px-5 py-3 text-right text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {RESPONSE_RANKING.map((agent) => (
                      <tr
                        key={agent.slug}
                        className="border-b border-ink/[0.05] text-sm transition-colors last:border-0 hover:bg-paper/60"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-ink/[0.06]">
                              {agent.photo ? (
                                <Image
                                  src={agent.photo}
                                  alt={agent.name}
                                  fill
                                  sizes="32px"
                                  className="object-cover object-top"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-[0.68rem] font-semibold text-ink/60">
                                  {agent.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                </span>
                              )}
                            </div>
                            <span className="text-[0.85rem] font-medium text-ink">
                              {agent.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums font-semibold text-ink">
                          {agent.responseTimeMins} min
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate">
                          {agent.leadsThisMonth}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span
                            className={[
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold",
                              agent.status === "fast"
                                ? "bg-emerald-50 text-emerald-700"
                                : agent.status === "mid"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700",
                            ].join(" ")}
                          >
                            {agent.status === "fast"
                              ? "< 5 min"
                              : agent.status === "mid"
                              ? "5–15 min"
                              : "> 15 min"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Analytics ───────────────────────────────────────────────── */}
      {tab === "analytics" && (
        <div className="space-y-6">
          {/* Sales Volume area chart + Lead Sources */}
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

          {/* Pipeline by Stage + Conversion Funnel */}
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

          {/* Marketing ROI chart */}
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

          {/* Source ROI table */}
          <div className="rounded-2xl border border-ink/[0.08] bg-white shadow-[0_1px_4px_rgb(0,0,0,0.05)]">
            <div className="flex items-center justify-between border-b border-ink/[0.06] px-5 py-4">
              <div>
                <h2 className="font-display text-[1.05rem] font-semibold text-ink">
                  Source ROI &mdash; this month
                </h2>
                <p className="mt-0.5 text-[0.73rem] text-slate/50">
                  Revenue generated vs. marketing spend per channel
                </p>
              </div>
            </div>
            {SOURCE_ROI.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
                <TrendingUp className="h-8 w-8 text-slate/30" />
                <p className="text-[0.88rem] text-slate">No marketing channel data available yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-ink/[0.05]">
                      <th className="px-5 py-3 text-left text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                        Channel
                      </th>
                      <th className="px-3 py-3 text-center text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                        Leads
                      </th>
                      <th className="px-3 py-3 text-center text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                        Closed
                      </th>
                      <th className="px-3 py-3 text-right text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                        Revenue
                      </th>
                      <th className="px-3 py-3 text-right text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                        Spend
                      </th>
                      <th className="px-5 py-3 text-right text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                        ROI
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {SOURCE_ROI.map((row) => {
                      const isBest = row.source === bestRoiSource;
                      return (
                        <tr
                          key={row.source}
                          className={[
                            "border-b border-ink/[0.05] text-sm last:border-0 transition-colors",
                            isBest ? "bg-emerald-50/50" : "hover:bg-paper/60",
                          ].join(" ")}
                        >
                          <td className="px-5 py-3">
                            <span className="font-medium text-ink">{row.source}</span>
                            {isBest && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[0.62rem] font-semibold text-emerald-700">
                                Best ROI
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="rounded-full bg-ink/[0.05] px-2 py-0.5 text-[0.72rem] font-medium text-ink">
                              {row.leads}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center tabular-nums text-slate">
                            {row.closed}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums font-semibold text-ink">
                            {compactUsd(row.revenue)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-slate">
                            {row.spend === 0 ? (
                              <span className="font-semibold text-emerald-600">Organic</span>
                            ) : (
                              usd(row.spend)
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span
                              className={[
                                "font-display font-semibold tabular-nums",
                                row.spend === 0
                                  ? "text-emerald-600"
                                  : row.revenue / row.spend >= 100
                                  ? "text-emerald-600"
                                  : row.revenue / row.spend >= 50
                                  ? "text-ink"
                                  : "text-slate",
                              ].join(" ")}
                            >
                              {roiMultiple(row.revenue, row.spend)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Footer (always visible) ───────────────────────────────────────── */}
      <p className="pb-2 text-center text-[0.72rem] text-slate/45">
        {company.name} &middot; {company.stats.annualVolume} annual volume &middot;{" "}
        {company.stats.agents} agents &middot; {usd(metrics.kpis.pipelineValue)} active pipeline
      </p>
    </div>
  );
}
