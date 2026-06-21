import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — StatusChip / Dot / ScoreChip / PriorityBadge   (ref §1.6, §1.10)

   Status carries meaning through the §1.1 palette, never decoration:
     success = good/complete/up/connected/on-pace
     danger  = bad/overdue/failed/at-risk/cost/down
     warn    = in-progress/pending/needs-action
     info    = scheduled/neutral/informational
     ink     = terminal (Closing/Won) — black pill
     gold    = AI / active-state ONLY (rationed)

   Two render variants:
     solid — saturated fill for urgency states ("2 days left", "Scheduled")
     soft  — pale tinted fill for scores / automation-state (default)

   Server-safe (no hooks).
   ────────────────────────────────────────────────────────────────────────── */

export type ChipTone = "success" | "danger" | "warn" | "info" | "ink" | "gold";

const SOFT: Record<ChipTone, string> = {
  success: "bg-success/12 text-success ring-success/25",
  danger: "bg-danger/12 text-danger ring-danger/25",
  warn: "bg-warn/15 text-warn ring-warn/30",
  info: "bg-info/12 text-info ring-info/25",
  ink: "bg-ink/[0.06] text-ink ring-ink/[0.12]",
  gold: "bg-gold-soft text-gold-ink ring-gold/25",
};

const SOLID: Record<ChipTone, string> = {
  success: "bg-success text-cloud ring-success",
  danger: "bg-danger text-cloud ring-danger",
  warn: "bg-warn text-cloud ring-warn",
  info: "bg-info text-cloud ring-info",
  ink: "bg-ink text-cloud ring-ink",
  gold: "bg-gold text-ink ring-gold",
};

export function StatusChip({
  children,
  tone,
  variant = "soft",
  className,
}: {
  children: ReactNode;
  tone: ChipTone;
  variant?: "solid" | "soft";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.72rem] font-medium leading-none ring-1 ring-inset tabular-nums",
        (variant === "solid" ? SOLID : SOFT)[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Bare semantic status dot (the 4-color row marker — Sierra/Lofty). */
export function Dot({
  tone,
  className,
}: {
  tone: ChipTone;
  className?: string;
}) {
  const fills: Record<ChipTone, string> = {
    success: "bg-success",
    danger: "bg-danger",
    warn: "bg-warn",
    info: "bg-info",
    ink: "bg-ink",
    gold: "bg-gold",
  };
  return (
    <span
      aria-hidden
      className={cn("inline-block h-2 w-2 shrink-0 rounded-full", fills[tone], className)}
    />
  );
}

/** Pale-gold score chip — AI lead/seller-intent score (ref §1.6). */
export function ScoreChip({
  score,
  suffix = "score",
  className,
}: {
  score: number;
  suffix?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gold-soft px-2 py-0.5 text-[0.72rem] font-semibold leading-none text-gold-ink ring-1 ring-inset ring-gold/25 tabular-nums",
        className,
      )}
    >
      {Math.round(score)}
      {suffix ? <span className="font-medium opacity-70">{suffix}</span> : null}
    </span>
  );
}

export type PriorityLevel = "high" | "medium" | "low";

/** Priority badge — maps a priority level to the status palette. */
export function PriorityBadge({
  level,
  className,
}: {
  level: PriorityLevel;
  className?: string;
}) {
  const map: Record<PriorityLevel, { tone: ChipTone; label: string }> = {
    high: { tone: "danger", label: "High" },
    medium: { tone: "warn", label: "Medium" },
    low: { tone: "info", label: "Low" },
  };
  const { tone, label } = map[level];
  return (
    <StatusChip tone={tone} variant="soft" className={className}>
      <Dot tone={tone} />
      {label}
    </StatusChip>
  );
}
