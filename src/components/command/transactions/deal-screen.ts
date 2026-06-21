import type { Transaction } from "@/lib/types";
import type {
  ChipTone,
  MilestoneTone,
  ChecklistStatus,
  ActivityChannel,
  ActivityTagTone,
} from "@/components/os";

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

/** Compliance document on the deal — drives the doc-tree + review drawer (§2.6). */
export type DocStatus = "complete" | "needs-review" | "missing" | "rejected";
export type DealDocument = {
  id: string;
  name: string;
  /** Requirement group the doc tree organizes under. */
  requirement: string;
  status: DocStatus;
  /** Pages in the rendered preview. */
  pages: number;
  /** Source / executed-on provenance line. */
  meta: string;
  /** When set, the doc preview surfaces these missing-field notes. */
  missing?: string[];
  /** Whether a literal boxed signature field renders in the preview. */
  signature?: boolean;
};

/** A seed activity_event for the deal's audit chronology (§1.7 / §2.6). */
export type DealActivitySeed = {
  id: string;
  channel: ActivityChannel;
  name: string;
  tag?: string;
  tagTone?: ActivityTagTone;
  meta?: string;
  timeLabel: string;
  group: string;
};

export type DealScreen = {
  /** "Buyer side · Under Contract · Close Jul 22" line under the address. */
  sideLine: string;
  statusRows: StatusRow[];
  milestones: DealMilestone[];
  checklist: DealChecklistItem[];
  documents: DealDocument[];
  activity: DealActivitySeed[];
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
  documents: [
    {
      id: "d1", name: "OREF-001 Residential Sale Agreement", requirement: "Contract",
      status: "complete", pages: 9, meta: "Executed Jun 18 · all initials present", signature: true,
    },
    {
      id: "d2", name: "Seller's Property Disclosure", requirement: "Disclosures",
      status: "complete", pages: 6, meta: "Property & lead-based paint · uploaded Jun 19",
    },
    {
      id: "d3", name: "Inspection Repair Addendum", requirement: "Contingencies",
      status: "missing", pages: 2, meta: "Roof concern raised — not yet generated",
      missing: ["addendum body not drafted", "buyer & seller signatures · pages 1–2"], signature: true,
    },
    {
      id: "d4", name: "Lender Conditional Approval", requirement: "Financing",
      status: "needs-review", pages: 3, meta: "Summit Mortgage · received Jun 17",
      missing: ["verify rate-lock expiration · page 2"],
    },
    {
      id: "d5", name: "Earnest Money Receipt", requirement: "Escrow",
      status: "complete", pages: 1, meta: "$10,000 wired to escrow · Jun 20",
    },
  ],
  activity: [
    { id: "a1", channel: "system", name: "AI Risk Note generated", tag: "needs action", tagTone: "danger", meta: "Roof concern vs. missing addendum · inspection ends Jun 23", timeLabel: "12m", group: "Today" },
    { id: "a2", channel: "email", name: "Buyer email received", tag: "roof concern", tagTone: "warn", meta: "Daniel Cho asked about shingle condition", timeLabel: "1h", group: "Today" },
    { id: "a3", channel: "system", name: "Conditional approval logged", tag: "financing", tagTone: "info", meta: "Summit Mortgage · auto-filed to deal", timeLabel: "Jun 19", group: "This week" },
    { id: "a4", channel: "note", name: "Seller disclosure uploaded", tag: "disclosures", tagTone: "success", meta: "Property + lead-based paint", timeLabel: "Jun 19", group: "This week" },
    { id: "a5", channel: "system", name: "Earnest money received", tag: "escrow", tagTone: "success", meta: "$10,000 wired · receipt on file", timeLabel: "Jun 20", group: "This week" },
    { id: "a6", channel: "text", name: "Offer accepted", tag: "milestone", tagTone: "success", meta: "Sale agreement executed by both parties", timeLabel: "Jun 18", group: "Earlier" },
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
  documents: [
    {
      id: "d1", name: "OREF-001 Residential Sale Agreement", requirement: "Contract",
      status: "complete", pages: 9, meta: "Executed Jun 02 · all initials present", signature: true,
    },
    {
      id: "d2", name: "Earnest Money Receipt", requirement: "Escrow",
      status: "complete", pages: 1, meta: "$15,000 wired to escrow · Jun 05",
    },
    {
      id: "d3", name: "Pillar To Post Inspection Report", requirement: "Contingencies",
      status: "needs-review", pages: 14, meta: "Uploaded Jun 19 · 2 flagged items",
      missing: ["agent to summarize 2 negotiable items"],
    },
    {
      id: "d4", name: "Repair Addendum", requirement: "Contingencies",
      status: "missing", pages: 2, meta: "Deadline tomorrow — not yet executed",
      missing: ["buyer signature · page 1", "seller signature · page 2"], signature: true,
    },
    {
      id: "d5", name: "Loan Estimate", requirement: "Financing",
      status: "needs-review", pages: 5, meta: "WaFd Bank · in processing",
      missing: ["appraisal not yet ordered"],
    },
  ],
  activity: [
    { id: "a1", channel: "system", name: "AI Risk Note generated", tag: "deadline tomorrow", tagTone: "danger", meta: "Repair addendum unsigned · contingency at risk", timeLabel: "8m", group: "Today" },
    { id: "a2", channel: "email", name: "Inspection report uploaded", tag: "2 flagged items", tagTone: "warn", meta: "Pillar To Post · roof flashing + GFCI outlets", timeLabel: "Jun 19", group: "This week" },
    { id: "a3", channel: "system", name: "Loan moved to processing", tag: "financing", tagTone: "info", meta: "WaFd Bank · awaiting appraisal trigger", timeLabel: "Jun 17", group: "This week" },
    { id: "a4", channel: "system", name: "Earnest money received", tag: "escrow", tagTone: "success", meta: "$15,000 wired · receipt on file", timeLabel: "Jun 05", group: "Earlier" },
    { id: "a5", channel: "text", name: "Offer accepted", tag: "milestone", tagTone: "success", meta: "Sale agreement executed by both parties", timeLabel: "Jun 02", group: "Earlier" },
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

/** Map the deal's stage progress into a plausible compliance doc set. */
function deriveDocuments(tx: Transaction): DealDocument[] {
  const has = (label: string) => tx.checklist.find((c) => c.label === label)?.done ?? false;
  const buyer = /purchase|buyer/i.test(tx.type);
  const docs: DealDocument[] = [
    {
      id: "d1", name: "OREF-001 Residential Sale Agreement", requirement: "Contract",
      status: has("Offer accepted") ? "complete" : "needs-review",
      pages: 9, meta: has("Offer accepted") ? "Executed · all initials present" : "Draft circulating for signature",
      signature: true,
      missing: has("Offer accepted") ? undefined : ["buyer & seller signatures · pages 8–9"],
    },
    {
      id: "d2", name: buyer ? "Buyer Advisory & Disclosures" : "Seller's Property Disclosure",
      requirement: "Disclosures",
      status: tx.stageIndex >= 2 ? "complete" : "needs-review",
      pages: 6, meta: tx.stageIndex >= 2 ? "On file" : "Awaiting upload",
    },
    {
      id: "d3", name: "Home Inspection Report", requirement: "Contingencies",
      status: has("Inspection complete") ? "complete" : "missing",
      pages: 12, meta: has("Inspection complete") ? "Uploaded · contingency cleared" : "Inspection not yet complete",
      missing: has("Inspection complete") ? undefined : ["report not uploaded"],
    },
    {
      id: "d4", name: "Lender Approval Letter", requirement: "Financing",
      status: has("Loan approved") ? "complete" : "needs-review",
      pages: 3, meta: has("Loan approved") ? "Final approval issued" : "Conditional / in processing",
      missing: has("Loan approved") ? undefined : ["verify approval conditions · page 2"],
    },
    {
      id: "d5", name: "Closing Disclosure", requirement: "Closing",
      status: has("Closing disbursed") ? "complete" : tx.stageIndex >= 6 ? "needs-review" : "missing",
      pages: 5, meta: has("Closing disbursed") ? "Signed at closing" : tx.stageIndex >= 6 ? "Prepared — awaiting review" : "Not yet prepared",
      missing: tx.stageIndex >= 6 && !has("Closing disbursed") ? ["confirm figures with escrow · page 3"] : tx.stageIndex < 6 ? ["pending earlier milestones"] : undefined,
      signature: true,
    },
  ];
  return docs;
}

/** Seed a short audit chronology from the deal's real milestones. */
function deriveActivity(tx: Transaction): DealActivitySeed[] {
  const out: DealActivitySeed[] = [];
  if (tx.riskFlag) {
    out.push({
      id: "a1", channel: "system", name: "AI Risk Note generated", tag: "needs action",
      tagTone: "danger", meta: tx.riskFlag, timeLabel: "now", group: "Today",
    });
  }
  out.push({
    id: "a2", channel: "system", name: `Stage advanced to ${tx.stage}`, tag: "pipeline",
    tagTone: "info", meta: "Auto-logged from the deal record", timeLabel: "today", group: "Today",
  });
  if (tx.checklist.find((c) => c.label === "Inspection complete")?.done) {
    out.push({
      id: "a3", channel: "email", name: "Inspection report uploaded", tag: "contingency",
      tagTone: "success", meta: "Filed to the deal documents", timeLabel: "this week", group: "This week",
    });
  }
  if (tx.checklist.find((c) => c.label === "Earnest money received")?.done) {
    out.push({
      id: "a4", channel: "system", name: "Earnest money received", tag: "escrow",
      tagTone: "success", meta: "Receipt on file", timeLabel: "earlier", group: "Earlier",
    });
  }
  out.push({
    id: "a5", channel: "text", name: "Offer accepted", tag: "milestone",
    tagTone: "success", meta: "Sale agreement executed by both parties", timeLabel: "earlier", group: "Earlier",
  });
  return out;
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
    documents: deriveDocuments(tx),
    activity: deriveActivity(tx),
    risk: deriveRisk(tx),
  };
}
