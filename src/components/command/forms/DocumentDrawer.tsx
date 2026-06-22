"use client";

import { useMemo, useState } from "react";
import {
  Eye,
  Download,
  Printer,
  Send,
  RotateCcw,
  CircleCheck,
  ChevronLeft,
  ChevronRight,
  TriangleAlert,
} from "lucide-react";
import {
  RecordDrawer,
  DocumentPreview,
  BrandedDocument,
  ActivityTimeline,
  StatusChip,
  AIActionCard,
  type DrawerTab,
  type ActivityItem,
} from "@/components/os";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import { rosterOption } from "@/lib/data/agreement-roster";
import {
  STATUS_META,
  isSendBlocked,
  docFields,
  docCompletion,
  type Packet,
  type PacketDoc,
} from "./packets";

/** Real OREF/form legal blurbs for the branded center-pane preview (per code). */
const FORM_BLURB: Record<string, string> = {
  "OREF-001":
    "Residential Real Estate Sale Agreement — the core Oregon purchase contract: price, terms, contingencies, earnest money, and closing timelines.",
  "OREF-015":
    "Exclusive Right to Sell Listing Agreement engaging Matin Real Estate to market and sell the property on the terms below.",
  "C-565":
    "Buyer Representation Agreement (OREF C-565), mandatory in Oregon per HB 4058, establishing exclusive buyer agency and compensation.",
  "C-530":
    "Initial Agency Disclosure Pamphlet describing the duties a real estate licensee owes — required before representation begins.",
  SPDS:
    "Seller's Property Disclosure Statement — the seller's written disclosure of the property's known condition under ORS 105.464.",
  LBP:
    "Lead-Based Paint Disclosure required for homes built before 1978 under federal law (42 U.S.C. 4852d).",
  "OREF-040":
    "Disclosed Limited Agency agreement consenting to in-company representation of both parties with informed written consent.",
  EMR: "Earnest Money Receipt evidencing the buyer's good-faith deposit held in trust pending closing.",
  CDA: "Commission Disbursement Authorization directing the settlement agent to pay commissions at closing.",
  "OREF-026":
    "Repair / Inspection Addendum documenting requested repairs following the inspection contingency period.",
  "OREF-002": "Counter Offer responding to the prior offer with revised terms for acceptance.",
  "OREF-005": "Addendum / Amendment modifying an executed agreement (e.g. a revised closing date).",
};

/* ──────────────────────────────────────────────────────────────────────────
   DocumentDrawer — the real "View" experience for a single document.

   Row/card "View" → opens THIS record (not the global AI sidecar). A light
   RecordDrawer with:
     • Document tab  — paginated DocumentPreview (real page navigation) + the
       action bar (Send for signature / Request correction) driven by props.
     • Field check   — an AIActionCard whose Run streams the missing-field
       findings INLINE (streamAi 'form-suggest'); approval-gated, never silent.
     • Activity tab  — the document's signer/automation history (ActivityTimeline).

   Mutations (Send / Correction) are handled by the parent via callbacks so the
   doc-card grid + KPIs reconcile to the same source of truth.
   ────────────────────────────────────────────────────────────────────────── */

