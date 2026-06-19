"use client";

import { useState, useMemo } from "react";
import {
  FileSignature,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Users,
  UserCheck,
  Send,
  MapPin,
  DollarSign,
  Mail,
  Phone,
  Loader2,
  Download,
} from "lucide-react";
import { buyerAgreements } from "@/lib/data";
import type { BuyerAgreement, BuyerAgreementStatus } from "@/lib/types";
import { Panel, PanelHeader, StatTile, Pill, SectionLabel } from "@/components/command/ui";
import { EmptyState } from "@/components/command/ui/EmptyState";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { streamAi } from "@/lib/ai/client";
import { cn, compactUsd, daysLabel, initials } from "@/lib/utils";

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

/* ─── Inline table action buttons ────────────────────────────────────────── */

function TableSendButton({ buyer }: { buyer: BuyerAgreement }) {
  const [sent, setSent] = useState(false);

  return sent ? (
    <button
      disabled
      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[0.75rem] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 cursor-default"
      onClick={(e) => e.stopPropagation()}
    >
      <CheckCircle2 className="h-3 w-3" />
      Sent
    </button>
  ) : (
    <button
      onClick={(e) => { e.stopPropagation(); setSent(true); }}
      className="inline-flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-[0.75rem] font-medium text-white transition-colors hover:bg-ink/90"
    >
      Send
    </button>
  );
}

