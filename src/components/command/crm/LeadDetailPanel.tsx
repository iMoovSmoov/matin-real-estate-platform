"use client";

import { useEffect, useRef, useState } from "react";
import {
  Phone,
  MessageSquare,
  Mail,
  CalendarPlus,
  UserPlus,
  MapPin,
  Maximize2,
  CircleCheck,
} from "lucide-react";
import type { Lead, AIAction } from "@/lib/types";
import { getAgent, company } from "@/lib/data";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import { BrandedLeadDraft, matchedHomesFor } from "./BrandedLeadDraft";
import {
  Avatar,
  StatusChip,
  ScoreRing,
  ActivityTimeline,
  AIActionCard,
  AIInsightChip,
  RecordDrawer,
  useAiSidecar,
} from "@/components/os";
import { MatinMark, Logo } from "@/components/brand/Logo";
import {
  leadTypeLabel,
  leadTypeTone,
  stageTone,
  tempLabel,
  budgetLabel,
  leadTimeline,
  isSellerIntent,
  engagementStats,
} from "./leadView";
import { ComposeDrawer, type ComposeMode, type ComposeResult, telHref } from "./ComposeDrawer";
import { LeadFullDrawer } from "./LeadFullDrawer";
import { DraftActions, slugify } from "@/components/command/today/DraftActions";

/* ──────────────────────────────────────────────────────────────────────────
   CRM & Leads — selected-lead detail panel (inline, right ~36%)

   MAKE-IT-REAL: every control does its real job; the global AI sidecar opens
   ONLY from the explicit "Ask Matin" affordance.
     • Call  → tel: link
     • Text / Email / Schedule / Assign → ComposeDrawer (RecordDrawer form)
     • Open full 360 → LeadFullDrawer (tabbed RecordDrawer)
     • AI cards → streamAi('lead-responder') INTO the AIActionCard result inline
       (running flag while streaming; Approve copies to clipboard, Discard clears)
     • Edit → opens an editable draft textarea (not the sidecar)

   Composes shared primitives only; identity uses Avatar + ScoreRing.
   ────────────────────────────────────────────────────────────────────────── */

type Card = {
  key: string;
  title: string;
  evidence: string;
  risk: AIAction["riskTag"];
  conf: AIAction["confidence"];
  channel: "text" | "email";
};

type DraftState = {
  key: string;
  text: string;
  loading: boolean;
  editing: boolean;
  approved: boolean;
};

