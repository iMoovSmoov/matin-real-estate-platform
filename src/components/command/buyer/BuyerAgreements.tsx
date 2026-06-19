"use client";

import { useState, useMemo, useEffect } from "react";
import {
  FileSignature,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Users,
  Send,
  MapPin,
  DollarSign,
} from "lucide-react";
import { buyerAgreements } from "@/lib/data";
import type { BuyerAgreement, BuyerAgreementStatus, PreapprovalStatus } from "@/lib/types";
import { Panel, PanelHeader, StatTile } from "@/components/command/ui";
import { cn, compactUsd, daysLabel, initials } from "@/lib/utils";

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function agreementBadgeClasses(status: BuyerAgreementStatus): string {
  if (status === "Not Signed")
    return "bg-red-50 text-red-700 border border-red-200";
  if (status === "Sent")
    return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-emerald-50 text-emerald-700 border border-emerald-200";
}

function preapprovalBadgeClasses(status: PreapprovalStatus): string {
  if (status === "Yes")
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (status === "In Progress")
    return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-red-50 text-red-700 border border-red-200";
}

/* ─── Step progress ──────────────────────────────────────────────────────── */

const STEPS: { label: string }[] = [
  { label: "Not Signed" },
  { label: "Agreement Sent" },
  { label: "Signed" },
];

function stepActiveIndex(status: BuyerAgreementStatus): number {
  if (status === "Signed") return 2;
  if (status === "Sent") return 1;
  return 0;
}

