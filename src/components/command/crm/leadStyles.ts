import type { LeadStage } from "@/lib/types";

/* Shared style logic for lead stages and scores — used by the inbox list and
   the lead drawer so the visual language stays consistent.

   Brand rule: strict black & white. Stages are neutral white/opacity pills.
   Color (green/red) is reserved ONLY for genuine positive/negative status —
   a hot lead, a won deal, a lost deal. */

const STAGE: Record<LeadStage, string> = {
  New: "bg-ink/[0.08] text-ink ring-ink/10",
  Nurture: "bg-white text-slate ring-ink/[0.06]",
  Active: "bg-ink/[0.06] text-ink ring-ink/[0.08]",
  Showing: "bg-ink/[0.06] text-ink ring-ink/[0.08]",
  Offer: "bg-ink/[0.08] text-ink ring-ink/10",
  "Under Contract": "bg-ink/[0.08] text-ink ring-ink/10",
  Closed: "bg-success/12 text-success ring-success/30",
  Lost: "bg-white text-slate/60 ring-ink/[0.06]",
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

/** Score pill tone. Only the two extremes carry color (hot = green, cold = red);
    the middle band stays monochrome. */
export function scoreTone(score: number): string {
  if (score >= 80) return "bg-success/12 text-success ring-success/30";
  if (score >= 50) return "bg-ink/[0.06] text-ink ring-ink/[0.08]";
  return "bg-danger/12 text-danger ring-danger/30";
}

/** Bare score color (for dots / small accents). */
export function scoreDot(score: number): string {
  if (score >= 80) return "bg-success";
  if (score >= 50) return "bg-white/60";
  return "bg-danger";
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
