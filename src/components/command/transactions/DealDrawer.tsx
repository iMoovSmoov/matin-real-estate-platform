"use client";

import { useState, type ReactNode } from "react";
import {
  Download,
  Printer,
  Send,
  CircleCheck,
  Check,
  Loader2,
  X,
} from "lucide-react";
import {
  RecordDrawer,
  ActivityTimeline,
  StatusChip,
  Avatar,
  type ChipTone,
  type ActivityItem,
} from "@/components/os";
import {
  BrandedDocument,
  type BrandedDocumentVariant,
  type BrandedDocumentField,
} from "@/components/os/BrandedDocument";
import { MatinMark } from "@/components/brand/Logo";
import { getAgent } from "@/lib/data";
import { cn } from "@/lib/utils";
import { downloadTextFile, printElementById } from "@/lib/download";
import type { DealDocument, DocStatus, MetaField } from "./deal-screen";

/* ──────────────────────────────────────────────────────────────────────────
   Transactions — DealDrawer (compliance review · build ref §2.6)

   Row/View-click → this drawer (right-side, LIGHT, full-width on phone). The
   center pane now renders a REAL Matin-branded letterhead document via
   `BrandedDocument` (OREF letterhead + real legal title + structured field grid
   with green ✓ filled / red-outline missing + boxed signature density), instead
   of the gray-ruled `DocumentPreview`. A tab strip (Document · Activity), a
   docked Accept / Reject verdict bar that MUTATES the parent's doc state and
   writes an activity_event, and a single explicit gold "Ask Matin" affordance.
   Nothing here opens the global AI sidecar on its own.
   ────────────────────────────────────────────────────────────────────────── */

const STATUS_LABEL: Record<DocStatus, string> = {
  complete: "Complete",
  "needs-review": "Needs review",
  missing: "Missing",
  rejected: "Rejected",
};

const STATUS_TONE: Record<DocStatus, ChipTone> = {
  complete: "success",
  "needs-review": "warn",
  missing: "danger",
  rejected: "danger",
};

export function docStatusTone(status: DocStatus): ChipTone {
  return STATUS_TONE[status];
}

export function docStatusLabel(status: DocStatus): string {
  return STATUS_LABEL[status];
}

/* Map a requirement group to the OREF/Matin form id + variant shown on the
   branded letterhead, so each doc reads as the real instrument. */
function formMetaFor(doc: DealDocument): { formId: string; variant: BrandedDocumentVariant } {
  const n = doc.name.toLowerCase();
  if (/sale agreement|purchase agreement|oref-001/.test(n)) return { formId: "OREF-001", variant: "agreement" };
  if (/addendum/.test(n)) return { formId: "OREF-002 Addendum", variant: "agreement" };
  if (/disclosure/.test(n) && /closing/.test(n)) return { formId: "TRID Closing Disclosure", variant: "letter" };
  if (/disclosure/.test(n)) return { formId: "OREF Seller Disclosure", variant: "letter" };
  if (/appraisal/.test(n)) return { formId: "Appraisal Report", variant: "report" };
  if (/loan|lender|approval|clear-to-close/.test(n)) return { formId: "Lender Letter", variant: "letter" };
  if (/inspection/.test(n)) return { formId: "Inspection Report", variant: "report" };
  if (/earnest/.test(n)) return { formId: "Escrow Receipt", variant: "letter" };
  return { formId: doc.requirement, variant: "letter" };
}

/* Turn the doc's metadata + missing notes into a branded field grid:
   filled fields get a green check, each missing note becomes a red-outline row. */
function fieldsFor(doc: DealDocument, dealMeta?: MetaField[]): BrandedDocumentField[] {
  const fields: BrandedDocumentField[] = [
    { label: "Requirement", value: doc.requirement },
    { label: "Pages", value: String(doc.pages) },
  ];
  // Pull a couple of grounding values from the deal metadata band when present.
  for (const want of ["Escrow #", "Close of escrow", "Acceptance date"]) {
    const m = dealMeta?.find((f) => f.label === want);
    if (m) fields.push({ label: m.label, value: m.value });
  }
  if (doc.signature) {
    fields.push({
      label: "Signature block",
      value: doc.status === "complete" ? "Executed" : undefined,
      filled: doc.status === "complete",
    });
  }
  // Each missing note becomes its own red-outline field row.
  for (const miss of doc.missing ?? []) {
    fields.push({ label: miss, value: undefined, filled: false });
  }
  return fields;
}

/** Filename-safe slug for the downloaded document copy. */
function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "document"
  );
}

/* Assemble the compliance document into a real plain-text artifact so the
   drawer's Download is a tangible file (not a fake "Downloaded" flash). The
   branded on-screen preview carries the visual; this carries the record. */
