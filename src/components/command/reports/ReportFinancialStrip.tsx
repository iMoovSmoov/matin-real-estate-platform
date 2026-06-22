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
        // R8: real responsive columns — 2-up phone, 4-up sm+. No inline
        // gridTemplateColumns (the bug we're fixing). Cell borders come from a
        // 1px gap over an ink/mist backdrop so dividers render cleanly in both
        // the 2x2 phone grid and the 1x4 desktop row.
        "grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-mist bg-mist shadow-soft sm:grid-cols-4",
        className,
      )}
    >
      {cells.map((c) => {
        const interactive = typeof c.onDrill === "function";
        const up = (c.deltaPct ?? 0) >= 0;
        const body = (
          <>
            <p className="text-[0.74rem] font-medium uppercase tracking-[0.1em] leading-none text-slate">
              {c.label}
            </p>
            <p
              className={cn(
                "mt-2.5 font-sans text-[2.1rem] font-bold leading-none tabular-nums sm:text-[2.5rem]",
                c.tone === "success" ? "text-success" : "text-ink",
              )}
            >
              {c.money ? <span className="text-slate">$</span> : null}
              {c.value}
            </p>
            <div className="mt-2 flex items-center gap-2">
              {c.sub != null ? (
                <p className="text-[0.72rem] leading-tight text-slate">{c.sub}</p>
              ) : null}
              {typeof c.deltaPct === "number" ? (
                <span
                  className={cn(
                    "ml-auto inline-flex items-center gap-0.5 text-[0.72rem] font-semibold tabular-nums",
                    up ? "text-success" : "text-danger",
                  )}
                >
                  {up ? "▲" : "▼"} {Math.abs(c.deltaPct)}%
                </span>
              ) : null}
            </div>
          </>
        );
        const base = "bg-cloud px-5 py-5 text-left sm:py-6";
        return interactive ? (
          <button
            key={c.key}
            type="button"
            onClick={c.onDrill}
            className={cn(
              base,
              "transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink/20",
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
