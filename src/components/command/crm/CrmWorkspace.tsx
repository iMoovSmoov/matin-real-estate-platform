"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Search,
  ArrowUpDown,
  Flame,
  ChevronDown,
  Inbox,
  Clock,
  Zap,
  Activity as ActivityIcon,
  Layers,
} from "lucide-react";
import type { Lead } from "@/lib/types";
import { getAgent } from "@/lib/data";
import { cn, compactUsd, initials, timeAgo } from "@/lib/utils";
import { LeadDrawer } from "@/components/command/crm/LeadDrawer";
import { stageTone, scoreTone } from "@/components/command/crm/leadStyles";

type SortKey = "score" | "recency" | "name";

/* ── Smart lists — Follow Up Boss's signature feature ──────────────────────── */
type SmartList = {
  id: string;
  label: string;
  icon: typeof Inbox;
  match: (l: Lead) => boolean;
};

const SMART_LISTS: SmartList[] = [
  { id: "new", label: "New", icon: Inbox, match: (l) => l.stage === "New" },
  {
    id: "followup",
    label: "Needs follow-up",
    icon: Clock,
    match: (l) => l.lastContactDaysAgo >= 7 && l.stage !== "Closed" && l.stage !== "Lost",
  },
  { id: "hot", label: "Hot", icon: Zap, match: (l) => l.score >= 80 },
  {
    id: "active",
    label: "Active",
    icon: ActivityIcon,
    match: (l) => ["Active", "Showing", "Offer", "Under Contract"].includes(l.stage),
  },
  { id: "all", label: "All", icon: Layers, match: () => true },
];

