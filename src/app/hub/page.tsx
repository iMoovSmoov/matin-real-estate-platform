"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Home,
  Building2,
  TriangleAlert,
  ServerCrash,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  CircleCheck,
  Search,
  X,
} from "lucide-react";
import { MatinMark } from "@/components/brand/Logo";
import {
  SavedViewTabs,
  Dot,
  Avatar,
  PropertyThumb,
  RecordDrawer,
  EmptyState,
  useAiSidecar,
  type SavedView,
  type ChipTone,
} from "@/components/os";
import {
  workQueue,
  failedWorkflowRuns,
  aiActions,
  transactions,
  listingPipeline,
  sellerLeads,
  derived,
  todayKpis,
  listingPhoto,
  listings,
  reportMetrics,
} from "@/lib/data";
import type { WorkQueueItem } from "@/lib/types";
import { streamAi } from "@/lib/ai/client";
import { cn, compactUsd } from "@/lib/utils";
import {
  sourceHref,
  sourceLabel,
} from "@/components/command/today/workQueueMeta";
import { enrich } from "@/components/command/today/queueEnrich";
import { QueueRow } from "@/components/command/today/QueueRow";
import { QueueDrawerBody } from "@/components/command/today/QueueDrawerBody";
import { BrokerageVitalScore } from "@/components/command/today/BrokerageVitalScore";
import { LivePipelineChart } from "@/components/command/today/TodayCharts";
import { RecentActivityFeed } from "@/components/command/today/RecentActivityFeed";
import { BriefingBand } from "@/components/command/today/BriefingBand";
import { TodayKpiTile } from "@/components/command/today/TodayKpiTile";
import { AiOvernightSummary } from "@/components/command/today/AiOvernightSummary";
import { TodayFocusCard } from "@/components/command/today/TodayFocusCard";
import { FeaturedListings } from "@/components/command/today/FeaturedListings";
import { AgentLeaderboard } from "@/components/command/today/AgentLeaderboard";
import {
  smoothScrollTo,
  useViewFade,
} from "@/components/command/today/useViewTransition";

/* ──────────────────────────────────────────────────────────────────────────
   Today Command Center  →  /hub   (image-led redesign — render-ready spec)

   An IMAGE-LED, premium command center. Lead with real photography (the West
   Linn office hero), then a rich-but-honest KPI strip, a two-region workspace
   (human work queue + live pipeline + risk on the left; AI summary, today's
   focus, vital score, and the agent leaderboard in the sticky right rail), and
   full-width featured-listing + activity rails below.

   Everything is REAL: all 6 KPIs DERIVED from the data layer (todayKpis /
   derived), pipeline figures summed from reportMetrics, headshots + property
   heroes resolved through Avatar / listingPhoto, the leaderboard from
   reportMetrics.agentLeaderboard. Estate-Green is rationed to AI affordances +
   active state + the #1 medal + the score arcs.

   PRESERVED working behavior: the AI sidecar trigger (openAi), every KPI drill
   target, the operable work-queue rows (call/text/email/approve/retry without
   opening the drawer), real branded drafts + downloads through the RecordDrawer.
   ────────────────────────────────────────────────────────────────────────── */

const K = todayKpis; // { newLeads, hotSellerSignals, listingLaunches, txAtRisk, aiDraftsWaiting, workflowErrors }

/* ── Saved views = the 5 work-queue tabs, each counted ─────────────────────── */
const TAB_KEYS: WorkQueueItem["tab"][] = [
  "My Work",
  "Team",
  "High Risk",
  "AI Drafts",
  "Failed Automations",
];

const VIEWS: SavedView[] = TAB_KEYS.map((t) => ({
  key: t,
  label: t,
  count: workQueue.filter((w) => w.tab === t).length,
}));

/* ── Pipeline $ total (chart header) ─────────────────────────────────────── */
const PIPELINE_TOTAL = reportMetrics.pipeline.reduce((s, p) => s + p.value, 0);
const PIPELINE_DEALS = reportMetrics.pipeline.reduce((s, p) => s + p.deals, 0);

/* ── Brokerage Calendar + Risk Alerts — BACKED BY REAL DATA (S1.9) ────────── */
type AlertRow = {
  id: string;
  tone: ChipTone;
  title: string;
  date: string;
  href: string;
  ownerSlug?: string;
  thumbSrc?: string;
};

