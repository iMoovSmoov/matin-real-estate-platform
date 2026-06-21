import type { Transaction } from "@/lib/types";
import type { ChipTone, MilestoneTone, ChecklistStatus } from "@/components/os";

/* ──────────────────────────────────────────────────────────────────────────
   Transactions — one-deal screen content model.

   The three-column deal screen (Deal summary · Milestone timeline ·
   Checklist + Risk) needs richer, contract-to-close domain content than the
   raw `transactions` JSON carries (no per-deadline dates, no contingency
   status rows). This module supplies that layer:

     • For the two CANONICAL scripted deals (1274 NW Everett St / TX-3999 and
       8912 SE Hawthorne Blvd / TX-3998) we use hand-authored content that
       matches the wireframe storyline exactly.
     • For any other deal the operator selects, we derive plausible status
       rows / milestones / checklist from the record's real checklist + stage
       so the screen is always complete and dense (never placeholders).

   The list and KPI strip are still driven entirely by the real `transactions`
   data — this only shapes the focused deal view.
   ────────────────────────────────────────────────────────────────────────── */

export type StatusRow = {
  label: string;
  /** Solid chip text + tone (Inspection "2 days left" warn, etc.). */
  value: string;
  tone: ChipTone;
};

export type DealMilestone = {
  id: string;
  title: string;
  dateLabel: string;
  tone: MilestoneTone;
  terminal?: boolean;
};

export type DealChecklistItem = {
  id: string;
  label: string;
  status: ChecklistStatus;
  meta?: string;
};

export type RiskNote = {
  /** Headline shown on the dark CalloutCard. */
  title: string;
  body: string;
  /** Label for the gold action that drafts via streamAi. */
  actionLabel: string;
  /** Plain-English instruction handed to the contract-extractor tool. */
  draftPrompt: string;
};

export type DealScreen = {
  /** "Buyer side · Under Contract · Close Jul 22" line under the address. */
  sideLine: string;
  statusRows: StatusRow[];
  milestones: DealMilestone[];
  checklist: DealChecklistItem[];
  /** Null when the deal carries no open risk. */
  risk: RiskNote | null;
};

/* ── Canonical scripted deals ─────────────────────────────────────────────── */

const EVERETT: DealScreen = {
  sideLine: "Buyer side · Under Contract · Close Jul 22",
  statusRows: [
    { label: "Inspection", value: "2 days left", tone: "warn" },
    { label: "Appraisal", value: "Scheduled", tone: "info" },
    { label: "Loan", value: "Conditional", tone: "gold" },
    { label: "Title", value: "Clear", tone: "success" },
  ],
  milestones: [
    { id: "m1", title: "Offer accepted", dateLabel: "Jun 18", tone: "success" },
    { id: "m2", title: "Earnest money due", dateLabel: "Jun 20", tone: "success" },
    { id: "m3", title: "Inspection period ends", dateLabel: "Jun 23", tone: "warn" },
    { id: "m4", title: "Appraisal due", dateLabel: "Jul 02", tone: "info" },
    { id: "m5", title: "Loan approval", dateLabel: "Jul 10", tone: "warn" },
    { id: "m6", title: "Closing", dateLabel: "Jul 22", tone: "ink", terminal: true },
  ],
  checklist: [
    { id: "c1", label: "Signed purchase agreement", status: "done", meta: "OREF-001 · executed Jun 18" },
    { id: "c2", label: "Seller disclosure uploaded", status: "done", meta: "Property & lead-based paint · Jun 19" },
    { id: "c3", label: "Inspection addendum needed", status: "issue", meta: "Roof concern raised — no addendum on file" },
    { id: "c4", label: "Lender approval letter", status: "done", meta: "Conditional approval · Summit Mortgage" },
    { id: "c5", label: "HOA docs pending", status: "pending", meta: "Requested from Cedar Hills HOA · Jun 19" },
    { id: "c6", label: "Final walkthrough schedule", status: "pending", meta: "Targeting Jul 21" },
  ],
  risk: {
    title: "AI Risk Note",
    body:
      "Inspection period expires in 2 days. Email thread mentions roof concern but no addendum exists. Suggest drafting inspection response.",
    actionLabel: "Draft inspection response",
    draftPrompt:
      "Draft a buyer-side inspection response and repair addendum for the purchase of 1274 NW Everett St, Portland. The home inspection raised a roof concern (aging shingles / possible end-of-life). The inspection contingency period expires in 2 days. Request the seller either repair the roof or provide a credit at closing, preserve the buyer's right to terminate, and keep it professional and firm. Reference the executed OREF purchase agreement.",
  },
};