export function DocumentDrawer({
  open,
  onClose,
  packet,
  doc,
  onSend,
  onRequestCorrection,
  onResolveFields,
}: {
  open: boolean;
  onClose: () => void;
  packet: Packet | null;
  doc: PacketDoc | null;
  /** Mark the doc Sent (parent mutates packet state). */
  onSend: (docId: string) => void;
  /** Flag the doc for correction (parent mutates packet state). */
  onRequestCorrection: (docId: string) => void;
  /** Clear the doc's missing fields after the human resolves them. */
  onResolveFields: (docId: string) => void;
}) {
  const [tab, setTab] = useState<string>("document");
  const [pageIdx, setPageIdx] = useState(0);

  // AI field-check (streamed inline into the AIActionCard result slot).
  const [checkBusy, setCheckBusy] = useState(false);
  const [checkOut, setCheckOut] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);

  // Reset transient view state whenever a different doc opens — the official
  // "adjust state during render on prop change" pattern (no effect, matches the
  // Avatar/PropertyThumb primitives), so there are no cascading-render effects.
  const docKey = doc ? `${packet?.id}:${doc.id}:${doc.status}` : "";
  const [lastDocKey, setLastDocKey] = useState(docKey);
  if (docKey !== lastDocKey) {
    setLastDocKey(docKey);
    setTab("document");
    setPageIdx(0);
    setCheckOut("");
    setCheckBusy(false);
    setConfirm(null);
  }

  const activity = useMemo<ActivityItem[]>(
    () => (doc && packet ? buildDocActivity(packet, doc) : []),
    [doc, packet],
  );

  if (!packet || !doc) return null;

  const meta = STATUS_META[doc.status];
  // Real coordinator identity for the branded signature block + footer.
  const ownerOpt = rosterOption(packet.ownerSlug);
  const brandedAgent = ownerOpt
    ? {
        name: ownerOpt.name,
        title: ownerOpt.title,
        license: ownerOpt.license,
        phone: ownerOpt.phone,
        email: ownerOpt.email,
        slug: ownerOpt.slug,
      }
    : { name: packet.ownerName, slug: packet.ownerSlug };
  const blocked = isSendBlocked(doc.status);
  const missing = doc.missing ?? [];
  const missingCount = missing.length;

  // Page-of-N navigation: the doc spans `doc.pages`; the preview's flagged page
  // is `doc.page` (1-based). pageIdx is 0-based for the local pager.
  const currentPage = pageIdx + 1;
  const pageHasFlag = currentPage === doc.page && missingCount > 0;

  async function runFieldCheck() {
    if (!doc || !packet || checkBusy) return;
    setCheckBusy(true);
    setCheckOut("");
    const situation =
      `Validate the document "${doc.title}" (${doc.code}) in the "${packet.name}" packet ` +
      `for ${packet.subject}. The document is ${doc.pages} page${doc.pages > 1 ? "s" : ""}. ` +
      (missingCount
        ? `Known gaps: ${missing.join("; ")}. `
        : `No gaps are flagged yet — confirm it is send-ready. `) +
      `List exactly which required fields, initials, or signatures are missing and on which page, ` +
      `then state plainly whether it is safe to send for signature.`;
    try {
      await streamAi(
        { tool: "form-suggest", input: { situation } },
        (_c, full) => setCheckOut(full),
      );
    } finally {
      setCheckBusy(false);
    }
  }

  function handleSend() {
    if (!doc || blocked) return;
    onSend(doc.id);
    setConfirm(`Sent for signature · envelope created for ${packet?.name}.`);
  }

  function handleCorrection() {
    if (!doc) return;
    onRequestCorrection(doc.id);
    setConfirm("Correction requested · routed back to the document owner.");
  }

  function handleResolve() {
    if (!doc) return;
    onResolveFields(doc.id);
    setConfirm("Fields marked resolved · this document is now send-ready.");
  }

  const tabs: DrawerTab[] = [
    { key: "document", label: "Document" },
    {
      key: "activity",
      label: (
        <span className="inline-flex items-center gap-1.5">
          Activity
          <span className="rounded-full bg-paper-200 px-1.5 text-[0.62rem] font-semibold tabular-nums text-slate">
            {activity.length}
          </span>
        </span>
      ),
    },
  ];

  return (
    <RecordDrawer
      open={open}
      onClose={onClose}
      title={doc.title}
      subtitle={
        <span className="inline-flex items-center gap-2">
          <span className="font-mono">{doc.code}</span>
          <span aria-hidden>·</span>
          <span>{packet.name}</span>
        </span>
      }
      tabs={tabs}
      activeTab={tab}
      onTab={setTab}
      actions={
        <div className="flex w-full items-center gap-2">
          <button
            type="button"
            onClick={handleSend}
            disabled={blocked}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[0.84rem] font-semibold transition-colors",
              blocked
                ? "cursor-not-allowed bg-paper-200 text-slate"
                : "bg-ink text-cloud hover:bg-ink-800",
            )}
            title={
              blocked
                ? "Resolve the blocking fields before sending"
                : "Send this document for e-signature"
            }
          >
            <Send className="h-4 w-4" />
            {doc.status === "sent" ? "Resend" : "Send for signature"}
          </button>
          <button
            type="button"
            onClick={handleCorrection}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-mist bg-cloud px-3 py-2.5 text-[0.82rem] font-medium text-ink transition-colors hover:border-ink/20"
            title="Send this document back for correction"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Correction
          </button>
        </div>
      }
    >
      {tab === "document" ? (
        <div className="space-y-4">
          {/* Identity + status */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[0.72rem] font-semibold text-slate">
                {doc.code}
              </p>
              <p className="mt-0.5 text-[0.78rem] text-slate">
                {packet.subject}
              </p>
            </div>
            <StatusChip tone={meta.tone}>{meta.label}</StatusChip>
          </div>

          {/* Inline confirmation (Send / Correction / Resolve) */}
          {confirm ? (
            <div className="flex items-start gap-2 rounded-xl bg-success/10 px-3.5 py-2.5 text-[0.78rem] leading-snug text-success ring-1 ring-inset ring-success/20">
              <CircleCheck className="mt-px h-4 w-4 shrink-0" aria-hidden />
              <span>{confirm}</span>
            </div>
          ) : null}

          {/* REAL branded Matin letterhead document (center-pane, ticket 1) */}
          <BrandedDocument
            variant="letter"
            formId={doc.code}
            title={doc.title}
            recipient={packet.subject}
            agent={brandedAgent}
            fields={docFields(packet, doc)}
            completion={docCompletion(packet, doc)}
            page={doc.page}
            pages={doc.pages}
            body={
              <p className="text-[0.84rem] leading-relaxed text-ink/90">
                {FORM_BLURB[doc.code] ??
                  `${doc.title} — prepared by ${packet.ownerName} for ${packet.subject}. Every field is filled in from this deal's record; complete the flagged items before sending for signature.`}
              </p>
            }
          />

          {/* Paginated preview — real page navigation across the doc */}
          <DocumentPreview
            title={`Page ${currentPage}`}
            status={meta.label}
            statusTone={meta.tone}
            lines={doc.lines}
            signatureField={doc.signatureField && currentPage === doc.pages}
            page={currentPage}
            pages={doc.pages}
            missing={pageHasFlag ? missing : undefined}
            actions={
              doc.pages > 1 ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPageIdx((i) => Math.max(0, i - 1))}
                    disabled={pageIdx === 0}
                    aria-label="Previous page"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-mist text-slate transition-colors hover:border-ink/20 hover:text-ink disabled:pointer-events-none disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPageIdx((i) => Math.min(doc.pages - 1, i + 1))
                    }
                    disabled={currentPage >= doc.pages}
                    aria-label="Next page"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-mist text-slate transition-colors hover:border-ink/20 hover:text-ink disabled:pointer-events-none disabled:opacity-40"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null
            }
          />

          {/* Light document utilities — real inline confirmations */}
          <DocUtilities title={doc.title} pages={doc.pages} />

          {/* Blocking-field resolver (human action; ink, not gold) */}
          {blocked ? (
            <div className="rounded-xl bg-danger/[0.06] px-3.5 py-3 ring-1 ring-inset ring-danger/20">
              <p className="flex items-center gap-1.5 text-[0.8rem] font-semibold text-danger">
                <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                {missingCount > 0
                  ? `${missingCount} item${missingCount > 1 ? "s" : ""} block sending`
                  : "Required before this can be sent"}
              </p>
              {missingCount > 0 ? (
                <ul className="mt-2 space-y-1">
                  {missing.map((mi, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-[0.78rem] leading-snug text-danger"
                    >
                      <ChevronRight className="mt-0.5 h-3 w-3 shrink-0" />
                      {mi}
                    </li>
                  ))}
                </ul>
              ) : null}
              <button
                type="button"
                onClick={handleResolve}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[0.78rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
              >
                <CircleCheck className="h-3.5 w-3.5" />
                Mark fields resolved
              </button>
            </div>
          ) : null}

          {/* AI field check — dark AIActionCard; Run streams findings inline */}
          <div className="space-y-2">
            <p className="eyebrow text-slate">AI field check</p>
            <AIActionCard
              title="Run missing-field check"
              riskTag={blocked ? "Approval required" : "Ready"}
              evidence={
                missingCount > 0
                  ? `${missingCount} field${missingCount > 1 ? "s" : ""} flagged across ${doc.pages} page${doc.pages > 1 ? "s" : ""}: ${missing.join("; ")}.`
                  : `No gaps flagged on ${doc.code}. A check confirms initials and signatures are complete before sending.`
              }
              confidence={missingCount > 0 ? "High" : "Medium"}
              runLabel={checkOut ? "Re-run check" : "Run field check"}
              running={checkBusy}
              result={checkOut || undefined}
              onRun={runFieldCheck}
            />
          </div>
        </div>
      ) : (
        <ActivityTimeline items={activity} />
      )}
    </RecordDrawer>
  );
}

