"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Circle,
  CalendarClock,
  DollarSign,
  User,
  ClipboardList,
  ArrowRight,
  FileText,
  FileCheck2,
  FileClock,
  Home,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Search,
  Bell,
  Eye,
  Upload,
  RefreshCw,
  ClipboardCheck,
  Copy,
  Printer,
  ChevronRight,
} from "lucide-react";
import type { Transaction } from "@/lib/types";
import { getAgent, agents } from "@/lib/data";
import { cn, usd, daysLabel, initials } from "@/lib/utils";
import { ProgressBar, Pill } from "@/components/command/ui";
import { streamAi } from "@/lib/ai/client";
import { AiMarkdown } from "@/components/command/AiMarkdown";

/* ──────────────────────────────────────────────────────────────────────────
   Transactions — a real transaction-coordinator view (Dotloop / SkySlope
   "loops"): every deal is a loop with a smart checklist, deadlines and docs.
   A dense, scannable LIST is the default; clicking a row opens a detail
   slide-over with the signature smart checklist, key facts and a documents
   area. No pipelines, no triggers, no automation — just deals + checklists +
   deadlines + docs.
   ────────────────────────────────────────────────────────────────────────── */

type StatusFilter = "All" | "Active" | "Pending" | "Closed" | "At-risk";

const FILTERS: StatusFilter[] = ["All", "Active", "Pending", "Closed", "At-risk"];

/* ── Status filter color mapping ────────────────────────────────────────────── */
const FILTER_ACTIVE_TONE: Record<StatusFilter, string> = {
  All:        "border-ink/20 bg-ink/[0.08] text-ink",
  Active:     "border-azure/30 bg-azure/10 text-azure",
  Pending:    "border-warn/30 bg-warn/10 text-amber-700",
  Closed:     "border-success/30 bg-success/10 text-success",
  "At-risk":  "border-danger/30 bg-danger/10 text-danger",
};

/** Stage string → badge classes (for the row stage display) */
function stageBadgeTone(stage: string): string {
  if (stage === "Closed") return "bg-success/10 text-success ring-success/25";
  if (["Appraisal", "Financing", "Clear to Close", "Pending"].includes(stage))
    return "bg-warn/10 text-amber-700 ring-warn/25";
  if (stage === "Cancelled") return "bg-danger/10 text-danger ring-danger/25";
  return "bg-azure/10 text-azure ring-azure/20";
}

/** Colored left-border class for urgency on transaction cards */
function urgencyBorderClass(daysOut: number, closed: boolean): string {
  if (closed) return "border-l-4 border-l-success/40";
  if (daysOut < 0) return "border-l-4 border-l-danger";
  if (daysOut < 7) return "border-l-4 border-l-danger";
  if (daysOut < 14) return "border-l-4 border-l-warn";
  return "border-l-4 border-l-success/50";
}

/** Chip color for "X days to close" */
function daysToCloseChipClass(daysOut: number, closed: boolean): string {
  if (closed) return "bg-success/10 text-success";
  if (daysOut < 0) return "bg-danger/10 text-danger";
  if (daysOut < 7) return "bg-danger/10 text-danger";
  if (daysOut < 14) return "bg-warn/10 text-amber-700";
  return "bg-azure/10 text-azure";
}

/** "X days to close" label */
function daysToCloseLabel(daysOut: number, closed: boolean): string {
  if (closed) return "Closed";
  if (daysOut < 0) return `${Math.abs(daysOut)}d past close`;
  if (daysOut === 0) return "Closing today";
  return `${daysOut}d to close`;
}

// A deal counts as "Pending" once it's under contract heading to the table.
const PENDING_STAGES = new Set(["Pending", "Appraisal", "Financing", "Clear to Close"]);

function isClosed(t: Transaction) {
  return t.stage === "Closed";
}
function isPending(t: Transaction) {
  return !isClosed(t) && PENDING_STAGES.has(t.stage);
}
function isActiveOpen(t: Transaction) {
  // "Active" = open (not closed) and not yet under contract / pending.
  return !isClosed(t) && !isPending(t);
}

function matchesFilter(t: Transaction, f: StatusFilter) {
  switch (f) {
    case "All":
      return true;
    case "Active":
      return isActiveOpen(t);
    case "Pending":
      return isPending(t);
    case "Closed":
      return isClosed(t);
    case "At-risk":
      return t.riskFlag != null;
  }
}

/** Progress as a number 0–100: prefer explicit progress, fall back to checklist ratio. */
function progressOf(t: Transaction, checklist?: { label: string; done: boolean }[]) {
  const list = checklist ?? t.checklist;
  if (typeof t.progress === "number" && t.progress > 0 && !checklist) return t.progress;
  if (list.length === 0) return 0;
  return Math.round((list.filter((c) => c.done).length / list.length) * 100);
}

function progressTone(t: Transaction): "azure" | "success" | "danger" {
  if (isClosed(t)) return "success";
  if (t.riskFlag) return "danger";
  return "azure";
}

/** Sale (Listing) vs Purchase (Buyer) → a short, scannable label. */
function shortType(type: string): { label: "Sale" | "Purchase"; icon: typeof Home } {
  return /purchase|buyer/i.test(type)
    ? { label: "Purchase", icon: ShoppingBag }
    : { label: "Sale", icon: Home };
}

/**
 * Simulate due dates for checklist items since the Transaction type
 * does not carry dueDate. We spread items evenly between "today minus
 * closeDateDaysOut" and the projected close date, so early items in
 * a deal that has been running a while will appear overdue.
 */
function simulatedDueDates(t: Transaction): Date[] {
  const today = new Date();
  const closeDate = new Date(today);
  closeDate.setDate(today.getDate() + t.closeDateDaysOut);

  const totalItems = t.checklist.length;
  if (totalItems === 0) return [];

  // Start date: estimate contract start as 60 days before close.
  const startDate = new Date(closeDate);
  startDate.setDate(closeDate.getDate() - 60);

  const span = closeDate.getTime() - startDate.getTime();
  return t.checklist.map((_, i) => {
    const offset = (i / Math.max(totalItems - 1, 1)) * span;
    const d = new Date(startDate.getTime() + offset);
    return d;
  });
}

