import type { ReportFunnelStage } from "@/lib/types";
import { cn, num } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Reports — Lead funnel ramp

   Structurely pipeline ramp rendered as a single-hue GOLD/amber progressive
   bar set (build-ref §2.10): each named stage is a horizontal bar whose length
   ∝ stage count, deepening gold as it nears Closed, with a stage→stage
   conversion % printed at right. Gold here = the report's single-hue ramp
   accent (a data ramp, not an AI affordance). Server-safe presentational.
   ────────────────────────────────────────────────────────────────────────── */

// Pale → deep gold ramp; index maps to depth toward the terminal Closed stage.
const RAMP = [
  "bg-gold/25",
  "bg-gold/40",
  "bg-gold/55",
  "bg-gold/70",
  "bg-gold/85",
  "bg-gold",
];

export function FunnelRamp({
  stages,
  onDrill,
}: {
  stages: ReportFunnelStage[];
  onDrill?: (stage: ReportFunnelStage) => void;
}) {
  const top = stages[0]?.count ?? 1;
  const interactive = typeof onDrill === "function";

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[1.05rem] font-normal leading-none text-ink">
          Lead funnel
        </h2>
        <span className="text-[0.72rem] font-medium text-slate">
          {num(top)} leads → {num(stages[stages.length - 1]?.count ?? 0)} closed
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {stages.map((s, i) => {
          const pct = Math.max(6, Math.round((s.count / top) * 100));
          const prev = i === 0 ? null : stages[i - 1].count;
          const conv = prev ? Math.round((s.count / prev) * 100) : 100;
          const body = (
            <>
              <div className="flex w-28 shrink-0 items-baseline justify-between gap-2 sm:w-32">
                <span className="text-[0.82rem] font-semibold text-ink">{s.stage}</span>
              </div>
              <div className="flex flex-1 items-center gap-3">
                <div className="h-5 flex-1 overflow-hidden rounded-md bg-paper-200">
                  <div
                    className={cn(
                      "flex h-full items-center justify-end rounded-md px-2",
                      RAMP[Math.min(i, RAMP.length - 1)],
                    )}
                    style={{ width: `${pct}%` }}
                  >
                    <span className="text-[0.7rem] font-bold text-ink/80 tabular-nums">
                      {num(s.count)}
                    </span>
                  </div>
                </div>
                <span className="w-16 shrink-0 text-right text-[0.74rem] text-slate tabular-nums">
                  {i === 0 ? "entry" : `${conv}% ↓`}
                </span>
              </div>
            </>
          );
          return interactive ? (
            <button
              key={s.stage}
              type="button"
              onClick={() => onDrill!(s)}
              className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1 text-left transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
            >
              {body}
            </button>
          ) : (
            <div key={s.stage} className="flex items-center gap-3 px-2 py-1">
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}