export function CrmWorkspace({ leads }: { leads: Lead[] }) {
  const [listId, setListId] = useState<string>("followup");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recency");
  const [active, setActive] = useState<Lead | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const sl of SMART_LISTS) c[sl.id] = leads.filter(sl.match).length;
    return c;
  }, [leads]);

  const list = SMART_LISTS.find((l) => l.id === listId) ?? SMART_LISTS[SMART_LISTS.length - 1];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = leads.filter((l) => {
      if (!list.match(l)) return false;
      if (q) {
        const hay = `${l.name} ${l.email} ${l.community} ${l.intent} ${l.source} ${l.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    rows.sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "recency":
          // Most recently contacted first; unread floats up on ties.
          if (a.lastContactDaysAgo !== b.lastContactDaysAgo) return a.lastContactDaysAgo - b.lastContactDaysAgo;
          return b.unread - a.unread || b.score - a.score;
        default:
          return b.score - a.score || a.lastContactDaysAgo - b.lastContactDaysAgo;
      }
    });
    return rows;
  }, [leads, list, query, sort]);

  return (
    <div>
      {/* Smart lists */}
      <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
        {SMART_LISTS.map((sl) => {
          const on = sl.id === listId;
          const Icon = sl.icon;
          return (
            <button
              key={sl.id}
              onClick={() => setListId(sl.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-[0.82rem] font-semibold transition-colors",
                on
                  ? "border-ink/15 bg-ink/[0.06] text-ink"
                  : "border-ink/[0.08] bg-white text-slate hover:border-ink/15 hover:bg-white hover:text-ink",
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", on ? "text-ink" : "text-slate")} />
              {sl.label}
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[0.68rem] font-bold tabular-nums",
                  on ? "bg-ink text-white" : "bg-paper text-slate",
                )}
              >
                {counts[sl.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search + sort */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate/55" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, area, tag…"
            className="h-9 w-full rounded-lg border border-ink/[0.08] bg-white pl-9 pr-3 text-[0.84rem] text-ink placeholder:text-slate/40 focus:border-ink/20 focus:outline-none"
          />
        </div>
        <SortSelect value={sort} onChange={setSort} />
      </div>

      {/* Inbox */}
      <div className="overflow-hidden rounded-2xl border border-ink/[0.08] bg-white backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-ink/[0.08] px-4 py-2.5">
          <p className="flex items-center gap-2 text-[0.78rem] font-semibold text-ink">
            <list.icon className="h-3.5 w-3.5" />
            {list.label}
          </p>
          <p className="text-[0.72rem] text-slate/60 tabular-nums">
            {filtered.length} {filtered.length === 1 ? "lead" : "leads"}
          </p>
        </div>

        <ul className="divide-y divide-ink/[0.06]">
          {filtered.map((l) => (
            <LeadRow key={l.id} lead={l} onOpen={() => setActive(l)} />
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-14 text-center">
              <p className="text-[0.86rem] text-slate/70">No leads in this list.</p>
              <p className="mt-1 text-[0.76rem] text-slate/45">Try another smart list or clear your search.</p>
            </li>
          )}
        </ul>
      </div>

      <LeadDrawer lead={active} onClose={() => setActive(null)} />
    </div>
  );
}

/* ── A single inbox row ────────────────────────────────────────────────────── */
function LeadRow({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  const agent = getAgent(lead.assignedAgent);
  const overdue = lead.lastContactDaysAgo >= 7 && lead.stage !== "Closed" && lead.stage !== "Lost";
  const hot = lead.score >= 80;

  return (
    <li>
      <button
        onClick={onOpen}
        className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white"
      >
        {/* unread rail */}
        <span className={cn("h-9 w-1 shrink-0 rounded-full", lead.unread > 0 ? "bg-ink" : "bg-transparent")} aria-hidden />

        {/* avatar */}
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-[0.72rem] font-bold text-white">
          {initials(lead.name)}
          {hot && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink-900 ring-1 ring-ink/[0.08]">
              <Flame className="h-2.5 w-2.5 text-success" />
            </span>
          )}
        </span>

        {/* name + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[0.88rem] font-semibold text-ink">{lead.name}</p>
            {lead.unread > 0 && (
              <span className="shrink-0 rounded-full bg-ink px-1.5 py-px text-[0.62rem] font-bold text-white tabular-nums">
                {lead.unread}
              </span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[0.74rem] text-slate/65">
            <span className="truncate">{lead.intent}</span>
            <span className="text-slate/30">·</span>
            <span className="truncate">{lead.community}</span>
            <span className="text-slate/30">·</span>
            <span className="shrink-0">{lead.source}</span>
          </p>
        </div>

        {/* budget */}
        <div className="hidden w-24 shrink-0 text-right md:block">
          <p className="text-[0.78rem] font-medium text-ink tabular-nums">
            {compactUsd(lead.budgetMin)}–{compactUsd(lead.budgetMax)}
          </p>
          <p className="text-[0.66rem] text-slate/45">budget</p>
        </div>

        {/* stage */}
        <span className={cn("hidden shrink-0 rounded-md px-2 py-0.5 text-[0.7rem] font-semibold ring-1 ring-inset sm:inline-block", stageTone(lead.stage))}>
          {lead.stage}
        </span>

        {/* score */}
        <span className={cn("inline-flex w-12 shrink-0 items-center justify-center gap-0.5 rounded-md py-0.5 text-[0.72rem] font-bold ring-1 ring-inset tabular-nums", scoreTone(lead.score))}>
          {hot && <Flame className="h-2.5 w-2.5" />}
          {lead.score}
        </span>

        {/* last contact */}
        <div className="hidden w-16 shrink-0 text-right lg:block">
          <p className={cn("text-[0.74rem] tabular-nums", overdue ? "font-semibold text-danger" : "text-slate/70")}>
            {lead.lastContactDaysAgo === 0 ? "today" : timeAgo(lead.lastContactDaysAgo * 60 * 24)}
          </p>
          <p className="text-[0.62rem] text-slate/40">last touch</p>
        </div>

        {/* agent */}
        {agent ? (
          <span className="relative hidden h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-ink/[0.06] xl:block" title={agent.name}>
            <Image src={agent.photo} alt={agent.name} fill sizes="28px" className="object-cover" />
          </span>
        ) : (
          <span className="hidden w-7 shrink-0 xl:block" />
        )}
      </button>
    </li>
  );
}

/* ── Sort control ──────────────────────────────────────────────────────────── */
function SortSelect({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const labels: Record<SortKey, string> = {
    recency: "Last contact",
    score: "Score",
    name: "Name",
  };
  return (
    <div className="relative shrink-0">
      <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate/55" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="h-9 appearance-none rounded-lg border border-ink/[0.08] bg-white pl-8 pr-8 text-[0.82rem] font-medium text-ink focus:border-ink/20 focus:outline-none"
        aria-label="Sort leads"
      >
        {(Object.keys(labels) as SortKey[]).map((k) => (
          <option key={k} value={k} className="bg-ink-800">
            Sort: {labels[k]}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate/50" />
    </div>
  );
}