export function LeadDetailPanel({
  lead,
  aiActions,
  onAssign,
}: {
  lead: Lead;
  aiActions: AIAction[];
  onAssign?: (leadId: string, agentSlug: string) => void;
}) {
  const { openAi } = useAiSidecar();
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [compose, setCompose] = useState<ComposeMode | null>(null);
  const [full, setFull] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  /** key of the draft currently shown as a Matin-branded artifact (S2.6). */
  const [branded, setBranded] = useState<string | null>(null);
  const draftAnchor = useRef<HTMLDivElement>(null);

  const agent = getAgent(lead.assignedAgent);
  const temp = tempLabel(lead.score);
  const timeline = leadTimeline(lead);

  // Reset transient state when the selected lead changes.
  useEffect(() => {
    setDrafts({});
    setCompose(null);
    setFull(false);
    setBranded(null);
  }, [lead.id]);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600);
  }

  const seeded = aiActions.filter(
    (a) => a.sourceType === "lead" && a.sourceId === lead.id && a.context.startsWith("CRM"),
  );

  const seller = isSellerIntent(lead);
  // REAL matched listings (same community + budget) — citations for the cards.
  const matches = matchedHomesFor(lead);
  const matchCite = matches.length
    ? matches.map((m) => `${m.address} (${`$${Math.round(m.price / 1000)}k`})`).join(", ")
    : `${lead.community} homes in ${budgetLabel(lead)}`;

  const cards: Card[] = seller
    ? [
        {
          key: "cma-draft",
          title: `Send ${lead.firstName} a home-value / CMA touch`,
          evidence: `${lead.firstName} is showing seller intent in ${lead.community} (${lead.source}). Draft a branded CMA + cash-offer comparison from recent ${lead.community} comps and the home's estimated value band.`,
          risk: "Approval required",
          conf: lead.score >= 75 ? "High" : "Medium",
          channel: "email",
        },
        {
          key: "value-text",
          title: `Text ${lead.firstName} their estimated value range`,
          evidence: `Estimated equity band of ${budgetLabel(lead)}. Send a short, personal value-range text and offer a no-obligation home-value walkthrough.`,
          risk: "Approval required",
          conf: "Medium",
          channel: "text",
        },
      ]
    : [
        {
          key: "first-text",
          title: seeded[0]?.title ?? `Send first reply to ${lead.firstName} with ${matches.length || 3} matched homes`,
          evidence:
            seeded[0]?.evidence ??
            `${lead.firstName} viewed ${lead.community} homes and saved searches, then asked about availability. Matched active ${lead.community} listings inside ${budgetLabel(lead)}: ${matchCite}.`,
          risk: seeded[0]?.riskTag ?? "Approval required",
          conf: seeded[0]?.confidence ?? "High",
          channel: "text",
        },
        {
          key: "send-homes",
          title: `Email ${lead.firstName} ${matches.length || 3} matching ${lead.community} homes`,
          evidence: `Buyer budget ${budgetLabel(lead)} with ${lead.propertyViews?.length ?? 0} recent home views. Real active matches ready to send: ${matchCite}.`,
          risk: "Approval required",
          conf: lead.score >= 75 ? "High" : "Medium",
          channel: "email",
        },
      ];

  async function runDraft(card: Card) {
    setDrafts((d) => ({
      ...d,
      [card.key]: { key: card.key, text: "", loading: true, editing: false, approved: false },
    }));
    requestAnimationFrame(() =>
      draftAnchor.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
    );
    await streamAi(
      {
        tool: "lead-responder",
        input: {
          leadName: lead.name,
          firstName: lead.firstName,
          intent: lead.intent,
          community: lead.community,
          budget: budgetLabel(lead),
          score: lead.score,
          signals: lead.propertyViews ?? [],
          channel: card.channel,
        },
      },
      (_chunk, fullText) =>
        setDrafts((d) => {
          const cur = d[card.key];
          if (!cur || cur.key !== card.key) return d;
          return { ...d, [card.key]: { ...cur, text: fullText } };
        }),
    );
    setDrafts((d) => {
      const cur = d[card.key];
      if (!cur) return d;
      return { ...d, [card.key]: { ...cur, loading: false } };
    });
  }

  function setDraftText(key: string, text: string) {
    setDrafts((d) => (d[key] ? { ...d, [key]: { ...d[key], text } } : d));
  }
  function discardDraft(key: string) {
    setDrafts((d) => {
      const next = { ...d };
      delete next[key];
      return next;
    });
  }
  function approveDraft(key: string) {
    setDrafts((d) => (d[key] ? { ...d, [key]: { ...d[key], approved: true } } : d));
    // S2.6 — Approve produces the BRANDED artifact (not a raw clipboard copy):
    // open the Matin-branded document preview the client would actually receive.
    setBranded(key);
    flash("Draft approved — opening branded preview");
  }

  function handleComposeComplete(result: ComposeResult) {
    setCompose(null);
    if (result.mode === "assign" && onAssign) onAssign(lead.id, result.agentSlug);
    flash(result.summary);
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
      {/* Identity header — Avatar + ScoreRing */}
      <div className="flex items-start gap-4 border-b border-mist px-5 py-4">
        <ScoreRing value={lead.score} size={58} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <Avatar name={lead.name} size={32} ring />
            <h2 className="truncate font-display text-[1.2rem] font-normal leading-tight text-ink">
              {lead.name}
            </h2>
            <StatusChip tone={temp.tone} variant="soft">
              {temp.label}
            </StatusChip>
          </div>
          <p className="mt-1 flex items-center gap-1 text-[0.78rem] text-slate">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {lead.community}
          </p>
          {/* Hero value — large tabular budget band (FUB "$1M" pattern, S2.8) */}
          <p className="mt-1.5 font-sans text-[1.5rem] font-bold leading-none tabular-nums text-ink">
            {budgetLabel(lead)}
            <span className="ml-2 align-middle text-[0.72rem] font-medium uppercase tracking-[0.12em] text-gold-ink">
              {isSellerIntent(lead) ? "Est. equity band" : "Buyer budget"}
            </span>
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
        <button
          type="button"
          onClick={() => setFull(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-mist bg-cloud px-2.5 py-1.5 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
        >
          <Maximize2 className="h-3.5 w-3.5" aria-hidden />
          Full 360
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {/* Contact + owner facts */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[0.78rem]">
          <Fact label="Phone" value={lead.phone} />
          <Fact label="Email" value={lead.email} />
          <FactOwner agentName={agent?.name ?? lead.assignedAgent} agentSlug={agent?.slug} />
          <Fact
            label="Last contact"
            value={lead.lastContactDaysAgo === 0 ? "Today" : `${lead.lastContactDaysAgo}d ago`}
            valueTone={lead.lastContactDaysAgo >= 7 ? "danger" : "ink"}
          />
        </dl>

        {/* Engagement strip — Real-Geeks behavioral compact (S2.3) */}
        <EngagementStrip lead={lead} />

        {/* Recency nudge */}
        {lead.lastContactDaysAgo >= 7 ? (
          <p className="rounded-lg border border-danger/20 bg-danger/[0.06] px-3 py-2 text-[0.78rem] font-medium text-danger">
            It&apos;s been {lead.lastContactDaysAgo} days since you last contacted this lead.
          </p>
        ) : null}

        {/* Next best action — highlighted sentence with reasoning */}
        <section className="rounded-xl border border-gold/25 bg-gold-soft/60 px-4 py-3.5">
          <div className="flex items-center gap-1.5">
            <MatinMark theme="dark" className="h-3.5 w-3.5" />
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

        {/* AI proposed actions — stream INLINE into the card result, approval-gated */}
        <section ref={draftAnchor} className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="eyebrow text-slate">AI proposed actions</p>
            <button
              type="button"
              onClick={() => openAi(`Working on: CRM & Leads / ${lead.name}`)}
              className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-2.5 py-1 text-[0.72rem] font-semibold text-gold-ink ring-1 ring-inset ring-gold/25 transition-colors hover:bg-gold/20"
            >
              <MatinMark theme="dark" className="h-3 w-3" />
              Ask Matin
            </button>
          </div>
          {cards.map((c) => {
            const d = drafts[c.key];
            return (
              <AIActionCard
                key={c.key}
                title={c.title}
                evidence={c.evidence}
                riskTag={c.risk}
                confidence={c.conf}
                runLabel={d ? "Redraft" : c.channel === "email" ? "Draft email" : "Draft text"}
                running={d?.loading ?? false}
                onRun={() => runDraft(c)}
                onEdit={d ? () => setDrafts((s) => ({ ...s, [c.key]: { ...s[c.key], editing: true } })) : undefined}
                onReject={d ? () => discardDraft(c.key) : undefined}
                result={
                  d && (d.text || d.loading) ? (
                    <DraftBlock
                      state={d}
                      channelLabel={c.channel === "email" ? "email" : "text"}
                      leadName={lead.name}
                      onChange={(t) => setDraftText(c.key, t)}
                      onApprove={() => approveDraft(c.key)}
                      onDiscard={() => discardDraft(c.key)}
                    />
                  ) : undefined
                }
              />
            );
          })}
        </section>

        {/* Activity timeline */}
        <section>
          <p className="eyebrow pb-1 text-slate">Recent activity</p>
          <ActivityTimeline items={timeline} />
        </section>

        {/* Quiet Matin brand footer + real office contact (S2.10) */}
        <div className="flex items-center gap-2 border-t border-mist pt-3">
          <Logo variant="full" theme="dark" className="h-3.5" />
          <span className="text-[0.68rem] text-slate">
            {company.name} · {company.address.city}, {company.address.state} · {company.phone}
          </span>
        </div>
      </div>

      {/* Bottom action bar — Call ink-filled primary (tel:), rest open ComposeDrawer */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-mist bg-cloud px-5 py-3">
        <a
          href={telHref(lead.phone)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[0.8rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
        >
          <Phone className="h-4 w-4" aria-hidden />
          Call
        </a>
        <ActionPill icon={MessageSquare} label="Text" onClick={() => setCompose("text")} />
        <ActionPill icon={Mail} label="Email" onClick={() => setCompose("email")} />
        <ActionPill icon={CalendarPlus} label="Schedule" onClick={() => setCompose("schedule")} />
        <ActionPill icon={UserPlus} label="Assign" onClick={() => setCompose("assign")} />
      </div>

      {/* Inline confirmation toast */}
      {toast ? (
        <div
          className="pointer-events-none absolute bottom-16 left-1/2 z-10 -translate-x-1/2"
          aria-live="polite"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-mist bg-cloud px-3.5 py-1.5 text-[0.78rem] font-medium text-ink shadow-lift">
            <CircleCheck className="h-3.5 w-3.5 text-success" aria-hidden />
            {toast}
          </span>
        </div>
      ) : null}

      {/* Compose / assign drawer */}
      {compose ? (
        <ComposeDrawer
          lead={lead}
          mode={compose}
          open
          onClose={() => setCompose(null)}
          onComplete={handleComposeComplete}
        />
      ) : null}

      {/* Full 360 drawer */}
      <LeadFullDrawer
        lead={lead}
        open={full}
        onClose={() => setFull(false)}
        onCall={() => {
          window.location.href = telHref(lead.phone);
        }}
        onText={() => {
          setFull(false);
          setCompose("text");
        }}
        onEmail={() => {
          setFull(false);
          setCompose("email");
        }}
      />

      {/* Branded artifact preview — what the client receives after Approve (S2.6) */}
      <RecordDrawer
        open={branded !== null}
        onClose={() => setBranded(null)}
        title="Branded draft preview"
        subtitle={`Matin Real Estate · ${lead.name}`}
        actions={
          <>
            <button
              type="button"
              onClick={async () => {
                const text = branded ? drafts[branded]?.text ?? "" : "";
                try {
                  await navigator.clipboard.writeText(text);
                  flash("Copied — review, then send");
                } catch {
                  flash("Draft ready to send");
                }
              }}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-[0.82rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
            >
              Copy & send
            </button>
            <button
              type="button"
              onClick={() => setBranded(null)}
              className="inline-flex items-center justify-center rounded-lg border border-mist px-3 py-2 text-[0.82rem] font-medium text-ink transition-colors hover:bg-paper-200"
            >
              Close
            </button>
          </>
        }
      >
        <BrandedLeadDraft
          lead={lead}
          mode={isSellerIntent(lead) ? "seller" : "buyer"}
          draft={branded ? drafts[branded]?.text : undefined}
        />
      </RecordDrawer>
    </div>
  );
}

/* ── Engagement strip — compact behavioral metrics (S2.3) ──────────────────── */
function EngagementStrip({ lead }: { lead: Lead }) {
  const e = engagementStats(lead);
  const stats = [
    { label: "Searches", value: e.searches },
    { label: "Props", value: e.props },
    { label: "Visits", value: e.visits },
    { label: "Favs", value: e.favs },
  ];
  return (
    <section className="rounded-xl border border-mist bg-paper-200/40 px-3.5 py-3">
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-[1.05rem] font-bold leading-none tabular-nums text-ink">{s.value}</p>
            <p className="mt-0.5 text-[0.62rem] font-medium uppercase tracking-[0.1em] text-slate">
              {s.label}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-mist/70 pt-2 text-[0.72rem]">
        <span className="min-w-0 truncate text-slate">
          Last search: <span className="font-medium text-ink">{e.lastSearch}</span>
        </span>
        <span className="shrink-0 font-medium text-slate tabular-nums">{e.lastActive}</span>
      </div>
    </section>
  );
}

function DraftBlock({
  state,
  channelLabel,
  leadName,
  onChange,
  onApprove,
  onDiscard,
}: {
  state: DraftState;
  channelLabel: string;
  leadName: string;
  onChange: (text: string) => void;
  onApprove: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-slate-300/70">
          Draft {channelLabel} · awaiting approval
        </span>
        {state.approved ? (
          <span className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-success">
            <CircleCheck className="h-3 w-3" aria-hidden /> Approved
          </span>
        ) : null}
      </div>
      {state.editing && !state.loading ? (
        <textarea
          value={state.text}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          className="w-full resize-y rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-[0.8rem] leading-relaxed text-cloud focus:border-gold/40 focus:outline-none"
        />
      ) : (
        <p className="whitespace-pre-wrap text-[0.8rem] leading-relaxed text-slate-300">{state.text}</p>
      )}
      {!state.loading && state.text ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onApprove}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
          >
            <CircleCheck className="h-3.5 w-3.5" aria-hidden />
            {state.approved ? "View branded" : "Approve & preview"}
          </button>
          {/* Copy + Save .txt so the drafted reply is never view-only */}
          <DraftActions
            text={state.text}
            fileName={`matin-${channelLabel}-${slugify(leadName)}.txt`}
            tone="dark"
            copyLabel="Copy"
          />
          <button
            type="button"
            onClick={onDiscard}
            className="min-h-9 rounded-lg px-2.5 py-1.5 text-[0.76rem] font-medium text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud"
          >
            Discard
          </button>
        </div>
      ) : null}
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

function FactOwner({ agentName, agentSlug }: { agentName: string; agentSlug?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.68rem] font-medium uppercase tracking-[0.1em] text-slate">Owner</dt>
      <dd className="mt-0.5 flex items-center gap-1.5">
        <Avatar name={agentName} slug={agentSlug} size={20} ring />
        <span className="truncate text-[0.82rem] font-medium text-ink" title={agentName}>
          {agentName}
        </span>
      </dd>
    </div>
  );
}

function ActionPill({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Phone;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.8rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}
