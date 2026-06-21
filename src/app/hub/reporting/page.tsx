"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Users2,
  Radio,
  Download,
  ChevronDown,
} from "lucide-react";
import { reportMetrics, getAgent, metrics } from "@/lib/data";
import type {
  ReportAgentLeaderboardRow,
  ReportSourceRoi,
  ReportFunnelStage,
  ReportPipelineStage,
} from "@/lib/types";
import {
  SegmentedKpis,
  SavedViewTabs,
  DataTable,
  Avatar,
  PropertyThumb,
  RecordDrawer,
  StatusChip,
  ProgressTrack,
  Skeleton,
  type Column,
  type SavedView,
} from "@/components/os";
import { MatinMark } from "@/components/brand/Logo";
import { cn, compactUsd, num, usd } from "@/lib/utils";
import {
  ReportsScorecard,
  type ScorecardMetric,
} from "@/components/command/reports/ReportsScorecard";
import { SourceRoiPanel } from "@/components/command/reports/SourceRoiPanel";
import { FunnelRamp } from "@/components/command/reports/FunnelRamp";
import {
  TimeSeriesChart,
  PipelineRamp,
  Sparkline,
} from "@/components/command/reports/ReportCharts";
import {
  AiExplainPanel,
  type ExplainScope,
} from "@/components/command/reports/AiExplainPanel";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Reports + Accountability  (build-ref §2.10, source/10_reports.md)

   Sierra report grammar: scope filters → segmented financial KPI → company
   scorecard hero → primary time-series (current vs prior) → report-card grid
   (leaderboard / source ROI) → pipeline ramp + funnel. Sisu color-as-data
   scoreboard. Every KPI/row drills into a LIGHT RecordDrawer; "Ask Matin"
   streams a real explanation INLINE into a dark AI card (never the sidecar).

   Make-it-real spine:
     • Date / team / source filters RE-SCOPE every number (useMemo recompute).
     • Leaderboard rows → agent RecordDrawer with a real Avatar headshot.
     • Ask Matin → streamAi into AiExplainPanel (cited drivers + create-action).
     • CSV export downloads the leaderboard for real.
   ────────────────────────────────────────────────────────────────────────── */

type DateRange = "MTD" | "QTD" | "YTD";
type Team = "All teams" | "Oregon" | "SW Washington";
type SourceFilter = "All sources" | "Paid" | "Organic" | "Referral";

type LeaderTab = "gci" | "signed" | "appts" | "leads";

const DATE_RANGES: DateRange[] = ["MTD", "QTD", "YTD"];
const TEAMS: Team[] = ["All teams", "Oregon", "SW Washington"];
const SOURCES: SourceFilter[] = ["All sources", "Paid", "Organic", "Referral"];

/* ── scope scaling ─────────────────────────────────────────────────────────
   Approximate-but-visible re-scoping: YTD is the full dataset; QTD ≈ a quarter
   of the year; MTD ≈ a month. Team factor splits Oregon (~64%) vs SW
   Washington (~36%). Source factor scopes to a paid / organic / referral slice.
   Counts round; money scales; rates stay stable. Good enough for a leadership
   demo and it visibly changes the whole board when you toggle.            */
const RANGE_FACTOR: Record<DateRange, number> = { MTD: 0.085, QTD: 0.27, YTD: 1 };
const TEAM_FACTOR: Record<Team, number> = {
  "All teams": 1,
  Oregon: 0.64,
  "SW Washington": 0.36,
};
const SOURCE_FACTOR: Record<SourceFilter, number> = {
  "All sources": 1,
  Paid: 0.42,
  Organic: 0.46,
  Referral: 0.12,
};
const SOURCE_KIND: Record<string, "Paid" | "Organic" | "Referral"> = {
  Referral: "Referral",
  "Organic / Website": "Organic",
  Instagram: "Organic",
  "Google Ads": "Paid",
  "Cash Offer Funnel": "Paid",
  Zillow: "Paid",
  "Facebook Ads": "Paid",
};

const RANGE_LABEL: Record<DateRange, string> = {
  MTD: "Month to date",
  QTD: "Quarter to date",
  YTD: "Year to date",
};
const PRIOR_LABEL: Record<DateRange, string> = {
  MTD: "Prior month",
  QTD: "Prior quarter",
  YTD: "Prior year",
};

