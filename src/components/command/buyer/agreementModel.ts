import type { BuyerAgreement, BuyerAgreementStatus, BuyerTimeline, PreapprovalStatus } from "@/lib/types";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Buyer Agreements / domain model helpers  (ref §2.5)

   Pure derivations shared by the builder page and its sub-components. Keeps the
   page component focused on interaction wiring. No React here — just data.
   ────────────────────────────────────────────────────────────────────────── */

/** The build-context "now" — stable across renders so dates don't drift. */
export const BUILD_NOW = new Date(2026, 5, 21); // 2026-06-21

/** A live, editable copy of the intake form (controlled inputs). */
export type IntakeForm = {
  buyerName: string;
  email: string;
  phone: string;
  agentName: string;
  agentSlug: string;
  areas: string; // comma-joined for the text input
  budgetMin: string;
  budgetMax: string;
  termMonths: string;
  expiration: string;
  compensation: string;
  preapproval: PreapprovalStatus;
  timeline: BuyerTimeline;
  clauses: string[];
};

export const COMPENSATION_OPTIONS: { value: string; label: string }[] = [
  { value: "seller-paid-fallback-buyer", label: "Seller-paid · buyer-paid fallback (3.0%)" },
  { value: "buyer-paid-percent", label: "Buyer-paid 3.0%" },
  { value: "buyer-paid-flat", label: "Buyer-paid flat fee ($12,500)" },
  { value: "broker-set-rate", label: "Broker-set rate (BIC review)" },
];

export const ALL_CLAUSES: string[] = [
  "Agency disclosure (OREF Initial Agency)",
  "Dual-agency consent",
  "Earnest-money handling per Matin BIC",
  "Non-exclusive showing carve-out",
  "VA-loan financing addendum",
];

/** Representation period (months) derived from the buyer's timeline. */
export function repMonths(timeline: BuyerTimeline): number {
  if (timeline === "Immediately") return 6;
  if (timeline === "1-3 months") return 6;
  return 12;
}

/** Format an expiration date `months` out from the build-context now. */
export function expirationLabel(months: number): string {
  const d = new Date(BUILD_NOW);
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Build the editable form snapshot from a record. */
export function formFromRecord(b: BuyerAgreement): IntakeForm {
  const months = repMonths(b.timeline);
  return {
    buyerName: b.name,
    email: b.email,
    phone: b.phone,
    agentName: b.agentName,
    agentSlug: b.agentSlug,
    areas: b.areas.join(", "),
    budgetMin: String(b.budgetMin),
    budgetMax: String(b.budgetMax),
    termMonths: String(months),
    expiration: expirationLabel(months),
    compensation: "seller-paid-fallback-buyer",
    preapproval: b.preapproval,
    timeline: b.timeline,
    clauses: ALL_CLAUSES.slice(0, 3),
  };
}

/** Parse a "$850K" / "850000" style string into a number for display math. */
export function parseMoney(raw: string): number {
  const s = raw.trim().toLowerCase().replace(/[$,\s]/g, "");
  if (!s) return 0;
  if (s.endsWith("m")) return Math.round(parseFloat(s) * 1_000_000) || 0;
  if (s.endsWith("k")) return Math.round(parseFloat(s) * 1_000) || 0;
  return Math.round(parseFloat(s)) || 0;
}

/* ── Representation-readiness score (AI) ──────────────────────────────────────
   A 0–100 "ready to write the agreement" signal the AI computes from intake
   completeness + buyer engagement. Higher = cleaner packet, lower friction. */
export function readinessScore(b: BuyerAgreement): number {
  let s = 40;
  if (b.preapproval === "Yes") s += 26;
  else if (b.preapproval === "In Progress") s += 12;
  if (b.timeline === "Immediately") s += 16;
  else if (b.timeline === "1-3 months") s += 9;
  s += Math.min(12, b.showingCount * 1.5);
  if (b.lastContactDaysAgo <= 3) s += 6;
  else if (b.lastContactDaysAgo >= 14) s -= 8;
  return Math.max(8, Math.min(99, Math.round(s)));
}

/** Plain-English readiness factors (AI insight chips). */
export function readinessFactors(b: BuyerAgreement): { text: string; good: boolean }[] {
  const out: { text: string; good: boolean }[] = [];
  out.push(
    b.preapproval === "Yes"
      ? { text: "Pre-approved — financing clause ready", good: true }
      : b.preapproval === "In Progress"
        ? { text: "Pre-approval in progress — confirm before send", good: false }
        : { text: "No pre-approval — financing unconfirmed", good: false },
  );
  out.push(
    b.timeline === "Immediately"
      ? { text: "Buying immediately — high urgency", good: true }
      : { text: `Timeline: ${b.timeline}`, good: b.timeline === "1-3 months" },
  );
  if (b.showingCount >= 5) out.push({ text: `${b.showingCount} showings — engaged buyer`, good: true });
  else if (b.showingCount === 0) out.push({ text: "No showings yet — early stage", good: false });
  if (b.lastContactDaysAgo >= 14)
    out.push({ text: `Stale: ${b.lastContactDaysAgo}d since last contact`, good: false });
  return out;
}

/* ── Status taxonomy used across list + preview + automation ───────────────── */
export type ChipTone = "danger" | "warn" | "success" | "info";

export function stateTone(s: BuyerAgreementStatus): { tone: "danger" | "warn" | "success"; label: string } {
  if (s === "Not Signed") return { tone: "danger", label: "Draft" };
  if (s === "Sent") return { tone: "warn", label: "Awaiting sig" };
  return { tone: "success", label: "Signed" };
}

export function previewStatus(s: BuyerAgreementStatus): {
  status: string;
  tone: "success" | "warn" | "danger";
  missing?: string[];
} {
  if (s === "Signed") return { status: "Executed", tone: "success" };
  if (s === "Sent")
    return {
      status: "Out for signature",
      tone: "warn",
      missing: ["Buyer initials · page 2", "Buyer signature · page 4"],
    };
  return {
    status: "Draft",
    tone: "warn",
    missing: ["Agent license # · page 1", "Buyer initials · page 2"],
  };
}

/** Saved-view filter keys for the record list. */
export type ViewKey = "all" | "draft" | "sent" | "signed" | "expiring";

export function matchesView(b: BuyerAgreement, view: ViewKey): boolean {
  if (view === "all") return true;
  if (view === "draft") return b.agreementStatus === "Not Signed";
  if (view === "sent") return b.agreementStatus === "Sent";
  if (view === "signed") return b.agreementStatus === "Signed";
  // expiring — stale records winding down / drafts left open
  return b.lastContactDaysAgo >= 14 || b.agreementStatus === "Not Signed";
}
