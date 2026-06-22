"use client";

import { useMemo, useState } from "react";
import { Search, Home } from "lucide-react";
import type { SellerLead } from "@/lib/types";
import { cn, compactUsd } from "@/lib/utils";
import {
  DataTable,
  TwoLineCell,
  Avatar,
  ScoreChip,
  StatusChip,
  Dot,
  EmptyState,
  type Column,
  type SavedView,
} from "@/components/os";
import {
  effectiveScore,
  nextAction,
  agentName,
  stageTone,
  matchesView,
  SELLER_VIEWS,
  type SellerViewKey,
} from "./sellerView";

/* ──────────────────────────────────────────────────────────────────────────
   Seller / Cash Offers — likely-sellers master list (DataTable)

   The scoreboard view of the same records the kanban arranges by stage. Real
   filtering: saved-view pill tabs + a working search box drive a useMemo. Each
   row is a real opportunity — owner Avatar, two-line address, intent ScoreChip,
   stage dot, next action. Row click opens the OpportunityDrawer (NOT the AI
   panel). Score sorts so the at-a-glance "who to call" floats to the top.
   ────────────────────────────────────────────────────────────────────────── */

type Row = SellerLead & { _score: number; _action: string };

export function LikelySellersTable({
  leads,
  view,
  onView,
  onRowClick,
  onAddOpportunity,
}: {
  leads: SellerLead[];
  view: SellerViewKey;
  onView: (v: SellerViewKey) => void;
  onRowClick: (lead: SellerLead) => void;
  onAddOpportunity: () => void;
}) {
  const [query, setQuery] = useState("");

  const savedViews: SavedView[] = useMemo(
    () =>
      SELLER_VIEWS.map((v) => ({
        key: v.key,
        label: v.label,
        count: leads.filter((l) => matchesView(l, v.key)).length,
      })),
    [leads],
  );

  const rows: Row[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads
      .filter((l) => matchesView(l, view))
      .filter(
        (l) =>
          !q ||
          l.sellerName.toLowerCase().includes(q) ||
          l.address.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          agentName(l.assignedAgent).toLowerCase().includes(q),
      )
      .map((l) => ({
        ...l,
        _score: effectiveScore(l),
        _action: nextAction(l).action,
      }))
      .sort((a, b) => b._score - a._score);
  }, [leads, view, query]);

  const columns: Column<Row>[] = [
    {
      key: "sellerName",
      header: "Owner / property",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={agentName(r.assignedAgent)} slug={r.assignedAgent} size={32} ring />
          <TwoLineCell title={r.sellerName} sub={`${r.address} · ${r.city}`} />
        </div>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      sortable: true,
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-[0.8rem] text-ink">
          <Dot tone={stageTone(r)} />
          {r.stage}
        </span>
      ),
    },
    {
      key: "estValue",
      header: "Est. value",
      align: "right",
      sortable: true,
      render: (r) => (
        <span className="font-medium tabular-nums text-success">{compactUsd(r.estValue)}</span>
      ),
    },
    {
      key: "_action",
      header: "Next action",
      render: (r) => (
        <span className="line-clamp-1 text-[0.8rem] text-slate" title={r._action}>
          {r._action}
        </span>
      ),
    },
    {
      key: "daysInStage",
      header: "Age",
      align: "right",
      sortable: true,
      render: (r) => (
        <StatusChip tone={r.daysInStage > 7 ? "danger" : "info"} variant="soft">
          {r.daysInStage}d
        </StatusChip>
      ),
    },
    {
      key: "_score",
      header: "Intent",
      align: "right",
      sortable: true,
      primary: true,
      cardLabel: "Intent",
      render: (r) => <ScoreChip score={r._score} suffix="" />,
    },
  ];

  return (
    // `key` on the active filter remounts the list so a short fade plays on
    // every saved-view / search change — visible feedback that the data
    // changed (reduced-motion-safe via the motion-safe: variant).
    <div key={`${view}::${query.trim().length > 0}`} className="motion-safe:animate-fade">
    <DataTable<Row>
      columns={columns}
      rows={rows}
      getRowId={(r) => r.id}
      onRowClick={onRowClick}
      responsive
      savedViews={{ views: savedViews, active: view, onChange: (k) => onView(k as SellerViewKey) }}
      utilityLeft={
        // Full-width on phone (R6 — no fixed-narrow search in a flex-wrap
        // header), capping at a comfortable width on larger screens.
        <div className="relative w-full sm:w-56">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search owner, address, agent…"
            className={cn(
              "w-full rounded-lg border border-mist bg-paper-200/60 py-1.5 pl-8 pr-3 text-[0.78rem] text-ink outline-none transition-colors",
              "placeholder:text-slate/60 focus:border-ink/30 focus:bg-cloud",
            )}
          />
        </div>
      }
      emptyState={
        <EmptyState
          icon={<Home className="h-5 w-5" aria-hidden />}
          title="No opportunities in this view"
          body={
            query
              ? `Nothing matches "${query}". Clear the search or switch to another saved view.`
              : "This segment is empty. Add a new seller opportunity or switch saved views to start working another pool."
          }
          actionLabel="Add opportunity"
          onAction={onAddOpportunity}
        />
      }
    />
    </div>
  );
}
