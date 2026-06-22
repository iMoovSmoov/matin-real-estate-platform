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
  Sparkles,
  FileText,
  Receipt,
} from "lucide-react";
import type { SellerLead } from "@/lib/types";
import { getAgent, listingPhoto } from "@/lib/data";
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
  BrandedDocument,
  useAiSidecar,
  type ActivityItem,
  type DrawerTab,
} from "@/components/os";
import type { NetSheetLine } from "@/components/os/BrandedDocument";
import {
  conditionTone,
  timelineTone,
  effectiveScore,
  nextAction,
  lostReason,
  agentName,
  outreachTimeline,
  equityBand,
} from "./sellerView";
import { ScoreGauges } from "./ScoreGauges";
import { HomeValueSparkline } from "./SellerCharts";
import { scrollToEl } from "./motion";

/** Estimated seller net-proceeds lines derived from the record (typical
 *  Portland-metro cost stack): payoff (~26% of value), 5% commission, title/
 *  escrow + tax proration. Reconciles to the BrandedDocument netsheet waterfall. */
function netSheetLinesFor(lead: SellerLead): NetSheetLine[] {
  const payoff = Math.round(lead.estValue * 0.26);
  const commission = Math.round(lead.estValue * 0.05);
  const titleEscrow = Math.round(lead.estValue * 0.011);
  const taxProration = Math.round(lead.estValue * 0.004);
  return [
    { label: "Estimated mortgage payoff", amount: -payoff, note: "Pending lender statement" },
    { label: "Brokerage commission (5%)", amount: -commission, note: "Fully negotiable" },
    { label: "Title, escrow & recording", amount: -titleEscrow },
    { label: "Property-tax proration", amount: -taxProration },
  ];
}

