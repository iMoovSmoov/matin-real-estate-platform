"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { X, Search, Send, FileSignature, Eye, Bell } from "lucide-react";
import { buyerAgreements } from "@/lib/data";
import type { BuyerAgreement, BuyerAgreementStatus, PreapprovalStatus } from "@/lib/types";
import { Panel, PanelHeader, Pill } from "@/components/command/ui";
import { cn, compactUsd, daysLabel, initials } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────────────────────── */

type FilterChip = "All" | BuyerAgreementStatus;

/* ── Helpers ────────────────────────────────────────────────────────────────── */

function agreementTone(
  status: BuyerAgreementStatus,
): "danger" | "warn" | "success" {
  if (status === "Not Signed") return "danger";
  if (status === "Sent") return "warn";
  return "success";
}

function agreementBadgeClasses(status: BuyerAgreementStatus): string {
  if (status === "Not Signed") return "bg-danger/10 text-danger ring-1 ring-inset ring-danger/25";
  if (status === "Sent") return "bg-warn/10 text-amber-700 ring-1 ring-inset ring-warn/25";
  return "bg-success/10 text-success ring-1 ring-inset ring-success/25";
}

function preapprovalTone(
  status: PreapprovalStatus,
): "success" | "danger" | "warn" {
  if (status === "Yes") return "success";
  if (status === "No") return "danger";
  return "warn";
}

/* ── Step progress indicator ────────────────────────────────────────────────── */

const STEPS = ["Intake", "Agreement Sent", "Signed"] as const;

function stepDone(stepIndex: number, status: BuyerAgreementStatus): boolean {
  if (stepIndex === 0) return true; // Intake always done
  if (stepIndex === 1) return status === "Sent" || status === "Signed";
  if (stepIndex === 2) return status === "Signed";
  return false;
}

function AgreementProgress({ status }: { status: BuyerAgreementStatus }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, i) => {
        const done = stepDone(i, status);
        const isLast = i === STEPS.length - 1;
        return (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border-2 text-[0.6rem] font-bold transition-colors",
                  done
                    ? "border-ink bg-ink text-white"
                    : "border-ink/20 bg-white text-slate",
                )}
              >
                {done ? (
                  <svg
                    viewBox="0 0 10 10"
                    fill="none"
                    className="h-3 w-3"
                    aria-hidden
                  >
                    <path
                      d="M2 5.5l2 2 4-4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "whitespace-nowrap text-[0.65rem] font-medium",
                  done ? "text-ink" : "text-slate/60",
                )}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mx-1 mb-3.5 h-px flex-1 transition-colors",
                  stepDone(i + 1, status) ? "bg-ink" : "bg-ink/15",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Agent avatar ────────────────────────────────────────────────────────────── */

// Deterministic colour from agent name
const AVATAR_COLORS = [
  "bg-[#e8e4df] text-[#3d3530]",
  "bg-[#dfe5ea] text-[#2c3e4a]",
  "bg-[#e5dfe8] text-[#3d2c45]",
  "bg-[#dfe8e1] text-[#2c3e32]",
  "bg-[#e8e2df] text-[#4a3428]",
  "bg-[#e0e4e8] text-[#2a3a4a]",
];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function AgentAvatar({ name }: { name: string }) {
  return (
    <div
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.62rem] font-semibold ring-1 ring-inset ring-ink/[0.06]",
        avatarColor(name),
      )}
    >
      {initials(name)}
    </div>
  );
}

/* ── Slide-over ──────────────────────────────────────────────────────────────── */

