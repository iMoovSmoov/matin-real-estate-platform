"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  X,
  Phone,
  Home,
  Clock,
  AlertCircle,
  User,
  Bed,
  Bath,
  Maximize2,
  CalendarDays,
  StickyNote,
  Wand2,
  Sparkles,
  Send,
  ArrowRightLeft,
} from "lucide-react";
import { sellerLeads } from "@/lib/data";
import { streamAi } from "@/lib/ai/client";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { StatTile, Pill, SectionLabel, LiveDot } from "@/components/command/ui";
import { cn, initials } from "@/lib/utils";
import type { SellerLead, SellerLeadStage, PropertyCondition } from "@/lib/types";

/* ── Suppress unused-import lint on icons that are available for future use ── */
void AlertCircle;
void Wand2;

/* ── Constants ──────────────────────────────────────────────────────────────── */

const STAGES: SellerLeadStage[] = [
  "New Request",
  "Needs Valuation",
  "Offer Pending",
  "Offer Sent",
  "Accepted",
  "Converted to Listing",
  "Dead",
];

/* Stage column header color tokens */
const STAGE_HEADER_TONE: Record<SellerLeadStage, string> = {
  "New Request":          "bg-blue-50   text-blue-700   border-blue-200",
  "Needs Valuation":      "bg-purple-50 text-purple-700 border-purple-200",
  "Offer Pending":        "bg-amber-50  text-amber-700  border-amber-200",
  "Offer Sent":           "bg-orange-50 text-orange-700 border-orange-200",
  "Accepted":             "bg-green-50  text-green-700  border-green-200",
  "Converted to Listing": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Dead":                 "bg-slate-50  text-slate-500  border-slate-200",
};

/** Stages excluded from the "active deals" KPI count. */
const ACTIVE_EXCLUDED: SellerLeadStage[] = ["Dead", "Accepted", "Converted to Listing"];

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

function conditionTone(c: PropertyCondition): "success" | "azure" | "warn" | "danger" {
  switch (c) {
    case "Excellent":  return "success";
    case "Good":       return "azure";
    case "Fair":       return "warn";
    case "Needs Work": return "danger";
  }
}

function formatUsd(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

function compactK(n: number): string {
  return "$" + (n / 1000).toFixed(0) + "K";
}

/** Deterministic hue from agent slug for avatar color. */
function slugHue(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

function agentInitials(slug: string): string {
  return initials(slug.replace(/-/g, " "));
}

/* ── Sub-components ──────────────────────────────────────────────────────────── */

function AgentAvatar({ slug }: { slug: string }) {
  const hue = slugHue(slug);
  return (
    <span
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold"
      style={{ backgroundColor: `hsl(${hue},38%,88%)`, color: `hsl(${hue},45%,30%)` }}
      title={slug}
    >
      {agentInitials(slug)}
    </span>
  );
}

function DaysPill({ days }: { days: number }) {
  const cls =
    days > 7
      ? "bg-red-50 text-red-600"
      : days >= 4
      ? "bg-amber-50 text-amber-700"
      : "bg-slate-100 text-slate-500";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-semibold", cls)}>
      {days}d in stage
    </span>
  );
}

function FactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink/[0.06] text-ink">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-slate/70">{label}</p>
        <p className="text-[0.85rem] text-ink">{value}</p>
      </div>
    </div>
  );
}

/* ── Kanban card ─────────────────────────────────────────────────────────────── */