/** Resolve a real listing hero photo by address (matches the canonical set). */
function photoByAddress(address: string, fallbackId: string): string {
  const norm = (s: string) => s.toLowerCase().replace(/[.,].*$/, "").replace(/\s+/g, " ").trim();
  const hit = listings.find((l) => norm(l.address) === norm(address));
  return hit ? listingPhoto(hit) : listingPhoto(fallbackId);
}

const RISK_ALERTS: AlertRow[] = [
  // 1) Transactions carrying a real risk flag, soonest close first.
  ...transactions
    .filter((t) => Boolean(t.riskFlag))
    .sort((a, b) => a.closeDateDaysOut - b.closeDateDaysOut)
    .map<AlertRow>((t) => ({
      id: t.id,
      tone: "danger",
      title: `${t.address.split(",")[0]} — ${t.riskFlag}`,
      date:
        t.closeDateDaysOut <= 1 ? "Deadline tomorrow" : `Closes in ${t.closeDateDaysOut} days`,
      href: "/hub/transactions",
      ownerSlug: t.agentSlug,
      thumbSrc: photoByAddress(t.address, t.id),
    })),
  // 2) Listing launches blocked on a real blocker (broker review / disclosures).
  ...listingPipeline
    .filter((l) => Array.isArray(l.blockers) && l.blockers.length > 0)
    .slice(0, 2)
    .map<AlertRow>((l) => ({
      id: l.id,
      tone: "warn",
      title: `${l.address} — ${l.blockers![0]}`,
      date: `${l.stage} · day ${l.daysInStage}`,
      href: "/hub/listing-launch",
      ownerSlug: l.agentSlug,
      thumbSrc: photoByAddress(`${l.address}, ${l.city}`, l.id),
    })),
  // 3) Top seller signal needing a same-day call (real seller lead).
  ...sellerLeads
    .filter((s) => (s.sellerScore ?? 0) >= 88)
    .sort((a, b) => (b.sellerScore ?? 0) - (a.sellerScore ?? 0))
    .slice(0, 1)
    .map<AlertRow>((s) => ({
      id: s.id,
      tone: "info",
      title: `Call ${s.sellerName} — seller-intent ${s.sellerScore}`,
      date: `${s.city} · ${s.timeline}`,
      href: "/hub/cash-offer",
      ownerSlug: s.assignedAgent,
      thumbSrc: photoByAddress(`${s.address}, ${s.city}`, s.id),
    })),
];

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function TodayCommandCenter() {
  const router = useRouter();
  const { openAi } = useAiSidecar();

  const [activeTab, setActiveTab] = useState<string>("My Work");
  const [query, setQuery] = useState("");

  /* The work queue can be off-screen on a long page; a KPI drill / "Review
     drafts" / tab change that swaps its content would be invisible — so we
     scroll it into view and play a short content fade on every view change. */
  const queueRef = useRef<HTMLDivElement>(null);
  const queueFade = useViewFade(800);

  /** Switch the queue's saved view AND make the change visible (scroll + fade). */
  const bumpQueue = queueFade.bump;
  const goToTab = useCallback(
    (tab: string, scroll = true) => {
      setActiveTab(tab);
      bumpQueue();
      if (scroll) {
        requestAnimationFrame(() => smoothScrollTo(queueRef.current, "start"));
      }
    },
    [bumpQueue],
  );

  const [selected, setSelected] = useState<WorkQueueItem | null>(null);
  const [drawerTab, setDrawerTab] = useState<"preview" | "draft">("preview");

  /* per-item AI draft state, keyed by work-queue id */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [drafting, setDrafting] = useState<string | null>(null);
  const [retried, setRetried] = useState<Record<string, boolean>>({});

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return workQueue.filter(
      (w) =>
        w.tab === activeTab &&
        (q === "" ||
          w.subject.toLowerCase().includes(q) ||
          w.why.toLowerCase().includes(q)),
    );
  }, [activeTab, query]);

  /* the AI action backing the selected row (if any) */
  const linkedAction = selected
    ? selected.sourceType === "ai-action"
      ? aiActions.find((a) => a.id === selected.sourceId)
      : aiActions.find(
          (a) => a.sourceType === selected.sourceType && a.sourceId === selected.sourceId,
        )
    : undefined;

  const isFailedRow = selected?.tab === "Failed Automations";
  const failedRun = isFailedRow
    ? failedWorkflowRuns.find((r) => r.id === selected?.sourceId)
    : undefined;

  function openRow(item: WorkQueueItem) {
    setSelected(item);
    setDrawerTab(item.tab === "AI Drafts" ? "draft" : "preview");
  }

  /** Quick action from a row — opens the drawer pre-targeted (compose / approve). */
  function quickFromRow(item: WorkQueueItem, action: "text" | "email" | "approve") {
    setSelected(item);
    if (action === "approve") {
      setDrawerTab("draft");
      const linked =
        item.sourceType === "ai-action"
          ? aiActions.find((a) => a.id === item.sourceId)
          : aiActions.find((a) => a.sourceType === item.sourceType && a.sourceId === item.sourceId);
      if (linked) runDraft(item, linked);
    } else {
      setDrawerTab("preview");
    }
  }

  function retryFromRow(item: WorkQueueItem) {
    setRetried((r) => ({ ...r, [item.id]: true }));
  }

  function runDraft(item: WorkQueueItem, action: NonNullable<typeof linkedAction>) {
    setDrawerTab("draft");
    setDrafting(item.id);
    setDrafts((d) => ({ ...d, [item.id]: "" }));
    streamAi(
      {
        tool: "lead-responder",
        input: {
          task: action.title,
          context: action.context,
          evidence: action.evidence,
          subject: item.subject,
        },
      },
      (_chunk, full) => setDrafts((d) => ({ ...d, [item.id]: full })),
    ).finally(() => setDrafting(null));
  }

  const selectedResolved = selected ? Boolean(retried[selected.id]) : false;

  /* ── The 6 hero KPI tiles — every value DERIVED, color-as-data on the value,
        honest ratio bars only where a true part/whole exists ─────────────── */
  const kpiTiles = (
    <>
      <TodayKpiTile
        tone="neutral"
        icon={<UserPlus className="h-4 w-4" aria-hidden />}
        label="New leads"
        value={K.newLeads}
        context="New-stage leads across IDX, Zillow & referrals"
        ratio={{
          value: derived.activeLeads,
          whole: derived.activeLeads + derived.staleLeads,
          label: `${derived.activeLeads} active · ${derived.staleLeads} stale`,
          tone: "success",
        }}
        onDrill={() => router.push("/hub/crm")}
      />
      <TodayKpiTile
        tone="neutral"
        icon={<Home className="h-4 w-4" aria-hidden />}
        label="Hot seller signals"
        value={K.hotSellerSignals}
        context="Seller-intent score 80+ this week"
        ratio={{
          value: K.hotSellerSignals,
          whole: derived.sellerSignalsTracked,
          label: `${K.hotSellerSignals} of ${derived.sellerSignalsTracked} tracked`,
          tone: "ai",
        }}
        onDrill={() => router.push("/hub/cash-offer")}
      />
      <TodayKpiTile
        tone="neutral"
        icon={<Building2 className="h-4 w-4" aria-hidden />}
        label="Listing launches"
        value={K.listingLaunches}
        context={`In-flight pre-Active launches · ${derived.launchesBlocked} blocked`}
        onDrill={() => router.push("/hub/listing-launch")}
      />
      <TodayKpiTile
        tone="danger"
        icon={<TriangleAlert className="h-4 w-4" aria-hidden />}
        label="Transactions at risk"
        value={K.txAtRisk}
        context={`Deadlines & financing flags · ${derived.openTransactions} open`}
        onDrill={() => router.push("/hub/transactions")}
      />
      <TodayKpiTile
        tone="ai"
        icon={<MatinMark theme="dark" className="h-4 w-4" />}
        label="AI drafts waiting"
        value={K.aiDraftsWaiting}
        context={`${reportMetrics.automationImpact.aiDraftsApproved} approved · waiting for your OK`}
        onDrill={() => goToTab("AI Drafts")}
      />
      <TodayKpiTile
        tone="danger"
        icon={<ServerCrash className="h-4 w-4" aria-hidden />}
        label="Workflow errors"
        value={K.workflowErrors}
        context={`Retryable from the queue · ${derived.failedAutomationQueueItems} queued`}
        onDrill={() => router.push("/hub/systems-health")}
      />
    </>
  );

  /* AI block (overnight summary + today's focus) — shown above the queue on
     mobile and at the top of the sticky rail on desktop. Same elements reused. */
  const aiBlock = (
    <>
      <AiOvernightSummary onReviewDrafts={() => goToTab("AI Drafts")} />
      <TodayFocusCard />
    </>
  );

  return (
    <div className="space-y-5 px-4 py-5 md:px-6 lg:px-8">
      {/* ── 1 · Image-led briefing band (full-bleed office hero) ───────────── */}
      <BriefingBand />

      {/* ── 2 · KPI strip — 6-across desktop, 2×3 grid on phone ────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
        {kpiTiles}
      </div>

      {/* AI block — mobile: floats above the work queue. Desktop: in the rail. */}
      <div className="space-y-5 lg:hidden">{aiBlock}</div>

      {/* ── 3 · Two-region workspace ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* PRIMARY (left, 8-col) — Work Queue → Live Pipeline → Calendar+Risk */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* Human Work Queue */}
          <section
            ref={queueRef}
            id="human-work-queue"
            className="accent-edge min-w-0 scroll-mt-20 rounded-2xl border border-mist bg-cloud shadow-soft"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
              <div className="min-w-0">
                <h2 className="font-display text-[1.2rem] font-normal leading-tight text-ink">
                  Human Work Queue
                </h2>
                <p className="mt-0.5 text-[0.8rem] text-slate">
                  Only tasks requiring human judgment; automation handles the rest.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  openAi(
                    "Working on: Today / Human Work Queue — prioritize my queue and explain what to do first",
                  )
                }
                className="btn-accent inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.78rem] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
              >
                <MatinMark theme="white" className="h-3.5 w-3.5" />
                <span>Ask AI to prioritize</span>
              </button>
            </div>

            {/* Tabs + search */}
            <div className="flex flex-wrap items-center gap-3 px-5 pb-3 pt-3.5">
              <div className="min-w-0 flex-1">
                <SavedViewTabs
                  views={VIEWS}
                  active={activeTab}
                  onChange={(t) => goToTab(t, false)}
                />
              </div>
              <label className="inline-flex items-center gap-2 rounded-lg border border-mist bg-paper-200/60 px-2.5 py-1.5 focus-within:border-ink/30">
                <Search className="h-3.5 w-3.5 shrink-0 text-slate" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    queueFade.bump();
                  }}
                  placeholder="Filter queue…"
                  aria-label="Filter the work queue by subject"
                  className="w-32 bg-transparent text-[0.8rem] text-ink outline-none placeholder:text-slate sm:w-40"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      queueFade.bump();
                    }}
                    aria-label="Clear filter"
                    className="shrink-0 text-slate transition-colors hover:text-ink"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </label>
            </div>

            <div className="flex items-center justify-between border-t border-mist px-5 py-2">
              <span className="text-[0.74rem] text-slate tabular-nums">
                Showing {rows.length} {rows.length === 1 ? "task" : "tasks"}
              </span>
              <span className="text-[0.72rem] text-slate">Sorted by urgency</span>
            </div>

            <div className="border-t border-mist">
              {rows.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={<CircleCheck className="h-5 w-5" />}
                    title={query ? "No matches" : "Queue clear"}
                    body={
                      query
                        ? `Nothing in ${activeTab} matches “${query}”. Clear the filter or switch views.`
                        : "Nothing in this view needs human judgment right now. Automation is handling the rest — check back as new signals land."
                    }
                    actionLabel={query ? "Clear filter" : "View My Work"}
                    onAction={() =>
                      query
                        ? (setQuery(""), queueFade.bump())
                        : goToTab("My Work", false)
                    }
                  />
                </div>
              ) : (
                <div
                  role="list"
                  key={queueFade.token}
                  className={cn(queueFade.entering && "motion-safe:animate-rise")}
                >
                  {rows.map((item) => (
                    <QueueRow
                      key={item.id}
                      item={item}
                      resolved={Boolean(retried[item.id])}
                      onOpen={openRow}
                      onQuick={quickFromRow}
                      onRetry={retryFromRow}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Live Pipeline (recharts) */}
          <section className="card-elevated p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-[1.05rem] font-normal leading-tight text-ink">
                  Live Pipeline
                </h3>
                <p className="mt-0.5 text-[0.78rem] text-slate tabular-nums">
                  {compactUsd(PIPELINE_TOTAL)} across {PIPELINE_DEALS} open deals
                </p>
              </div>
              <Link
                href="/hub/reporting"
                className="inline-flex items-center gap-1 text-[0.76rem] font-semibold text-slate transition-colors hover:text-ink"
              >
                Full report
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
            <div className="mt-3 h-56 w-full">
              <LivePipelineChart />
            </div>
          </section>

          {/* Brokerage Calendar + Risk Alerts — real records */}
          <section className="card-elevated p-5">
            <h3 className="font-display text-[1.05rem] font-normal leading-tight text-ink">
              Brokerage Calendar + Risk Alerts
            </h3>
            <p className="mt-0.5 text-[0.78rem] text-slate">
              Risk-flagged deals, blocked launches, and your hottest seller signal
            </p>
            <ul className="mt-3 divide-y divide-mist">
              {RISK_ALERTS.map((a) => (
                <li key={a.id}>
                  <Link
                    href={a.href}
                    className="group flex items-center gap-3 py-3 transition-colors hover:bg-paper-200/40"
                  >
                    <span className="h-9 w-12 shrink-0 overflow-hidden rounded-md">
                      <PropertyThumb
                        src={a.thumbSrc}
                        ratio="video"
                        rounded={false}
                        alt={a.title}
                        className="h-full w-full"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <Dot tone={a.tone} className="shrink-0" />
                        <span className="block truncate text-[0.84rem] font-medium leading-snug text-ink">
                          {a.title}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-[0.76rem] text-slate tabular-nums">
                        {a.date}
                      </span>
                    </span>
                    {a.ownerSlug ? (
                      <Avatar name={a.title} slug={a.ownerSlug} size={24} ring className="shrink-0" />
                    ) : null}
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* RIGHT RAIL (4-col, sticky) — AI block (desktop) → Vital → Leaderboard */}
        <div className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-4 lg:self-start">
          <div className="hidden flex-col gap-5 lg:flex">{aiBlock}</div>
          <BrokerageVitalScore />
          <AgentLeaderboard />
        </div>
      </div>

      {/* ── 4 · Featured listings carousel — full width ───────────────────── */}
      <FeaturedListings />

      {/* ── 5 · Recent activity feed — full width ─────────────────────────── */}
      <RecentActivityFeed limit={8} />

      {/* ── Record drawer (row click) ─────────────────────────────────────── */}
      <RecordDrawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? enrich(selected).personName ?? selected.subject : ""}
        subtitle={
          selected
            ? `${sourceLabel(selected.sourceType)} · ${selected.dueLabel}`
            : undefined
        }
        tabs={
          linkedAction
            ? [
                { key: "preview", label: "Preview" },
                { key: "draft", label: "AI draft" },
              ]
            : undefined
        }
        activeTab={drawerTab}
        onTab={(k) => setDrawerTab(k as "preview" | "draft")}
        actions={
          selected ? (
            <>
              <Link
                href={sourceHref(selected)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-[0.82rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                Open record
              </Link>
              {isFailedRow ? (
                <button
                  type="button"
                  onClick={() => setRetried((r) => ({ ...r, [selected.id]: true }))}
                  disabled={selectedResolved}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-mist px-3 py-2 text-[0.82rem] font-medium text-ink transition-colors hover:bg-paper-200 disabled:opacity-50"
                >
                  {selectedResolved ? (
                    <>
                      <CircleCheck className="h-3.5 w-3.5 text-success" aria-hidden />
                      Resolved
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                      Retry now
                    </>
                  )}
                </button>
              ) : linkedAction ? (
                <button
                  type="button"
                  onClick={() => runDraft(selected, linkedAction)}
                  disabled={drafting === selected.id}
                  className="btn-accent inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[0.82rem] font-semibold disabled:cursor-default disabled:opacity-60"
                >
                  <MatinMark theme="white" className="h-3.5 w-3.5" />
                  <span>
                    {drafting === selected.id
                      ? "Drafting…"
                      : drafts[selected.id]
                        ? "Regenerate"
                        : "Approve & draft"}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAi(`Working on: Today / ${selected.subject}`)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-mist px-3 py-2 text-[0.82rem] font-medium text-ink transition-colors hover:bg-paper-200"
                >
                  <MatinMark theme="dark" className="h-3.5 w-3.5" />
                  Ask AI
                </button>
              )}
            </>
          ) : undefined
        }
      >
        {selected ? (
          <QueueDrawerBody
            item={selected}
            tab={drawerTab}
            linkedAction={linkedAction}
            failedRun={failedRun}
            resolved={selectedResolved}
            draft={drafts[selected.id]}
            drafting={drafting === selected.id}
            onRunDraft={() => linkedAction && runDraft(selected, linkedAction)}
            onReject={() => setDrafts((d) => ({ ...d, [selected.id]: "" }))}
            onAskAi={() => openAi(`Working on: Today / ${selected.subject}`)}
          />
        ) : null}
      </RecordDrawer>
    </div>
  );
}
