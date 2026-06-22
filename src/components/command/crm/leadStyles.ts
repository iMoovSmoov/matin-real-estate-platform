import type { LeadStage } from "@/lib/types";

/* Canonical lead-stage ordering — shared by the Add-lead form's Stage picker.

   Visual tones for stages/scores live in `leadView.ts` and use the brand status
   palette (success / warn / info / gold / ink). This file intentionally carries
   NO color tokens so no off-brand classes (blue/red/amber/emerald) leak into the
   Tailwind scan. */

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
