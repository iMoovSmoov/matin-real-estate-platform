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

/** Where a queue item's source record lives — every row links somewhere. */
export function sourceHref(item: WorkQueueItem): string {
  switch (item.sourceType) {
    case "lead":
      return "/hub/crm";
    case "seller-lead":
      return "/hub/seller-opportunities";
    case "listing":
      return "/hub/listings";
    case "transaction":
      return "/hub/transactions";
    case "ai-action":
      return "/hub/ai";
    case "workflow-run":
      return "/hub/systems-health";
    case "agent":
      return "/hub/coaching";
    case "campaign":
      return "/hub/marketing";
    default:
      return "/hub";
  }
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
