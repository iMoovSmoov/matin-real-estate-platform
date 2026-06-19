import type { LeadStage } from "@/lib/types";

/* Shared style logic for lead stages and scores — used by the inbox list and
   the lead drawer so the visual language stays consistent.

   Brand rule: strict black & white. Stages are neutral white/opacity pills.
   Color (green/red) is reserved ONLY for genuine positive/negative status —
   a hot lead, a won deal, a lost deal. */

const STAGE: Record<LeadStage, string> = {
  New: "bg-white/[0.12] text-white ring-white/20",
  Nurture: "bg-white/[0.06] text-slate-300 ring-white/12",
  Active: "bg-white/[0.1] text-white ring-white/15",
  Showing: "bg-white/[0.1] text-white ring-white/15",
  Offer: "bg-white/[0.12] text-white ring-white/20",
  "Under Contract": "bg-white/[0.12] text-white ring-white/20",
  Closed: "bg-success/12 text-success ring-success/30",
  Lost: "bg-white/[0.04] text-slate-300/60 ring-white/10",
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
  return STAGE[stage as LeadStage] ?? "bg-white/[0.06] text-slate-300 ring-white/12";
}

/** Small status dot for a stage — neutral white, except won (green) / lost (faded). */
const STAGE_DOT: Record<LeadStage, string> = {
  New: "bg-white",
  Nurture: "bg-white/50",
  Active: "bg-white",
  Showing: "bg-white",
  Offer: "bg-white",
  "Under Contract": "bg-white",
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
  if (score >= 50) return "bg-white/[0.1] text-white ring-white/15";
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
