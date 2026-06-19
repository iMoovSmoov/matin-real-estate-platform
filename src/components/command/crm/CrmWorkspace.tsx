"use client";

import { useMemo, useRef, useState } from "react";
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
  X,
} from "lucide-react";
import type { Lead } from "@/lib/types";
import { getAgent } from "@/lib/data";
import { cn, compactUsd, initials, timeAgo } from "@/lib/utils";
import { LeadDrawer } from "@/components/command/crm/LeadDrawer";
import { stageTone, scoreTone } from "@/components/command/crm/leadStyles";
import { EmptyState } from "@/components/command/ui/EmptyState";

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
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [manualLeads, setManualLeads] = useState<Lead[]>([]);

  const allLeads = useMemo(() => [...manualLeads, ...leads], [manualLeads, leads]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const sl of SMART_LISTS) c[sl.id] = allLeads.filter(sl.match).length;
    return c;
  }, [allLeads]);

  const list = SMART_LISTS.find((l) => l.id === listId) ?? SMART_LISTS[SMART_LISTS.length - 1];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = allLeads.filter((l) => {
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
  }, [allLeads, list, query, sort]);

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
        <button
          onClick={() => setAddLeadOpen(true)}
          className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-ink px-3.5 text-[0.82rem] font-semibold text-white transition-colors hover:bg-ink/90 shrink-0 sm:w-auto sm:justify-start"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Add lead</span>
        </button>
      </div>

      {/* ── Smart lists (desktop always visible; mobile collapsible) ──────────── */}
      <div className={cn("mb-3", !filtersOpen && "hidden sm:block")}>
        <div className="-mx-1 flex flex-wrap gap-2 px-1 pb-1">
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
                    ? "border-ink bg-ink text-white"
                    : "border-ink/[0.08] bg-white text-slate hover:border-ink/15 hover:bg-ink/[0.05] hover:text-ink",
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", on ? "text-white" : "text-slate")} />
                {sl.label}
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[0.68rem] font-bold tabular-nums",
                    on ? "bg-white/20 text-white" : "bg-paper text-slate",
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
            allLeads.length === 0 ? (
              <EmptyState
                icon={UserPlus}
                title="Your lead pipeline is empty"
                description="Import leads from Zillow, Realtor.com, or add them manually. Your first lead is one click away."
                action={{ label: "Add first lead", onClick: () => setAddLeadOpen(true) }}
              />
            ) : (
              <EmptyState
                icon={Inbox}
                title="No leads found"
                description="Try adjusting your filters, or add your first lead to get started."
                action={{ label: "Clear filters", onClick: () => { setQuery(""); setListId("all"); } }}
              />
            )
          )}
        </div>

        {/* Desktop: row list */}
        <ul className="hidden divide-y divide-ink/[0.06] sm:block">
          {filtered.map((l) => (
            <LeadRow key={l.id} lead={l} onOpen={() => setActive(l)} />
          ))}
          {filtered.length === 0 && (
            <li>
              {allLeads.length === 0 ? (
                <EmptyState
                  icon={UserPlus}
                  title="Your lead pipeline is empty"
                  description="Import leads from Zillow, Realtor.com, or add them manually. Your first lead is one click away."
                  action={{ label: "Add first lead", onClick: () => setAddLeadOpen(true) }}
                />
              ) : (
                <EmptyState
                  icon={Inbox}
                  title="No leads found"
                  description="Try adjusting your filters, or add your first lead to get started."
                  action={{ label: "Clear filters", onClick: () => { setQuery(""); setListId("all"); } }}
                />
              )}
            </li>
          )}
        </ul>
      </div>

      <LeadDrawer lead={active} onClose={() => setActive(null)} />
      <AddLeadSlideOver
        open={addLeadOpen}
        onClose={() => setAddLeadOpen(false)}
        onAdd={(lead) => {
          setManualLeads((prev) => [lead, ...prev]);
          setAddLeadOpen(false);
        }}
      />
    </div>
  );
}

