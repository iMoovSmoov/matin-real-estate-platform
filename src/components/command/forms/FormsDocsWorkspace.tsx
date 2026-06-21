"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  PenLine,
  TriangleAlert,
  CircleCheck,
  Layers,
  Eye,
  Download,
  Printer,
  Send,
  RotateCcw,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
} from "lucide-react";
import {
  KpiStrip,
  KpiCard,
  StatusChip,
  DocumentPreview,
  CalloutCard,
  EmptyState,
  Avatar,
  PropertyThumb,
  useAiSidecar,
} from "@/components/os";
import { MatinMark } from "@/components/brand/Logo";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import {
  PACKETS,
  STATUS_META,
  packetMetrics,
  isSendBlocked,
  isOpenDoc,
  type Packet,
  type PacketDoc,
} from "./packets";
import { DocumentDrawer } from "./DocumentDrawer";
import { NewPacketDrawer } from "./NewPacketDrawer";

/* ──────────────────────────────────────────────────────────────────────────
   Forms & Docs — packet center (build-reference §2.7)

   Three panes inside the global app shell:
     (1) Packet list   — reusable templates as rows; selected = dark-filled;
         owner Avatar + live open-count; "+ New packet" appends to state.
     (2) Document preview stack — SCROLLABLE 2-col grid of DocumentPreview cards.
         Card click selects (drives the detail pane); "View" opens the doc in a
         paginated RecordDrawer; per-card kebab renames / duplicates / deletes.
     (3) Selected document actions — Preview / Download / Print (real inline
         confirmations), Send for signature (ink primary, mutates state),
         Request correction; an AI missing-field check streamed inline; and a
         bordered monospace "Automation after send" note.

   THE #1 RULE: every click does its real job. The global AI sidecar opens ONLY
   from an explicit "Ask AI" affordance. KPIs FILTER the list. Gold is rationed
   to AI; the primary human action (Send) is ink-filled.
   ────────────────────────────────────────────────────────────────────────── */

/** KPI-driven saved views — clicking a KPI filters the packet list. */
type ViewKey = "all" | "in-progress" | "awaiting" | "missing" | "completed";

