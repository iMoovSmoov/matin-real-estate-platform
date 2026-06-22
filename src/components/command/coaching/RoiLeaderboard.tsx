"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import {
  DataTable,
  TwoLineCell,
  Avatar,
  type Column,
  type SavedView,
} from "@/components/os";
import { cn, compactUsd } from "@/lib/utils";
import {
  coachingStandings,
  conversionTone,
  scoreValueTone,
  CONVERSION_TARGET,
  type CoachingStanding,
} from "./coachingData";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Coaching · Team Coaching ROI leaderboard (S9 tickets 1 & 5)

   Sisu accountability scoreboard: real money/outcome columns (Closings this
   qtr, Conversion %, GCI) with the VALUE TEXT ITSELF colored — green good /
   red below target — no badge, no fill (build-reference §1.1 color-as-data).
   Tall open-ledger rows, a rank column, a ▲▼ delta-vs-last-quarter, and
   saved-view pill tabs (All / Behind pace / Top performers / Reviews due).
   Responsive: dense table at lg+, stacked cards below lg (DataTable.responsive).
   Row click → the per-agent coaching-plan drawer (owned by the page).
   ────────────────────────────────────────────────────────────────────────── */

type ViewKey = "all" | "behind" | "top" | "reviews";

const VIEW_META: { key: ViewKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "behind", label: "Behind pace" },
  { key: "top", label: "Top performers" },
  { key: "reviews", label: "Reviews due" },
];

/** A small ▲/▼ delta with the value colored by direction (Lofty/Sisu). */
function DeltaTick({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[0.72rem] font-medium text-slate tabular-nums">
        <Minus className="h-3 w-3" aria-hidden />0
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[0.72rem] font-semibold tabular-nums",
        up ? "text-success" : "text-danger",
      )}
    >
      {up ? <ArrowUp className="h-3 w-3" aria-hidden /> : <ArrowDown className="h-3 w-3" aria-hidden />}
      {Math.abs(delta)}
    </span>
  );
}

export function RoiLeaderboard({
  onSelectAgent,
}: {
  onSelectAgent: (s: CoachingStanding) => void;
}) {
  const [view, setView] = useState<ViewKey>("all");

  const counts = useMemo(
    () => ({
      all: coachingStandings.length,
      behind: coachingStandings.filter((r) => r.behind).length,
      top: coachingStandings.filter((r) => r.avgScore >= 85).length,
      reviews: coachingStandings.filter((r) => r.managerReviewDue).length,
    }),
    [],
  );

  const rows = useMemo<CoachingStanding[]>(() => {
    switch (view) {
      case "behind":
        return coachingStandings.filter((r) => r.behind);
      case "top":
        return coachingStandings.filter((r) => r.avgScore >= 85);
      case "reviews":
        return coachingStandings.filter((r) => r.managerReviewDue);
      case "all":
      default:
        return coachingStandings;
    }
  }, [view]);

  // Rank is by GCI within the full board (stable, not the filtered view).
  const rankBySlug = useMemo(() => {
    const m = new Map<string, number>();
    coachingStandings.forEach((r, i) => m.set(r.slug, i + 1));
    return m;
  }, []);

  const savedViews: { views: SavedView[]; active: string; onChange: (k: string) => void } = {
    views: VIEW_META.map((v) => ({ key: v.key, label: v.label, count: counts[v.key] })),
    active: view,
    onChange: (k) => setView(k as ViewKey),
  };

  const columns: Column<CoachingStanding>[] = [
    {
      key: "rank",
      header: "#",
      width: "44px",
      align: "center",
      cardHidden: true,
      render: (r) => (
        <span className="font-mono text-[0.8rem] font-semibold text-slate tabular-nums">
          {rankBySlug.get(r.slug)}
        </span>
      ),
    },
    {
      key: "name",
      header: "Agent",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={r.name} slug={r.slug} size={34} ring />
          <TwoLineCell title={r.name} sub={r.title} />
        </div>
      ),
    },
    {
      key: "closingsQtr",
      header: "Closings",
      align: "right",
      sortable: true,
      cardLabel: "Closings (qtr)",
      render: (r) => <span className="tabular-nums font-medium text-ink">{r.closingsQtr}</span>,
    },
    {
      key: "conversionPct",
      header: "Conversion",
      align: "right",
      sortable: true,
      // Sisu color-as-data: the VALUE text is green good / red below target.
      render: (r) => (
        <span
          className={cn(
            "text-[0.95rem] font-bold tabular-nums",
            conversionTone(r.conversionPct) === "success" ? "text-success" : "text-danger",
          )}
        >
          {r.conversionPct.toFixed(1)}%
        </span>
      ),
    },
    {
      key: "gci",
      header: "GCI",
      align: "right",
      sortable: true,
      primary: true, // pinned top-right on the mobile card (most important $)
      render: (r) => (
        <span className="text-[0.95rem] font-bold text-success tabular-nums">
          {compactUsd(r.gci)}
        </span>
      ),
    },
    {
      key: "avgScore",
      header: "Scorecard",
      align: "right",
      sortable: true,
      // The colored tabular number replaces the old gold avg-score chip.
      render: (r) => {
        const t = scoreValueTone(r.avgScore);
        return (
          <span
            className={cn(
              "text-[0.95rem] font-bold tabular-nums",
              t === "success" ? "text-success" : t === "warn" ? "text-warn" : "text-danger",
            )}
          >
            {r.avgScore}
          </span>
        );
      },
    },
    {
      key: "deltaVsLastQuarter",
      header: "Δ qtr",
      align: "right",
      sortable: true,
      cardLabel: "vs last qtr",
      render: (r) => <DeltaTick delta={r.deltaVsLastQuarter} />,
    },
  ];

  return (
    <DataTable<CoachingStanding>
      columns={columns}
      rows={rows}
      getRowId={(r) => r.slug}
      onRowClick={onSelectAgent}
      responsive
      savedViews={savedViews}
      utilityLeft={
        <span className="text-[0.78rem] text-slate">
          Conversion target {CONVERSION_TARGET}% · click a row for the coaching plan
        </span>
      }
    />
  );
}
