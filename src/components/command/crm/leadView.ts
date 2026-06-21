import type { Lead } from "@/lib/types";
import type { ChipTone } from "@/components/os";
import type { ActivityItem, ActivityChannel, ActivityTagTone } from "@/components/os";

/* ──────────────────────────────────────────────────────────────────────────
   CRM & Leads Workbench — view-model helpers (pure, server-safe)

   Derives the smart-list filtering, KPI numbers, lead-type label, status
   tones, source analysis, and a per-lead activity timeline from the `leads`
   array fields. No new visual primitives here — only data shaping that the
   page + panels compose. Kept separate so both the (client) page and the
   detail panel share one source of truth.
   ────────────────────────────────────────────────────────────────────────── */

export type SavedViewKey =
  | "new-today"
  | "hot"
  | "seller-intent"
  | "needs-call"
  | "unassigned"
  | "all";

const HOT_THRESHOLD = 80;
const STALE_DAYS = 7;
const OPEN_STAGES = new Set(["New", "Active", "Showing", "Offer", "Nurture", "Under Contract"]);

/** A lead is "uncontacted"/new-inbound when it's freshly created and never replied to. */
export function isUncontacted(l: Lead): boolean {
  return l.stage === "New" || l.lastContactDaysAgo >= STALE_DAYS;
}

export function isOpen(l: Lead): boolean {
  return OPEN_STAGES.has(l.stage);
}

export function isSellerIntent(l: Lead): boolean {
  return (
    l.likelySeller === true ||
    l.intent === "Selling" ||
    l.intent === "Buying & Selling"
  );
}

export function isHotBuyer(l: Lead): boolean {
  return l.score >= HOT_THRESHOLD && (l.intent === "Buying" || l.intent === "Investing");
}

export function isHotSeller(l: Lead): boolean {
  return l.score >= HOT_THRESHOLD && isSellerIntent(l);
}

/** "Needs call": open lead with no contact in a week, or brand-new and unreplied. */
export function needsCall(l: Lead): boolean {
  return isOpen(l) && (l.lastContactDaysAgo >= STALE_DAYS || (l.stage === "New" && l.unread > 0));
}

/** Demo routing rule: the company default-pool agent owns the "unassigned" bucket. */
export function isUnassigned(l: Lead): boolean {
  return l.assignedAgent === "jordan-matin";
}

/** Short Buyer / Seller / Both label from intent + likelySeller. */
export function leadTypeLabel(l: Lead): "Buyer" | "Seller" | "Buyer + Seller" | "Investor" {
  if (l.intent === "Buying & Selling") return "Buyer + Seller";
  if (l.intent === "Selling" || (l.likelySeller && l.intent !== "Buying")) return "Seller";
  if (l.intent === "Investing") return "Investor";
  return "Buyer";
}

export function leadTypeTone(l: Lead): ChipTone {
  const t = leadTypeLabel(l);
  if (t === "Seller") return "gold";
  if (t === "Buyer + Seller") return "warn";
  if (t === "Investor") return "info";
  return "info";
}

/** One-line intent signal for the table — the strongest recent behavioral cue. */
export function intentSignal(l: Lead): string {
  if (l.propertyViews && l.propertyViews.length > 0) return l.propertyViews[0];
  if (isSellerIntent(l)) return "Seller intent signal detected";
  if (l.unread > 0) return `${l.unread} unread inbound message${l.unread > 1 ? "s" : ""}`;
  return `Last contact ${l.lastContactDaysAgo === 0 ? "today" : `${l.lastContactDaysAgo}d ago`}`;
}

/** Tone for the score chip / number by temperature band. */
export function scoreTone(score: number): ChipTone {
  if (score >= HOT_THRESHOLD) return "success";
  if (score >= 55) return "warn";
  return "info";
}

export function stageTone(stage: Lead["stage"]): ChipTone {
  switch (stage) {
    case "New":
      return "info";
    case "Active":
    case "Showing":
      return "success";
    case "Offer":
    case "Under Contract":
      return "warn";
    case "Nurture":
      return "info";
    case "Closed":
      return "ink";
    case "Lost":
      return "danger";
    default:
      return "info";
  }
}

export function tempLabel(score: number): { label: string; tone: ChipTone } {
  if (score >= HOT_THRESHOLD) return { label: "Hot", tone: "success" };
  if (score >= 55) return { label: "Warm", tone: "warn" };
  return { label: "Cold", tone: "info" };
}

