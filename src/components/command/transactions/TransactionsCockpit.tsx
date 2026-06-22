"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import {
  FileSignature,
  CalendarCheck,
  TriangleAlert,
  Search,
  FileClock,
  Copy,
  Check,
  FileText,
  CircleCheck,
  ChevronRight,
  Banknote,
  CalendarClock,
  Paperclip,
  Plus,
  ShieldCheck,
  FileBadge,
  Mail,
  Wrench,
} from "lucide-react";
import type { Transaction } from "@/lib/types";
import { getAgent } from "@/lib/data";
import { usd, compactUsd, cn } from "@/lib/utils";
import {
  KpiStrip,
  KpiCard,
  StatusChip,
  Avatar,
  PropertyThumb,
  MilestoneTimeline,
  CalloutCard,
  AIActionCard,
  AIInsightChip,
  ProgressTrack,
  SavedViewTabs,
  ActivityTimeline,
  EmptyState,
  PaneSwitcher,
  usePaneSwitcher,
  useAiSidecar,
  type ChipTone,
  type ChecklistStatus,
  type ActivityItem,
} from "@/components/os";
import { MatinMark } from "@/components/brand/Logo";
import { streamAi } from "@/lib/ai/client";
import {
  dealScreenFor,
  dealPhoto,
  type DealChecklistItem,
  type DealDocument,
  type DealAction,
} from "./deal-screen";
import { DealDrawer, docStatusLabel, docStatusTone } from "./DealDrawer";
import { scrollElementIntoView } from "./useScrollIntoView";

/* ──────────────────────────────────────────────────────────────────────────
   Transaction Timeline + Checklist — the one-deal cockpit (build ref §2.6).

   Every click does its REAL job:
     • KPI tiles drill into the list (filter the saved view).
     • Saved-view pills + search filter the deals list (useState/useMemo).
     • A deals-list row LOADS that deal into the deal screen (real state).
     • A contextual deal-action bar above the checklist runs the right job
       (order warranty/NHD, update co-op agent, or stream an AI seller/buyer
       update via streamAi inline).
     • The checklist-as-table advances each item through done → pending; the
       progress % recomputes and the change writes an activity_event. Each row
       carries a status pill, paperclip Docs-attach, an inline comment input,
       and state-driven verdict buttons (Mark done / Reopen).
     • Document cards: "View" opens the BrandedDocument compliance RecordDrawer;
       Accept/Reject in the drawer mutate doc state + append activity.
     • "Draft inspection response" streams streamAi('contract-extractor') INTO
       an inline result block (never the global sidecar). Approve/Reject mutate
       state. The only sidecar opener is the explicit "Ask Matin" gold button.
     • Below lg, an in-deal tab nav (Summary · Timeline · Checklist · Docs ·
       Activity) shows ONE pane at a time (R1); the 3-column grid returns at lg+.

   8912 SE Hawthorne Blvd (TX-3998 · Purchase/Daniel Cho) is pinned + high-risk;
   1274 NW Everett St (TX-3999 · Listing/Melissa Grant) is the default deal.
   Gold lives on AI affordances only.
   ────────────────────────────────────────────────────────────────────────── */

const DEFAULT_ID = "TX-3999"; // 1274 NW Everett St · Listing · Melissa Grant
const HIGH_RISK_ID = "TX-3998"; // 8912 SE Hawthorne Blvd · Purchase · Daniel Cho

type ViewKey = "all" | "risk" | "closing" | "buyer" | "closed";

function isUnderContract(t: Transaction) {
  return t.stage !== "Closed" && t.stage !== "Active" && t.stage !== "Cancelled";
}

/** Stage → soft chip tone. */
function stageTone(stage: string): ChipTone {
  if (stage === "Closed") return "success";
  if (stage === "Clear to Close") return "success";
  if (["Appraisal", "Financing"].includes(stage)) return "warn";
  if (stage === "Inspection") return "info";
  if (stage === "Cancelled") return "danger";
  return "ink";
}

function closeLabel(daysOut: number, closed: boolean) {
  if (closed) return "Closed";
  if (daysOut < 0) return `${Math.abs(daysOut)}d past close`;
  if (daysOut === 0) return "Closes today";
  return `Closes in ${daysOut}d`;
}

