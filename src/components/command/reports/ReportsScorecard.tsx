import { ScoreRing, PaceBar } from "@/components/os";
import type { CompanyScorecard } from "@/lib/types";
import { cn, compactUsd, num } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Reports — Company scorecard hero

   Sierra report-grammar opener: a row of 4 goal-pacing scorecard cells, each a
   gold ScoreRing (% to goal) + big tabular value + label, over a Lofty
   goal-pacing PaceBar (actual fill + dashed Pace + dashed Forecast + sentence
   headline). Gold lives only on the score rings (AI/score viz — sanctioned).
   Each cell is a drilldown button → onDrill(metricKey). Server-safe.
   ────────────────────────────────────────────────────────────────────────── */

export type ScorecardMetric = "volume" | "listings" | "sold" | "growth";

type Cell = {
  key: ScorecardMetric;
  ring: number;
  value: string;
  label: string;
  goalLabel: string;
};

export function ReportsScorecard({
  scorecard,
  onDrill,
}: {
  scorecard: CompanyScorecard;
  onDrill?: (metric: ScorecardMetric) => void;
}) {
  const { goalPacing } = scorecard;

  const cells: Cell[] = [
    {
      key: "volume",
      ring: 72,
      value: `${compactUsd(scorecard.annualVolume)}+`,
      label: "Annual volume",
      goalLabel: `Goal ${compactUsd(goalPacing.volumeGoal)} · 72% to goal`,
    },
    {
      key: "listings",
      ring: 65,
      value: `${scorecard.activeListings}+`,
      label: "Active listings",
      goalLabel: "Goal 172 · 65% to goal",
    },
    {
      key: "sold",
      ring: 81,
      value: num(scorecard.propertiesSold),
      label: "Properties sold",
      goalLabel: `Goal ${num(goalPacing.soldGoal)} · 81% to goal`,
    },
    {
      key: "growth",
      ring: 78,
      value: `${scorecard.growthPct}%`,
      label: "Growth this year",
      goalLabel: "Goal 45% YoY · 78% to goal",
    },
  ];

  return (
    <section className="rounded-2xl border border-mist bg-cloud p-5 shadow-soft sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[1.1rem] font-normal leading-none text-ink">
          Company scorecard
        </h2>
        <span className="text-[0.72rem] font-medium text-slate">
          Annualized · vs board goal
        </span>
      </div>

      {/* 4 score-ring scorecard cells */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cells.map((c) => {
          const interactive = typeof onDrill === "function";
          const body = (
            <>
              <ScoreRing value={c.ring} size={64} />
              <div className="min-w-0">
                <p className="font-sans text-[1.5rem] font-bold leading-none text-ink tabular-nums">
                  {c.value}
                </p>
                <p className="mt-1.5 text-[0.78rem] font-medium leading-none text-ink">
                  {c.label}
                </p>
                <p className="mt-1 text-[0.7rem] leading-tight text-slate">{c.goalLabel}</p>
              </div>
            </>
          );
          const base =
            "flex items-center gap-3.5 rounded-xl border border-mist bg-paper/60 p-4 text-left";
          return interactive ? (
            <button
              key={c.key}
              type="button"
              onClick={() => onDrill!(c.key)}
              className={cn(
                base,
                "transition-colors hover:border-ink/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
              )}
            >
              {body}
            </button>
          ) : (
            <div key={c.key} className={base}>
              {body}
            </div>
          );
        })}
      </div>

      {/* Goal-pacing bar (volume) */}
      <div className="mt-5 rounded-xl border border-mist bg-paper/60 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="eyebrow text-[0.66rem]">Volume goal pacing</span>
          <span className="text-[0.72rem] font-semibold text-slate tabular-nums">
            {compactUsd(goalPacing.volumeActual)} / {compactUsd(goalPacing.volumeGoal)}
          </span>
        </div>
        <PaceBar
          value={72}
          pace={75}
          forecast={Math.round((goalPacing.forecastVolume / goalPacing.volumeGoal) * 100)}
          headline={goalPacing.statusHeadline}
        />
      </div>
    </section>
  );
}