function SlideOver({
  buyer,
  onClose,
  onToast,
}: {
  buyer: BuyerAgreement;
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const [contractHint, setContractHint] = useState(false);

  function handleGeneratePacket() {
    onToast("Opening Contract Builder with buyer pre-filled...");
    setContractHint(true);
  }

  function handleSendReminder() {
    onToast("Reminder sent via DocuSign");
  }

  function handleViewSigned() {
    onToast("Opening document viewer...");
  }

  function handleSendEsignature() {
    onToast(`Sent to ${buyer.name} via DocuSign · ${buyer.email}`);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full sm:w-[480px] flex-col bg-white border-l border-ink/[0.08] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-ink/[0.08] px-5 py-4 shrink-0">
          <div className="min-w-0">
            <h2 className="font-sans text-[0.95rem] font-semibold tracking-tight text-ink truncate">
              {buyer.name}
            </h2>
            <p className="mt-0.5 text-[0.78rem] text-slate truncate">{buyer.agentName}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold", agreementBadgeClasses(buyer.agreementStatus))}>
              {buyer.agreementStatus}
            </span>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate transition-colors hover:bg-ink/[0.06] hover:text-ink"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Progress */}
          <div>
            <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate/80">
              Agreement Progress
            </p>
            <AgreementProgress status={buyer.agreementStatus} />
          </div>

          {/* Details grid */}
          <div>
            <p className="mb-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate/80">
              Buyer Details
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <p className="text-[0.68rem] font-medium text-slate/60 uppercase tracking-wider mb-0.5">
                  Budget
                </p>
                <p className="text-[0.85rem] font-semibold text-ink">
                  {compactUsd(buyer.budgetMin)}&ndash;{compactUsd(buyer.budgetMax)}
                </p>
              </div>
              <div>
                <p className="text-[0.68rem] font-medium text-slate/60 uppercase tracking-wider mb-0.5">
                  Areas
                </p>
                <p className="text-[0.85rem] font-semibold text-ink">
                  {buyer.areas.join(", ")}
                </p>
              </div>
              <div>
                <p className="text-[0.68rem] font-medium text-slate/60 uppercase tracking-wider mb-0.5">
                  Preapproval
                </p>
                <Pill tone={preapprovalTone(buyer.preapproval)}>
                  {buyer.preapproval}
                </Pill>
              </div>
              <div>
                <p className="text-[0.68rem] font-medium text-slate/60 uppercase tracking-wider mb-0.5">
                  Showings
                </p>
                <p className="text-[0.85rem] font-semibold text-ink">
                  {buyer.showingCount}
                </p>
              </div>
              <div>
                <p className="text-[0.68rem] font-medium text-slate/60 uppercase tracking-wider mb-0.5">
                  Timeline
                </p>
                <p className="text-[0.85rem] font-semibold text-ink">{buyer.timeline}</p>
              </div>
              <div>
                <p className="text-[0.68rem] font-medium text-slate/60 uppercase tracking-wider mb-0.5">
                  Last Contact
                </p>
                <p className="text-[0.85rem] font-semibold text-ink">
                  {daysLabel(-buyer.lastContactDaysAgo)}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {buyer.notes && (
            <div>
              <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate/80">
                Notes
              </p>
              <p className="rounded-xl border border-ink/[0.07] bg-[#f4f4f3] px-3.5 py-3 text-[0.82rem] text-ink/80 leading-relaxed">
                {buyer.notes}
              </p>
            </div>
          )}

          {/* Contract hint box */}
          {contractHint && buyer.agreementStatus === "Not Signed" && (
            <div className="rounded-xl border border-ink/[0.08] bg-ink/[0.03] px-4 py-3">
              <p className="text-[0.82rem] text-ink/70 mb-1.5">
                Go to Contract Builder &rarr; Buyer Representation Agreement — pre-filled for{" "}
                <span className="font-semibold text-ink">{buyer.name}</span>
              </p>
              <Link
                href="/hub/contracts"
                className="inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-ink underline underline-offset-2"
              >
                Open Contract Builder
              </Link>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="shrink-0 space-y-2 border-t border-ink/[0.08] px-5 py-4">
          {buyer.agreementStatus === "Not Signed" && (
            <button
              onClick={handleGeneratePacket}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2 text-[0.85rem] font-medium text-white hover:bg-ink/90 transition-colors"
            >
              <FileSignature className="h-4 w-4" />
              Generate Agreement Packet
            </button>
          )}
          {buyer.agreementStatus === "Sent" && (
            <button
              onClick={handleSendReminder}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink/[0.08] px-4 py-2 text-[0.85rem] font-medium text-ink hover:bg-ink/[0.04] transition-colors"
            >
              <Bell className="h-4 w-4" />
              Send Reminder
            </button>
          )}
          {buyer.agreementStatus === "Signed" && (
            <button
              onClick={handleViewSigned}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink/[0.08] px-4 py-2 text-[0.85rem] font-medium text-ink hover:bg-ink/[0.04] transition-colors"
            >
              <Eye className="h-4 w-4" />
              View Signed Copy
            </button>
          )}
          <button
            onClick={handleSendEsignature}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2 text-[0.85rem] font-medium text-white hover:bg-ink/90 transition-colors"
          >
            <Send className="h-4 w-4" />
            Send for E-Signature
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Toast ───────────────────────────────────────────────────────────────────── */

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-5 right-5 z-[60] rounded-xl bg-ink px-4 py-2.5 text-[0.82rem] font-medium text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      {message}
    </div>
  );
}

/* ── Filter chips ────────────────────────────────────────────────────────────── */

const CHIPS: FilterChip[] = ["All", "Not Signed", "Sent", "Signed"];

/* ── Main component ──────────────────────────────────────────────────────────── */

export function BuyerAgreements() {
  const [filter, setFilter] = useState<FilterChip>("All");
  const [search, setSearch] = useState("");
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerAgreement | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Auto-dismiss toast after 3s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return buyerAgreements.filter((b) => {
      const matchesFilter = filter === "All" || b.agreementStatus === filter;
      const matchesSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.agentName.toLowerCase().includes(q) ||
        b.areas.some((a) => a.toLowerCase().includes(q));
      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  function showToast(msg: string) {
    setToast(msg);
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title="All Buyers"
          subtitle={`${filtered.length} of ${buyerAgreements.length} buyers`}
        />

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2 border-b border-ink/[0.08] px-5 py-3">
          <div className="flex items-center gap-1.5">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => setFilter(chip)}
                className={cn(
                  "rounded-lg border px-3 py-1 text-[0.78rem] font-medium transition-colors",
                  filter === chip
                    ? "border-ink bg-ink text-white"
                    : "border-ink/[0.08] text-slate hover:bg-ink/[0.04]",
                )}
              >
                {chip}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate/50 pointer-events-none" />
              <input
                type="text"
                placeholder="Search buyers, agents, areas…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-56 rounded-lg border border-ink/[0.08] bg-white pl-8 pr-3 text-[0.82rem] text-ink placeholder:text-slate/40 focus:outline-none focus:ring-1 focus:ring-ink/20"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-[0.82rem]">
            <thead>
              <tr className="border-b border-ink/[0.06]">
                {[
                  "Name",
                  "Agent",
                  "Budget",
                  "Areas",
                  "Agreement",
                  "Preapproval",
                  "Showings",
                  "Last Contact",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate/70 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-[0.82rem] text-slate/50"
                  >
                    No buyers match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((buyer) => (
                  <tr
                    key={buyer.id}
                    onClick={() => setSelectedBuyer(buyer)}
                    className="cursor-pointer border-b border-ink/[0.04] transition-colors hover:bg-ink/[0.025] last:border-0"
                  >
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <AgentAvatar name={buyer.name} />
                        <span className="font-medium text-ink">{buyer.name}</span>
                      </div>
                    </td>

                    {/* Agent */}
                    <td className="px-4 py-3 text-slate whitespace-nowrap">
                      {buyer.agentName}
                    </td>

                    {/* Budget */}
                    <td className="px-4 py-3 text-ink whitespace-nowrap">
                      {compactUsd(buyer.budgetMin)}&ndash;{compactUsd(buyer.budgetMax)}
                    </td>

                    {/* Areas */}
                    <td className="px-4 py-3 text-slate max-w-[180px]">
                      <span className="line-clamp-1">{buyer.areas.join(", ")}</span>
                    </td>

                    {/* Agreement Status */}
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold", agreementBadgeClasses(buyer.agreementStatus))}>
                        {buyer.agreementStatus}
                      </span>
                    </td>

                    {/* Preapproval */}
                    <td className="px-4 py-3">
                      <Pill tone={preapprovalTone(buyer.preapproval)}>
                        {buyer.preapproval}
                      </Pill>
                    </td>

                    {/* Showings */}
                    <td className="px-4 py-3 text-ink text-center">
                      {buyer.showingCount}
                    </td>

                    {/* Last Contact */}
                    <td className="px-4 py-3 text-slate whitespace-nowrap">
                      {daysLabel(-buyer.lastContactDaysAgo)}
                    </td>

                    {/* Quick action */}
                    <td className="px-4 py-3">
                      {buyer.agreementStatus === "Not Signed" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBuyer(buyer);
                            showToast("Opening Contract Builder with buyer pre-filled...");
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-ink/[0.08] px-2.5 py-1 text-[0.75rem] font-medium text-ink hover:bg-ink/[0.04] transition-colors whitespace-nowrap"
                          title="Send agreement"
                        >
                          <Send className="h-3 w-3" />
                          Send
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Slide-over */}
      {selectedBuyer && (
        <SlideOver
          buyer={selectedBuyer}
          onClose={() => setSelectedBuyer(null)}
          onToast={showToast}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} />}
    </>
  );
}