export function TransactionsCockpit({ transactions }: { transactions: Transaction[] }) {
  const { openAi } = useAiSidecar();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewKey>("all");
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_ID);

  // The one-deal screen container — selecting a list row scrolls it into view
  // so on a stacked (sub-lg) layout the detail isn't rendered off-screen below
  // the full deals list (mandate: "Deal-list selection switches the 3-column
  // deal screen + scrolls into view"). At lg+ it's already beside the list, so
  // block:"nearest" is a no-op when it's on-screen.
  const dealScreenRef = useRef<HTMLDivElement | null>(null);

  // Select a deal AND bring its screen into view on the next frame (after the
  // new deal content has rendered).
  const selectDeal = useCallback((id: string) => {
    setSelectedId(id);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() =>
        scrollElementIntoView(dealScreenRef.current, "start"),
      );
    }
  }, []);

  /* ── KPI roll-ups from real data (count + attributed $) ───────────────── */
  const kpis = useMemo(() => {
    const open = transactions.filter((t) => t.stage !== "Closed" && t.stage !== "Cancelled");
    const underContract = open.filter(isUnderContract);
    const closingThisWeek = open.filter(
      (t) => t.closeDateDaysOut >= 0 && t.closeDateDaysOut <= 7,
    );
    const atRisk = open.filter((t) => t.riskFlag != null);
    const inspectionsDue = open.filter(
      (t) => t.stage === "Inspection" || !t.checklist.find((c) => c.label === "Inspection complete")?.done,
    );
    const pendingDocs = open.reduce(
      (sum, t) => sum + t.checklist.filter((c) => !c.done).length,
      0,
    );
    const vol = (rows: Transaction[]) => rows.reduce((s, t) => s + t.price, 0);
    return {
      underContract: underContract.length,
      underContractVol: vol(underContract),
      closingThisWeek: closingThisWeek.length,
      closingVol: vol(closingThisWeek),
      atRisk: atRisk.length,
      atRiskVol: vol(atRisk),
      inspectionsDue: inspectionsDue.length,
      pendingDocs,
    };
  }, [transactions]);

  /* ── Saved-view counts (drive the pill labels) ────────────────────────── */
  const viewCounts = useMemo(() => {
    const open = transactions.filter((t) => t.stage !== "Closed" && t.stage !== "Cancelled");
    return {
      all: transactions.length,
      risk: transactions.filter((t) => t.riskFlag != null).length,
      closing: open.filter((t) => t.closeDateDaysOut >= 0 && t.closeDateDaysOut <= 7).length,
      buyer: transactions.filter((t) => /purchase|buyer/i.test(t.type)).length,
      closed: transactions.filter((t) => t.stage === "Closed").length,
    };
  }, [transactions]);

  /* ── List: filter by view + search, then order (high-risk pinned) ─────── */
  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions
      .filter((t) => {
        if (view === "risk") return t.riskFlag != null;
        if (view === "closing")
          return t.stage !== "Closed" && t.closeDateDaysOut >= 0 && t.closeDateDaysOut <= 7;
        if (view === "buyer") return /purchase|buyer/i.test(t.type);
        if (view === "closed") return t.stage === "Closed";
        return true;
      })
      .filter((t) =>
        !q ? true : t.address.toLowerCase().includes(q) || t.client.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        if (a.id === HIGH_RISK_ID) return -1;
        if (b.id === HIGH_RISK_ID) return 1;
        const ar = a.riskFlag ? 0 : 1;
        const br = b.riskFlag ? 0 : 1;
        if (ar !== br) return ar - br;
        const ac = a.stage === "Closed" ? 1 : 0;
        const bc = b.stage === "Closed" ? 1 : 0;
        if (ac !== bc) return ac - bc;
        return a.closeDateDaysOut - b.closeDateDaysOut;
      });
  }, [transactions, search, view]);

  const selected = transactions.find((t) => t.id === selectedId) ?? transactions[0] ?? null;

  const resetFilters = useCallback(() => {
    setSearch("");
    setView("all");
  }, []);

  return (
    <div className="space-y-5">
      {/* KPI strip — count + attributed $, scroll-snap rail on phone (R4) */}
      <KpiStrip cols={5} rail>
        <KpiCard
          label="Under contract"
          value={kpis.underContract}
          icon={<FileSignature className="h-4 w-4" />}
          delta={compactUsd(kpis.underContractVol)}
          deltaTone="flat"
          hint="Active contract-to-close volume"
          onDrill={resetFilters}
        />
        <KpiCard
          label="Closing this week"
          value={kpis.closingThisWeek}
          icon={<CalendarCheck className="h-4 w-4" />}
          delta={`${compactUsd(kpis.closingVol)} in play`}
          deltaTone="up"
          hint="Close date within 7 days"
          onDrill={() => setView("closing")}
        />
        <KpiCard
          label="At risk"
          value={kpis.atRisk}
          valueTone="danger"
          icon={<TriangleAlert className="h-4 w-4" />}
          delta={`${compactUsd(kpis.atRiskVol)} at risk`}
          deltaTone="down"
          hint="Open risk flag on the deal"
          onDrill={() => setView("risk")}
        />
        <KpiCard
          label="Inspections due"
          value={kpis.inspectionsDue}
          icon={<FileClock className="h-4 w-4" />}
          hint="Inspection contingency still open"
          onDrill={() => setView("all")}
        />
        <KpiCard
          label="Pending docs"
          value={kpis.pendingDocs}
          icon={<FileText className="h-4 w-4" />}
          delta={`${kpis.underContract} open deals`}
          deltaTone="flat"
          hint="Checklist items not yet complete"
          onDrill={resetFilters}
        />
      </KpiStrip>

      {/* Main split: list + one-deal screen — stacks at lg (R1) */}
      <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        {/* ── Left: transaction list ─────────────────────────────────────── */}
        <aside className="flex flex-col overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
          <div className="space-y-3 border-b border-mist px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="eyebrow text-slate">Deals · {list.length}</p>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search address or client…"
                className="h-10 w-full rounded-lg border border-mist bg-paper pl-8 pr-3 text-[0.82rem] text-ink placeholder:text-slate focus:border-ink/30 focus:outline-none focus:ring-1 focus:ring-ink/20"
              />
            </div>
            <SavedViewTabs
              active={view}
              onChange={(k) => setView(k as ViewKey)}
              views={[
                { key: "all", label: "All", count: viewCounts.all },
                { key: "risk", label: "At risk", count: viewCounts.risk },
                { key: "closing", label: "Closing", count: viewCounts.closing },
                { key: "buyer", label: "Buyer", count: viewCounts.buyer },
                { key: "closed", label: "Closed", count: viewCounts.closed },
              ]}
            />
          </div>

          <ul className="max-h-[36rem] divide-y divide-mist overflow-y-auto lg:max-h-[calc(100vh-20rem)]">
            {list.map((t) => {
              const on = t.id === selected?.id;
              const closed = t.stage === "Closed";
              const soon = !closed && t.closeDateDaysOut >= 0 && t.closeDateDaysOut <= 7;
              const isHighRisk = t.id === HIGH_RISK_ID;
              const agent = getAgent(t.agentSlug);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => selectDeal(t.id)}
                    aria-current={on}
                    className={cn(
                      "block w-full px-3 py-3 text-left transition-colors",
                      on ? "bg-paper-200" : "hover:bg-paper",
                      isHighRisk && !on ? "bg-danger/[0.04]" : "",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Real listing hero per deal (matched to address) */}
                      <PropertyThumb
                        src={dealPhoto(t)}
                        ratio="square"
                        alt={t.address}
                        className="h-12 w-12 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.84rem] font-semibold leading-snug text-ink">
                          {t.address.replace(/, .*$/, "")}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[0.74rem] text-slate">
                          {agent ? (
                            <Avatar name={agent.name} slug={agent.slug} size={16} />
                          ) : null}
                          {t.client} · {/purchase|buyer/i.test(t.type) ? "Buyer" : "Listing"}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <StatusChip tone={stageTone(t.stage)}>{t.stage}</StatusChip>
                          {t.riskFlag ? (
                            <StatusChip tone="danger" variant="solid">
                              <TriangleAlert className="h-2.5 w-2.5" /> At risk
                            </StatusChip>
                          ) : null}
                        </div>
                        <p
                          className={cn(
                            "mt-1.5 text-[0.72rem] tabular-nums",
                            closed ? "text-success" : soon ? "text-warn" : "text-slate",
                          )}
                        >
                          {closeLabel(t.closeDateDaysOut, closed)} · {usd(t.price)}
                        </p>
                      </div>
                      {/* Persistent affordance (no hover-only reveal, R5) */}
                      <ChevronRight
                        className={cn(
                          "mt-1 h-4 w-4 shrink-0",
                          on ? "text-ink" : "text-slate/50",
                        )}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
            {list.length === 0 ? (
              <li className="px-4 py-8">
                <EmptyState
                  title="No deals match"
                  body="Clear the search and view filter to see every contract-to-close deal in the pipeline."
                  actionLabel="Show all deals"
                  onAction={resetFilters}
                />
              </li>
            ) : null}
          </ul>
        </aside>

        {/* ── Right: one-deal screen ─────────────────────────────────────── */}
        {/* scroll-mt clears the sticky top command bar when scrolled into view;
            the keyed inner div replays a short motion-safe fade on deal swap. */}
        <div ref={dealScreenRef} className="min-w-0 scroll-mt-20">
          {selected ? (
            <div key={selected.id} className="motion-safe:animate-fade">
              <DealScreen tx={selected} onOpenAi={openAi} />
            </div>
          ) : (
            <EmptyState
              title="Select a deal"
              body="Pick a transaction to see its deadlines, milestone timeline, checklist, documents, and AI risk note on one screen."
              icon={<FileSignature className="h-5 w-5" />}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── The deal screen (live, mutable state for the focused deal) ───────────── */

type LogItem = ActivityItem;
type Comment = { id: string; text: string };

function DealScreen({
  tx,
  onOpenAi,
}: {
  tx: Transaction;
  onOpenAi: (ctx: string) => void;
}) {
  const screen = useMemo(() => dealScreenFor(tx), [tx]);
  const leadAgent = getAgent(screen.leadAgentSlug) ?? getAgent(tx.agentSlug);
  const coordinator = getAgent(screen.coordinatorSlug);
  const addressShort = tx.address.replace(/, .*$/, "");
  const heroPhoto = useMemo(() => dealPhoto(tx), [tx]);
  const buyerSide = /purchase|buyer/i.test(tx.type);

  // In-deal mobile tab nav (R1) — one pane at a time below lg.
  const pane = usePaneSwitcher(
    [
      { key: "summary", label: "Summary" },
      { key: "timeline", label: "Timeline" },
      { key: "checklist", label: "Checklist" },
      { key: "docs", label: "Docs" },
      { key: "activity", label: "Activity" },
    ],
    "summary",
  );

  // Live, mutable copies of the focused deal's checklist, documents, log.
  const [checklist, setChecklist] = useState<DealChecklistItem[]>(screen.checklist);
  const [documents, setDocuments] = useState<DealDocument[]>(screen.documents);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [extraItems, setExtraItems] = useState<DealChecklistItem[]>([]);
  const [log, setLog] = useState<LogItem[]>(
    screen.activity.map((a) => ({
      id: a.id,
      channel: a.channel,
      name: a.name,
      tag: a.tag,
      tagTone: a.tagTone,
      meta: a.meta,
      timeLabel: a.timeLabel,
      group: a.group,
    })),
  );

  // AI draft (contract-extractor) state for the risk note.
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [riskState, setRiskState] = useState<"open" | "approved" | "dismissed">("open");

  // Contextual deal-action bar state (streams an AI update inline).
  const [actionRun, setActionRun] = useState<{ id: string; label: string; text: string; running: boolean } | null>(null);

  // Document review drawer.
  const [openDocId, setOpenDocId] = useState<string | null>(null);
  const openDoc = documents.find((d) => d.id === openDocId) ?? null;

  const allChecklist = [...checklist, ...extraItems];
  const doneCount = allChecklist.filter((c) => c.status === "done").length;
  const issueCount = allChecklist.filter((c) => c.status === "issue").length;
  const pct = Math.round((doneCount / allChecklist.length) * 100);

  const aiContext = `Transactions / ${addressShort} (${tx.id})`;

  /* Prepend a fresh activity_event to the audit log. */
  const pushLog = useCallback((item: Omit<LogItem, "id" | "group">) => {
    setLog((prev) => [
      { id: `live-${Date.now()}-${prev.length}`, group: "Just now", ...item },
      ...prev,
    ]);
  }, []);

  /* Checklist item click → advance state (pending/issue→done, done→pending). */
  const cycleChecklist = useCallback(
    (id: string, fromExtra: boolean) => {
      const setter = fromExtra ? setExtraItems : setChecklist;
      setter((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const next: ChecklistStatus = c.status === "done" ? "pending" : "done";
          pushLog({
            channel: "note",
            name: next === "done" ? `Marked complete: ${c.label}` : `Reopened: ${c.label}`,
            tag: next === "done" ? "checklist" : "reopened",
            tagTone: next === "done" ? "success" : "warn",
            meta: "Checklist updated · activity_event written",
            timeLabel: "now",
          });
          return { ...c, status: next, meta: next === "done" ? "Marked complete" : c.meta };
        }),
      );
    },
    [pushLog],
  );

  const addComment = useCallback(
    (id: string, label: string) => {
      const text = (commentDraft[id] ?? "").trim();
      if (!text) return;
      setComments((prev) => ({
        ...prev,
        [id]: [...(prev[id] ?? []), { id: `cm-${Date.now()}`, text }],
      }));
      setCommentDraft((prev) => ({ ...prev, [id]: "" }));
      pushLog({
        channel: "note",
        name: `Comment on: ${label}`,
        tag: "comment",
        tagTone: "info",
        meta: text,
        timeLabel: "now",
      });
    },
    [commentDraft, pushLog],
  );

  const addNewChecklistItem = useCallback(() => {
    const id = `extra-${Date.now()}`;
    setExtraItems((prev) => [...prev, { id, label: "New requirement", status: "pending", meta: "Added by coordinator" }]);
    pushLog({
      channel: "note",
      name: "Added checklist item",
      tag: "checklist",
      tagTone: "info",
      meta: "New requirement added to the deal",
      timeLabel: "now",
    });
  }, [pushLog]);

  /* Document Accept / Reject from the drawer → mutate doc state + log. */
  const acceptDoc = useCallback(
    (doc: DealDocument) => {
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, status: "complete", missing: undefined } : d)),
      );
      pushLog({
        channel: "system",
        name: `Accepted: ${doc.name}`,
        tag: "compliance",
        tagTone: "success",
        meta: `${doc.requirement} · verdict logged for audit`,
        timeLabel: "now",
      });
    },
    [pushLog],
  );

  const rejectDoc = useCallback(
    (doc: DealDocument) => {
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, status: "rejected" } : d)),
      );
      pushLog({
        channel: "system",
        name: `Rejected: ${doc.name}`,
        tag: "correction requested",
        tagTone: "danger",
        meta: `${doc.requirement} · sent back for correction`,
        timeLabel: "now",
      });
    },
    [pushLog],
  );

  async function handleDraft() {
    if (!screen.risk || drafting) return;
    setDrafting(true);
    setDraft("");
    await streamAi(
      {
        tool: "contract-extractor",
        input: { contractText: screen.risk.draftPrompt, address: tx.address },
        messages: [{ role: "user", content: screen.risk.draftPrompt }],
      },
      (_chunk, full) => setDraft(full),
    );
    setDrafting(false);
    pushLog({
      channel: "system",
      name: `AI drafted: ${screen.risk.actionLabel}`,
      tag: "ai draft",
      tagTone: "gold",
      meta: "Draft ready for review — approval required before send",
      timeLabel: "now",
    });
  }

  function handleCopy() {
    if (!draft) return;
    navigator.clipboard.writeText(draft).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  function approveDraft() {
    setRiskState("approved");
    pushLog({
      channel: "system",
      name: `Approved AI draft: ${screen.risk?.actionLabel ?? "response"}`,
      tag: "approved",
      tagTone: "success",
      meta: "Queued to send for signature",
      timeLabel: "now",
    });
  }

  function dismissDraft() {
    setRiskState("dismissed");
    setDraft("");
    pushLog({
      channel: "note",
      name: "Dismissed AI risk draft",
      tag: "dismissed",
      tagTone: "info",
      meta: "Risk note kept open for manual handling",
      timeLabel: "now",
    });
  }

  /* Contextual deal-action bar: a draft action streams AI inline; a non-draft
     action (order warranty/NHD/update) logs the order immediately. */
  async function runDealAction(action: DealAction) {
    if (action.draftPrompt) {
      setActionRun({ id: action.id, label: action.label, text: "", running: true });
      await streamAi(
        { tool: "contract-extractor", input: { contractText: action.draftPrompt, address: tx.address }, messages: [{ role: "user", content: action.draftPrompt }] },
        (_c, full) => setActionRun({ id: action.id, label: action.label, text: full, running: true }),
      );
      setActionRun((prev) => (prev ? { ...prev, running: false } : prev));
      pushLog({
        channel: "system",
        name: `AI drafted: ${action.label}`,
        tag: "ai draft",
        tagTone: "gold",
        meta: "Branded update ready — review before send",
        timeLabel: "now",
      });
    } else {
      pushLog({
        channel: "system",
        name: action.label,
        tag: "ordered",
        tagTone: "success",
        meta: `${action.label} · logged to the deal`,
        timeLabel: "now",
      });
    }
  }

  const docComplete = documents.filter((d) => d.status === "complete").length;

  /* ── Pane bodies (reused by the mobile switcher and the lg+ grid) ──────── */

  const summaryPane = (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
      {/* Property hero — real listing imagery keyed to the address */}
      <div className="relative">
        <PropertyThumb src={heroPhoto} ratio="video" alt={tx.address} rounded={false} />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <StatusChip tone={stageTone(tx.stage)} variant="solid">
            {tx.stage}
          </StatusChip>
          {tx.riskFlag ? (
            <StatusChip tone="danger" variant="solid">
              <TriangleAlert className="h-2.5 w-2.5" /> At risk
            </StatusChip>
          ) : null}
        </div>
      </div>

      <div className="border-b border-mist px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <p className="eyebrow text-slate">Deal summary</p>
          <span className="font-mono text-[0.7rem] text-slate">{tx.id}</span>
        </div>
        <h2 className="mt-2 font-display text-[1.3rem] leading-tight text-ink">{addressShort}</h2>
        <p className="mt-1 text-[0.8rem] text-slate">{screen.sideLine}</p>

        {tx.riskFlag ? (
          <div className="mt-3">
            <AIInsightChip icon={<TriangleAlert className="h-3.5 w-3.5" />}>
              {tx.riskFlag}
            </AIInsightChip>
          </div>
        ) : null}
      </div>

      {/* Status rows: label + solid chip — click opens the matching doc */}
      <div className="divide-y divide-mist px-5">
        {screen.statusRows.map((row) => {
          const linked = documentForStatus(documents, row.label);
          return (
            <button
              key={row.label}
              type="button"
              disabled={!linked}
              onClick={() => linked && setOpenDocId(linked.id)}
              className={cn(
                "flex min-h-11 w-full items-center justify-between gap-3 py-2.5 text-left transition-colors",
                linked ? "-mx-2 rounded-lg px-2 hover:bg-paper" : "cursor-default",
              )}
            >
              <span className="flex items-center gap-2 text-[0.82rem] font-medium text-ink">
                {row.label}
                {linked ? <ChevronRight className="h-3.5 w-3.5 text-slate/50" /> : null}
              </span>
              <StatusChip tone={row.tone} variant="solid">
                {row.value}
              </StatusChip>
            </button>
          );
        })}
      </div>

      {/* 8+ field transaction metadata band (§2.6 ticket 3) */}
      <div className="border-t border-mist px-5 py-4">
        <p className="eyebrow mb-2.5 text-slate">Transaction metadata</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
          {screen.meta.map((m) => (
            <div key={m.label} className="min-w-0">
              <dt className="text-[0.66rem] font-medium uppercase tracking-wide text-slate">{m.label}</dt>
              <dd className="mt-0.5 truncate text-[0.8rem] font-medium text-ink tabular-nums">{m.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Facts */}
      <div className="grid grid-cols-2 gap-px border-t border-mist bg-mist">
        <Fact label="Sale price" value={usd(tx.price)} icon={<Banknote className="h-3.5 w-3.5" />} />
        <Fact label="Commission" value={usd(tx.commission)} tone="success" icon={<Banknote className="h-3.5 w-3.5" />} />
        <Fact label="Side" value={buyerSide ? "Buyer" : "Listing"} />
        <Fact label="Close" value={closeLabel(tx.closeDateDaysOut, tx.stage === "Closed")} icon={<CalendarClock className="h-3.5 w-3.5" />} />
      </div>

      {/* Contacts: lead agent + TC + parties */}
      <div className="space-y-2 border-t border-mist px-5 py-4">
        <p className="eyebrow text-slate">Contacts</p>
        {leadAgent ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar name={leadAgent.name} slug={leadAgent.slug} size={32} ring />
              <div className="min-w-0">
                <p className="text-[0.84rem] font-semibold text-ink">{leadAgent.name}</p>
                <p className="text-[0.72rem] text-slate">Lead agent · {leadAgent.phone}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenAi(`Context: ${aiContext}`)}
              className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
            >
              <MatinMark theme="dark" className="h-3.5 w-3.5" />
              Ask Matin
            </button>
          </div>
        ) : null}
        {coordinator ? (
          <div className="flex items-center gap-2.5">
            <Avatar name={coordinator.name} slug={coordinator.slug} size={28} ring />
            <p className="text-[0.78rem] text-slate">
              <span className="font-semibold text-ink">{coordinator.name}</span> · Transaction Coordinator
            </p>
          </div>
        ) : null}
        <ul className="space-y-1 pt-1">
          {screen.contacts.map((c) => (
              <li key={`${c.role}-${c.name}`} className="flex items-baseline justify-between gap-3 text-[0.76rem]">
                <span className="shrink-0 text-slate">{c.role}</span>
                <span className="min-w-0 truncate text-right text-ink">
                  <span className="font-medium">{c.name}</span>
                  {c.detail ? <span className="text-slate"> · {c.detail}</span> : null}
                </span>
              </li>
            ))}
        </ul>
      </div>
    </section>
  );

  const timelinePane = (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
      <div className="flex items-center justify-between gap-3 border-b border-mist px-5 py-4">
        <p className="eyebrow text-slate">Milestone timeline</p>
        <StatusChip tone={tx.stage === "Closed" ? "success" : "info"}>
          {tx.stage === "Closed" ? "Closed" : "On track"}
        </StatusChip>
      </div>
      <div className="px-5 py-5">
        <MilestoneTimeline milestones={screen.milestones} />
      </div>
      <p className="mt-auto border-t border-mist px-5 py-3 text-[0.72rem] leading-snug text-slate">
        Date-driven and audit-friendly. Each status change writes an{" "}
        <span className="font-mono text-[0.7rem]">activity_event</span>.
      </p>
    </section>
  );

  const checklistPane = (
    <section className="flex flex-col gap-4">
      {/* Contextual deal-action bar (§2.6 ticket 5) */}
      <div className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
        <div className="border-b border-mist px-5 py-3">
          <p className="eyebrow text-slate">Deal actions</p>
        </div>
        <div className="flex flex-wrap gap-2 px-5 py-3">
          {screen.actions.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => runDealAction(a)}
              className={cn(
                "inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.76rem] font-semibold transition-colors",
                a.draftPrompt
                  ? "bg-gold text-ink hover:bg-gold-bright"
                  : "border border-mist bg-cloud text-ink hover:bg-paper",
              )}
            >
              {a.draftPrompt ? (
                <MatinMark theme="dark" className="h-3.5 w-3.5" />
              ) : a.id === "warranty" ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : a.id === "nhd" ? (
                <FileBadge className="h-3.5 w-3.5" />
              ) : a.id.includes("addendum") || a.id.includes("repair") ? (
                <Wrench className="h-3.5 w-3.5" />
              ) : (
                <Mail className="h-3.5 w-3.5" />
              )}
              {a.label}
            </button>
          ))}
        </div>
        {actionRun ? (
          <div className="border-t border-ink-700 bg-ink-900 px-5 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="eyebrow text-gold/80">AI draft · {actionRun.label}</span>
              {!actionRun.running ? (
                <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium text-success">
                  <CircleCheck className="h-3.5 w-3.5" /> Ready — review before send
                </span>
              ) : (
                <span className="text-[0.7rem] text-slate-300">Drafting…</span>
              )}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-[0.8rem] leading-relaxed text-slate-300">
              {actionRun.text || "…"}
            </p>
          </div>
        ) : null}
      </div>

      {/* Checklist-as-table (SkySlope) */}
      <div className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
        <div className="flex items-center justify-between gap-3 border-b border-mist px-5 py-4">
          <p className="eyebrow text-slate">Compliance checklist</p>
          <span className="text-[0.74rem] font-medium text-slate tabular-nums">
            {doneCount}/{allChecklist.length} done
          </span>
        </div>
        <div className="px-5 pt-4">
          <ProgressTrack
            label="Contract-to-close"
            value={pct}
            tone={issueCount > 0 ? "danger" : pct === 100 ? "success" : "warn"}
          />
        </div>
        <div className="divide-y divide-mist px-2 py-2">
          {allChecklist.map((c) => {
            const fromExtra = c.id.startsWith("extra-");
            return (
              <ChecklistTableRow
                key={c.id}
                item={c}
                comments={comments[c.id] ?? []}
                commentDraft={commentDraft[c.id] ?? ""}
                onComment={(v) => setCommentDraft((prev) => ({ ...prev, [c.id]: v }))}
                onSubmitComment={() => addComment(c.id, String(c.label))}
                onAttach={() => setOpenDocId(documents[0]?.id ?? null)}
                onCycle={() => cycleChecklist(c.id, fromExtra)}
              />
            );
          })}
        </div>
        <div className="border-t border-mist px-5 py-2.5">
          <button
            type="button"
            onClick={addNewChecklistItem}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-[0.76rem] font-medium text-ink ring-1 ring-inset ring-mist transition-colors hover:bg-paper-200"
          >
            <Plus className="h-3.5 w-3.5" /> Add new
          </button>
        </div>
      </div>

      {/* AI Risk Note — dark callout + streamed draft */}
      {screen.risk && riskState !== "dismissed" ? (
        <CalloutCard
          tone="risk"
          title={screen.risk.title}
          action={
            riskState === "approved" ? (
              <span className="inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-success">
                <CircleCheck className="h-3.5 w-3.5" /> Draft approved · queued to send
              </span>
            ) : draft || drafting ? null : (
              <button
                type="button"
                onClick={handleDraft}
                disabled={drafting}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-gold px-3.5 py-1.5 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-gold-bright disabled:opacity-60"
              >
                <MatinMark theme="dark" className="h-3.5 w-3.5" />
                {screen.risk.actionLabel}
              </button>
            )
          }
        >
          <p>{screen.risk.body}</p>

          {riskState !== "approved" ? (
            <div className="mt-3.5">
              <AIActionCard
                title={screen.risk.actionLabel}
                riskTag="Approval required"
                evidence="Email thread cross-referenced against deal state; no matching addendum on file before the contingency deadline."
                confidence="High"
                runLabel={draft ? "Re-draft" : "Draft"}
                running={drafting}
                onRun={handleDraft}
                onEdit={() => onOpenAi(`Context: ${aiContext}`)}
                onReject={dismissDraft}
                result={
                  draft ? (
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="eyebrow text-gold/80">
                          AI draft · {screen.risk.actionLabel}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-slate-300 transition-colors hover:text-cloud"
                        >
                          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <p className="whitespace-pre-wrap text-[0.8rem] leading-relaxed text-slate-300">
                        {draft}
                      </p>
                      {!drafting ? (
                        <div className="flex flex-wrap items-center gap-2 border-t border-ink-700 pt-2.5">
                          <button
                            type="button"
                            onClick={approveDraft}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.74rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
                          >
                            <CircleCheck className="h-3.5 w-3.5" /> Approve & queue
                          </button>
                          <button
                            type="button"
                            onClick={dismissDraft}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.74rem] font-medium text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud"
                          >
                            Dismiss
                          </button>
                          <span className="ml-auto text-[0.66rem] text-slate-300/50">
                            Draft only — review before sending.
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ) : undefined
                }
              />
            </div>
          ) : null}
        </CalloutCard>
      ) : (
        <CalloutCard
          tone="system"
          title={riskState === "dismissed" ? "Risk note dismissed" : "No open risk"}
          action={
            <button
              type="button"
              onClick={() => onOpenAi(`Context: ${aiContext}`)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-gold px-3.5 py-1.5 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
            >
              <MatinMark theme="dark" className="h-3.5 w-3.5" />
              Ask Matin
            </button>
          }
        >
          <p>
            {riskState === "dismissed"
              ? `The AI risk note for ${addressShort} was dismissed for manual handling. Ask Matin to re-check the deal state any time.`
              : `Matin AI cross-referenced deadlines, the email thread, and document state for ${addressShort}. Every contingency is on track — no addendum or deadline action is outstanding right now.`}
          </p>
        </CalloutCard>
      )}
    </section>
  );

  const docsPane = (
    <section className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mist px-5 py-4">
        <div>
          <p className="eyebrow text-slate">Documents · Compliance review</p>
          <p className="mt-1 text-[0.74rem] text-slate">
            Grouped by requirement. Open a doc to inspect the branded letterhead, missing fields, and Accept / Reject.
          </p>
        </div>
        <span className="shrink-0 text-[0.74rem] font-medium text-slate tabular-nums">
          {docComplete}/{documents.length} cleared
        </span>
      </div>
      {/* Doc-tree grouped by requirement. 1-col on phone (full-width pane) and
          in the cramped lg band (docsPane shares the narrow deal column); 2-up
          at sm/md (wide phone pane) and again at xl (docs+activity split). */}
      <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {documents.map((d) => (
          <DocCard key={d.id} doc={d} onView={() => setOpenDocId(d.id)} />
        ))}
      </div>
    </section>
  );

  const activityPane = (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
      <div className="border-b border-mist px-5 py-4">
        <p className="eyebrow text-slate">Activity · Audit trail</p>
        <p className="mt-1 text-[0.74rem] text-slate">
          Every status change is logged here in real time.
        </p>
      </div>
      <div className="max-h-[26rem] overflow-y-auto px-5 py-2">
        {log.length > 0 ? (
          <ActivityTimeline items={log} />
        ) : (
          <p className="py-8 text-center text-[0.8rem] text-slate">No activity yet.</p>
        )}
      </div>
    </section>
  );

  return (
    <div className="space-y-5">
      {/* Sticky selected-deal header (R6 — context above the stacked panes) */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-mist bg-cloud px-4 py-2.5 shadow-soft lg:hidden">
        <div className="flex items-center gap-2.5">
          <PropertyThumb src={heroPhoto} ratio="square" alt={tx.address} className="h-9 w-9" />
          <div className="min-w-0">
            <p className="truncate text-[0.84rem] font-semibold text-ink">{addressShort}</p>
            <p className="text-[0.72rem] text-slate">{screen.sideLine}</p>
          </div>
        </div>
        <StatusChip tone={stageTone(tx.stage)}>{tx.stage}</StatusChip>
      </div>

      {/* Mobile in-deal tab nav (R1) — one pane at a time below lg */}
      <PaneSwitcher
        panes={pane.panes}
        active={pane.active}
        onChange={pane.go}
        ariaLabel="Deal sections"
      />

      {/* Below lg: render only the active pane. Keying on the active pane key
          replays a short motion-safe fade so the swap is visibly felt (R-mandate
          "swap content with a tasteful fade"). */}
      <div className="space-y-5 lg:hidden">
        <div key={pane.active} className="space-y-5 motion-safe:animate-fade">
          {pane.is("summary") && summaryPane}
          {pane.is("timeline") && timelinePane}
          {pane.is("checklist") && checklistPane}
          {pane.is("docs") && docsPane}
          {pane.is("activity") && activityPane}
        </div>
      </div>

      {/* lg+: the full multi-pane deal screen */}
      <div className="hidden lg:block">
        <div className="grid gap-5 xl:grid-cols-3">
          {summaryPane}
          {timelinePane}
          {checklistPane}
        </div>
        {/* Docs + activity split only at xl — in the lg band the deal-screen
            column is already narrow (it's the 1fr of a 20rem+1fr page split), so
            a second 1fr+22rem split here would cram the doc cards. Stack until xl. */}
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          {docsPane}
          {activityPane}
        </div>
      </div>

      {/* Compliance review drawer */}
      <DealDrawer
        open={openDocId != null}
        onClose={() => setOpenDocId(null)}
        doc={openDoc}
        dealAddress={addressShort}
        dealMeta={screen.meta}
        agentName={leadAgent?.name}
        agentSlug={leadAgent?.slug}
        coordinatorSlug={screen.coordinatorSlug}
        activity={log}
        onAccept={(d) => {
          acceptDoc(d);
          setOpenDocId(null);
        }}
        onReject={(d) => {
          rejectDoc(d);
          setOpenDocId(null);
        }}
        onAskAi={() => onOpenAi(`Context: ${aiContext}`)}
      />
    </div>
  );
}

/* ── Checklist-as-table row (SkySlope: pill + paperclip + comment + verdict) ── */

function ChecklistTableRow({
  item,
  comments,
  commentDraft,
  onComment,
  onSubmitComment,
  onAttach,
  onCycle,
}: {
  item: DealChecklistItem;
  comments: Comment[];
  commentDraft: string;
  onComment: (v: string) => void;
  onSubmitComment: () => void;
  onAttach: () => void;
  onCycle: () => void;
}) {
  const [showComment, setShowComment] = useState(false);
  const tone: ChipTone =
    item.status === "done" ? "success" : item.status === "issue" ? "danger" : item.status === "scheduled" ? "info" : "warn";
  const label =
    item.status === "done" ? "Accepted" : item.status === "issue" ? "Action needed" : item.status === "scheduled" ? "Scheduled" : "Pending";

  return (
    <div className="px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <StatusChip tone={tone}>
            {item.status === "done" ? <CircleCheck className="h-2.5 w-2.5" /> : null}
            {label}
          </StatusChip>
          <div className="min-w-0">
            <p className={cn("truncate text-[0.83rem] font-medium", item.status === "done" ? "text-slate" : "text-ink")}>
              {item.label}
            </p>
            {item.meta ? <p className="truncate text-[0.72rem] text-slate">{item.meta}</p> : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={onAttach}
            aria-label="Attach document"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate transition-colors hover:bg-paper-200 hover:text-ink"
          >
            <Paperclip className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowComment((s) => !s)}
            aria-label="Comment"
            className={cn(
              "inline-flex h-11 items-center justify-center rounded-lg px-2.5 text-[0.72rem] font-medium transition-colors",
              comments.length > 0 ? "text-ink" : "text-slate",
              "hover:bg-paper-200 hover:text-ink",
            )}
          >
            {comments.length > 0 ? `${comments.length} note${comments.length > 1 ? "s" : ""}` : "Comment"}
          </button>
          <button
            type="button"
            onClick={onCycle}
            className={cn(
              "inline-flex h-11 items-center justify-center rounded-lg px-2.5 text-[0.72rem] font-medium transition-colors",
              item.status === "done"
                ? "text-slate hover:bg-paper-200 hover:text-ink"
                : "text-ink ring-1 ring-inset ring-mist hover:bg-paper-200",
            )}
          >
            {item.status === "done" ? "Unaccept" : "Accept"}
          </button>
        </div>
      </div>

      {comments.length > 0 ? (
        <ul className="mt-1.5 space-y-1 pl-1">
          {comments.map((cm) => (
            <li key={cm.id} className="text-[0.74rem] leading-snug text-slate">
              <span className="text-slate/60">— </span>
              {cm.text}
            </li>
          ))}
        </ul>
      ) : null}

      {showComment ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            value={commentDraft}
            onChange={(e) => onComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmitComment();
            }}
            placeholder="Add a compliance comment…"
            className="h-10 min-w-0 flex-1 rounded-lg border border-mist bg-paper px-3 text-[0.78rem] text-ink placeholder:text-slate focus:border-ink/30 focus:outline-none focus:ring-1 focus:ring-ink/20"
          />
          <button
            type="button"
            onClick={onSubmitComment}
            className="inline-flex min-h-[40px] items-center rounded-lg bg-ink px-3 py-1.5 text-[0.74rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
          >
            Post
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ── Small pieces ─────────────────────────────────────────────────────────── */

/** Match a status row label to its backing document, if any. */
function documentForStatus(docs: DealDocument[], label: string): DealDocument | undefined {
  const l = label.toLowerCase();
  const wants =
    l === "inspection"
      ? ["inspection", "addendum", "contingenc"]
      : l === "appraisal"
        ? ["appraisal", "closing disclosure"]
        : l === "loan"
          ? ["loan", "lender", "financing", "approval", "clear-to-close"]
          : l === "title"
            ? ["title", "closing"]
            : [l];
  return docs.find((d) => wants.some((w) => d.name.toLowerCase().includes(w) || d.requirement.toLowerCase().includes(w)));
}

function DocCard({ doc, onView }: { doc: DealDocument; onView: () => void }) {
  const tone = docStatusTone(doc.status);
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-mist bg-cloud transition-colors hover:border-ink/20">
      <div className="flex items-start gap-2.5 px-3.5 pt-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper-200 text-slate ring-1 ring-inset ring-mist">
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.82rem] font-semibold leading-snug text-ink">{doc.name}</p>
          <p className="mt-0.5 text-[0.72rem] text-slate">
            {doc.requirement} · {doc.pages} {doc.pages === 1 ? "page" : "pages"}
          </p>
        </div>
      </div>
      <p className="mt-2 px-3.5 text-[0.72rem] leading-snug text-slate">{doc.meta}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-mist px-3.5 py-2.5">
        <StatusChip tone={tone}>
          {doc.status === "complete" ? <CircleCheck className="h-2.5 w-2.5" /> : null}
          {docStatusLabel(doc.status)}
        </StatusChip>
        <button
          type="button"
          onClick={onView}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-ink px-2.5 py-1 text-[0.74rem] font-medium text-cloud transition-colors hover:bg-ink-800"
        >
          <FileText className="h-3.5 w-3.5" /> Review
        </button>
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone?: "success";
  icon?: ReactNode;
}) {
  return (
    <div className="bg-cloud px-5 py-3">
      <p className="flex items-center gap-1.5 text-slate">
        {icon ? <span className="text-slate">{icon}</span> : null}
        <span className="eyebrow">{label}</span>
      </p>
      <p
        className={cn(
          "mt-1 text-[0.92rem] font-semibold tabular-nums",
          tone === "success" ? "text-success" : "text-ink",
        )}
      >
        {value}
      </p>
    </div>
  );
}
