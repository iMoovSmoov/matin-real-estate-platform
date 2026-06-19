import type { LeadStage } from "@/lib/types";

/* Shared style logic for lead stages and scores — used by the inbox list and
   the lead drawer so the visual language stays consistent.

   Brand rule: strict black & white. Stages are neutral white/opacity pills.
   Color (green/red) is reserved ONLY for genuine positive/negative status —
   a hot lead, a won deal, a lost deal. */

const STAGE: Record<LeadStage, string> = {
  New: "bg-blue-50 text-blue-700 ring-blue-200",
  Nurture: "bg-white text-slate ring-ink/[0.06]",
  Active: "bg-ink/[0.06] text-ink ring-ink/[0.08]",
  Showing: "bg-ink/[0.06] text-ink ring-ink/[0.08]",
  Offer: "bg-amber-50 text-amber-700 ring-amber-200",
  "Under Contract": "bg-amber-50 text-amber-700 ring-amber-200",
  Closed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Lost: "bg-slate-100 text-slate-500 ring-slate-200",
};

export const LEAD_STAGES: LeadStage[] = [
  "New",
  "Nurture",
  "Active",
  "Showing",
  "Offer",
  "Under Contract",
  "Closed",
  "Lost",
];

export function stageTone(stage: string): string {
  return STAGE[stage as LeadStage] ?? "bg-white text-slate ring-ink/[0.06]";
}

/** Small status dot for a stage — neutral white, except won (green) / lost (faded). */
const STAGE_DOT: Record<LeadStage, string> = {
  New: "bg-ink",
  Nurture: "bg-ink/[0.04]0",
  Active: "bg-ink",
  Showing: "bg-ink",
  Offer: "bg-ink",
  "Under Contract": "bg-ink",
  Closed: "bg-success",
  Lost: "bg-slate-300/40",
};

export function stageDot(stage: string): string {
  return STAGE_DOT[stage as LeadStage] ?? "bg-slate-300/50";
}

/** Score pill tone maps to Hot/Warm/Cold/New semantic colors.
    Hot  → red-50 / red-700 / red-200 ring
    Warm → amber-50 / amber-700 / amber-200 ring
    Cold → slate-100 / slate-600 (no ring)
*/
export function scoreTone(score: number): string {
  if (score >= 80) return "bg-red-50 text-red-700 ring-red-200";
  if (score >= 50) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-slate-100 text-slate-600";
}

/** Bare score color (for dots / small accents). */
export function scoreDot(score: number): string {
  if (score >= 80) return "bg-red-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-slate-400";
}

/** Score → tone keyword for the ProgressBar component. */
export function scoreBarTone(score: number): "success" | "azure" | "warn" | "danger" {
  if (score >= 80) return "success";
  if (score >= 50) return "azure";
  return "danger";
}

/** A short human label for a score band. */
export function scoreLabel(score: number): string {
  if (score >= 80) return "Hot";
  if (score >= 50) return "Warm";
  return "Cold";
}

/** Status pill classes for the named lead status labels (Hot / Warm / Cold / New). */
export function statusPill(label: "Hot" | "Warm" | "Cold" | "New"): string {
  switch (label) {
    case "Hot":  return "bg-red-50 text-red-700 ring-1 ring-red-200";
    case "Warm": return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "Cold": return "bg-slate-100 text-slate-600";
    case "New":  return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
  }
}
