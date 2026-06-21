"use client";

import { useMemo, useState } from "react";
import {
  Database,
  Home,
  DollarSign,
  CalendarCheck,
  ChevronRight,
} from "lucide-react";
import { sellerLeads } from "@/lib/data";
import type { SellerLead } from "@/lib/types";
import { cn, compactUsd } from "@/lib/utils";
import {
  KpiStrip,
  KpiCard,
  KanbanBoard,
  ScoreChip,
  StatusChip,
  type KanbanColumn,
} from "@/components/os";
import { OpportunityDrawer } from "./OpportunityDrawer";
import { CashOfferMatrix } from "./CashOfferMatrix";
import {
  columnForStage,
  signalHeadline,
  effectiveScore,
  nextAction,
  agentName,
  type PipelineColumnKey,
} from "./sellerView";

/* ──────────────────────────────────────────────────────────────────────────
   Seller / Cash Offers — opportunity desk   (build-reference §2.3 / wireframe 06)

   "Find hidden homeowners, enrich data, trigger campaigns, route hot
   opportunities — signal to listing won."

   Layout (composed from "@/components/os" primitives only — re-implements
   nothing):
     • muted subtitle (no page <h1> — TopCommandBar owns the section name)
     • KPI strip (4) — database owners / likely sellers / cash-offer requests /
       agent appts
     • PRIMARY: KanbanBoard — Signal detected → AI nurture (ai) → Human
       follow-up, + a dark "Backend logic" column listing scoring inputs &
       DB tables. Card click → OpportunityDrawer.
     • SECONDARY: cash-offer comparison matrix + net sheet (CashOfferMatrix).
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

export function SellerDeskWorkspace() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => sellerLeads.find((l) => l.id === selectedId) ?? null,
    [selectedId],
  );

  const columns = useMemo<KanbanColumn<SellerLead>[]>(() => {
    return COLUMN_META.map((meta) => {
      const cards = sellerLeads
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
  }, []);

  return (
    <div className="flex flex-col gap-5 px-4 py-5 md:px-6">
      {/* Subtitle (no h1 — TopCommandBar owns the section title) */}
      <p className="text-[0.82rem] text-slate">
        Find hidden homeowners, enrich data, trigger campaigns, route hot opportunities — signal to listing won.
      </p>

      {/* KPI strip — scrolls the pipeline below into the relevant pool */}
      <KpiStrip className="xl:grid-cols-4">
        <KpiCard
          label="Database owners"
          value="38,420"
          icon={<Database className="h-4 w-4" />}
          hint="Homeowners in the farm"
          delta="+612 this quarter"
          deltaTone="up"
          onDrill={() => scrollTo("pipeline")}
        />
        <KpiCard
          label="Likely sellers"
          value="1,286"
          valueTone="success"
          icon={<Home className="h-4 w-4" />}
          hint="AI seller-intent ≥ 60"
          delta="+84 vs last week"
          deltaTone="up"
          onDrill={() => scrollTo("pipeline")}
        />
        <KpiCard
          label="Cash offer requests"
          value={74}
          icon={<DollarSign className="h-4 w-4" />}
          hint="Bypass normal priority"
          delta="9 awaiting review"
          deltaTone="flat"
          onDrill={() => scrollTo("cash-offer-desk")}
        />
        <KpiCard
          label="Agent appts"
          value={21}
          icon={<CalendarCheck className="h-4 w-4" />}
          hint="Booked this week"
          delta="+5 vs goal"
          deltaTone="up"
          onDrill={() => scrollTo("pipeline")}
        />
      </KpiStrip>

      {/* PRIMARY — pipeline kanban */}
      <section id="pipeline" className="scroll-mt-20">
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">
            Seller opportunity pipeline
          </h2>
          <p className="text-[0.76rem] text-slate">
            Behavioral stages — automated nurture on the left of the line, humans on the right.
          </p>
        </div>
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

      {/* Opportunity drawer (card click) */}
      <OpportunityDrawer lead={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}

/* ── Kanban card ───────────────────────────────────────────────────────────
   Bold signal/stage title + owner name + a pale-gold ScoreChip (§1.6). Every
   card drills into the OpportunityDrawer (no dead-end cards — §3). */
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
        <span className="flex items-center gap-1 text-[0.72rem] text-slate">
          <span className="truncate" title={agentName(lead.assignedAgent)}>
            {agentName(lead.assignedAgent)}
          </span>
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 text-slate/40 transition-opacity",
              "opacity-0 group-hover:opacity-100",
            )}
            aria-hidden
          />
        </span>
      </div>
    </button>
  );
}