const HAWTHORNE: DealScreen = {
  sideLine: "Buyer side · Under Contract · Close Jul 08",
  statusRows: [
    { label: "Inspection", value: "Due tomorrow", tone: "danger" },
    { label: "Appraisal", value: "Not ordered", tone: "warn" },
    { label: "Loan", value: "Processing", tone: "gold" },
    { label: "Title", value: "Clear", tone: "success" },
  ],
  milestones: [
    { id: "m1", title: "Offer accepted", dateLabel: "Jun 02", tone: "success" },
    { id: "m2", title: "Earnest money received", dateLabel: "Jun 05", tone: "success" },
    { id: "m3", title: "Inspection deadline", dateLabel: "Jun 22", tone: "danger" },
    { id: "m4", title: "Repair addendum due", dateLabel: "Jun 24", tone: "danger" },
    { id: "m5", title: "Appraisal due", dateLabel: "Jun 30", tone: "info" },
    { id: "m6", title: "Loan approval", dateLabel: "Jul 03", tone: "warn" },
    { id: "m7", title: "Closing", dateLabel: "Jul 08", tone: "ink", terminal: true },
  ],
  checklist: [
    { id: "c1", label: "Signed purchase agreement", status: "done", meta: "OREF-001 · executed Jun 02" },
    { id: "c2", label: "Earnest money received", status: "done", meta: "$15,000 wired to escrow · Jun 05" },
    { id: "c3", label: "Inspection report uploaded", status: "done", meta: "Pillar To Post · Jun 19" },
    { id: "c4", label: "Repair addendum unsigned", status: "issue", meta: "Deadline tomorrow — buyer & seller not signed" },
    { id: "c5", label: "Appraisal ordered", status: "pending", meta: "Awaiting lender order trigger" },
    { id: "c6", label: "Loan approval letter", status: "pending", meta: "In processing · WaFd Bank" },
  ],
  risk: {
    title: "AI Risk Note",
    body:
      "Inspection deadline is tomorrow and the repair addendum is still unsigned. The inspection report flags two items the buyer asked to negotiate. If the addendum is not executed by the deadline, the buyer loses repair leverage. Suggest drafting the repair addendum now.",
    actionLabel: "Draft repair addendum",
    draftPrompt:
      "Draft a buyer-side repair addendum for the purchase of 8912 SE Hawthorne Blvd, Portland. The inspection (Pillar To Post) flagged two items the buyer wants addressed. The inspection contingency deadline is tomorrow. Request the seller complete the repairs prior to closing or provide a closing credit, keep the buyer's contingency rights intact, and make it ready to send for signature today. Reference the executed OREF purchase agreement.",
  },
};

const SCRIPTED: Record<string, DealScreen> = {
  "TX-3999": EVERETT,
  "TX-3998": HAWTHORNE,
};

/* ── Derivation for any non-scripted selected deal ────────────────────────── */

function sideOf(tx: Transaction): string {
  return /purchase|buyer/i.test(tx.type) ? "Buyer side" : "Listing side";
}

