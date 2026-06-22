import type { Transaction } from "@/lib/types";
import type {
  ChipTone,
  MilestoneTone,
  ChecklistStatus,
  ActivityChannel,
  ActivityTagTone,
} from "@/components/os";
import { getAgent, listings, listingPhoto } from "@/lib/data";
import { defaultTransactionCoordinator, roles } from "@/lib/data/roles";

/* ── Real listing imagery keyed to the deal address (§2.6 ticket 10) ───────────
   Match a transaction's street address to a real `listings.json` record so the
   deal hero shows that property's real hero photo when we have one; otherwise a
   deterministic exterior keyed by the deal id (never a random seed). */
function streetOf(address: string): string {
  return address.replace(/, .*$/, "").trim().toLowerCase();
}
export function dealPhoto(tx: Transaction): string {
  const street = streetOf(tx.address);
  const match = listings.find((l) => l.address.trim().toLowerCase() === street);
  if (match) return listingPhoto(match);
  return listingPhoto(tx.id);
}

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

/** One label:value cell in the 8+ field transaction metadata band (§2.6). */
export type MetaField = { label: string; value: string };

/** A named party on the deal (Buyer / Seller / Co-op agent / Lender / Title). */
export type DealContact = {
  role: string;
  name: string;
  detail?: string;
  /** Real agent slug when the contact is a Matin agent (drives Avatar). */
  slug?: string;
};

/** A contextual deal-action above the checklist (§2.6 ticket 5). */
export type DealAction = {
  id: string;
  label: string;
  /** When set, the action streams an AI draft via streamAi with this prompt. */
  draftPrompt?: string;
};

export type DealScreen = {
  /** "Listing side · Clear to Close · Close Jun 26" line under the address. */
  sideLine: string;
  statusRows: StatusRow[];
  milestones: DealMilestone[];
  checklist: DealChecklistItem[];
  documents: DealDocument[];
  activity: DealActivitySeed[];
  /** Null when the deal carries no open risk. */
  risk: RiskNote | null;
  /** 8+ field transaction metadata band (§2.6 ticket 3). */
  meta: MetaField[];
  /** Named parties on the deal (Buyer/Seller/Co-op/Lender/Title). */
  contacts: DealContact[];
  /** Real transaction-coordinator slug for the coordinator slot (§2.6 ticket 3). */
  coordinatorSlug: string;
  /** Real lead-agent slug (the deal's listing/buyer agent). */
  leadAgentSlug: string;
  /** Contextual deal-action bar items (§2.6 ticket 5). */
  actions: DealAction[];
};

/* ── Canonical scripted deals ─────────────────────────────────────────────── */

/* TX-3999 — 1274 NW Everett St · Sale (Listing) for Melissa Grant · Clear to
   Close · $689,000 · closes in 8 days. (Plain LISTING-side deal, not buyer-side
   — the scripted contradiction the S6 ticket calls out is fixed here.) */
