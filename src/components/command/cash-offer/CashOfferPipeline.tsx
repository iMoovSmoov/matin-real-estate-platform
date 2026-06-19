"use client";

import { useState } from "react";
import {
  X,
  User,
  Target,
  Clock,
  Home,
  Bed,
  Bath,
  Maximize2,
  CalendarDays,
  StickyNote,
  Wand2,
} from "lucide-react";
import { sellerLeads } from "@/lib/data";
import { streamAi } from "@/lib/ai/client";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { Pill } from "@/components/command/ui";
import { compactUsd, initials, cn } from "@/lib/utils";
import type { SellerLead, SellerLeadStage, PropertyCondition } from "@/lib/types";

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

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

function conditionTone(condition: PropertyCondition): "success" | "azure" | "warn" | "danger" {
  switch (condition) {
    case "Excellent":  return "success";
    case "Good":       return "azure";
    case "Fair":       return "warn";
    case "Needs Work": return "danger";
  }
}

function stageDaysTone(days: number): "success" | "warn" | "danger" {
  if (days > 7)  return "danger";
  if (days >= 4) return "warn";
  return "success";
}

/** Deterministic two-letter initials from a slug (e.g. "joshua-rose" → "JR"). */
function agentInitials(slug: string): string {
  return initials(slug.replace(/-/g, " "));
}

/**
 * Stable hue (0–360) derived from a slug so each agent avatar has a
 * consistent, distinct tint — no Math.random().
 */
function slugHue(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

/** Format a number as "$1,234,567" with commas (no compact suffix). */
function formatUsd(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

/* ── Sub-components ──────────────────────────────────────────────────────────── */

function AgentAvatar({ slug }: { slug: string }) {
  const hue = slugHue(slug);
  return (
    <span
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink/10 text-[0.7rem] font-bold text-ink"
      style={{ backgroundColor: `hsl(${hue},38%,88%)`, color: `hsl(${hue},45%,30%)` }}
      title={slug}
    >
      {agentInitials(slug)}
    </span>
  );
}

function FactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink/[0.06] text-ink">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-slate/70">
          {label}
        </p>
        <p className="text-[0.85rem] text-ink">{value}</p>
      </div>
    </div>
  );
}

/* ── Days-in-stage pill ──────────────────────────────────────────────────────── */

function DaysPill({ days }: { days: number }) {
  const tone = stageDaysTone(days);
  const cls =
    tone === "danger"
      ? "bg-danger/10 text-danger"
      : tone === "warn"
      ? "bg-warn/10 text-amber-700"
      : "bg-success/10 text-emerald-700";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-semibold",
        cls,
      )}
    >
      {days}d in stage
    </span>
  );
}

/* ── Kanban card ─────────────────────────────────────────────────────────────── */

function LeadCard({
  lead,
  onClick,
}: {
  lead: SellerLead;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="cursor-pointer rounded-xl bg-white ring-1 ring-ink/[0.07] shadow-soft p-3 transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
    >
      {/* Seller name */}
      <p className="truncate font-semibold text-[0.9rem] text-ink leading-snug">
        {lead.sellerName}
      </p>

      {/* Address */}
      <p className="mt-0.5 truncate text-[0.8rem] text-slate/70">
        {lead.address}, {lead.city}
      </p>

      {/* Est value + condition */}
      <div className="mt-2 flex items-center justify-between gap-1.5">
        <span className="font-semibold text-[0.88rem] text-ink tabular-nums">
          {formatUsd(lead.estValue)}
        </span>
        <Pill tone={conditionTone(lead.condition)}>{lead.condition}</Pill>
      </div>

      {/* Days in stage + agent avatar */}
      <div className="mt-2.5 flex items-center justify-between">
        <DaysPill days={lead.daysInStage} />
        <AgentAvatar slug={lead.assignedAgent} />
      </div>
    </div>
  );
}

/* ── Slide-over ──────────────────────────────────────────────────────────────── */

type AiMode = "eval" | "script" | null;

