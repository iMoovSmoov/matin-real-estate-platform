import type { LeadStage } from "@/lib/types";

/* Shared color logic for lead stages and scores — used by the table,
   the kanban board, and the drawer so the visual language stays consistent. */

const STAGE: Record<LeadStage, string> = {
  New: "bg-azure/12 text-azure-bright ring-azure/25",
  Nurture: "bg-warn/15 text-warn ring-warn/25",
  Active: "bg-azure/15 text-azure-300 ring-azure/30",
  Showing: "bg-info/15 text-info ring-info/30",
  Offer: "bg-warn/15 text-warn ring-warn/30",
  "Under Contract": "bg-success/12 text-success ring-success/25",
  Closed: "bg-success/15 text-success ring-success/30",
  Lost: "bg-white/[0.06] text-slate-300/70 ring-white/12",
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

const STAGE_DOT: Record<LeadStage, string> = {
  New: "bg-azure-bright",
  Nurture: "bg-warn",
  Active: "bg-azure-300",
  Showing: "bg-info",
  Offer: "bg-warn",
  "Under Contract": "bg-success",
  Closed: "bg-success",
  Lost: "bg-slate-300/50",
};

export function stageDot(stage: string): string {
  return STAGE_DOT[stage as LeadStage] ?? "bg-slate-300/50";
}

export function scoreTone(score: number): string {
  if (score >= 80) return "bg-success/12 text-success ring-success/25";
  if (score >= 60) return "bg-azure/12 text-azure-bright ring-azure/25";
  if (score >= 40) return "bg-warn/15 text-warn ring-warn/25";
  return "bg-danger/12 text-danger ring-danger/25";
}

/** Score → tone keyword for the progress bar component. */
export function scoreBarTone(score: number): "success" | "azure" | "warn" | "danger" {
  if (score >= 80) return "success";
  if (score >= 60) return "azure";
  if (score >= 40) return "warn";
  return "danger";
}