/** Map a raw checklist item label/done into a status row tone+value. */
function deriveStatusRows(tx: Transaction): StatusRow[] {
  const has = (label: string) => tx.checklist.find((c) => c.label === label);
  const inspection = has("Inspection complete");
  const appraisal = has("Appraisal ordered");
  const loan = has("Loan approved");
  const repairs = has("Repairs negotiated");

  const inspectionRow: StatusRow = inspection?.done
    ? { label: "Inspection", value: repairs?.done ? "Cleared" : "Repairs open", tone: repairs?.done ? "success" : "warn" }
    : { label: "Inspection", value: "Pending", tone: "warn" };

  const appraisalRow: StatusRow = appraisal?.done
    ? { label: "Appraisal", value: "Complete", tone: "success" }
    : { label: "Appraisal", value: "Scheduled", tone: "info" };

  const loanRow: StatusRow = loan?.done
    ? { label: "Loan", value: "Approved", tone: "success" }
    : { label: "Loan", value: "Conditional", tone: "gold" };

  const titleRow: StatusRow = { label: "Title", value: "Clear", tone: "success" };

  return [inspectionRow, appraisalRow, loanRow, titleRow];
}

/** Map the raw 11-item checklist into the lighter deal checklist shape. */
function deriveChecklist(tx: Transaction): DealChecklistItem[] {
  const firstOpen = tx.checklist.findIndex((c) => !c.done);
  return tx.checklist.map((c, i) => {
    let status: ChecklistStatus = c.done ? "done" : "pending";
    // The first open item with an at-risk deal flag reads as an issue.
    if (!c.done && tx.riskFlag && i === firstOpen) status = "issue";
    return {
      id: `c${i}`,
      label: c.label,
      status,
      meta: c.done ? "Complete" : i === firstOpen ? "Next up" : undefined,
    };
  });
}

/** Spread the canonical milestone names across the deal's timeframe. */
function deriveMilestones(tx: Transaction): DealMilestone[] {
  const close = tx.closeDateDaysOut;
  const fmt = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  };
  const stageIdx = tx.stageIndex;
  return [
    { id: "m1", title: "Offer accepted", dateLabel: fmt(-Math.max(20, 60 - close)), tone: "success" as MilestoneTone },
    { id: "m2", title: "Earnest money received", dateLabel: fmt(-Math.max(16, 56 - close)), tone: "success" as MilestoneTone },
    {
      id: "m3",
      title: "Inspection period ends",
      dateLabel: fmt(Math.round(-close * 0.4)),
      tone: (stageIdx <= 3 ? "warn" : "success") as MilestoneTone,
    },
    {
      id: "m4",
      title: "Appraisal due",
      dateLabel: fmt(Math.round(close * 0.3)),
      tone: (stageIdx <= 4 ? "info" : "success") as MilestoneTone,
    },
    {
      id: "m5",
      title: "Loan approval",
      dateLabel: fmt(Math.round(close * 0.6)),
      tone: (stageIdx <= 5 ? "gold" : "success") as MilestoneTone,
    },
    { id: "m6", title: "Closing", dateLabel: fmt(close), tone: "ink" as MilestoneTone, terminal: true },
  ];
}

function deriveRisk(tx: Transaction): RiskNote | null {
  if (!tx.riskFlag) return null;
  return {
    title: "AI Risk Note",
    body: `${tx.riskFlag}. Matin AI cross-referenced the deal state and the email thread for ${tx.address} and recommends drafting a response to keep the contingency on track.`,
    actionLabel: "Draft response",
    draftPrompt: `Draft a transaction-coordinator response for the deal at ${tx.address}. Open risk: "${tx.riskFlag}". Address the issue, protect the contingency timeline, and keep it professional. Reference the executed OREF purchase agreement.`,
  };
}

/** Resolve the full one-deal screen content for a selected transaction. */
export function dealScreenFor(tx: Transaction): DealScreen {
  const scripted = SCRIPTED[tx.id];
  if (scripted) return scripted;
  return {
    sideLine: `${sideOf(tx)} · ${tx.stage}`,
    statusRows: deriveStatusRows(tx),
    milestones: deriveMilestones(tx),
    checklist: deriveChecklist(tx),
    risk: deriveRisk(tx),
  };
}
