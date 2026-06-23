"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useCountUp } from "./useCountUp";

/* ──────────────────────────────────────────────────────────────────────────
   Today Command Center — rich KPI tile (image-led redesign, §3)

   A Today-LOCAL tile (does NOT touch the shared os/KpiCard primitive). Anatomy:
     (a) tinted icon chip top-left — 36px rounded square, status-tinted ~14%
     (b) .eyebrow label
     (c) big Inter tabular-nums number, COLOR-AS-DATA on the value itself
         (danger → red, ai → estate-green, neutral → ink) — no badge
     (d) one-line context
     (e) optional thin bottom ratio bar where a TRUE part/whole exists
   The WHOLE tile is the drill button (-2px hover lift via .card-elevated). The
   value counts up on load (real number, animated reveal; reduced-motion safe).
   No fabricated sparklines — only honest part/whole ratio bars.
   ────────────────────────────────────────────────────────────────────────── */

export type KpiTone = "neutral" | "danger" | "ai";

const CHIP: Record<KpiTone, string> = {
  neutral: "bg-ink/[0.06] text-ink ring-ink/[0.08]",
  danger: "bg-danger/[0.14] text-danger ring-danger/20",
  ai: "bg-gold/[0.14] text-gold ring-gold/25",
};

const VALUE: Record<KpiTone, string> = {
  neutral: "text-ink",
  danger: "text-danger",
  ai: "text-gold-bright",
};

const BAR: Record<NonNullable<RatioTone>, string> = {
  neutral: "bg-ink/35",
  success: "bg-success",
  danger: "bg-danger",
  ai: "bg-gold-bright",
};

type RatioTone = "neutral" | "success" | "danger" | "ai";

export function TodayKpiTile({
  tone = "neutral",
  icon,
  label,
  value,
  context,
  ratio,
  onDrill,
}: {
  tone?: KpiTone;
  /** Lucide glyph (or MatinMark for ai tiles) — seated in the tinted chip. */
  icon: ReactNode;
  label: string;
  value: number;
  context: string;
  /** Honest part/whole mini-viz — omit where no true ratio exists. */
  ratio?: { value: number; whole: number; label: string; tone?: RatioTone };
  onDrill: () => void;
}) {
  const shown = useCountUp(value);
  const pct =
    ratio && ratio.whole > 0
      ? Math.max(0, Math.min(100, (ratio.value / ratio.whole) * 100))
      : 0;

  return (
    <button
      type="button"
      onClick={onDrill}
      className="card-elevated group flex min-w-0 flex-col p-3.5 text-left transition-colors hover:border-ink/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 sm:p-5"
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
          CHIP[tone],
        )}
      >
        {icon}
      </span>

      <p className="mt-3 line-clamp-2 text-[0.66rem] font-semibold uppercase leading-tight tracking-[0.07em] text-slate sm:text-[0.7rem] sm:tracking-[0.1em]">
        {label}
      </p>

      <div className="mt-1.5 flex items-baseline gap-2">
        <span
          className={cn(
            "font-sans text-[1.85rem] font-bold leading-none tabular-nums sm:text-[2.2rem]",
            VALUE[tone],
          )}
        >
          {Math.round(shown)}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-[0.74rem] leading-snug text-slate">{context}</p>

      {ratio ? (
        <div className="mt-3">
          <span className="relative block h-1.5 w-full overflow-hidden rounded-full bg-paper-200">
            <span
              className={cn("absolute inset-y-0 left-0 rounded-full", BAR[ratio.tone ?? "neutral"])}
              style={{ width: `${pct}%` }}
            />
          </span>
          <p className="mt-1.5 text-[0.68rem] font-medium text-slate tabular-nums">{ratio.label}</p>
        </div>
      ) : null}
    </button>
  );
}
