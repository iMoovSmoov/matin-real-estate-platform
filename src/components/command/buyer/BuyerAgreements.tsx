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
  Plus,
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
  onStatusChange,
}: {
  buyer: BuyerAgreement;
  onClose: () => void;
  onToast: (msg: string) => void;
  onStatusChange: (id: string, status: BuyerAgreementStatus) => void;
}) {
  const [reminderSent, setReminderSent] = useState(false);
  const [reminderTime, setReminderTime] = useState<string | null>(null);
  const [agreementSent, setAgreementSent] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);

  function handleSendAgreement() {
    setAgreementSent(true);
    onStatusChange(buyer.id, "Sent");
    onToast("Agreement sent via DocuSign");
  }

  function handleSendReminder() {
    setReminderSent(true);
    setReminderTime(new Date().toLocaleTimeString());
    onToast("Reminder sent");
  }

  function handleViewAgreement() {
    setShowAgreement((prev) => !prev);
  }

  // Derive a tracking ID from buyer.id (first 4 + last 4 chars)
  const trackingId = `DS-${buyer.id.slice(0, 4).toUpperCase()}-${buyer.id.slice(-4).toUpperCase()}`;

  // Expiry: 7 days from now label
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);
  const expiryLabel = expiryDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

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
              <div className="space-y-3">
                <button
                  onClick={handleSendAgreement}
                  disabled={agreementSent}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[0.85rem] font-medium transition-colors",
                    agreementSent
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 cursor-default"
                      : "bg-ink text-white hover:bg-ink/90",
                  )}
                >
                  {agreementSent ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Sent via DocuSign
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Agreement
                    </>
                  )}
                </button>

                {/* DocuSign confirmation panel */}
                {agreementSent && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      <p className="text-[0.88rem] font-semibold text-emerald-800">
                        Sent via DocuSign
                      </p>
                    </div>
                    <div className="space-y-1.5 text-[0.78rem] text-emerald-800/80">
                      <div className="flex gap-2">
                        <span className="font-medium w-14 shrink-0">To:</span>
                        <span>{buyer.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium w-14 shrink-0">Email:</span>
                        <span>{buyer.email}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium w-14 shrink-0">Sent:</span>
                        <span>Just now</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium w-14 shrink-0">Expires:</span>
                        <span>in 7 days ({expiryLabel})</span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-emerald-100 border border-emerald-200 px-3 py-2">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-emerald-700 mb-1">
                        Tracking ID
                      </p>
                      <code className="font-mono text-[0.8rem] text-emerald-900 font-semibold">
                        {trackingId}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            )}

            {buyer.agreementStatus === "Sent" && (
              <div className="space-y-2">
                <button
                  onClick={handleSendReminder}
                  disabled={reminderSent}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-[0.85rem] font-medium transition-colors",
                    reminderSent
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default"
                      : "border-ink/[0.12] text-ink hover:bg-ink/[0.04]",
                  )}
                >
                  <Clock className="h-4 w-4" />
                  {reminderSent ? "Reminder Sent" : "Send Reminder"}
                </button>
                {reminderSent && reminderTime && (
                  <div className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <p className="text-[0.78rem] font-medium text-emerald-700">
                      Reminder sent &middot; {reminderTime}
                    </p>
                  </div>
                )}
              </div>
            )}

            {buyer.agreementStatus === "Signed" && (
              <div className="space-y-3">
                <button
                  onClick={handleViewAgreement}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[0.85rem] font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  <FileSignature className="h-4 w-4" />
                  {showAgreement ? "Hide Agreement" : "View Agreement"}
                </button>

                {showAgreement && (
                  <div className="rounded-xl border border-ink/[0.10] bg-white shadow-sm overflow-hidden">
                    {/* Agreement header */}
                    <div className="border-b border-ink/[0.08] bg-[#f9f8f7] px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[0.8rem] font-semibold text-ink leading-snug">
                          Oregon Buyer Representation Agreement
                        </p>
                      </div>
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[0.68rem] font-semibold text-emerald-700 uppercase tracking-wide">
                        <CheckCircle2 className="h-3 w-3" />
                        Signed
                      </span>
                    </div>

                    {/* Agreement fields */}
                    <div className="px-4 py-4 space-y-2.5 text-[0.78rem]">
                      <div className="flex gap-3">
                        <span className="font-medium text-slate/60 w-16 shrink-0">Buyer</span>
                        <span className="text-ink font-medium">{buyer.name}</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="font-medium text-slate/60 w-16 shrink-0">Agent</span>
                        <span className="text-ink font-medium">{buyer.agentName}</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="font-medium text-slate/60 w-16 shrink-0">Date</span>
                        <span className="text-ink">
                          {new Date(Date.now() - buyer.lastContactDaysAgo * 86400000).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <span className="font-medium text-slate/60 w-16 shrink-0">Term</span>
                        <span className="text-ink">90 days</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="font-medium text-slate/60 w-16 shrink-0">Areas</span>
                        <span className="text-ink">{buyer.areas.join(", ")}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-ink/[0.08] bg-[#f9f8f7] px-4 py-2.5">
                      <p className="text-[0.72rem] text-slate/60 font-mono">
                        Stored in DocuSign Envelope DS-SIGNED-{buyer.id.slice(0, 5).toUpperCase()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
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

/* ─── Add Lead Slide-Over ────────────────────────────────────────────────── */

type LeadSource =
  | "Website"
  | "Zillow"
  | "Referral"
  | "Google"
  | "Facebook"
  | "Cold Call"
  | "Open House"
  | "Other";

const LEAD_SOURCES: LeadSource[] = [
  "Website",
  "Zillow",
  "Referral",
  "Google",
  "Facebook",
  "Cold Call",
  "Open House",
  "Other",
];

function AddLeadSlideOver({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (buyer: BuyerAgreement) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState<LeadSource>("Website");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [areas, setAreas] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    setError(null);

    const now = Date.now();
    const newBuyer: BuyerAgreement = {
      id: `lead-${now}-${Math.random().toString(36).slice(2, 8)}`,
      name: fullName.trim(),
      email: email.trim() || `${fullName.trim().toLowerCase().replace(/\s+/g, ".")}@example.com`,
      phone: phone.trim() || "—",
      agentSlug: "unassigned",
      agentName: "Unassigned",
      budgetMin: budgetMin ? parseInt(budgetMin, 10) : 0,
      budgetMax: budgetMax ? parseInt(budgetMax, 10) : 0,
      areas: areas
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      preapproval: "No",
      agreementStatus: "Not Signed",
      showingCount: 0,
      lastContactDaysAgo: 0,
      timeline: "3-6 months",
      notes: `Source: ${source}${notes.trim() ? ` — ${notes.trim()}` : ""}`,
    };

    onAdd(newBuyer);
    onClose();
  }

  const inputCls =
    "h-9 w-full rounded-lg border border-ink/[0.12] bg-white px-3 text-[0.82rem] text-ink placeholder:text-slate/40 focus:outline-none focus:ring-1 focus:ring-ink/20";
  const labelCls =
    "block text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate/60 mb-1";

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
          <div>
            <h2 className="font-display text-[1rem] font-semibold tracking-tight text-ink">
              Add New Lead
            </h2>
            <p className="mt-0.5 text-[0.78rem] text-slate">
              Buyer will appear as &ldquo;Not Signed&rdquo; until agreement is sent.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-5 px-5 py-5">
          {/* Full Name */}
          <div>
            <label htmlFor="lead-name" className={labelCls}>
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="lead-name"
              type="text"
              required
              placeholder="e.g. Jordan Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Phone + Email row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="lead-phone" className={labelCls}>
                Phone
              </label>
              <input
                id="lead-phone"
                type="tel"
                placeholder="(503) 555-0100"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="lead-email" className={labelCls}>
                Email
              </label>
              <input
                id="lead-email"
                type="email"
                placeholder="buyer@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Source */}
          <div>
            <label htmlFor="lead-source" className={labelCls}>
              Source
            </label>
            <select
              id="lead-source"
              value={source}
              onChange={(e) => setSource(e.target.value as LeadSource)}
              className={cn(inputCls, "cursor-pointer")}
            >
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Budget row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="lead-budget-min" className={labelCls}>
                Min Budget ($)
              </label>
              <input
                id="lead-budget-min"
                type="number"
                min={0}
                step={1000}
                placeholder="300000"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="lead-budget-max" className={labelCls}>
                Max Budget ($)
              </label>
              <input
                id="lead-budget-max"
                type="number"
                min={0}
                step={1000}
                placeholder="600000"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Areas */}
          <div>
            <label htmlFor="lead-areas" className={labelCls}>
              Areas of Interest
            </label>
            <input
              id="lead-areas"
              type="text"
              placeholder="e.g. SE Portland, Lake Oswego, Beaverton"
              value={areas}
              onChange={(e) => setAreas(e.target.value)}
              className={inputCls}
            />
            <p className="mt-1 text-[0.7rem] text-slate/50">
              Separate multiple areas with commas.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="lead-notes" className={labelCls}>
              Notes
            </label>
            <textarea
              id="lead-notes"
              rows={3}
              placeholder="Any additional context about this buyer…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-none rounded-lg border border-ink/[0.12] bg-white px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/40 focus:outline-none focus:ring-1 focus:ring-ink/20"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[0.78rem] text-red-700 font-medium">
              {error}
            </p>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-1 pb-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-ink/[0.12] px-4 py-2.5 text-[0.85rem] font-medium text-ink transition-colors hover:bg-ink/[0.04]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[0.85rem] font-medium text-white transition-colors hover:bg-ink/90"
            >
              <Plus className="h-4 w-4" />
              Add Lead
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export default function BuyerAgreements() {
  const [selected, setSelected] = useState<BuyerAgreement | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, BuyerAgreementStatus>>({});
  const [newBuyers, setNewBuyers] = useState<BuyerAgreement[]>([]);
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // All buyers = newly added first, then static data
  const allBuyers = useMemo(
    () => [...newBuyers, ...buyerAgreements],
    [newBuyers],
  );

  // Stat counts (computed over allBuyers with overrides applied)
  const missingCount = useMemo(
    () =>
      allBuyers.filter(
        (b) => (statusOverrides[b.id] ?? b.agreementStatus) === "Not Signed",
      ).length,
    [allBuyers, statusOverrides],
  );
  const sentCount = useMemo(
    () =>
      allBuyers.filter(
        (b) => (statusOverrides[b.id] ?? b.agreementStatus) === "Sent",
      ).length,
    [allBuyers, statusOverrides],
  );
  const signedThisMonth = useMemo(
    () =>
      allBuyers.filter(
        (b) =>
          (statusOverrides[b.id] ?? b.agreementStatus) === "Signed" &&
          b.lastContactDaysAgo <= 30,
      ).length,
    [allBuyers, statusOverrides],
  );

  // Filtered rows
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allBuyers;
    return allBuyers.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.agentName.toLowerCase().includes(q) ||
        b.areas.some((a) => a.toLowerCase().includes(q)),
    );
  }, [search, allBuyers]);

  function showToast(msg: string) {
    setToast(msg);
  }

  function handleStatusChange(id: string, status: BuyerAgreementStatus) {
    setStatusOverrides((prev) => ({ ...prev, [id]: status }));
  }

  function handleAddLead(buyer: BuyerAgreement) {
    setNewBuyers((prev) => [buyer, ...prev]);
    showToast(`${buyer.name} added as a new lead`);
  }

  return (
    <>
      <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 md:px-6 md:py-8">
        {/* Page heading */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-ink sm:text-3xl">
              Buyer Agreement Workspace
            </h1>
            <p className="mt-1 max-w-2xl text-[0.9rem] text-slate">
              Track every buyer&apos;s representation agreement from intake through
              signature. Send via DocuSign and keep every agent compliant.
            </p>
          </div>
          <button
            onClick={() => setAddLeadOpen(true)}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[0.85rem] font-medium text-white transition-colors hover:bg-ink/90"
          >
            <Plus className="h-4 w-4" />
            Add lead
          </button>
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
            subtitle={`${filtered.length} of ${allBuyers.length} buyers`}
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
                  filtered.map((buyer) => {
                    const displayStatus = statusOverrides[buyer.id] ?? buyer.agreementStatus;
                    return (
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

                        {/* Agreement status — uses override if present */}
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold",
                              agreementBadgeClasses(displayStatus),
                            )}
                          >
                            {displayStatus}
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* Buyer detail slide-over */}
      {selected !== null && (
        <SlideOver
          buyer={selected}
          onClose={() => setSelected(null)}
          onToast={showToast}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Add lead slide-over */}
      {addLeadOpen && (
        <AddLeadSlideOver
          onClose={() => setAddLeadOpen(false)}
          onAdd={handleAddLead}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} />}
    </>
  );
}
