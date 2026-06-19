"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Home,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { metrics, salesAgents } from "@/lib/data";
import { compactUsd, usd, num } from "@/lib/utils";
import { Panel, PanelHeader, StatTile } from "@/components/command/ui";
import {
  VolumeAreaChart,
  LeadsBySourceChart,
  PipelineByStageChart,
  ConversionFunnelChart,
  SourceRoiChart,
} from "@/components/command/DashboardCharts";

/* ── Types ───────────────────────────────────────────────────────────────── */

type Tab = "overview" | "pipeline" | "agents" | "marketing";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "pipeline", label: "Pipeline" },
  { id: "agents", label: "Agents" },
  { id: "marketing", label: "Marketing" },
];

/* ── Computed data ───────────────────────────────────────────────────────── */

// GCI YTD: sum of all revenue from sourceRoi as a proxy, or derive from volume
const totalRevenue = (metrics.sourceRoi ?? []).reduce((s, r) => s + r.revenue, 0);
const totalLeads = (metrics.sourceRoi ?? []).reduce((s, r) => s + r.leads, 0);
const totalClosed = (metrics.sourceRoi ?? []).reduce((s, r) => s + r.closed, 0);
const totalSpend = (metrics.sourceRoi ?? []).reduce((s, r) => s + r.spend, 0);
const conversionRate = totalLeads > 0 ? ((totalClosed / totalLeads) * 100).toFixed(1) : "0.0";

// Avg sale price from volume data
const totalVolume = metrics.volumeByMonth.reduce((s, m) => s + m.volume, 0);
const totalClosings = metrics.volumeByMonth.reduce((s, m) => s + m.closings, 0);
const avgSalePrice = totalClosings > 0 ? Math.round(totalVolume / totalClosings) : 0;

// Pipeline funnel with conversion rates between stages
const FUNNEL = metrics.funnel.map((stage, i) => {
  const prev = metrics.funnel[i - 1];
  const convFromPrev = prev && prev.count > 0 ? ((stage.count / prev.count) * 100).toFixed(0) : null;
  return { ...stage, convFromPrev };
});

// Agent table data — merge agents.json with metrics.agentLeaderboard
type AgentSortKey = "name" | "volume" | "homesSold" | "dom" | "responseTimeMins" | "rating";

const AGENT_ROWS = salesAgents
  .filter((a) => a.responseTimeMins != null)
  .map((a) => {
    const mEntry = (metrics.agentLeaderboard ?? []).find((m) => m.slug === a.slug);
    const responseMins = a.responseTimeMins ?? 0;
    const responseStatus: "fast" | "mid" | "slow" =
      responseMins < 5 ? "fast" : responseMins <= 15 ? "mid" : "slow";
    return {
      slug: a.slug,
      name: a.name,
      photo: a.photo,
      volume: a.volume,
      homesSold: a.homesSold,
      dom: Math.round(a.homesSold > 0 ? 21 + (a.rank ?? 20) * 0.4 : 28), // estimated from rank
      responseTimeMins: responseMins,
      responseStatus,
      rating: a.rating,
      leadsThisMonth: mEntry?.leadsThisMonth ?? 0,
      apptRate: mEntry?.apptRate ?? 0,
    };
  });

// Source ROI — extended with cost-per-lead
const SOURCE_ROI_EXT = (metrics.sourceRoi ?? []).map((row) => ({
  ...row,
  cpl: row.spend === 0 ? 0 : Math.round(row.spend / row.leads),
  convRate: row.leads > 0 ? ((row.closed / row.leads) * 100).toFixed(1) : "0.0",
  roiMultiple: row.spend === 0 ? null : row.revenue / row.spend,
}));

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function responseColor(status: "fast" | "mid" | "slow") {
  if (status === "fast") return "text-emerald-700 bg-emerald-50";
  if (status === "mid") return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

function responseLabel(mins: number) {
  if (mins < 5) return "< 5 min";
  if (mins <= 15) return "5–15 min";
  return "> 15 min";
}

/* ── Sort hook ───────────────────────────────────────────────────────────── */

function useSortedAgents() {
  const [sortKey, setSortKey] = useState<AgentSortKey>("volume");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: AgentSortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...AGENT_ROWS].sort((a, b) => {
    const av = a[sortKey] as number | string;
    const bv = b[sortKey] as number | string;
    if (typeof av === "string" && typeof bv === "string") {
      return sortDir === "desc" ? bv.localeCompare(av) : av.localeCompare(bv);
    }
    const an = av as number;
    const bn = bv as number;
    return sortDir === "desc" ? bn - an : an - bn;
  });

  return { sorted, sortKey, sortDir, handleSort };
}

