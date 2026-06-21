import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — MilestoneTimeline   (ref §1.7)

   Vertical milestone timeline (Transactions — wireframe 09): a connecting line
   (border-mist) with colored node dots + bold milestone title + muted date.
   Node colors use the status palette; the TERMINAL node (Closing/Won) is a
   solid ink/black dot. "Date-driven and audit-friendly." Server-safe.
   ────────────────────────────────────────────────────────────────────────── */

export type MilestoneTone = "success" | "danger" | "warn" | "info" | "ink";

export type Milestone = {
  id: string;
  title: ReactNode;
  dateLabel: ReactNode;
  tone: MilestoneTone;
  /** Terminal node (Closing/Won) — rendered as a solid ink/black dot. */
  terminal?: boolean;
};

const NODE: Record<MilestoneTone, string> = {
  success: "bg-success",
  danger: "bg-danger",
  warn: "bg-warn",
  info: "bg-info",
  ink: "bg-ink",
};

export function MilestoneTimeline({
  milestones,
  className,
}: {
  milestones: Milestone[];
  className?: string;
}) {
  return (
    <ol className={cn("relative w-full", className)}>
      {milestones.map((m, i) => {
        const isLast = i === milestones.length - 1;
        const dotTone = m.terminal ? "ink" : m.tone;
        return (
          <li key={m.id} className="relative flex gap-3 pb-6 last:pb-0">
            {/* Connecting line (between nodes) */}
            {!isLast ? (
              <span
                aria-hidden
                className="absolute left-[7px] top-4 -bottom-1 w-px bg-mist"
              />
            ) : null}
            {/* Node dot */}
            <span
              aria-hidden
              className={cn(
                "relative z-[1] mt-1 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-cloud",
                NODE[dotTone],
              )}
            />
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[0.86rem] font-semibold leading-tight text-ink">
                {m.title}
              </p>
              <p className="mt-0.5 text-[0.76rem] leading-snug text-slate tabular-nums">
                {m.dateLabel}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
