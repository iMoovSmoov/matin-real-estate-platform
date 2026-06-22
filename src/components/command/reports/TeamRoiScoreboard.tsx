"use client";

import type { ReportSourceRoi } from "@/lib/types";
import { cn, num } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Reports — TeamRoiScoreboard  (S10 ticket 6, Sisu "Team ROI by Lead Source")

   The Sisu accountability scoreboard: a clean 3-column ledger —
   SOURCE | ROI% (bold green) | COST/LEAD (bold red) — large type, uppercase
   letterspaced column headers, open-ledger rhythm (hairline rows, no zebra).
   Color-as-data: the ROI value text is green, the cost-per-lead value text is
   red — no badges, no fills. "Facebook Ads" is renamed to "Meta".

   ROI% is return-on-spend on attributed commission (≈2.5% GCI), so a pure
   referral channel ($0 spend) reads as ∞. Each row drills into the source
   record. Server-safe presentational.
   ────────────────────────────────────────────────────────────────────────── */

const GCI_BASIS = 0.025;

/** Brand rename: Facebook Ads → Meta (consistent with Marketing audience map). */
function displaySource(source: string): string {
  if (/facebook/i.test(source)) return "Meta";
  return source;
}

/** ROI% = attributed GCI ÷ spend × 100; pure referral ($0 spend) → ∞. */
function roiPct(s: ReportSourceRoi): { label: string; raw: number } {
  if (s.spend === 0) return { label: "∞", raw: Infinity };
  const pct = Math.round(((s.revenue * GCI_BASIS) / s.spend) * 100);
  return { label: `${num(pct)}%`, raw: pct };
}

export function TeamRoiScoreboard({
  sources,
  onDrill,
}: {
  sources: ReportSourceRoi[];
  onDrill?: (source: ReportSourceRoi) => void;
}) {
  const interactive = typeof onDrill === "function";
  // Rank by ROI so the strongest channel sits at the top of the ledger.
  const ranked = [...sources].sort((a, b) => roiPct(b).raw - roiPct(a).raw);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[1.05rem] font-normal leading-none text-ink">
          Team ROI by Lead Source
        </h2>
        <span className="text-[0.72rem] font-medium text-slate">
          Attributed commission ÷ spend
        </span>
      </div>

      {/* Column headers — uppercase letterspaced (Sisu) */}
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-mist pb-2">
        <span className="eyebrow text-[0.64rem]">Source</span>
        <span className="eyebrow w-16 text-right text-[0.64rem] sm:w-20">ROI</span>
        <span className="eyebrow w-20 text-right text-[0.64rem] sm:w-24">Cost / lead</span>
      </div>

      <div className="flex flex-col">
        {ranked.map((s) => {
          const roi = roiPct(s);
          const body = (
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4">
              <div className="min-w-0">
                <p className="truncate text-[0.92rem] font-semibold text-ink">
                  {displaySource(s.source)}
                </p>
                <p className="text-[0.7rem] text-slate tabular-nums">
                  {num(s.leads)} leads · {s.closed} closed
                </p>
              </div>
              {/* ROI% — bold GREEN value text, no badge (color-as-data) */}
              <p className="w-16 text-right text-[1.15rem] font-bold tabular-nums text-success sm:w-20 sm:text-[1.3rem]">
                {roi.label}
              </p>
              {/* Cost / lead — bold RED value text, no badge */}
              <p className="w-20 text-right text-[1.15rem] font-bold tabular-nums text-danger sm:w-24 sm:text-[1.3rem]">
                {s.cpl === 0 ? "$0" : `$${num(s.cpl)}`}
              </p>
            </div>
          );
          return interactive ? (
            <button
              key={s.source}
              type="button"
              onClick={() => onDrill!(s)}
              className={cn(
                "-mx-2 rounded-lg border-b border-mist/70 px-2 py-3 text-left transition-colors",
                "last:border-b-0 hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20",
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
    </section>
  );
}