function AgreementProgress({ status }: { status: BuyerAgreementStatus }) {
  const activeIdx = stepActiveIndex(status);
  return (
    <div className="flex items-start gap-0">
      {STEPS.map((step, i) => {
        const done = i <= activeIdx;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step.label} className="flex flex-1 items-start">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[0.6rem] font-bold transition-colors",
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
                  "whitespace-nowrap text-[0.62rem] font-medium text-center",
                  done ? "text-ink" : "text-slate/50",
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mx-1 mt-3 h-px flex-1 transition-colors",
                  i + 1 <= activeIdx ? "bg-ink" : "bg-ink/15",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Avatar ─────────────────────────────────────────────────────────────── */

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

function BuyerAvatar({ name }: { name: string }) {
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

/* ─── Toast ──────────────────────────────────────────────────────────────── */

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-5 right-5 z-[70] rounded-xl bg-ink px-4 py-2.5 text-[0.82rem] font-medium text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      {message}
    </div>
  );
}

/* ─── Slide-over ─────────────────────────────────────────────────────────── */

// Deterministic showing log — derive from showingCount so no real dates needed
function simulatedShowings(count: number): string[] {
  if (count === 0) return [];
  const labels = [
    "Showing #1 — initial tour",
    "Showing #2 — second look",
    "Showing #3 — brought family",
    "Showing #4 — revisit after offer fell through",
    "Showing #5 — comparing with another property",
    "Showing #6 — final walkthrough",
    "Showing #7 — contractor visit",
    "Showing #8 — pre-offer inspection prep",
    "Showing #9 — revisit",
    "Showing #10 — re-evaluation",
    "Showing #11 — lender walkthrough",
    "Showing #12 — final decision visit",
  ];
  return labels.slice(0, Math.min(count, labels.length));
}

function SlideOver({
  buyer,
  onClose,
  onToast,
}: {
  buyer: BuyerAgreement;
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const [reminderSent, setReminderSent] = useState(false);

  function handleSendAgreement() {
    onToast("Agreement sent via DocuSign");
  }

  function handleSendReminder() {
    setReminderSent(true);
    onToast("Reminder sent");
  }

  function handleViewAgreement() {
    onToast("Opening signed agreement...");
  }

  const showings = simulatedShowings(buyer.showingCount);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-2xl overflow-y-auto sm:max-w-[480px]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink/[0.08] bg-white px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display truncate text-[1rem] font-semibold tracking-tight text-ink">
              {buyer.name}
            </h2>
            <p className="mt-0.5 truncate text-[0.78rem] text-slate">
              {buyer.agentName} &middot; {buyer.showingCount} showing
              {buyer.showingCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate transition-colors hover:bg-ink/[0.06] hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 px-5 py-5">
          {/* 1. Agreement status progress */}
          <section>
            <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate/70">
              Agreement Status
            </p>
            <AgreementProgress status={buyer.agreementStatus} />
          </section>

          {/* 2. Buyer details */}
          <section>
            <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate/70">
              Buyer Details
            </p>
            <div className="space-y-3">
              {/* Budget */}
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 shrink-0 text-slate/50" />
                <div>
                  <p className="text-[0.68rem] text-slate/50 uppercase tracking-wider mb-0.5">
                    Budget
                  </p>
                  <p className="font-display text-2xl leading-none text-ink">
                    {compactUsd(buyer.budgetMin)}&ndash;{compactUsd(buyer.budgetMax)}
                  </p>
                </div>
              </div>

              {/* Areas */}
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate/50" />
                <div>
                  <p className="text-[0.68rem] text-slate/50 uppercase tracking-wider mb-1">
                    Areas
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {buyer.areas.map((area) => (
                      <span
                        key={area}
                        className="rounded-md border border-ink/[0.08] bg-[#f4f4f3] px-2 py-0.5 text-[0.75rem] font-medium text-ink"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preapproval + Timeline grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <p className="text-[0.68rem] text-slate/50 uppercase tracking-wider mb-1">
                    Preapproval
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold",
                      preapprovalBadgeClasses(buyer.preapproval),
                    )}
                  >
                    {buyer.preapproval}
                  </span>
                </div>
                <div>
                  <p className="text-[0.68rem] text-slate/50 uppercase tracking-wider mb-1">
                    Timeline
                  </p>
                  <p className="text-[0.85rem] font-semibold text-ink">
                    {buyer.timeline}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Action buttons */}
          <section>
            {buyer.agreementStatus === "Not Signed" && (
              <button
                onClick={handleSendAgreement}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[0.85rem] font-medium text-white transition-colors hover:bg-ink/90"
              >
                <Send className="h-4 w-4" />
                Send Agreement
              </button>
            )}
            {buyer.agreementStatus === "Sent" && (
              <div className="space-y-2">
                <button
                  onClick={handleSendReminder}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink/[0.12] px-4 py-2.5 text-[0.85rem] font-medium text-ink transition-colors hover:bg-ink/[0.04]"
                >
                  <Clock className="h-4 w-4" />
                  Send Reminder
                </button>
                {reminderSent && (
                  <p className="text-center text-[0.78rem] font-medium text-emerald-600">
                    Reminder sent
                  </p>
                )}
              </div>
            )}
            {buyer.agreementStatus === "Signed" && (
              <button
                onClick={handleViewAgreement}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[0.85rem] font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <FileSignature className="h-4 w-4" />
                View Agreement
              </button>
            )}
          </section>

          {/* 4. Showing history */}
          <section>
            <p className="mb-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate/70">
              Showing History
            </p>
            {buyer.showingCount === 0 ? (
              <p className="text-[0.82rem] text-slate/60">No showings completed yet.</p>
            ) : (
              <div className="space-y-1.5">
                <p className="text-[0.82rem] text-slate">
                  {buyer.showingCount} showing{buyer.showingCount !== 1 ? "s" : ""} completed
                </p>
                <ul className="space-y-1 rounded-xl border border-ink/[0.07] bg-[#f4f4f3] px-3.5 py-2.5">
                  {showings.map((entry, i) => (
                    <li key={i} className="text-[0.78rem] text-ink/70">
                      {entry}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* 5. Last contact */}
          <section>
            <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate/70">
              Last Contact
            </p>
            <p className="text-[0.85rem] text-ink">
              {daysLabel(-buyer.lastContactDaysAgo)}
            </p>
          </section>

          {/* 6. Notes */}
          {buyer.notes && (
            <section>
              <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate/70">
                Notes
              </p>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
                <p className="text-[0.82rem] leading-relaxed text-ink/80">
                  {buyer.notes}
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export default function BuyerAgreements() {
  const [selected, setSelected] = useState<BuyerAgreement | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Stat counts
  const missingCount = useMemo(
    () => buyerAgreements.filter((b) => b.agreementStatus === "Not Signed").length,
    [],
  );
  const sentCount = useMemo(
    () => buyerAgreements.filter((b) => b.agreementStatus === "Sent").length,
    [],
  );
  const signedThisMonth = useMemo(
    () =>
      buyerAgreements.filter(
        (b) => b.agreementStatus === "Signed" && b.lastContactDaysAgo <= 30,
      ).length,
    [],
  );

  // Filtered rows
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return buyerAgreements;
    return buyerAgreements.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.agentName.toLowerCase().includes(q) ||
        b.areas.some((a) => a.toLowerCase().includes(q)),
    );
  }, [search]);

  function showToast(msg: string) {
    setToast(msg);
  }

  return (
    <>
      <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 md:px-6 md:py-8">
        {/* Page heading */}
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">
            Buyer Agreement Workspace
          </h1>
          <p className="mt-1 max-w-2xl text-[0.9rem] text-slate">
            Track every buyer&apos;s representation agreement from intake through
            signature. Send via DocuSign and keep every agent compliant.
          </p>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-ink/[0.08] bg-white p-5">
            <StatTile
              label="Missing Agreements"
              value={missingCount}
              icon={<AlertCircle className="h-4 w-4 text-red-500" />}
              hint={missingCount > 0 ? "Needs action" : "All covered"}
            />
          </div>
          <div className="rounded-2xl border border-ink/[0.08] bg-white p-5">
            <StatTile
              label="Sent — Pending Signature"
              value={sentCount}
              icon={<Clock className="h-4 w-4 text-amber-500" />}
              hint="Awaiting buyer signature"
            />
          </div>
          <div className="rounded-2xl border border-ink/[0.08] bg-white p-5">
            <StatTile
              label="Signed This Month"
              value={signedThisMonth}
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              hint="Last 30 days"
            />
          </div>
        </div>

        {/* Table panel */}
        <Panel>
          <PanelHeader
            title="All Buyers"
            subtitle={`${filtered.length} of ${buyerAgreements.length} buyers`}
            icon={<Users className="h-4 w-4" />}
          />

          {/* Search bar */}
          <div className="flex items-center gap-3 border-b border-ink/[0.08] px-5 py-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate/50" />
              <input
                type="text"
                placeholder="Search buyers, agents, areas…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-full rounded-lg border border-ink/[0.08] bg-white pl-8 pr-3 text-[0.82rem] text-ink placeholder:text-slate/40 focus:outline-none focus:ring-1 focus:ring-ink/20"
              />
            </div>
            <Filter className="h-4 w-4 shrink-0 text-slate/40" />
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
                  ].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 text-left text-[0.68rem] font-semibold uppercase tracking-wider text-slate/50"
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
                      colSpan={8}
                      className="px-4 py-10 text-center text-[0.82rem] text-slate/50"
                    >
                      No buyers match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((buyer) => (
                    <tr
                      key={buyer.id}
                      onClick={() => setSelected(buyer)}
                      className="cursor-pointer border-b border-ink/[0.04] transition-colors hover:bg-ink/[0.02] last:border-0"
                    >
                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <BuyerAvatar name={buyer.name} />
                          <span className="font-medium text-ink">
                            {buyer.name}
                          </span>
                        </div>
                      </td>

                      {/* Agent */}
                      <td className="whitespace-nowrap px-4 py-3 text-slate">
                        {buyer.agentName}
                      </td>

                      {/* Budget */}
                      <td className="whitespace-nowrap px-4 py-3 text-ink">
                        {compactUsd(buyer.budgetMin)}&ndash;
                        {compactUsd(buyer.budgetMax)}
                      </td>

                      {/* Areas */}
                      <td className="max-w-[180px] px-4 py-3 text-slate">
                        <span className="line-clamp-1">
                          {buyer.areas.join(", ")}
                        </span>
                      </td>

                      {/* Agreement status */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold",
                            agreementBadgeClasses(buyer.agreementStatus),
                          )}
                        >
                          {buyer.agreementStatus}
                        </span>
                      </td>

                      {/* Preapproval */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold",
                            preapprovalBadgeClasses(buyer.preapproval),
                          )}
                        >
                          {buyer.preapproval}
                        </span>
                      </td>

                      {/* Showings */}
                      <td className="px-4 py-3 text-center text-ink">
                        {buyer.showingCount}
                      </td>

                      {/* Last contact */}
                      <td className="whitespace-nowrap px-4 py-3 text-slate">
                        {daysLabel(-buyer.lastContactDaysAgo)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* Slide-over */}
      {selected !== null && (
        <SlideOver
          buyer={selected}
          onClose={() => setSelected(null)}
          onToast={showToast}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} />}
    </>
  );
}