const EVERETT: DealScreen = {
  sideLine: "Listing side · Clear to Close · Close Jun 26",
  meta: [
    { label: "Buyer", value: "Aaron & Lía Delgado" },
    { label: "Seller", value: "Melissa Grant" },
    { label: "Co-op agent", value: "Priya Anand · Premiere Property Group" },
    { label: "Lender", value: "Summit Mortgage · Kara Wells" },
    { label: "Title / Escrow", value: "Fidelity National · J. Okonkwo" },
    { label: "Escrow #", value: "FID-118-44907" },
    { label: "Acceptance date", value: "May 22, 2026" },
    { label: "Close of escrow", value: "Jun 26, 2026" },
    { label: "Price / SF", value: "$417 / SF" },
  ],
  contacts: [
    { role: "Seller", name: "Melissa Grant", detail: "1274 NW Everett St, Portland" },
    { role: "Buyer", name: "Aaron & Lía Delgado", detail: "Relocating from Bend" },
    { role: "Co-op agent", name: "Priya Anand", detail: "Premiere Property Group · (503) 555-0142" },
    { role: "Lender", name: "Kara Wells", detail: "Summit Mortgage · NMLS 218844" },
    { role: "Title / Escrow", name: "Joy Okonkwo", detail: "Fidelity National Title" },
  ],
  statusRows: [
    { label: "Inspection", value: "Cleared", tone: "success" },
    { label: "Appraisal", value: "At value", tone: "success" },
    { label: "Loan", value: "Approved", tone: "success" },
    { label: "Title", value: "Clear", tone: "success" },
  ],
  milestones: [
    { id: "m1", title: "Offer accepted", dateLabel: "May 22", tone: "success" },
    { id: "m2", title: "Earnest money received", dateLabel: "May 25", tone: "success" },
    { id: "m3", title: "Inspection cleared", dateLabel: "Jun 02", tone: "success" },
    { id: "m4", title: "Appraisal at value", dateLabel: "Jun 10", tone: "success" },
    { id: "m5", title: "Final loan approval", dateLabel: "Jun 18", tone: "success" },
    { id: "m6", title: "Closing", dateLabel: "Jun 26", tone: "ink", terminal: true },
  ],
  checklist: [
    { id: "c1", label: "Signed listing agreement", status: "done", meta: "OREF-001 · executed May 22" },
    { id: "c2", label: "Seller's property disclosure", status: "done", meta: "Property & lead-based paint · May 22" },
    { id: "c3", label: "Inspection contingency cleared", status: "done", meta: "No repair addendum requested" },
    { id: "c4", label: "Appraisal received", status: "done", meta: "At contract price · Jun 10" },
    { id: "c5", label: "Final loan approval letter", status: "done", meta: "Clear to close · Summit Mortgage" },
    { id: "c6", label: "Closing disclosure to seller", status: "pending", meta: "Prepared — awaiting seller review" },
    { id: "c7", label: "Final walkthrough", status: "scheduled", meta: "Scheduled Jun 25, 4:00 PM" },
  ],
  documents: [
    {
      id: "d1", name: "OREF-001 Residential Sale Agreement", requirement: "Contract",
      status: "complete", pages: 9, meta: "Executed May 22 · all initials present", signature: true,
    },
    {
      id: "d2", name: "Seller's Property Disclosure", requirement: "Disclosures",
      status: "complete", pages: 6, meta: "Property & lead-based paint · uploaded May 22",
    },
    {
      id: "d3", name: "Appraisal Report", requirement: "Contingencies",
      status: "complete", pages: 11, meta: "At contract price · received Jun 10",
    },
    {
      id: "d4", name: "Lender Clear-to-Close Letter", requirement: "Financing",
      status: "complete", pages: 2, meta: "Summit Mortgage · issued Jun 18",
    },
    {
      id: "d5", name: "Closing Disclosure (Seller)", requirement: "Closing",
      status: "needs-review", pages: 5, meta: "Prepared by escrow — awaiting seller review",
      missing: ["confirm net proceeds with seller · page 3"], signature: true,
    },
  ],
  activity: [
    { id: "a1", channel: "system", name: "Clear to Close issued", tag: "financing", tagTone: "success", meta: "Summit Mortgage · final approval logged", timeLabel: "2d", group: "This week" },
    { id: "a2", channel: "system", name: "Closing disclosure prepared", tag: "closing", tagTone: "info", meta: "Escrow sent seller CD for review", timeLabel: "1d", group: "This week" },
    { id: "a3", channel: "note", name: "Final walkthrough scheduled", tag: "milestone", tagTone: "info", meta: "Jun 25, 4:00 PM with buyer's agent", timeLabel: "1d", group: "This week" },
    { id: "a4", channel: "email", name: "Appraisal received at value", tag: "contingency", tagTone: "success", meta: "No appraisal gap — full contract price", timeLabel: "Jun 10", group: "Earlier" },
    { id: "a5", channel: "system", name: "Earnest money received", tag: "escrow", tagTone: "success", meta: "$10,000 wired · receipt on file", timeLabel: "May 25", group: "Earlier" },
    { id: "a6", channel: "text", name: "Offer accepted", tag: "milestone", tagTone: "success", meta: "Sale agreement executed by both parties", timeLabel: "May 22", group: "Earlier" },
  ],
  risk: null,
  coordinatorSlug: defaultTransactionCoordinator,
  leadAgentSlug: "chase-bright",
  actions: [
    { id: "warranty", label: "Order home warranty" },
    { id: "nhd", label: "Order NHD report" },
    {
      id: "seller-update",
      label: "Generate seller update",
      draftPrompt:
        "Draft a warm, concise listing-side seller update email from Matin Real Estate to Melissa Grant about her home sale at 1274 NW Everett St, Portland. The deal is Clear to Close and on track to close June 26. The appraisal came in at full contract price, the buyer's loan has final approval, and the final walkthrough is scheduled for June 25. Confirm next steps: review the seller closing disclosure, sign at escrow, and hand over keys at closing. Keep it reassuring and professional, signed from the Matin listings team.",
    },
    { id: "update-agent", label: "Update co-op agent" },
  ],
};

