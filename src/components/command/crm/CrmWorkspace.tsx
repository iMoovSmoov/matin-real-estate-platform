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
  Home,
  SlidersHorizontal,
  UserPlus,
  ChevronRight,
} from "lucide-react";
import type { Lead } from "@/lib/types";
import { getAgent } from "@/lib/data";
import { cn, compactUsd, initials, timeAgo } from "@/lib/utils";
import { LeadDrawer } from "@/components/command/crm/LeadDrawer";
import { stageTone, scoreTone } from "@/components/command/crm/leadStyles";

type SortKey = "score" | "recency" | "name";

/* ── Source badge colors ───────────────────────────────────────────────────── */
const SOURCE_TONE: Record<string, string> = {
  Zillow:   "bg-[#006AFF]/10 text-[#006AFF] ring-[#006AFF]/20",
  "Realtor.com": "bg-[#D92228]/10 text-[#D92228] ring-[#D92228]/20",
  Referral: "bg-success/10 text-success ring-success/20",
  Organic:  "bg-ink/[0.07] text-ink ring-ink/[0.12]",
};

function sourceBadge(source: string): string {
  return SOURCE_TONE[source] ?? "bg-ink/[0.06] text-ink ring-ink/[0.08]";
}

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
  { id: "likely-sellers", label: "Likely Sellers", icon: Home, match: (l) => l.likelySeller === true },
  { id: "all", label: "All", icon: Layers, match: () => true },
];

