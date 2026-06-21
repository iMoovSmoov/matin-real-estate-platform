"use client";

import { useState, type ReactNode } from "react";
import {
  Download,
  Printer,
  Send,
  CircleCheck,
  X,
  FileText,
} from "lucide-react";
import {
  RecordDrawer,
  DocumentPreview,
  ActivityTimeline,
  StatusChip,
  Avatar,
  PropertyThumb,
  type ChipTone,
  type ActivityItem,
} from "@/components/os";
import { MatinMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import type { DealDocument, DocStatus } from "./deal-screen";

/* ──────────────────────────────────────────────────────────────────────────
   Transactions — DealDrawer

   The compliance-review drawer (build ref §2.6 "Compliance review mode"):
   a single document opens in a RecordDrawer (right-side, LIGHT) with a dark
   header, a tab strip (Document · Activity), a functional DocumentPreview that
   surfaces exactly what's incomplete and where, and a bottom action bar with
   docked Accept / Reject verdict buttons that MUTATE the parent's doc state
   and write an activity_event.

   Nothing here opens the global AI sidecar; the gold "Ask Matin about this doc"
   is the single explicit AI affordance and it streams nothing on its own — it
   hands the doc up to the parent's inline AI flow via `onAskAi`.
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

export function DealDrawer({
  open,
  onClose,
  doc,
  dealAddress,
  agentName,
  agentSlug,
  seedIndex,
  activity,
  onAccept,
  onReject,
  onAskAi,
}: {
  open: boolean;
  onClose: () => void;
  doc: DealDocument | null;
  dealAddress: string;
  agentName?: string;
  agentSlug?: string;
  seedIndex: number;
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
        />
      }
    >
      {tab === "document" ? (
        <div className="space-y-4">
          {/* Identity summary: property + requirement + agent */}
          <div className="flex items-center gap-3">
            <PropertyThumb
              seedIndex={seedIndex}
              ratio="square"
              alt={dealAddress}
              className="h-16 w-16 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <StatusChip tone={tone}>{STATUS_LABEL[doc.status]}</StatusChip>
                <span className="text-[0.72rem] text-slate tabular-nums">
                  {doc.pages} {doc.pages === 1 ? "page" : "pages"}
                </span>
              </div>
              <p className="mt-1 truncate text-[0.78rem] text-slate">{doc.meta}</p>
            </div>
          </div>

          {agentName ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-mist bg-paper px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <Avatar name={agentName} slug={agentSlug} size={30} ring />
                <div>
                  <p className="eyebrow text-slate">Transaction coordinator</p>
                  <p className="text-[0.82rem] font-semibold text-ink">{agentName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onAskAi(doc)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.74rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
              >
                <MatinMark theme="dark" className="h-3.5 w-3.5" />
                Ask Matin
              </button>
            </div>
          ) : null}

          {/* The functional preview — ruled lines + signature field + missing fields */}
          <DocumentPreview
            title={doc.name}
            status={STATUS_LABEL[doc.status]}
            statusTone={tone}
            lines={8}
            signatureField={doc.signature}
            page={1}
            pages={doc.pages}
            missing={doc.missing}
          />

          {doc.missing && doc.missing.length > 0 ? (
            <div className="flex items-start gap-2 rounded-xl bg-gold-soft px-3 py-2.5 ring-1 ring-inset ring-gold/25">
              <span className="mt-px shrink-0 text-gold-ink/80" aria-hidden>
                <MatinMark theme="dark" className="h-3.5 w-3.5" />
              </span>
              <p className="text-[0.76rem] leading-snug text-gold-ink">
                Matin flagged {doc.missing.length}{" "}
                {doc.missing.length === 1 ? "item" : "items"} to resolve before this
                document can be accepted.
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[0.78rem] leading-relaxed text-slate">
            Audit-friendly chronology for{" "}
            <span className="font-medium text-ink">{dealAddress}</span>. Every
            status change writes an{" "}
            <span className="font-mono text-[0.72rem]">activity_event</span>.
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
}: {
  doc: DealDocument;
  resolved: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  // Once accepted/rejected the verdict buttons collapse into a confirmation +
  // a single Send-for-signature affordance (light, human-primary).
  if (resolved) {
    return (
      <div className="flex w-full items-center justify-between gap-2">
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
        <div className="flex items-center gap-1.5">
          <GhostBtn icon={<Download className="h-3.5 w-3.5" />} label="Download" />
          <GhostBtn icon={<Printer className="h-3.5 w-3.5" />} label="Print" />
          {doc.status === "complete" ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[0.78rem] font-medium text-cloud transition-colors hover:bg-ink-800"
            >
              <Send className="h-3.5 w-3.5" /> Send for signature
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-between gap-2">
      <GhostBtn icon={<FileText className="h-3.5 w-3.5" />} label="Preview" />
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onReject}
          className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 bg-danger/[0.06] px-3 py-1.5 text-[0.78rem] font-semibold text-danger transition-colors hover:bg-danger/10"
        >
          <X className="h-3.5 w-3.5" /> Reject
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3.5 py-1.5 text-[0.78rem] font-semibold text-cloud transition-colors hover:bg-success/90"
        >
          <CircleCheck className="h-3.5 w-3.5" /> Accept
        </button>
      </div>
    </div>
  );
}

function GhostBtn({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-lg border border-mist bg-cloud px-3 py-1.5 text-[0.78rem] font-medium text-ink transition-colors hover:bg-paper"
    >
      {icon}
      {label}
    </button>
  );
}