/* ── Light document utilities (Preview / Download / Print) ───────────────── */

function DocUtilities({ title, pages }: { title: string; pages: number }) {
  const [note, setNote] = useState<string | null>(null);

  function flash(message: string) {
    setNote(message);
    window.setTimeout(() => setNote((n) => (n === message ? null : n)), 2600);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <UtilBtn
          icon={<Eye className="h-3.5 w-3.5" />}
          onClick={() => flash(`Opened full preview — ${pages} page${pages > 1 ? "s" : ""}.`)}
        >
          Preview
        </UtilBtn>
        <UtilBtn
          icon={<Download className="h-3.5 w-3.5" />}
          onClick={() => flash(`Generated PDF · ${title}.pdf`)}
        >
          PDF
        </UtilBtn>
        <UtilBtn
          icon={<Printer className="h-3.5 w-3.5" />}
          onClick={() => {
            flash("Sent to printer.");
            if (typeof window !== "undefined") window.print();
          }}
        >
          Print
        </UtilBtn>
      </div>
      {note ? (
        <p className="mt-2 flex items-center gap-1.5 text-[0.74rem] font-medium text-success">
          <CircleCheck className="h-3.5 w-3.5 shrink-0" />
          {note}
        </p>
      ) : null}
    </div>
  );
}

