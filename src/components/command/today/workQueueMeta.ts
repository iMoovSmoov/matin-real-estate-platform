import type { ChipTone } from "@/components/os";
import type { WorkQueueItem } from "@/lib/types";

/* ──────────────────────────────────────────────────────────────────────────
   Today Command Center — work-queue display metadata

   Maps the leftmost category of a Human Work Queue row to its status-palette
   tone (build reference §1.1 + §2.1):
     Call    → info    (neutral outreach)
     Review  → warn    (needs attention / in-progress)
     Approve → gold    (AI affordance — approve an AI draft)
     Coach   → gold    (AI Coach affordance)
     Send    → success (ready to go out)
   Gold stays rationed to the AI-touching categories (Approve / Coach).
   ────────────────────────────────────────────────────────────────────────── */

export type WorkCategory = WorkQueueItem["category"];

export const CATEGORY_TONE: Record<WorkCategory, ChipTone> = {
  Call: "info",
  Review: "warn",
  Approve: "gold",
  Coach: "gold",
  Send: "success",
};

/* Canonical /hub routes per source type — mirrors SidebarNav NAV_ITEMS exactly
   so every queue row, drawer "Open record", and risk-alert deep-links to a real
   page that actually renders (no 404 stubs). */
export const SOURCE_ROUTE: Record<string, string> = {
  lead: "/hub/crm",
  "seller-lead": "/hub/cash-offer",
  listing: "/hub/listing-launch",
  transaction: "/hub/transactions",
  "ai-action": "/hub/ai",
  "workflow-run": "/hub/systems-health",
  agent: "/hub/coaching",
  campaign: "/hub/marketing",
};

/** Where a queue item's source record lives — every row links somewhere. */
export function sourceHref(item: WorkQueueItem): string {
  return SOURCE_ROUTE[item.sourceType] ?? "/hub";
}

/** Human label for the source-record type (drawer subtitle). */
const SOURCE_LABELS: Record<string, string> = {
  lead: "Lead record",
  "seller-lead": "Seller opportunity",
  listing: "Listing launch",
  transaction: "Transaction",
  "ai-action": "AI draft",
  "workflow-run": "Automation run",
  agent: "Agent",
  campaign: "Campaign",
};

export function sourceLabel(sourceType: string): string {
  return SOURCE_LABELS[sourceType] ?? "Record";
}

/** Due-label urgency tone — colors the right-aligned time on a row. */
export function dueTone(due: string): "danger" | "warn" | "slate" {
  const d = due.toLowerCase();
  if (d.includes("now") || d.includes("failed") || d.includes("waiting")) return "danger";
  if (d.includes("today")) return "warn";
  return "slate";
}