export function CrmWorkspace({ leads }: { leads: Lead[] }) {
  const [listId, setListId] = useState<string>("followup");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recency");
  const [active, setActive] = useState<Lead | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

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
      {/* ── Top bar: search + add lead button ─────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate/55" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, area, tag…"
            className="h-10 w-full rounded-xl border border-ink/[0.08] bg-white pl-9 pr-3 text-[0.84rem] text-ink placeholder:text-slate/40 focus:border-ink/20 focus:outline-none"
          />
        </div>

        {/* Mobile: single Filters toggle */}
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className={cn(
            "flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-[0.82rem] font-semibold transition-colors sm:hidden",
            filtersOpen
              ? "border-ink/20 bg-ink/[0.06] text-ink"
              : "border-ink/[0.08] bg-white text-slate",
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </button>

        {/* Desktop sort */}
        <div className="hidden sm:block">
          <SortSelect value={sort} onChange={setSort} />
        </div>

        {/* Add lead — always visible, high tap target */}
        <button className="flex h-10 items-center gap-1.5 rounded-xl bg-ink px-3.5 text-[0.82rem] font-semibold text-white transition-colors hover:bg-ink/90 shrink-0">
          <UserPlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Add lead</span>
        </button>
      </div>

      {/* ── Smart lists (desktop always visible; mobile collapsible) ──────────── */}
      <div className={cn("mb-3", !filtersOpen && "hidden sm:block")}>
        <div className="-mx-1 flex flex-wrap gap-2 overflow-x-auto px-1 pb-1">
          {SMART_LISTS.map((sl) => {
            const on = sl.id === listId;
            const Icon = sl.icon;
            return (
              <button
                key={sl.id}
                onClick={() => {
                  setListId(sl.id);
                  setFiltersOpen(false);
                }}
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
        {/* Mobile sort (inside expanded filter panel) */}
        <div className="mt-2 sm:hidden">
          <SortSelect value={sort} onChange={setSort} />
        </div>
      </div>

      {/* ── Inbox ─────────────────────────────────────────────────────────────── */}
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

        {/* Mobile: card grid */}
        <div className="divide-y divide-ink/[0.06] sm:hidden">
          {filtered.map((l) => (
            <LeadCard key={l.id} lead={l} onOpen={() => setActive(l)} />
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-14 text-center">
              <p className="text-[0.86rem] text-slate/70">No leads in this list.</p>
              <p className="mt-1 text-[0.76rem] text-slate/45">Try another smart list or clear your search.</p>
            </div>
          )}
        </div>

        {/* Desktop: row list */}
        <ul className="hidden divide-y divide-ink/[0.06] sm:block">
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

/* ── Response time dot ─────────────────────────────────────────────────────── */
function ResponseDot({ minutes }: { minutes: number }) {
  const color =
    minutes <= 5
      ? "bg-success"
      : minutes <= 30
      ? "bg-warn"
      : "bg-danger";
  const textColor =
    minutes <= 5
      ? "text-success"
      : minutes <= 30
      ? "text-warn"
      : "text-danger";
  return (
    <span className="inline-flex shrink-0 items-center gap-1">
      <span className={cn("h-1.5 w-1.5 rounded-full", color)} />
      <span className={cn("text-[0.68rem] font-medium tabular-nums", textColor)}>{minutes}m</span>
    </span>
  );
}

/* ── Mobile lead card ──────────────────────────────────────────────────────── */
function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  const hot = lead.score >= 80;
  const overdue = lead.lastContactDaysAgo >= 7 && lead.stage !== "Closed" && lead.stage !== "Lost";

  return (
    <button
      onClick={onOpen}
      className="group flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-paper/60"
    >
      {/* Unread rail */}
      <span className={cn("mt-1 h-9 w-1 shrink-0 rounded-full", lead.unread > 0 ? "bg-ink" : "bg-transparent")} aria-hidden />

      {/* Avatar */}
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-[0.72rem] font-bold text-white">
        {initials(lead.name)}
        {hot && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-1 ring-ink/[0.08]">
            <Flame className="h-2.5 w-2.5 text-success" />
          </span>
        )}
      </span>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Name row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-[0.88rem] font-semibold text-ink">{lead.name}</p>
            {lead.unread > 0 && (
              <span className="shrink-0 rounded-full bg-ink px-1.5 py-px text-[0.62rem] font-bold text-white tabular-nums">
                {lead.unread}
              </span>
            )}
          </div>
          <span className={cn("shrink-0 rounded-md px-1.5 py-px text-[0.72rem] font-semibold ring-1 ring-inset", scoreTone(lead.score))}>
            {lead.score}
          </span>
        </div>

        {/* Source badge + budget */}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-full px-2 py-0.5 text-[0.68rem] font-semibold ring-1 ring-inset", sourceBadge(lead.source))}>
            {lead.source}
          </span>
          <span className="text-[0.75rem] font-medium text-ink tabular-nums">
            {compactUsd(lead.budgetMin)}–{compactUsd(lead.budgetMax)}
          </span>
        </div>

        {/* Next action chip */}
        {lead.nextBestAction && (
          <div className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded-lg bg-azure/[0.07] px-2 py-0.5">
            <ChevronRight className="h-3 w-3 shrink-0 text-azure" />
            <span className="truncate text-[0.72rem] font-medium text-azure">
              {lead.nextBestAction.length > 45 ? lead.nextBestAction.slice(0, 45) + "…" : lead.nextBestAction}
            </span>
          </div>
        )}

        {/* Last touch */}
        <p className={cn("mt-1 text-[0.72rem] tabular-nums", overdue ? "font-semibold text-danger" : "text-slate/55")}>
          {lead.lastContactDaysAgo === 0 ? "contacted today" : `${lead.lastContactDaysAgo}d ago`}
        </p>
      </div>
    </button>
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
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-1 ring-ink/[0.08]">
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
          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
            {/* Color-coded source badge */}
            <span className={cn("rounded-full px-2 py-px text-[0.66rem] font-semibold ring-1 ring-inset", sourceBadge(lead.source))}>
              {lead.source}
            </span>
            <span className="text-[0.72rem] text-slate/55 truncate">{lead.intent} · {lead.community}</span>
          </div>
          {/* Next best action chip */}
          {lead.nextBestAction && (
            <div className="mt-1 inline-flex max-w-[200px] items-center gap-1 rounded-lg bg-azure/[0.07] px-2 py-0.5">
              <ChevronRight className="h-3 w-3 shrink-0 text-azure" />
              <span className="truncate text-[0.70rem] font-medium text-azure">
                {lead.nextBestAction.length > 38 ? lead.nextBestAction.slice(0, 38) + "…" : lead.nextBestAction}
              </span>
            </div>
          )}
        </div>

        {/* budget */}
        <div className="hidden w-24 shrink-0 text-right md:block">
          <p className="text-[0.78rem] font-medium text-ink tabular-nums">
            {compactUsd(lead.budgetMin)}–{compactUsd(lead.budgetMax)}
          </p>
          <p className="text-[0.66rem] text-slate/45">budget</p>
        </div>

        {/* stage + response time — hidden on mobile */}
        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
          <span className={cn("rounded-md px-2 py-0.5 text-[0.7rem] font-semibold ring-1 ring-inset", stageTone(lead.stage))}>
            {lead.stage}
          </span>
          {lead.responseMinutes !== undefined && (
            <ResponseDot minutes={lead.responseMinutes} />
          )}
        </div>

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
          <option key={k} value={k} className="bg-paper">
            Sort: {labels[k]}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate/50" />
    </div>
  );
}
