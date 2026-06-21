"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, MessageSquare, Mail, CalendarPlus, UserPlus, Sparkles, MapPin } from "lucide-react";
import type { Lead, AIAction } from "@/lib/types";
import { getAgent } from "@/lib/data";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import {
  StatusChip,
  ScoreRing,
  ActivityTimeline,
  AIActionCard,
  AIInsightChip,
  useAiSidecar,
} from "@/components/os";
import {
  leadTypeLabel,
  leadTypeTone,
  stageTone,
  tempLabel,
  budgetLabel,
  leadTimeline,
} from "./leadView";

/* ──────────────────────────────────────────────────────────────────────────
   CRM & Leads Workbench — selected-lead detail panel (inline, right ~36%)

   Composes shared primitives only (ScoreRing, StatusChip, ActivityTimeline,
   AIActionCard, AIInsightChip) — re-implements nothing. Master–detail lives on
   one screen, so this is an INLINE panel (not the slide-over RecordDrawer).

   Bottom action bar: Call = ink-filled primary; Text/Email/Schedule/Assign =
   light pills (human actions are ink, never gold — gold is AI-only).

   The two AI action cards are pre-seeded from the canonical aiActions data so
   the panel looks complete before any click, and Run streams a LIVE draft via
   streamAi('lead-responder'); the draft renders in an approval-gated panel
   (AI never silently sends — §1.8 / acceptance criteria).
   ────────────────────────────────────────────────────────────────────────── */

type DraftState = { key: string; title: string; text: string; loading: boolean } | null;

