"use client";

import { useMemo, useState } from "react";
import { Inbox, PhoneOff, Flame, Home, Timer, CalendarCheck } from "lucide-react";
import { leads as allLeads, aiActions } from "@/lib/data";
import type { Lead } from "@/lib/types";
import {
  KpiStrip,
  KpiCard,
  DataTable,
  TwoLineCell,
  InitialsToken,
  StatusChip,
  ScoreChip,
  EmptyState,
  type Column,
} from "@/components/os";
import { LeadDetailPanel } from "@/components/command/crm/LeadDetailPanel";
import { LeadSourceAnalysis } from "@/components/command/crm/LeadSourceAnalysis";
import {
  type SavedViewKey,
  filterLeads,
  crmKpis,
  leadTypeLabel,
  leadTypeTone,
  intentSignal,
} from "@/components/command/crm/leadView";

/* ──────────────────────────────────────────────────────────────────────────
   CRM & Leads Workbench  → /hub/crm   (build-reference §2.2)

   Daily lead conversion cockpit, master–detail on one screen:
     • KPI strip (6) derived from the leads array
     • SavedViewTabs smart lists filtering the inbox
     • LEFT ~62%  DataTable lead inbox (name+source · type · signal · NBA · score)
     • RIGHT ~36% selected-lead detail panel (defaults to Daniel Cho)
     • below the table: Lead source analysis horizontal bars

   No page-level <h1> — the TopCommandBar renders the section name; we render
   only the muted subtitle. Client page (filter + selection state).
   ────────────────────────────────────────────────────────────────────────── */

const VIEWS: { key: SavedViewKey; label: string }[] = [
  { key: "new-today", label: "New today" },
  { key: "hot", label: "Hot leads" },
  { key: "seller-intent", label: "Seller intent" },
  { key: "needs-call", label: "Needs call" },
  { key: "unassigned", label: "Unassigned" },
  { key: "all", label: "All" },
];

const CANONICAL_LEAD = "LD-1999"; // Daniel Cho (84)

export default function CrmPage() {
  const [view, setView] = useState<SavedViewKey>("hot");
  const [selectedId, setSelectedId] = useState<string>(CANONICAL_LEAD);

  const kpis = useMemo(() => crmKpis(allLeads), []);
  const viewCounts = useMemo(
    () =>
      Object.fromEntries(
        VIEWS.map((v) => [v.key, filterLeads(allLeads, v.key).length]),
      ) as Record<SavedViewKey, number>,
    [],
  );

  const rows = useMemo(() => {
    const filtered = filterLeads(allLeads, view);
    // Strongest leads first, then most-recent.
    return [...filtered].sort(
      (a, b) => b.score - a.score || a.createdDaysAgo - b.createdDaysAgo,
    );
  }, [view]);

  const selected = useMemo(
    () => allLeads.find((l) => l.id === selectedId) ?? rows[0] ?? allLeads[0],
    [selectedId, rows],
  );

  const columns: Column<Lead>[] = [
    {
      key: "name",
      header: "Lead",
      sortable: true,
      render: (l) => (
        <div className="flex items-center gap-3">
          <InitialsToken name={l.name} />
          <TwoLineCell title={l.name} sub={`${l.source} · ${l.community}`} />
        </div>
      ),
    },
    {
      key: "intent",
      header: "Type",
      width: "8rem",
      sortable: true,
      render: (l) => (
        <StatusChip tone={leadTypeTone(l)} variant="soft">
          {leadTypeLabel(l)}
        </StatusChip>
      ),
    },
    {
      key: "signal",
      header: "Signal / intent",
      render: (l) => (
        <span className="line-clamp-2 text-[0.8rem] leading-snug text-slate">
          {intentSignal(l)}
        </span>
      ),
    },
    {
      key: "nextBestAction",
      header: "Next best action",
      width: "16rem",
      render: (l) => (
        <span className="line-clamp-2 text-[0.8rem] font-medium leading-snug text-ink">
          {l.nextBestAction ?? "Qualify timeline & budget"}
        </span>
      ),
    },
    {
      key: "score",
      header: "Score",
      align: "right",
      width: "6rem",
      sortable: true,
      render: (l) => (
        <span className="inline-flex justify-end">
          <ScoreChip score={l.score} suffix="" />
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5 px-4 py-5 md:px-6">
      {/* Subtitle (no h1 — the TopCommandBar owns the section title) */}
      <p className="text-[0.82rem] text-slate">
        Daily lead conversion cockpit — smart lists, scoring, activity, routing, AI next actions.
      </p>

      {/* KPI strip */}
      <KpiStrip>
        <KpiCard
          label="New leads"
          value={kpis.newLeads}
          icon={<Inbox className="h-4 w-4" />}
          hint="Created today"
          delta="vs 5 yest."
          deltaTone="up"
          onDrill={() => setView("new-today")}
        />
        <KpiCard
          label="Uncontacted"
          value={kpis.uncontacted}
          valueTone={kpis.uncontacted > 0 ? "danger" : "ink"}
          icon={<PhoneOff className="h-4 w-4" />}
          hint="Open · no reply / new"
          onDrill={() => setView("needs-call")}
        />
        <KpiCard
          label="Hot buyers"
          value={kpis.hotBuyers}
          valueTone="success"
          icon={<Flame className="h-4 w-4" />}
          hint="Score ≥ 80 buying"
          onDrill={() => setView("hot")}
        />
        <KpiCard
          label="Hot sellers"
          value={kpis.hotSellers}
          valueTone="success"
          icon={<Home className="h-4 w-4" />}
          hint="Score ≥ 80 selling"
          onDrill={() => setView("seller-intent")}
        />
        <KpiCard
          label="Avg first response"
          value={`${kpis.avgFirstResponse}m`}
          icon={<Timer className="h-4 w-4" />}
          hint="Speed-to-lead"
          delta="−3m vs goal"
          deltaTone="up"
        />
        <KpiCard
          label="Appointments set"
          value={kpis.appointments}
          icon={<CalendarCheck className="h-4 w-4" />}
          hint="Showings & offers"
          delta="this week"
          deltaTone="flat"
        />
      </KpiStrip>

      {/* Master–detail */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_1fr]">
        {/* LEFT — lead inbox */}
        <div className="min-w-0">
          <DataTable
            rows={rows}
            getRowId={(l) => l.id}
            columns={columns}
            selectable
            onRowClick={(l) => setSelectedId(l.id)}
            savedViews={{
              views: VIEWS.map((v) => ({ ...v, count: viewCounts[v.key] })),
              active: view,
              onChange: (k) => setView(k as SavedViewKey),
            }}
            emptyState={
              <EmptyState
                title="No leads in this view"
                body="Switch smart lists or import leads from a connected source to start working this pool."
                actionLabel="View all leads"
                onAction={() => setView("all")}
              />
            }
          />
        </div>

        {/* RIGHT — selected-lead detail panel */}
        <div className="min-w-0 xl:sticky xl:top-4 xl:h-[calc(100vh-9rem)]">
          {selected ? (
            <LeadDetailPanel lead={selected} aiActions={aiActions} />
          ) : null}
        </div>
      </div>

      {/* Lead source analysis */}
      <LeadSourceAnalysis leads={allLeads} />
    </div>
  );
}