function LeadCard({
  lead,
  onClick,
  onEval,
  isDead,
  isRecentlyMoved,
}: {
  lead: SellerLead;
  onClick: () => void;
  onEval: () => void;
  isDead: boolean;
  isRecentlyMoved: boolean;
}) {
  const isStale = lead.daysInStage > 7;
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full cursor-pointer rounded-xl bg-white text-left shadow-soft ring-1 p-3 transition-all hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
        isStale && !isDead ? "ring-red-200" : "ring-ink/[0.07]",
        isDead && "opacity-50",
        isRecentlyMoved && "ring-2 ring-emerald-400/60 ring-offset-1",
      )}
    >
      {/* Seller name */}
      <div className="flex items-start justify-between gap-2">
        <p className="truncate font-medium text-[0.88rem] text-ink leading-tight">{lead.sellerName}</p>
        {isStale && (
          <span className="shrink-0 text-[0.65rem] font-semibold text-red-600 bg-red-50 rounded-full px-1.5 py-0.5">
            {lead.daysInStage}d
          </span>
        )}
      </div>

      {/* Address */}
      <p className="mt-1 truncate text-[0.75rem] text-slate">{lead.address}, {lead.city}</p>

      {/* Value + condition */}
      <div className="mt-2 flex items-center justify-between gap-1.5">
        <span className={cn("font-display text-[0.9rem] font-semibold text-ink tabular-nums", isDead && "line-through")}>
          {compactK(lead.estValue)}
        </span>
        <Pill tone={conditionTone(lead.condition)}>{lead.condition}</Pill>
      </div>

      {/* Days in stage + agent avatar */}
      <div className="mt-2 flex items-center justify-between">
        <DaysPill days={lead.daysInStage} />
        <AgentAvatar slug={lead.assignedAgent} />
      </div>

      {/* Quick AI CTA */}
      <div
        role="button"
        onClick={(e) => { e.stopPropagation(); onEval(); }}
        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-ink/10 bg-ink/[0.04] py-1.5 text-[0.74rem] font-semibold text-ink/70 transition-colors hover:bg-ink/[0.08] cursor-pointer"
      >
        <Sparkles className="h-3 w-3" />
        AI Eval
      </div>
    </button>
  );
}

/* ── Slide-over ──────────────────────────────────────────────────────────────── */

type AiMode = "eval" | "script" | null;