function TableSendConfirmBanner({ buyer, onDismiss }: { buyer: BuyerAgreement; onDismiss: () => void }) {
  return (
    <tr className="border-0">
      <td colSpan={9} className="px-0 py-0">
        <div className="flex items-center justify-between gap-4 border-t border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[0.8rem] text-emerald-700">
          <span>
            Agreement sent to <strong>{buyer.name}</strong> at {buyer.email} via DocuSign.
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            className="shrink-0 text-emerald-600 hover:text-emerald-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function TableRemindButton({ buyer }: { buyer: BuyerAgreement }) {
  const [showPopover, setShowPopover] = useState(false);

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setShowPopover(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-ink/[0.12] px-2.5 py-1 text-[0.75rem] font-medium text-ink transition-colors hover:bg-ink/[0.04]"
      >
        Remind
      </button>
      {showPopover && (
        <div className="absolute bottom-full right-0 z-10 mb-1.5 w-[260px] rounded-xl border border-ink/[0.08] bg-white shadow-lg">
          <div className="px-4 py-3 space-y-2">
            <p className="text-[0.85rem] font-semibold text-ink">Reminder sent</p>
            <div className="space-y-1">
              <p className="text-[0.8rem] text-ink/80">
                <span className="text-slate/50">To:</span> {buyer.name}
              </p>
              <p className="text-[0.8rem] text-ink/80">
                <span className="text-slate/50">Document:</span> Buyer Representation Agreement
              </p>
              <p className="text-[0.8rem] text-ink/80">
                <span className="text-slate/50">Via:</span> Email + SMS
              </p>
            </div>
            <button
              onClick={() => setShowPopover(false)}
              className="text-[0.78rem] text-slate hover:text-ink transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Desktop table row (fragment so confirm banner can be a sibling <tr>) ── */

function TableRow({
  buyer,
  onSelect,
}: {
  buyer: BuyerAgreement;
  onSelect: () => void;
}) {
  const [sentConfirm, setSentConfirm] = useState(false);

  return (
    <>
      <tr
        onClick={onSelect}
        className="cursor-pointer border-b border-ink/[0.04] transition-colors hover:bg-ink/[0.02] last:border-0"
      >
        {/* Name */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <BuyerAvatar name={buyer.name} />
            <span className="font-medium text-ink">{buyer.name}</span>
          </div>
        </td>

        {/* Agent */}
        <td className="whitespace-nowrap px-4 py-3 text-slate">
          {buyer.agentName}
        </td>

        {/* Budget */}
        <td className="whitespace-nowrap px-4 py-3 text-ink tabular-nums">
          {compactUsd(buyer.budgetMin)}&ndash;{compactUsd(buyer.budgetMax)}
        </td>

        {/* Areas */}
        <td className="max-w-[160px] px-4 py-3 text-slate">
          <span className="line-clamp-1">{buyer.areas.join(", ")}</span>
        </td>

        {/* Agreement status */}
        <td className="px-4 py-3">
          <Pill
            tone={
              buyer.agreementStatus === "Not Signed"
                ? "danger"
                : buyer.agreementStatus === "Sent"
                ? "warn"
                : "success"
            }
          >
            {buyer.agreementStatus}
          </Pill>
        </td>

        {/* Preapproval */}
        <td className="px-4 py-3">
          <Pill
            tone={
              buyer.preapproval === "Yes"
                ? "success"
                : buyer.preapproval === "In Progress"
                ? "warn"
                : "danger"
            }
          >
            {buyer.preapproval}
          </Pill>
        </td>

        {/* Showings */}
        <td className="px-4 py-3 text-center text-ink">{buyer.showingCount}</td>

        {/* Last contact */}
        <td className="whitespace-nowrap px-4 py-3 text-slate">
          {daysLabel(-buyer.lastContactDaysAgo)}
        </td>

        {/* Actions */}
        <td
          className="px-4 py-3 text-right"
          onClick={(e) => e.stopPropagation()}
        >
          {buyer.agreementStatus === "Not Signed" && (
            <div onClick={() => setSentConfirm(true)}>
              <TableSendButton buyer={buyer} />
            </div>
          )}
          {buyer.agreementStatus === "Sent" && (
            <TableRemindButton buyer={buyer} />
          )}
          {buyer.agreementStatus === "Signed" && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[0.75rem] font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <FileSignature className="h-3 w-3" />
              View
            </button>
          )}
        </td>
      </tr>
      {sentConfirm && buyer.agreementStatus === "Not Signed" && (
        <TableSendConfirmBanner
          buyer={buyer}
          onDismiss={() => setSentConfirm(false)}
        />
      )}
    </>
  );
}

/* ─── Slide-over ─────────────────────────────────────────────────────────── */

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
}: {
  buyer: BuyerAgreement;
  onClose: () => void;
}) {
  const [reminderSent, setReminderSent] = useState(false);
  const [agreementSent, setAgreementSent] = useState(false);
  const [viewAgreementOpen, setViewAgreementOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiStreaming, setAiStreaming] = useState(false);

  function handleSendAgreement() {
    setAgreementSent(true);
  }

  function handleSendReminder() {
    setReminderSent(true);
  }

  async function handleGenerateSummary() {
    setAiStreaming(true);
    setAiSummary("");
    await streamAi(
      {
        tool: "buyer_agreement_summary",
        input: {
          buyerName: buyer.name,
          agentName: buyer.agentName,
          budgetMin: buyer.budgetMin,
          budgetMax: buyer.budgetMax,
          areas: buyer.areas,
          preapproval: buyer.preapproval,
          showingCount: buyer.showingCount,
          timeline: buyer.timeline,
          notes: buyer.notes,
          agreementStatus: buyer.agreementStatus,
        },
      },
      (_chunk, full) => setAiSummary(full),
    );
    setAiStreaming(false);
  }

  const effectiveStatus: BuyerAgreementStatus = agreementSent ? "Sent" : buyer.agreementStatus;
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
      <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-2xl overflow-y-auto sm:max-w-[480px] border-l border-ink/[0.08]">
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
        <div className="flex-1 space-y-6 px-5 py-5 pb-8">
          {/* 1. Agreement status progress */}
          <section>
            <SectionLabel className="mb-3">Agreement Status</SectionLabel>
            <AgreementProgress status={effectiveStatus} />
          </section>

          {/* 2. Contact strip */}
          <section>
            <SectionLabel className="mb-2">Contact</SectionLabel>
            <div className="space-y-1">
              <a
                href={`mailto:${buyer.email}`}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[0.82rem] text-ink hover:bg-ink/[0.04] transition-colors"
              >
                <Mail className="h-4 w-4 shrink-0 text-slate/50" />
                {buyer.email}
              </a>
              <a
                href={`tel:${buyer.phone}`}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[0.82rem] text-ink hover:bg-ink/[0.04] transition-colors"
              >
                <Phone className="h-4 w-4 shrink-0 text-slate/50" />
                {buyer.phone}
              </a>
            </div>
          </section>

          {/* 3. Buyer details */}
          <section>
            <SectionLabel className="mb-3">Buyer Details</SectionLabel>
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
                  <Pill
                    tone={
                      buyer.preapproval === "Yes"
                        ? "success"
                        : buyer.preapproval === "In Progress"
                        ? "warn"
                        : "danger"
                    }
                  >
                    {buyer.preapproval}
                  </Pill>
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

          {/* 4. Action buttons — status-dependent */}
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
                {agreementSent && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 space-y-1">
                    <p className="text-[0.82rem] font-semibold text-emerald-700">
                      Agreement delivered
                    </p>
                    <p className="text-[0.78rem] text-emerald-700/80">
                      Sent to {buyer.name} at {buyer.email} via DocuSign. Awaiting buyer signature.
                    </p>
                  </div>
                )}
              </div>
            )}

            {buyer.agreementStatus === "Sent" && (
              <div className="space-y-3">
                <button
                  onClick={handleSendReminder}
                  disabled={reminderSent}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[0.85rem] font-medium transition-colors",
                    reminderSent
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 cursor-default"
                      : "border border-ink/[0.12] text-ink hover:bg-ink/[0.04]",
                  )}
                >
                  {reminderSent ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Reminder Sent
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4" />
                      Send Reminder
                    </>
                  )}
                </button>
                {reminderSent && (
                  <div className="rounded-xl border border-ink/[0.08] bg-[#f4f4f3] px-3.5 py-3 space-y-1.5">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate/60">
                      Reminder Sent
                    </p>
                    <div className="space-y-1">
                      <p className="text-[0.82rem] text-ink">
                        <span className="text-slate/50">To:</span> {buyer.name}
                      </p>
                      <p className="text-[0.82rem] text-ink">
                        <span className="text-slate/50">Document:</span> Buyer Representation Agreement
                      </p>
                      <p className="text-[0.82rem] text-ink">
                        <span className="text-slate/50">Delivery:</span> Email + SMS
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {buyer.agreementStatus === "Signed" && (
              <div className="space-y-3">
                <button
                  onClick={() => setViewAgreementOpen((v) => !v)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[0.85rem] font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  <FileSignature className="h-4 w-4" />
                  {viewAgreementOpen ? "Hide Agreement" : "View Agreement"}
                </button>
                {viewAgreementOpen && (
                  <div className="rounded-xl border border-ink/[0.08] bg-[#f4f4f3] px-4 py-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <FileSignature className="h-4 w-4 text-slate/50" />
                      <span className="text-[0.85rem] font-semibold text-ink">
                        Buyer Representation Agreement
                      </span>
                      <Pill tone="success" className="ml-auto">
                        Signed
                      </Pill>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[0.8rem] text-ink">
                        <span className="text-slate/50">Signed by:</span> {buyer.name}
                      </p>
                      <p className="text-[0.8rem] text-ink">
                        <span className="text-slate/50">Represented by:</span> {buyer.agentName}
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateSummary}
                      disabled={aiStreaming}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[0.85rem] font-medium transition-colors",
                        aiStreaming
                          ? "bg-ink/60 text-white cursor-default"
                          : "bg-ink text-white hover:bg-ink/90",
                      )}
                    >
                      {aiStreaming ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating&hellip;
                        </>
                      ) : aiSummary ? (
                        "Regenerate Summary"
                      ) : (
                        "Generate AI Summary"
                      )}
                    </button>
                    {aiSummary && (
                      <div className="border-t border-ink/[0.08] pt-3">
                        <AiMarkdown text={aiSummary} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 5. Showing history */}
          <section>
            <SectionLabel className="mb-2.5">Showing History</SectionLabel>
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

          {/* 6. Last contact */}
          <section>
            <SectionLabel className="mb-1.5">Last Contact</SectionLabel>
            <p className="text-[0.85rem] text-ink">
              {daysLabel(-buyer.lastContactDaysAgo)}
            </p>
          </section>

          {/* 7. Notes */}
          {buyer.notes && (
            <section>
              <SectionLabel className="mb-1.5">Notes</SectionLabel>
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
  const [statusFilter, setStatusFilter] = useState<"All" | BuyerAgreementStatus>("All");
  const [exportDone, setExportDone] = useState(false);

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
    let list = buyerAgreements;
    if (statusFilter !== "All") list = list.filter((b) => b.agreementStatus === statusFilter);
    const q = search.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.agentName.toLowerCase().includes(q) ||
        b.areas.some((a) => a.toLowerCase().includes(q)),
    );
  }, [search, statusFilter]);

  function handleExportCsv() {
    const header = [
      "Name", "Email", "Agent", "Budget Min", "Budget Max",
      "Areas", "Preapproval", "Agreement Status", "Showings",
      "Last Contact Days Ago", "Timeline",
    ];
    const rows = filtered.map((b) => [
      b.name, b.email, b.agentName, b.budgetMin, b.budgetMax,
      b.areas.join("; "), b.preapproval, b.agreementStatus,
      b.showingCount, b.lastContactDaysAgo, b.timeline,
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "buyer-agreements.csv";
    a.click();
    URL.revokeObjectURL(url);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 2000);
  }

  const statusFilterPills = (["All", "Not Signed", "Sent", "Signed"] as const);

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
          <StatTile
            label="Missing Agreements"
            value={missingCount}
            icon={<AlertCircle className="h-4 w-4 text-red-500" />}
            hint={missingCount > 0 ? "Needs action" : "All covered"}
          />
          <StatTile
            label="Sent — Pending Signature"
            value={sentCount}
            icon={<Clock className="h-4 w-4 text-amber-500" />}
            hint="Awaiting buyer signature"
          />
          <StatTile
            label="Signed This Month"
            value={signedThisMonth}
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            hint="Last 30 days"
          />
        </div>

        {/* Table panel */}
        <Panel>
          <PanelHeader
            title="All Buyers"
            subtitle={`${filtered.length} of ${buyerAgreements.length} buyers`}
            icon={<Users className="h-4 w-4" />}
            action={
              <button
                onClick={handleExportCsv}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.78rem] font-medium transition-colors",
                  exportDone
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-ink/[0.08] text-ink hover:bg-ink/[0.04]",
                )}
              >
                {exportDone ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Exported
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    Export CSV
                  </>
                )}
              </button>
            }
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
          </div>

          {/* Status filter pills */}
          <div className="flex gap-2 overflow-x-auto px-5 py-2.5 border-b border-ink/[0.06]">
            {statusFilterPills.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-[0.75rem] font-semibold transition-colors",
                  statusFilter === f
                    ? "bg-ink text-white"
                    : "border border-ink/[0.12] bg-white text-ink hover:bg-ink/[0.04]",
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Mobile card list (block on mobile, hidden on sm+) */}
          <div className="block sm:hidden divide-y divide-ink/[0.06]">
            {filtered.length === 0 ? (
              buyerAgreements.length === 0 ? (
                <EmptyState
                  icon={UserCheck}
                  title="No buyer clients yet"
                  description="When you start working with buyers, track their agreement status, showings, and preapproval here."
                  action={{ label: "Add buyer client", href: "/hub/buyer-agreements?new=1" }}
                />
              ) : (
                <EmptyState
                  icon={Users}
                  title="No buyers found"
                  description="Try adjusting your search to find the buyer you're looking for."
                  action={{
                    label: "Clear search",
                    onClick: () => { setSearch(""); setStatusFilter("All"); },
                  }}
                />
              )
            ) : (
              filtered.map((buyer) => (
                <button
                  key={buyer.id}
                  onClick={() => setSelected(buyer)}
                  className="w-full cursor-pointer px-4 py-4 text-left transition-colors hover:bg-ink/[0.02]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BuyerAvatar name={buyer.name} />
                      <span className="font-semibold text-[0.88rem] text-ink truncate">
                        {buyer.name}
                      </span>
                    </div>
                    <Pill
                      tone={
                        buyer.agreementStatus === "Not Signed"
                          ? "danger"
                          : buyer.agreementStatus === "Sent"
                          ? "warn"
                          : "success"
                      }
                    >
                      {buyer.agreementStatus}
                    </Pill>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-9">
                    <span className="text-[0.75rem] text-slate">{buyer.agentName}</span>
                    <span className="text-[0.75rem] text-slate/50">
                      {compactUsd(buyer.budgetMin)}–{compactUsd(buyer.budgetMax)}
                    </span>
                    <Pill
                      tone={
                        buyer.preapproval === "Yes"
                          ? "success"
                          : buyer.preapproval === "In Progress"
                          ? "warn"
                          : "danger"
                      }
                    >
                      {buyer.preapproval}
                    </Pill>
                  </div>
                  {buyer.areas.length > 0 && (
                    <p className="mt-1 pl-9 text-[0.73rem] text-slate/60 line-clamp-1">
                      {buyer.areas.join(", ")}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Desktop table (hidden on mobile, shown on sm+) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-[0.82rem]">
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
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className={cn(
                        "whitespace-nowrap px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-wider text-slate/50",
                        h === "Actions" ? "text-right" : "text-left",
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      {buyerAgreements.length === 0 ? (
                        <EmptyState
                          icon={UserCheck}
                          title="No buyer clients yet"
                          description="When you start working with buyers, track their agreement status, showings, and preapproval here."
                          action={{ label: "Add buyer client", href: "/hub/buyer-agreements?new=1" }}
                        />
                      ) : (
                        <EmptyState
                          icon={Users}
                          title="No buyers found"
                          description="Try adjusting your search to find the buyer you're looking for."
                          action={{
                            label: "Clear search",
                            onClick: () => { setSearch(""); setStatusFilter("All"); },
                          }}
                        />
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((buyer) => (
                    <TableRow
                      key={buyer.id}
                      buyer={buyer}
                      onSelect={() => setSelected(buyer)}
                    />
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
          key={selected.id}
          buyer={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