/* TX-3998 — 8912 SE Hawthorne Blvd · Purchase (Buyer) for Daniel Cho ·
   Inspection · $829,000 · closes in 19 days · AT RISK (inspection deadline
   tomorrow, repair addendum unsigned). */
const HAWTHORNE: DealScreen = {
  sideLine: "Buyer side · Inspection · Close Jul 08",
  meta: [
    { label: "Buyer", value: "Daniel Cho" },
    { label: "Seller", value: "R. & M. Whitfield" },
    { label: "Co-op agent", value: "Sam Reyes · Keller Williams PDX" },
    { label: "Lender", value: "WaFd Bank · T. Nakamura" },
    { label: "Title / Escrow", value: "First American · D. Brennan" },
    { label: "Escrow #", value: "FA-2026-77310" },
    { label: "Acceptance date", value: "Jun 02, 2026" },
    { label: "Close of escrow", value: "Jul 08, 2026" },
    { label: "Price / SF", value: "$406 / SF" },
  ],
  contacts: [
    { role: "Buyer", name: "Daniel Cho", detail: "First-time move-up buyer · Beaverton" },
    { role: "Seller", name: "R. & M. Whitfield", detail: "8912 SE Hawthorne Blvd, Portland" },
    { role: "Co-op agent", name: "Sam Reyes", detail: "Keller Williams PDX · (503) 555-0188" },
    { role: "Lender", name: "Tom Nakamura", detail: "WaFd Bank · NMLS 401993" },
    { role: "Title / Escrow", name: "Dana Brennan", detail: "First American Title" },
  ],
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
  coordinatorSlug: defaultTransactionCoordinator,
  leadAgentSlug: "chase-bright",
  actions: [
    {
      id: "repair-addendum",
      label: "Draft repair addendum",
      draftPrompt:
        "Draft a buyer-side repair addendum for the purchase of 8912 SE Hawthorne Blvd, Portland for buyer Daniel Cho. The Pillar To Post inspection flagged roof flashing and two GFCI outlets. The inspection contingency deadline is tomorrow. Request the seller complete the repairs prior to closing or provide a closing credit, preserve the buyer's contingency rights, and make it ready to send for signature today. Reference the executed OREF purchase agreement.",
    },
    { id: "warranty", label: "Order home warranty" },
    {
      id: "buyer-update",
      label: "Generate buyer update",
      draftPrompt:
        "Draft a concise buyer update email from Matin Real Estate to Daniel Cho about his purchase of 8912 SE Hawthorne Blvd, Portland. The inspection is complete and the contingency deadline is tomorrow. Two items were flagged (roof flashing, two GFCI outlets); we are sending the seller a repair addendum today requesting repairs or a closing credit. Reassure him his earnest money and contingency rights are protected, and that we will not waive the inspection without his approval. Keep it clear and professional, signed from the Matin team.",
    },
    { id: "update-lender", label: "Update lender + title" },
  ],
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
    tagTone: "info", meta: "Logged automatically", timeLabel: "today", group: "Today",
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
    body: `${tx.riskFlag}. Drafting a response now will keep this contingency on track.`,
    actionLabel: "Draft response",
    draftPrompt: `Draft a transaction-coordinator response for the deal at ${tx.address}. Open risk: "${tx.riskFlag}". Address the issue, protect the contingency timeline, and keep it professional. Reference the executed OREF purchase agreement.`,
  };
}

/* Deterministic but plausible third-party contacts (co-op agent, lender,
   title) so every selected deal carries a real-looking 8-field metadata band.
   Keyed off the deal id so the same deal always shows the same parties. */
const COOP_AGENTS = [
  "Priya Anand · Premiere Property Group",
  "Sam Reyes · Keller Williams PDX",
  "Marcus Webb · Cascade Hasson SIR",
  "Dana Liu · Living Room Realty",
  "Owen Park · Windermere Realty Trust",
];
const LENDERS = [
  "Summit Mortgage · Kara Wells",
  "WaFd Bank · T. Nakamura",
  "Guild Mortgage · R. Okafor",
  "OnPoint Community CU · M. Diaz",
  "Cross Country Mortgage · L. Tran",
];
const TITLES = [
  "Fidelity National · J. Okonkwo",
  "First American · D. Brennan",
  "WFG National Title · S. Park",
  "Ticor Title · A. Romero",
  "Chicago Title · P. Hughes",
];

