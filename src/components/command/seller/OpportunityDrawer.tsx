"use client";

import { useEffect, useRef, useState } from "react";
import {
  Phone,
  Mail,
  CalendarPlus,
  Home,
  TrendingUp,
  CircleCheck,
  Banknote,
  CalendarClock,
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
  Avatar,
  PropertyThumb,
  type ActivityItem,
  type DrawerTab,
} from "@/components/os";
import {
  conditionTone,
  timelineTone,
  effectiveScore,
  nextAction,
  lostReason,
  agentName,
  outreachTimeline,
  leadPhotoSeed,
  equityBand,
} from "./sellerView";

/* ──────────────────────────────────────────────────────────────────────────
   Seller / Cash Offers — opportunity drawer (right-side RecordDrawer)

   Opens on kanban-card / table-row click. Composes shared primitives only:
     • a real PropertyThumb hero (stable seedIndex) + estimate hero number
       with an intent ScoreRing
     • the assigned agent shown as a real Avatar (initials fallback)
     • signal explanation as AIInsightChip list (Fello signal-chip pattern)
     • a tabbed body (Overview / Activity) driven by local state
     • an AIActionCard "Draft home-value outreach" wired to streamAi
       ('seller-intel'); the draft streams INLINE into the card's result slot,
       then Approve LOGS it to the activity feed (never silently sends — §1.8)
   ────────────────────────────────────────────────────────────────────────── */

type DraftState = { text: string; running: boolean } | null;

