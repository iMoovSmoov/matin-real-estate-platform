"use client";

import { useMemo, useState } from "react";
import { Inbox, PhoneOff, Flame, Home, Timer, CalendarCheck, Search, UserPlus } from "lucide-react";
import { leads as seedLeads, aiActions, getAgent } from "@/lib/data";
import type { Lead } from "@/lib/types";
import {
  KpiStrip,
  KpiCard,
  DataTable,
  TwoLineCell,
  Avatar,
  StatusChip,
  ScoreChip,
  EmptyState,
  type Column,
} from "@/components/os";
import { LeadDetailPanel } from "@/components/command/crm/LeadDetailPanel";
import { LeadSourceAnalysis } from "@/components/command/crm/LeadSourceAnalysis";
import { AddLeadDrawer } from "@/components/command/crm/AddLeadDrawer";
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

   Master–detail lead-conversion cockpit. Everything here does its REAL job:
     • KPI strip (6) drills into the matching saved view
     • SavedViewTabs + a working search box filter the inbox (state/useMemo)
     • LEFT  DataTable — Avatar identity + sortable columns; row-click selects
     • RIGHT selected-lead detail panel (Avatar/ScoreRing, AI drafts, compose)
     • "+ Add lead" appends to local state and selects the new lead immediately
     • "Assign" in the panel reassigns the owner in local state
     • below the table: Lead source analysis

   No page-level <h1> — the TopCommandBar owns the title. Client page.
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
  const [leads, setLeads] = useState<Lead[]>(seedLeads);
  const [view, setView] = useState<SavedViewKey>("hot");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(CANONICAL_LEAD);
  const [addOpen, setAddOpen] = useState(false);

  const kpis = useMemo(() => crmKpis(leads), [leads]);

  const viewCounts = useMemo(
    () =>
      Object.fromEntries(
        VIEWS.map((v) => [v.key, filterLeads(leads, v.key).length]),
      ) as Record<SavedViewKey, number>,
    [leads],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = filterLeads(leads, view).filter((l) => {
      if (!q) return true;
      const owner = getAgent(l.assignedAgent)?.name ?? l.assignedAgent;
      const hay = `${l.name} ${l.email} ${l.community} ${l.intent} ${l.source} ${owner} ${l.tags.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
    // Strongest leads first, then most-recent.
    return [...filtered].sort(
      (a, b) => b.score - a.score || a.createdDaysAgo - b.createdDaysAgo,
    );
  }, [leads, view, search]);

  const selected = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? rows[0] ?? leads[0],
    [leads, selectedId, rows],
  );

  function handleAssign(leadId: string, agentSlug: string) {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, assignedAgent: agentSlug } : l)),
    );
  }

  function handleAddLead(newLead: Lead) {
    setLeads((prev) => [newLead, ...prev]);
    setView("all");
    setSearch("");
    setSelectedId(newLead.id);
    setAddOpen(false);
  }

  const columns: Column<Lead>[] = [
    {
      key: "name",
      header: "Lead",
      sortable: true,
      render: (l) => (
        <div className="flex items-center gap-3">
          <Avatar name={l.name} size={36} ring={l.score >= 80} />
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
      width: "15rem",
      render: (l) => (
        <span className="line-clamp-2 text-[0.8rem] font-medium leading-snug text-ink">
          {l.nextBestAction ?? "Qualify timeline & budget"}
        </span>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      width: "3.5rem",
      align: "center",
      render: (l) => {
        const a = getAgent(l.assignedAgent);
        return (
          <span className="inline-flex justify-center">
            <Avatar name={a?.name ?? l.assignedAgent} slug={a?.slug} size={28} ring />
          </span>
        );
      },
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.82rem] text-slate">
          Daily lead conversion cockpit — smart lists, scoring, activity, routing, AI next actions.
        </p>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[0.8rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
        >
          <UserPlus className="h-4 w-4" aria-hidden />
          Add lead
        </button>
      </div>

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
            utilityLeft={
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate" aria-hidden />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, email, area, owner, tag…"
                  className="h-8 w-56 rounded-lg border border-mist bg-cloud pl-8 pr-3 text-[0.78rem] text-ink placeholder:text-slate/55 focus:border-ink/30 focus:outline-none sm:w-64"
                  aria-label="Search leads"
                />
              </div>
            }
            savedViews={{
              views: VIEWS.map((v) => ({ ...v, count: viewCounts[v.key] })),
              active: view,
              onChange: (k) => setView(k as SavedViewKey),
            }}
            emptyState={
              <EmptyState
                title={search ? "No leads match your search" : "No leads in this view"}
                body={
                  search
                    ? "Clear the search box or switch smart lists to widen the pool."
                    : "Switch smart lists or add a lead to start working this pool."
                }
                actionLabel={search ? "Clear search" : "View all leads"}
                onAction={() => (search ? setSearch("") : setView("all"))}
              />
            }
          />
        </div>

        {/* RIGHT — selected-lead detail panel */}
        <div className="min-w-0 xl:sticky xl:top-4 xl:h-[calc(100vh-9rem)]">
          {selected ? (
            <LeadDetailPanel lead={selected} aiActions={aiActions} onAssign={handleAssign} />
          ) : null}
        </div>
      </div>

      {/* Lead source analysis */}
      <LeadSourceAnalysis leads={leads} />

      {/* Add-lead form drawer → appends to local state + selects the new lead */}
      <AddLeadDrawer open={addOpen} onClose={() => setAddOpen(false)} onSave={handleAddLead} />
    </div>
  );
}
