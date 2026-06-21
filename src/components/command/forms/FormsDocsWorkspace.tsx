"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  PenLine,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Eye,
  Download,
  Printer,
  Send,
  RotateCcw,
  Sparkles,
  Loader2,
  ChevronRight,
} from "lucide-react";
import {
  KpiStrip,
  KpiCard,
  StatusChip,
  DocumentPreview,
  CalloutCard,
  AIInsightChip,
  EmptyState,
  useAiSidecar,
} from "@/components/os";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import {
  PACKETS,
  STATUS_META,
  packetMetrics,
  type Packet,
  type PacketDoc,
} from "./packets";

/* ──────────────────────────────────────────────────────────────────────────
   Forms & Docs — packet center (build-reference §2.7)

   Three panes inside the global app shell:
     (1) Packet list   — reusable templates as rows; selected = dark-filled.
     (2) Document preview stack — SCROLLABLE 2-col grid of DocumentPreview cards.
     (3) Selected document actions — Preview / Download / Print (light),
         Send for signature (ink primary), Request correction; an AI
         missing-field check wired to streamAi('form-suggest'); and a bordered
         monospace "Automation after send" note.

   Gold is rationed to the AI affordance only (the missing-field check + Ask AI
   sidecar). Primary human action (Send for signature) is ink-filled.
   ────────────────────────────────────────────────────────────────────────── */

export function FormsDocsWorkspace() {
  const m = useMemo(() => packetMetrics(), []);
  const { openAi } = useAiSidecar();

  const [packetId, setPacketId] = useState<string>(PACKETS[0].id);
  const packet = PACKETS.find((p) => p.id === packetId) ?? PACKETS[0];

  // Selected document (defaults to the first incomplete doc so actions are useful).
  const [docId, setDocId] = useState<string>(firstActionableDoc(PACKETS[0]).id);
  const doc =
    packet.docs.find((d) => d.id === docId) ?? firstActionableDoc(packet);

  function selectPacket(next: Packet) {
    setPacketId(next.id);
    setDocId(firstActionableDoc(next).id);
    setCheckOut("");
  }

  function selectDoc(next: PacketDoc) {
    setDocId(next.id);
    setCheckOut("");
  }

  // ── AI missing-field check (streamAi 'form-suggest') ─────────────────────
  const [checkOut, setCheckOut] = useState("");
  const [checkBusy, setCheckBusy] = useState(false);

  async function runFieldCheck() {
    if (checkBusy) return;
    setCheckBusy(true);
    setCheckOut("");
    const situation =
      `Validate the document "${doc.title}" (${doc.code}) in the "${packet.name}" packet ` +
      `for ${packet.subject}. Page ${doc.page} of ${doc.pages}. ` +
      (doc.missing?.length
        ? `Known gaps: ${doc.missing.join("; ")}. `
        : `No gaps flagged yet — confirm it is send-ready. `) +
      `List exactly which required fields, initials, or signatures are missing and where (page numbers), then state whether it is safe to send for signature.`;
    try {
      await streamAi(
        { tool: "form-suggest", input: { situation } },
        (_c, full) => setCheckOut(full),
      );
    } finally {
      setCheckBusy(false);
    }
  }

  const docMeta = STATUS_META[doc.status];
  const sendBlocked = doc.status === "required" || doc.status === "needs-initials";

  return (
    <div className="space-y-5 px-4 pb-10 pt-4 md:px-6">
      {/* Subtitle / eyebrow */}
      <p className="text-[0.82rem] leading-snug text-slate">
        Document packets, templates, e-signature, and compliance — replacing
        scattered PDFs and Google Forms.
      </p>

      {/* KPI strip */}
      <KpiStrip className="xl:grid-cols-5">
        <KpiCard
          label="Packets in progress"
          value={m.inProgress}
          icon={<Layers className="h-4 w-4" />}
          hint="Templates with open documents"
          onDrill={() => openAi("Context: Forms & Docs / Packets in progress")}
        />
        <KpiCard
          label="Awaiting signature"
          value={m.awaitingSignature}
          valueTone="danger"
          icon={<PenLine className="h-4 w-4" />}
          delta="needs initials"
          deltaTone="down"
          hint="Documents out for e-sign"
          onDrill={() => openAi("Context: Forms & Docs / Awaiting signature")}
        />
        <KpiCard
          label="Missing fields"
          value={m.missingFields}
          valueTone="danger"
          icon={<AlertTriangle className="h-4 w-4" />}
          hint="Blocking required fields"
          onDrill={() => openAi("Context: Forms & Docs / Missing fields")}
        />
        <KpiCard
          label="Completed this week"
          value={m.completedThisWeek}
          valueTone="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
          delta="+6 vs last wk"
          deltaTone="up"
          hint="Fully executed documents"
          onDrill={() => openAi("Context: Forms & Docs / Completed this week")}
        />
        <KpiCard
          label="Templates"
          value={m.templates}
          icon={<FileText className="h-4 w-4" />}
          hint="OREF + Matin packet library"
          onDrill={() => openAi("Context: Forms & Docs / Template library")}
        />
      </KpiStrip>

      {/* 3 panes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)_320px] xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        {/* Pane 1 — Packet list */}
        <PacketListPane
          packets={PACKETS}
          activeId={packet.id}
          onSelect={selectPacket}
        />

        {/* Pane 2 — Document preview stack (scrollable) */}
        <DocStackPane
          packet={packet}
          activeDocId={doc.id}
          onSelect={selectDoc}
        />

        {/* Pane 3 — Selected document actions */}
        <ActionsPane
          packet={packet}
          doc={doc}
          docStatusLabel={docMeta.label}
          docStatusTone={docMeta.tone}
          sendBlocked={sendBlocked}
          checkOut={checkOut}
          checkBusy={checkBusy}
          onRunCheck={runFieldCheck}
          onAskAi={() =>
            openAi(`Context: Forms & Docs / ${packet.name} · ${doc.code}`)
          }
        />
      </div>
    </div>
  );
}

