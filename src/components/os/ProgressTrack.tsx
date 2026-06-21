import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — ProgressTrack / PaceBar   (ref §1.10)

   ProgressTrack — labeled horizontal bar + right-aligned value.
     tone: success=done · warn/gold=partial · danger=at-risk · info=neutral

   PaceBar — Lofty goal-pacing signature: actual fill + dashed "Pace" marker +
   dashed "Forecast" marker + a sentence-status headline. Used in Coaching /
   Reports. Server-safe, no animation.
   ────────────────────────────────────────────────────────────────────────── */

export type TrackTone = "success" | "warn" | "danger" | "info" | "gold" | "ink";

const FILL: Record<TrackTone, string> = {
  success: "bg-success",
  warn: "bg-warn",
  danger: "bg-danger",
  info: "bg-info",
  gold: "bg-gold",
  ink: "bg-ink",
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function ProgressTrack({
  label,
  value,
  tone = "ink",
  valueRight,
  className,
}: {
  label: ReactNode;
  value: number;
  tone?: TrackTone;
  valueRight?: ReactNode;
  className?: string;
}) {
  const pct = clamp(value);
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-[0.8rem] font-medium text-ink">{label}</span>
        <span className="text-[0.78rem] font-semibold text-slate tabular-nums">
          {valueRight ?? `${Math.round(pct)}%`}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-paper-200"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full", FILL[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function PaceBar({
  value,
  pace,
  forecast,
  headline,
  tone,
  className,
}: {
  value: number;
  pace: number;
  forecast: number;
  headline?: ReactNode;
  tone?: TrackTone;
  className?: string;
}) {
  const v = clamp(value);
  const p = clamp(pace);
  const f = clamp(forecast);
  // Behind pace → coral fill, on/ahead → success (Lofty blue→coral flip).
  const fillTone: TrackTone = tone ?? (v + 0.5 < p ? "danger" : "success");

  return (
    <div className={cn("w-full", className)}>
      {headline != null ? (
        <p className="mb-2 text-[0.82rem] leading-snug text-ink">{headline}</p>
      ) : null}
      <div className="relative h-3 w-full rounded-full bg-paper-200">
        {/* actual fill */}
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full", FILL[fillTone])}
          style={{ width: `${v}%` }}
        />
        {/* dashed Pace marker */}
        <span
          className="absolute inset-y-[-3px] w-0 border-l-2 border-dashed border-ink/55"
          style={{ left: `${p}%` }}
          aria-hidden
        />
        {/* dashed Forecast marker */}
        <span
          className="absolute inset-y-[-3px] w-0 border-l-2 border-dashed border-slate/60"
          style={{ left: `${f}%` }}
          aria-hidden
        />
      </div>
      <div className="mt-1.5 flex items-center gap-4 text-[0.7rem] text-slate">
        <span className="inline-flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full", FILL[fillTone])} />
          Actual {Math.round(v)}%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0 w-3 border-t-2 border-dashed border-ink/55" />
          Pace {Math.round(p)}%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0 w-3 border-t-2 border-dashed border-slate/60" />
          Forecast {Math.round(f)}%
        </span>
      </div>
    </div>
  );
}