export function OpportunityDrawer({
  lead,
  onClose,
  onLogActivity,
  extraActivity,
}: {
  lead: SellerLead | null;
  onClose: () => void;
  /** Append a real activity event to the parent's per-lead log on approve. */
  onLogActivity?: (leadId: string, item: ActivityItem) => void;
  /** Parent-held activity already logged for this lead (approved drafts, etc.). */
  extraActivity?: ActivityItem[];
}) {
  const [draft, setDraft] = useState<DraftState>(null);
  const [tab, setTab] = useState<string>("overview");
  const [approved, setApproved] = useState(false);
  const draftRef = useRef<HTMLElement>(null);

  // Reset the open draft + tab whenever a different opportunity is selected.
  useEffect(() => {
    setDraft(null);
    setTab("overview");
    setApproved(false);
  }, [lead?.id]);

  if (!lead) {
    return (
      <RecordDrawer open={false} onClose={onClose} title="">
        {null}
      </RecordDrawer>
    );
  }

  const agent = getAgent(lead.assignedAgent);
  const score = effectiveScore(lead);
  const { action, blocker } = nextAction(lead);
  const lost = lostReason(lead);
  const signals = lead.signals ?? [];
  const equity = equityBand(lead);
  const photoSeed = leadPhotoSeed(lead);

  async function runDraft() {
    if (!lead) return;
    setApproved(false);
    setDraft({ text: "", running: true });
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
    setDraft((d) => (d ? { ...d, running: false } : d));
  }

  function approveDraft() {
    if (!lead || !draft?.text) return;
    setApproved(true);
    onLogActivity?.(lead.id, {
      id: `${lead.id}-draft-${Date.now()}`,
      channel: "email",
      name: "Home-value outreach sent",
      tag: "approved",
      tagTone: "success",
      meta: `AI draft reviewed & sent by ${agentName(lead.assignedAgent)} · logged to ai_actions`,
      timeLabel: "just now",
      group: "Now",
    });
  }

  const tabs: DrawerTab[] = [
    { key: "overview", label: "Overview" },
    {
      key: "activity",
      label: (
        <span className="inline-flex items-center gap-1.5">
          Activity
          <span className="tabular-nums text-[0.72rem] text-slate/70">
            {outreachTimeline(lead).length + (extraActivity?.length ?? 0)}
          </span>
        </span>
      ),
    },
  ];

  const timeline: ActivityItem[] = [
    ...(extraActivity ?? []),
    ...outreachTimeline(lead),
  ];

  return (
    <RecordDrawer
      open={!!lead}
      onClose={onClose}
      title={lead.sellerName}
      subtitle={`${lead.address} · ${lead.city}`}
      tabs={tabs}
      activeTab={tab}
      onTab={setTab}
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
      {tab === "overview" ? (
        <>
          {/* Real property photo hero */}
          <div className="overflow-hidden rounded-2xl border border-mist">
            <PropertyThumb
              seedIndex={photoSeed}
              ratio="video"
              rounded={false}
              alt={`${lead.address}, ${lead.city}`}
            />
          </div>

          {/* Property estimate hero + intent score */}
          <section className="mt-3 flex items-start gap-4 rounded-2xl border border-mist bg-paper-200/50 px-4 py-4">
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
              <AIInsightChip icon={<CalendarClock className="h-3.5 w-3.5" />}>
                {lead.timeline} timeline
              </AIInsightChip>
              <AIInsightChip icon={<Banknote className="h-3.5 w-3.5" />}>
                {equity.label}
              </AIInsightChip>
            </div>
          </section>

          {/* Next action + blocker */}
          <section className="mt-4 rounded-xl border border-gold/25 bg-gold-soft/60 px-4 py-3.5">
            <div className="flex items-center gap-1.5">
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

          {/* Owner / opportunity profile facts — assigned agent shown as a real Avatar */}
          <section className="mt-4">
            <p className="eyebrow pb-1.5 text-slate">Owner profile</p>
            <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-mist bg-cloud px-3 py-2.5">
              <Avatar
                name={agentName(lead.assignedAgent)}
                slug={lead.assignedAgent}
                size={36}
                ring
              />
              <div className="min-w-0">
                <p className="truncate text-[0.82rem] font-semibold text-ink">
                  {agentName(lead.assignedAgent)}
                </p>
                <p className="truncate text-[0.74rem] text-slate">
                  Assigned agent · {agent?.phone ?? "(503) 622-9624"}
                </p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[0.78rem]">
              <Fact label="Seller" value={lead.sellerName} />
              <Fact label="Source" value={lead.source ?? "Database mining"} />
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
              <StatusChip tone={equity.tone} variant="soft">
                {equity.label}
              </StatusChip>
            </div>
            <p className="mt-3 rounded-lg border border-mist bg-paper px-3 py-2 text-[0.8rem] leading-relaxed text-slate">
              {lead.notes || lead.motivation}
            </p>
          </section>

          {/* AI proposed action — streams INLINE into the AIActionCard result */}
          <section className="mt-4" ref={draftRef}>
            <p className="eyebrow pb-1.5 text-slate">AI proposed action</p>
            <AIActionCard
              title={`Draft home-value outreach to ${lead.sellerName.split(" ")[0]}`}
              riskTag="Approval required"
              confidence={score >= 85 ? "High" : score >= 70 ? "Medium" : "Low"}
              evidence={`${
                signals[0] ?? lead.motivation
              } Estimated value ${usd(lead.estValue)} on a ${lead.timeline} timeline — draft a personalized home-value note for ${agentName(
                lead.assignedAgent,
              )} to review before send.`}
              runLabel={draft?.text ? "Redraft" : "Draft outreach"}
              running={!!draft?.running}
              onRun={runDraft}
              onReject={draft ? () => setDraft(null) : undefined}
              result={
                draft?.text ? (
                  <div>
                    <p className="mb-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-gold/90">
                      {draft.running ? "Drafting…" : approved ? "Approved & sent" : "Draft · awaiting approval"}
                    </p>
                    {draft.text}
                    {!draft.running ? (
                      <div className="mt-3 flex items-center gap-2 border-t border-ink-700 pt-3">
                        {approved ? (
                          <span className="inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-success">
                            <CircleCheck className="h-4 w-4" aria-hidden />
                            Sent &amp; logged to the activity feed
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={approveDraft}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
                            >
                              <CircleCheck className="h-3.5 w-3.5" aria-hidden />
                              Approve &amp; send
                            </button>
                            <button
                              type="button"
                              onClick={() => setDraft(null)}
                              className="rounded-lg px-3 py-1.5 text-[0.78rem] font-medium text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud"
                            >
                              Discard
                            </button>
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : null
              }
            />
          </section>
        </>
      ) : (
        /* Activity tab */
        <section>
          <p className="eyebrow text-slate">Outreach history</p>
          <ActivityTimeline items={timeline} />
        </section>
      )}
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
