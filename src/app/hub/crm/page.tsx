"use client";

import { forwardRef, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Inbox,
  PhoneOff,
  Flame,
  Home,
  Timer,
  CalendarCheck,
  Search,
  UserPlus,
  X,
  CalendarClock,
} from "lucide-react";
import { leads as seedLeads, aiActions, getAgent, company } from "@/lib/data";
import type { Lead } from "@/lib/types";
import {
  KpiStrip,
  KpiCard,
  DataTable,
  StatusChip,
  EmptyState,
  type Column,
} from "@/components/os";
import { Logo } from "@/components/brand/Logo";
import { LeadDetailPanel } from "@/components/command/crm/LeadDetailPanel";
import { LeadSourceAnalysis } from "@/components/command/crm/LeadSourceAnalysis";
import { AddLeadDrawer } from "@/components/command/crm/AddLeadDrawer";
import {
  LeadIdentityCell,
  LeadEngagementCell,
  LeadQuickActions,
  LeadScoreRing,
} from "@/components/command/crm/LeadRowCells";
import { ComposeDrawer, type ComposeMode, type ComposeResult } from "@/components/command/crm/ComposeDrawer";
import { smoothScrollTo, useViewFade } from "@/components/command/crm/useViewTransition";
import { cn } from "@/lib/utils";
import {
  type SavedViewKey,
  filterLeads,
  crmKpis,
  leadTypeLabel,
  leadTypeTone,
  locationViews,
  stageTone,
} from "@/components/command/crm/leadView";

/* ──────────────────────────────────────────────────────────────────────────
   CRM & Leads Workbench  → /hub/crm   (build-reference §2.2 · tickets S2.1–S2.10)

   Master–detail lead-conversion cockpit with Real-Geeks row density:
     • KPI strip (6) drills into the matching saved view
     • SavedViewTabs (behavioral + REAL location smart-lists) + search filter
     • LEFT  DataTable — temperature-ring identity, engagement strip, 6-up quick
       actions, score pinned as the primary card column; responsive → cards < lg
     • RIGHT selected-lead detail panel (hero budget value, AI drafts citing REAL
       listings, branded artifact on Approve, brand footer) — desktop xl+
     • MOBILE master-detail (R2): row-tap opens the panel as a full-width
       slide-over below xl (not a panel rendered 40 rows down)
     • below: recharts Lead source analysis + an appointments band (wide screens)
   ────────────────────────────────────────────────────────────────────────── */

const BEHAVIORAL_VIEWS: { key: SavedViewKey; label: string }[] = [
  { key: "new-today", label: "New today" },
  { key: "hot", label: "Hot leads" },
  { key: "seller-intent", label: "Seller intent" },
  { key: "needs-call", label: "Needs call" },
  { key: "unassigned", label: "Unassigned" },
  { key: "all", label: "All" },
];

const CANONICAL_LEAD = "LD-1999"; // Daniel Cho (84)

export default function CrmPage() {
  return (
    <Suspense fallback={null}>
      <CrmPageInner />
    </Suspense>
  );
}

