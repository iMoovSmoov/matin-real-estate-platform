"use client";

import { useEffect, useRef, useState } from "react";
import {
  Phone,
  Mail,
  CalendarPlus,
  Home,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import type { SellerLead } from "@/lib/types";
import { getAgent } from "@/lib/data";
import { streamAi } from "@/lib/ai/client";
import { cn, usd } from "@/lib/utils";
import {
  RecordDrawer,
  ScoreRing,
  StatusChip,
  AIInsightChip,
  AIActionCard,
  ActivityTimeline,
} from "@/components/os";
import {
  conditionTone,
  timelineTone,
  effectiveScore,
  nextAction,
  lostReason,
  agentName,
  outreachTimeline,
} from "./sellerView";

/* ──────────────────────────────────────────────────────────────────────────
   Seller / Cash Offers — opportunity drawer (right-side RecordDrawer)

   Opens on kanban-card click. Composes shared primitives only:
     • property estimate HERO number (with intent ScoreRing)
     • signal explanation as an AIInsightChip list (Fello signal-chip pattern)
     • owner profile facts (assigned agent, timeline, condition, beds/baths…)
     • outreach ActivityTimeline (system/AI events distinguished)
     • an AIActionCard "Draft home-value outreach" (Approval required) wired to
       streamAi('seller-intel') — the streamed draft renders in an
       approval-gated panel (AI never silently sends — §1.8).
   ────────────────────────────────────────────────────────────────────────── */

type DraftState = { text: string; loading: boolean } | null;

export function OpportunityDrawer({
  lead,
  onClose,
}: {
  lead: SellerLead | null;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<DraftState>(null);
  const draftRef = useRef<HTMLDivElement>(null);

  // Reset the open draft whenever a different opportunity is selected.
  useEffect(() => {
    setDraft(null);
  }, [lead?.id]);

  if (!lead) {
    return <RecordDrawer open={false} onClose={onClose} title="" >{null}</RecordDrawer>;
  }

  const agent = getAgent(lead.assignedAgent);
  const score = effectiveScore(lead);
  const { action, blocker } = nextAction(lead);
  const lost = lostReason(lead);
  const signals = lead.signals ?? [];

  async function runDraft() {
    if (!lead) return;
    setDraft({ text: "", loading: true });
    requestAnimationFrame(() =>
      draftRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
    );
    await streamAi(
      {
        tool: "seller-intel",
        input: {
          sellerName: lead.sellerName,
          address: lead.address,
          city: lead.city,
          estValue: lead.estValue,
          beds: lead.beds,
          baths: lead.baths,
          sqft: lead.sqft,
          yearBuilt: lead.yearBuilt,
          condition: lead.condition,
          motivation: lead.motivation,
          timeline: lead.timeline,
          score,
          signals,
          notes: lead.notes,
          channel: "email",
        },
      },
      (_chunk, full) => setDraft((d) => (d ? { ...d, text: full } : d)),
    );
    setDraft((d) => (d ? { ...d, loading: false } : d));
  }

  return (
    <RecordDrawer
      open={!!lead}
      onClose={onClose}
      title={lead.sellerName}
      subtitle={`${lead.address} · ${lead.city}`}
      actions={
        <div className="flex w-full items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[0.8rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
          >
            <Phone className="h-4 w-4" aria-hidden />
            Call seller
          </button>
          <ActionPill icon={Mail} label="Email" />
          <ActionPill icon={CalendarPlus} label="Book appt" />
        </div>
      }
    >
      {/* Property estimate hero + intent score */}
      <section className="flex items-start gap-4 rounded-2xl border border-mist bg-paper-200/50 px-4 py-4">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate">
            <Home className="h-3.5 w-3.5" aria-hidden />
            Estimated home value
          </p>
          <p className="mt-1.5 font-display text-[2rem] font-normal leading-none text-ink tabular-nums">
            {usd(lead.estValue)}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[0.76rem] text-slate">
            <TrendingUp className="h-3.5 w-3.5 text-success" aria-hidden />
            {lead.beds} bd · {lead.baths} ba · {lead.sqft.toLocaleString()} sqft · Built {lead.yearBuilt}
          </p>
        </div>
        <ScoreRing value={score} size={64} label="Intent" />
      </section>

      {/* Signal explanation — AI insight chips */}
      <section className="mt-4">
        <p className="eyebrow pb-1.5 text-slate">Why this opportunity scored {score}</p>
        <div className="flex flex-wrap gap-1.5">
          {signals.length > 0 ? (
            signals.map((s) => <AIInsightChip key={s}>{s}</AIInsightChip>)
          ) : (
            <AIInsightChip>{lead.motivation}</AIInsightChip>
          )}
          <AIInsightChip icon={<Sparkles className="h-3.5 w-3.5" />}>
            {lead.timeline} timeline
          </AIInsightChip>
        </div>
      </section>

      {/* Next action + blocker */}
      <section className="mt-4 rounded-xl border border-gold/25 bg-gold-soft/60 px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-gold-ink" aria-hidden />
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-gold-ink">
            Next best action
          </span>
        </div>
        <p className="mt-1.5 text-[0.92rem] font-semibold leading-snug text-ink">{action}</p>
        {blocker ? (
          <p className="mt-1.5 text-[0.78rem] leading-relaxed text-danger">
            <span className="font-semibold">Blocker:</span> {blocker}
          </p>
        ) : null}
        {lost ? (
          <p className="mt-1.5 text-[0.78rem] leading-relaxed text-slate">
            <span className="font-semibold">Lost reason:</span> {lost}
          </p>
        ) : null}
      </section>

      {/* Owner / opportunity profile facts */}
      <section className="mt-4">
        <p className="eyebrow pb-1.5 text-slate">Owner profile</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[0.78rem]">
          <Fact label="Seller" value={lead.sellerName} />
          <Fact label="Source" value={lead.source ?? "Database mining"} />
          <Fact label="Assigned agent" value={agentName(lead.assignedAgent)} />
          <Fact label="Agent phone" value={agent?.phone ?? "(503) 622-9624"} />
          <Fact label="Stage" value={lead.stage} />
          <Fact
            label="Days in stage"
            value={`${lead.daysInStage}d`}
            valueTone={lead.daysInStage > 7 ? "danger" : "ink"}
          />
        </dl>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <StatusChip tone={conditionTone(lead.condition)} variant="soft">
            {lead.condition}
          </StatusChip>
          <StatusChip tone={timelineTone(lead.timeline)} variant="soft">
            {lead.timeline}
          </StatusChip>
        </div>
        <p className="mt-3 rounded-lg border border-mist bg-paper px-3 py-2 text-[0.8rem] leading-relaxed text-slate">
          {lead.notes || lead.motivation}
        </p>
      </section>

      {/* AI proposed action — approval-gated, wired to streamAi('seller-intel') */}
      <section className="mt-4">
        <p className="eyebrow pb-1.5 text-slate">AI proposed action</p>
        <AIActionCard
          title={`Draft home-value outreach to ${lead.sellerName.split(" ")[0]}`}
          riskTag="Approval required"
          confidence={score >= 85 ? "High" : score >= 70 ? "Medium" : "Low"}
          evidence={`${
            signals[0] ?? lead.motivation
          }. Estimated value ${usd(lead.estValue)} on a ${lead.timeline} timeline — draft a personalized home-value note for ${agentName(
            lead.assignedAgent,
          )} to review before send.`}
          runLabel="Draft outreach"
          onRun={runDraft}
        />
      </section>

      {/* Streamed draft — never auto-sent */}
      {draft ? (
        <section
          ref={draftRef}
          className="mt-3 rounded-xl border border-mist bg-paper px-4 py-3.5"
        >
          <div className="flex items-center justify-between">
            <p className="eyebrow text-slate">Draft · awaiting your approval</p>
            <StatusChip tone="warn" variant="soft">
              {draft.loading ? "Generating…" : "Draft"}
            </StatusChip>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-[0.82rem] leading-relaxed text-ink">
            {draft.text || (draft.loading ? "Matin AI is drafting…" : "")}
          </p>
          {!draft.loading && draft.text ? (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[0.78rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
              >
                Approve &amp; send
              </button>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-lg border border-mist bg-cloud px-3 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:text-ink"
              >
                Discard
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Outreach history */}
      <section className="mt-4">
        <p className="eyebrow text-slate">Outreach history</p>
        <ActivityTimeline items={outreachTimeline(lead)} />
      </section>
    </RecordDrawer>
  );
}

function Fact({
  label,
  value,
  valueTone = "ink",
}: {
  label: string;
  value: string;
  valueTone?: "ink" | "danger";
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.68rem] font-medium uppercase tracking-[0.1em] text-slate">{label}</dt>
      <dd
        className={cn(
          "truncate text-[0.82rem] font-medium",
          valueTone === "danger" ? "text-danger" : "text-ink",
        )}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

function ActionPill({
  icon: Icon,
  label,
}: {
  icon: typeof Phone;
  label: string;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.8rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}