function assembleDocText(
  doc: DealDocument,
  formId: string,
  dealAddress: string,
  dealMeta?: MetaField[],
  reviewer?: string,
): string {
  const rule = "─".repeat(46);
  const out: string[] = [];
  out.push("MATIN REAL ESTATE — TRANSACTION DOCUMENT");
  out.push(rule);
  out.push(`Document:     ${doc.name}`);
  out.push(`Form:         ${formId}`);
  out.push(`Requirement:  ${doc.requirement}`);
  out.push(`Property:     ${dealAddress}`);
  out.push(`Status:       ${STATUS_LABEL[doc.status]}`);
  out.push(`Pages:        ${doc.pages}`);
  out.push(`Provenance:   ${doc.meta}`);
  out.push("");
  if (dealMeta && dealMeta.length > 0) {
    out.push("TRANSACTION DETAILS");
    out.push(rule);
    for (const m of dealMeta) out.push(`${m.label}: ${m.value}`);
    out.push("");
  }
  if (doc.missing && doc.missing.length > 0) {
    out.push("OUTSTANDING ITEMS (resolve before acceptance)");
    out.push(rule);
    for (const x of doc.missing) out.push(`• ${x}`);
    out.push("");
  }
  if (reviewer) out.push(`Reviewed by:  ${reviewer} · Transaction Coordinator`);
  out.push("Matin Real Estate · Equal Housing Opportunity");
  return out.join("\n");
}