function UtilBtn({
  icon,
  children,
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-mist bg-cloud px-2 py-2 text-[0.76rem] font-medium text-ink transition-colors hover:border-ink/20"
    >
      {icon}
      {children}
    </button>
  );
}

/* ── Per-document activity (signer + automation history) ─────────────────── */

function buildDocActivity(packet: Packet, doc: PacketDoc): ActivityItem[] {
  const items: ActivityItem[] = [];
  const meta = STATUS_META[doc.status];

  if (doc.status === "sent") {
    items.push({
      id: `${doc.id}-sent`,
      channel: "system",
      name: "Signature envelope sent",
      tag: "Out for signature",
      tagTone: "gold",
      meta: `${doc.code} · routed to required signers`,
      timeLabel: "Just now",
      group: "Now",
    });
  }

  if (doc.status === "correction") {
    items.push({
      id: `${doc.id}-corr`,
      channel: "system",
      name: "Correction requested",
      tag: "Returned to owner",
      tagTone: "danger",
      meta: `${doc.code} · ${packet.ownerName} to revise`,
      timeLabel: "Just now",
      group: "Now",
    });
  }

  (doc.missing ?? []).forEach((mi, i) => {
    items.push({
      id: `${doc.id}-miss-${i}`,
      channel: "note",
      name: "Missing field flagged",
      tag: meta.label,
      tagTone: meta.tone === "danger" ? "danger" : "warn",
      meta: mi,
      timeLabel: "Today",
      group: "Today",
    });
  });

  items.push(
    {
      id: `${doc.id}-autofill`,
      channel: "system",
      name: "Auto-filled from record",
      tag: "AI",
      tagTone: "gold",
      meta: `Merged ${packet.subject} into ${doc.code}`,
      timeLabel: "Earlier",
      group: "Earlier",
    },
    {
      id: `${doc.id}-added`,
      channel: "note",
      name: `Added to ${packet.name}`,
      meta: `${packet.ownerName} · ${packet.lastUpdated.replace(/^Updated /, "")}`,
      timeLabel: "Earlier",
      group: "Earlier",
    },
  );

  return items;
}