export function FormsDocsWorkspace() {
  const { openAi } = useAiSidecar();

  // LIVE packet state — the single source of truth all panes + KPIs read from.
  const [packets, setPackets] = useState<Packet[]>(() =>
    PACKETS.map((p) => ({ ...p, docs: p.docs.map((d) => ({ ...d })) })),
  );

  const m = useMemo(() => packetMetrics(packets), [packets]);

  const [view, setView] = useState<ViewKey>("all");
  const filteredPackets = useMemo(
    () => filterPackets(packets, view),
    [packets, view],
  );

  // Selected packet + document (kept valid as state mutates).
  const [packetId, setPacketId] = useState<string>(packets[0].id);
  const packet =
    filteredPackets.find((p) => p.id === packetId) ??
    packets.find((p) => p.id === packetId) ??
    filteredPackets[0] ??
    packets[0];

  const [docId, setDocId] = useState<string>(firstActionableDoc(packets[0]).id);
  const doc =
    packet.docs.find((d) => d.id === docId) ?? firstActionableDoc(packet);

  // Drawers
  const [drawerDocId, setDrawerDocId] = useState<string | null>(null);
  const drawerDoc = drawerDocId
    ? packet.docs.find((d) => d.id === drawerDocId) ?? null
    : null;
  const [newOpen, setNewOpen] = useState(false);

  // AI field check (pane 3) — streamed inline, NOT into the sidecar.
  const [checkOut, setCheckOut] = useState("");
  const [checkBusy, setCheckBusy] = useState(false);

  // Inline confirmation toast for pane-3 mutations.
  const [paneConfirm, setPaneConfirm] = useState<string | null>(null);

  function flashPane(message: string) {
    setPaneConfirm(message);
    window.setTimeout(
      () => setPaneConfirm((n) => (n === message ? null : n)),
      3000,
    );
  }

  function selectPacket(next: Packet) {
    setPacketId(next.id);
    setDocId(firstActionableDoc(next).id);
    setCheckOut("");
    setPaneConfirm(null);
  }

  function selectDoc(next: PacketDoc) {
    setDocId(next.id);
    setCheckOut("");
    setPaneConfirm(null);
  }

  function setView_(next: ViewKey) {
    setView(next);
    // Keep the selected packet valid against the new filter.
    const list = filterPackets(packets, next);
    if (list.length && !list.some((p) => p.id === packetId)) {
      selectPacket(list[0]);
    }
  }

  /* ── Mutations (all local state; every action is real) ─────────────────── */

  function mutateDoc(
    targetId: string,
    fn: (d: PacketDoc) => PacketDoc,
  ) {
    setPackets((prev) =>
      prev.map((p) => ({
        ...p,
        docs: p.docs.map((d) => (d.id === targetId ? fn(d) : d)),
      })),
    );
  }

  function sendDoc(targetId: string) {
    mutateDoc(targetId, (d) =>
      isSendBlocked(d.status) ? d : { ...d, status: "sent" },
    );
  }

  function requestCorrection(targetId: string) {
    mutateDoc(targetId, (d) => ({
      ...d,
      status: "correction",
      missing: d.missing ?? ["Returned for correction — awaiting owner edit"],
    }));
  }

  function resolveFields(targetId: string) {
    mutateDoc(targetId, (d) => ({ ...d, status: "draft", missing: undefined }));
  }

  function renameDoc(targetId: string, title: string) {
    mutateDoc(targetId, (d) => ({ ...d, title }));
  }

  function duplicateDoc(targetPacketId: string, source: PacketDoc) {
    setPackets((prev) =>
      prev.map((p) => {
        if (p.id !== targetPacketId) return p;
        const copy: PacketDoc = {
          ...source,
          id: `${source.id}-COPY-${Date.now().toString(36).slice(-4)}`,
          title: `${source.title} (copy)`,
          status: "draft",
          page: 1,
          missing: undefined,
        };
        const idx = p.docs.findIndex((d) => d.id === source.id);
        const docs = [...p.docs];
        docs.splice(idx + 1, 0, copy);
        return { ...p, docs };
      }),
    );
  }

  function deleteDoc(targetPacketId: string, targetId: string) {
    setPackets((prev) =>
      prev.map((p) =>
        p.id === targetPacketId
          ? { ...p, docs: p.docs.filter((d) => d.id !== targetId) }
          : p,
      ),
    );
    if (docId === targetId) {
      const remaining = packet.docs.filter((d) => d.id !== targetId);
      if (remaining.length) setDocId(firstActionableDoc({ ...packet, docs: remaining }).id);
    }
    if (drawerDocId === targetId) setDrawerDocId(null);
  }

  function createPacket(next: Packet) {
    setPackets((prev) => [next, ...prev]);
    setView("all");
    setPacketId(next.id);
    setDocId(firstActionableDoc(next).id);
    flashPane(`Packet created · ${next.name} for ${next.subject}.`);
  }

  /* ── AI missing-field check (streamAi 'form-suggest', inline) ──────────── */

  async function runFieldCheck() {
    if (checkBusy) return;
    setCheckBusy(true);
    setCheckOut("");
    const missing = doc.missing ?? [];
    const situation =
      `Validate the document "${doc.title}" (${doc.code}) in the "${packet.name}" packet ` +
      `for ${packet.subject}. The document is ${doc.pages} page${doc.pages > 1 ? "s" : ""}. ` +
      (missing.length
        ? `Known gaps: ${missing.join("; ")}. `
        : `No gaps flagged yet — confirm it is send-ready. `) +
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

  /* ── Pane-3 send / correction (with inline confirmation) ───────────────── */

  function paneSend() {
    if (isSendBlocked(doc.status)) return;
    sendDoc(doc.id);
    flashPane(`${doc.code} sent for signature · envelope created.`);
  }

  function paneCorrection() {
    requestCorrection(doc.id);
    flashPane(`${doc.code} returned for correction.`);
  }

  function paneResolve() {
    resolveFields(doc.id);
    flashPane(`${doc.code} fields resolved · now send-ready.`);
  }

  const docMeta = STATUS_META[doc.status];
  const sendBlocked = isSendBlocked(doc.status);

  return (
    <div className="space-y-5 px-4 pb-10 pt-4 md:px-6">
      {/* Subtitle / eyebrow + create */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-[0.82rem] leading-snug text-slate">
          Document packets, templates, e-signature, and compliance — replacing
          scattered PDFs and Google Forms. Pick a packet, inspect a document,
          and send it for signature when it&apos;s clean.
        </p>
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-[0.82rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
        >
          <Plus className="h-4 w-4" />
          New packet
        </button>
      </div>

      {/* KPI strip — each tile FILTERS the packet list (saved-view drilldown).
          The active filter's tile gets an ink ring so the drilldown reads as a
          selectable view, not just a stat. */}
      <KpiStrip className="xl:grid-cols-5">
        <KpiCard
          label="Packets in progress"
          value={m.inProgress}
          icon={<Layers className="h-4 w-4" />}
          hint="Templates with open documents"
          className={activeKpiClass(view === "in-progress")}
          onDrill={() => setView_("in-progress")}
        />
        <KpiCard
          label="Awaiting signature"
          value={m.awaitingSignature}
          valueTone="danger"
          icon={<PenLine className="h-4 w-4" />}
          delta="needs initials · out for e-sign"
          deltaTone="down"
          hint="Documents out for e-sign or needing initials"
          className={activeKpiClass(view === "awaiting")}
          onDrill={() => setView_("awaiting")}
        />
        <KpiCard
          label="Missing fields"
          value={m.missingFields}
          valueTone="danger"
          icon={<TriangleAlert className="h-4 w-4" />}
          hint="Blocking required fields"
          className={activeKpiClass(view === "missing")}
          onDrill={() => setView_("missing")}
        />
        <KpiCard
          label="Completed this week"
          value={m.completedThisWeek}
          valueTone="success"
          icon={<CircleCheck className="h-4 w-4" />}
          delta="+6 vs last wk"
          deltaTone="up"
          hint="Fully executed documents"
          className={activeKpiClass(view === "completed")}
          onDrill={() => setView_("completed")}
        />
        <KpiCard
          label="Templates"
          value={m.templates}
          icon={<FileText className="h-4 w-4" />}
          hint="OREF + Matin packet library"
          className={activeKpiClass(view === "all")}
          onDrill={() => setView_("all")}
        />
      </KpiStrip>

      {/* Active-filter row */}
      {view !== "all" ? (
        <div className="flex items-center gap-2 text-[0.78rem]">
          <span className="text-slate">Filtered:</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 font-medium text-cloud">
            {VIEW_LABEL[view]} · {filteredPackets.length} packet
            {filteredPackets.length === 1 ? "" : "s"}
            <button
              type="button"
              onClick={() => setView_("all")}
              className="-mr-0.5 rounded-full p-0.5 text-slate-300 transition-colors hover:text-cloud"
              aria-label="Clear filter"
            >
              <ChevronRight className="h-3 w-3 rotate-45" />
            </button>
          </span>
        </div>
      ) : null}

      {/* 3 panes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)_340px] xl:grid-cols-[280px_minmax(0,1fr)_372px]">
        {/* Pane 1 — Packet list */}
        <PacketListPane
          packets={filteredPackets}
          activeId={packet.id}
          onSelect={selectPacket}
          onNew={() => setNewOpen(true)}
        />

        {/* Pane 2 — Document preview stack (scrollable) */}
        <DocStackPane
          packet={packet}
          activeDocId={doc.id}
          onSelect={selectDoc}
          onView={(d) => setDrawerDocId(d.id)}
          onNew={() => setNewOpen(true)}
          onRename={(d) => {
            const next = window.prompt("Rename document", d.title);
            if (next && next.trim()) renameDoc(d.id, next.trim());
          }}
          onDuplicate={(d) => duplicateDoc(packet.id, d)}
          onDelete={(d) => deleteDoc(packet.id, d.id)}
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
          confirm={paneConfirm}
          onRunCheck={runFieldCheck}
          onSend={paneSend}
          onCorrection={paneCorrection}
          onResolve={paneResolve}
          onView={() => setDrawerDocId(doc.id)}
          onAskAi={() =>
            openAi(`Context: Forms & Docs / ${packet.name} · ${doc.code}`)
          }
        />
      </div>

      {/* Document drawer — real "View" record inspection */}
      <DocumentDrawer
        open={drawerDoc != null}
        onClose={() => setDrawerDocId(null)}
        packet={packet}
        doc={drawerDoc}
        onSend={(id) => {
          sendDoc(id);
        }}
        onRequestCorrection={(id) => requestCorrection(id)}
        onResolveFields={(id) => resolveFields(id)}
      />

      {/* New-packet form drawer */}
      <NewPacketDrawer
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={createPacket}
        index={packets.length}
      />
    </div>
  );
}

const VIEW_LABEL: Record<ViewKey, string> = {
  all: "All packets",
  "in-progress": "Packets in progress",
  awaiting: "Awaiting signature",
  missing: "Missing fields",
  completed: "Has completed docs",
};

function filterPackets(packets: Packet[], view: ViewKey): Packet[] {
  switch (view) {
    case "in-progress":
      return packets.filter((p) => p.docs.some((d) => isOpenDoc(d.status)));
    case "awaiting":
      return packets.filter((p) =>
        p.docs.some((d) => d.status === "needs-initials" || d.status === "sent"),
      );
    case "missing":
      return packets.filter((p) =>
        p.docs.some((d) => (d.missing?.length ?? 0) > 0),
      );
    case "completed":
      return packets.filter((p) => p.docs.some((d) => d.status === "complete"));
    default:
      return packets;
  }
}

/* ── Pane 1: Packet list ─────────────────────────────────────────────────── */

function PacketListPane({
  packets,
  activeId,
  onSelect,
  onNew,
}: {
  packets: Packet[];
  activeId: string;
  onSelect: (p: Packet) => void;
  onNew: () => void;
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

      {packets.length === 0 ? (
        <div className="p-4">
          <EmptyState
            title="No packets in this view"
            body="No packets match the active filter. Clear the filter or start a new packet from a template."
            actionLabel="New packet"
            onAction={onNew}
            icon={<Layers className="h-5 w-5" />}
          />
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto p-2">
          {packets.map((p) => {
            const active = p.id === activeId;
            const open = p.docs.filter((d) => isOpenDoc(d.status)).length;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onSelect(p)}
                  aria-pressed={active}
                  className={cn(
                    "group mb-1 flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    active ? "bg-ink text-cloud" : "hover:bg-paper-200",
                  )}
                >
                  {/* Owner identity — real headshot Avatar */}
                  <Avatar
                    name={p.ownerName}
                    slug={p.ownerSlug}
                    size={32}
                    ring
                    className={cn("mt-0.5", active && "ring-cloud/25")}
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
      )}

      {/* Footer create affordance */}
      <div className="border-t border-mist p-2">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-mist px-3 py-2 text-[0.8rem] font-medium text-slate transition-colors hover:border-ink/25 hover:text-ink"
        >
          <Plus className="h-3.5 w-3.5" />
          New packet
        </button>
      </div>
    </section>
  );
}

/* ── Pane 2: Document preview stack ──────────────────────────────────────── */

function DocStackPane({
  packet,
  activeDocId,
  onSelect,
  onView,
  onNew,
  onRename,
  onDuplicate,
  onDelete,
}: {
  packet: Packet;
  activeDocId: string;
  onSelect: (d: PacketDoc) => void;
  onView: (d: PacketDoc) => void;
  onNew: () => void;
  onRename: (d: PacketDoc) => void;
  onDuplicate: (d: PacketDoc) => void;
  onDelete: (d: PacketDoc) => void;
}) {
  const total = packet.docs.length;
  const done = packet.docs.filter(
    (d) => d.status === "complete" || d.status === "sent",
  ).length;

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft lg:max-h-[calc(100vh-15.5rem)]">
      {/* Packet hero header — real property photo + owner identity */}
      <header className="flex items-stretch gap-3 border-b border-mist p-3">
        <PropertyThumb
          seedIndex={packet.photoSeed}
          ratio="square"
          alt={packet.subject}
          className="h-16 w-16 shrink-0"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <h2 className="truncate font-display text-[1rem] font-normal leading-tight text-ink">
            {packet.name}
          </h2>
          <p className="mt-0.5 truncate text-[0.76rem] text-slate">
            {packet.subject}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <Avatar name={packet.ownerName} slug={packet.ownerSlug} size={18} />
            <span className="truncate text-[0.72rem] text-slate">
              {packet.lastUpdated}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end justify-center gap-1.5">
          <span className="text-[0.74rem] font-semibold text-ink tabular-nums">
            {done}/{total} done
          </span>
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center gap-1 rounded-lg border border-mist px-2 py-1 text-[0.72rem] font-medium text-ink transition-colors hover:border-ink/20"
          >
            <Plus className="h-3 w-3" />
            Doc
          </button>
        </div>
      </header>

      {packet.docs.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="No documents in this packet"
            body="Seed documents from a template to auto-fill them from the source record, or add a form manually."
            actionLabel="Add documents"
            onAction={onNew}
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
                <div
                  key={d.id}
                  className={cn(
                    "group/card relative rounded-xl transition-shadow",
                    active
                      ? "ring-2 ring-ink ring-offset-2 ring-offset-cloud"
                      : "hover:shadow-lift",
                  )}
                >
                  {/* Card kebab — rename / duplicate / delete */}
                  <DocKebab
                    onRename={() => onRename(d)}
                    onDuplicate={() => onDuplicate(d)}
                    onDelete={() => onDelete(d)}
                  />
                  <button
                    type="button"
                    onClick={() => onSelect(d)}
                    aria-pressed={active}
                    className="w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
                  >
                    <DocumentPreview
                      title={
                        <span className="flex items-baseline gap-2 pr-7">
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
                      actions={
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(d);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              onView(d);
                            }
                          }}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-mist bg-cloud px-2.5 py-1 text-[0.74rem] font-medium text-ink transition-colors hover:border-ink/20"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </span>
                      }
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

/** Per-card kebab menu — rename / duplicate / delete (build-reference §2.7). */
function DocKebab({
  onRename,
  onDuplicate,
  onDelete,
}: {
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute right-2 top-2.5 z-10">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Document options"
        aria-expanded={open}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg text-slate transition-colors hover:bg-paper-200 hover:text-ink",
          open && "bg-paper-200 text-ink",
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <>
          {/* Click-away */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            className="fixed inset-0 z-0 cursor-default"
          />
          <div className="absolute right-0 top-8 z-10 w-40 overflow-hidden rounded-xl border border-mist bg-cloud py-1 shadow-lift">
            <KebabItem
              icon={<Pencil className="h-3.5 w-3.5" />}
              onClick={() => {
                setOpen(false);
                onRename();
              }}
            >
              Rename
            </KebabItem>
            <KebabItem
              icon={<Copy className="h-3.5 w-3.5" />}
              onClick={() => {
                setOpen(false);
                onDuplicate();
              }}
            >
              Duplicate
            </KebabItem>
            <KebabItem
              icon={<Trash2 className="h-3.5 w-3.5" />}
              danger
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              Delete
            </KebabItem>
          </div>
        </>
      ) : null}
    </div>
  );
}

function KebabItem({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8rem] font-medium transition-colors",
        danger
          ? "text-danger hover:bg-danger/[0.06]"
          : "text-ink hover:bg-paper-200",
      )}
    >
      {icon}
      {children}
    </button>
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
  confirm,
  onRunCheck,
  onSend,
  onCorrection,
  onResolve,
  onView,
  onAskAi,
}: {
  packet: Packet;
  doc: PacketDoc;
  docStatusLabel: string;
  docStatusTone: "success" | "danger" | "warn" | "info" | "ink" | "gold";
  sendBlocked: boolean;
  checkOut: string;
  checkBusy: boolean;
  confirm: string | null;
  onRunCheck: () => void;
  onSend: () => void;
  onCorrection: () => void;
  onResolve: () => void;
  onView: () => void;
  onAskAi: () => void;
}) {
  const missing = doc.missing ?? [];
  const missingCount = missing.length;

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

        {/* Inline confirmation toast */}
        {confirm ? (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-success/10 px-3 py-2 text-[0.76rem] leading-snug text-success ring-1 ring-inset ring-success/20">
            <CircleCheck className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{confirm}</span>
          </div>
        ) : null}

        {/* Light actions — open the real record drawer / utilities */}
        <div className="mt-3.5 grid grid-cols-3 gap-2">
          <GhostBtn icon={<Eye className="h-3.5 w-3.5" />} onClick={onView}>
            View
          </GhostBtn>
          <GhostBtn
            icon={<Download className="h-3.5 w-3.5" />}
            onClick={onView}
          >
            PDF
          </GhostBtn>
          <GhostBtn
            icon={<Printer className="h-3.5 w-3.5" />}
            onClick={() => {
              if (typeof window !== "undefined") window.print();
            }}
          >
            Print
          </GhostBtn>
        </div>

        {/* Primary ink action + correction */}
        <button
          type="button"
          onClick={onSend}
          disabled={sendBlocked}
          className={cn(
            "mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[0.84rem] font-semibold transition-colors",
            sendBlocked
              ? "cursor-not-allowed bg-paper-200 text-slate"
              : "bg-ink text-cloud hover:bg-ink-800",
          )}
        >
          <Send className="h-4 w-4" />
          {doc.status === "sent" ? "Resend for signature" : "Send for signature"}
        </button>
        {sendBlocked ? (
          <button
            type="button"
            onClick={onResolve}
            className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-danger/[0.06] px-3 py-1.5 text-[0.74rem] font-medium text-danger ring-1 ring-inset ring-danger/20 transition-colors hover:bg-danger/[0.1]"
          >
            <TriangleAlert className="h-3 w-3 shrink-0" />
            {missingCount > 0
              ? `${missingCount} field${missingCount > 1 ? "s" : ""} block sending — mark resolved`
              : "Required — mark resolved to unblock"}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onCorrection}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-mist bg-cloud px-4 py-2 text-[0.82rem] font-medium text-ink transition-colors hover:border-ink/20"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Request correction
        </button>
      </div>

      {/* AI missing-field check — gold AI affordance; streams inline */}
      <div className="rounded-2xl border border-mist bg-cloud p-4 shadow-soft">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-[0.92rem] font-normal text-ink">
            Missing-field check
          </h3>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-2 py-0.5 text-[0.7rem] font-semibold text-gold-ink ring-1 ring-inset ring-gold/25">
            <MatinMark theme="dark" className="h-3 w-3" />
            Matin AI
          </span>
        </div>
        <p className="mt-1.5 text-[0.76rem] leading-snug text-slate">
          AI inspects required fields, initials, and signatures — and tells you
          exactly what&apos;s incomplete and where.
        </p>

        {missingCount > 0 ? (
          <ul className="mt-2.5 space-y-1">
            {missing.map((mi, i) => (
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
            <CircleCheck className="h-3.5 w-3.5 shrink-0" />
            No blocking fields detected — looks send-ready.
          </p>
        )}

        <button
          type="button"
          onClick={onRunCheck}
          disabled={checkBusy}
          aria-busy={checkBusy}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2 text-[0.82rem] font-semibold text-ink transition-colors hover:bg-gold-bright disabled:opacity-60"
        >
          <MatinMark theme="dark" className="h-3.5 w-3.5" />
          {checkBusy
            ? "Checking fields…"
            : checkOut
              ? "Re-run AI field check"
              : "Run AI field check"}
        </button>

        {checkBusy && !checkOut ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-mist bg-paper px-3.5 py-3 text-[0.78rem] text-slate">
            <MatinMark theme="dark" className="h-3.5 w-3.5" />
            Matin AI is checking the document
            <span className="animate-pulse">…</span>
          </div>
        ) : null}

        {checkOut ? (
          <div className="mt-3 rounded-xl border border-mist bg-paper px-3.5 py-3 text-[0.78rem] leading-relaxed text-ink">
            <p className="whitespace-pre-wrap">{checkOut}</p>
          </div>
        ) : null}
      </div>

      {/* Automation after send — bordered monospace note + the ONE Ask AI opener */}
      <CalloutCard
        tone="system"
        title="Automation after send"
        action={
          <button
            type="button"
            onClick={onAskAi}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
          >
            <MatinMark theme="dark" className="h-3.5 w-3.5" />
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
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
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

function firstActionableDoc(p: Packet): PacketDoc {
  return p.docs.find((d) => isOpenDoc(d.status)) ?? p.docs[0];
}

/** Ink ring on the KPI tile whose filter is currently active. */
function activeKpiClass(active: boolean): string {
  return active ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "";
}
