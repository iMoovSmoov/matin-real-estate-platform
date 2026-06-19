"use client";

import { useState } from "react";
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
} from "lucide-react";
import type { Transaction } from "@/lib/types";
import { getAgent } from "@/lib/data";
import { cn, usd, daysLabel } from "@/lib/utils";
import { ProgressBar } from "@/components/command/ui";

// Canonical pipeline order. Any stage present in data is grouped; the board
// renders only the columns that actually contain deals so it never looks empty.
const STAGE_ORDER = [
  "Pre-Listing",
  "Active",
  "Pending",
  "Inspection",
  "Appraisal",
  "Financing",
  "Clear to Close",
  "Closed",
];

function progressTone(t: Transaction): "azure" | "success" | "warn" {
  if (t.stage === "Closed") return "success";
  if (t.riskFlag) return "warn";
  return "azure";
}

export function TransactionsBoard({ transactions }: { transactions: Transaction[] }) {
  const [active, setActive] = useState<Transaction | null>(null);

  const present = STAGE_ORDER.filter((s) => transactions.some((t) => t.stage === s));
  // Include any stage in data that isn't in our canonical order (defensive).
  const extra = Array.from(new Set(transactions.map((t) => t.stage))).filter((s) => !present.includes(s));
  const columns = [...present, ...extra];

  return (
    <>
      <div className="-mx-1 overflow-x-auto pb-2">
        <div className="flex min-w-max gap-3 px-1">
          {columns.map((stage) => {
            const items = transactions.filter((t) => t.stage === stage);
            const colValue = items.reduce((s, t) => s + t.price, 0);
            return (
              <div key={stage} className="flex w-[18rem] shrink-0 flex-col rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="border-b border-white/10 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[0.8rem] font-semibold text-white">{stage}</span>
                    <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[0.66rem] font-semibold text-slate-300/70">
                      {items.length}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[0.72rem] text-slate-300/55 tabular-nums">{usd(colValue)} volume</p>
                </div>
                <div className="flex max-h-[36rem] flex-col gap-2.5 overflow-y-auto p-2.5">
                  {items.map((t) => {
                    const agent = getAgent(t.agentSlug);
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActive(t)}
                        className="group rounded-xl border border-white/10 bg-white/[0.055] p-3.5 text-left transition-all hover:border-azure/40 hover:bg-azure/[0.05]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[0.82rem] font-semibold leading-snug text-white">{t.address}</p>
                          {t.riskFlag && (
                            <span title={t.riskFlag} className="shrink-0 text-warn">
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[0.72rem] text-slate-300/65">
                          {t.client} · {t.type}
                        </p>
                        <p className="mt-1.5 font-display text-base text-white tabular-nums">{usd(t.price)}</p>

                        <div className="mt-2.5 flex items-center gap-2">
                          <ProgressBar value={t.progress} tone={progressTone(t)} className="flex-1" />
                          <span className="shrink-0 text-[0.66rem] text-slate-300/60 tabular-nums">{t.progress}%</span>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          {agent ? (
                            <span className="flex items-center gap-1.5">
                              <span className="relative h-5 w-5 overflow-hidden rounded-full ring-1 ring-white/10">
                                <Image src={agent.photo} alt={agent.name} fill sizes="20px" className="object-cover" />
                              </span>
                              <span className="text-[0.7rem] text-slate-300/75">{agent.firstName}</span>
                            </span>
                          ) : (
                            <span />
                          )}
                          <span className="inline-flex items-center gap-1 text-[0.68rem] text-slate-300/60">
                            <CalendarClock className="h-3 w-3" /> closes {daysLabel(t.closeDateDaysOut)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TransactionDetail tx={active} onClose={() => setActive(null)} />
    </>
  );
}

function TransactionDetail({ tx, onClose }: { tx: Transaction | null; onClose: () => void }) {
  const open = !!tx;
  const agent = tx ? getAgent(tx.agentSlug) : undefined;
  const doneCount = tx?.checklist.filter((c) => c.done).length ?? 0;

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
          "fixed inset-y-0 right-0 z-50 flex w-[min(520px,94vw)] flex-col border-l border-white/10 bg-ink-900 shadow-[0_0_80px_rgba(0,0,0,.6)] transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
      >
        {tx && (
          <>
            <div className="relative shrink-0 border-b border-white/10 bg-gradient-to-br from-ink-800 to-ink-900 px-5 py-5">
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-azure-300/80">{tx.stage} · {tx.type}</p>
              <h2 className="mt-1 pr-8 font-display text-2xl text-white">{tx.address}</h2>
              {tx.riskFlag && (
                <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-warn/15 px-2.5 py-1 text-[0.72rem] font-semibold text-warn ring-1 ring-inset ring-warn/25">
                  <AlertTriangle className="h-3.5 w-3.5" /> {tx.riskFlag}
                </span>
              )}
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <div className="grid grid-cols-2 gap-2.5">
                <Fact icon={<DollarSign className="h-3.5 w-3.5" />} label="Sale price" value={usd(tx.price)} />
                <Fact icon={<DollarSign className="h-3.5 w-3.5" />} label="Commission" value={usd(tx.commission)} accent />
                <Fact icon={<User className="h-3.5 w-3.5" />} label="Client" value={tx.client} />
                <Fact icon={<CalendarClock className="h-3.5 w-3.5" />} label="Closes" value={daysLabel(tx.closeDateDaysOut)} />
              </div>

              {agent && (
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-3">
                  <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
                    <Image src={agent.photo} alt={agent.name} fill sizes="36px" className="object-cover" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.7rem] uppercase tracking-wider text-slate-300/55">Lead agent</p>
                    <p className="truncate text-[0.86rem] font-semibold text-white">{agent.name}</p>
                  </div>
                </div>
              )}

              {/* Progress */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[0.78rem] font-semibold text-white">Deal progress</span>
                  <span className="text-[0.74rem] text-slate-300/70 tabular-nums">{tx.progress}%</span>
                </div>
                <ProgressBar value={tx.progress} tone={progressTone(tx)} className="h-2" />
              </div>

              {/* Checklist */}
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-white">
                    <ClipboardList className="h-4 w-4 text-azure-bright" /> Transaction checklist
                  </span>
                  <span className="text-[0.72rem] text-slate-300/60 tabular-nums">
                    {doneCount}/{tx.checklist.length}
                  </span>
                </div>
                <ul className="space-y-1">
                  {tx.checklist.map((c, i) => (
                    <li
                      key={i}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.82rem]",
                        c.done ? "bg-white/[0.02] text-slate-300/60" : "bg-azure/[0.05] text-white ring-1 ring-inset ring-azure/15",
                      )}
                    >
                      {c.done ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-slate-300/40" />
                      )}
                      <span className={cn(c.done && "line-through decoration-slate-300/30")}>{c.label}</span>
                    </li>
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

function Fact({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-lg border px-3 py-2", accent ? "border-success/20 bg-success/[0.06]" : "border-white/[0.07] bg-white/[0.02]")}>
      <div className="flex items-center gap-1.5 text-slate-300/55">
        {icon}
        <span className="text-[0.64rem] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn("mt-0.5 truncate text-[0.82rem] font-medium", accent ? "text-success" : "text-white")}>{value}</p>
    </div>
  );
}