function pick<T>(arr: T[], id: string): T {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function deriveMeta(tx: Transaction): MetaField[] {
  const buyerSide = /purchase|buyer/i.test(tx.type);
  const ppsfBand = Math.round(tx.price / 2050); // plausible $/SF for the price band
  const coop = pick(COOP_AGENTS, tx.id);
  const lender = pick(LENDERS, tx.id);
  const title = pick(TITLES, tx.id);
  const acceptOffset = -Math.max(20, 60 - tx.closeDateDaysOut);
  return [
    { label: "Buyer", value: buyerSide ? tx.client : pick(["Aaron & Lía Delgado", "The Nguyen Family", "J. & R. Sterling", "Maya & Theo Holt"], tx.id) },
    { label: "Seller", value: buyerSide ? pick(["R. & M. Whitfield", "The Calloway Trust", "S. & E. Brooks", "Hartley Family"], tx.id) : tx.client },
    { label: "Co-op agent", value: coop },
    { label: "Lender", value: lender },
    { label: "Title / Escrow", value: title },
    { label: "Escrow #", value: `ESC-${tx.id.replace(/\D/g, "")}-${(tx.price % 9000) + 1000}` },
    { label: "Acceptance date", value: addDays(acceptOffset) },
    { label: "Close of escrow", value: addDays(tx.closeDateDaysOut) },
    { label: "Price / SF", value: `$${ppsfBand} / SF` },
  ];
}

function deriveContacts(tx: Transaction): DealContact[] {
  const buyerSide = /purchase|buyer/i.test(tx.type);
  const meta = deriveMeta(tx);
  const find = (l: string) => meta.find((m) => m.label === l)?.value ?? "";
  const city = tx.address.replace(/^.*?, /, "");
  return [
    buyerSide
      ? { role: "Buyer", name: find("Buyer"), detail: tx.address }
      : { role: "Seller", name: find("Seller"), detail: tx.address },
    buyerSide
      ? { role: "Seller", name: find("Seller"), detail: city }
      : { role: "Buyer", name: find("Buyer"), detail: `Purchasing in ${city}` },
    { role: "Co-op agent", name: find("Co-op agent").split(" · ")[0], detail: find("Co-op agent").split(" · ")[1] },
    { role: "Lender", name: find("Lender").split(" · ")[1] ?? find("Lender"), detail: find("Lender").split(" · ")[0] },
    { role: "Title / Escrow", name: find("Title / Escrow").split(" · ")[1] ?? find("Title / Escrow"), detail: find("Title / Escrow").split(" · ")[0] },
  ];
}

function deriveActions(tx: Transaction): DealAction[] {
  const buyerSide = /purchase|buyer/i.test(tx.type);
  const role = buyerSide ? "buyer" : "seller";
  const Role = buyerSide ? "Buyer" : "Seller";
  return [
    { id: "warranty", label: "Order home warranty" },
    { id: "nhd", label: "Order NHD report" },
    { id: "update-agent", label: "Update co-op agent" },
    {
      id: `${role}-update`,
      label: `Generate ${role} update`,
      draftPrompt: `Draft a concise ${role} update email from Matin Real Estate to ${tx.client} about the ${role === "buyer" ? "purchase" : "sale"} at ${tx.address}. The deal is in the ${tx.stage} stage and on track to close in ${tx.closeDateDaysOut} days.${tx.riskFlag ? ` Note this open item and how we are handling it: ${tx.riskFlag}.` : " Confirm the remaining steps and that everything is progressing on schedule."} Keep it reassuring and professional, signed from the Matin team. (${Role} update)`,
    },
  ];
}

/** Resolve the full one-deal screen content for a selected transaction. */
export function dealScreenFor(tx: Transaction): DealScreen {
  const scripted = SCRIPTED[tx.id];
  if (scripted) return scripted;
  // Resolve the deal's lead agent + a real TC for the coordinator slot.
  const leadAgentSlug = getAgent(tx.agentSlug) ? tx.agentSlug : roles.principalBroker;
  return {
    sideLine: `${sideOf(tx)} · ${tx.stage} · Close ${addDays(tx.closeDateDaysOut).replace(/, \d{4}$/, "")}`,
    statusRows: deriveStatusRows(tx),
    milestones: deriveMilestones(tx),
    checklist: deriveChecklist(tx),
    documents: deriveDocuments(tx),
    activity: deriveActivity(tx),
    risk: deriveRisk(tx),
    meta: deriveMeta(tx),
    contacts: deriveContacts(tx),
    coordinatorSlug: defaultTransactionCoordinator,
    leadAgentSlug,
    actions: deriveActions(tx),
  };
}