function SlideOver({
  lead,
  onClose,
  onStageChange,
  onConvert,
}: {
  lead: SellerLead | null;
  onClose: () => void;
  onStageChange: (id: string, stage: SellerLeadStage) => void;
  onConvert: (id: string) => void;
}) {
  const [aiOutput, setAiOutput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState<AiMode>(null);
  const [noteText, setNoteText] = useState("");

  // Reset AI state when lead changes
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

      {/* Panel */}
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
              {/* Close — always visible, high z */}
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-slate transition-colors hover:bg-ink/[0.06] hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="pr-10">
                <h2 className="font-display text-xl text-ink leading-tight">
                  {lead.address}
                </h2>
                <p className="mt-0.5 text-[0.85rem] text-slate">{lead.city}</p>

                {/* Value + condition + stage row */}
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
              {/* Stage select */}
              <div>
                <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-slate/70">
                  Move to stage
                </p>
                <select
                  value={lead.stage}
                  onChange={(e) =>
                    onStageChange(lead.id, e.target.value as SellerLeadStage)
                  }
                  className="w-full rounded-xl border border-ink/[0.08] bg-white px-3 py-2 text-[0.85rem] text-ink focus:border-ink/20 focus:outline-none"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Property details */}
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-ink/[0.08] bg-white p-3">
                <div className="col-span-2">
                  <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-wider text-slate/70">
                    Property
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[0.82rem] text-slate">
                  <Bed className="h-3.5 w-3.5 text-ink/60" />
                  {lead.beds} bed
                </div>
                <div className="flex items-center gap-1.5 text-[0.82rem] text-slate">
                  <Bath className="h-3.5 w-3.5 text-ink/60" />
                  {lead.baths} bath
                </div>
                <div className="flex items-center gap-1.5 text-[0.82rem] text-slate">
                  <Maximize2 className="h-3.5 w-3.5 text-ink/60" />
                  {lead.sqft.toLocaleString()} sqft
                </div>
                <div className="flex items-center gap-1.5 text-[0.82rem] text-slate">
                  <CalendarDays className="h-3.5 w-3.5 text-ink/60" />
                  Built {lead.yearBuilt}
                </div>
              </div>

              {/* Seller info */}
              <div className="space-y-3 rounded-xl border border-ink/[0.08] bg-white p-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-slate/70">
                  Seller
                </p>
                <FactRow
                  icon={<User className="h-3.5 w-3.5" />}
                  label="Name"
                  value={lead.sellerName}
                />
                <FactRow
                  icon={<Target className="h-3.5 w-3.5" />}
                  label="Motivation"
                  value={lead.motivation}
                />
                <FactRow
                  icon={<Clock className="h-3.5 w-3.5" />}
                  label="Timeline"
                  value={lead.timeline}
                />
              </div>

              {/* AI action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={runEval}
                  disabled={aiLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[0.85rem] font-medium text-white transition-colors hover:bg-ink/90 disabled:opacity-60"
                >
                  {aiLoading && aiMode === "eval" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Evaluating…
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      AI Seller Brief
                    </>
                  )}
                </button>
                <button
                  onClick={runScript}
                  disabled={aiLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink/[0.08] px-4 py-2.5 text-[0.85rem] font-medium text-ink transition-colors hover:bg-ink/[0.04] disabled:opacity-60"
                >
                  {aiLoading && aiMode === "script" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                      Scripting…
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Call Script
                    </>
                  )}
                </button>
              </div>

              {/* AI output — shown while streaming too */}
              {(aiOutput || (aiLoading && aiMode)) && (
                <div className="rounded-xl border border-ink/[0.08] bg-white p-3">
                  <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-wider text-slate/70">
                    {aiMode === "eval" ? "AI Seller Brief" : "Call Script"}
                  </p>

                  {aiLoading && !aiOutput && (
                    <div className="flex items-center gap-2 text-[0.82rem] text-slate">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                      {aiMode === "eval"
                        ? "Evaluating offer range…"
                        : "Generating call script…"}
                    </div>
                  )}

                  {aiOutput && (
                    <div className="max-h-64 overflow-y-auto">
                      <AiMarkdown text={aiOutput} />
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="rounded-xl border border-ink/[0.08] bg-white p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <StickyNote className="h-3.5 w-3.5 text-ink" />
                  <p className="text-[0.78rem] font-semibold text-ink">Notes</p>
                </div>
                {lead.notes && (
                  <p className="mb-2.5 text-[0.82rem] leading-relaxed text-slate">
                    {lead.notes}
                  </p>
                )}
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={2}
                  placeholder="Add a note…"
                  className="min-h-[2.5rem] w-full resize-y rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/40 focus:border-ink/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Footer — convert button */}
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

export function CashOfferPipeline() {
  const [leads, setLeads] = useState<SellerLead[]>(sellerLeads as SellerLead[]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedLead = leads.find((l) => l.id === selectedId) ?? null;

  function handleStageChange(id: string, stage: SellerLeadStage) {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, stage } : l)),
    );
  }

  function handleConvert(id: string) {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, stage: "Converted to Listing" } : l,
      ),
    );
  }

  return (
    <>
      {/* Kanban scroll wrapper */}
      <div className="overflow-x-auto">
        <div className="inline-flex min-w-max gap-4 p-4">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage);
            return (
              <div key={stage} className="w-[220px] shrink-0">
                {/* Column header */}
                <div className="mb-2.5 flex items-center gap-1.5 px-0.5">
                  <span className="font-semibold text-[0.82rem] text-ink leading-snug">
                    {stage}
                  </span>
                  <span className="rounded-md bg-ink/[0.06] px-2 py-0.5 text-[0.72rem] font-medium text-ink/70">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {stageLeads.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-ink/[0.08] px-3 py-6 text-center">
                      <p className="text-[0.72rem] text-slate/50">No leads</p>
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onClick={() => setSelectedId(lead.id)}
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
      />
    </>
  );
}
