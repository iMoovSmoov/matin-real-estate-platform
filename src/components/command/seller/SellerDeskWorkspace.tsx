"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Database,
  Home,
  Banknote,
  CalendarClock,
  ChevronRight,
  LayoutGrid,
  Rows3,
  CirclePlus,
} from "lucide-react";
import { sellerLeads as seedLeads } from "@/lib/data";
import type { SellerLead } from "@/lib/types";
import { cn, compactUsd } from "@/lib/utils";
import {
  KpiStrip,
  KpiCard,
  KanbanBoard,
  ScoreChip,
  StatusChip,
  Avatar,
  type KanbanColumn,
  type ActivityItem,
} from "@/components/os";
import { OpportunityDrawer } from "./OpportunityDrawer";
import { NewOpportunityDrawer } from "./NewOpportunityDrawer";
import { LikelySellersTable } from "./LikelySellersTable";
import { CashOfferMatrix } from "./CashOfferMatrix";
import {
  columnForStage,
  signalHeadline,
  effectiveScore,
  nextAction,
  agentName,
  matchesView,
  type PipelineColumnKey,
  type SellerViewKey,
} from "./sellerView";

/* ──────────────────────────────────────────────────────────────────────────
   Seller / Cash Offers — opportunity desk   (build-reference §2.3 / wireframe 06)

   "Find hidden homeowners, enrich data, trigger campaigns, route hot
   opportunities — signal to listing won."

   Everything is real & state-driven:
     • KPI strip (4) → tiles drill into the list filtered to the matching pool
     • view toggle: Pipeline kanban  ·  Likely-sellers list (DataTable)
     • Kanban / table row click → OpportunityDrawer (NOT the AI panel)
     • "+ Add opportunity" → NewOpportunityDrawer form → appends to local state,
       appears instantly in pipeline + list
     • approved AI drafts log into the per-lead activity feed (local state)
     • Cash-offer comparison matrix + net sheet (CashOfferMatrix)
   ────────────────────────────────────────────────────────────────────────── */

const COLUMN_META: { key: PipelineColumnKey; title: string; ai?: boolean }[] = [
  { key: "signal", title: "Signal detected" },
  { key: "ai-nurture", title: "AI nurture", ai: true },
  { key: "human", title: "Human follow-up" },
];

const BACKEND_INPUTS = [
  "Score sellers from CRM contacts, equity estimate, site behavior, email clicks, form submissions, conversation sentiment, listing timeline",
];

const BACKEND_TABLES = [
  "contacts",
  "properties",
  "ownership_signals",
  "valuations",
  "seller_campaigns",
  "cash_offer_requests",
  "agent_appointments",
  "ai_actions",
];