/* Drawer payloads ---------------------------------------------------------- */
type Drawer =
  | { kind: "metric"; metric: ScorecardMetric }
  | { kind: "agent"; row: ReportAgentLeaderboardRow }
  | { kind: "source"; source: ReportSourceRoi }
  | { kind: "stage"; stage: ReportFunnelStage }
  | { kind: "pipeline"; stage: ReportPipelineStage }
  | null;

/* Recent closings strip — real addresses + photos (PropertyThumb wiring) */
const RECENT_CLOSINGS = [
  { address: "7428 SW Maple Ave", city: "Lake Oswego", price: 1180000, agent: "Lexa Brice", slug: "lexa-brice", seed: 4 },
  { address: "215 NW Skyline Blvd", city: "Portland", price: 925000, agent: "Ava Brooks", slug: "ava-brooks", seed: 9 },
  { address: "3390 Riverview Dr", city: "West Linn", price: 1340000, agent: "Joshua Rose", slug: "joshua-rose", seed: 13 },
  { address: "1102 Iron Mountain Rd", city: "Lake Oswego", price: 760000, agent: "Karen Tse", slug: "karen-tse", seed: 17 },
];

export default function ReportingPage() {
  const [range, setRange] = useState<DateRange>("YTD");
  const [team, setTeam] = useState<Team>("All teams");
  const [source, setSource] = useState<SourceFilter>("All sources");
  const [leaderTab, setLeaderTab] = useState<LeaderTab>("gci");
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [explain, setExplain] = useState<ExplainScope | null>(null);

  // Brief skeleton on first paint (and whenever scope changes, to mimic a
  // recompute against report_snapshots) — preserves layout stability. The
  // skeleton is turned ON during render when the scope key changes (the
  // adjust-state-on-prop-change pattern) and turned OFF by a timeout effect, so
  // no setState fires synchronously inside the effect body.
  const scopeKey = `${range}|${team}|${source}`;
  const [loading, setLoading] = useState(true);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  if (loadedKey !== scopeKey && !loading) setLoading(true);
  useEffect(() => {
    const t = setTimeout(() => {
      setLoadedKey(scopeKey);
      setLoading(false);
    }, 420);
    return () => clearTimeout(t);
  }, [scopeKey]);

  /* ── scoped recompute — the heart of "filters actually re-scope" ─────────── */
  const f = RANGE_FACTOR[range] * TEAM_FACTOR[team] * SOURCE_FACTOR[source];

  const scoped = useMemo(() => {
    const base = reportMetrics;
    const cs = base.companyScorecard;

    // money scales by the full factor; counts too (rounded, min sensible floors)
    const scaleMoney = (n: number) => Math.round(n * f);
    const scaleCount = (n: number) => Math.max(1, Math.round(n * f));

    const companyScorecard = {
      ...cs,
      annualVolume: scaleMoney(cs.annualVolume),
      gci: scaleMoney(cs.gci),
      propertiesSold: scaleCount(cs.propertiesSold),
      activeListings: scaleCount(cs.activeListings),
      goalPacing: {
        ...cs.goalPacing,
        volumeActual: scaleMoney(cs.goalPacing.volumeActual),
        volumeGoal: scaleMoney(cs.goalPacing.volumeGoal),
        soldActual: scaleCount(cs.goalPacing.soldActual),
        soldGoal: scaleCount(cs.goalPacing.soldGoal),
        forecastVolume: scaleMoney(cs.goalPacing.forecastVolume),
      },
    };

    // leaderboard: scale stats; when a source filter is active, only agents
    // weighted by it remain meaningful → scale, keep all rows but reduced.
    const agentLeaderboard: ReportAgentLeaderboardRow[] = base.agentLeaderboard.map((a) => ({
      ...a,
      leads: scaleCount(a.leads),
      appts: scaleCount(a.appts),
      signed: Math.max(0, Math.round(a.signed * f)),
      gci: scaleMoney(a.gci),
    }));

    // source ROI: when a source filter is set, keep only matching kinds.
    const sourceRoi: ReportSourceRoi[] = base.sourceRoi
      .filter((s) =>
        source === "All sources" ? true : SOURCE_KIND[s.source] === source,
      )
      .map((s) => {
        const sf = RANGE_FACTOR[range] * TEAM_FACTOR[team];
        return {
          ...s,
          leads: Math.max(1, Math.round(s.leads * sf)),
          closed: Math.max(0, Math.round(s.closed * sf)),
          revenue: Math.round(s.revenue * sf),
          spend: Math.round(s.spend * sf),
        };
      });

    const funnel: ReportFunnelStage[] = base.funnel.map((s) => ({
      ...s,
      count: scaleCount(s.count),
    }));

    const pipeline: ReportPipelineStage[] = base.pipeline.map((s) => ({
      ...s,
      value: Math.round(s.value * RANGE_FACTOR[range] * TEAM_FACTOR[team]),
      deals: Math.max(1, Math.round(s.deals * RANGE_FACTOR[range] * TEAM_FACTOR[team])),
    }));

    return { companyScorecard, agentLeaderboard, sourceRoi, funnel, pipeline };
  }, [f, range, team, source]);

  /* ── time-series (current vs prior) scoped from real monthly metrics ─────── */
  const series = useMemo(() => {
    const months = metrics.volumeByMonth; // 12 months Jul→Jun
    const teamScale = TEAM_FACTOR[team] * SOURCE_FACTOR[source];
    // window per range: MTD=last 1, QTD=last 3, YTD=all 12
    const win = range === "MTD" ? 2 : range === "QTD" ? 6 : 12;
    const cur = months.slice(months.length - win).map((m) => ({
      label: m.month,
      value: Math.round(m.volume * teamScale),
    }));
    // "prior" period = the window before this one, faded back to fill same length
    const priorRaw = months.slice(Math.max(0, months.length - win * 2), months.length - win);
    const prior = cur.map((p, i) => ({
      label: p.label,
      value: Math.round((priorRaw[i % Math.max(1, priorRaw.length)]?.volume ?? p.value * 0.88) * teamScale),
    }));
    return { cur, prior };
  }, [range, team, source]);

  const { companyScorecard, agentLeaderboard, sourceRoi, funnel, pipeline } = scoped;

  /* Leaderboard sorted by the active scoreboard column */
  const leaderRows = useMemo(() => {
    const key = leaderTab;
    return [...agentLeaderboard].sort((a, b) => b[key] - a[key]);
  }, [agentLeaderboard, leaderTab]);

  const leaderViews: SavedView[] = [
    { key: "gci", label: "By GCI", count: agentLeaderboard.length },
    { key: "signed", label: "By signed" },
    { key: "appts", label: "By appts" },
    { key: "leads", label: "By leads" },
  ];

  const totalGci = agentLeaderboard.reduce((s, a) => s + a.gci, 0);
  const totalSigned = agentLeaderboard.reduce((s, a) => s + a.signed, 0);

  /* ── Ask Matin — stream an explanation INLINE (never the global sidecar) ── */
  function askMatin(context: string, drivers: string[], action: ExplainScope["action"]) {
    setExplain({ context, range, team, source, drivers, action });
    // scroll the inline panel into view on the next frame
    requestAnimationFrame(() => {
      document.getElementById("ai-explain")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  /* ── real CSV export of the current leaderboard scope ────────────────────── */
  function exportCsv() {
    const header = ["Agent", "Leads", "Appointments", "Signed", "GCI"];
    const lines = leaderRows.map((r) => [r.agent, r.leads, r.appts, r.signed, r.gci].join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `matin-leaderboard-${range}-${team.replace(/\s+/g, "-").toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const leaderColumns: Column<ReportAgentLeaderboardRow>[] = [
    {
      key: "agent",
      header: "Agent",
      sortable: true,
      render: (r) => {
        const a = getAgent(r.slug);
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={r.agent} slug={r.slug} size={32} ring />
            <div className="min-w-0">
              <div className="truncate text-[0.86rem] font-semibold leading-tight text-ink">
                {r.agent}
              </div>
              <div className="truncate text-[0.72rem] leading-tight text-slate">
                {a?.title ?? "Sales agent"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "leads",
      header: "Leads",
      align: "right",
      sortable: true,
      render: (r) => <span className="tabular-nums text-ink">{num(r.leads)}</span>,
    },
    {
      key: "appts",
      header: "Appts",
      align: "right",
      sortable: true,
      render: (r) => <span className="tabular-nums text-ink">{num(r.appts)}</span>,
    },
    {
      key: "signed",
      header: "Signed",
      align: "right",
      sortable: true,
      render: (r) => (
        <span className="font-semibold tabular-nums text-ink">{num(r.signed)}</span>
      ),
    },
    {
      key: "gci",
      header: "GCI",
      align: "right",
      sortable: true,
      // Color-as-data: positive money prints green (Sisu scoreboard), no badge.
      render: (r) => (
        <span className="font-bold tabular-nums text-success">{compactUsd(r.gci)}</span>
      ),
    },
  ];

  /* ── filter chip styling ─────────────────────────────────────────────────── */
  const chip =
    "inline-flex items-center gap-1.5 rounded-full border border-mist bg-cloud px-3 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink";

  function cycle<T>(arr: T[], cur: T): T {
    const i = arr.indexOf(cur);
    return arr[(i + 1) % arr.length];
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 pb-16 pt-3 md:px-6">
      {/* Subtitle eyebrow (no page <h1> — TopCommandBar owns the title) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.82rem] text-slate">
          Goals, agent leaderboards, marketing ROI, and brokerage operating metrics —
          scoped live to <span className="font-semibold text-ink">{RANGE_LABEL[range]}</span>,{" "}
          {team}, {source.toLowerCase()}.
        </p>
        <button
          type="button"
          onClick={exportCsv}
          className={cn(chip, "border-ink/15 text-ink")}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* Context filter chips — date / team / source (re-scope every number) */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-full border border-mist bg-cloud p-1">
          <CalendarDays className="ml-1.5 h-3.5 w-3.5 text-slate" />
          {DATE_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "rounded-full px-3 py-1 text-[0.76rem] font-semibold transition-colors",
                range === r ? "bg-ink text-cloud" : "text-slate hover:text-ink",
              )}
            >
              {r}
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setTeam((t) => cycle(TEAMS, t))} className={chip}>
          <Users2 className="h-3.5 w-3.5" />
          {team}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        <button type="button" onClick={() => setSource((s) => cycle(SOURCES, s))} className={chip}>
          <Radio className="h-3.5 w-3.5" />
          {source}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        {/* Ask Matin — explicit AI affordance (gold sanctioned). Streams inline. */}
        <button
          type="button"
          onClick={() =>
            askMatin(
              "Company volume vs goal",
              [
                "Referral revenue $10.85M at $0 CPL",
                "Cash Offer Funnel closing fastest",
                "Sold-units pacing 90% vs 99% volume",
              ],
              {
                title: "Reallocate $20K from Zillow to the Cash Offer Funnel",
                evidence:
                  "Zillow CPL $429 at 1.9x ROAS vs Cash Offer Funnel $128 CPL / 17.5x ROAS — shifting budget lifts forecasted GCI without new headcount.",
              },
            )
          }
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-gold px-3.5 py-1.5 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
        >
          <MatinMark theme="dark" className="h-3.5 w-3.5" />
          Ask Matin why this changed
        </button>
      </div>

      {/* Inline AI explanation panel (streams; replaces the old sidecar open) */}
      {explain ? (
        <div id="ai-explain">
          <AiExplainPanel scope={explain} onDismiss={() => setExplain(null)} />
        </div>
      ) : null}

      {loading ? (
        <ReportsSkeleton />
      ) : (
        <>
          {/* Segmented financial KPI strip — Revenue cell green (color-as-data) */}
          <SegmentedKpis
            items={[
              {
                label: "Volume",
                value: `${compactUsd(companyScorecard.annualVolume)}`,
                sub: `${range} · ${Math.round((companyScorecard.goalPacing.volumeActual / companyScorecard.goalPacing.volumeGoal) * 100)}% to goal`,
              },
              {
                label: "Closings",
                value: num(companyScorecard.propertiesSold),
                sub: `Goal ${num(companyScorecard.goalPacing.soldGoal)}`,
              },
              {
                label: "Avg sale price",
                value: compactUsd(companyScorecard.avgSalePrice),
                sub: "Across closed units",
              },
              {
                label: "GCI",
                value: compactUsd(companyScorecard.gci),
                sub: "Gross commission income",
                tone: "success",
              },
            ]}
          />

          {/* HERO — Company scorecard (4 score rings + pace bar) */}
          <ReportsScorecard
            scorecard={companyScorecard}
            onDrill={(metric) => setDrawer({ kind: "metric", metric })}
          />

          {/* PRIMARY time-series — current vs prior (Sierra report grammar) */}
          <TimeSeriesChart
            title="Closed volume trend"
            unit="usd"
            current={series.cur}
            prior={series.prior}
            currentLabel={RANGE_LABEL[range]}
            priorLabel={PRIOR_LABEL[range]}
          />

          {/* GRID — leaderboard (wide) + source ROI */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* (A) Agent leaderboard — color-as-data scoreboard */}
            <div className="lg:col-span-2">
              <div className="flex flex-col gap-3 rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <h2 className="font-display text-[1.05rem] font-normal leading-none text-ink">
                      Agent leaderboard
                    </h2>
                    <p className="mt-1.5 text-[0.74rem] text-slate tabular-nums">
                      {num(totalSigned)} signed · {compactUsd(totalGci)} GCI across{" "}
                      {agentLeaderboard.length} agents · {range}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      askMatin(
                        "Agent accountability",
                        [
                          "Top quartile averages 14 appts → 7 signed",
                          "Speed-to-lead 4 min on the leaders",
                          "Bottom two trail on appt-set rate",
                        ],
                        {
                          title: "Assign a coaching plan to the bottom-quartile agents",
                          evidence:
                            "Lowest two agents convert leads→appts under 40%. A scripted objection drill + a stale-lead sweep typically recovers 1-2 signings/month.",
                        },
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-mist px-2.5 py-1.5 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
                  >
                    <MatinMark theme="dark" className="h-3.5 w-3.5" />
                    Summarize
                  </button>
                </div>

                <SavedViewTabs
                  views={leaderViews}
                  active={leaderTab}
                  onChange={(k) => setLeaderTab(k as LeaderTab)}
                />

                <DataTable<ReportAgentLeaderboardRow>
                  columns={leaderColumns}
                  rows={leaderRows}
                  getRowId={(r) => r.slug}
                  onRowClick={(r) => setDrawer({ kind: "agent", row: r })}
                />
              </div>
            </div>

            {/* (B) Marketing ROI + Source Quality */}
            <div className="lg:col-span-1">
              <SourceRoiPanel
                sources={sourceRoi}
                onDrill={(s) => setDrawer({ kind: "source", source: s })}
              />
            </div>

            {/* (C) Pipeline ramp + lead funnel side by side under the grid */}
            <div className="lg:col-span-2">
              <PipelineRamp
                stages={pipeline}
                onDrill={(s) => setDrawer({ kind: "pipeline", stage: s })}
              />
            </div>
            <div className="lg:col-span-1">
              <FunnelRamp
                stages={funnel}
                onDrill={(s) => setDrawer({ kind: "stage", stage: s })}
              />
            </div>
          </div>

          {/* Recent closings — real photos + agent headshots (asset wiring) */}
          <RecentClosings />
        </>
      )}

      {/* ── Drilldown drawer ─────────────────────────────────────────────── */}
      <ReportingDrawer
        drawer={drawer}
        onClose={() => setDrawer(null)}
        onAskAi={(ctx, drivers, action) => {
          setDrawer(null);
          askMatin(ctx, drivers, action);
        }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Recent closings strip — wires PropertyThumb (real exteriors) + Avatar
   ────────────────────────────────────────────────────────────────────────── */
function RecentClosings() {
  return (
    <section className="rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[1.05rem] font-normal leading-none text-ink">
          Recent closings
        </h2>
        <span className="text-[0.72rem] font-medium text-slate">Last 14 days · attributed to GCI</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {RECENT_CLOSINGS.map((c) => (
          <div
            key={c.address}
            className="overflow-hidden rounded-xl border border-mist bg-paper/40 transition-colors hover:border-ink/20"
          >
            <PropertyThumb seedIndex={c.seed} ratio="video" rounded={false} alt={c.address} />
            <div className="p-3">
              <p className="truncate text-[0.84rem] font-semibold text-ink">{c.address}</p>
              <p className="text-[0.72rem] text-slate">{c.city}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[0.92rem] font-bold text-success tabular-nums">
                  {compactUsd(c.price)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Avatar name={c.agent} slug={c.slug} size={20} />
                  <span className="truncate text-[0.7rem] text-slate">{c.agent}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Skeleton — preserves layout while the scope recomputes
   ────────────────────────────────────────────────────────────────────────── */
function ReportsSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-[92px] rounded-2xl" />
      <Skeleton className="h-[260px] rounded-2xl" />
      <Skeleton className="h-[240px] rounded-2xl" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Skeleton className="h-[360px] rounded-2xl lg:col-span-2" />
        <Skeleton className="h-[360px] rounded-2xl" />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Drilldown drawer — light record drawer for any KPI / row / source / stage.
   "KPI cards drill into source records" (acceptance criterion).
   The "Ask AI why" action hands back to the page's inline streaming panel.
   ────────────────────────────────────────────────────────────────────────── */
function ReportingDrawer({
  drawer,
  onClose,
  onAskAi,
}: {
  drawer: Drawer;
  onClose: () => void;
  onAskAi: (context: string, drivers: string[], action: ExplainScope["action"]) => void;
}) {
  const open = drawer != null;

  let title = "";
  let subtitle = "";
  let body: React.ReactNode = null;
  let ask: { context: string; drivers: string[]; action: ExplainScope["action"] } | null = null;

  if (drawer?.kind === "metric") {
    const copy = SCORECARD_COPY[drawer.metric];
    title = copy.title;
    subtitle = copy.sub;
    ask = {
      context: copy.title,
      drivers: copy.drivers,
      action: copy.action,
    };
    body = (
      <div className="space-y-5">
        <ProgressTrack
          label="% to goal"
          value={copy.pct}
          tone={copy.pct >= 80 ? "success" : copy.pct >= 60 ? "gold" : "warn"}
          valueRight={`${copy.pct}%`}
        />
        <DefinitionList rows={copy.lines} />
        <SourceNote text="metrics_daily › listings + transactions › goals (board plan v3)" />
      </div>
    );
  } else if (drawer?.kind === "agent") {
    const r = drawer.row;
    const a = getAgent(r.slug);
    title = r.agent;
    subtitle = a?.title ?? "Sales agent";
    const apptRate = r.leads ? Math.round((r.appts / r.leads) * 100) : 0;
    const signRate = r.appts ? Math.round((r.signed / r.appts) * 100) : 0;
    ask = {
      context: `${r.agent} accountability`,
      drivers: [
        `${apptRate}% lead→appt`,
        `${signRate}% appt→signed`,
        a?.responseTimeMins ? `${a.responseTimeMins} min speed-to-lead` : "speed-to-lead unknown",
      ],
      action: {
        title: `Build ${r.agent.split(" ")[0]}'s next-30-day plan`,
        evidence: `${r.agent} sits at ${num(r.signed)} signed / ${compactUsd(r.gci)} GCI this period. The biggest lever is the ${apptRate < 45 ? "lead→appt" : "appt→signed"} step.`,
      },
    };
    body = (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Avatar name={r.agent} slug={r.slug} size={52} ring />
          <div>
            <p className="font-display text-[1.6rem] leading-none text-success tabular-nums">
              {usd(r.gci)}
            </p>
            <p className="mt-1 text-[0.74rem] text-slate">GCI this period</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Leads", value: num(r.leads) },
            { label: "Appts", value: num(r.appts) },
            { label: "Signed", value: num(r.signed) },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-mist bg-paper/60 p-3 text-center">
              <p className="text-[0.86rem] font-bold text-ink tabular-nums">{s.value}</p>
              <p className="mt-0.5 text-[0.66rem] uppercase tracking-wide text-slate">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <ProgressTrack
            label="Lead → appointment"
            value={apptRate}
            tone={apptRate >= 40 ? "success" : "warn"}
            valueRight={`${apptRate}%`}
          />
          <ProgressTrack
            label="Appointment → signed"
            value={signRate}
            tone={signRate >= 45 ? "success" : "warn"}
            valueRight={`${signRate}%`}
          />
        </div>
        {/* career trend sparkline (Sisu accountability flavor) */}
        <div className="rounded-xl border border-mist bg-paper/40 p-3">
          <p className="eyebrow mb-1.5 text-[0.6rem]">12-mo GCI trend</p>
          <Sparkline
            values={metrics.volumeByMonth.map((m, i) => m.closings * (1 + (i % 4) * 0.06))}
            tone="success"
          />
        </div>
        <DefinitionList
          rows={[
            ["Career volume", a ? compactUsd(a.volume) : "—"],
            ["Homes sold", a ? num(a.homesSold) : "—"],
            ["Active listings", a ? num(a.activeListings) : "—"],
            ["Speed-to-lead", a?.responseTimeMins ? `${a.responseTimeMins} min` : "—"],
          ]}
        />
        <SourceNote text="agent_activity › lead_events + appointments + buyer_agreements" />
      </div>
    );
  } else if (drawer?.kind === "source") {
    const s = drawer.source;
    title = s.source;
    subtitle = "Lead source ROI breakdown";
    // ROAS on attributed commission (≈2.5% GCI), not gross volume.
    const gci = Math.round(s.revenue * 0.025);
    const net = gci - s.spend;
    const roas = s.spend === 0 ? "∞" : `${(gci / s.spend).toFixed(1)}x`;
    ask = {
      context: `${s.source} ROI`,
      drivers: [
        `${num(s.leads)} leads → ${s.closed} closed`,
        s.cpl === 0 ? "$0 CPL (referral)" : `$${num(s.cpl)} cost per lead`,
        s.spend === 0 ? "pure-referral channel" : `${roas} ROAS on GCI`,
      ],
      action: {
        title: s.spend === 0 ? `Double down on ${s.source} referrals` : `Re-evaluate ${s.source} budget`,
        evidence:
          s.spend === 0
            ? `${s.source} produced ${compactUsd(s.revenue)} in volume at zero ad cost. A structured past-client referral push compounds this channel.`
            : `${s.source} runs ${roas} on ${compactUsd(s.spend)} spend (GCI basis). Compare CPL against the blended target before scaling.`,
      },
    };
    body = (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2">
          <StatPanel label="Attributed GCI" value={compactUsd(gci)} tone="success" />
          <StatPanel
            label="Marketing spend"
            value={s.spend === 0 ? "$0" : compactUsd(s.spend)}
            tone="danger"
          />
        </div>
        <DefinitionList
          rows={[
            ["Attributed volume", compactUsd(s.revenue)],
            ["Leads", num(s.leads)],
            ["Closed", num(s.closed)],
            ["Close rate", `${s.leads ? Math.round((s.closed / s.leads) * 100) : 0}%`],
            ["Cost per lead", s.cpl === 0 ? "$0 (referral)" : `$${num(s.cpl)}`],
            ["Net contribution", compactUsd(net)],
            ["Return on spend (GCI)", s.spend === 0 ? "∞ (pure referral)" : roas],
          ]}
        />
        <div className="flex flex-wrap gap-1.5">
          <StatusChip tone={s.spend === 0 ? "success" : net > s.spend ? "success" : "warn"}>
            {s.spend === 0 ? "Zero-cost channel" : net > s.spend ? "Profitable" : "Watch CPL"}
          </StatusChip>
          <StatusChip tone="info">{s.closed} closings attributed</StatusChip>
        </div>
        <SourceNote text="campaign_events › lead_sources › transactions (attribution: last-touch)" />
      </div>
    );
  } else if (drawer?.kind === "stage") {
    const s = drawer.stage;
    title = `${s.stage} stage`;
    subtitle = "Funnel stage detail";
    ask = {
      context: `${s.stage} funnel stage`,
      drivers: [`${num(s.count)} contacts at this stage`],
      action: {
        title: `Unblock the ${s.stage} stage`,
        evidence: `${num(s.count)} contacts are parked at ${s.stage}. A targeted re-engagement sequence lifts stage→stage conversion.`,
      },
    };
    body = (
      <div className="space-y-5">
        <div>
          <p className="font-display text-[2rem] leading-none text-ink tabular-nums">{num(s.count)}</p>
          <p className="mt-1 text-[0.74rem] text-slate">contacts currently at this stage</p>
        </div>
        <SourceNote text="lead_events › saved_searches › appointments › transactions" />
      </div>
    );
  } else if (drawer?.kind === "pipeline") {
    const s = drawer.stage;
    title = `${s.stage} pipeline`;
    subtitle = "Live deals at this stage";
    ask = {
      context: `${s.stage} pipeline stage`,
      drivers: [`${compactUsd(s.value)} attributed`, `${s.deals} live deals`],
      action: {
        title: `Pull a risk rollup for ${s.stage}`,
        evidence: `${s.deals} deals worth ${compactUsd(s.value)} sit in ${s.stage}. Flag any with deadlines inside 48h to Today's risk queue.`,
      },
    };
    body = (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2">
          <StatPanel label="Attributed value" value={compactUsd(s.value)} tone="success" />
          <div className="rounded-xl border border-mist bg-paper/60 p-3">
            <p className="text-[0.66rem] uppercase tracking-wide text-slate">Live deals</p>
            <p className="mt-1 text-[1.1rem] font-bold text-ink tabular-nums">{num(s.deals)}</p>
          </div>
        </div>
        <DefinitionList
          rows={[
            ["Avg deal size", s.deals ? compactUsd(Math.round(s.value / s.deals)) : "—"],
            ["Stage", s.stage],
          ]}
        />
        <SourceNote text="transactions › milestones › workflow_runs (stage rollup)" />
      </div>
    );
  }

  return (
    <RecordDrawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      actions={
        ask ? (
          <>
            <button
              type="button"
              onClick={() => onAskAi(ask!.context, ask!.drivers, ask!.action)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-[0.8rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
            >
              <MatinMark theme="dark" className="h-3.5 w-3.5" />
              Ask Matin why
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-mist px-3 py-2 text-[0.8rem] font-medium text-ink transition-colors hover:bg-paper"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </>
        ) : undefined
      }
    >
      {body}
    </RecordDrawer>
  );
}

/* ── scorecard drilldown copy (drivers + a real follow-up action each) ────── */
const SCORECARD_COPY: Record<
  ScorecardMetric,
  {
    title: string;
    sub: string;
    pct: number;
    lines: [string, string][];
    drivers: string[];
    action: ExplainScope["action"];
  }
> = {
  volume: {
    title: "Annual volume",
    sub: "Closed + pending dollar volume vs. board goal",
    pct: 87,
    lines: [
      ["Actual (annualized)", compactUsd(reportMetrics.companyScorecard.annualVolume)],
      ["Board goal", compactUsd(reportMetrics.companyScorecard.goalPacing.volumeGoal)],
      ["Forecast (run-rate)", compactUsd(reportMetrics.companyScorecard.goalPacing.forecastVolume)],
      ["Avg sale price", compactUsd(reportMetrics.companyScorecard.avgSalePrice)],
    ],
    drivers: [
      "Forecast $148.5M vs $150M goal",
      "Referral + organic carrying volume",
      "Q4 listing surge in Lake Oswego",
    ],
    action: {
      title: "Set a Q4 listing push to close the $1.5M gap",
      evidence:
        "Run-rate forecasts 99% of the volume goal. A short pre-listing campaign on high-equity owners typically adds the last few points.",
    },
  },
  listings: {
    title: "Active listings",
    sub: "Live + coming-soon inventory vs. capacity goal",
    pct: 65,
    lines: [
      ["Active now", num(reportMetrics.companyScorecard.activeListings)],
      ["Capacity goal", "172"],
      ["Pre-listing pipeline", `${reportMetrics.pipeline[0]?.deals ?? 0} deals`],
      ["Launching this week", "8"],
    ],
    drivers: [
      "112 active vs 172 capacity",
      "15 deals in pre-listing",
      "8 launching this week",
    ],
    action: {
      title: "Accelerate the 15 pre-listing deals to launch",
      evidence:
        "Inventory is at 65% of capacity. Converting the pre-listing pipeline this month fills the gap without new lead spend.",
    },
  },
  sold: {
    title: "Properties sold",
    sub: "Closed units this year vs. unit goal",
    pct: 90,
    lines: [
      ["Sold YTD", num(reportMetrics.companyScorecard.propertiesSold)],
      ["Unit goal", num(reportMetrics.companyScorecard.goalPacing.soldGoal)],
      ["Pace", `${reportMetrics.companyScorecard.goalPacing.soldPacePct}%`],
      ["GCI YTD", compactUsd(reportMetrics.companyScorecard.gci)],
    ],
    drivers: [
      "305 of 340 unit goal",
      "Avg sale price $426K",
      "Sold pacing 90% vs 99% volume",
    ],
    action: {
      title: "Sweep stale active clients to add 35 closings",
      evidence:
        "Sold-units pacing (90%) trails volume pacing. A re-engagement sweep of active clients targets the unit goal directly.",
    },
  },
  growth: {
    title: "Growth this year",
    sub: "Year-over-year volume growth vs. plan",
    pct: 78,
    lines: [
      ["YoY growth", `${reportMetrics.companyScorecard.growthPct}%`],
      ["Plan", "45% YoY"],
      ["Net new agents", "11"],
      ["Speed-to-lead", `${reportMetrics.automationImpact.speedToLeadMin} min`],
    ],
    drivers: [
      "35% YoY vs 45% plan",
      "11 net new agents",
      "4-min speed-to-lead",
    ],
    action: {
      title: "Prioritize onboarding ramp for the 11 new agents",
      evidence:
        "Growth is at 78% of plan. New-agent ramp is the fastest lever — a 30-day onboarding sprint lifts per-agent production.",
    },
  },
};

/* ── small drawer helpers ──────────────────────────────────────────────── */
function DefinitionList({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-mist rounded-xl border border-mist">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
          <dt className="text-[0.78rem] text-slate">{k}</dt>
          <dd className="text-[0.82rem] font-semibold text-ink tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function StatPanel({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "danger";
}) {
  return (
    <div className="rounded-xl border border-mist bg-paper/60 p-3">
      <p className="text-[0.66rem] uppercase tracking-wide text-slate">{label}</p>
      <p
        className={cn(
          "mt-1 text-[1.1rem] font-bold tabular-nums",
          tone === "success" ? "text-success" : "text-danger",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SourceNote({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-mist bg-paper/40 px-3 py-2">
      <p className="eyebrow mb-1 text-[0.6rem]">Backend record joins</p>
      <p className="font-mono text-[0.72rem] leading-relaxed text-slate">{text}</p>
    </div>
  );
}
