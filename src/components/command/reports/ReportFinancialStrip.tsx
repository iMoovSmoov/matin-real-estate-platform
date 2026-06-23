"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Reports — ReportFinancialStrip  (S10 tickets 1 + 9)

   The taller hero financial band that REPLACES the overflowing SegmentedKpis on
   this page. Ticket 1: the shared SegmentedKpis sets an inline
   `gridTemplateColumns: repeat(N, …)` that forces N columns even on a 360px
   phone (R8 violation). This local strip uses real responsive Tailwind
   (`grid-cols-2 sm:grid-cols-4`) so it never overflows.

   Ticket 9: bigger band — ~2.4–2.6rem numerals, a `$` glyph prefix on money,
   a Revenue cell, and a colored ▲/▼ vs-prior delta in every cell. Revenue/money
   cells print success-green (color-as-data); cost/negative deltas print red.
   Each cell is a drilldown button when `onDrill` is provided.
   ────────────────────────────────────────────────────────────────────────── */

export type FinancialCell = {
  key: string;
  label: string;
  /** Display value (already formatted, no leading $ — the glyph is added). */
  value: ReactNode;
  /** Prefix the value with a `$` glyph (money cells). */
  money?: boolean;
  /** success = green value (revenue/positive money); ink = default. */
  tone?: "ink" | "success";
  /** Sub-stat under the number (e.g. "Goal 340 · 90% to goal"). */
  sub?: ReactNode;
  /** Signed delta-vs-prior percent (drives the colored ▲/▼). */
  deltaPct?: number;
  onDrill?: () => void;
};

export function ReportFinancialStrip({
  cells,
  className,
}: {
  cells: FinancialCell[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Design #os-reports KPI strip: separate gradient `.card-elevated` tiles
        // on a 13px gap — 2-up phone, 4-up sm+ (R8: real responsive columns, no
        // inline gridTemplateColumns). Matches the OS-wide KpiCard tile treatment.
        "grid grid-cols-2 gap-[13px] sm:grid-cols-4",
        className,
      )}
    >
      {cells.map((c) => {
        const interactive = typeof c.onDrill === "function";
        const hasDelta = typeof c.deltaPct === "number";
        const up = (c.deltaPct ?? 0) >= 0;
        const body = (
          <>
            <p className="truncate text-[0.72rem] font-medium uppercase tracking-[0.08em] leading-none text-slate">
              {c.label}
            </p>
            <p
              className={cn(
                "mt-2.5 font-sans text-[1.55rem] font-bold leading-none tabular-nums sm:text-[1.9rem]",
                c.tone === "success" ? "text-success" : "text-ink",
              )}
            >
              {c.money ? <span className="text-slate">$</span> : null}
              {c.value}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              {/* Design's green up-pill delta (text #3f7d5e on gold-soft); a real
                  negative prints a soft danger pill (status carried by color). */}
              {hasDelta ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-[7px] py-0.5 text-[0.7rem] font-semibold tabular-nums",
                    up ? "bg-gold-soft text-[#3f7d5e]" : "bg-danger/10 text-danger",
                  )}
                >
                  {up ? "↑" : "↓"} {Math.abs(c.deltaPct ?? 0)}%
                </span>
              ) : null}
              {c.sub != null ? (
                <p className="min-w-0 flex-1 truncate text-[0.7rem] leading-tight text-slate">
                  {c.sub}
                </p>
              ) : null}
            </div>
          </>
        );
        const base = "card-elevated rounded-2xl p-4 text-left sm:p-5";
        return interactive ? (
          <button
            key={c.key}
            type="button"
            onClick={c.onDrill}
            className={cn(
              base,
              "group transition-colors hover:border-ink/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink/20",
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
  );
}