/* ──────────────────────────────────────────────────────────────────────────
   Seller / Cash Offers — opportunity drawer (right-side RecordDrawer)

   Opens on kanban-card / table-row click. Composes shared primitives only:
     • a real PropertyThumb hero via listingPhoto (deterministic by record id)
       + a 12-month estimated-value sparkline + Equity/Timeline/Engagement
       intensity gauges + estimate hero number with an intent ScoreRing
     • branded home-value email + Net Sheet via BrandedDocument (Documents tab)
     • an explicit "Ask Matin" button that docks the AISidecar to this record
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
  const { openAi } = useAiSidecar();
  const [draft, setDraft] = useState<DraftState>(null);
  const [tab, setTab] = useState<string>("overview");
  const [approved, setApproved] = useState(false);
  /** Which branded deliverable is previewed in the Documents tab. */
  const [docKind, setDocKind] = useState<"email" | "netsheet">("email");
  const draftRef = useRef<HTMLElement>(null);

  // Reset the open draft + tab whenever a different opportunity is selected.
  useEffect(() => {
    setDraft(null);
    setTab("overview");
    setApproved(false);
    setDocKind("email");
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
  // Real hero photo, deterministic by record id (G-A #6 — no random seed).
  const heroPhoto = listingPhoto({ id: lead.id });
  // Real agent identity for branded signatures (no hardcoded names — §S3.9).
  const agentLicense = agent?.licenseNumbers?.OR ?? agent?.licenses?.[0];
  const brandedAgent = {
    name: agentName(lead.assignedAgent),
    title: agent?.title ?? "Real Estate Broker",
    license: agentLicense,
    phone: agent?.phone,
    email: agent?.email,
    slug: lead.assignedAgent,
  };
  const netLines = netSheetLinesFor(lead);

  async function runDraft() {
    if (!lead) return;
    setApproved(false);
    setDraft({ text: "", running: true });
    // Scroll the AI-draft section into the drawer's viewport (reduced-motion
    // aware) so the streaming result is visible immediately.
    scrollToEl(draftRef.current, "nearest");
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
      meta: `AI draft reviewed and sent by ${agentName(lead.assignedAgent)}`,
      timeLabel: "just now",
      group: "Now",
    });
  }

  const tabs: DrawerTab[] = [
    { key: "overview", label: "Overview" },
    { key: "documents", label: "Documents" },
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
        <div className="flex w-full flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[0.8rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
          >
            <Phone className="h-4 w-4" aria-hidden />
            Call seller
          </button>
          <ActionPill icon={Mail} label="Email" />
          <ActionPill icon={CalendarPlus} label="Book appt" />
          {/* Dock the seller-intel sidecar to THIS record (S3 ticket 8 — the
              global AI sidecar opens only from an explicit Ask-AI button). */}
          <button
            type="button"
            onClick={() =>
              openAi(
                `Working on: cash offer for ${lead.sellerName} · ${lead.address}, ${lead.city}`,
              )
            }
            className="ml-auto inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-[0.8rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Ask Matin
          </button>
        </div>
      }
    >
      {/* `key` remounts on each tab change so the drawer body fades in — a
          tasteful, reduced-motion-safe transition between Overview / Documents
          / Activity rather than an instant snap. */}
      <div key={tab} className="motion-safe:animate-fade">
      {tab === "overview" ? (
        <>
          {/* Real property photo hero (deterministic by record id — G-A #6) */}
          <div className="overflow-hidden rounded-2xl border border-mist">
            <PropertyThumb
              src={heroPhoto}
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

          {/* 12-month estimated-value sparkline (recharts — S3 ticket 2) */}
          <section className="mt-3 rounded-2xl border border-mist bg-cloud px-4 pb-3 pt-3.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="eyebrow text-slate">Estimated value · 12 mo</p>
              <span className="text-[0.72rem] font-medium text-success">
                trending up to {usd(lead.estValue)}
              </span>
            </div>
            <div className="mt-1.5">
              <HomeValueSparkline estValue={lead.estValue} id={lead.id} />
            </div>
          </section>

          {/* Score intensity gauges — Equity / Timeline / Engagement (S3 ticket 1) */}
          <section className="mt-4 rounded-2xl border border-mist bg-cloud px-4 py-3.5">
            <p className="eyebrow pb-2.5 text-slate">Seller-intent drivers</p>
            <ScoreGauges lead={lead} />
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
                  {agent?.title ?? "Assigned agent"}
                  {agent?.phone ? ` · ${agent.phone}` : ""}
                </p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[0.78rem]">
              <Fact label="Seller" value={lead.sellerName} />
              <Fact label="Source" value={lead.source ?? "Owner database"} />
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
                            Sent &amp; saved to the activity feed
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
      ) : tab === "documents" ? (
        /* Documents tab — branded deliverables via BrandedDocument (S3 ticket 7) */
        <section className="space-y-3">
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-mist bg-paper-200/60 p-0.5">
            <DocToggle
              active={docKind === "email"}
              onClick={() => setDocKind("email")}
              icon={FileText}
            >
              Home-value email
            </DocToggle>
            <DocToggle
              active={docKind === "netsheet"}
              onClick={() => setDocKind("netsheet")}
              icon={Receipt}
            >
              Net sheet
            </DocToggle>
          </div>

          {docKind === "email" ? (
            <BrandedDocument
              variant="email"
              title={`Your ${lead.city} home value`}
              recipient={lead.sellerName}
              emailSubject={`${lead.sellerName.split(" ")[0]}, here's what ${lead.address} could sell for`}
              fromName={`Matin Real Estate · ${brandedAgent.name}`}
              agent={brandedAgent}
              mergeTokens={["{{first_name}}", "{{address}}", "{{est_value}}"]}
              body={
                <>
                  <p>
                    Hi <MergeTok>{"{{first_name}}"}</MergeTok>,
                  </p>
                  <p>
                    Thanks for requesting a home-value estimate on{" "}
                    <MergeTok>{"{{address}}"}</MergeTok>. Based on recent {lead.city} sales of
                    comparable {lead.beds}-bed homes, your property is currently estimated around{" "}
                    <span className="font-semibold tabular-nums">{usd(lead.estValue)}</span> —
                    and values in your area have been trending up over the last year.
                  </p>
                  <p>
                    On a {lead.timeline.toLowerCase()} timeline, now is a smart moment to review
                    your options — including a no-obligation cash offer and a full market
                    valuation. I&rsquo;d be glad to walk you through both.
                  </p>
                  <p>
                    Reply here or reach me directly at {brandedAgent.phone ?? company_phone}.
                  </p>
                  <p>
                    Warmly,
                    <br />
                    {brandedAgent.name}
                    {brandedAgent.title ? `, ${brandedAgent.title}` : ""}
                  </p>
                </>
              }
            />
          ) : (
            <BrandedDocument
              variant="netsheet"
              title="Estimated Seller Net Proceeds"
              recipient={lead.sellerName}
              agent={brandedAgent}
              salePrice={lead.estValue}
              netSheetLines={netLines}
              page={1}
              pages={1}
            />
          )}
        </section>
      ) : (
        /* Activity tab */
        <section>
          <p className="eyebrow text-slate">Outreach history</p>
          <ActivityTimeline items={timeline} />
        </section>
      )}
      </div>
    </RecordDrawer>
  );
}

const company_phone = "(503) 622-9624";

function MergeTok({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-sm bg-gold-soft px-1.5 py-0.5 font-mono text-[0.72rem] font-medium text-gold-ink">
      {children}
    </span>
  );
}

function DocToggle({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof FileText;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-[40px] items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[0.78rem] font-medium transition-colors",
        active ? "bg-cloud text-ink shadow-soft" : "text-slate hover:text-ink",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {children}
    </button>
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
