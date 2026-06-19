"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Search,
  LayoutGrid,
  Table2,
  ArrowUpDown,
  Flame,
  ChevronDown,
  Mail,
  Phone,
} from "lucide-react";
import type { Lead } from "@/lib/types";
import { getAgent } from "@/lib/data";
import { cn, compactUsd, initials } from "@/lib/utils";
import { ProgressBar } from "@/components/command/ui";
import { LeadDrawer } from "@/components/command/crm/LeadDrawer";
import { LEAD_STAGES, stageTone, stageDot, scoreTone, scoreBarTone } from "@/components/command/crm/leadStyles";

type View = "table" | "kanban";
type SortKey = "score" | "name" | "lastContact" | "budget";

export function CrmWorkspace({ leads }: { leads: Lead[] }) {
  const [view, setView] = useState<View>("table");
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<string>("All");
  const [source, setSource] = useState<string>("All");
  const [sort, setSort] = useState<SortKey>("score");
  const [asc, setAsc] = useState(false);
  const [active, setActive] = useState<Lead | null>(null);

  const sources = useMemo(() => ["All", ...Array.from(new Set(leads.map((l) => l.source))).sort()], [leads]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = leads.filter((l) => {
      if (stage !== "All" && l.stage !== stage) return false;
      if (source !== "All" && l.source !== source) return false;
      if (q) {
        const hay = `${l.name} ${l.email} ${l.community} ${l.intent} ${l.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const dir = asc ? 1 : -1;
    rows.sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "lastContact":
          return (a.lastContactDaysAgo - b.lastContactDaysAgo) * dir;
        case "budget":
          return (a.budgetMax - b.budgetMax) * dir;
        default:
          return (a.score - b.score) * dir;
      }
    });
    return rows;
  }, [leads, query, stage, source, sort, asc]);

  function toggleSort(key: SortKey) {
    if (sort === key) setAsc((a) => !a);
    else {
      setSort(key);
      setAsc(key === "name"); // names default A→Z, numbers default high→low
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300/55" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, area, tag…"
              className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] pl-9 pr-3 text-[0.84rem] text-white placeholder:text-slate-300/45 focus:border-azure/50 focus:outline-none"
            />
          </div>
          <Select value={stage} onChange={setStage} options={["All", ...LEAD_STAGES]} />
          <Select value={source} onChange={setSource} options={sources} />
        </div>

        {/* View toggle */}
        <div className="inline-flex shrink-0 rounded-lg border border-white/10 bg-white/[0.04] p-0.5">
          <ToggleBtn active={view === "table"} onClick={() => setView("table")} icon={<Table2 className="h-4 w-4" />} label="Table" />
          <ToggleBtn active={view === "kanban"} onClick={() => setView("kanban")} icon={<LayoutGrid className="h-4 w-4" />} label="Pipeline" />
        </div>
      </div>

      <p className="mb-3 text-[0.76rem] text-slate-300/60">
        {filtered.length} of {leads.length} leads
      </p>

      {view === "table" ? (
        <TableView leads={filtered} onOpen={setActive} sort={sort} asc={asc} toggleSort={toggleSort} />
      ) : (
        <KanbanView leads={filtered} onOpen={setActive} />
      )}

      <LeadDrawer lead={active} onClose={() => setActive(null)} />
    </div>
  );
}

/* ── Table ─────────────────────────────────────────────────────────────── */
function TableView({
  leads,
  onOpen,
  sort,
  asc,
  toggleSort,
}: {
  leads: Lead[];
  onOpen: (l: Lead) => void;
  sort: SortKey;
  asc: boolean;
  toggleSort: (k: SortKey) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-900/70">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead>
            <tr className="border-b border-white/10 text-[0.68rem] uppercase tracking-wider text-slate-300/55">
              <Th label="Lead" sortKey="name" {...{ sort, asc, toggleSort }} />
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Stage</th>
              <Th label="Score" sortKey="score" {...{ sort, asc, toggleSort }} />
              <th className="px-4 py-3 font-semibold">Source</th>
              <Th label="Budget" sortKey="budget" {...{ sort, asc, toggleSort }} />
              <th className="px-4 py-3 font-semibold">Agent</th>
              <Th label="Last contact" sortKey="lastContact" {...{ sort, asc, toggleSort }} />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {leads.map((l) => {
              const agent = getAgent(l.assignedAgent);
              return (
                <tr
                  key={l.id}
                  onClick={() => onOpen(l)}
                  className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-azure to-azure-deep text-[0.62rem] font-bold text-white">
                        {initials(l.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate text-[0.84rem] font-semibold text-white">
                          {l.name}
                          {l.unread > 0 && <span className="h-1.5 w-1.5 rounded-full bg-azure-bright" title={`${l.unread} unread`} />}
                        </p>
                        <p className="truncate text-[0.72rem] text-slate-300/60">{l.intent}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5 text-[0.74rem] text-slate-300/75">
                      <p className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-slate-300/45" />{l.email}</p>
                      <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-slate-300/45" />{l.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-md px-2 py-0.5 text-[0.7rem] font-semibold ring-1 ring-inset", stageTone(l.stage))}>
                      {l.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-flex w-9 items-center justify-center gap-0.5 rounded-md py-0.5 text-[0.72rem] font-bold ring-1 ring-inset tabular-nums", scoreTone(l.score))}>
                        {l.score >= 80 && <Flame className="h-2.5 w-2.5" />}
                        {l.score}
                      </span>
                      <ProgressBar value={l.score} tone={scoreBarTone(l.score)} className="hidden w-14 xl:block" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[0.78rem] text-slate-300/75">{l.source}</td>
                  <td className="px-4 py-3 text-[0.78rem] font-medium text-white tabular-nums">
                    {compactUsd(l.budgetMin)}–{compactUsd(l.budgetMax)}
                  </td>
                  <td className="px-4 py-3">
                    {agent ? (
                      <div className="flex items-center gap-2">
                        <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
                          <Image src={agent.photo} alt={agent.name} fill sizes="24px" className="object-cover" />
                        </span>
                        <span className="truncate text-[0.76rem] text-slate-300/80">{agent.firstName}</span>
                      </div>
                    ) : (
                      <span className="text-[0.76rem] text-slate-300/45">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[0.76rem] text-slate-300/70">
                    {l.lastContactDaysAgo === 0 ? "today" : `${l.lastContactDaysAgo}d ago`}
                  </td>
                </tr>
              );
            })}
            {leads.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[0.84rem] text-slate-300/55">
                  No leads match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  label,
  sortKey,
  sort,
  asc,
  toggleSort,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortKey;
  asc: boolean;
  toggleSort: (k: SortKey) => void;
}) {
  const activeSort = sort === sortKey;
  return (
    <th className="px-4 py-3 font-semibold">
      <button onClick={() => toggleSort(sortKey)} className={cn("inline-flex items-center gap-1 hover:text-white", activeSort && "text-azure-bright")}>
        {label}
        <ArrowUpDown className={cn("h-3 w-3", activeSort ? "opacity-100" : "opacity-30")} />
        {activeSort && <span className="text-[0.6rem]">{asc ? "↑" : "↓"}</span>}
      </button>
    </th>
  );
}

/* ── Kanban ────────────────────────────────────────────────────────────── */
function KanbanView({ leads, onOpen }: { leads: Lead[]; onOpen: (l: Lead) => void }) {
  const columns = LEAD_STAGES; // already ordered New → … → Lost
  return (
    <div className="-mx-1 overflow-x-auto pb-2">
      <div className="flex min-w-max gap-3 px-1">
        {columns.map((col) => {
          const items = leads.filter((l) => l.stage === col);
          return (
            <div key={col} className="flex w-[16.5rem] shrink-0 flex-col rounded-2xl border border-white/10 bg-ink-900/50">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", stageDot(col))} />
                  <span className="text-[0.78rem] font-semibold text-white">{col}</span>
                </div>
                <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[0.66rem] font-semibold text-slate-300/70">{items.length}</span>
              </div>
              <div className="flex max-h-[34rem] flex-col gap-2 overflow-y-auto p-2.5">
                {items.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => onOpen(l)}
                    className="group rounded-xl border border-white/10 bg-ink-800/60 p-3 text-left transition-all hover:border-azure/40 hover:bg-azure/[0.05]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-[0.82rem] font-semibold text-white">{l.name}</p>
                      <span className={cn("inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[0.66rem] font-bold ring-1 ring-inset tabular-nums", scoreTone(l.score))}>
                        {l.score >= 80 && <Flame className="h-2.5 w-2.5" />}
                        {l.score}
                      </span>
                    </div>
                    <p className="mt-1 text-[0.72rem] text-slate-300/65">{l.intent} · {l.community}</p>
                    <p className="mt-1.5 text-[0.74rem] font-medium text-azure-300 tabular-nums">
                      {compactUsd(l.budgetMin)}–{compactUsd(l.budgetMax)}
                    </p>
                    {l.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {l.tags.slice(0, 2).map((t) => (
                          <span key={t} className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[0.62rem] text-slate-300/70">{t}</span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
                {items.length === 0 && <p className="px-1 py-3 text-center text-[0.72rem] text-slate-300/35">Empty</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Small controls ────────────────────────────────────────────────────── */
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-lg border border-white/10 bg-white/[0.04] pl-3 pr-8 text-[0.82rem] font-medium text-white focus:border-azure/50 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-ink-800">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300/50" />
    </div>
  );
}

function ToggleBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[0.78rem] font-semibold transition-colors",
        active ? "bg-azure text-white" : "text-slate-300 hover:text-white",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