/* ── Sortable column header ──────────────────────────────────────────────── */

function SortTh({
  label,
  colKey,
  current,
  dir,
  onSort,
  align = "right",
}: {
  label: string;
  colKey: AgentSortKey;
  current: AgentSortKey;
  dir: "asc" | "desc";
  onSort: (k: AgentSortKey) => void;
  align?: "left" | "right";
}) {
  const active = colKey === current;
  return (
    <th
      className={`cursor-pointer select-none px-3 py-3 text-[0.7rem] font-bold uppercase tracking-wider text-slate/50 transition-colors hover:text-ink ${align === "right" ? "text-right" : "text-left"}`}
      onClick={() => onSort(colKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="inline-flex flex-col">
          <ChevronUp
            className={`-mb-0.5 h-2.5 w-2.5 ${active && dir === "asc" ? "text-ink" : "text-slate/30"}`}
          />
          <ChevronDown
            className={`h-2.5 w-2.5 ${active && dir === "desc" ? "text-ink" : "text-slate/30"}`}
          />
        </span>
      </span>
    </th>
  );
}

/* ── Overview KPI tiles ──────────────────────────────────────────────────── */

const OVERVIEW_KPIS = [
  {
    label: "GCI YTD",
    value: compactUsd(totalRevenue),
    delta: { value: "+18.4%", dir: "up" as const },
    icon: <DollarSign className="h-4 w-4" />,
    hint: "Gross commission income",
    accent: true,
  },
  {
    label: "Listings Taken",
    value: "94",
    delta: { value: "+7", dir: "up" as const },
    icon: <Home className="h-4 w-4" />,
    hint: "YTD vs prior year",
  },
  {
    label: "Buyer Closings",
    value: String(totalClosed),
    delta: { value: "+12%", dir: "up" as const },
    icon: <Users className="h-4 w-4" />,
    hint: "Closed buyer-side transactions",
  },
  {
    label: "Cash Offers Closed",
    value: "12",
    delta: { value: "4.2% of volume", dir: "flat" as const },
    icon: <BarChart3 className="h-4 w-4" />,
    hint: "Via cash offer funnel",
  },
  {
    label: "Avg Sale Price",
    value: compactUsd(avgSalePrice),
    delta: { value: "+3.1%", dir: "up" as const },
    icon: <TrendingUp className="h-4 w-4" />,
    hint: "Closed transactions YTD",
  },
  {
    label: "Conversion Rate",
    value: `${conversionRate}%`,
    delta: { value: "+1.2pt", dir: "up" as const },
    icon: <Target className="h-4 w-4" />,
    hint: "Lead to closed ratio",
  },
];

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const { sorted, sortKey, sortDir, handleSort } = useSortedAgents();

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 md:px-6 md:py-8">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          Analytics
        </h1>
        <p className="mt-1 text-[0.85rem] text-slate/60">
          Brokerage performance — YTD · updated daily
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-ink/[0.08]">
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

      {/* ── Overview ──────────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* 6 KPI tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {OVERVIEW_KPIS.map((kpi) => (
              <StatTile
                key={String(kpi.label)}
                label={kpi.label}
                value={kpi.value}
                delta={kpi.delta}
                icon={kpi.icon}
                hint={kpi.hint}
                accent={kpi.accent}
              />
            ))}
          </div>

          {/* Volume trend + Leads by source */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Panel className="lg:col-span-2">
              <PanelHeader
                title="Sales Volume"
                subtitle="Trailing 12 months — closed volume"
                icon={<TrendingUp className="h-4 w-4" />}
                action={
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[0.72rem] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
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
                icon={<Users className="h-4 w-4" />}
              />
              <div className="h-64 px-3 py-4">
                <LeadsBySourceChart />
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ── Pipeline ──────────────────────────────────────────────────────── */}
      {tab === "pipeline" && (
        <div className="space-y-6">
          {/* Pipeline summary tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {metrics.pipelineByStage.filter((s) => ["Active", "Pending", "Clear to Close", "Closed"].includes(s.stage)).map((s) => (
              <StatTile
                key={s.stage}
                label={s.stage}
                value={compactUsd(s.value)}
                hint={`${s.deals} deal${s.deals !== 1 ? "s" : ""}`}
                icon={<DollarSign className="h-4 w-4" />}
              />
            ))}
          </div>

          {/* Pipeline by stage chart */}
          <Panel>
            <PanelHeader
              title="Pipeline by Stage"
              subtitle="Open deal value across all stages"
              icon={<DollarSign className="h-4 w-4" />}
            />
            <div className="h-72 px-3 py-4">
              <PipelineByStageChart />
            </div>
          </Panel>

          {/* Conversion funnel with drop-off rates */}
          <Panel>
            <PanelHeader
              title="Conversion Funnel"
              subtitle="Leads through to closed — last 12 months"
              icon={<Target className="h-4 w-4" />}
            />
            <div className="grid grid-cols-1 gap-0 divide-y divide-ink/[0.05] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              {/* Funnel chart */}
              <div className="h-72 px-3 py-4">
                <ConversionFunnelChart />
              </div>
              {/* Stage breakdown table */}
              <div className="px-5 py-4">
                <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                  Stage breakdown
                </p>
                <div className="space-y-3">
                  {FUNNEL.map((stage, i) => {
                    const top = FUNNEL[0]?.count || 1;
                    const pct = Math.round((stage.count / top) * 100);
                    return (
                      <div key={stage.stage}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[0.83rem] font-medium text-ink">
                            {stage.stage}
                          </span>
                          <div className="flex items-center gap-3">
                            {stage.convFromPrev && (
                              <span className="text-[0.72rem] text-slate/50">
                                {stage.convFromPrev}% from prev
                              </span>
                            )}
                            <span className="w-12 text-right font-display text-[0.88rem] font-semibold text-ink tabular-nums">
                              {num(stage.count)}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                          <div
                            className="h-full rounded-full bg-ink transition-all"
                            style={{ width: `${pct}%`, opacity: 1 - i * 0.13 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Summary */}
                <div className="mt-4 rounded-xl border border-ink/[0.06] bg-paper p-3">
                  <p className="text-[0.72rem] text-slate/50">Overall conversion</p>
                  <p className="mt-0.5 font-display text-xl font-semibold text-ink">
                    {conversionRate}%
                  </p>
                  <p className="text-[0.72rem] text-slate/50">
                    {num(FUNNEL[0]?.count ?? 0)} leads → {num(FUNNEL[FUNNEL.length - 1]?.count ?? 0)} closed
                  </p>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* ── Agents ────────────────────────────────────────────────────────── */}
      {tab === "agents" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-ink/[0.08] bg-white shadow-[0_1px_4px_rgb(0,0,0,0.05)]">
            <div className="flex items-center justify-between border-b border-ink/[0.06] px-5 py-4">
              <div>
                <h2 className="font-display text-[1.05rem] font-semibold text-ink">
                  Agent production
                </h2>
                <p className="mt-0.5 text-[0.73rem] text-slate/50">
                  Click column headers to sort — response time colored by benchmark
                </p>
              </div>
              <span className="text-[0.72rem] text-slate/40">
                {sorted.length} agents
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px]">
                <thead>
                  <tr className="border-b border-ink/[0.05]">
                    <th className="px-5 py-3 text-left text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                      Agent
                    </th>
                    <SortTh label="GCI / Volume" colKey="volume" current={sortKey} dir={sortDir} onSort={handleSort} />
                    <SortTh label="Closings" colKey="homesSold" current={sortKey} dir={sortDir} onSort={handleSort} />
                    <SortTh label="Avg DOM" colKey="dom" current={sortKey} dir={sortDir} onSort={handleSort} />
                    <SortTh label="Response" colKey="responseTimeMins" current={sortKey} dir={sortDir} onSort={handleSort} />
                    <SortTh label="Rating" colKey="rating" current={sortKey} dir={sortDir} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((agent) => (
                    <tr
                      key={agent.slug}
                      className="group border-b border-ink/[0.05] text-sm transition-colors last:border-0 hover:bg-paper/70"
                    >
                      {/* Agent name */}
                      <td className="px-5 py-3">
                        <Link
                          href={`/hub/agent?slug=${agent.slug}`}
                          className="flex items-center gap-2.5 hover:opacity-80"
                        >
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
                          <span className="font-medium text-ink group-hover:underline">
                            {agent.name}
                          </span>
                          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate/30 opacity-0 group-hover:opacity-100" />
                        </Link>
                      </td>
                      {/* Volume */}
                      <td className="px-3 py-3 text-right tabular-nums font-semibold text-ink">
                        {compactUsd(agent.volume)}
                      </td>
                      {/* Closings */}
                      <td className="px-3 py-3 text-right tabular-nums text-slate">
                        {agent.homesSold}
                      </td>
                      {/* Avg DOM */}
                      <td className="px-3 py-3 text-right tabular-nums text-slate">
                        {agent.dom}d
                      </td>
                      {/* Response time — color coded */}
                      <td className="px-3 py-3 text-right">
                        <span
                          className={[
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold",
                            responseColor(agent.responseStatus),
                          ].join(" ")}
                        >
                          {agent.responseTimeMins} min
                        </span>
                      </td>
                      {/* Rating */}
                      <td className="px-3 py-3 text-right tabular-nums text-slate">
                        {agent.rating.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 border-t border-ink/[0.05] px-5 py-3">
              <p className="text-[0.7rem] text-slate/50">Response time:</p>
              {(["fast", "mid", "slow"] as const).map((s) => (
                <span key={s} className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.68rem] font-semibold ${responseColor(s)}`}>
                  {responseLabel(s === "fast" ? 2 : s === "mid" ? 10 : 20)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Marketing ─────────────────────────────────────────────────────── */}
      {tab === "marketing" && (
        <div className="space-y-6">
          {/* Summary tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Total Spend"
              value={compactUsd(totalSpend)}
              icon={<DollarSign className="h-4 w-4" />}
              hint="Across all paid channels"
              delta={{ value: "-8% vs last qtr", dir: "down" }}
            />
            <StatTile
              label="Leads Generated"
              value={num(totalLeads)}
              icon={<Users className="h-4 w-4" />}
              hint="All sources combined"
              delta={{ value: "+14%", dir: "up" }}
            />
            <StatTile
              label="Revenue Closed"
              value={compactUsd(totalRevenue)}
              icon={<TrendingUp className="h-4 w-4" />}
              hint="From marketing-attributed closes"
              delta={{ value: "+22%", dir: "up" }}
              accent
            />
            <StatTile
              label="Blended CPL"
              value={totalLeads > 0 && totalSpend > 0 ? `$${Math.round(totalSpend / totalLeads)}` : "—"}
              icon={<Target className="h-4 w-4" />}
              hint="Cost per lead, all channels"
            />
          </div>

          {/* ROI chart */}
          <Panel>
            <PanelHeader
              title="Marketing ROI by Channel"
              subtitle="Spend vs. revenue closed — all channels"
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <div className="h-[280px] px-3 py-4">
              <SourceRoiChart />
            </div>
          </Panel>

          {/* Source breakdown table */}
          <div className="rounded-2xl border border-ink/[0.08] bg-white shadow-[0_1px_4px_rgb(0,0,0,0.05)]">
            <div className="border-b border-ink/[0.06] px-5 py-4">
              <h2 className="font-display text-[1.05rem] font-semibold text-ink">
                Source ROI breakdown
              </h2>
              <p className="mt-0.5 text-[0.73rem] text-slate/50">
                Revenue, cost per lead, and conversion rate by channel
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
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
                    <th className="px-3 py-3 text-center text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                      Conv %
                    </th>
                    <th className="px-3 py-3 text-right text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                      Revenue
                    </th>
                    <th className="px-3 py-3 text-right text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                      Spend
                    </th>
                    <th className="px-3 py-3 text-right text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                      CPL
                    </th>
                    <th className="px-5 py-3 text-right text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                      ROI
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SOURCE_ROI_EXT.map((row) => {
                    const isOrganic = row.spend === 0;
                    return (
                      <tr
                        key={row.source}
                        className="border-b border-ink/[0.05] text-sm last:border-0 transition-colors hover:bg-paper/60"
                      >
                        <td className="px-5 py-3 font-medium text-ink">{row.source}</td>
                        <td className="px-3 py-3 text-center">
                          <span className="rounded-full bg-ink/[0.05] px-2 py-0.5 text-[0.72rem] font-medium text-ink">
                            {row.leads}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center tabular-nums text-slate">
                          {row.closed}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={[
                              "inline-flex items-center gap-0.5 text-[0.78rem] font-semibold tabular-nums",
                              parseFloat(row.convRate) >= 10
                                ? "text-emerald-700"
                                : parseFloat(row.convRate) >= 6
                                ? "text-amber-700"
                                : "text-slate",
                            ].join(" ")}
                          >
                            {parseFloat(row.convRate) >= 10 ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : parseFloat(row.convRate) < 6 ? (
                              <ArrowDownRight className="h-3 w-3" />
                            ) : (
                              <Minus className="h-3 w-3" />
                            )}
                            {row.convRate}%
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums font-semibold text-ink">
                          {compactUsd(row.revenue)}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate">
                          {isOrganic ? (
                            <span className="font-semibold text-emerald-600">Organic</span>
                          ) : (
                            usd(row.spend)
                          )}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate">
                          {isOrganic ? (
                            <span className="font-semibold text-emerald-600">—</span>
                          ) : (
                            `$${row.cpl}`
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {isOrganic ? (
                            <span className="font-display font-semibold text-emerald-600">
                              Organic
                            </span>
                          ) : row.roiMultiple != null ? (
                            <span
                              className={[
                                "font-display font-semibold tabular-nums",
                                row.roiMultiple >= 100
                                  ? "text-emerald-700"
                                  : row.roiMultiple >= 50
                                  ? "text-ink"
                                  : "text-amber-700",
                              ].join(" ")}
                            >
                              {row.roiMultiple.toFixed(1)}x
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr className="border-t-2 border-ink/[0.08] bg-paper/60">
                    <td className="px-5 py-3 text-[0.78rem] font-bold text-ink">Total</td>
                    <td className="px-3 py-3 text-center text-[0.78rem] font-bold tabular-nums text-ink">
                      {num(totalLeads)}
                    </td>
                    <td className="px-3 py-3 text-center text-[0.78rem] font-bold tabular-nums text-ink">
                      {totalClosed}
                    </td>
                    <td className="px-3 py-3 text-center text-[0.78rem] font-bold text-ink">
                      {conversionRate}%
                    </td>
                    <td className="px-3 py-3 text-right text-[0.78rem] font-bold tabular-nums text-ink">
                      {compactUsd(totalRevenue)}
                    </td>
                    <td className="px-3 py-3 text-right text-[0.78rem] font-bold tabular-nums text-ink">
                      {usd(totalSpend)}
                    </td>
                    <td className="px-3 py-3 text-right text-[0.78rem] text-slate/50">—</td>
                    <td className="px-5 py-3 text-right text-[0.78rem] text-slate/50">—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