/* ── Response time dot + label ─────────────────────────────────────────────── */
function ResponseDot({ minutes }: { minutes: number }) {
  // No contact yet — red
  if (minutes === 0) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        <span className="text-[0.68rem] font-medium text-red-600">No contact yet</span>
      </span>
    );
  }
  // Under 5 min — emerald
  if (minutes < 5) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span className="text-[0.68rem] font-medium text-emerald-600 tabular-nums">
          {minutes}m response
        </span>
      </span>
    );
  }
  // 5–15 min — amber
  if (minutes <= 15) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        <span className="text-[0.68rem] font-medium text-amber-600 tabular-nums">
          {minutes}m response
        </span>
      </span>
    );
  }
  // 16–59 min — red
  if (minutes < 60) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        <span className="text-[0.68rem] font-medium text-red-600 tabular-nums">
          {minutes}m response
        </span>
      </span>
    );
  }
  // Within the day
  if (minutes < 1440) {
    const hrs = Math.round(minutes / 60);
    return (
      <span className="inline-flex shrink-0 items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        <span className="text-[0.68rem] font-medium text-red-600 tabular-nums">
          Responded {hrs}h ago
        </span>
      </span>
    );
  }
  // Over a day — red
  const days = Math.floor(minutes / 1440);
  return (
    <span className="inline-flex shrink-0 items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      <span className="text-[0.68rem] font-medium text-red-600 tabular-nums">
        Last contact: {days} {days === 1 ? "day" : "days"} ago
      </span>
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

      {/* Main content — max 3 lines */}
      <div className="min-w-0 flex-1">
        {/* Line 1: name + status pill */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-[0.88rem] font-bold text-ink">{lead.name}</p>
            {lead.unread > 0 && (
              <span className="shrink-0 rounded-full bg-ink px-1.5 py-px text-[0.62rem] font-bold text-white tabular-nums">
                {lead.unread}
              </span>
            )}
          </div>
          <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[0.7rem] font-semibold ring-1 ring-inset", stageStatusPill(lead.stage))}>
            {lead.stage}
          </span>
        </div>

        {/* Line 2: last contact date + source */}
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span className={cn("text-[0.72rem] tabular-nums", overdue ? "font-semibold text-danger" : "text-slate/55")}>
            {lead.lastContactDaysAgo === 0 ? "contacted today" : `${lead.lastContactDaysAgo}d ago`}
          </span>
          <span className="text-[0.66rem] text-slate/30">·</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[0.66rem] font-semibold ring-1 ring-inset", sourceBadge(lead.source))}>
            {lead.source}
          </span>
          <span className="text-[0.72rem] font-medium text-ink tabular-nums">
            {compactUsd(lead.budgetMin)}–{compactUsd(lead.budgetMax)}
          </span>
        </div>

        {/* Line 3: next action */}
        {lead.nextBestAction && (
          <div className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-azure/[0.07] px-2 py-0.5">
            <ChevronRight className="h-3 w-3 shrink-0 text-azure" />
            <span className="truncate text-[0.7rem] font-medium text-azure">
              {lead.nextBestAction.length > 45 ? lead.nextBestAction.slice(0, 45) + "…" : lead.nextBestAction}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

/* ── Map score label to status pill color ──────────────────────────────────── */
function stageStatusPill(stage: string): string {
  switch (stage) {
    case "New":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "Active":
    case "Showing":
    case "Offer":
    case "Under Contract":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "Closed":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "Lost":
      return "bg-slate-100 text-slate-500 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
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
            <div className="mt-1 inline-flex max-w-[200px] items-center gap-1 rounded-full bg-azure/[0.07] px-2 py-0.5">
              <ChevronRight className="h-3 w-3 shrink-0 text-azure" />
              <span className="truncate text-[0.7rem] font-medium text-azure">
                {lead.nextBestAction.length > 40 ? lead.nextBestAction.slice(0, 40) + "…" : lead.nextBestAction}
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

/* ── Add Lead Slide-Over ────────────────────────────────────────────────────── */
type AddLeadFields = {
  name: string;
  phone: string;
  email: string;
  source: string;
  budgetMin: string;
  budgetMax: string;
  areas: string;
  notes: string;
};

const BLANK_FIELDS: AddLeadFields = {
  name: "",
  phone: "",
  email: "",
  source: "Website",
  budgetMin: "",
  budgetMax: "",
  areas: "",
  notes: "",
};

const LEAD_SOURCES = [
  "Website",
  "Zillow",
  "Referral",
  "Google",
  "Facebook",
  "Cold Call",
  "Open House",
  "Other",
] as const;

function AddLeadSlideOver({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (lead: Lead) => void;
}) {
  const [fields, setFields] = useState<AddLeadFields>(BLANK_FIELDS);
  const [errors, setErrors] = useState<Partial<AddLeadFields>>({});
  const nameRef = useRef<HTMLInputElement>(null);

  // Reset form when opened
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setFields(BLANK_FIELDS);
    setErrors({});
    // Focus name after transition
    setTimeout(() => nameRef.current?.focus(), 320);
  }
  if (!open && wasOpen) setWasOpen(false);

  function set(key: keyof AddLeadFields, val: string) {
    setFields((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<AddLeadFields> = {};
    if (!fields.name.trim()) next.name = "Full name is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const fullName = fields.name.trim();
    const firstName = fullName.split(" ")[0] ?? fullName;
    const now = Date.now();

    const lead: Lead = {
      id: `manual-${now}`,
      name: fullName,
      firstName,
      email: fields.email.trim() || `${firstName.toLowerCase()}@unknown.com`,
      phone: fields.phone.trim() || "—",
      source: fields.source,
      stage: "New",
      score: 55,
      intent: "Buy",
      budgetMin: parseInt(fields.budgetMin) || 0,
      budgetMax: parseInt(fields.budgetMax) || 0,
      communitySlug: fields.areas.trim().toLowerCase().replace(/\s+/g, "-") || "unknown",
      community: fields.areas.trim() || "Unknown",
      assignedAgent: "",
      createdDaysAgo: 0,
      lastContactDaysAgo: 0,
      tags: [],
      aiSummary: fields.notes.trim() || `New lead added manually via Command Center. Source: ${fields.source}.`,
      unread: 0,
      nextBestAction: "Send intro email within 5 minutes",
      responseMinutes: undefined,
    };

    onAdd(lead);
    setFields(BLANK_FIELDS);
    setErrors({});
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-ink/[0.08] bg-white shadow-[0_0_80px_rgba(0,0,0,.5)] transition-transform duration-300 ease-out sm:w-[440px]",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
        aria-label="Add lead"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-ink/[0.08] bg-gradient-to-br from-paper to-white px-5 py-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-ink" />
            <h2 className="font-display text-xl text-ink">Add lead</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate transition-colors hover:bg-ink/[0.06] hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="flex flex-1 flex-col overflow-y-auto px-5 py-5">
          <div className="flex-1 space-y-4">
            {/* Full Name */}
            <div>
              <label className="mb-1 block text-[0.76rem] font-semibold text-ink">
                Full Name <span className="text-danger">*</span>
              </label>
              <input
                ref={nameRef}
                value={fields.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Sarah Johnson"
                className={cn(
                  "h-10 w-full rounded-xl border bg-white px-3.5 text-[0.85rem] text-ink placeholder:text-slate/40 focus:outline-none",
                  errors.name
                    ? "border-danger/50 focus:border-danger"
                    : "border-ink/[0.10] focus:border-ink/25",
                )}
              />
              {errors.name && (
                <p className="mt-1 text-[0.72rem] text-danger">{errors.name}</p>
              )}
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[0.76rem] font-semibold text-ink">Phone</label>
                <input
                  type="tel"
                  value={fields.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="(407) 555-0100"
                  className="h-10 w-full rounded-xl border border-ink/[0.10] bg-white px-3.5 text-[0.85rem] text-ink placeholder:text-slate/40 focus:border-ink/25 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[0.76rem] font-semibold text-ink">Email</label>
                <input
                  type="email"
                  value={fields.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="sarah@email.com"
                  className="h-10 w-full rounded-xl border border-ink/[0.10] bg-white px-3.5 text-[0.85rem] text-ink placeholder:text-slate/40 focus:border-ink/25 focus:outline-none"
                />
              </div>
            </div>

            {/* Source */}
            <div>
              <label className="mb-1 block text-[0.76rem] font-semibold text-ink">Source</label>
              <div className="relative">
                <select
                  value={fields.source}
                  onChange={(e) => set("source", e.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-ink/[0.10] bg-white px-3.5 pr-9 text-[0.85rem] text-ink focus:border-ink/25 focus:outline-none"
                >
                  {LEAD_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate/50" />
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="mb-1 block text-[0.76rem] font-semibold text-ink">Budget Range</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[0.82rem] text-slate/55">$</span>
                  <input
                    type="number"
                    min={0}
                    value={fields.budgetMin}
                    onChange={(e) => set("budgetMin", e.target.value)}
                    placeholder="Min"
                    className="h-10 w-full rounded-xl border border-ink/[0.10] bg-white pl-6 pr-3.5 text-[0.85rem] text-ink placeholder:text-slate/40 focus:border-ink/25 focus:outline-none"
                  />
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[0.82rem] text-slate/55">$</span>
                  <input
                    type="number"
                    min={0}
                    value={fields.budgetMax}
                    onChange={(e) => set("budgetMax", e.target.value)}
                    placeholder="Max"
                    className="h-10 w-full rounded-xl border border-ink/[0.10] bg-white pl-6 pr-3.5 text-[0.85rem] text-ink placeholder:text-slate/40 focus:border-ink/25 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Areas of Interest */}
            <div>
              <label className="mb-1 block text-[0.76rem] font-semibold text-ink">Areas of Interest</label>
              <input
                value={fields.areas}
                onChange={(e) => set("areas", e.target.value)}
                placeholder="e.g. Lake Nona, Windermere, Dr. Phillips"
                className="h-10 w-full rounded-xl border border-ink/[0.10] bg-white px-3.5 text-[0.85rem] text-ink placeholder:text-slate/40 focus:border-ink/25 focus:outline-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1 block text-[0.76rem] font-semibold text-ink">Notes</label>
              <textarea
                value={fields.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={3}
                placeholder="Any initial context about this lead…"
                className="min-h-[5rem] w-full resize-y rounded-xl border border-ink/[0.10] bg-white px-3.5 py-2.5 text-[0.85rem] text-ink placeholder:text-slate/40 focus:border-ink/25 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-5 flex items-center gap-3 border-t border-ink/[0.07] pt-4">
            <button
              type="submit"
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ink text-[0.88rem] font-semibold text-white transition-colors hover:bg-ink/90"
            >
              <UserPlus className="h-4 w-4" />
              Add to CRM
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-ink/[0.10] bg-white px-4 text-[0.86rem] font-semibold text-slate transition-colors hover:bg-paper hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
