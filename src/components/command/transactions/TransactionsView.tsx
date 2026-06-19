"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";
import type { Transaction } from "@/lib/types";
import { getAgent } from "@/lib/data";
import { cn, usd, daysLabel, initials } from "@/lib/utils";
import { ProgressBar, Pill } from "@/components/command/ui";

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
function progressOf(t: Transaction) {
  if (typeof t.progress === "number" && t.progress > 0) return t.progress;
  if (t.checklist.length === 0) return 0;
  return Math.round((t.checklist.filter((c) => c.done).length / t.checklist.length) * 100);
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

export function TransactionsView({ transactions }: { transactions: Transaction[] }) {
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [active, setActive] = useState<Transaction | null>(null);

  const counts = useMemo(() => {
    const m = new Map<StatusFilter, number>();
    for (const f of FILTERS) m.set(f, transactions.filter((t) => matchesFilter(t, f)).length);
    return m;
  }, [transactions]);

  const visible = useMemo(
    () =>
      transactions
        .filter((t) => matchesFilter(t, filter))
        // Soonest-to-close first; closed deals sink to the bottom.
        .sort((a, b) => {
          if (isClosed(a) !== isClosed(b)) return isClosed(a) ? 1 : -1;
          return a.closeDateDaysOut - b.closeDateDaysOut;
        }),
    [transactions, filter],
  );

  return (
    <>
      <div className="rounded-2xl border border-ink/[0.08] bg-white backdrop-blur-md">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-ink/[0.08] px-4 py-3.5 md:px-5">
          {FILTERS.map((f) => {
            const on = filter === f;
            const isRisk = f === "At-risk";
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.78rem] font-medium transition-colors",
                  on
                    ? "border-ink/20 bg-ink/[0.08] text-ink"
                    : "border-ink/[0.08] bg-white text-slate hover:border-ink/15 hover:bg-white hover:text-ink",
                )}
              >
                {isRisk && (
                  <AlertTriangle
                    className={cn("h-3 w-3", on ? "text-ink" : "text-danger")}
                  />
                )}
                {f}
                <span
                  className={cn(
                    "rounded px-1 text-[0.66rem] tabular-nums",
                    on ? "bg-ink/10 text-ink" : "bg-white text-slate/70",
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
              <p className="text-[0.86rem] text-slate">No {filter.toLowerCase()} transactions.</p>
              <button
                onClick={() => setFilter("All")}
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
  const overdue = !isClosed(t) && t.closeDateDaysOut < 0;
  const soon = !isClosed(t) && t.closeDateDaysOut >= 0 && t.closeDateDaysOut <= 7;

  return (
    <button
      onClick={onOpen}
      className="group block w-full px-4 py-3.5 text-left transition-colors hover:bg-white md:grid md:grid-cols-[minmax(0,1fr)_8.5rem_7rem_10rem_6.5rem_1.25rem] md:items-center md:gap-4 md:px-5"
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
          <p className="mt-0.5 truncate text-[0.74rem] text-slate/70">
            {t.client} · {type.label} · <span className="text-slate/55">{t.stage}</span>
          </p>
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
      </div>

      {/* Chevron */}
      <div className="hidden justify-end text-slate/30 transition-colors group-hover:text-ink md:flex">
        <ArrowRight className="h-4 w-4" />
      </div>
    </button>
  );
}

/* ── Detail slide-over ─────────────────────────────────────────────────── */

function TransactionDetail({ tx, onClose }: { tx: Transaction | null; onClose: () => void }) {
  const open = !!tx;
  const agent = tx ? getAgent(tx.agentSlug) : undefined;
  const doneCount = tx?.checklist.filter((c) => c.done).length ?? 0;
  const total = tx?.checklist.length ?? 0;
  const pct = tx ? progressOf(tx) : 0;
  const nextItem = tx?.checklist.find((c) => !c.done) ?? null;
  const type = tx ? shortType(tx.type) : null;
  const docs = tx ? buildDocuments(tx) : [];

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/55 backdrop-blur-md transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[min(560px,96vw)] flex-col border-l border-ink/[0.08] bg-white shadow-[0_0_80px_rgba(0,0,0,.6)] transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
      >
        {tx && type && (
          <>
            {/* Header */}
            <div className="relative shrink-0 border-b border-ink/[0.08] bg-gradient-to-br from-paper to-white px-5 py-5">
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate hover:bg-ink/[0.04] hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-ink/70">
                {type.label} · {tx.stage} · {tx.id}
              </p>
              <h2 className="mt-1 pr-8 font-display text-2xl text-ink">{tx.address}</h2>

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

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {/* Key facts */}
              <div className="grid grid-cols-2 gap-2.5">
                <Fact icon={<User className="h-3.5 w-3.5" />} label="Client" value={tx.client} />
                <Fact
                  icon={<CalendarClock className="h-3.5 w-3.5" />}
                  label="Close date"
                  value={daysLabel(tx.closeDateDaysOut)}
                  tone={
                    !isClosed(tx) && tx.closeDateDaysOut < 0
                      ? "danger"
                      : !isClosed(tx) && tx.closeDateDaysOut <= 7
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
                <div className="flex items-center gap-3 rounded-xl border border-ink/[0.08] bg-white px-3.5 py-3">
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-paper text-[0.74rem] font-semibold text-ink ring-1 ring-inset ring-ink/[0.06]">
                    {agent.photo ? (
                      <Image src={agent.photo} alt={agent.name} fill sizes="36px" className="object-cover" />
                    ) : (
                      initials(agent.name)
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.7rem] uppercase tracking-wider text-slate/55">Lead agent</p>
                    <p className="truncate text-[0.86rem] font-semibold text-ink">{agent.name}</p>
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
                  {tx.checklist.map((c, i) => {
                    const isNext = !c.done && nextItem != null && c.label === nextItem.label;
                    return (
                      <li
                        key={i}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.82rem]",
                          c.done
                            ? "bg-white/[0.02]"
                            : isNext
                              ? "bg-white ring-1 ring-inset ring-ink/10"
                              : "bg-white/[0.02]",
                        )}
                      >
                        {c.done ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-slate/40" />
                        )}
                        <span
                          className={cn(
                            c.done
                              ? "text-success line-through decoration-success/30"
                              : isNext
                                ? "font-medium text-ink"
                                : "text-slate",
                          )}
                        >
                          {c.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Documents */}
              <div>
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-ink">
                    <FileText className="h-4 w-4 text-ink" /> Documents
                  </span>
                  <span className="text-[0.74rem] text-slate/70 tabular-nums">
                    {docs.filter((d) => d.status === "signed" || d.status === "received").length}/
                    {docs.length} in
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {docs.map((d) => (
                    <DocRow key={d.name} doc={d} />
                  ))}
                </ul>
              </div>
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

/* ── Documents (deterministic — synthesized from checklist + stage) ──────── */

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
function buildDocuments(t: Transaction): TxDoc[] {
  const sale = shortType(t.type).label === "Sale";
  const done = (label: string) =>
    t.checklist.some((c) => c.label.toLowerCase().includes(label) && c.done);
  const nextLabel = t.checklist.find((c) => !c.done)?.label.toLowerCase() ?? "";
  const isNext = (label: string) => nextLabel.includes(label);

  // milestone → doc status. "signed"/"received" if the milestone is done,
  // "out for signature" when it's the immediate next step, else "not started".
  const fromMilestone = (label: string, received: DocStatus = "signed"): DocStatus => {
    if (done(label)) return received;
    if (isNext(label)) return "out";
    return "pending";
  };

  const docs: TxDoc[] = [];

  // Agency agreement — listing vs buyer representation.
  docs.push({
    name: sale ? "Listing Agreement" : "Buyer Representation Agreement",
    status: fromMilestone("listing agreement"),
  });

  // Disclosures go out with the listing/representation.
  docs.push({
    name: "Agency Disclosure",
    status: done("listing agreement") ? "signed" : isNext("listing agreement") ? "out" : "pending",
  });

  // Purchase & Sale agreement at offer acceptance.
  docs.push({ name: "Purchase & Sale Agreement", status: fromMilestone("offer accepted") });

  // Earnest money receipt.
  docs.push({ name: "Earnest Money Receipt", status: fromMilestone("earnest money", "received") });

  // Seller's Property Disclosure on the sell side.
  if (sale) {
    docs.push({
      name: "Seller's Property Disclosure",
      status: done("offer accepted") ? "signed" : isNext("offer accepted") ? "out" : "pending",
    });
  }

  // Inspection report.
  docs.push({ name: "Inspection Report", status: fromMilestone("inspection", "received") });

  // Repair addendum.
  docs.push({ name: "Repair Addendum", status: fromMilestone("repairs", "signed") });

  // Appraisal report.
  docs.push({ name: "Appraisal Report", status: fromMilestone("appraisal", "received") });

  // Loan approval / commitment letter.
  docs.push({ name: "Loan Commitment Letter", status: fromMilestone("loan approved", "received") });

  // Closing Disclosure ahead of disbursal.
  docs.push({
    name: "Closing Disclosure",
    status: fromMilestone("closing disbursed", "received"),
  });

  return docs;
}

function DocRow({ doc }: { doc: TxDoc }) {
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
      </div>
      <Pill tone={meta.tone}>{meta.label}</Pill>
    </li>
  );
}