function SlideOver({
  lead,
  onClose,
  onStageChange,
  onConvert,
  autoEval,
  onAutoEvalDone,
}: {
  lead: SellerLead | null;
  onClose: () => void;
  onStageChange: (id: string, stage: SellerLeadStage) => void;
  onConvert: (id: string) => void;
  autoEval: boolean;
  onAutoEvalDone: () => void;
}) {
  const [aiOutput, setAiOutput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState<AiMode>(null);
  const [noteText, setNoteText] = useState("");

  // Reset AI state when a different lead is opened
  const [activeId, setActiveId] = useState<string | null>(null);
  if (lead && lead.id !== activeId) {
    setActiveId(lead.id);
    setAiOutput("");
    setAiLoading(false);
    setAiMode(null);
    setNoteText("");
  }

  const open = !!lead;

  async function runEval() {
    if (!lead || aiLoading) return;
    setAiMode("eval");
    setAiLoading(true);
    setAiOutput("");
    try {
      await streamAi(
        {
          tool: "cash-offer-eval",
          input: {
            address: lead.address,
            city: lead.city,
            beds: lead.beds,
            baths: lead.baths,
            sqft: lead.sqft,
            yearBuilt: lead.yearBuilt,
            condition: lead.condition,
            motivation: lead.motivation,
          },
        },
        (_, full) => setAiOutput(full),
      );
    } finally {
      setAiLoading(false);
    }
  }

  async function runScript() {
    if (!lead || aiLoading) return;
    setAiMode("script");
    setAiLoading(true);
    setAiOutput("");
    try {
      await streamAi(
        {
          tool: "seller-intel",
          input: {
            address: lead.address,
            city: lead.city,
            estValue: lead.estValue,
            condition: lead.condition,
            motivation: lead.motivation,
            timeline: lead.timeline,
          },
        },
        (_, full) => setAiOutput(full),
      );
    } finally {
      setAiLoading(false);
    }
  }

  // Auto-trigger eval when autoEval prop flips to true
  useEffect(() => {
    if (!autoEval || !open) return;
    const timer = setTimeout(() => {
      runEval();
      onAutoEvalDone();
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoEval, open]);

  return (
    <>
      {/* Scrim */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Slide-over panel */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full sm:max-w-[480px] flex-col border-l border-ink/[0.08] bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
      >
        {lead && (
          <>
            {/* Header */}
            <div className="relative shrink-0 border-b border-ink/[0.08] px-5 pb-4 pt-5">
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-slate transition-colors hover:bg-ink/[0.06] hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="pr-10">
                <h2 className="font-display text-xl text-ink leading-tight">{lead.sellerName}</h2>
                <p className="mt-0.5 text-[0.85rem] text-slate">{lead.address}, {lead.city}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="font-display text-2xl leading-none text-ink tabular-nums">
                    {formatUsd(lead.estValue)}
                  </span>
                  <Pill tone={conditionTone(lead.condition)}>{lead.condition}</Pill>
                  <Pill tone="neutral">{lead.stage}</Pill>
                </div>
              </div>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {/* Move to stage */}
              <div>
                <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-slate/70">
                  Move to stage
                </p>
                <select
                  value={lead.stage}
                  onChange={(e) => onStageChange(lead.id, e.target.value as SellerLeadStage)}
                  className="w-full rounded-xl border border-ink/[0.08] bg-white px-3 py-2 text-[0.85rem] text-ink focus:border-ink/20 focus:outline-none"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Key facts grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-ink/[0.03] rounded-xl p-3">
                  <div className="text-[0.7rem] uppercase tracking-wide text-slate/60">Est. Value</div>
                  <div className="font-display text-xl text-ink mt-1">{formatUsd(lead.estValue)}</div>
                </div>
                <div className="bg-ink/[0.03] rounded-xl p-3">
                  <div className="text-[0.7rem] uppercase tracking-wide text-slate/60">Condition</div>
                  <div className="font-medium text-ink mt-1">{lead.condition}</div>
                </div>
              </div>

              {/* Property details */}
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-ink/[0.08] bg-white p-3">
                <div className="col-span-2">
                  <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-wider text-slate/70">Property</p>
                </div>
                <div className="flex items-center gap-1.5 text-[0.82rem] text-slate">
                  <Bed className="h-3.5 w-3.5 text-ink/60" />{lead.beds} bed
                </div>
                <div className="flex items-center gap-1.5 text-[0.82rem] text-slate">
                  <Bath className="h-3.5 w-3.5 text-ink/60" />{lead.baths} bath
                </div>
                <div className="flex items-center gap-1.5 text-[0.82rem] text-slate">
                  <Maximize2 className="h-3.5 w-3.5 text-ink/60" />{lead.sqft.toLocaleString()} sqft
                </div>
                <div className="flex items-center gap-1.5 text-[0.82rem] text-slate">
                  <CalendarDays className="h-3.5 w-3.5 text-ink/60" />Built {lead.yearBuilt}
                </div>
              </div>

              {/* Seller info */}
              <div className="space-y-3 rounded-xl border border-ink/[0.08] bg-white p-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-slate/70">Seller</p>
                <FactRow icon={<User className="h-3.5 w-3.5" />} label="Name" value={lead.sellerName} />
                <FactRow icon={<AlertCircle className="h-3.5 w-3.5" />} label="Motivation" value={lead.motivation} />
                <FactRow icon={<Clock className="h-3.5 w-3.5" />} label="Timeline" value={lead.timeline} />
              </div>

              {/* Notes */}
              {lead.notes && (
                <div className="text-sm text-slate bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <span className="font-semibold text-amber-700">Seller note: </span>{lead.notes}
                </div>
              )}

              {/* AI Action buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={runEval}
                  disabled={aiLoading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-ink text-white py-2.5 px-4 text-sm font-semibold hover:bg-ink/90 disabled:opacity-50 transition-colors"
                >
                  {aiLoading && aiMode === "eval" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4" /> Generate Cash Offer Eval
                    </>
                  )}
                </button>
                <button
                  onClick={runScript}
                  disabled={aiLoading}
                  className="flex items-center justify-center gap-2 rounded-xl border border-ink/20 text-ink py-2.5 px-4 text-sm font-semibold hover:bg-ink/5 disabled:opacity-50 transition-colors"
                >
                  {aiLoading && aiMode === "script" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                      Scripting...
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4" /> Generate Call Script
                    </>
                  )}
                </button>
              </div>

              {/* AI Output */}
              {(aiOutput || (aiLoading && aiMode)) && (
                <div className="rounded-xl border border-ink/[0.08] bg-white p-3">
                  <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-wider text-slate/70">
                    {aiMode === "eval" ? "Cash Offer Eval" : "Call Script"}
                  </p>
                  {aiLoading && !aiOutput && (
                    <div className="flex items-center gap-2 text-[0.82rem] text-slate">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                      {aiMode === "eval" ? "Evaluating offer range..." : "Generating call script..."}
                    </div>
                  )}
                  {aiOutput && (
                    <div className="max-h-64 overflow-y-auto">
                      <AiMarkdown text={aiOutput} />
                    </div>
                  )}
                </div>
              )}

              {/* Notes textarea */}
              <div className="rounded-xl border border-ink/[0.08] bg-white p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <StickyNote className="h-3.5 w-3.5 text-ink" />
                  <p className="text-[0.78rem] font-semibold text-ink">Notes</p>
                </div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={2}
                  placeholder="Add a note..."
                  className="min-h-[2.5rem] w-full resize-y rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/40 focus:border-ink/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Footer — convert to listing */}
            <div className="shrink-0 border-t border-ink/[0.08] px-5 py-4">
              <button
                onClick={() => {
                  onConvert(lead.id);
                  onClose();
                }}
                disabled={lead.stage === "Converted to Listing"}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[0.85rem] font-medium text-white transition-colors hover:bg-ink/90 disabled:opacity-40"
              >
                <Home className="h-4 w-4" />
                {lead.stage === "Converted to Listing"
                  ? "Already Converted to Listing"
                  : "Convert to Listing"}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

/* ── Main board ──────────────────────────────────────────────────────────────── */

export default function CashOfferPipeline() {
  const [leads, setLeads] = useState<SellerLead[]>(sellerLeads as SellerLead[]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [autoEval, setAutoEval] = useState(false);
  const [recentlyMoved, setRecentlyMoved] = useState<Set<string>>(new Set());

  const selectedLead = leads.find((l) => l.id === selectedId) ?? null;

  // Derived stats — "active" means not Dead, not Accepted, not Converted
  const activeCount = leads.filter((l) => !ACTIVE_EXCLUDED.includes(l.stage)).length;
  const acceptedCount = leads.filter((l) => l.stage === "Accepted").length;
  const portfolioValue = leads
    .filter((l) => !ACTIVE_EXCLUDED.includes(l.stage))
    .reduce((sum, l) => sum + l.estValue, 0);

  function handleStageChange(id: string, stage: SellerLeadStage) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage } : l)));
    setRecentlyMoved((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setTimeout(() => {
      setRecentlyMoved((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2000);
  }

  function handleConvert(id: string) {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, stage: "Converted to Listing" } : l)),
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 px-4 py-6 md:px-6 md:py-8">
      {/* Page header */}
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <LiveDot tone="azure" />
          <SectionLabel>Cash Is King Home Buyers — active seller pipeline</SectionLabel>
        </div>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Cash Offer Pipeline</h1>
        <p className="mt-1 max-w-2xl text-[0.9rem] text-slate">
          Track every seller request from initial inquiry through cash offer acceptance and listing
          conversion.
        </p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Active Deals"
          value={activeCount}
          icon={<DollarSign className="h-4 w-4" />}
          accent
          hint="Leads not yet dead, accepted, or converted"
        />
        <StatTile
          label="Est. Portfolio Value"
          value={"$" + (portfolioValue / 1_000_000).toFixed(1) + "M"}
          icon={<Send className="h-4 w-4" />}
          hint="Active deal pipeline"
        />
        <StatTile
          label="Accepted"
          value={acceptedCount}
          icon={<ArrowRightLeft className="h-4 w-4" />}
          delta={
            acceptedCount > 0
              ? { value: `${acceptedCount} deal${acceptedCount !== 1 ? "s" : ""}`, dir: "up" }
              : { value: "none yet", dir: "flat" }
          }
        />
      </div>

      {/* Kanban board — horizontally scrollable */}
      <div className="overflow-x-auto pb-4">
        <div className="inline-flex gap-4" style={{ minWidth: "max-content" }}>
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage);
            const headerTone = STAGE_HEADER_TONE[stage];
            const isDead = stage === "Dead";
            return (
              <div key={stage} className="w-[260px] shrink-0" style={{ minWidth: 220 }}>
                {/* Column header */}
                <div
                  className={cn(
                    "mb-3 flex items-center justify-between rounded-lg border px-2.5 py-1.5",
                    headerTone,
                  )}
                >
                  <span className="text-[0.72rem] font-bold uppercase tracking-wide flex-1 truncate">
                    {stage}
                  </span>
                  <span className="ml-1.5 rounded-full bg-black/[0.06] px-2 py-0.5 text-[0.7rem] font-semibold tabular-nums">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {stageLeads.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-ink/[0.08] px-3 py-6 text-center">
                      <p className="text-[0.72rem] text-slate/50">
                        {isDead ? "No dead deals this month" : "No leads"}
                      </p>
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onClick={() => setSelectedId(lead.id)}
                        onEval={() => {
                          setSelectedId(lead.id);
                          setAutoEval(true);
                        }}
                        isDead={isDead}
                        isRecentlyMoved={recentlyMoved.has(lead.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide-over */}
      <SlideOver
        lead={selectedLead}
        onClose={() => setSelectedId(null)}
        onStageChange={handleStageChange}
        onConvert={handleConvert}
        autoEval={autoEval}
        onAutoEvalDone={() => setAutoEval(false)}
      />
    </div>
  );
}