/* ── Pane 1: Packet list ─────────────────────────────────────────────────── */

function PacketListPane({
  packets,
  activeId,
  onSelect,
}: {
  packets: Packet[];
  activeId: string;
  onSelect: (p: Packet) => void;
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft lg:max-h-[calc(100vh-15.5rem)]">
      <header className="flex items-center justify-between border-b border-mist px-4 py-3">
        <h2 className="font-display text-[0.98rem] font-normal text-ink">
          Packet list
        </h2>
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate">
          {packets.length}
        </span>
      </header>
      <ul className="flex-1 overflow-y-auto p-2">
        {packets.map((p) => {
          const active = p.id === activeId;
          const open = p.docs.filter((d) => d.status !== "complete").length;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelect(p)}
                aria-pressed={active}
                className={cn(
                  "group mb-1 flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                  active
                    ? "bg-ink text-cloud"
                    : "hover:bg-paper-200",
                )}
              >
                <FileText
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    active ? "text-cloud" : "text-slate",
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-[0.86rem] font-semibold leading-tight",
                      active ? "text-cloud" : "text-ink",
                    )}
                  >
                    {p.name}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block truncate text-[0.72rem] leading-tight",
                      active ? "text-slate-300" : "text-slate",
                    )}
                  >
                    {p.subject}
                  </span>
                </span>
                <span
                  className={cn(
                    "mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[0.66rem] font-semibold tabular-nums",
                    open === 0
                      ? active
                        ? "bg-cloud/15 text-slate-300"
                        : "bg-success/12 text-success ring-1 ring-inset ring-success/25"
                      : active
                        ? "bg-cloud/15 text-cloud"
                        : "bg-warn/15 text-warn ring-1 ring-inset ring-warn/30",
                  )}
                >
                  {open === 0 ? "Done" : `${open} open`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ── Pane 2: Document preview stack ──────────────────────────────────────── */

function DocStackPane({
  packet,
  activeDocId,
  onSelect,
}: {
  packet: Packet;
  activeDocId: string;
  onSelect: (d: PacketDoc) => void;
}) {
  const total = packet.docs.length;
  const done = packet.docs.filter((d) => d.status === "complete").length;

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft lg:max-h-[calc(100vh-15.5rem)]">
      <header className="flex items-start justify-between gap-3 border-b border-mist px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate font-display text-[0.98rem] font-normal text-ink">
            {packet.name}
          </h2>
          <p className="mt-0.5 truncate text-[0.74rem] text-slate">
            {packet.subject}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-[0.74rem] font-semibold text-ink tabular-nums">
            {done}/{total} complete
          </span>
          <p className="mt-0.5 font-mono text-[0.64rem] leading-none text-slate">
            {packet.lastUpdated}
          </p>
        </div>
      </header>

      {packet.docs.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="No documents in this packet"
            body="Choose a template to auto-fill documents from the source record, or add a form manually."
            icon={<FileText className="h-5 w-5" />}
          />
        </div>
      ) : (
        /* SCROLLABLE 2-col grid — all docs reachable past the fold */
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {packet.docs.map((d) => {
              const meta = STATUS_META[d.status];
              const active = d.id === activeDocId;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onSelect(d)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-xl text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
                    active
                      ? "ring-2 ring-ink ring-offset-2 ring-offset-cloud"
                      : "hover:shadow-lift",
                  )}
                >
                  <DocumentPreview
                    title={
                      <span className="flex items-baseline gap-2">
                        <span className="font-mono text-[0.7rem] font-semibold text-slate">
                          {d.code}
                        </span>
                        <span className="truncate">{d.title}</span>
                      </span>
                    }
                    status={meta.label}
                    statusTone={meta.tone}
                    lines={d.lines}
                    signatureField={d.signatureField}
                    page={d.page}
                    pages={d.pages}
                    missing={d.missing}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

/* ── Pane 3: Selected document actions ───────────────────────────────────── */

function ActionsPane({
  packet,
  doc,
  docStatusLabel,
  docStatusTone,
  sendBlocked,
  checkOut,
  checkBusy,
  onRunCheck,
  onAskAi,
}: {
  packet: Packet;
  doc: PacketDoc;
  docStatusLabel: string;
  docStatusTone: "success" | "danger" | "warn" | "info" | "ink" | "gold";
  sendBlocked: boolean;
  checkOut: string;
  checkBusy: boolean;
  onRunCheck: () => void;
  onAskAi: () => void;
}) {
  const missingCount = doc.missing?.length ?? 0;

  return (
    <section className="flex flex-col gap-4">
      {/* Selected-document header card */}
      <div className="rounded-2xl border border-mist bg-cloud p-4 shadow-soft">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[0.72rem] font-semibold text-slate">
            {doc.code}
          </span>
          <StatusChip tone={docStatusTone}>{docStatusLabel}</StatusChip>
        </div>
        <h2 className="mt-1.5 font-display text-[1.02rem] font-normal leading-snug text-ink">
          {doc.title}
        </h2>
        <p className="mt-1 text-[0.74rem] text-slate">
          {packet.name} · Page {doc.page} of {doc.pages}
        </p>

        {/* Light actions */}
        <div className="mt-3.5 grid grid-cols-3 gap-2">
          <GhostBtn icon={<Eye className="h-3.5 w-3.5" />}>Preview</GhostBtn>
          <GhostBtn icon={<Download className="h-3.5 w-3.5" />}>PDF</GhostBtn>
          <GhostBtn icon={<Printer className="h-3.5 w-3.5" />}>Print</GhostBtn>
        </div>

        {/* Primary ink action + correction */}
        <button
          type="button"
          disabled={sendBlocked}
          className={cn(
            "mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[0.84rem] font-semibold transition-colors",
            sendBlocked
              ? "cursor-not-allowed bg-paper-200 text-slate"
              : "bg-ink text-cloud hover:bg-ink-800",
          )}
        >
          <Send className="h-4 w-4" />
          Send for signature
        </button>
        {sendBlocked ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-[0.72rem] text-danger">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            {missingCount > 0
              ? `${missingCount} field${missingCount > 1 ? "s" : ""} block sending`
              : "Resolve required fields before sending"}
          </p>
        ) : null}

        <button
          type="button"
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-mist bg-cloud px-4 py-2 text-[0.82rem] font-medium text-ink transition-colors hover:border-ink/20"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Request correction
        </button>
      </div>

      {/* AI missing-field check (gold AI affordance) */}
      <div className="rounded-2xl border border-mist bg-cloud p-4 shadow-soft">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-[0.92rem] font-normal text-ink">
            Missing-field check
          </h3>
          <AIInsightChip>Matin AI</AIInsightChip>
        </div>
        <p className="mt-1.5 text-[0.76rem] leading-snug text-slate">
          AI inspects required fields, initials, and signatures — and tells you
          exactly what&apos;s incomplete and where.
        </p>

        {missingCount > 0 ? (
          <ul className="mt-2.5 space-y-1">
            {doc.missing!.map((mi, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-[0.76rem] text-danger"
              >
                <ChevronRight className="mt-0.5 h-3 w-3 shrink-0" />
                {mi}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2.5 flex items-center gap-1.5 text-[0.76rem] text-success">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            No blocking fields detected — looks send-ready.
          </p>
        )}

        <button
          type="button"
          onClick={onRunCheck}
          disabled={checkBusy}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2 text-[0.82rem] font-semibold text-ink transition-colors hover:bg-gold-bright disabled:opacity-60"
        >
          {checkBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {checkBusy ? "Checking fields…" : "Run AI field check"}
        </button>

        {checkOut ? (
          <div className="mt-3 rounded-xl border border-mist bg-paper px-3.5 py-3 text-[0.78rem] leading-relaxed text-ink">
            <p className="whitespace-pre-wrap">{checkOut}</p>
          </div>
        ) : null}
      </div>

      {/* Automation after send — bordered monospace note */}
      <CalloutCard
        tone="system"
        title="Automation after send"
        action={
          <button
            type="button"
            onClick={onAskAi}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ask AI
          </button>
        }
      >
        <div className="rounded-lg border border-ink-700 bg-ink-900/60 px-3 py-2.5 font-mono text-[0.72rem] leading-relaxed text-slate-300">
          <p>→ signature_envelope sent · e-sign requested</p>
          <p>→ activity_event logged to packet timeline</p>
          <p>→ signer reminder scheduled · +3 days</p>
          <p>→ transaction checklist updated · status synced</p>
        </div>
      </CalloutCard>
    </section>
  );
}

/* ── small atoms ─────────────────────────────────────────────────────────── */

function GhostBtn({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-mist bg-cloud px-2 py-2 text-[0.76rem] font-medium text-ink transition-colors hover:border-ink/20"
    >
      {icon}
      {children}
    </button>
  );
}

function firstActionableDoc(p: Packet): PacketDoc {
  return p.docs.find((d) => d.status !== "complete") ?? p.docs[0];
}