/** Returns days overdue (positive = overdue) for a checklist item. 0 if not overdue. */
function daysOverdue(itemDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(itemDate);
  d.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

/**
 * Parse extracted AI deadline markdown into new checklist item labels.
 * Pulls Field + Value columns from markdown table rows.
 */
function parseDeadlines(markdown: string): string[] {
  return markdown
    .split("\n")
    .filter(
      (line) =>
        line.startsWith("|") &&
        !line.startsWith("| Field") &&
        !line.startsWith("|---") &&
        !line.includes("---"),
    )
    .map((line) => {
      const cols = line
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      if (cols.length >= 2 && cols[1] && cols[1] !== "—" && cols[1] !== "-") {
        return `${cols[0]}: ${cols[1]}`;
      }
      return null;
    })
    .filter((x): x is string => x !== null && x.length > 3);
}

/* ── Document generation constants ──────────────────────────────────────── */

const MATIN_BRAND = {
  name: "Matin Real Estate",
  address: "4 Centerpointe Dr, Lake Oswego, OR 97035",
  phone: "(503) 622-9624",
};

type TxDocField = {
  id: string;
  label: string;
  type: "text" | "date" | "number" | "textarea";
  autoFill?: keyof Transaction | "agentName" | "closingDateCalc";
  placeholder?: string;
};

type TxDocTemplate = {
  id: string;
  name: string;
  icon: "FileText" | "RefreshCw" | "ClipboardCheck" | "X";
  description: string;
  fields: TxDocField[];
};

const TX_DOCS: TxDocTemplate[] = [
  {
    id: "purchase-offer",
    name: "Purchase Offer",
    icon: "FileText",
    description: "Pre-filled purchase offer with buyer, seller, and price details.",
    fields: [
      { id: "buyerName",        label: "Buyer Name",        type: "text",   autoFill: "client" },
      { id: "sellerName",       label: "Seller Name",       type: "text",   placeholder: "Enter seller name" },
      { id: "propertyAddress",  label: "Property Address",  type: "text",   autoFill: "address" },
      { id: "offerPrice",       label: "Offer Price ($)",   type: "number", autoFill: "price" },
      { id: "earnestMoney",     label: "Earnest Money ($)", type: "number", placeholder: "e.g. 5000" },
      { id: "closingDate",      label: "Closing Date",      type: "date",   autoFill: "closingDateCalc" },
      { id: "agentName",        label: "Agent",             type: "text",   autoFill: "agentName" },
      { id: "additionalTerms",  label: "Additional Terms",  type: "textarea", placeholder: "Any additional terms or contingencies..." },
    ],
  },
  {
    id: "counteroffer",
    name: "Counteroffer",
    icon: "RefreshCw",
    description: "Counter with revised price and terms pre-filled from transaction.",
    fields: [
      { id: "buyerName",        label: "Buyer Name",         type: "text",   autoFill: "client" },
      { id: "sellerName",       label: "Seller Name",        type: "text",   placeholder: "Enter seller name" },
      { id: "propertyAddress",  label: "Property Address",   type: "text",   autoFill: "address" },
      { id: "counterPrice",     label: "Counter Price ($)",  type: "number", autoFill: "price" },
      { id: "closingDate",      label: "Closing Date",       type: "date",   autoFill: "closingDateCalc" },
      { id: "agentName",        label: "Agent",              type: "text",   autoFill: "agentName" },
      { id: "counterTerms",     label: "Counter Terms",      type: "textarea", placeholder: "Changes from original offer..." },
    ],
  },
  {
    id: "inspection-notice",
    name: "Inspection Notice",
    icon: "ClipboardCheck",
    description: "Inspection request notice with property and agent details.",
    fields: [
      { id: "buyerName",        label: "Buyer Name",        type: "text",   autoFill: "client" },
      { id: "propertyAddress",  label: "Property Address",  type: "text",   autoFill: "address" },
      { id: "inspectionDate",   label: "Inspection Date",   type: "date",   placeholder: "" },
      { id: "inspectionTime",   label: "Inspection Time",   type: "text",   placeholder: "e.g. 10:00 AM" },
      { id: "inspectorName",    label: "Inspector Name",    type: "text",   placeholder: "Inspector's name" },
      { id: "agentName",        label: "Agent",             type: "text",   autoFill: "agentName" },
      { id: "notes",            label: "Notes",             type: "textarea", placeholder: "Inspection scope or access instructions..." },
    ],
  },
  {
    id: "termination",
    name: "Termination Agreement",
    icon: "X",
    description: "Mutual termination notice with earnest money disposition.",
    fields: [
      { id: "buyerName",        label: "Buyer Name",        type: "text",   autoFill: "client" },
      { id: "sellerName",       label: "Seller Name",       type: "text",   placeholder: "Enter seller name" },
      { id: "propertyAddress",  label: "Property Address",  type: "text",   autoFill: "address" },
      { id: "terminationDate",  label: "Termination Date",  type: "date",   placeholder: "" },
      { id: "earnestDisposition", label: "Earnest Money Disposition", type: "text", placeholder: "e.g. Return to buyer" },
      { id: "agentName",        label: "Agent",             type: "text",   autoFill: "agentName" },
      { id: "reason",           label: "Reason for Termination", type: "textarea", placeholder: "State the reason for termination..." },
    ],
  },
];

/** Compute the initial field values from a transaction */
function autoFillValues(
  tx: Transaction,
  fields: TxDocField[],
  agentName: string,
): Record<string, string> {
  const today = new Date();
  const closeDate = new Date(today);
  closeDate.setDate(today.getDate() + tx.closeDateDaysOut);
  const closeDateStr = closeDate.toISOString().split("T")[0];

  const result: Record<string, string> = {};
  for (const f of fields) {
    if (f.autoFill === "agentName") {
      result[f.id] = agentName;
    } else if (f.autoFill === "closingDateCalc") {
      result[f.id] = closeDateStr;
    } else if (f.autoFill) {
      const raw = tx[f.autoFill as keyof Transaction];
      result[f.id] = raw != null ? String(raw) : "";
    } else {
      result[f.id] = "";
    }
  }
  return result;
}

/** Render a document preview as an HTML string */
function renderDocPreview(
  template: TxDocTemplate,
  values: Record<string, string>,
): string {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fieldRows = template.fields
    .filter((f) => f.id !== "additionalTerms" && f.id !== "counterTerms" && f.id !== "notes" && f.id !== "reason")
    .map(
      (f) =>
        `<tr>
          <td style="padding:6px 12px 6px 0;font-size:13px;color:#666;white-space:nowrap;vertical-align:top;">${f.label}</td>
          <td style="padding:6px 0;font-size:13px;color:#1a1a1a;font-weight:500;">${
            f.type === "number" && values[f.id]
              ? Number(values[f.id]).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
              : values[f.id] || "<span style='color:#aaa;font-style:italic'>—</span>"
          }</td>
        </tr>`,
    )
    .join("");

  const narrativeFields = template.fields.filter(
    (f) => f.id === "additionalTerms" || f.id === "counterTerms" || f.id === "notes" || f.id === "reason",
  );

  const narrativeHtml = narrativeFields
    .map(
      (f) =>
        values[f.id]
          ? `<div style="margin-top:16px;">
              <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:6px;">${f.label}</div>
              <div style="font-size:13px;color:#1a1a1a;line-height:1.6;white-space:pre-wrap;">${values[f.id]}</div>
            </div>`
          : "",
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${template.name} — ${MATIN_BRAND.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #1a1a1a; padding: 48px; max-width: 760px; margin: 0 auto; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: flex-end;">
    <div>
      <div style="font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">${MATIN_BRAND.name}</div>
      <div style="font-size: 12px; color: #666; margin-top: 4px;">${MATIN_BRAND.address}</div>
      <div style="font-size: 12px; color: #666;">${MATIN_BRAND.phone}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #888;">Date</div>
      <div style="font-size: 13px; font-weight: 500;">${today}</div>
    </div>
  </div>

  <!-- Document title -->
  <h1 style="font-size: 18px; font-weight: 700; letter-spacing: -0.01em; margin-bottom: 6px;">${template.name}</h1>
  <p style="font-size: 13px; color: #666; margin-bottom: 24px;">${template.description}</p>

  <!-- Fields table -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
    ${fieldRows}
  </table>

  ${narrativeHtml}

  <!-- Signature block -->
  <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e5e5; display: flex; gap: 48px;">
    <div style="flex: 1;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 32px;">Client Signature</div>
      <div style="border-bottom: 1px solid #1a1a1a; padding-bottom: 2px; margin-bottom: 6px;"></div>
      <div style="font-size: 11px; color: #888;">Signature &amp; Date</div>
    </div>
    <div style="flex: 1;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 32px;">Agent Signature</div>
      <div style="border-bottom: 1px solid #1a1a1a; padding-bottom: 2px; margin-bottom: 6px;"></div>
      <div style="font-size: 11px; color: #888;">Signature &amp; Date</div>
    </div>
  </div>
</body>
</html>`;
}

const DOC_ICONS: Record<TxDocTemplate["icon"], typeof FileText> = {
  FileText:      FileText,
  RefreshCw:     RefreshCw,
  ClipboardCheck: ClipboardCheck,
  X:             X,
};

export function TransactionsView({ transactions }: { transactions: Transaction[] }) {
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [active, setActive] = useState<Transaction | null>(null);
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const m = new Map<StatusFilter, number>();
    for (const f of FILTERS) m.set(f, transactions.filter((t) => matchesFilter(t, f)).length);
    return m;
  }, [transactions]);

  const visible = useMemo(
    () =>
      transactions
        .filter((t) => matchesFilter(t, filter))
        .filter((t) => {
          if (!search.trim()) return true;
          const q = search.toLowerCase();
          return t.address.toLowerCase().includes(q) || t.client.toLowerCase().includes(q);
        })
        // Soonest-to-close first; closed deals sink to the bottom.
        .sort((a, b) => {
          if (isClosed(a) !== isClosed(b)) return isClosed(a) ? 1 : -1;
          return a.closeDateDaysOut - b.closeDateDaysOut;
        }),
    [transactions, filter, search],
  );

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-ink/[0.08] bg-white backdrop-blur-md">
        {/* Filter bar */}
        <div className="flex flex-nowrap overflow-x-auto items-center gap-2 border-b border-ink/[0.08] px-4 py-3.5 pb-3.5 md:px-5">
          {/* Search input */}
          <div className="relative mr-1 shrink-0">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search address or client..."
              className="h-8 w-48 rounded-lg border border-ink/[0.08] bg-[#f4f4f3] pl-8 pr-3 text-[0.78rem] text-ink placeholder:text-slate/40 focus:border-ink/30 focus:outline-none focus:ring-1 focus:ring-ink/20"
            />
          </div>

          {FILTERS.map((f) => {
            const on = filter === f;
            const isRisk = f === "At-risk";
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.78rem] font-medium transition-colors",
                  on
                    ? FILTER_ACTIVE_TONE[f]
                    : "border-ink/[0.08] bg-white text-slate hover:border-ink/15 hover:bg-white hover:text-ink",
                )}
              >
                {isRisk && (
                  <AlertTriangle
                    className={cn("h-3 w-3", on ? "text-danger" : "text-danger/60")}
                  />
                )}
                {f}
                <span
                  className={cn(
                    "rounded px-1 text-[0.66rem] tabular-nums",
                    on ? "bg-black/[0.06] text-current" : "bg-white text-slate/70",
                  )}
                >
                  {counts.get(f) ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Column header (md+) */}
        <div className="hidden border-b border-ink/[0.08] px-5 py-2.5 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-slate/50 md:grid md:grid-cols-[minmax(0,1fr)_8.5rem_7rem_10rem_6.5rem_1.25rem] md:items-center md:gap-4">
          <span>Property / Client</span>
          <span>Price</span>
          <span>Agent</span>
          <span>Progress</span>
          <span className="text-right">Closes</span>
          <span />
        </div>

        {/* Rows */}
        <div className="divide-y divide-ink/[0.06]">
          {visible.map((t) => (
            <TransactionRow key={t.id} t={t} onOpen={() => setActive(t)} />
          ))}
          {visible.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <ClipboardList className="h-6 w-6 text-slate/40" />
              <p className="text-[0.86rem] text-slate">
                {search.trim()
                  ? `No results for "${search}".`
                  : `No ${filter.toLowerCase()} transactions.`}
              </p>
              <button
                onClick={() => { setFilter("All"); setSearch(""); }}
                className="text-[0.78rem] font-semibold text-ink hover:underline"
              >
                Show all
              </button>
            </div>
          )}
        </div>
      </div>

      <TransactionDetail tx={active} onClose={() => setActive(null)} />
    </>
  );
}

function TransactionRow({ t, onOpen }: { t: Transaction; onOpen: () => void }) {
  const agent = getAgent(t.agentSlug);
  const pct = progressOf(t);
  const type = shortType(t.type);
  const TypeIcon = type.icon;
  const closed = isClosed(t);
  const overdue = !closed && t.closeDateDaysOut < 0;
  const soon = !closed && t.closeDateDaysOut >= 0 && t.closeDateDaysOut <= 7;

  return (
    <button
      onClick={onOpen}
      className={cn(
        "group block w-full px-4 py-3.5 text-left transition-colors hover:bg-white md:grid md:grid-cols-[minmax(0,1fr)_8.5rem_7rem_10rem_6.5rem_1.25rem] md:items-center md:gap-4 md:px-5",
        urgencyBorderClass(t.closeDateDaysOut, closed),
      )}
    >
      {/* Property / client */}
      <div className="flex items-start gap-3 md:items-center">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-ink ring-1 ring-inset ring-ink/[0.06] md:mt-0">
          <TypeIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-[0.88rem] font-semibold leading-snug text-ink">
              {t.address}
            </p>
            {t.riskFlag && (
              <Pill tone="danger">
                <AlertTriangle className="h-2.5 w-2.5" /> At risk
              </Pill>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="truncate text-[0.74rem] text-slate/70">{t.client} · {type.label}</span>
            {/* Stage badge */}
            <span className={cn("inline-flex items-center rounded-full px-2 py-px text-[0.66rem] font-semibold ring-1 ring-inset", stageBadgeTone(t.stage))}>
              {t.stage}
            </span>
            {/* Days to close chip */}
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-px text-[0.66rem] font-semibold", daysToCloseChipClass(t.closeDateDaysOut, closed))}>
              <Clock className="h-2.5 w-2.5" />
              {daysToCloseLabel(t.closeDateDaysOut, closed)}
            </span>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="mt-2 md:mt-0">
        <span className="font-display text-[0.98rem] text-ink tabular-nums">{usd(t.price)}</span>
        <span className="ml-2 text-[0.7rem] text-slate/50 md:hidden">{daysLabel(t.closeDateDaysOut)}</span>
      </div>

      {/* Agent */}
      <div className="mt-2 flex items-center gap-2 md:mt-0">
        {agent ? (
          <>
            <span className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-paper text-[0.6rem] font-semibold text-ink ring-1 ring-inset ring-ink/[0.06]">
              {agent.photo ? (
                <Image src={agent.photo} alt={agent.name} fill sizes="24px" className="object-cover" />
              ) : (
                initials(agent.name)
              )}
            </span>
            <span className="truncate text-[0.76rem] text-slate/80">{agent.firstName}</span>
          </>
        ) : (
          <span className="text-[0.76rem] text-slate/40">—</span>
        )}
      </div>

      {/* Progress */}
      <div className="mt-2.5 flex items-center gap-2 md:mt-0">
        <ProgressBar value={pct} tone={progressTone(t)} className="flex-1" />
        <span className="shrink-0 text-[0.68rem] text-slate/60 tabular-nums">{pct}%</span>
      </div>

      {/* Closes */}
      <div className="mt-2 hidden text-right md:mt-0 md:block">
        <span
          className={cn(
            "inline-flex items-center justify-end gap-1 text-[0.76rem] tabular-nums",
            overdue ? "text-danger" : soon ? "text-warn" : "text-slate/75",
          )}
        >
          <CalendarClock className="h-3 w-3" />
          {daysLabel(t.closeDateDaysOut)}
        </span>
        {!closed && t.closeDateDaysOut < 0 && (
          <div className="mt-1 flex justify-end">
            <Pill tone="danger">{Math.abs(t.closeDateDaysOut)}d overdue</Pill>
          </div>
        )}
        {!closed && t.closeDateDaysOut >= 0 && t.closeDateDaysOut <= 3 && (
          <div className="mt-1 flex justify-end">
            <Pill tone="warn">closing soon</Pill>
          </div>
        )}
      </div>

      {/* Chevron */}
      <div className="hidden justify-end text-slate/30 transition-colors group-hover:text-ink md:flex">
        <ArrowRight className="h-4 w-4" />
      </div>
    </button>
  );
}

/* ── Detail slide-over ─────────────────────────────────────────────────── */

type DetailTab = "checklist" | "documents" | "ai-extract";

function TransactionDetail({ tx, onClose }: { tx: Transaction | null; onClose: () => void }) {
  const open = !!tx;
  const agent = tx ? getAgent(tx.agentSlug) : undefined;
  const type = tx ? shortType(tx.type) : null;
  const statusDocs = tx ? buildStatusDocuments(tx) : [];
  const closed = tx ? isClosed(tx) : false;

  // Tab state
  const [activeTab, setActiveTab] = useState<DetailTab>("checklist");

  // Mutable local checklist state — resets when tx changes.
  const [localChecklist, setLocalChecklist] = useState<{ label: string; done: boolean }[]>([]);
  useEffect(() => {
    if (tx) setLocalChecklist(tx.checklist);
  }, [tx]);

  // Derived checklist stats from local mutable state.
  const doneCount = localChecklist.filter((c) => c.done).length;
  const total = localChecklist.length;
  const pct = tx ? progressOf(tx, localChecklist) : 0;
  const nextItem = localChecklist.find((c) => !c.done) ?? null;

  // Simulated due dates for checklist items (since Transaction type has no dueDate).
  const dueDates: Date[] = tx ? simulatedDueDates(tx) : [];

  // Compute overdue items: incomplete items where simulated date has passed.
  const overdueItems = tx
    ? localChecklist
        .map((c, i) => ({ ...c, overdueBy: !c.done ? daysOverdue(dueDates[i] ?? new Date()) : 0 }))
        .filter((c) => !c.done && c.overdueBy > 0)
    : [];

  // Contract extractor state
  const [extractOpen, setExtractOpen] = useState(false);
  const [contractText, setContractText] = useState("");
  const [extractOutput, setExtractOutput] = useState("");
  const [extractLoading, setExtractLoading] = useState(false);
  const [applyDone, setApplyDone] = useState(false);

  // Doc action inline feedback (status docs)
  const [docFeedback, setDocFeedback] = useState<Record<string, string>>({});

  // Doc generation state
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docFieldValues, setDocFieldValues] = useState<Record<string, string>>({});
  // Blob URL for the iframe preview — avoids srcDoc / document.write XSS vectors.
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docAiWriting, setDocAiWriting] = useState(false);
  const [docAiText, setDocAiText] = useState("");
  const [selectedAgentSlug, setSelectedAgentSlug] = useState("jordan-matin");
  const [docCopied, setDocCopied] = useState(false);

  const docFormRef = useRef<HTMLDivElement>(null);
  const extractorRef = useRef<HTMLDivElement>(null);

  // Reset all state when tx changes.
  useEffect(() => {
    setExtractOpen(false);
    setContractText("");
    setExtractOutput("");
    setExtractLoading(false);
    setApplyDone(false);
    setDocFeedback({});
    setSelectedDocId(null);
    setDocFieldValues({});
    if (docPreviewUrl) URL.revokeObjectURL(docPreviewUrl);
    setDocPreviewUrl(null);
    setDocAiWriting(false);
    setDocAiText("");
    setActiveTab("checklist");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx]);

  // When a doc is selected, auto-fill its fields from the transaction.
  useEffect(() => {
    if (!tx || !selectedDocId) return;
    const template = TX_DOCS.find((d) => d.id === selectedDocId);
    if (!template) return;
    const ag = getAgent(selectedAgentSlug) ?? agents.find((a) => a.slug === selectedAgentSlug);
    const agentName = ag?.name ?? "Jordan Matin";
    setDocFieldValues(autoFillValues(tx, template.fields, agentName));
    setDocPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setDocAiText("");
    setDocCopied(false);
    // Scroll form into view
    setTimeout(() => {
      docFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, [selectedDocId, tx, selectedAgentSlug]);

  async function handleExtract() {
    if (!contractText.trim()) return;
    setExtractLoading(true);
    setExtractOutput("");
    await streamAi(
      { tool: "contract-extractor", input: { contractText } },
      (_chunk: string, full: string) => setExtractOutput(full),
    );
    setExtractLoading(false);
  }

  function handleApplyToChecklist() {
    const newItems = parseDeadlines(extractOutput);
    if (newItems.length === 0) return;
    setLocalChecklist((prev) => [
      ...prev,
      ...newItems.map((label) => ({ label, done: false })),
    ]);
    setApplyDone(true);
  }

  function handleDocStatusAction(doc: TxDoc, action: "view" | "send" | "remind" | "upload") {
    const feedback =
      action === "upload"
        ? "Upload started"
        : action === "remind"
          ? "Reminder sent"
          : action === "view"
            ? "Opening..."
            : "Sent";
    setDocFeedback((prev) => ({ ...prev, [doc.name]: feedback }));
    setTimeout(
      () =>
        setDocFeedback((prev) => {
          const n = { ...prev };
          delete n[doc.name];
          return n;
        }),
      3000,
    );
  }

  function handleSelectDoc(docId: string) {
    setSelectedDocId((prev) => (prev === docId ? null : docId));
    setDocPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setDocAiText("");
  }

  function handleFieldChange(fieldId: string, value: string) {
    setDocFieldValues((prev) => ({ ...prev, [fieldId]: value }));
    setDocPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
  }

  function handlePreviewDoc() {
    const template = TX_DOCS.find((d) => d.id === selectedDocId);
    if (!template) return;
    const html = renderDocPreview(template, docFieldValues);
    const blob = new Blob([html], { type: "text/html" });
    setDocPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
  }

  async function handleAiWriteBody() {
    const template = TX_DOCS.find((d) => d.id === selectedDocId);
    if (!template || !tx) return;
    setDocAiWriting(true);
    setDocAiText("");
    const prompt = `Write a professional, concise body paragraph for a real estate ${template.name} document. Property: ${docFieldValues.propertyAddress ?? tx.address}. Price: $${docFieldValues.offerPrice ?? docFieldValues.counterPrice ?? tx.price}. Buyer: ${docFieldValues.buyerName ?? tx.client}. Agent: ${docFieldValues.agentName ?? "Jordan Matin"}, ${MATIN_BRAND.name}. Keep it formal, 2-3 sentences.`;
    await streamAi(
      { tool: "general", messages: [{ role: "user", content: prompt }] },
      (_chunk: string, full: string) => setDocAiText(full),
    );
    setDocAiWriting(false);
  }

  function handleCopyDoc() {
    const template = TX_DOCS.find((d) => d.id === selectedDocId);
    if (!template) return;
    // Copy plain-text version
    const lines = template.fields
      .map((f) => `${f.label}: ${docFieldValues[f.id] || "—"}`)
      .join("\n");
    const text = `${template.name}\n${MATIN_BRAND.name} | ${MATIN_BRAND.phone}\n\n${lines}${docAiText ? `\n\n${docAiText}` : ""}`;
    navigator.clipboard.writeText(text).then(() => {
      setDocCopied(true);
      setTimeout(() => setDocCopied(false), 2500);
    });
  }

  function handlePrintDoc() {
    // Build HTML from current fields (or re-use existing preview).
    const template = TX_DOCS.find((d) => d.id === selectedDocId);
    if (!template) return;
    const html = renderDocPreview(template, docFieldValues);
    // Use a Blob URL + hidden iframe to avoid document.write / window.open XSS risks.
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;width:0;height:0;border:0;opacity:0;";
    iframe.src = url;
    iframe.onload = () => {
      try {
        iframe.contentWindow?.print();
      } finally {
        // Clean up after the print dialog closes (best-effort; some browsers fire onafterprint).
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 1000);
      }
    };
    document.body.appendChild(iframe);
  }

  // Reset extractor state when a different transaction is opened.
  function handleClose() {
    onClose();
  }

  const salesAgentsList = agents.filter((a) => !a.support);

  const TABS: { id: DetailTab; label: string }[] = [
    { id: "checklist", label: "Checklist" },
    { id: "documents", label: "Documents" },
    { id: "ai-extract", label: "AI Extract" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/55 backdrop-blur-md transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={handleClose}
        aria-hidden
      />

      {/* Slide-over */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-ink/[0.08] bg-white shadow-[0_0_80px_rgba(0,0,0,.6)] transition-transform duration-300 ease-out sm:max-w-[520px]",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
      >
        {tx && type && (
          <>
            {/* Header */}
            <div className="relative shrink-0 border-b border-ink/[0.08] bg-gradient-to-br from-paper to-white px-5 py-5">
              <button
                onClick={handleClose}
                aria-label="Close"
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg text-slate transition-colors hover:bg-ink/[0.06] hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-ink/70">{type.label}</span>
                {/* Stage badge */}
                <span className={cn("inline-flex items-center rounded-full px-2 py-px text-[0.66rem] font-semibold ring-1 ring-inset", stageBadgeTone(tx.stage))}>
                  {tx.stage}
                </span>
                {/* Days to close chip */}
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-px text-[0.66rem] font-semibold", daysToCloseChipClass(tx.closeDateDaysOut, closed))}>
                  <Clock className="h-2.5 w-2.5" />
                  {daysToCloseLabel(tx.closeDateDaysOut, closed)}
                </span>
                <span className="text-[0.7rem] text-slate/50">{tx.id}</span>
              </div>
              <h2 className="mt-1 pr-12 font-display text-2xl text-ink">{tx.address}</h2>

              {/* Risk banner */}
              {tx.riskFlag && (
                <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/[0.1] px-3.5 py-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                  <div className="min-w-0">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-danger">
                      At risk
                    </p>
                    <p className="mt-0.5 text-[0.82rem] text-ink">{tx.riskFlag}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Key facts */}
            <div className="shrink-0 border-b border-ink/[0.08] px-5 py-4">
              <div className="grid grid-cols-2 gap-2.5">
                <Fact icon={<User className="h-3.5 w-3.5" />} label="Client" value={tx.client} />
                <Fact
                  icon={<CalendarClock className="h-3.5 w-3.5" />}
                  label="Close date"
                  value={daysLabel(tx.closeDateDaysOut)}
                  tone={
                    !closed && tx.closeDateDaysOut < 0
                      ? "danger"
                      : !closed && tx.closeDateDaysOut <= 7
                        ? "warn"
                        : undefined
                  }
                />
                <Fact icon={<DollarSign className="h-3.5 w-3.5" />} label="Price" value={usd(tx.price)} />
                <Fact
                  icon={<DollarSign className="h-3.5 w-3.5" />}
                  label="Commission"
                  value={usd(tx.commission)}
                  tone="success"
                />
              </div>

              {/* Lead agent */}
              {agent && (
                <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-ink/[0.08] bg-white px-3.5 py-2.5">
                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-paper text-[0.7rem] font-semibold text-ink ring-1 ring-inset ring-ink/[0.06]">
                    {agent.photo ? (
                      <Image src={agent.photo} alt={agent.name} fill sizes="32px" className="object-cover" />
                    ) : (
                      initials(agent.name)
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.68rem] uppercase tracking-wider text-slate/55">Lead agent</p>
                    <p className="truncate text-[0.84rem] font-semibold text-ink">{agent.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="shrink-0 flex items-center gap-0.5 border-b border-ink/[0.08] px-5">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative px-3 py-3 text-[0.8rem] font-medium transition-colors",
                    activeTab === tab.id
                      ? "text-ink after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-ink after:rounded-t-full"
                      : "text-slate/60 hover:text-ink",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">

              {/* ── CHECKLIST TAB ─────────────────────────────────────────── */}
              {activeTab === "checklist" && (
                <div className="space-y-4 px-5 py-5">
                  {/* Overdue items alert */}
                  {overdueItems.length > 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600" />
                        <span className="text-[0.82rem] font-semibold text-red-700">
                          {overdueItems.length} overdue {overdueItems.length === 1 ? "item" : "items"} —{" "}
                          {overdueItems.map((c) => c.label).join(", ")}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Smart checklist */}
                  <div>
                    <div className="mb-2.5 flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-ink">
                        <ClipboardList className="h-4 w-4 text-ink" /> Smart checklist
                      </span>
                      <span className="text-[0.74rem] text-slate/70 tabular-nums">
                        {doneCount}/{total} complete
                      </span>
                    </div>
                    <ProgressBar value={pct} tone={progressTone(tx)} className="mb-3 h-2" />

                    {/* Next outstanding item */}
                    {nextItem && (
                      <div className="mb-2.5 flex items-center gap-2.5 rounded-lg border border-ink/15 bg-paper px-3 py-2">
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink" />
                        <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-ink/70">
                          Next:
                        </span>
                        <span className="truncate text-[0.82rem] font-medium text-ink">{nextItem.label}</span>
                      </div>
                    )}

                    <ul className="space-y-1">
                      {localChecklist.map((c, i) => {
                        const isNext = !c.done && nextItem != null && c.label === nextItem.label;
                        const overdueByDays = !c.done ? daysOverdue(dueDates[i] ?? new Date()) : 0;
                        return (
                          <li key={i}>
                            <button
                              onClick={() => {
                                setLocalChecklist((prev) =>
                                  prev.map((item, idx) =>
                                    idx === i ? { ...item, done: !item.done } : item,
                                  ),
                                );
                              }}
                              className={cn(
                                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[0.82rem] text-left transition-colors",
                                c.done
                                  ? "bg-success/[0.04]"
                                  : isNext
                                    ? "bg-white ring-1 ring-inset ring-azure/20"
                                    : "bg-white/[0.02]",
                              )}
                            >
                              {c.done ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-success transition-colors" />
                              ) : (
                                <Circle className={cn("h-4 w-4 shrink-0 transition-colors", isNext ? "text-azure/50" : "text-slate/40")} />
                              )}
                              <span
                                className={cn(
                                  "flex-1 transition-colors",
                                  c.done
                                    ? "text-success/70 line-through decoration-success/30"
                                    : isNext
                                      ? "font-medium text-ink"
                                      : "text-slate",
                                )}
                              >
                                {c.label}
                              </span>
                              {overdueByDays > 0 && (
                                <span className="ml-auto shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[0.65rem] font-semibold text-red-700">
                                  {overdueByDays}d overdue
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}

              {/* ── DOCUMENTS TAB ─────────────────────────────────────────── */}
              {activeTab === "documents" && (
                <div className="space-y-5 px-5 py-5">
                  {/* Agent selector */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[0.82rem] font-semibold text-ink">Generate Documents</span>
                    <div className="relative">
                      <select
                        value={selectedAgentSlug}
                        onChange={(e) => setSelectedAgentSlug(e.target.value)}
                        className="appearance-none rounded-lg border border-ink/[0.12] bg-white py-1.5 pl-3 pr-7 text-[0.76rem] text-ink focus:border-ink/30 focus:outline-none focus:ring-1 focus:ring-ink/20"
                      >
                        {salesAgentsList.map((a) => (
                          <option key={a.slug} value={a.slug}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate/50" />
                    </div>
                  </div>

                  {/* Doc cards grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {TX_DOCS.map((doc) => {
                      const Icon = DOC_ICONS[doc.icon];
                      const isSelected = selectedDocId === doc.id;
                      return (
                        <button
                          key={doc.id}
                          onClick={() => handleSelectDoc(doc.id)}
                          className={cn(
                            "flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all",
                            isSelected
                              ? "border-ink/25 bg-ink/[0.04] ring-1 ring-inset ring-ink/10"
                              : "border-ink/[0.08] bg-white hover:border-ink/20 hover:bg-[#f9f9f8]",
                          )}
                        >
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg",
                            isSelected ? "bg-ink text-white" : "bg-[#f4f4f3] text-ink/70",
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[0.82rem] font-semibold text-ink leading-snug">{doc.name}</p>
                            <p className="mt-0.5 text-[0.7rem] text-slate/60 leading-snug">{doc.description}</p>
                          </div>
                          <div className={cn(
                            "mt-auto inline-flex items-center gap-1 text-[0.72rem] font-semibold transition-colors",
                            isSelected ? "text-ink" : "text-azure",
                          )}>
                            {isSelected ? "Close" : "Generate"}
                            <ChevronRight className="h-3 w-3" />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Inline form for selected doc */}
                  {selectedDocId && (() => {
                    const template = TX_DOCS.find((d) => d.id === selectedDocId);
                    if (!template) return null;
                    return (
                      <div ref={docFormRef} className="rounded-xl border border-ink/[0.10] bg-[#f9f9f8]">
                        <div className="flex items-center justify-between border-b border-ink/[0.08] px-4 py-3">
                          <span className="text-[0.84rem] font-semibold text-ink">{template.name}</span>
                          <button
                            onClick={() => { setSelectedDocId(null); setDocPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; }); }}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate/50 hover:bg-ink/[0.06] hover:text-ink transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="space-y-3 px-4 py-4">
                          {template.fields.map((field) => (
                            <div key={field.id}>
                              <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wider text-slate/60">
                                {field.label}
                              </label>
                              {field.type === "textarea" ? (
                                <textarea
                                  value={docFieldValues[field.id] ?? ""}
                                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                  placeholder={field.placeholder}
                                  rows={3}
                                  className="w-full rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.82rem] text-ink resize-none focus:border-ink/30 focus:outline-none focus:ring-1 focus:ring-ink/20"
                                />
                              ) : (
                                <input
                                  type={field.type}
                                  value={docFieldValues[field.id] ?? ""}
                                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                  placeholder={field.placeholder}
                                  className="w-full rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.82rem] text-ink focus:border-ink/30 focus:outline-none focus:ring-1 focus:ring-ink/20"
                                />
                              )}
                            </div>
                          ))}

                          {/* Action buttons */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              onClick={handlePreviewDoc}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[0.8rem] font-medium text-white transition-opacity hover:opacity-90"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Preview
                            </button>
                            <button
                              onClick={handleAiWriteBody}
                              disabled={docAiWriting}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.12] px-3.5 py-2 text-[0.8rem] font-medium text-ink transition-colors hover:bg-ink/[0.04] disabled:opacity-50"
                            >
                              {docAiWriting ? (
                                <>
                                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
                                  Writing...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-3.5 w-3.5" />
                                  AI Write Body
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleCopyDoc}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.12] px-3.5 py-2 text-[0.8rem] font-medium text-ink transition-colors hover:bg-ink/[0.04]"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              {docCopied ? "Copied!" : "Copy"}
                            </button>
                            <button
                              onClick={handlePrintDoc}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.12] px-3.5 py-2 text-[0.8rem] font-medium text-ink transition-colors hover:bg-ink/[0.04]"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              Print
                            </button>
                          </div>

                          {/* AI body output */}
                          {(docAiText || docAiWriting) && (
                            <div className="rounded-lg border border-azure/20 bg-azure/[0.04] p-3">
                              <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-azure/70">AI Generated Body</p>
                              {docAiWriting && !docAiText && (
                                <p className="animate-pulse text-[0.82rem] text-slate">Writing...</p>
                              )}
                              {docAiText && (
                                <p className="text-[0.82rem] text-ink leading-relaxed">{docAiText}</p>
                              )}
                            </div>
                          )}

                          {/* Preview frame */}
                          {docPreviewUrl && (
                            <div className="overflow-hidden rounded-xl border border-ink/[0.08]">
                              <div className="flex items-center justify-between border-b border-ink/[0.08] bg-white px-3 py-2">
                                <span className="text-[0.72rem] font-semibold text-slate/60 uppercase tracking-wider">Document Preview</span>
                                <button
                                  onClick={handlePrintDoc}
                                  className="inline-flex items-center gap-1 text-[0.72rem] text-azure hover:underline"
                                >
                                  <Printer className="h-3 w-3" /> Print
                                </button>
                              </div>
                              <iframe
                                src={docPreviewUrl ?? undefined}
                                className="h-[520px] w-full bg-white"
                                title={`${template.name} Preview`}
                                sandbox="allow-same-origin"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Status documents (existing doc tracker) */}
                  <div>
                    <div className="mb-2.5 flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-ink">
                        <FileText className="h-4 w-4 text-ink" /> Transaction Files
                      </span>
                      <span className="text-[0.74rem] text-slate/70 tabular-nums">
                        {statusDocs.filter((d) => d.status === "signed" || d.status === "received").length}/
                        {statusDocs.length} in
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {statusDocs.map((d) => (
                        <DocRow
                          key={d.name}
                          doc={d}
                          feedback={docFeedback[d.name]}
                          onAction={handleDocStatusAction}
                        />
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* ── AI EXTRACT TAB ────────────────────────────────────────── */}
              {activeTab === "ai-extract" && (
                <div className="space-y-4 px-5 py-5">
                  <div className="rounded-xl border border-ink/[0.08] bg-white">
                    {/* Section header — always visible */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-[0.86rem] font-semibold text-ink">
                        <Sparkles className="h-4 w-4 text-ink" />
                        Extract Contract Deadlines
                      </span>
                      <button
                        onClick={() => setExtractOpen((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.12] px-3 py-1.5 text-[0.78rem] font-medium text-ink transition-colors hover:bg-ink/[0.04]"
                        aria-label={extractOpen ? "Collapse contract extractor" : "Expand contract extractor"}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Extract
                        {extractOpen ? (
                          <ChevronUp className="h-3.5 w-3.5 text-slate/60" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-slate/60" />
                        )}
                      </button>
                    </div>

                    {extractOpen && (
                      <div className="border-t border-ink/[0.08] px-4 pb-4 pt-3 space-y-3">
                        <p className="text-[0.82rem] text-slate">
                          Paste your purchase agreement text below. The AI will extract all key deadlines, contingency dates, and parties.
                        </p>
                        <textarea
                          value={contractText}
                          onChange={(e) => setContractText(e.target.value)}
                          placeholder="Paste your purchase agreement text here..."
                          rows={6}
                          className="w-full rounded-xl border border-ink/[0.08] bg-[#f4f4f3] p-3 text-[0.82rem] text-ink resize-none focus:border-ink/40 focus:outline-none focus:ring-1 focus:ring-ink/20"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleExtract}
                            disabled={extractLoading || !contractText.trim()}
                            className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-[0.85rem] font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {extractLoading ? (
                              <>
                                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                Extracting deadlines...
                              </>
                            ) : (
                              <>
                                <FileText className="h-3.5 w-3.5" />
                                Extract Deadlines
                              </>
                            )}
                          </button>
                          {contractText.trim() && !extractLoading && (
                            <button
                              onClick={() => { setContractText(""); setExtractOutput(""); }}
                              className="rounded-xl border border-ink/[0.08] px-3 py-2 text-[0.82rem] text-slate transition-colors hover:bg-ink/[0.04] hover:text-ink"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {/* Streaming output */}
                        {(extractOutput || extractLoading) && (
                          <div className="rounded-xl border border-ink/[0.08] bg-[#f4f4f3] p-3">
                            {extractLoading && !extractOutput && (
                              <p className="animate-pulse text-[0.82rem] text-slate">Extracting deadlines...</p>
                            )}
                            {extractOutput && (
                              <div className="max-h-72 overflow-y-auto">
                                <AiMarkdown text={extractOutput} />
                              </div>
                            )}
                            {extractOutput && !extractLoading && (
                              <div className="mt-3 border-t border-ink/[0.08] pt-3">
                                <button
                                  onClick={handleApplyToChecklist}
                                  disabled={applyDone}
                                  className={cn(
                                    "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[0.82rem] font-medium transition-colors",
                                    applyDone
                                      ? "cursor-default border border-success/30 bg-success/10 text-success"
                                      : "border border-ink/[0.12] text-ink hover:bg-ink/[0.04]",
                                  )}
                                >
                                  {applyDone ? (
                                    <>
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      Deadlines added to checklist
                                    </>
                                  ) : (
                                    <>
                                      <ArrowRight className="h-3.5 w-3.5" />
                                      Apply to transaction checklist
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tip */}
                  {!extractOpen && (
                    <div className="rounded-xl border border-azure/20 bg-azure/[0.04] px-4 py-3">
                      <p className="text-[0.82rem] text-ink/80">
                        Click <span className="font-semibold">Extract</span> to paste a purchase agreement and let AI pull out all key deadlines and dates — then apply them directly to this transaction&apos;s checklist.
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Fact({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "success" | "danger" | "warn";
}) {
  const valueColor =
    tone === "success"
      ? "text-success"
      : tone === "danger"
        ? "text-danger"
        : tone === "warn"
          ? "text-warn"
          : "text-ink";
  return (
    <div className="rounded-lg border border-ink/[0.06] bg-white px-3 py-2">
      <div className="flex items-center gap-1.5 text-slate/55">
        {icon}
        <span className="text-[0.64rem] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn("mt-0.5 truncate text-[0.84rem] font-medium tabular-nums", valueColor)}>
        {value}
      </p>
    </div>
  );
}

/* ── Status Documents (deterministic — synthesized from checklist + stage) ── */

type DocStatus = "signed" | "received" | "out" | "pending";
type TxDoc = { name: string; status: DocStatus };

const DOC_STATUS_META: Record<
  DocStatus,
  { label: string; tone: "success" | "warn" | "neutral"; icon: typeof FileText }
> = {
  signed: { label: "Signed", tone: "success", icon: FileCheck2 },
  received: { label: "Received", tone: "success", icon: FileCheck2 },
  out: { label: "Out for signature", tone: "warn", icon: FileClock },
  pending: { label: "Not started", tone: "neutral", icon: FileText },
};

/**
 * Build a realistic, deterministic document list for a transaction. Each doc is
 * tied to a checklist item (or stage milestone): the doc is "in" when its
 * milestone is done, "out for signature" when it's the very next step, and
 * "not started" otherwise. No Math.random — the same deal always renders the
 * same docs in the same states.
 */
function buildStatusDocuments(t: Transaction): TxDoc[] {
  const sale = shortType(t.type).label === "Sale";
  const done = (label: string) =>
    t.checklist.some((c) => c.label.toLowerCase().includes(label) && c.done);
  const nextLabel = t.checklist.find((c) => !c.done)?.label.toLowerCase() ?? "";
  const isNext = (label: string) => nextLabel.includes(label);

  const fromMilestone = (label: string, received: DocStatus = "signed"): DocStatus => {
    if (done(label)) return received;
    if (isNext(label)) return "out";
    return "pending";
  };

  const docs: TxDoc[] = [];

  docs.push({
    name: sale ? "Listing Agreement" : "Buyer Representation Agreement",
    status: fromMilestone("listing agreement"),
  });

  docs.push({
    name: "Agency Disclosure",
    status: done("listing agreement") ? "signed" : isNext("listing agreement") ? "out" : "pending",
  });

  docs.push({ name: "Purchase & Sale Agreement", status: fromMilestone("offer accepted") });
  docs.push({ name: "Earnest Money Receipt", status: fromMilestone("earnest money", "received") });

  if (sale) {
    docs.push({
      name: "Seller's Property Disclosure",
      status: done("offer accepted") ? "signed" : isNext("offer accepted") ? "out" : "pending",
    });
  }

  docs.push({ name: "Inspection Report", status: fromMilestone("inspection", "received") });
  docs.push({ name: "Repair Addendum", status: fromMilestone("repairs", "signed") });
  docs.push({ name: "Appraisal Report", status: fromMilestone("appraisal", "received") });
  docs.push({ name: "Loan Commitment Letter", status: fromMilestone("loan approved", "received") });
  docs.push({
    name: "Closing Disclosure",
    status: fromMilestone("closing disbursed", "received"),
  });

  return docs;
}

function DocRow({
  doc,
  feedback,
  onAction,
}: {
  doc: TxDoc;
  feedback?: string;
  onAction?: (doc: TxDoc, action: "view" | "send" | "remind" | "upload") => void;
}) {
  const meta = DOC_STATUS_META[doc.status];
  const Icon = meta.icon;
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-ink/[0.06] bg-white/[0.02] px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            meta.tone === "success" ? "text-success" : meta.tone === "warn" ? "text-warn" : "text-slate/45",
          )}
        />
        <span className="truncate text-[0.82rem] text-ink">{doc.name}</span>
        {feedback && (
          <span className="ml-1 shrink-0 text-[0.7rem] font-medium text-success">{feedback}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Pill tone={meta.tone}>{meta.label}</Pill>
        {doc.status === "pending" && onAction && (
          <button
            onClick={() => onAction(doc, "upload")}
            title="Upload document"
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate/50 transition-colors hover:bg-ink/[0.06] hover:text-ink"
          >
            <Upload className="h-3 w-3" />
          </button>
        )}
        {doc.status === "out" && onAction && (
          <>
            <button
              onClick={() => onAction(doc, "remind")}
              title="Send reminder"
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate/50 transition-colors hover:bg-ink/[0.06] hover:text-ink"
            >
              <Bell className="h-3 w-3" />
            </button>
            <button
              onClick={() => onAction(doc, "view")}
              title="View document"
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate/50 transition-colors hover:bg-ink/[0.06] hover:text-ink"
            >
              <Eye className="h-3 w-3" />
            </button>
          </>
        )}
        {(doc.status === "signed" || doc.status === "received") && onAction && (
          <button
            onClick={() => onAction(doc, "view")}
            title="View document"
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate/50 transition-colors hover:bg-ink/[0.06] hover:text-ink"
          >
            <Eye className="h-3 w-3" />
          </button>
        )}
      </div>
    </li>
  );
}
