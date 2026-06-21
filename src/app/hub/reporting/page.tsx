"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Users2,
  Radio,
  Sparkles,
  Download,
  ChevronDown,
} from "lucide-react";
import { reportMetrics, getAgent } from "@/lib/data";
import type {
  ReportAgentLeaderboardRow,
  ReportSourceRoi,
  ReportFunnelStage,
} from "@/lib/types";
import {
  SegmentedKpis,
  SavedViewTabs,
  DataTable,
  InitialsToken,
  RecordDrawer,
  StatusChip,
  ProgressTrack,
  useAiSidecar,
  type Column,
  type SavedView,
} from "@/components/os";
import { streamAi } from "@/lib/ai/client";
import { cn, compactUsd, num, usd } from "@/lib/utils";
import {
  ReportsScorecard,
  type ScorecardMetric,
} from "@/components/command/reports/ReportsScorecard";
import { SourceRoiPanel } from "@/components/command/reports/SourceRoiPanel";
import { FunnelRamp } from "@/components/command/reports/FunnelRamp";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Reports + Accountability  (build-ref §2.10, source/10_reports.md)

   Sisu-style goals + agent leaderboard + marketing ROI + brokerage operating
   metrics. Sierra report grammar: KPI strip → company scorecard hero → report
   card grid (leaderboard / source ROI / funnel). Color-as-data scoreboard
   (green money / red cost). Every KPI + row drills into a light RecordDrawer;
   "Ask AI why this changed" docks the dark AI sidecar with a bound Context line.
   ────────────────────────────────────────────────────────────────────────── */

type DateRange = "MTD" | "QTD" | "YTD";
type Team = "All teams" | "Oregon" | "SW Washington";
type SourceFilter = "All sources" | "Paid" | "Organic" | "Referral";

type LeaderTab = "gci" | "signed" | "appts" | "leads";

const DATE_RANGES: DateRange[] = ["MTD", "QTD", "YTD"];

/* Drawer payloads ---------------------------------------------------------- */
type Drawer =
  | { kind: "metric"; metric: ScorecardMetric }
  | { kind: "agent"; row: ReportAgentLeaderboardRow }
  | { kind: "source"; source: ReportSourceRoi }
  | { kind: "stage"; stage: ReportFunnelStage }
  | null;

const SCORECARD_COPY: Record<
  ScorecardMetric,
  { title: string; sub: string; pct: number; lines: [string, string][] }
> = {
  volume: {
    title: "Annual volume",
    sub: "Closed + pending dollar volume vs. board goal",
    pct: 72,
    lines: [
      ["Actual (annualized)", compactUsd(reportMetrics.companyScorecard.annualVolume)],
      ["Board goal", compactUsd(reportMetrics.companyScorecard.goalPacing.volumeGoal)],
      ["Forecast (run-rate)", compactUsd(reportMetrics.companyScorecard.goalPacing.forecastVolume)],
      ["Avg sale price", compactUsd(reportMetrics.companyScorecard.avgSalePrice)],
    ],
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
  },
  sold: {
    title: "Properties sold",
    sub: "Closed units this year vs. unit goal",
    pct: 81,
    lines: [
      ["Sold YTD", num(reportMetrics.companyScorecard.propertiesSold)],
      ["Unit goal", num(reportMetrics.companyScorecard.goalPacing.soldGoal)],
      ["Pace", `${reportMetrics.companyScorecard.goalPacing.soldPacePct}%`],
      ["GCI YTD", compactUsd(reportMetrics.companyScorecard.gci)],
    ],
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
  },
};

function gciTone(gci: number): "success" | "warn" {
  return gci >= 250000 ? "success" : "warn";
}

