import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — EmptyState / Skeleton   (ref §1.10, §3)

   EmptyState — ACTIONABLE: headline + one-line explainer + the exact tool to
   resolve. Never a decorative spot illustration alone. The action renders an
   ink-filled primary button (human primary action; gold is reserved for AI).

   Skeleton — layout-preserving loader (animate-pulse, neutral fill), so the
   page does not reflow when data arrives. Server-safe.
   ────────────────────────────────────────────────────────────────────────── */

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  icon,
  className,
}: {
  title: ReactNode;
  body: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-mist bg-cloud px-6 py-12 text-center",
        className,
      )}
    >
      {icon != null ? (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-paper-200 text-slate ring-1 ring-inset ring-mist">
          {icon}
        </span>
      ) : null}
      <h3 className="font-display text-[1.05rem] font-normal text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[0.84rem] leading-relaxed text-slate">{body}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-ink px-4 py-2 text-[0.82rem] font-medium text-cloud transition-colors hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

/** Layout-preserving skeleton block. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-ink/[0.06]", className)}
    />
  );
}
