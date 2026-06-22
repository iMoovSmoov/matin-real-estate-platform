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
  ListChecks,
} from "lucide-react";
import {
  KpiStrip,
  KpiCard,
  StatusChip,
  BrandedDocument,
  CalloutCard,
  EmptyState,
  Avatar,
  PaneSwitcher,
  usePaneSwitcher,
  useAiSidecar,
} from "@/components/os";
import { MatinMark } from "@/components/brand/Logo";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import { rosterOption } from "@/lib/data/agreement-roster";
import {
  PACKETS,
  STATUS_META,
  packetMetrics,
  packetHero,
  packetProgress,
  docFields,
  docCompletion,
  isSendBlocked,
  isOpenDoc,
  type Packet,
  type PacketDoc,
} from "./packets";
import { DocumentDrawer } from "./DocumentDrawer";
import { NewPacketDrawer } from "./NewPacketDrawer";
import { FormsLibrary } from "./FormsLibrary";
import { scrollIntoView } from "./interactions";

/* ──────────────────────────────────────────────────────────────────────────
   Forms & Docs — packet center (build-reference §2.7; plan S7 1–8)

   Two top-level tabs: PACKETS (the loop workspace) and TEMPLATES (the SkySlope
   OREF/Matin library, wiring the previously-orphaned FormsLibrary/FormTemplate).

   PACKETS workspace — three panes inside the global app shell:
     (1) Packet list   — reusable templates as rows; selected = dark-filled;
         owner Avatar + per-row progress bar + doc count + relative time;
         saved-view pill tabs + bulk multi-select Send/Download.
     (2) Document preview stack — SCROLLABLE grid of REAL branded Matin
         documents (BrandedDocument letterhead, live field grids, green/red
         completion). Card click selects; "View" opens the paginated
         DocumentDrawer; per-card kebab renames / duplicates / deletes.
     (3) Selected document actions — Preview / Download / Print render the
         branded artifact (window.print of the BrandedDocument), Send for
         signature (ink primary, mutates state) shows a Matin e-sign envelope;
         an AI missing-field check streamed inline.

   Mobile (R1): below lg a PaneSwitcher (List · Documents · Actions) shows ONE
   pane at a time; selecting a packet jumps to Documents, selecting a doc jumps
   to Actions. Every click does its real job; the global AI sidecar opens ONLY
   from an explicit "Ask AI" affordance. Gold is rationed to AI.
   ────────────────────────────────────────────────────────────────────────── */

/** KPI-driven saved views — clicking a KPI/pill filters the packet list. */
type ViewKey = "all" | "in-progress" | "awaiting" | "missing" | "completed";
type TopTab = "packets" | "templates";