/** Apply a saved-view filter to the leads array. */
export function filterLeads(leads: Lead[], view: SavedViewKey): Lead[] {
  switch (view) {
    case "new-today":
      return leads.filter((l) => l.createdDaysAgo === 0);
    case "hot":
      return leads.filter((l) => l.score >= HOT_THRESHOLD && l.stage !== "Closed" && l.stage !== "Lost");
    case "seller-intent":
      return leads.filter((l) => isSellerIntent(l) && l.stage !== "Closed" && l.stage !== "Lost");
    case "needs-call":
      return leads.filter(needsCall);
    case "unassigned":
      return leads.filter(isUnassigned);
    case "all":
    default:
      return leads;
  }
}

/** KPI numbers derived once from the full array (reconcile to the saved-view counts). */
export function crmKpis(leads: Lead[]) {
  const open = leads.filter(isOpen);
  const responded = leads.filter((l) => typeof l.responseMinutes === "number");
  const avgFirstResponse = responded.length
    ? Math.round(
        responded.reduce((s, l) => s + (l.responseMinutes ?? 0), 0) / responded.length,
      )
    : 0;
  return {
    newLeads: leads.filter((l) => l.createdDaysAgo === 0).length,
    uncontacted: open.filter(isUncontacted).length,
    hotBuyers: leads.filter(isHotBuyer).length,
    hotSellers: leads.filter(isHotSeller).length,
    avgFirstResponse,
    // Appointments set ≈ leads that progressed past first contact into a showing/offer path.
    appointments: leads.filter(
      (l) => l.stage === "Showing" || l.stage === "Offer" || l.stage === "Under Contract",
    ).length,
  };
}

/** Lead-source rollup for the horizontal-bar analysis (count + hot count per source). */
export function leadSourceAnalysis(leads: Lead[]) {
  const map = new Map<string, { source: string; count: number; hot: number }>();
  for (const l of leads) {
    const entry = map.get(l.source) ?? { source: l.source, count: 0, hot: 0 };
    entry.count += 1;
    if (l.score >= HOT_THRESHOLD) entry.hot += 1;
    map.set(l.source, entry);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/** Format a budget band compactly: $720k–$865k. */
export function budgetLabel(l: Lead): string {
  const k = (n: number) => `$${Math.round(n / 1000)}k`;
  if (!l.budgetMin && !l.budgetMax) return "Budget TBD";
  if (l.budgetMin && l.budgetMax) return `${k(l.budgetMin)}–${k(l.budgetMax)}`;
  return k(l.budgetMax || l.budgetMin);
}

/* ── Per-lead activity timeline ─────────────────────────────────────────────
   The leads array has no event log, so we synthesize a plausible, deterministic
   recent timeline from the lead's real fields (property views, unread count,
   response time, last-contact recency, source) — same fields the score is built
   from. System/AI rows are tagged channel:'system' so the timeline's gold marker
   distinguishes automated events from human ones (AI-transparency rule). */
export function leadTimeline(l: Lead): ActivityItem[] {
  const items: ActivityItem[] = [];
  const ago = (d: number) =>
    d <= 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
  let seq = 0;
  const push = (
    channel: ActivityChannel,
    name: string,
    tag: string | undefined,
    tagTone: ActivityTagTone | undefined,
    meta: string | undefined,
    timeLabel: string,
    group?: string,
  ) => {
    items.push({ id: `${l.id}-ev-${seq++}`, channel, name, tag, tagTone, meta, timeLabel, group });
  };

  // Most-recent: unread inbound or last human touch.
  if (l.unread > 0) {
    push(
      "text",
      `${l.firstName} texted`,
      "Inbound",
      "info",
      `${l.unread} unread message${l.unread > 1 ? "s" : ""} awaiting reply`,
      ago(Math.max(0, l.lastContactDaysAgo - 1)),
      "Recent",
    );
  }

  // Behavioral signals from saved searches / property views drive the score.
  (l.propertyViews ?? []).forEach((pv, i) => {
    push("system", "Website activity", pv, "gold", "Captured from IDX behavior", ago(i), "Recent");
  });

  // Last agent contact + first-response benchmark.
  if (typeof l.responseMinutes === "number") {
    push(
      "call",
      "First response logged",
      l.responseMinutes <= 5 ? "On pace" : l.responseMinutes <= 30 ? "Within SLA" : "Slow",
      l.responseMinutes <= 30 ? "success" : "danger",
      `Replied in ${l.responseMinutes} min after lead came in`,
      ago(l.createdDaysAgo),
      "Earlier",
    );
  }

  // AI scored & routed the lead on intake (system event).
  push(
    "system",
    "Matin AI scored & routed lead",
    `Score ${l.score}`,
    "gold",
    `Normalized, deduped, scored ${l.score}/100, routed to owner`,
    ago(l.createdDaysAgo),
    "Earlier",
  );

  // Lead origin.
  push(
    "system",
    "Lead created",
    l.source,
    "info",
    `Captured via ${l.source} • ${l.community}`,
    ago(l.createdDaysAgo),
    "Earlier",
  );

  return items;
}
