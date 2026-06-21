import type { ReportFunnelStage } from "@/lib/types";
import { cn, num } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Lead funnel ramp (build-ref §2.10)

   Structurely pipeline ramp: each named stage is a horizontal SVG bar whose
   length ∝ stage count, deepening gold as it nears Closed, with the count
   inside and the stage→stage conversion % at right. Gold here = the report's
   single-hue data ramp (not an AI affordance). Each row is a drilldown button
   → onDrill(stage). Server-safe presentational.
   ────────────────────────────────────────────────────────────────────────── */

// Pale → deep gold ramp via explicit fill-opacity (no dynamic Tailwind classes).
function rampOpacity(i: number, n: number): number {
  if (n <= 1) return 1;
  return 0.25 + (i / (n - 1)) * 0.75;
}

export function FunnelRamp({
  stages,
  onDrill,
}: {
  stages: ReportFunnelStage[];
  onDrill?: (stage: ReportFunnelStage) => void;
}) {
  const top = stages[0]?.count ?? 1;
  const bottom = stages[stages.length - 1]?.count ?? 0;
  const overall = top ? ((bottom / top) * 100).toFixed(1) : "0";
  const interactive = typeof onDrill === "function";

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-[1.05rem] font-normal leading-none text-ink">
            Lead funnel
          </h2>
          <p className="mt-1.5 text-[0.74rem] text-slate tabular-nums">
            {num(top)} leads → {num(bottom)} closed ·{" "}
            <span className="font-semibold text-success">{overall}% lead-to-close</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {stages.map((s, i) => {
          const pct = Math.max(6, Math.round((s.count / top) * 100));
          const prev = i === 0 ? null : stages[i - 1].count;
          const conv = prev ? Math.round((s.count / prev) * 100) : 100;
          const drop = conv < 45 && i > 0; // flag a leaky stage in red
          const body = (
            <>
              <div className="flex w-24 shrink-0 items-baseline justify-between gap-2 sm:w-32">
                <span className="text-[0.82rem] font-semibold text-ink">{s.stage}</span>
              </div>
              <div className="flex flex-1 items-center gap-3">
                <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="h-5 flex-1">
                  <rect x={0} y={0} width={100} height={20} rx={4} fill="var(--color-paper-200)" />
                  <rect
                    x={0}
                    y={0}
                    width={pct}
                    height={20}
                    rx={4}
                    fill="var(--color-gold)"
                    fillOpacity={rampOpacity(i, stages.length)}
                  />
                </svg>
                <span className="w-12 shrink-0 text-right text-[0.74rem] font-bold text-ink tabular-nums">
                  {num(s.count)}
                </span>
                <span
                  className={cn(
                    "w-16 shrink-0 text-right text-[0.74rem] tabular-nums",
                    drop ? "font-semibold text-danger" : "text-slate",
                  )}
                >
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