export function DealDrawer({
  open,
  onClose,
  doc,
  dealAddress,
  dealMeta,
  agentName,
  agentSlug,
  coordinatorSlug,
  activity,
  onAccept,
  onReject,
  onAskAi,
}: {
  open: boolean;
  onClose: () => void;
  doc: DealDocument | null;
  dealAddress: string;
  dealMeta?: MetaField[];
  agentName?: string;
  agentSlug?: string;
  /** Real transaction-coordinator slug — owns the compliance review. */
  coordinatorSlug?: string;
  /** The deal's running activity log (newest first) for the Activity tab. */
  activity: ActivityItem[];
  onAccept: (doc: DealDocument) => void;
  onReject: (doc: DealDocument) => void;
  onAskAi: (doc: DealDocument) => void;
}) {
  const [tab, setTab] = useState<string>("document");

  if (!doc) return null;

  const tone = STATUS_TONE[doc.status];
  const resolved = doc.status === "complete" || doc.status === "rejected";
  const { formId, variant } = formMetaFor(doc);
  const coordinator = coordinatorSlug ? getAgent(coordinatorSlug) : undefined;
  const tcName = coordinator?.name ?? agentName;
  const tcSlug = coordinator?.slug ?? agentSlug;

  // Real document artifacts: a .txt record (Download) + a scoped print of just
  // the branded letterhead (Print) — both wired to actual files, never no-ops.
  const docDomId = `deal-doc-${doc.id}`;
  const downloadDoc = () =>
    downloadTextFile(
      `matin-${slugify(doc.name)}.txt`,
      assembleDocText(doc, formId, dealAddress, dealMeta, tcName),
    );
  const printDoc = () => printElementById(docDomId, doc.name);
  const completion =
    doc.status === "complete"
      ? 100
      : doc.status === "needs-review"
        ? 70
        : doc.status === "rejected"
          ? 40
          : 30;

  return (
    <RecordDrawer
      open={open}
      onClose={onClose}
      title={doc.name}
      subtitle={`${doc.requirement} · ${dealAddress}`}
      tabs={[
        { key: "document", label: "Document" },
        { key: "activity", label: "Activity" },
      ]}
      activeTab={tab}
      onTab={setTab}
      actions={
        <DrawerActions
          doc={doc}
          resolved={resolved}
          onAccept={() => onAccept(doc)}
          onReject={() => onReject(doc)}
          onDownload={downloadDoc}
          onPrint={printDoc}
        />
      }
    >
      {tab === "document" ? (
        <div className="space-y-4">
          {/* Identity summary: status + pages + reviewer */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <StatusChip tone={tone}>{STATUS_LABEL[doc.status]}</StatusChip>
            <span className="text-[0.72rem] text-slate tabular-nums">
              {doc.pages} {doc.pages === 1 ? "page" : "pages"}
            </span>
            <span className="text-[0.72rem] text-slate">{doc.meta}</span>
          </div>

          {tcName ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-mist bg-paper px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <Avatar name={tcName} slug={tcSlug} size={30} ring />
                <div>
                  <p className="eyebrow text-slate">Transaction coordinator</p>
                  <p className="text-[0.82rem] font-semibold text-ink">{tcName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onAskAi(doc)}
                className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.74rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
              >
                <MatinMark theme="dark" className="h-3.5 w-3.5" />
                Ask Matin
              </button>
            </div>
          ) : null}

          {/* The REAL branded letterhead preview — green ✓ filled / red-outline
              missing field grid; click a missing item to see what's needed. The
              id wrapper lets the footer "Print" scope a Save-as-PDF to just this
              document. */}
          <div id={docDomId}>
            <BrandedDocument
              variant={variant}
              formId={formId}
              title={doc.name}
              recipient={dealAddress}
              completion={completion}
              page={1}
              pages={doc.pages}
              fields={fieldsFor(doc, dealMeta)}
              agent={
                tcName
                  ? { name: tcName, slug: tcSlug, title: "Transaction Coordinator" }
                  : undefined
              }
            />
          </div>

          {doc.missing && doc.missing.length > 0 ? (
            <div className="flex items-start gap-2 rounded-xl bg-gold-soft px-3 py-2.5 ring-1 ring-inset ring-gold/25">
              <span className="mt-px shrink-0 text-gold-ink/80" aria-hidden>
                <MatinMark theme="dark" className="h-3.5 w-3.5" />
              </span>
              <p className="text-[0.76rem] leading-snug text-gold-ink">
                Matin flagged {doc.missing.length}{" "}
                {doc.missing.length === 1 ? "item" : "items"} to resolve before this
                document can be accepted — shown as red-outline rows above.
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[0.78rem] leading-relaxed text-slate">
            Full history for{" "}
            <span className="font-medium text-ink">{dealAddress}</span> — every
            status change is recorded here.
          </p>
          {activity.length > 0 ? (
            <ActivityTimeline items={activity} />
          ) : (
            <p className="py-6 text-center text-[0.8rem] text-slate">
              No activity recorded yet.
            </p>
          )}
        </div>
      )}
    </RecordDrawer>
  );
}

function DrawerActions({
  doc,
  resolved,
  onAccept,
  onReject,
  onDownload,
  onPrint,
}: {
  doc: DealDocument;
  resolved: boolean;
  onAccept: () => void;
  onReject: () => void;
  onDownload: () => void;
  onPrint: () => void;
}) {
  // Send-for-signature has a 3-state lifecycle (idle → sending → sent) so the
  // click produces real inline feedback instead of being a dead control.
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent">("idle");
  function sendForSignature() {
    if (sendState !== "idle") return;
    setSendState("sending");
    window.setTimeout(() => setSendState("sent"), 900);
  }

  // Once accepted/rejected the verdict buttons collapse into a confirmation +
  // a single Send-for-signature affordance (light, human-primary).
  if (resolved) {
    return (
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[0.8rem] font-medium",
            doc.status === "complete" ? "text-success" : "text-danger",
          )}
        >
          {doc.status === "complete" ? (
            <>
              <CircleCheck className="h-4 w-4" /> Accepted
            </>
          ) : (
            <>
              <X className="h-4 w-4" /> Rejected — correction requested
            </>
          )}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <GhostBtn icon={<Download className="h-3.5 w-3.5" />} label="Download" doneLabel="Downloaded" onFire={onDownload} />
          <GhostBtn icon={<Printer className="h-3.5 w-3.5" />} label="Print" doneLabel="Sent to printer" onFire={onPrint} />
          {doc.status === "complete" ? (
            <button
              type="button"
              onClick={sendForSignature}
              disabled={sendState !== "idle"}
              className={cn(
                "inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.78rem] font-medium transition-colors disabled:cursor-default",
                sendState === "sent"
                  ? "bg-success text-cloud"
                  : "bg-ink text-cloud hover:bg-ink-800 disabled:opacity-70",
              )}
            >
              {sendState === "sending" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : sendState === "sent" ? (
                <CircleCheck className="h-3.5 w-3.5" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {sendState === "sending" ? "Sending…" : sendState === "sent" ? "Sent for signature" : "Send for signature"}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <GhostBtn icon={<Download className="h-3.5 w-3.5" />} label="Download" doneLabel="Downloaded" onFire={onDownload} />
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onReject}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-danger/30 bg-danger/[0.06] px-3 py-1.5 text-[0.78rem] font-semibold text-danger transition-colors hover:bg-danger/10"
        >
          <X className="h-3.5 w-3.5" /> Reject
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-success px-3.5 py-1.5 text-[0.78rem] font-semibold text-cloud transition-colors hover:bg-success/90"
        >
          <CircleCheck className="h-3.5 w-3.5" /> Accept
        </button>
      </div>
    </div>
  );
}

/* A utility document action (Download / Print) — runs a REAL side effect
   (`onFire`: download a .txt, scope-print the branded doc) and flashes a brief
   confirmation, so it is never a dead control (mandate 1). */
function GhostBtn({
  icon,
  label,
  doneLabel,
  onFire,
}: {
  icon: ReactNode;
  label: string;
  doneLabel: string;
  onFire?: () => void;
}) {
  const [done, setDone] = useState(false);
  function fire() {
    onFire?.();
    setDone(true);
    window.setTimeout(() => setDone(false), 1800);
  }
  return (
    <button
      type="button"
      onClick={fire}
      className={cn(
        "inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.78rem] font-medium transition-colors",
        done
          ? "border-success/40 bg-success/[0.08] text-success"
          : "border-mist bg-cloud text-ink hover:bg-paper",
      )}
    >
      {done ? <Check className="h-3.5 w-3.5" /> : icon}
      {done ? doneLabel : label}
    </button>
  );
}
