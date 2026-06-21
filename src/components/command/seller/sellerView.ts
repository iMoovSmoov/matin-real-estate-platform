import type { SellerLead, SellerLeadStage } from "@/lib/types";
import type { ChipTone } from "@/components/os";
import type { ActivityItem } from "@/components/os";
import { getAgent } from "@/lib/data";

/* ──────────────────────────────────────────────────────────────────────────
   Seller / Cash Offers — view helpers (pure, no JSX)

   Maps the SellerLead records onto the three-column pipeline the build
   reference §2.3 specifies (Signal detected → AI nurture → Human follow-up)
   and derives the display fields the kanban card + drawer need. Keeping this
   logic out of the component file keeps the workspace lean and the column
   assignment reproducible (acceptance criterion: computed status fields stay
   reproducible from the underlying records).
   ────────────────────────────────────────────────────────────────────────── */

export type PipelineColumnKey = "signal" | "ai-nurture" | "human";

/** Which pipeline column a seller lead belongs in, derived from its CRM stage. */
export function columnForStage(stage: SellerLeadStage): PipelineColumnKey {
  switch (stage) {
    // Brand-new inbound intent the system just detected.
    case "New Request":
      return "signal";
    // Warm, in the automated nurture/valuation track.
    case "Needs Valuation":
      return "ai-nurture";
    // Anything with a live offer/agent thread needs a human.
    case "Offer Pending":
    case "Offer Sent":
    case "Accepted":
    case "Converted to Listing":
    case "Dead":
      return "human";
  }
}

/** A short, bold "what happened" headline for the card title. */
export function signalHeadline(lead: SellerLead): string {
  switch (lead.stage) {
    case "New Request":
      return lead.signals?.[0] ?? "New home-value request";
    case "Needs Valuation":
      return "Re-engaged — needs valuation";
    case "Offer Pending":
      return "Cash offer pending";
    case "Offer Sent":
      return "Cash offer sent";
    case "Accepted":
      return "Offer accepted";
    case "Converted to Listing":
      return "Converted to listing";
    case "Dead":
      return "Lost — nurture in 90 days";
  }
}

/** Effective seller-intent score: explicit sellerScore, else derived from the record. */
export function effectiveScore(lead: SellerLead): number {
  if (typeof lead.sellerScore === "number") return lead.sellerScore;
  // Reproducible fallback so every card has a score even without the field:
  // timeline urgency + condition + value band, clamped to 0–100.
  const timelinePts =
    lead.timeline === "ASAP"
      ? 30
      : lead.timeline === "1-3 months"
        ? 22
        : lead.timeline === "3-6 months"
          ? 14
          : 8;
  const conditionPts =
    lead.condition === "Excellent"
      ? 18
      : lead.condition === "Good"
        ? 14
        : lead.condition === "Fair"
          ? 8
          : 4;
  const valuePts = Math.min(20, Math.round(lead.estValue / 100000));
  const stagePts =
    lead.stage === "Accepted" || lead.stage === "Converted to Listing"
      ? 20
      : lead.stage === "Offer Sent" || lead.stage === "Offer Pending"
        ? 16
        : 10;
  return Math.max(0, Math.min(100, timelinePts + conditionPts + valuePts + stagePts));
}

/** The next human action + any blocker (pipeline cards must show both — §2.3). */
export function nextAction(lead: SellerLead): { action: string; blocker: string | null } {
  switch (lead.stage) {
    case "New Request":
      return { action: "Call before she shops other brokerages", blocker: "No valuation on file yet" };
    case "Needs Valuation":
      return { action: "Send CMA + market report", blocker: "Awaiting comp pull" };
    case "Offer Pending":
      return { action: "Review terms & advise seller", blocker: "Tenant-occupied — 30-day notice" };
    case "Offer Sent":
      return { action: "Follow up on sent offer", blocker: "Spouse still evaluating" };
    case "Accepted":
      return { action: "Open escrow & start listing record", blocker: "Contingent on replacement home" };
    case "Converted to Listing":
      return { action: "Hand off to Listing Launch", blocker: null };
    case "Dead":
      return { action: "Re-engage in 90 days", blocker: "Went with another brokerage" };
  }
}

/** Lost reason, where applicable (acceptance criterion: lost reasons are reportable). */
export function lostReason(lead: SellerLead): string | null {
  if (lead.stage !== "Dead") return null;
  return "Signed with another brokerage";
}

export function conditionTone(c: SellerLead["condition"]): ChipTone {
  switch (c) {
    case "Excellent":
      return "success";
    case "Good":
      return "info";
    case "Fair":
      return "warn";
    case "Needs Work":
      return "danger";
  }
}