export function FormsDocsWorkspace() {
  const { openAi } = useAiSidecar();

  const [topTab, setTopTab] = useState<TopTab>("packets");

  // Mobile pane switcher (R1) — List / Documents / Actions.
  const pane = usePaneSwitcher(
    [
      { key: "list", label: "List", icon: <ListChecks className="h-3.5 w-3.5" /> },
      { key: "docs", label: "Documents", icon: <FileText className="h-3.5 w-3.5" /> },
      { key: "actions", label: "Actions", icon: <Send className="h-3.5 w-3.5" /> },
    ],
    "list",
  );

  // Scroll-into-view (R1/R2). The list/docs/actions panes are mounted in both
  // the mobile single-pane stack and the lg+ grid, so we scroll whichever
  // instance is on screen via a data-attribute query rather than a single ref.
  function isDesktopWidth() {
    return typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
  }

  /** Scroll the on-screen instance of a pane region (mobile or lg+ copy). The
     query runs inside scrollIntoView's deferred (double-rAF) callback via a
     getter, so a just-switched mobile pane is found AFTER it mounts. */
  function scrollPaneIntoView(attr: string) {
    if (typeof document === "undefined") return;
    scrollIntoView(() => {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>(`[${attr}]`),
      );
      return nodes.find((n) => n.offsetParent !== null) ?? nodes[0] ?? null;
    }, "start");
  }

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

  // Bulk multi-select (packets) — drives the bulk Send/Download cluster.
  const [selectedPackets, setSelectedPackets] = useState<Set<string>>(new Set());

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
    // Visible result of the tap (R1/R2): mobile jumps to the Documents pane;
    // both layouts scroll the document stack into view.
    if (!isDesktopWidth()) pane.go("docs");
    scrollPaneIntoView("data-forms-docs");
  }

  function selectDoc(next: PacketDoc) {
    setDocId(next.id);
    setCheckOut("");
    setPaneConfirm(null);
    // Selecting a document surfaces its action panel — on a narrow screen that
    // panel is off in another pane, so jump to it and scroll it into view.
    if (!isDesktopWidth()) pane.go("actions");
    scrollPaneIntoView("data-forms-actions");
  }

  function setView_(next: ViewKey) {
    setView(next);
    const list = filterPackets(packets, next);
    if (list.length && !list.some((p) => p.id === packetId)) {
      selectPacket(list[0]);
    } else {
      // Filter changed but selection still valid — surface the filtered list.
      if (!isDesktopWidth()) pane.go("list");
      scrollPaneIntoView("data-forms-list");
    }
  }

  /* ── Bulk selection ────────────────────────────────────────────────────── */
  function togglePacketSelect(id: string) {
    setSelectedPackets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function bulkSend() {
    const ids = [...selectedPackets];
    setPackets((prev) =>
      prev.map((p) =>
        selectedPackets.has(p.id)
          ? {
              ...p,
              docs: p.docs.map((d) =>
                isSendBlocked(d.status) ? d : { ...d, status: "sent" as const },
              ),
            }
          : p,
      ),
    );
    flashPane(`Sent ${ids.length} packet${ids.length === 1 ? "" : "s"} for signature · envelopes created.`);
    setSelectedPackets(new Set());
  }

  function bulkDownload() {
    const n = selectedPackets.size;
    flashPane(`Generated branded PDFs for ${n} packet${n === 1 ? "" : "s"}.`);
    if (typeof window !== "undefined") window.print();
    setSelectedPackets(new Set());
  }

  /* ── Mutations (all local state; every action is real) ─────────────────── */

  function mutateDoc(targetId: string, fn: (d: PacketDoc) => PacketDoc) {
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
    flashPane(`${doc.code} sent for signature · Matin e-sign envelope created.`);
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

  /* ── Templates tab (wires the orphaned FormsLibrary) ───────────────────── */
  if (topTab === "templates") {
    return (
      <div className="space-y-5 px-4 pb-10 pt-4 md:px-6">
        <TopTabs topTab={topTab} onTab={setTopTab} templatesCount={m.templates} />
        <p className="max-w-2xl text-[0.82rem] leading-snug text-slate">
          The OREF + Matin template library. Pick a form to open the branded,
          editable document — auto-fill from a real listing or lead, generate
          clause language with AI, and send for e-signature.
        </p>
        <FormsLibrary />
      </div>
    );
  }

  /* ── Pane bodies ──────────────────────────────────────────────────────── */

  const listPane = (
    <PacketListPane
      packets={filteredPackets}
      activeId={packet.id}
      selected={selectedPackets}
      onToggleSelect={togglePacketSelect}
      onSelect={selectPacket}
      onNew={() => setNewOpen(true)}
    />
  );

  const docsPane = (
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
  );

  const actionsPane = (
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
  );

  return (
    <div className="space-y-5 px-4 pb-10 pt-4 md:px-6">
      <TopTabs topTab={topTab} onTab={setTopTab} templatesCount={m.templates} />

      {/* Subtitle / eyebrow + create */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-[0.82rem] leading-snug text-slate">
          Document packets, e-signature, and compliance — replacing scattered
          PDFs and Google Forms. Pick a packet, inspect a real branded document,
          and send it for signature when it&apos;s clean.
        </p>
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-[0.82rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
        >
          <Plus className="h-4 w-4" />
          New packet
        </button>
      </div>

      {/* KPI strip — each tile FILTERS the packet list (saved-view drilldown). */}
      <KpiStrip cols={5} rail>
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
          onDrill={() => setTopTab("templates")}
        />
      </KpiStrip>

      {/* Saved-view pill tabs + utility row (ticket 4) */}
      <SavedViewBar
        view={view}
        onView={setView_}
        counts={savedViewCounts(packets)}
        showing={filteredPackets.length}
        selectedCount={selectedPackets.size}
        confirm={paneConfirm}
        onBulkSend={bulkSend}
        onBulkDownload={bulkDownload}
        onClearSelection={() => setSelectedPackets(new Set())}
      />

      {/* Mobile pane switcher (R1) */}
      <div className="lg:hidden">
        <PaneSwitcher {...pane.switcherProps} />
      </div>

      {/* Below lg: ONE pane at a time */}
      <div className="space-y-4 lg:hidden">
        {pane.is("list") ? (
          <div data-forms-list className="scroll-mt-20 motion-safe:animate-fade">
            {listPane}
          </div>
        ) : null}
        {pane.is("docs") ? (
          <div data-forms-docs className="scroll-mt-20 motion-safe:animate-fade">
            {docsPane}
          </div>
        ) : null}
        {pane.is("actions") ? (
          <div data-forms-actions className="scroll-mt-20 motion-safe:animate-fade">
            {actionsPane}
          </div>
        ) : null}
      </div>

      {/* lg band (1024–1279): 2 panes — list + documents — with the action
          panel full-width BELOW so the branded document never gets crammed into
          a narrow column. xl+: true 3-pane split. */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_372px]">
        <div data-forms-list className="scroll-mt-20">
          {listPane}
        </div>
        <div data-forms-docs className="scroll-mt-20 min-w-0">
          {docsPane}
        </div>
        {/* lg band: the action panel spans both columns underneath the split.
            Its inner card stack becomes a 2-up grid (capped, centered) so the
            cards read at a comfortable width instead of stretching edge-to-edge.
            xl: it returns to a single 372px third column (flex stack). */}
        <div
          data-forms-actions
          className={cn(
            "scroll-mt-20 min-w-0 lg:col-span-2 xl:col-span-1",
            // lg-band only: turn the <section> flex-col into a 2-up grid.
            "lg:[&>section]:mx-auto lg:[&>section]:grid lg:[&>section]:max-w-3xl lg:[&>section]:grid-cols-2 lg:[&>section]:items-start",
            "xl:[&>section]:mx-0 xl:[&>section]:flex xl:[&>section]:max-w-none",
          )}
        >
          {actionsPane}
        </div>
      </div>

      {/* Document drawer — real "View" record inspection */}
      <DocumentDrawer
        open={drawerDoc != null}
        onClose={() => setDrawerDocId(null)}
        packet={packet}
        doc={drawerDoc}
        onSend={(id) => sendDoc(id)}
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

/* ── Top tabs (Packets / Templates) ──────────────────────────────────────── */

function TopTabs({
  topTab,
  onTab,
  templatesCount,
}: {
  topTab: TopTab;
  onTab: (t: TopTab) => void;
  templatesCount: number;
}) {
  const tabs: { key: TopTab; label: string; count?: number }[] = [
    { key: "packets", label: "Packets" },
    { key: "templates", label: "Templates", count: templatesCount },
  ];
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((t) => {
        const on = t.key === topTab;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onTab(t.key)}
            aria-pressed={on}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-xl px-4 text-[0.84rem] font-semibold transition-colors",
              on ? "bg-ink text-cloud" : "border border-mist bg-cloud text-ink hover:bg-paper",
            )}
          >
            {t.label}
            {typeof t.count === "number" ? (
              <span className={cn("tabular-nums text-[0.74rem]", on ? "text-cloud/70" : "text-slate")}>
                {t.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ── Saved-view pill tabs + bulk-action cluster ──────────────────────────── */

const VIEW_PILLS: { key: ViewKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in-progress", label: "In progress" },
  { key: "awaiting", label: "Awaiting" },
  { key: "missing", label: "Missing fields" },
  { key: "completed", label: "Completed" },
];

function savedViewCounts(packets: Packet[]): Record<ViewKey, number> {
  return {
    all: packets.length,
    "in-progress": filterPackets(packets, "in-progress").length,
    awaiting: filterPackets(packets, "awaiting").length,
    missing: filterPackets(packets, "missing").length,
    completed: filterPackets(packets, "completed").length,
  };
}

function SavedViewBar({
  view,
  onView,
  counts,
  showing,
  selectedCount,
  confirm,
  onBulkSend,
  onBulkDownload,
  onClearSelection,
}: {
  view: ViewKey;
  onView: (v: ViewKey) => void;
  counts: Record<ViewKey, number>;
  showing: number;
  selectedCount: number;
  confirm: string | null;
  onBulkSend: () => void;
  onBulkDownload: () => void;
  onClearSelection: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Saved-view pills (horizontally scrollable on phone, R6) */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {VIEW_PILLS.map((p) => {
          const on = view === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onView(p.key)}
              className={cn(
                "inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full px-3 py-1 text-[0.74rem] font-semibold transition-colors",
                on ? "bg-ink text-cloud" : "border border-mist bg-cloud text-ink hover:bg-paper",
              )}
            >
              {p.label}
              <span className={cn("tabular-nums", on ? "text-cloud/70" : "text-slate")}>
                {counts[p.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right: showing count OR bulk-action cluster when rows selected */}
      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.76rem] font-medium text-ink tabular-nums">
            {selectedCount} selected
          </span>
          <button
            type="button"
            onClick={onBulkSend}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[0.76rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
          >
            <Send className="h-3.5 w-3.5" />
            Send all
          </button>
          <button
            type="button"
            onClick={onBulkDownload}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-mist bg-cloud px-3 py-1.5 text-[0.76rem] font-medium text-ink transition-colors hover:border-ink/20"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
          <button
            type="button"
            onClick={onClearSelection}
            className="inline-flex min-h-9 items-center rounded-lg px-2 py-1.5 text-[0.76rem] font-medium text-slate transition-colors hover:text-ink"
          >
            Clear
          </button>
        </div>
      ) : confirm ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[0.74rem] font-medium text-success ring-1 ring-inset ring-success/20 motion-safe:animate-fade">
          <CircleCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {confirm}
        </span>
      ) : (
        <span className="text-[0.76rem] text-slate tabular-nums">Showing {showing}</span>
      )}
    </div>
  );
}

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

/* ── Pane 1: Packet list (densified + multi-select) ──────────────────────── */

function PacketListPane({
  packets,
  activeId,
  selected,
  onToggleSelect,
  onSelect,
  onNew,
}: {
  packets: Packet[];
  activeId: string;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelect: (p: Packet) => void;
  onNew: () => void;
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft lg:max-h-[calc(100vh-15.5rem)]">
      <header className="flex items-center justify-between border-b border-mist px-4 py-3">
        <h2 className="font-display text-[0.98rem] font-normal text-ink">Packet list</h2>
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
            const prog = packetProgress(p);
            const pct = prog.total ? Math.round((prog.done / prog.total) * 100) : 0;
            const isChecked = selected.has(p.id);
            return (
              <li key={p.id}>
                <div
                  className={cn(
                    "group mb-1 flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 transition-colors",
                    active ? "bg-ink text-cloud" : "hover:bg-paper-200",
                  )}
                >
                  {/* Multi-select checkbox (≥44px tap zone) */}
                  <label
                    className="mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Select ${p.name}`}
                      checked={isChecked}
                      onChange={() => onToggleSelect(p.id)}
                      className={cn(
                        "h-4 w-4 cursor-pointer rounded",
                        active ? "accent-cloud" : "accent-ink",
                      )}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => onSelect(p)}
                    aria-pressed={active}
                    className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                  >
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
                      {/* Per-row progress bar + doc count + relative time */}
                      <span className="mt-1.5 flex items-center gap-2">
                        <span
                          className={cn(
                            "h-1 flex-1 overflow-hidden rounded-full",
                            active ? "bg-cloud/20" : "bg-paper-200",
                          )}
                        >
                          <span
                            className={cn(
                              "block h-full rounded-full",
                              pct >= 100 ? "bg-success" : active ? "bg-cloud" : "bg-ink",
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                        <span
                          className={cn(
                            "shrink-0 text-[0.66rem] tabular-nums",
                            active ? "text-slate-300" : "text-slate",
                          )}
                        >
                          {prog.done}/{prog.total} · {p.updatedAgo}
                        </span>
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
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-mist p-2">
        <button
          type="button"
          onClick={onNew}
          className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-mist px-3 py-2 text-[0.8rem] font-medium text-slate transition-colors hover:border-ink/25 hover:text-ink"
        >
          <Plus className="h-3.5 w-3.5" />
          New packet
        </button>
      </div>
    </section>
  );
}

/* ── Pane 2: Document preview stack (real branded documents) ─────────────── */

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
  const prog = packetProgress(packet);
  const ownerOpt = rosterOption(packet.ownerSlug);
  const hero = packetHero(packet);

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft lg:max-h-[calc(100vh-15.5rem)]">
      {/* Packet hero header — REAL property photo (packetHero) + owner identity */}
      <header className="flex items-stretch gap-3 border-b border-mist p-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- real listing hero / deterministic exterior */}
        <img
          src={hero}
          alt={packet.subject}
          className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-mist"
          loading="lazy"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <h2 className="truncate font-display text-[1rem] font-normal leading-tight text-ink">
            {packet.name}
          </h2>
          <p className="mt-0.5 truncate text-[0.76rem] text-slate">{packet.subject}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <Avatar name={packet.ownerName} slug={packet.ownerSlug} size={18} />
            <span className="truncate text-[0.72rem] text-slate">{packet.lastUpdated}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end justify-center gap-1.5">
          <span className="text-[0.74rem] font-semibold text-ink tabular-nums">
            {prog.done}/{prog.total} done
          </span>
          <button
            type="button"
            onClick={onNew}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-mist px-2 py-1 text-[0.72rem] font-medium text-ink transition-colors hover:border-ink/20"
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
        /* SCROLLABLE branded-document grid — all docs reachable past the fold */
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div
            key={packet.id}
            className="mx-auto grid max-w-[640px] grid-cols-1 gap-4 motion-safe:animate-fade"
          >
            {packet.docs.map((d) => (
              <DocCard
                key={d.id}
                packet={packet}
                doc={d}
                active={d.id === activeDocId}
                ownerName={ownerOpt?.name ?? packet.ownerName}
                ownerSlug={packet.ownerSlug}
                onSelect={() => onSelect(d)}
                onView={() => onView(d)}
                onRename={() => onRename(d)}
                onDuplicate={() => onDuplicate(d)}
                onDelete={() => onDelete(d)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/** A single document card — a REAL compact branded Matin document. */
function DocCard({
  packet,
  doc,
  active,
  ownerName,
  ownerSlug,
  onSelect,
  onView,
  onRename,
  onDuplicate,
  onDelete,
}: {
  packet: Packet;
  doc: PacketDoc;
  active: boolean;
  ownerName: string;
  ownerSlug: string;
  onSelect: () => void;
  onView: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const meta = STATUS_META[doc.status];
  const ownerOpt = rosterOption(ownerSlug);
  return (
    <div
      className={cn(
        "group/card relative flex flex-col rounded-xl transition-shadow",
        active ? "ring-2 ring-ink ring-offset-2 ring-offset-cloud" : "hover:shadow-lift",
      )}
    >
      <DocKebab onRename={onRename} onDuplicate={onDuplicate} onDelete={onDelete} />
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        className="flex-1 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
      >
        {/* Status + title strip above the branded mini-doc */}
        <div className="flex items-center justify-between gap-2 px-1 pb-2 pr-8">
          <span className="min-w-0 truncate font-mono text-[0.7rem] font-semibold text-slate">
            {doc.code}
          </span>
          <StatusChip tone={meta.tone}>{meta.label}</StatusChip>
        </div>
        {/* REAL branded Matin document (compact, no toolbar) */}
        <BrandedDocument
          variant="letter"
          formId={doc.code}
          title={doc.title}
          recipient={packet.subject}
          hideToolbar
          agent={
            ownerOpt
              ? {
                  name: ownerOpt.name,
                  title: ownerOpt.title,
                  license: ownerOpt.license,
                  phone: ownerOpt.phone,
                  slug: ownerOpt.slug,
                }
              : { name: ownerName, slug: ownerSlug }
          }
          fields={docFields(packet, doc).slice(0, 4)}
          completion={docCompletion(packet, doc)}
          page={doc.page}
          pages={doc.pages}
          className="[&_article]:min-h-0"
        />
      </button>
      {/* Card action row */}
      <div className="flex items-center justify-between gap-2 px-1 pt-2">
        {doc.missing?.length ? (
          <span className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-danger">
            <TriangleAlert className="h-3 w-3" />
            {doc.missing.length} to fix
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-success">
            <CircleCheck className="h-3 w-3" />
            Send-ready
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-mist bg-cloud px-2.5 py-1 text-[0.74rem] font-medium text-ink transition-colors hover:border-ink/20"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </button>
      </div>
    </div>
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
    <div className="absolute right-1 top-0 z-10">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Document options"
        aria-expanded={open}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg text-slate transition-colors hover:bg-paper-200 hover:text-ink",
          open && "bg-paper-200 text-ink",
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <>
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
          <div className="absolute right-0 top-9 z-10 w-40 overflow-hidden rounded-xl border border-mist bg-cloud py-1 shadow-lift">
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
        "flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-[0.8rem] font-medium transition-colors",
        danger ? "text-danger hover:bg-danger/[0.06]" : "text-ink hover:bg-paper-200",
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
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const ownerOpt = rosterOption(packet.ownerSlug);

  return (
    <section className="flex flex-col gap-4">
      {/* Selected-document header card */}
      <div
        key={doc.id}
        className="rounded-2xl border border-mist bg-cloud p-4 shadow-soft motion-safe:animate-fade"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[0.72rem] font-semibold text-slate">{doc.code}</span>
          <StatusChip tone={docStatusTone}>{docStatusLabel}</StatusChip>
        </div>
        <h2 className="mt-1.5 font-display text-[1.02rem] font-normal leading-snug text-ink">
          {doc.title}
        </h2>
        <p className="mt-1 text-[0.74rem] text-slate">
          {packet.name} · Page {doc.page} of {doc.pages}
        </p>

        {confirm ? (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-success/10 px-3 py-2 text-[0.76rem] leading-snug text-success ring-1 ring-inset ring-success/20">
            <CircleCheck className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{confirm}</span>
          </div>
        ) : null}

        {/* Light actions — Preview / branded PDF / Print */}
        <div className="mt-3.5 grid grid-cols-3 gap-2">
          <GhostBtn icon={<Eye className="h-3.5 w-3.5" />} onClick={onView}>
            View
          </GhostBtn>
          <GhostBtn icon={<Download className="h-3.5 w-3.5" />} onClick={onView}>
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
            "mt-2.5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[0.84rem] font-semibold transition-colors",
            sendBlocked ? "cursor-not-allowed bg-paper-200 text-slate" : "bg-ink text-cloud hover:bg-ink-800",
          )}
        >
          <Send className="h-4 w-4" />
          {doc.status === "sent" ? "Resend for signature" : "Send for signature"}
        </button>
        {sendBlocked ? (
          <button
            type="button"
            onClick={onResolve}
            className="mt-1.5 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-danger/[0.06] px-3 py-1.5 text-[0.74rem] font-medium text-danger ring-1 ring-inset ring-danger/20 transition-colors hover:bg-danger/[0.1]"
          >
            <TriangleAlert className="h-3 w-3 shrink-0" />
            {missingCount > 0
              ? `${missingCount} field${missingCount > 1 ? "s" : ""} block sending — mark resolved`
              : "Required — mark resolved to unblock"}
          </button>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCorrection}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-mist bg-cloud px-4 py-2 text-[0.82rem] font-medium text-ink transition-colors hover:border-ink/20"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Request correction
          </button>
          <button
            type="button"
            onClick={() => setEnvelopeOpen((v) => !v)}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-mist bg-cloud px-3 py-2 text-[0.8rem] font-medium text-ink transition-colors hover:border-ink/20"
          >
            <PenLine className="h-3.5 w-3.5" />
            {envelopeOpen ? "Hide envelope" : "E-sign envelope"}
          </button>
        </div>

        {/* Branded e-sign envelope preview (ticket 8) */}
        {envelopeOpen ? (
          <div className="mt-3">
            <p className="eyebrow pb-2 text-slate">Matin e-sign envelope</p>
            <BrandedDocument
              variant="email"
              hideToolbar
              fromName={`Matin Real Estate · ${ownerOpt?.name ?? packet.ownerName}`}
              emailSubject={`Signature requested — ${doc.code} ${doc.title}`}
              recipient={packet.subject}
              agent={ownerOpt ? { name: ownerOpt.name, title: ownerOpt.title, phone: ownerOpt.phone } : undefined}
              mergeTokens={["{{signer_name}}", "{{esign_link}}", "{{doc_code}}"]}
              title="Document ready for signature"
              className="[&_article]:min-h-0"
            />
          </div>
        ) : null}
      </div>

      {/* AI missing-field check — gold AI affordance; streams inline */}
      <div className="rounded-2xl border border-mist bg-cloud p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-[0.92rem] font-normal text-ink">Missing-field check</h3>
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
              <li key={i} className="flex items-start gap-1.5 text-[0.76rem] text-danger">
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
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2 text-[0.82rem] font-semibold text-ink transition-colors hover:bg-gold-bright disabled:opacity-60"
        >
          <MatinMark theme="dark" className="h-3.5 w-3.5" />
          {checkBusy ? "Checking fields…" : checkOut ? "Re-run AI field check" : "Run AI field check"}
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
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
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
      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-mist bg-cloud px-2 py-2 text-[0.76rem] font-medium text-ink transition-colors hover:border-ink/20"
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