export function LeadDetailPanel({
  lead,
  aiActions,
}: {
  lead: Lead;
  aiActions: AIAction[];
}) {
  const { openAi } = useAiSidecar();
  const [draft, setDraft] = useState<DraftState>(null);
  const draftRef = useRef<HTMLDivElement>(null);

  const agent = getAgent(lead.assignedAgent);
  const temp = tempLabel(lead.score);
  const timeline = leadTimeline(lead);

  // Reset any open draft when the selected lead changes.
  useEffect(() => {
    setDraft(null);
  }, [lead.id]);

  // Prefer the canonical CRM AI actions for this lead; fall back to sensible defaults.
  const seeded = aiActions.filter(
    (a) => a.sourceType === "lead" && a.sourceId === lead.id && a.context.startsWith("CRM"),
  );

  const cards: { key: string; title: string; evidence: string; risk: AIAction["riskTag"]; conf: AIAction["confidence"]; tool: string; label: string }[] =
    [
      {
        key: "first-text",
        title: seeded[0]?.title ?? `Send first reply to ${lead.firstName} with 3 matched homes`,
        evidence:
          seeded[0]?.evidence ??
          `Lead viewed ${lead.community} homes and saved searches, then asked about availability. Matched active ${lead.community} listings inside ${budgetLabel(lead)} budget.`,
        risk: seeded[0]?.riskTag ?? "Approval required",
        conf: seeded[0]?.confidence ?? "High",
        tool: "lead-responder",
        label: "Draft text",
      },
      {
        key: "send-homes",
        title: `Email ${lead.firstName} 3 matching ${lead.community} homes`,
        evidence: `Buyer band ${budgetLabel(lead)} with ${lead.propertyViews?.length ?? 0} tracked viewing signals. Pull 3 active matches and draft a personalized intro email.`,
        risk: "Approval required",
        conf: lead.score >= 75 ? "High" : "Medium",
        tool: "lead-responder",
        label: "Draft email",
      },
    ];

  async function runDraft(card: (typeof cards)[number]) {
    setDraft({ key: card.key, title: card.title, text: "", loading: true });
    requestAnimationFrame(() => draftRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    await streamAi(
      {
        tool: card.tool,
        input: {
          leadName: lead.name,
          firstName: lead.firstName,
          intent: lead.intent,
          community: lead.community,
          budget: budgetLabel(lead),
          score: lead.score,
          signals: lead.propertyViews ?? [],
          channel: card.key === "first-text" ? "text" : "email",
        },
      },
      (_chunk, full) => setDraft((d) => (d && d.key === card.key ? { ...d, text: full } : d)),
    );
    setDraft((d) => (d && d.key === card.key ? { ...d, loading: false } : d));
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
      {/* Identity header */}
      <div className="flex items-start gap-4 border-b border-mist px-5 py-4">
        <ScoreRing value={lead.score} size={58} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-display text-[1.2rem] font-normal leading-tight text-ink">
              {lead.name}
            </h2>
            <StatusChip tone={temp.tone} variant="soft">
              {temp.label}
            </StatusChip>
          </div>
          <p className="mt-1 flex items-center gap-1 text-[0.78rem] text-slate">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {lead.community} · {budgetLabel(lead)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusChip tone={leadTypeTone(lead)} variant="soft">
              {leadTypeLabel(lead)}
            </StatusChip>
            <StatusChip tone={stageTone(lead.stage)} variant="soft">
              {lead.stage}
            </StatusChip>
            <StatusChip tone="info" variant="soft">
              {lead.source}
            </StatusChip>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {/* Contact + owner facts */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[0.78rem]">
          <Fact label="Phone" value={lead.phone} />
          <Fact label="Email" value={lead.email} />
          <Fact label="Owner" value={agent?.name ?? lead.assignedAgent} />
          <Fact
            label="Last contact"
            value={lead.lastContactDaysAgo === 0 ? "Today" : `${lead.lastContactDaysAgo}d ago`}
            valueTone={lead.lastContactDaysAgo >= 7 ? "danger" : "ink"}
          />
        </dl>

        {/* Recency nudge */}
        {lead.lastContactDaysAgo >= 7 ? (
          <p className="rounded-lg border border-danger/20 bg-danger/[0.06] px-3 py-2 text-[0.78rem] font-medium text-danger">
            It&apos;s been {lead.lastContactDaysAgo} days since you last contacted this lead.
          </p>
        ) : null}

        {/* Next best action — highlighted sentence with reasoning */}
        <section className="rounded-xl border border-gold/25 bg-gold-soft/60 px-4 py-3.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-gold-ink" aria-hidden />
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-gold-ink">
              Next best action
            </span>
          </div>
          <p className="mt-1.5 text-[0.92rem] font-semibold leading-snug text-ink">
            {lead.nextBestAction ?? `Call ${lead.firstName} to qualify timeline and budget`}
          </p>
          <p className="mt-1.5 text-[0.78rem] leading-relaxed text-slate">{lead.aiSummary}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {(lead.propertyViews ?? []).slice(0, 3).map((pv) => (
              <AIInsightChip key={pv}>{pv}</AIInsightChip>
            ))}
          </div>
        </section>

        {/* AI proposed actions — approval-gated, wired to streamAi */}
        <section className="space-y-2.5">
          <p className="eyebrow text-slate">AI proposed actions</p>
          {cards.map((c) => (
            <AIActionCard
              key={c.key}
              title={c.title}
              evidence={c.evidence}
              riskTag={c.risk}
              confidence={c.conf}
              runLabel={c.label}
              onRun={() => runDraft(c)}
              onEdit={() =>
                openAi(`Context: CRM & Leads / ${lead.name} — edit "${c.title}"`)
              }
            />
          ))}
        </section>

        {/* Streamed draft (approval-gated, never auto-sent) */}
        {draft ? (
          <section
            ref={draftRef}
            className="rounded-xl border border-mist bg-paper px-4 py-3.5"
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

        {/* Activity timeline */}
        <section>
          <p className="eyebrow pb-1 text-slate">Recent activity</p>
          <ActivityTimeline items={timeline} />
        </section>
      </div>

      {/* Bottom action bar — Call ink-filled primary, rest light pills */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-mist bg-cloud px-5 py-3">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[0.8rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
        >
          <Phone className="h-4 w-4" aria-hidden />
          Call
        </button>
        <ActionPill icon={MessageSquare} label="Text" />
        <ActionPill icon={Mail} label="Email" />
        <ActionPill icon={CalendarPlus} label="Schedule" />
        <ActionPill icon={UserPlus} label="Assign" />
      </div>
    </div>
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
