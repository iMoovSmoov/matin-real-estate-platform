"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Buyer Agreements / IntakeField

   Label-above-field input used by the structured intake form. Every field
   carries the DB column it maps to (mono caption) so the form reads as a real
   "Google Forms replacement" → database, not a mock. LIGHT surface.
   ────────────────────────────────────────────────────────────────────────── */

export function IntakeField({
  label,
  column,
  children,
  flag,
  className,
}: {
  label: ReactNode;
  /** The database column this field maps to (e.g. agreement_answers.budget_max). */
  column?: string;
  children: ReactNode;
  /** Optional inline flag node (e.g. a "Missing" chip) shown beside the label. */
  flag?: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[0.74rem] font-semibold text-ink">{label}</span>
        {flag}
      </div>
      {children}
      {column ? (
        <p className="mt-1 font-mono text-[0.66rem] leading-none text-slate/70">
          {column}
        </p>
      ) : null}
    </label>
  );
}

/* Shared input/select chrome — keeps the intake form consistent. */
export const intakeInputClass =
  "h-9 w-full rounded-lg border border-mist bg-cloud px-3 text-[0.84rem] text-ink tabular-nums placeholder:text-slate/45 focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/10";

export const intakeSelectClass =
  "h-9 w-full appearance-none rounded-lg border border-mist bg-cloud px-3 text-[0.84rem] text-ink focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/10";