function scrollTo(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

type ViewMode = "pipeline" | "list";

export function SellerDeskWorkspace() {
  // Lift the seed records into local state so Create + activity-logging persist.
  const [leads, setLeads] = useState<SellerLead[]>(seedLeads);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [mode, setMode] = useState<ViewMode>("pipeline");
  const [view, setView] = useState<SellerViewKey>("all");
  // Approved-draft activity events, keyed by lead id.
  const [activityLog, setActivityLog] = useState<Record<string, ActivityItem[]>>({});

  const selected = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? null,
    [leads, selectedId],
  );

  const columns = useMemo<KanbanColumn<SellerLead>[]>(() => {
    return COLUMN_META.map((meta) => {
      const cards = leads
        .filter((l) => columnForStage(l.stage) === meta.key)
        // Highest seller-intent first — the at-a-glance "who to call".
        .sort((a, b) => effectiveScore(b) - effectiveScore(a));
      return {
        key: meta.key,
        title: meta.title,
        count: cards.length,
        cards,
        ai: meta.ai,
      };
    });
  }, [leads]);

  const handleCreate = useCallback((lead: SellerLead) => {
    setLeads((prev) => [lead, ...prev]);
    // Surface the new record immediately.
    setSelectedId(lead.id);
  }, []);

  const logActivity = useCallback((leadId: string, item: ActivityItem) => {
    setActivityLog((prev) => ({
      ...prev,
      [leadId]: [item, ...(prev[leadId] ?? [])],
    }));
  }, []);

  // KPI drill → switch to the list view filtered to the matching pool.
  const drillTo = useCallback((v: SellerViewKey) => {
    setView(v);
    setMode("list");
    scrollTo("pipeline");
  }, []);

  const likelyCount = useMemo(
    () => leads.filter((l) => effectiveScore(l) >= 60 && l.stage !== "Dead").length,
    [leads],
  );
  const cashCount = useMemo(() => leads.filter((l) => matchesView(l, "cash")).length, [leads]);
  const apptCount = useMemo(() => leads.filter((l) => matchesView(l, "appts")).length, [leads]);

  return (
    <div className="flex flex-col gap-5 px-4 py-5 md:px-6">
      {/* Subtitle (no h1 — TopCommandBar owns the section title) + create action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.82rem] text-slate">
          Find hidden homeowners, enrich data, trigger campaigns, route hot opportunities — signal to listing won.
        </p>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-[0.8rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
        >
          <CirclePlus className="h-4 w-4" aria-hidden />
          Add opportunity
        </button>
      </div>

      {/* KPI strip — drills into the list filtered to the relevant pool */}
      <KpiStrip className="xl:grid-cols-4">
        <KpiCard
          label="Database owners"
          value="38,420"
          icon={<Database className="h-4 w-4" />}
          hint="Homeowners in the farm"
          delta="+612 this quarter"
          deltaTone="up"
          onDrill={() => drillTo("all")}
        />
        <KpiCard
          label="Likely sellers"
          value={`1,${String(280 + likelyCount).slice(-3)}`}
          valueTone="success"
          icon={<Home className="h-4 w-4" />}
          hint="AI seller-intent ≥ 60"
          delta="+84 vs last week"
          deltaTone="up"
          onDrill={() => drillTo("hot")}
        />
        <KpiCard
          label="Cash offer requests"
          value={72 + cashCount}
          icon={<Banknote className="h-4 w-4" />}
          hint="Bypass normal priority"
          delta={`${cashCount} in pipeline`}
          deltaTone="flat"
          onDrill={() => drillTo("cash")}
        />
        <KpiCard
          label="Agent appts"
          value={19 + apptCount}
          icon={<CalendarClock className="h-4 w-4" />}
          hint="Booked this week"
          delta="+5 vs goal"
          deltaTone="up"
          onDrill={() => drillTo("appts")}
        />
      </KpiStrip>

      {/* PRIMARY — pipeline kanban / likely-sellers list (toggle) */}
      <section id="pipeline" className="scroll-mt-20">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">
              Seller opportunity pipeline
            </h2>
            <p className="text-[0.76rem] text-slate">
              {mode === "pipeline"
                ? "Behavioral stages — automated nurture on the left of the line, humans on the right."
                : "The same opportunities as a sortable scoreboard — highest intent first."}
            </p>
          </div>
          {/* View toggle */}
          <div className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-mist bg-paper-200/60 p-0.5">
            <ToggleBtn active={mode === "pipeline"} onClick={() => setMode("pipeline")} icon={LayoutGrid}>
              Pipeline
            </ToggleBtn>
            <ToggleBtn active={mode === "list"} onClick={() => setMode("list")} icon={Rows3}>
              List
            </ToggleBtn>
          </div>
        </div>

        {mode === "pipeline" ? (
          <KanbanBoard
            columns={columns}
            backendColumn={{
              title: "Backend logic",
              inputs: BACKEND_INPUTS,
              tables: BACKEND_TABLES,
            }}
            renderCard={(lead) => (
              <OpportunityKanbanCard lead={lead} onClick={() => setSelectedId(lead.id)} />
            )}
          />
        ) : (
          <LikelySellersTable
            leads={leads}
            view={view}
            onView={setView}
            onRowClick={(lead) => setSelectedId(lead.id)}
            onAddOpportunity={() => setCreateOpen(true)}
          />
        )}
      </section>

      {/* SECONDARY — cash-offer comparison matrix + net sheet */}
      <section id="cash-offer-desk" className="scroll-mt-20">
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">
            Cash-offer desk
          </h2>
          <p className="text-[0.76rem] text-slate">
            Compare competing offers side-by-side; AI flags weak terms and ranks net proceeds.
          </p>
        </div>
        <CashOfferMatrix />
      </section>

      {/* Opportunity drawer (card / row click) */}
      <OpportunityDrawer
        lead={selected}
        onClose={() => setSelectedId(null)}
        onLogActivity={logActivity}
        extraActivity={selected ? activityLog[selected.id] : undefined}
      />

      {/* Create form drawer */}
      <NewOpportunityDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof LayoutGrid;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[0.78rem] font-medium transition-colors",
        active ? "bg-cloud text-ink shadow-soft" : "text-slate hover:text-ink",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {children}
    </button>
  );
}

/* ── Kanban card ───────────────────────────────────────────────────────────
   Bold signal/stage title + a real owner Avatar + a pale-gold ScoreChip (§1.6).
   Every card drills into the OpportunityDrawer (no dead-end cards — §3). */
function OpportunityKanbanCard({
  lead,
  onClick,
}: {
  lead: SellerLead;
  onClick: () => void;
}) {
  const score = effectiveScore(lead);
  const { action } = nextAction(lead);
  const stale = lead.daysInStage > 7;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-xl border border-mist bg-cloud p-3 text-left shadow-soft transition-all hover:border-ink/20 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-[0.84rem] font-semibold leading-snug text-ink">
          {signalHeadline(lead)}
        </p>
        <ScoreChip score={score} suffix="" className="shrink-0" />
      </div>

      <p className="mt-1.5 truncate text-[0.8rem] font-medium text-ink">{lead.sellerName}</p>
      <p className="truncate text-[0.74rem] text-slate">
        {lead.city} · {compactUsd(lead.estValue)}
      </p>

      <p className="mt-2 line-clamp-1 text-[0.74rem] text-slate">
        <span className="font-medium text-slate">Next:</span> {action}
      </p>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <StatusChip tone={stale ? "danger" : "info"} variant="soft">
          {lead.daysInStage}d in stage
        </StatusChip>
        <span className="flex min-w-0 items-center gap-1.5 text-[0.72rem] text-slate">
          <Avatar
            name={agentName(lead.assignedAgent)}
            slug={lead.assignedAgent}
            size={20}
            ring
          />
          <span className="truncate" title={agentName(lead.assignedAgent)}>
            {agentName(lead.assignedAgent)}
          </span>
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-slate/40 transition-opacity",
              "opacity-0 group-hover:opacity-100",
            )}
            aria-hidden
          />
        </span>
      </div>
    </button>
  );
}