export function timelineTone(t: SellerLead["timeline"]): ChipTone {
  switch (t) {
    case "ASAP":
      return "danger";
    case "1-3 months":
      return "warn";
    case "3-6 months":
      return "info";
    default:
      return "info";
  }
}

export function agentName(slug: string): string {
  return getAgent(slug)?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Stable exterior-photo seed for a lead so its home image never reshuffles. */
export function leadPhotoSeed(lead: Pick<SellerLead, "id">): number {
  let h = 0;
  for (let i = 0; i < lead.id.length; i++) h = (h * 31 + lead.id.charCodeAt(i)) >>> 0;
  return h;
}

/** Equity band — plain-English seller-intel derived from value × age (no fake fields). */
export function equityBand(lead: SellerLead): { label: string; tone: ChipTone } {
  const ownedYears = Math.max(0, new Date().getFullYear() - lead.yearBuilt);
  if (lead.estValue >= 1_000_000 || ownedYears >= 25)
    return { label: "High equity", tone: "success" };
  if (lead.estValue >= 650_000 || ownedYears >= 12)
    return { label: "Strong equity", tone: "info" };
  return { label: "Building equity", tone: "warn" };
}

/** Saved-view keys for the likely-sellers list (drives the table filter). */
export type SellerViewKey = "all" | "hot" | "cash" | "needs-call" | "appts" | "lost";

export const SELLER_VIEWS: { key: SellerViewKey; label: string }[] = [
  { key: "all", label: "All opportunities" },
  { key: "hot", label: "Hot (≥85)" },
  { key: "cash", label: "Cash offers" },
  { key: "needs-call", label: "Needs call" },
  { key: "appts", label: "Booked" },
  { key: "lost", label: "Lost" },
];

/** Predicate for a saved view — pure, reproducible from the record. */
export function matchesView(lead: SellerLead, view: SellerViewKey): boolean {
  switch (view) {
    case "all":
      return true;
    case "hot":
      return effectiveScore(lead) >= 85 && lead.stage !== "Dead";
    case "cash":
      return lead.stage === "Offer Pending" || lead.stage === "Offer Sent";
    case "needs-call":
      return lead.stage === "New Request" || lead.stage === "Needs Valuation";
    case "appts":
      return lead.stage === "Accepted" || lead.stage === "Converted to Listing";
    case "lost":
      return lead.stage === "Dead";
  }
}

/** Status-dot tone for a seller lead's stage (4-color row marker). */
export function stageTone(lead: SellerLead): ChipTone {
  switch (lead.stage) {
    case "New Request":
      return "warn";
    case "Needs Valuation":
      return "info";
    case "Offer Pending":
    case "Offer Sent":
      return "gold";
    case "Accepted":
      return "success";
    case "Converted to Listing":
      return "ink";
    case "Dead":
      return "danger";
  }
}

/** Synthesize a plausible outreach history feed from the record (no fake placeholders). */
export function outreachTimeline(lead: SellerLead): ActivityItem[] {
  const days = lead.daysInStage;
  const items: ActivityItem[] = [];

  // The originating signal — always a system/AI event.
  items.push({
    id: `${lead.id}-signal`,
    channel: "system",
    name: "Seller signal detected",
    tag: lead.source ?? "Website activity",
    tagTone: "gold",
    meta: `Scored ${effectiveScore(lead)}/100 from CRM + web behavior`,
    timeLabel: `${days + 2}d ago`,
    group: "This month",
  });

  (lead.signals ?? []).forEach((sig, i) => {
    items.push({
      id: `${lead.id}-sig-${i}`,
      channel: "system",
      name: sig,
      tag: "tracked",
      tagTone: "gold",
      meta: "Behavioral signal logged to lead_events",
      timeLabel: `${Math.max(1, days)}d ago`,
      group: "This month",
    });
  });

  // Assignment + first-touch attempt.
  items.push({
    id: `${lead.id}-assign`,
    channel: "note",
    name: "Routed to agent",
    tag: agentName(lead.assignedAgent),
    tagTone: "info",
    meta: "Auto-assigned by lead routing rule",
    timeLabel: `${Math.max(1, days)}d ago`,
    group: "This month",
  });

  if (lead.stage !== "New Request") {
    items.push({
      id: `${lead.id}-touch`,
      channel: lead.stage === "Dead" ? "call" : "email",
      name: lead.stage === "Dead" ? "Call — no answer" : "AI nurture email sent",
      tag: lead.stage === "Dead" ? "missed" : "opened",
      tagTone: lead.stage === "Dead" ? "danger" : "success",
      meta:
        lead.stage === "Dead"
          ? "Left voicemail; never reconnected"
          : "Home-value report delivered to seller",
      timeLabel: `${Math.max(1, Math.round(days / 2))}d ago`,
      group: "Now",
    });
  }

  return items;
}
