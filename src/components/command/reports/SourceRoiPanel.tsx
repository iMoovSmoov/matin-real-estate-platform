import { CalloutCard, AIInsightChip } from "@/components/os";
import type { ReportSourceRoi } from "@/lib/types";
import { cn, compactUsd, num } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Reports — Marketing ROI + Source Quality

   Horizontal bar per lead source (single-hue ink ramp, length ∝ attributed
   revenue) with a return-multiplier label (e.g. 4.3x). Color-as-data (Sisu):
   the ROI multiplier prints in success-green, cost-per-lead in danger-red —
   value text only, no badges. Ends with a DARK tone="ai" CalloutCard insight.
   Each row is a drilldown button → onDrill(source). Server-safe presentational.
   ────────────────────────────────────────────────────────────────────────── */

/** Revenue ÷ spend; pure referral ($0 spend) reads as ∞ (no paid attribution). */
function multiplier(s: ReportSourceRoi): string {
  if (s.spend === 0) return "∞";
  return `${(s.revenue / s.spend).toFixed(1)}x`;
}

export function SourceRoiPanel({
  sources,
  onDrill,
}: {
  sources: ReportSourceRoi[];
  onDrill?: (source: ReportSourceRoi) => void;
}) {
  const maxRevenue = Math.max(...sources.map((s) => s.revenue), 1);
  const interactive = typeof onDrill === "function";

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[1.05rem] font-normal leading-none text-ink">
          Marketing ROI + Source Quality
        </h2>
        <span className="text-[0.72rem] font-medium text-slate">
          Attributed revenue · YTD
        </span>
      </div>

      {/* Column legend */}
      <div className="flex items-center justify-between gap-2 border-b border-mist pb-2">
        <span className="eyebrow text-[0.64rem]">Source</span>
        <div className="flex items-center gap-5">
          <span className="eyebrow w-14 text-right text-[0.64rem]">Return</span>
          <span className="eyebrow w-16 text-right text-[0.64rem]">Cost / lead</span>
        </div>
      </div>

      <div className="flex flex-col">
        {sources.map((s) => {
          const pct = Math.max(4, Math.round((s.revenue / maxRevenue) * 100));
          const body = (
            <>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="truncate text-[0.84rem] font-semibold text-ink">
                    {s.source}
                  </span>
                  <span className="shrink-0 text-[0.72rem] text-slate tabular-nums">
                    {num(s.leads)} leads · {s.closed} closed
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-5">
                  {/* ROI multiplier — green value text, no badge */}
                  <span className="w-14 text-right text-[0.86rem] font-bold text-success tabular-nums">
                    {multiplier(s)}
                  </span>
                  {/* Cost per lead — red value text, no badge */}
                  <span className="w-16 text-right text-[0.86rem] font-bold text-danger tabular-nums">
                    {s.cpl === 0 ? "$0" : `$${num(s.cpl)}`}
                  </span>
                </div>
              </div>
              {/* Single-hue revenue bar (ink ramp) */}
              <div className="flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper-200">
                  <div
                    className="h-full rounded-full bg-ink/80"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-[0.78rem] font-semibold text-ink tabular-nums">
                  {compactUsd(s.revenue)}
                </span>
              </div>
            </>
          );
          return interactive ? (
            <button
              key={s.source}
              type="button"
              onClick={() => onDrill!(s)}
              className={cn(
                "border-b border-mist/70 py-3 text-left transition-colors last:border-b-0 hover:bg-paper",
                "-mx-2 rounded-lg px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
              )}
            >
              {body}
            </button>
          ) : (
            <div key={s.source} className="border-b border-mist/70 py-3 last:border-b-0">
              {body}
            </div>
          );
        })}
      </div>

      {/* Dark AI insight callout */}
      <CalloutCard
        tone="ai"
        title="AI insight: route source intent by velocity, not just ROI"
        action={
          <AIInsightChip>Suggested: split nurture vs. hot-seller routing</AIInsightChip>
        }
      >
        IDX / SEO leads close slower but produce higher listing volume per dollar — keep
        them on the long nurture track. Cash Offer Funnel and Referral convert fastest;
        route that hot seller intent to a live agent within the 4-minute speed-to-lead window
        instead of the standard drip.
      </CalloutCard>
    </section>
  );
}
