import { CalloutCard, AIInsightChip } from "@/components/os";
import type { ReportSourceRoi } from "@/lib/types";
import { cn, compactUsd, num } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Marketing ROI + Source Quality (build-ref §2.10)

   One horizontal SVG bar per lead source (single-hue ink ramp, length ∝
   attributed revenue) with a return-multiplier label. Color-as-data (Sisu):
   the ROI multiplier prints success-green, cost-per-lead danger-red — value
   text only, no badges. CPL also drives a small red dot whose opacity scales
   with cost so the worst channels read at a glance. Each row is a drilldown
   button → onDrill(source). Ends with a DARK tone="ai" insight callout.
   ────────────────────────────────────────────────────────────────────────── */

/* `revenue` is gross sale volume; real marketing ROAS compares the commission
   it earns (≈2.5% GCI on the buy/list side) against ad spend — so the numbers
   read like a media buyer's dashboard (e.g. 3.8x), not raw volume÷spend. */
const GCI_BASIS = 0.025;
const attributedGci = (s: ReportSourceRoi) => s.revenue * GCI_BASIS;

/** GCI ÷ spend; pure referral ($0 spend) reads as ∞ (no paid attribution). */
function multiplier(s: ReportSourceRoi): string {
  if (s.spend === 0) return "∞";
  return `${(attributedGci(s) / s.spend).toFixed(1)}x`;
}

export function SourceRoiPanel({
  sources,
  onDrill,
}: {
  sources: ReportSourceRoi[];
  onDrill?: (source: ReportSourceRoi) => void;
}) {
  const maxRevenue = Math.max(...sources.map((s) => s.revenue), 1);
  const maxCpl = Math.max(...sources.map((s) => s.cpl), 1);
  const interactive = typeof onDrill === "function";

  const totalGci = sources.reduce((s, x) => s + attributedGci(x), 0);
  const totalSpend = sources.reduce((s, x) => s + x.spend, 0);
  const blendedRoas = totalSpend ? (totalGci / totalSpend).toFixed(1) : "∞";

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[1.05rem] font-normal leading-none text-ink">
          Marketing ROI + Source Quality
        </h2>
        <span className="text-[0.72rem] font-medium text-slate tabular-nums">
          Blended {blendedRoas}x ROAS
        </span>
      </div>

      {/* Column legend */}
      <div className="flex items-center justify-between gap-2 border-b border-mist pb-2">
        <span className="eyebrow text-[0.64rem]">Source · attributed volume</span>
        <div className="flex items-center gap-5">
          <span className="eyebrow w-12 text-right text-[0.64rem]">ROAS</span>
          <span className="eyebrow w-16 text-right text-[0.64rem]">Cost / lead</span>
        </div>
      </div>

      <div className="flex flex-col">
        {sources.map((s) => {
          const pct = Math.max(4, Math.round((s.revenue / maxRevenue) * 100));
          // CPL "heat": worse cost → more saturated red dot (color-as-data).
          const cplHeat = s.cpl === 0 ? 0 : Math.max(0.25, Math.min(1, s.cpl / maxCpl));
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
                  <span className="w-12 text-right text-[0.86rem] font-bold text-success tabular-nums">
                    {multiplier(s)}
                  </span>
                  {/* Cost per lead — red value text + heat dot, no badge */}
                  <span className="flex w-16 items-center justify-end gap-1.5 text-[0.86rem] font-bold text-danger tabular-nums">
                    {s.cpl > 0 ? (
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 rounded-full bg-danger"
                        style={{ opacity: cplHeat }}
                      />
                    ) : null}
                    {s.cpl === 0 ? "$0" : `$${num(s.cpl)}`}
                  </span>
                </div>
              </div>
              {/* Single-hue revenue bar (SVG ink ramp) */}
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="h-2.5 flex-1">
                  <rect x={0} y={0} width={100} height={10} rx={3} fill="var(--color-paper-200)" />
                  <rect x={0} y={0} width={pct} height={10} rx={3} fill="var(--color-ink)" fillOpacity={0.8} />
                </svg>
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
