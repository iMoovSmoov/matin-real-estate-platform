"use client";

import { useState, useEffect, type ReactNode } from "react";
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
  X,
  Sparkles,
  Loader2,
} from "lucide-react";
import { metrics, agentLeaderboard, salesAgents, company, activities, leads, buyerAgreements } from "@/lib/data";
import { usd, compactUsd, cn } from "@/lib/utils";
import {
  Panel,
  PanelHeader,
  StatTile,
  Pill,
  LiveDot,
  SectionLabel,
} from "@/components/command/ui";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { streamAi } from "@/lib/ai/client";
import {
  VolumeAreaChart,
  LeadsBySourceChart,
  PipelineByStageChart,
  ConversionFunnelChart,
  SourceRoiChart,
} from "@/components/command/DashboardCharts";

/* ── Static data ─────────────────────────────────────────────────────────── */

const k = metrics.kpis;

const staleCount = leads.filter((l) => l.lastContactDaysAgo >= 7 && l.stage !== "Closed").length;
const missingAgreementsCount = buyerAgreements.filter((b) => b.agreementStatus !== "Signed").length;
const ALERTS = [
  {
    label: `${staleCount} stale leads`,
    href: "/hub/crm?filter=stale",
    icon: TriangleAlert,
    tone: "red" as const,
  },
  {
    label: `${missingAgreementsCount} missing buyer agreements`,
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

const KPIS = [
  {
    label: "MTD Volume",
    value: "$8.4M",
    delta: { value: "+12% vs last month", dir: "up" as const },
    icon: <TrendingUp className="h-4 w-4" />,
    accent: true,
    href: null,
    chip: null,
    drillLink: "/hub/reporting",
    drillLabel: "Closed transactions this month",
  },
  {
    label: "Active Leads",
    value: String(leads.filter((l) => l.stage !== "Closed").length),
    delta: {
      value: `${leads.filter((l) => l.createdDaysAgo <= 1).length} new today`,
      dir: "up" as const,
    },
    icon: <Users className="h-4 w-4" />,
    href: null,
    chip: null,
    drillLink: "/hub/crm",
    drillLabel: "All active leads in the CRM",
  },
  {
    label: "Speed to Lead",
    value: `${metrics.speedToLeadMin ?? k.avgResponseMins ?? 4} min`,
    delta: null,
    icon: <Zap className="h-4 w-4" />,
    accent: false,
    href: null,
    chip: { label: "Benchmark: <5 min", tone: "green" as const },
    drillLink: "/hub/reporting",
    drillLabel: "Response time breakdown by agent",
  },
  {
    label: "Stale Leads",
    value: String(staleCount),
    delta: null,
    icon: <Timer className="h-4 w-4" />,
    accent: false,
    href: "/hub/crm?filter=stale",
    chip: { label: "Need follow-up", tone: "amber" as const },
    drillLink: null,
    drillLabel: null,
  },
];

/* Derive activity feed from real activities.json data */
function formatMinsAgo(minsAgo: number): string {
  if (minsAgo < 60) return `${minsAgo}m ago`;
  const hrs = Math.floor(minsAgo / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function activityDot(text: string): string {
  if (text.includes("closed") || text.includes("accepted offer") || text.includes("Clear to Close")) return "bg-emerald-500";
  if (text.includes("showing") || text.includes("Inspection") || text.includes("Financing")) return "bg-amber-400";
  return "bg-azure";
}

function activityType(text: string): "lead" | "transaction" | "activity" {
  if (text.includes("showing") || text.includes("offer") || text.includes("deal") || text.includes("CMA") || text.includes("listed")) return "transaction";
  return "activity";
}

const ACTIVITY = activities.slice(0, 6).map((a) => ({
  text: `${a.agent} ${a.text}`,
  sub: `${a.agent}`,
  ago: formatMinsAgo(a.minsAgo),
  dot: activityDot(a.text),
  type: activityType(a.text),
  link: activityType(a.text) === "transaction" ? "/hub/transactions" : "/hub/crm",
}));

/* Derive pipeline stage counts from real leads data */
const STAGE_CONFIG: { label: string; match: string[]; color: string }[] = [
  { label: "New",            match: ["New"],              color: "bg-azure" },
  { label: "Contacted",      match: ["Active"],           color: "bg-azure/70" },
  { label: "Showing",        match: ["Showing"],          color: "bg-azure/50" },
  { label: "Under Contract", match: ["Under Contract", "Pending", "Closed"], color: "bg-emerald-500" },
];

const PIPELINE_STAGES = STAGE_CONFIG.map(({ label, match, color }) => ({
  label,
  count: leads.filter((l) => match.includes(l.stage)).length,
  color,
}));
const PIPELINE_MAX = Math.max(...PIPELINE_STAGES.map((s) => s.count), 1);

/* Derive leaderboard from real agentLeaderboard data */
const LEADERBOARD = agentLeaderboard.slice(0, 5).map((a, i) => ({
  name: a.name,
  initials: a.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2),
  photo: a.photo ?? null,
  closings: a.homesSold,
  volume: a.volume >= 1_000_000
    ? `$${(a.volume / 1_000_000).toFixed(1)}M`
    : `$${(a.volume / 1_000).toFixed(0)}K`,
  dom: 0,
  responseTime: a.responseTimeMins != null ? `${a.responseTimeMins} min` : "—",
  highlight: i === 0,
}));

const TOOLS = [
  { label: "Draft a reply",   href: "/hub/ai/lead-responder", icon: MessageSquareText },
  { label: "Write a listing", href: "/hub/ai/listing-writer", icon: PenSquare         },
  { label: "Run a CMA",       href: "/hub/ai/cma",            icon: Calculator        },
  { label: "New agreement",   href: "/hub/ai/agreements",     icon: FileSignature     },
  { label: "Cash offer eval", href: "/hub/ai/cash-offer",     icon: DollarSign        },
  { label: "Generate a form", href: "/hub/forms",             icon: Database          },
];

const topVolume = agentLeaderboard[0]?.volume || 1;
void topVolume;

const SOURCE_ROI = metrics.sourceRoi ?? [
  { source: "Google Ads",       leads: 189, closed: 14, revenue: 4900000, spend: 52000  },
  { source: "Facebook Ads",     leads: 88,  closed: 8,  revenue: 2800000, spend: 28000  },
  { source: "Instagram",        leads: 310, closed: 22, revenue: 7700000, spend: 18000  },
  { source: "Zillow",           leads: 98,  closed: 9,  revenue: 3150000, spend: 42000  },
  { source: "Organic / Website",leads: 306, closed: 28, revenue: 9800000, spend: 8000   },
  { source: "Referral",         leads: 193, closed: 31, revenue: 10850000,spend: 0      },
  { source: "Cash Offer Funnel",leads: 47,  closed: 12, revenue: 4200000, spend: 6000   },
];

function roiMultiple(revenue: number, spend: number): string {
  if (spend === 0) return "∞";
  return `${(revenue / spend).toFixed(1)}x`;
}

const bestRoiSource = SOURCE_ROI.reduce<string>((best, row) => {
  const prev = SOURCE_ROI.find((r) => r.source === best);
  if (!prev) return row.source;
  const prevR = prev.spend === 0 ? Infinity : prev.revenue / prev.spend;
  const curR  = row.spend  === 0 ? Infinity : row.revenue  / row.spend;
  if (prevR === Infinity && curR === Infinity) return best;
  if (prevR === Infinity) return best;
  if (curR  === Infinity) return row.source;
  return curR > prevR ? row.source : best;
}, SOURCE_ROI[0]?.source ?? "");

const RESPONSE_RANKING = [...salesAgents]
  .filter((a) => a.responseTimeMins != null)
  .sort((a, b) => (a.responseTimeMins ?? 99) - (b.responseTimeMins ?? 99))
  .slice(0, 6)
  .map((a) => {
    const mins = a.responseTimeMins ?? 0;
    const status: "fast" | "mid" | "slow" =
      mins < 5 ? "fast" : mins <= 15 ? "mid" : "slow";
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

/* ── Onboarding banner — removed (no longer needed) ─────────────────────── */

/* ── SlideOver shell ─────────────────────────────────────────────────────── */

function SlideOver({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-40 bg-ink/30 cursor-default"
        onClick={onClose}
        aria-hidden
      />
      {/* panel — bottom sheet on mobile, right side-panel on sm+ */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:bottom-auto sm:max-h-full sm:w-full sm:max-w-[480px] sm:rounded-none sm:border-l sm:border-ink/[0.08]">
        {/* drag handle (mobile only) */}
        <div className="sticky top-0 flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-ink/20" />
        </div>
        {children}
      </div>
    </>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("overview");

  /* slide-over state */
  const [kpiSlideOver, setKpiSlideOver] = useState<string | null>(null);
  const [roiSlideOver, setRoiSlideOver] = useState<string | null>(null);
  const [pipelineSlideOver, setPipelineSlideOver] = useState<string | null>(null);
  const [activitySlideOver, setActivitySlideOver] = useState<number | null>(null);
  const [agentSlideOver, setAgentSlideOver] = useState<string | null>(null);

  /* AI state */
  const [speedBriefOpen, setSpeedBriefOpen] = useState(false);
  const [aiSpeedOutput, setAiSpeedOutput] = useState("");
  const [teamBriefOpen, setTeamBriefOpen] = useState(false);
  const [teamBrief, setTeamBrief] = useState("");
  const [roiAiOutput, setRoiAiOutput] = useState("");
  const [roiAnalyzing, setRoiAnalyzing] = useState(false);
  const [coachOutput, setCoachOutput] = useState("");
  const [isCoaching, setIsCoaching] = useState(false);
  const [marketingBriefOpen, setMarketingBriefOpen] = useState(false);
  const [marketingBrief, setMarketingBrief] = useState("");

  /* date range for analytics tab */
  const [dateRange, setDateRange] = useState<"month" | "quarter" | "year">("month");

  /* Speed-to-Lead AI brief — fires when panel opens and output is empty */
  useEffect(() => {
    if (speedBriefOpen && !aiSpeedOutput) {
      streamAi(
        {
          tool: "coach",
          input: {
            context: "speed-to-lead-analysis",
            teamAvg: metrics.speedToLeadMin ?? 4,
            benchmark: 5,
            agents: RESPONSE_RANKING.map((a) => ({
              name: a.name,
              mins: a.responseTimeMins,
              status: a.status,
            })),
          },
        },
        (_c, full) => setAiSpeedOutput(full),
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speedBriefOpen]);

  /* Team brief — fires when panel opens and output is empty */
  useEffect(() => {
    if (teamBriefOpen && !teamBrief) {
      streamAi(
        {
          tool: "coach",
          input: {
            context: "team-performance-brief",
            agents: LEADERBOARD.map((a) => ({
              name: a.name,
              closings: a.closings,
              volume: a.volume,
              responseTime: a.responseTime,
            })),
          },
        },
        (_c, full) => setTeamBrief(full),
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamBriefOpen]);

  /* Marketing brief — fires when panel opens and output is empty */
  useEffect(() => {
    if (marketingBriefOpen && !marketingBrief) {
      streamAi(
        {
          tool: "coach",
          input: {
            context: "marketing-roi-analysis",
            sources: SOURCE_ROI.map((r) => ({
              source: r.source,
              leads: r.leads,
              closed: r.closed,
              revenue: r.revenue,
              spend: r.spend,
              roi: roiMultiple(r.revenue, r.spend),
            })),
          },
        },
        (_c, full) => setMarketingBrief(full),
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketingBriefOpen]);

  /* Reset roi AI output when a different channel is opened */
  useEffect(() => {
    setRoiAiOutput("");
    setRoiAnalyzing(false);
  }, [roiSlideOver]);

  /* Reset coach output when a different agent is opened */
  useEffect(() => {
    setCoachOutput("");
    setIsCoaching(false);
  }, [agentSlideOver]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  /* ── Derived data for slide-overs */
  const activeRoiRow = SOURCE_ROI.find((r) => r.source === roiSlideOver) ?? null;
  const activeAgent =
    LEADERBOARD.find((a) => a.name === agentSlideOver) ??
    RESPONSE_RANKING.find((a) => a.name === agentSlideOver) ??
    null;
  const activePipelineStage = PIPELINE_STAGES.find((s) => s.label === pipelineSlideOver) ?? null;
  const activeActivity = activitySlideOver !== null ? ACTIVITY[activitySlideOver] : null;

  /* ── Source ROI table (shared between Overview and Analytics tabs) */
  function SourceRoiTable({ showSpend = false }: { showSpend?: boolean }) {
    return (
      <div className="overflow-x-auto">
        <table className={cn("w-full", showSpend ? "min-w-[640px]" : "min-w-[560px]")}>
          <thead>
            <tr className="border-b border-ink/[0.05]">
              <th className="px-5 py-3 text-left text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                {showSpend ? "Channel" : "Source"}
              </th>
              <th className="px-3 py-3 text-center text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                Leads
              </th>
              <th className="px-3 py-3 text-center text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                Closed
              </th>
              <th className="px-5 py-3 text-right text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                Revenue
              </th>
              {showSpend && (
                <th className="px-3 py-3 text-right text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
                  Spend
                </th>
              )}
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
                  onClick={() => setRoiSlideOver(row.source)}
                  className={cn(
                    "border-b border-ink/[0.05] text-sm last:border-0 cursor-pointer transition-colors",
                    isBest ? "bg-emerald-50/50 hover:bg-emerald-50" : "hover:bg-paper/60",
                  )}
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
                  <td className="px-5 py-3 text-right tabular-nums font-semibold text-ink">
                    {compactUsd(row.revenue)}
                  </td>
                  {showSpend && (
                    <td className="px-3 py-3 text-right tabular-nums text-slate">
                      {row.spend === 0 ? (
                        <span className="font-semibold text-emerald-600">Organic</span>
                      ) : (
                        usd(row.spend)
                      )}
                    </td>
                  )}
                  <td className="px-5 py-3 text-right">
                    <span
                      className={cn(
                        "font-display font-semibold tabular-nums",
                        row.spend === 0
                          ? "text-emerald-600"
                          : row.revenue / row.spend >= 100
                          ? "text-emerald-600"
                          : row.revenue / row.spend >= 50
                          ? "text-ink"
                          : "text-slate",
                      )}
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
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] flex flex-col px-4 md:px-6">

      {/* ── Compact page header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-lg font-semibold text-ink">Command Center</h1>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[0.72rem] font-semibold text-amber-700">
            <TriangleAlert className="h-3 w-3" />
            {leads.filter((l) => l.lastContactDaysAgo >= 7 && l.stage !== "Closed").length} need follow-up
          </span>
        </div>
        <span className="text-[0.75rem] text-slate/50">{today}</span>
      </div>

      {/* ── Needs-attention chips ─────────────────────────────────────────── */}
      <div className="-mx-1 flex overflow-x-auto gap-1.5 pb-1 scrollbar-hide">
        {ALERTS.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className={cn(
                "shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium transition-opacity hover:opacity-80",
                alertChipClass(a.tone),
              )}
            >
              <Icon className="h-2.5 w-2.5 shrink-0" />
              {a.label}
            </Link>
          );
        })}
      </div>

      {/* ── KPI tiles (2×2 grid, always visible above fold) ──────────────── */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {KPIS.map((kpi) => {
          const tileContent = (
            <div
              className={cn(
                "flex flex-col rounded-xl border border-ink/[0.08] bg-white px-4 py-3 shadow-[0_1px_4px_rgb(0,0,0,0.05)] transition-all h-full",
                "hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-lift cursor-pointer",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[0.65rem] font-bold uppercase tracking-widest text-slate/50">
                  {kpi.label}
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ink/[0.05] text-slate/50">
                  {kpi.icon}
                </span>
              </div>
              <span className="mt-2 font-display text-2xl font-semibold text-ink">
                {kpi.value}
              </span>
              {kpi.delta ? (
                <span
                  className={cn(
                    "mt-1.5 inline-flex items-center gap-1 self-start rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold",
                    kpi.delta.dir === "up"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700",
                  )}
                >
                  <TrendingUp className="h-2.5 w-2.5" />
                  {kpi.delta.value}
                </span>
              ) : kpi.chip ? (
                <span
                  className={cn(
                    "mt-1.5 inline-flex items-center gap-1 self-start rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold",
                    kpi.chip.tone === "green"
                      ? "bg-emerald-50 text-emerald-700"
                      : kpi.chip.tone === "amber"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-100 text-slate-600",
                  )}
                >
                  {kpi.chip.label}
                </span>
              ) : null}
            </div>
          );

          if (kpi.href) {
            return (
              <Link key={kpi.label} href={kpi.href} className="block">
                {tileContent}
              </Link>
            );
          }
          return (
            <div
              key={kpi.label}
              role="button"
              tabIndex={0}
              onClick={() => setKpiSlideOver(kpi.label)}
              onKeyDown={(e) => e.key === "Enter" && setKpiSlideOver(kpi.label)}
            >
              {tileContent}
            </div>
          );
        })}
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="mt-3 flex gap-0.5 overflow-x-auto scrollbar-hide border-b border-ink/[0.08]">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "shrink-0 whitespace-nowrap px-4 py-2 text-[0.82rem] font-medium rounded-t-lg transition-colors",
              tab === id
                ? "text-ink border-b-2 border-ink -mb-px"
                : "text-slate/55 hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content (scrollable if needed) ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-4">

      {/* ── Tab: Overview ────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-3 mt-3">
          {/* Speed-to-Lead + Stale Leads — collapsible secondary row */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {/* Speed-to-Lead (compact) */}
            <div className="rounded-xl border border-ink/[0.08] bg-white px-4 py-3 shadow-[0_1px_4px_rgb(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-slate/40" />
                  <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-slate/50">Speed to Lead</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSpeedBriefOpen((prev) => !prev)}
                    className="flex items-center gap-1 text-[0.72rem] font-semibold text-azure hover:opacity-70"
                  >
                    <Sparkles className="h-3 w-3" />
                    AI Brief
                  </button>
                  <Link href="/hub/reporting" className="text-[0.72rem] font-semibold text-azure hover:opacity-70">
                    Report
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-display text-2xl font-bold tabular-nums",
                  (metrics.speedToLeadMin ?? k.avgResponseMins ?? 4) < 5
                    ? "text-emerald-600"
                    : (metrics.speedToLeadMin ?? k.avgResponseMins ?? 4) <= 10
                    ? "text-amber-600"
                    : "text-red-600",
                )}>
                  {metrics.speedToLeadMin ?? k.avgResponseMins ?? 4} min
                </span>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-700">
                  Team avg <LiveDot tone="success" className="ml-0.5" />
                </span>
              </div>
              <div className="mt-2 space-y-1.5">
                {RESPONSE_RANKING.slice(0, 3).map((agent, i) => (
                  <div key={agent.slug} className="flex items-center gap-2">
                    <span className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold",
                      i === 0 ? "bg-amber-100 text-amber-700" : "bg-ink/[0.05] text-slate/60",
                    )}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-[0.78rem] font-medium text-ink truncate">{agent.name}</span>
                    <span className={cn(
                      "text-[0.72rem] font-semibold tabular-nums",
                      (agent.responseTimeMins ?? 99) < 5 ? "text-emerald-600" : (agent.responseTimeMins ?? 99) <= 15 ? "text-amber-600" : "text-red-600",
                    )}>
                      {agent.responseTimeMins ?? "—"} min
                    </span>
                  </div>
                ))}
              </div>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  speedBriefOpen ? "max-h-96 mt-3" : "max-h-0",
                )}
              >
                <div className="pt-3 border-t border-ink/[0.06]">
                  {aiSpeedOutput ? (
                    <AiMarkdown text={aiSpeedOutput} />
                  ) : (
                    <div className="flex items-center gap-2 text-[0.82rem] text-slate/60">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating analysis…
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stale Leads alert panel (compact) */}
            <div className="rounded-xl border border-red-200 bg-red-50/40 px-4 py-3 shadow-[0_1px_4px_rgb(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="h-3.5 w-3.5 text-red-500" />
                <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-slate/50">Stale Leads</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-display text-2xl font-bold tabular-nums text-red-600">
                  {staleCount}
                </span>
                <span className="rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[0.65rem] font-semibold text-red-700">
                  need attention
                </span>
              </div>
              <p className="mb-3 text-[0.75rem] text-slate/60 leading-snug">
                No contact in 7+ days. Each day without follow-up reduces close probability.
              </p>
              <Link
                href="/hub/crm?filter=stale"
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[0.75rem] font-semibold text-red-700 transition-colors hover:bg-red-50"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                View stale leads
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Source ROI panel */}
          <div className="rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_4px_rgb(0,0,0,0.05)]">
            <div className="flex items-center justify-between border-b border-ink/[0.06] px-4 py-3">
              <div>
                <h2 className="text-[0.7rem] font-semibold uppercase tracking-widest text-slate/50">
                  Source ROI
                </h2>
                <p className="mt-0.5 text-[0.72rem] text-slate/50">
                  Click any row for detail
                </p>
              </div>
              <Link href="/hub/analytics?tab=marketing" className="text-[0.72rem] font-semibold text-azure hover:opacity-70">
                Full breakdown
              </Link>
            </div>
            <SourceRoiTable showSpend={false} />
          </div>

          {/* Quick Tools */}
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-slate/50">Quick Tools</span>
              <span className="text-[0.72rem] text-slate/50">Open a tool, get a result.</span>
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
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {/* Recent activity */}
            <div className="rounded-xl border border-ink/[0.08] bg-white p-4 shadow-[0_1px_4px_rgb(0,0,0,0.05)]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-widest text-slate/50">
                  <Activity className="h-3 w-3" />
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
                  <li
                    key={i}
                    onClick={() => setActivitySlideOver(i)}
                    className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg px-2 py-1 -mx-2 hover:bg-paper/60 transition-colors"
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        item.dot,
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-ink">{item.text}</p>
                      <p className="mt-0.5 text-[0.72rem] text-slate/55">{item.sub}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate/40">{item.ago}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Lead pipeline */}
            <div className="rounded-xl border border-ink/[0.08] bg-white p-4 shadow-[0_1px_4px_rgb(0,0,0,0.05)]">
              <div className="mb-3">
                <h2 className="text-[0.7rem] font-semibold uppercase tracking-widest text-slate/50">
                  Lead pipeline
                </h2>
                <p className="mt-0.5 text-[0.72rem] text-slate/50">
                  Click any stage to see details
                </p>
              </div>
              <div className="space-y-4">
                {PIPELINE_STAGES.map((stage) => (
                  <div
                    key={stage.label}
                    role="button"
                    tabIndex={0}
                    onClick={() => setPipelineSlideOver(stage.label)}
                    onKeyDown={(e) => e.key === "Enter" && setPipelineSlideOver(stage.label)}
                    className="cursor-pointer rounded-lg px-1 py-1 -mx-1 hover:bg-paper/60 transition-colors"
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[0.83rem] font-medium text-ink">{stage.label}</span>
                      <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[0.72rem] font-semibold text-ink">
                        {stage.count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-ink/[0.06]">
                      <div
                        className={cn("h-full rounded-full transition-all", stage.color)}
                        style={{ width: `${(stage.count / PIPELINE_MAX) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
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
        <div className="space-y-3 mt-3">
          {/* Team AI brief button + panel */}
          <div>
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setTeamBriefOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-ink/[0.08] bg-white px-4 py-2 text-[0.82rem] font-medium text-ink hover:bg-paper/60 shadow-[0_1px_4px_rgb(0,0,0,0.05)] transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-azure" />
                Team Summary
              </button>
            </div>
            {teamBriefOpen && (
              <div className="rounded-2xl border border-ink/[0.08] bg-white shadow-[0_1px_4px_rgb(0,0,0,0.05)] mb-4">
                <div className="flex items-center justify-between border-b border-ink/[0.06] px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-azure" />
                    <h2 className="font-display text-[1.05rem] font-semibold text-ink">
                      AI Team Brief
                    </h2>
                  </div>
                  <button
                    onClick={() => { setTeamBriefOpen(false); setTeamBrief(""); }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate/50 hover:bg-paper/60 hover:text-ink transition-colors"
                    aria-label="Close team brief"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-5">
                  {teamBrief ? (
                    <AiMarkdown text={teamBrief} />
                  ) : (
                    <div className="flex items-center gap-2 text-[0.82rem] text-slate/60">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating team brief…
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Team leaderboard */}
          <div className="rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_4px_rgb(0,0,0,0.05)]">
            <div className="flex items-center justify-between border-b border-ink/[0.06] px-5 py-3">
              <div>
                <h2 className="text-[0.7rem] font-semibold uppercase tracking-widest text-slate/50">
                  Team leaderboard &mdash; this month
                </h2>
                <p className="mt-0.5 text-[0.72rem] text-slate/50">
                  Top producers by closed volume — click any agent for coaching brief
                </p>
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
                      <th className="sticky left-0 bg-white px-3 py-3 text-left text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
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
                        onClick={() => setAgentSlideOver(agent.name)}
                        className={cn(
                          "border-b border-ink/[0.05] text-sm transition-colors last:border-0 cursor-pointer",
                          agent.highlight
                            ? "bg-azure/[0.04] hover:bg-azure/[0.07]"
                            : "hover:bg-paper/60",
                        )}
                      >
                        <td className="px-5 py-3 text-center">
                          <span
                            className={cn(
                              "font-display text-base",
                              agent.highlight ? "font-bold text-azure" : "text-slate/50",
                            )}
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="sticky left-0 bg-inherit px-3 py-3">
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
                              className={cn(
                                "text-[0.85rem]",
                                agent.highlight ? "font-bold text-ink" : "font-medium text-ink",
                              )}
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
                          className={cn(
                            "px-5 py-3 text-right tabular-nums text-[0.82rem] font-semibold",
                            parseFloat(agent.responseTime) < 5 ? "text-emerald-600" : "text-slate",
                          )}
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
          <div className="rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_4px_rgb(0,0,0,0.05)]">
            <div className="flex items-center justify-between border-b border-ink/[0.06] px-5 py-3">
              <div>
                <h2 className="text-[0.7rem] font-semibold uppercase tracking-widest text-slate/50">
                  Response time ranking
                </h2>
                <p className="mt-0.5 text-[0.72rem] text-slate/50">
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
                      <th className="sticky left-0 bg-white px-5 py-3 text-left text-[0.7rem] font-bold uppercase tracking-wider text-slate/50">
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
                        onClick={() => setAgentSlideOver(agent.name)}
                        className="border-b border-ink/[0.05] text-sm transition-colors last:border-0 hover:bg-paper/60 cursor-pointer"
                      >
                        <td className="sticky left-0 bg-inherit px-5 py-3">
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
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold",
                              agent.status === "fast"
                                ? "bg-emerald-50 text-emerald-700"
                                : agent.status === "mid"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700",
                            )}
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
        <div className="space-y-3 mt-3">
          {/* Date range selector */}
          <div className="flex items-center gap-2">
            <span className="text-[0.78rem] text-slate/60 mr-1">Period:</span>
            {(["month", "quarter", "year"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  "rounded-full px-3 py-1 text-[0.78rem] font-medium transition-colors",
                  dateRange === range
                    ? "bg-ink text-white"
                    : "border border-ink/[0.08] text-slate/60 hover:text-ink",
                )}
              >
                {range === "month" ? "This Month" : range === "quarter" ? "This Quarter" : "This Year"}
              </button>
            ))}
          </div>

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
          <div className="rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_4px_rgb(0,0,0,0.05)]">
            <div className="flex items-center justify-between border-b border-ink/[0.06] px-5 py-3">
              <div>
                <h2 className="text-[0.7rem] font-semibold uppercase tracking-widest text-slate/50">
                  Source ROI &mdash; this month
                </h2>
                <p className="mt-0.5 text-[0.72rem] text-slate/50">
                  Revenue vs. spend per channel — click any row for AI analysis
                </p>
              </div>
              <button
                onClick={() => setMarketingBriefOpen((prev) => !prev)}
                className="flex items-center gap-1.5 text-[0.74rem] font-semibold text-azure hover:opacity-70"
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI Marketing Analysis
              </button>
            </div>
            {SOURCE_ROI.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
                <TrendingUp className="h-8 w-8 text-slate/30" />
                <p className="text-[0.88rem] text-slate">No marketing channel data available yet.</p>
              </div>
            ) : (
              <SourceRoiTable showSpend={true} />
            )}
            {/* Marketing AI brief panel */}
            {marketingBriefOpen && (
              <div className="border-t border-ink/[0.06]">
                <div className="flex items-center justify-between px-5 py-3 bg-ink/[0.02]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-azure" />
                    <span className="text-[0.85rem] font-semibold text-ink">AI Marketing Analysis</span>
                  </div>
                  <button
                    onClick={() => { setMarketingBriefOpen(false); setMarketingBrief(""); }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate/50 hover:bg-paper/60 hover:text-ink transition-colors"
                    aria-label="Close marketing analysis"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-5">
                  {marketingBrief ? (
                    <AiMarkdown text={marketingBrief} />
                  ) : (
                    <div className="flex items-center gap-2 text-[0.82rem] text-slate/60">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Analyzing marketing ROI…
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <p className="py-2 text-center text-[0.65rem] text-slate/40">
        {company.name} &middot; {company.stats.annualVolume} volume &middot;{" "}
        {company.stats.agents} agents &middot; {usd(metrics.kpis.pipelineValue)} pipeline
      </p>
      </div> {/* end flex-1 overflow-y-auto */}

      {/* ════════════════════════════════════════════════════════════════════
          SLIDE-OVERS
      ════════════════════════════════════════════════════════════════════ */}

      {/* KPI detail slide-over */}
      <SlideOver open={kpiSlideOver !== null} onClose={() => setKpiSlideOver(null)}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-ink/[0.08] px-5 py-4">
            <div>
              <h3 className="font-display text-[1.05rem] font-semibold text-ink">
                {kpiSlideOver} — Detail
              </h3>
              <p className="mt-0.5 text-[0.78rem] text-slate/60">
                {kpiSlideOver === "MTD Volume" && "Closed transactions this month"}
                {kpiSlideOver === "Active Leads" && "All active leads in the CRM"}
                {kpiSlideOver === "Speed to Lead" && "Response time breakdown by agent"}
              </p>
            </div>
            <button
              onClick={() => setKpiSlideOver(null)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate/50 hover:bg-paper/60 hover:text-ink transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {kpiSlideOver === "MTD Volume" && (
              <>
                <SectionLabel>Closed this month</SectionLabel>
                <p className="text-[0.85rem] text-slate/60">
                  Showing closed transaction summary. Connect your transaction data source to see individual records here.
                </p>
                <div className="space-y-2">
                  {[
                    { address: "8457 NW Lakeshore Dr", agent: "Jordan Matin", date: "Jun 14", price: "$1,150,000" },
                    { address: "2203 SW Canyon Rd", agent: "Joshua Rose", date: "Jun 11", price: "$875,000" },
                    { address: "4910 Riverside Ln", agent: "Sarah Chen", date: "Jun 9", price: "$640,000" },
                    { address: "1820 Oak Hill Terrace", agent: "Jordan Matin", date: "Jun 5", price: "$920,000" },
                  ].map((t, i) => (
                    <div key={i} className="rounded-xl border border-ink/[0.07] bg-paper/60 p-3">
                      <p className="text-[0.85rem] font-medium text-ink">{t.address}</p>
                      <div className="mt-1 flex items-center justify-between text-[0.75rem] text-slate/60">
                        <span>{t.agent} · {t.date}</span>
                        <span className="font-semibold text-ink">{t.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/hub/reporting"
                  className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-azure hover:opacity-70"
                >
                  View all in Reports <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
            {kpiSlideOver === "Active Leads" && (
              <>
                <SectionLabel>Active leads</SectionLabel>
                <p className="text-[0.85rem] text-slate/60 mb-3">
                  {leads.filter((l) => l.stage !== "Closed").length} leads are currently active across all stages. Connect your CRM to see individual records here.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {PIPELINE_STAGES.map((s) => (
                    <div key={s.label} className="rounded-xl border border-ink/[0.07] bg-paper/60 p-3 text-center">
                      <p className="font-display text-2xl font-semibold text-ink">{s.count}</p>
                      <p className="text-[0.72rem] text-slate/60">{s.label}</p>
                    </div>
                  ))}
                </div>
                <Link
                  href="/hub/crm"
                  className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-azure hover:opacity-70"
                >
                  View all leads in CRM <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
            {kpiSlideOver === "Speed to Lead" && (
              <>
                <SectionLabel>Response time by agent</SectionLabel>
                <p className="text-[0.85rem] text-slate/60 mb-3">
                  Team average: <strong>{metrics.speedToLeadMin ?? 4} min</strong>. Benchmark: under 5 minutes.
                </p>
                <div className="space-y-2">
                  {RESPONSE_RANKING.map((agent) => (
                    <div key={agent.slug} className="flex items-center justify-between rounded-xl border border-ink/[0.07] bg-paper/60 p-3">
                      <span className="text-[0.85rem] font-medium text-ink">{agent.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[0.82rem] font-semibold tabular-nums",
                          agent.status === "fast" ? "text-emerald-600" : agent.status === "mid" ? "text-amber-600" : "text-red-600",
                        )}>
                          {agent.responseTimeMins} min
                        </span>
                        <Pill tone={agent.status === "fast" ? "success" : agent.status === "mid" ? "warn" : "danger"}>
                          {agent.status}
                        </Pill>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/hub/reporting"
                  className="mt-3 inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-azure hover:opacity-70"
                >
                  View full report <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </SlideOver>

      {/* Pipeline stage slide-over */}
      <SlideOver open={pipelineSlideOver !== null} onClose={() => setPipelineSlideOver(null)}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-ink/[0.08] px-5 py-4">
            <div>
              <h3 className="font-display text-[1.05rem] font-semibold text-ink">
                {pipelineSlideOver} — {activePipelineStage?.count ?? 0} leads
              </h3>
              <p className="mt-0.5 text-[0.78rem] text-slate/60">
                Active leads in this stage
              </p>
            </div>
            <button
              onClick={() => setPipelineSlideOver(null)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate/50 hover:bg-paper/60 hover:text-ink transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            <SectionLabel>Leads in this stage</SectionLabel>
            <p className="text-[0.85rem] text-slate/60">
              Connect your CRM data to see individual lead records here. Each lead will show name, source, last contact date, and assigned agent.
            </p>
            <div className="space-y-2">
              {Array.from({ length: activePipelineStage?.count ?? 0 }, (_, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-ink/[0.07] bg-paper/60 p-3">
                  <div>
                    <p className="text-[0.85rem] font-medium text-ink">Lead #{i + 1}</p>
                    <p className="text-[0.72rem] text-slate/55">Source · Last contacted: 2d ago</p>
                  </div>
                  <span className="text-[0.72rem] text-slate/40">Agent</span>
                </div>
              ))}
            </div>
            <Link
              href={`/hub/crm?stage=${encodeURIComponent(pipelineSlideOver ?? "")}`}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-[0.82rem] font-semibold text-azure hover:opacity-70"
            >
              View all in CRM <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </SlideOver>

      {/* Activity slide-over */}
      <SlideOver open={activitySlideOver !== null} onClose={() => setActivitySlideOver(null)}>
        {activeActivity && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-ink/[0.08] px-5 py-4">
              <h3 className="font-display text-[1.05rem] font-semibold text-ink">
                Activity Detail
              </h3>
              <button
                onClick={() => setActivitySlideOver(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate/50 hover:bg-paper/60 hover:text-ink transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-start gap-3">
                <span className={cn("mt-1.5 h-3 w-3 shrink-0 rounded-full", activeActivity.dot)} />
                <div>
                  <p className="font-display text-lg text-ink">{activeActivity.text}</p>
                  <p className="mt-1 text-[0.82rem] text-slate/60">{activeActivity.sub}</p>
                  <p className="mt-1 text-[0.75rem] text-slate/40">{activeActivity.ago}</p>
                </div>
              </div>
              <div className="rounded-xl border border-ink/[0.07] bg-paper/60 p-4">
                <SectionLabel className="mb-2">Related record</SectionLabel>
                <p className="text-[0.85rem] text-slate/60">
                  {activeActivity.type === "lead" && "This event is linked to a lead record in your CRM."}
                  {activeActivity.type === "transaction" && "This event is linked to an active transaction."}
                  {activeActivity.type === "activity" && "This is a general activity logged in the system."}
                </p>
              </div>
              <Link
                href={activeActivity.link}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-[0.85rem] font-medium text-white hover:bg-ink/90 transition-colors"
              >
                {activeActivity.type === "transaction" ? "View transaction" : "View in CRM"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Source ROI slide-over */}
      <SlideOver open={roiSlideOver !== null} onClose={() => setRoiSlideOver(null)}>
        {activeRoiRow && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-ink/[0.08] px-5 py-4">
              <div>
                <h3 className="font-display text-[1.05rem] font-semibold text-ink">
                  {activeRoiRow.source}
                </h3>
                <p className="mt-0.5 text-[0.78rem] text-slate/60">Channel performance breakdown</p>
              </div>
              <button
                onClick={() => setRoiSlideOver(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate/50 hover:bg-paper/60 hover:text-ink transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Stat grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatTile
                  label="Leads"
                  value={activeRoiRow.leads}
                  icon={<UserPlus className="h-4 w-4" />}
                />
                <StatTile
                  label="Closed"
                  value={activeRoiRow.closed}
                  icon={<Target className="h-4 w-4" />}
                />
                <StatTile
                  label="Revenue"
                  value={compactUsd(activeRoiRow.revenue)}
                  icon={<DollarSign className="h-4 w-4" />}
                />
                <StatTile
                  label="ROI Multiple"
                  value={roiMultiple(activeRoiRow.revenue, activeRoiRow.spend)}
                  icon={<TrendingUp className="h-4 w-4" />}
                />
              </div>

              {/* Cost efficiency */}
              <div>
                <SectionLabel className="mb-2">Cost Efficiency</SectionLabel>
                {activeRoiRow.spend === 0 ? (
                  <p className="text-[0.85rem] text-emerald-600 font-semibold">
                    Organic channel — no spend required.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[0.72rem] text-slate/55 uppercase tracking-wider font-bold">Cost / Lead</p>
                      <p className="font-display text-2xl font-semibold text-ink">
                        {usd(Math.round(activeRoiRow.spend / activeRoiRow.leads))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.72rem] text-slate/55 uppercase tracking-wider font-bold">Cost / Close</p>
                      <p className="font-display text-2xl font-semibold text-ink">
                        {usd(Math.round(activeRoiRow.spend / activeRoiRow.closed))}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Recommendation */}
              <div>
                <SectionLabel className="mb-3">AI Recommendation</SectionLabel>
                <button
                  disabled={roiAnalyzing}
                  onClick={async () => {
                    setRoiAnalyzing(true);
                    setRoiAiOutput("");
                    try {
                      await streamAi(
                        {
                          tool: "coach",
                          input: {
                            context: "source-roi-analysis",
                            source: activeRoiRow.source,
                            leads: activeRoiRow.leads,
                            closed: activeRoiRow.closed,
                            revenue: activeRoiRow.revenue,
                            spend: activeRoiRow.spend,
                            roi: roiMultiple(activeRoiRow.revenue, activeRoiRow.spend),
                          },
                        },
                        (_c, full) => setRoiAiOutput(full),
                      );
                    } catch {
                      setRoiAiOutput("_Sorry — connection error. Please try again._");
                    } finally {
                      setRoiAnalyzing(false);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-50 transition-colors"
                >
                  {roiAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing…
                    </>
                  ) : roiAiOutput ? (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Refresh analysis
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analyze this channel
                    </>
                  )}
                </button>
                {roiAiOutput && (
                  <div className="mt-4 rounded-xl border border-ink/[0.06] bg-paper/50 p-4">
                    <AiMarkdown text={roiAiOutput} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Agent slide-over */}
      <SlideOver open={agentSlideOver !== null} onClose={() => setAgentSlideOver(null)}>
        {activeAgent && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-ink/[0.08] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-ink/[0.06]">
                  {"photo" in activeAgent && activeAgent.photo ? (
                    <Image
                      src={activeAgent.photo}
                      alt={activeAgent.name}
                      fill
                      sizes="40px"
                      className="object-cover object-top"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[0.72rem] font-semibold text-ink/60">
                      {activeAgent.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-display text-[1.05rem] font-semibold text-ink">
                    {activeAgent.name}
                  </h3>
                  <p className="mt-0.5 text-[0.78rem] text-slate/60">This month&apos;s performance</p>
                </div>
              </div>
              <button
                onClick={() => setAgentSlideOver(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate/50 hover:bg-paper/60 hover:text-ink transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Status badge for response ranking agents */}
              {"status" in activeAgent && (
                <div className="flex items-center gap-2">
                  <span className="text-[0.78rem] text-slate/60">Speed to lead:</span>
                  <Pill tone={activeAgent.status === "fast" ? "success" : activeAgent.status === "mid" ? "warn" : "danger"}>
                    {activeAgent.status === "fast" ? "Fast (< 5 min)" : activeAgent.status === "mid" ? "Mid (5–15 min)" : "Slow (> 15 min)"}
                  </Pill>
                </div>
              )}

              {/* KPI tiles */}
              {"closings" in activeAgent && (
                <div className="grid grid-cols-2 gap-3">
                  <StatTile label="Closings" value={activeAgent.closings} icon={<Target className="h-4 w-4" />} />
                  <StatTile label="Volume" value={activeAgent.volume} icon={<DollarSign className="h-4 w-4" />} />
                  <StatTile label="Avg DOM" value={`${activeAgent.dom}d`} icon={<Calendar className="h-4 w-4" />} />
                  <StatTile label="Response" value={activeAgent.responseTime} icon={<Zap className="h-4 w-4" />} />
                </div>
              )}

              {/* Pipeline summary */}
              <div>
                <SectionLabel className="mb-2">Pipeline</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {PIPELINE_STAGES.map((s) => (
                    <Pill key={s.label} tone="neutral">
                      {s.label}: {Math.max(0, Math.floor(s.count * 0.3))}
                    </Pill>
                  ))}
                </div>
              </div>

              {/* AI Coaching Brief */}
              <div>
                <SectionLabel className="mb-3">AI Coaching Brief</SectionLabel>
                {"closings" in activeAgent && (
                  <button
                    disabled={isCoaching}
                    onClick={async () => {
                      setIsCoaching(true);
                      setCoachOutput("");
                      try {
                        await streamAi(
                          {
                            tool: "coach",
                            input: {
                              context: "coaching-brief",
                              agentName: activeAgent.name,
                              closings: activeAgent.closings,
                              volume: activeAgent.volume,
                              dom: activeAgent.dom,
                              responseTime: activeAgent.responseTime,
                            },
                          },
                          (_c, full) => setCoachOutput(full),
                        );
                      } catch {
                        setCoachOutput("_Sorry — connection error. Please try again._");
                      } finally {
                        setIsCoaching(false);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-50 transition-colors"
                  >
                    {isCoaching ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate brief
                      </>
                    )}
                  </button>
                )}
                {coachOutput && (
                  <div className="mt-4 rounded-xl border border-ink/[0.06] bg-paper/50 p-4">
                    <AiMarkdown text={coachOutput} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