function CrmPageInner() {
  const [leads, setLeads] = useState<Lead[]>(seedLeads);
  const [view, setView] = useState<SavedViewKey>("hot");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(CANONICAL_LEAD);
  const [addOpen, setAddOpen] = useState(false);
  /** mobile master-detail slide-over (below the lg split breakpoint) */
  const [mobileOpen, setMobileOpen] = useState(false);
  /** quick-action compose target opened directly from a row */
  const [rowCompose, setRowCompose] = useState<{ lead: Lead; mode: ComposeMode } | null>(null);

  // Shared "+ Create" menu deep-link: /hub/crm?create=lead auto-opens the
  // AddLeadDrawer on mount, then strips the param so refresh/back won't reopen.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const createHandled = useRef(false);
  useEffect(() => {
    if (createHandled.current) return;
    if (searchParams.get("create") === "lead") {
      createHandled.current = true;
      setAddOpen(true);
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  /* The lead inbox sits well below the KPI strip; a KPI drill that re-filters it
     must be VISIBLE, so we scroll the master-detail into view + fade the list on
     every view change (MANDATE 1). The detail panel splits at lg (≥1024), so the
     mobile slide-over only takes over below lg. */
  const masterRef = useRef<HTMLDivElement>(null);
  const appointmentsRef = useRef<HTMLElement>(null);
  // Hold the `entering` flag for the full fade duration so the class isn't
  // pulled mid-animation (animate-fade ≈ 1s).
  const listFade = useViewFade(1000);
  /** lg breakpoint — at/above this the inline detail panel is visible. */
  const LG = 1024;

  /** Switch the saved view AND make the re-filtered list visible (scroll + fade). */
  const bumpList = listFade.bump;
  const goToView = useCallback(
    (next: SavedViewKey, scroll = true) => {
      setView(next);
      setSearch("");
      bumpList();
      if (scroll) {
        requestAnimationFrame(() => smoothScrollTo(masterRef.current, "start"));
      }
    },
    [bumpList],
  );

  const kpis = useMemo(() => crmKpis(leads), [leads]);

  // Behavioral + real location smart-lists, each with a live count.
  const locViews = useMemo(() => locationViews(leads, 4), [leads]);
  const allViews = useMemo(
    () => [...BEHAVIORAL_VIEWS, ...locViews.map((v) => ({ key: v.key, label: v.label }))],
    [locViews],
  );
  const viewCounts = useMemo(
    () =>
      Object.fromEntries(allViews.map((v) => [v.key, filterLeads(leads, v.key).length])) as Record<
        string,
        number
      >,
    [allViews, leads],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = filterLeads(leads, view).filter((l) => {
      if (!q) return true;
      const owner = getAgent(l.assignedAgent)?.name ?? l.assignedAgent;
      const hay = `${l.name} ${l.email} ${l.community} ${l.intent} ${l.source} ${owner} ${l.tags.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
    return [...filtered].sort((a, b) => b.score - a.score || a.createdDaysAgo - b.createdDaysAgo);
  }, [leads, view, search]);

  const selected = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? rows[0] ?? leads[0],
    [leads, selectedId, rows],
  );

  function handleAssign(leadId: string, agentSlug: string) {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, assignedAgent: agentSlug } : l)));
  }

  function handleAddLead(newLead: Lead) {
    setLeads((prev) => [newLead, ...prev]);
    setView("all");
    setSearch("");
    setSelectedId(newLead.id);
    setAddOpen(false);
    listFade.bump();
    // Bring the new row (now at the top of "all") into view with feedback.
    requestAnimationFrame(() => smoothScrollTo(masterRef.current, "start"));
  }

  /** Row-tap selects the lead; below the lg split it opens the mobile slide-over
      (R2) so the tap produces an immediate, on-screen detail — never a panel
      updated off-screen. At lg+ the inline detail panel updates in place. */
  function selectLead(l: Lead, openMobile = true) {
    setSelectedId(l.id);
    if (openMobile && typeof window !== "undefined" && window.innerWidth < LG) {
      setMobileOpen(true);
    }
  }

  /** 6-up quick action from a row — Call is a tel: link in the cell itself. */
  function handleRowAction(l: Lead, action: "text" | "email" | "schedule" | "assign" | "ai") {
    setSelectedId(l.id);
    if (action === "ai") {
      // route through the detail panel's Ask-Matin (open the panel)
      selectLead(l);
      return;
    }
    setRowCompose({ lead: l, mode: action });
  }

  function handleRowComposeComplete(result: ComposeResult) {
    if (result.mode === "assign") handleAssign(rowCompose!.lead.id, result.agentSlug);
    setRowCompose(null);
  }

  const columns: Column<Lead>[] = [
    {
      key: "name",
      header: "Lead",
      sortable: true,
      render: (l) => <LeadIdentityCell lead={l} />,
    },
    {
      key: "intent",
      header: "Type",
      width: "8rem",
      sortable: true,
      cardLabel: "Type",
      render: (l) => (
        <StatusChip tone={leadTypeTone(l)} variant="soft">
          {leadTypeLabel(l)}
        </StatusChip>
      ),
    },
    {
      key: "engagement",
      header: "Engagement",
      width: "15rem",
      cardLabel: "Engagement",
      render: (l) => <LeadEngagementCell lead={l} />,
    },
    {
      key: "nextBestAction",
      header: "Next best action",
      width: "13rem",
      cardLabel: "Next best action",
      render: (l) => (
        <span className="line-clamp-2 text-[0.8rem] font-medium leading-snug text-ink">
          {l.nextBestAction ?? "Qualify timeline & budget"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Quick actions",
      width: "13rem",
      align: "right",
      // On mobile the card-tap opens the full detail panel (all actions there);
      // the 6-up cluster is a desktop-table affordance only (avoids a cramped card).
      cardHidden: true,
      render: (l) => <LeadQuickActions lead={l} onAction={handleRowAction} />,
    },
    {
      key: "score",
      header: "Score",
      align: "right",
      width: "5.5rem",
      sortable: true,
      primary: true,
      cardLabel: "Score",
      // Promote the gold ScoreRing into the row (S2.3) — the AI priority signal.
      render: (l) => (
        <span className="inline-flex justify-end">
          <LeadScoreRing lead={l} />
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

      {/* KPI strip — 3-up through the lg band (the 1024–1279 default 4-up would
          orphan 2 of the 6 tiles in a half-empty second row), 6-up only at xl. */}
      <KpiStrip className="lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="New leads"
          value={kpis.newLeads}
          icon={<Inbox className="h-4 w-4" />}
          hint="Created today"
          delta="vs 5 yest."
          deltaTone="up"
          onDrill={() => goToView("new-today")}
        />
        <KpiCard
          label="Uncontacted"
          value={kpis.uncontacted}
          valueTone={kpis.uncontacted > 0 ? "danger" : "ink"}
          icon={<PhoneOff className="h-4 w-4" />}
          hint="Open · no reply / new"
          onDrill={() => goToView("needs-call")}
        />
        <KpiCard
          label="Hot buyers"
          value={kpis.hotBuyers}
          valueTone="success"
          icon={<Flame className="h-4 w-4" />}
          hint="Score ≥ 80 buying"
          onDrill={() => goToView("hot")}
        />
        <KpiCard
          label="Hot sellers"
          value={kpis.hotSellers}
          valueTone="success"
          icon={<Home className="h-4 w-4" />}
          hint="Score ≥ 80 selling"
          onDrill={() => goToView("seller-intent")}
        />
        <KpiCard
          label="Avg first response"
          value={`${kpis.avgFirstResponse}m`}
          icon={<Timer className="h-4 w-4" />}
          hint="Speed-to-lead — tap to work uncalled"
          delta="−3m vs goal"
          deltaTone="up"
          onDrill={() => goToView("needs-call")}
        />
        <KpiCard
          label="Appointments set"
          value={kpis.appointments}
          icon={<CalendarCheck className="h-4 w-4" />}
          hint="Showings & offers — tap to review"
          delta="this week"
          deltaTone="flat"
          onDrill={() =>
            requestAnimationFrame(() => smoothScrollTo(appointmentsRef.current, "start"))
          }
        />
      </KpiStrip>

      {/* Master–detail — splits at lg (≥1024) so the 1024–1279 band gets the real
          two-pane workspace, not a cramped single column. Below lg the detail is
          a full-width slide-over (R1/R2). */}
      <div
        ref={masterRef}
        className="grid scroll-mt-20 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]"
      >
        {/* LEFT — lead inbox (view-swap fade; not re-keyed so DataTable keeps its
            sort/selection state across filter changes) */}
        <div className={cn("min-w-0", listFade.entering && "motion-safe:animate-fade")}>
          <DataTable
            rows={rows}
            getRowId={(l) => l.id}
            columns={columns}
            selectable
            responsive
            onRowClick={(l) => selectLead(l)}
            utilityLeft={
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate" aria-hidden />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, email, area, owner, tag…"
                  className="h-8 w-44 rounded-lg border border-mist bg-cloud pl-8 pr-3 text-[0.78rem] text-ink placeholder:text-slate/55 focus:border-ink/30 focus:outline-none sm:w-64"
                  aria-label="Search leads"
                />
              </div>
            }
            savedViews={{
              views: allViews.map((v) => ({ ...v, count: viewCounts[v.key] })),
              active: view,
              onChange: (k) => {
                setView(k as SavedViewKey);
                listFade.bump();
              },
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
                onAction={() =>
                  search ? (setSearch(""), listFade.bump()) : goToView("all", false)
                }
              />
            }
          />
        </div>

        {/* RIGHT — selected-lead detail panel (inline at lg+; below lg it becomes
            the full-width slide-over rendered at the end of the page) */}
        <div className="hidden min-w-0 lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-9rem)]">
          {selected ? (
            <LeadDetailPanel lead={selected} aiActions={aiActions} onAssign={handleAssign} />
          ) : null}
        </div>
      </div>

      {/* Secondary desktop band — appointments / real office contact (S2.10) */}
      <AppointmentsBand
        ref={appointmentsRef}
        leads={leads}
        onOpen={(l) => selectLead(l)}
      />

      {/* Lead source analysis (recharts) */}
      <LeadSourceAnalysis leads={leads} />

      {/* Add-lead form drawer → appends to local state + selects the new lead */}
      <AddLeadDrawer open={addOpen} onClose={() => setAddOpen(false)} onSave={handleAddLead} />

      {/* Row quick-action compose drawer (text/email/schedule/assign) */}
      {rowCompose ? (
        <ComposeDrawer
          lead={rowCompose.lead}
          mode={rowCompose.mode}
          open
          onClose={() => setRowCompose(null)}
          onComplete={handleRowComposeComplete}
        />
      ) : null}

      {/* MOBILE master-detail — full-width slide-over below the lg split (R2) */}
      {mobileOpen && selected ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-cloud motion-safe:animate-rise lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-mist bg-ink-900 px-4 py-3">
            <span className="truncate font-display text-[1.05rem] text-cloud">{selected.name}</span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 p-3 pb-[calc(env(safe-area-inset-bottom)+4.5rem)]">
            <LeadDetailPanel lead={selected} aiActions={aiActions} onAssign={handleAssign} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── Appointments / office band (wide-screen secondary surface, S2.10) ─────── */
const AppointmentsBand = forwardRef<
  HTMLElement,
  { leads: Lead[]; onOpen: (l: Lead) => void }
>(function AppointmentsBand({ leads, onOpen }, ref) {
  // Real upcoming-touch candidates: leads that progressed to a showing/offer.
  // Keep the FULL count so the header reconciles to the "Appointments set" KPI,
  // and only cap the rendered cards (highest-intent first).
  const appointmentLeads = leads
    .filter((l) => ["Showing", "Offer", "Under Contract"].includes(l.stage))
    .sort((a, b) => b.score - a.score);
  const upcoming = appointmentLeads.slice(0, 4);
  const moreCount = appointmentLeads.length - upcoming.length;

  return (
    <section ref={ref} className="scroll-mt-20 rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-slate" aria-hidden />
          <h3 className="font-display text-[1.02rem] font-normal leading-tight text-ink">
            Upcoming appointments
          </h3>
        </div>
        <span className="text-[0.72rem] text-slate tabular-nums">
          {appointmentLeads.length} this week
        </span>
      </div>

      {upcoming.length > 0 ? (
        <>
          <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {upcoming.map((l) => (
              <li key={l.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onOpen(l)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-mist bg-paper-200/40 px-3.5 py-2.5 text-left transition-colors hover:border-ink/20"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[0.84rem] font-semibold text-ink">{l.name}</span>
                    <span className="block truncate text-[0.74rem] text-slate">
                      {l.community} · {l.stage}
                    </span>
                  </span>
                  <StatusChip tone={stageTone(l.stage)} variant="soft">
                    {l.stage}
                  </StatusChip>
                </button>
              </li>
            ))}
          </ul>
          {moreCount > 0 ? (
            <p className="mt-2.5 text-[0.72rem] text-slate tabular-nums">
              Showing the {upcoming.length} highest-intent of {appointmentLeads.length}.
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-3 text-[0.8rem] text-slate">No appointments scheduled yet this week.</p>
      )}

      {/* Quiet Matin brand mark + real West Linn office line */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-mist pt-3">
        <Logo variant="full" theme="dark" className="h-3.5" />
        <span className="text-[0.68rem] text-slate">
          {company.name} · {company.address.street}, {company.address.city} {company.address.state}{" "}
          {company.address.zip} · {company.phone}
        </span>
      </div>
    </section>
  );
});