export default function ReportingPage() {
  const { openAi } = useAiSidecar();

  const [range, setRange] = useState<DateRange>("YTD");
  const [team, setTeam] = useState<Team>("All teams");
  const [source, setSource] = useState<SourceFilter>("All sources");
  const [leaderTab, setLeaderTab] = useState<LeaderTab>("gci");
  const [drawer, setDrawer] = useState<Drawer>(null);

  const { companyScorecard, agentLeaderboard, sourceRoi, funnel } = reportMetrics;

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

  /* Totals to prove the scoreboard reconciles to its rows */
  const totalGci = agentLeaderboard.reduce((s, a) => s + a.gci, 0);
  const totalSigned = agentLeaderboard.reduce((s, a) => s + a.signed, 0);

  function askAi(context: string) {
    openAi(`Context: Reports / ${context}`);
    // Fire a live generation in the background so the sidecar has real analysis.
    void streamAi(
      {
        tool: "coach",
        input: { mode: "report-explain", context, range, team, source },
      },
      () => {},
    );
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
            <InitialsToken name={r.agent} />
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

  /* ── filter chip ─────────────────────────────────────────────────────── */
  const chip =
    "inline-flex items-center gap-1.5 rounded-full border border-mist bg-cloud px-3 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:text-ink";

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 pb-16 pt-3 md:px-6">
      {/* Subtitle eyebrow (no page <h1> — TopCommandBar owns the title) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.82rem] text-slate">
          Sisu-style goals, agent leaderboards, marketing ROI, and brokerage operating
          metrics — real-time.
        </p>
        <button
          type="button"
          className={cn(chip, "border-ink/15 text-ink")}
          onClick={() => undefined}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* Context filter chips — date / team / source */}
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

        <button
          type="button"
          onClick={() =>
            setTeam((t) =>
              t === "All teams" ? "Oregon" : t === "Oregon" ? "SW Washington" : "All teams",
            )
          }
          className={chip}
        >
          <Users2 className="h-3.5 w-3.5" />
          {team}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        <button
          type="button"
          onClick={() =>
            setSource((s) =>
              s === "All sources"
                ? "Paid"
                : s === "Paid"
                  ? "Organic"
                  : s === "Organic"
                    ? "Referral"
                    : "All sources",
            )
          }
          className={chip}
        >
          <Radio className="h-3.5 w-3.5" />
          {source}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        {/* Ask AI — gold is sanctioned (AI affordance) */}
        <button
          type="button"
          onClick={() => askAi("Executive overview")}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-1.5 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Ask AI why this changed
        </button>
      </div>

      {/* Segmented financial KPI strip — Revenue cell green (color-as-data) */}
      <SegmentedKpis
        items={[
          {
            label: "Volume",
            value: `${compactUsd(companyScorecard.annualVolume)}+`,
            sub: `${range} · 72% to goal`,
          },
          {
            label: "Closings",
            value: num(companyScorecard.propertiesSold),
            sub: `Goal ${num(companyScorecard.goalPacing.soldGoal)} · 81%`,
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

      {/* GRID — leaderboard (wide) + source ROI + funnel */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* (A) Agent leaderboard — color-as-data scoreboard */}
        <div className="lg:col-span-2">
          <div className="flex flex-col gap-3 rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="font-display text-[1.05rem] font-normal leading-none text-ink">
                  Agent leaderboard
                </h2>
                <p className="mt-1.5 text-[0.74rem] text-slate">
                  {totalSigned} signed · {compactUsd(totalGci)} GCI across{" "}
                  {agentLeaderboard.length} agents · {range}
                </p>
              </div>
              <button
                type="button"
                onClick={() => askAi("Agent accountability")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-mist px-2.5 py-1.5 text-[0.74rem] font-medium text-slate transition-colors hover:text-ink"
              >
                <Sparkles className="h-3.5 w-3.5 text-gold" />
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

        {/* (C) Lead funnel ramp (full width under the grid) */}
        <div className="lg:col-span-3">
          <FunnelRamp
            stages={funnel}
            onDrill={(s) => setDrawer({ kind: "stage", stage: s })}
          />
        </div>
      </div>

      {/* ── Drilldown drawer ─────────────────────────────────────────────── */}
      <ReportingDrawer drawer={drawer} onClose={() => setDrawer(null)} onAskAi={askAi} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Drilldown drawer — light record drawer for any KPI / row / source / stage.
   "KPI cards drill into source records" (acceptance criterion).
   ────────────────────────────────────────────────────────────────────────── */
function ReportingDrawer({
  drawer,
  onClose,
  onAskAi,
}: {
  drawer: Drawer;
  onClose: () => void;
  onAskAi: (context: string) => void;
}) {
  const open = drawer != null;

  let title = "";
  let subtitle = "";
  let context = "";
  let body: React.ReactNode = null;

  if (drawer?.kind === "metric") {
    const c = SCORECARD_COPY[drawer.metric];
    title = c.title;
    subtitle = c.sub;
    context = c.title;
    body = (
      <div className="space-y-5">
        <ProgressTrack
          label="% to goal"
          value={c.pct}
          tone={c.pct >= 80 ? "success" : c.pct >= 60 ? "gold" : "warn"}
          valueRight={`${c.pct}%`}
        />
        <DefinitionList rows={c.lines} />
        <SourceNote text="metrics_daily › listings + transactions › goals (board plan v3)" />
      </div>
    );
  } else if (drawer?.kind === "agent") {
    const r = drawer.row;
    const a = getAgent(r.slug);
    title = r.agent;
    subtitle = a?.title ?? "Sales agent";
    context = `Agent ${r.agent}`;
    const apptRate = r.leads ? Math.round((r.appts / r.leads) * 100) : 0;
    const signRate = r.appts ? Math.round((r.signed / r.appts) * 100) : 0;
    body = (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <InitialsToken name={r.agent} className="h-12 w-12 text-[0.9rem]" />
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
              <p className="mt-0.5 text-[0.66rem] uppercase tracking-wide text-slate">
                {s.label}
              </p>
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
    context = `Source ${s.source}`;
    const net = s.revenue - s.spend;
    body = (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2">
          <StatPanel label="Attributed revenue" value={compactUsd(s.revenue)} tone="success" />
          <StatPanel
            label="Marketing spend"
            value={s.spend === 0 ? "$0" : compactUsd(s.spend)}
            tone="danger"
          />
        </div>
        <DefinitionList
          rows={[
            ["Leads", num(s.leads)],
            ["Closed", num(s.closed)],
            ["Close rate", `${s.leads ? Math.round((s.closed / s.leads) * 100) : 0}%`],
            ["Cost per lead", s.cpl === 0 ? "$0 (referral)" : `$${num(s.cpl)}`],
            ["Net contribution", compactUsd(net)],
            [
              "Return on spend",
              s.spend === 0 ? "∞ (pure referral)" : `${(s.revenue / s.spend).toFixed(1)}x`,
            ],
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
    context = `Funnel ${s.stage}`;
    body = (
      <div className="space-y-5">
        <div>
          <p className="font-display text-[2rem] leading-none text-ink tabular-nums">
            {num(s.count)}
          </p>
          <p className="mt-1 text-[0.74rem] text-slate">contacts currently at this stage</p>
        </div>
        <SourceNote text="lead_events › saved_searches › appointments › transactions" />
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
        <>
          <button
            type="button"
            onClick={() => onAskAi(context)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-[0.8rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ask AI why
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-mist px-3 py-2 text-[0.8rem] font-medium text-ink transition-colors hover:bg-paper"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </>
      }
    >
      {body}
    </RecordDrawer>
  );
}

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
