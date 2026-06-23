"use client";

import { Fragment, useCallback, useMemo, useRef, useState } from "react";
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
import { MatinMark, Logo } from "@/components/brand/Logo";
import {
  KpiStrip,
  KpiCard,
  SavedViewTabs,
  Dot,
  Avatar,
  PropertyThumb,
  CalloutCard,
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
import {
  smoothScrollTo,
  useViewFade,
} from "@/components/command/today/useViewTransition";

/* ──────────────────────────────────────────────────────────────────────────
   Today Command Center  →  /hub   (build reference §2.1 · tickets S1.1–S1.9)

   One prioritized queue across leads, listings, transactions, marketing, AI
   approvals, and system failures. Everything is REAL:
     • all 6 KPIs DERIVED from the data layer (todayKpis/derived) — never literals
     • a Brokerage Vital Score ScoreRing hero (the premium win)
     • a recharts Live Pipeline chart (replaces flat ProgressTrack bars)
     • a real recent-activity feed
     • operable queue rows with a per-row quick-action cluster (call/text/email/
       approve/retry) that works WITHOUT opening the drawer
     • risk alerts backed by real transactions / listing-pipeline / seller-leads
     • branded client-facing drafts rendered through BrandedDocument
   Mobile (R1/R3/R4): AI summary + Vital + Risk float ABOVE the queue below lg
   (the queue + rail split side-by-side at lg+, so the 1024–1279 band is a real
   two-pane workspace, not a buried single column); 3 hero KPI tiles + "More
   metrics" expander on phone; full-width rows.
   ────────────────────────────────────────────────────────────────────────── */

/* ── Headline KPI numbers — every value DERIVED (G-A #7), none hardcoded ──── */
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

/* ── Overnight-summary headline count — DERIVED, reconciles to the queue ───── */
const QUEUE_TOTAL = workQueue.length;

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

  /* The Human Work Queue lives at the bottom of a long, single-column stack
     below xl. A KPI drill / "Review drafts" / tab change that swaps its content
     would otherwise be INVISIBLE off-screen — so we scroll it into view and
     play a short content fade on every view change (MANDATE 1). */
  const queueRef = useRef<HTMLDivElement>(null);
  // animate-rise ≈ 0.8s; hold `entering` long enough not to cut it short.
  const queueFade = useViewFade(800);

  /** Switch the queue's saved view AND make the change visible (scroll + fade). */
  const bumpQueue = queueFade.bump;
  const goToTab = useCallback(
    (tab: string, scroll = true) => {
      setActiveTab(tab);
      bumpQueue();
      if (scroll) {
        // Defer so the new rows have laid out before we scroll to them.
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

  /* ── KPI tiles (each derived; two-value delta on EVERY tile) ───────────── */
  const kpiTiles = [
    {
      key: "new-leads",
      el: (
        <KpiCard
          label="New leads"
          value={K.newLeads}
          icon={<UserPlus className="h-4 w-4" />}
          delta={`${derived.activeLeads} active`}
          deltaTone="up"
          hint="New-stage leads across IDX, Zillow & referrals"
          onDrill={() => router.push("/hub/crm")}
        />
      ),
    },
    {
      key: "hot-sellers",
      el: (
        <KpiCard
          label="Hot seller signals"
          value={K.hotSellerSignals}
          icon={<Home className="h-4 w-4" />}
          delta={`${derived.sellerSignalsTracked} watching`}
          deltaTone="up"
          hint="Seller-intent score 80+ this week"
          onDrill={() => router.push("/hub/cash-offer")}
        />
      ),
    },
    {
      key: "launches",
      el: (
        <KpiCard
          label="Listing launches"
          value={K.listingLaunches}
          icon={<Building2 className="h-4 w-4" />}
          delta={`${derived.launchesBlocked} blocked`}
          deltaTone={derived.launchesBlocked > 0 ? "down" : "flat"}
          hint="In-flight pre-Active launches"
          onDrill={() => router.push("/hub/listing-launch")}
        />
      ),
    },
    {
      key: "tx-risk",
      el: (
        <KpiCard
          label="Transactions at risk"
          value={K.txAtRisk}
          valueTone="danger"
          icon={<TriangleAlert className="h-4 w-4" />}
          delta={`${derived.openTransactions} open`}
          deltaTone="flat"
          hint="Deadlines & financing flags"
          onDrill={() => router.push("/hub/transactions")}
        />
      ),
    },
    {
      key: "drafts",
      el: (
        <KpiCard
          label="AI drafts waiting"
          value={K.aiDraftsWaiting}
          icon={<MatinMark theme="dark" className="h-4 w-4" />}
          delta={`${reportMetrics.automationImpact.aiDraftsApproved} approved`}
          deltaTone="up"
          hint="Need your approval to send"
          onDrill={() => goToTab("AI Drafts")}
        />
      ),
    },
    {
      key: "errors",
      el: (
        <KpiCard
          label="Workflow errors"
          value={K.workflowErrors}
          valueTone="danger"
          icon={<ServerCrash className="h-4 w-4" />}
          delta={`${derived.failedAutomationQueueItems} in queue`}
          deltaTone="down"
          hint="Retryable from the queue"
          onDrill={() => router.push("/hub/systems-health")}
        />
      ),
    },
  ];

  /* The AI overnight summary card — numbers bound to derived counts (S1.2) */
  const aiSummaryCard = (
    <CalloutCard
      tone="ai"
      title={
        <span className="flex items-center gap-2">
          <Logo variant="full" theme="white" className="h-4" />
          <span>AI overnight summary</span>
        </span>
      }
      action={
        <button
          type="button"
          onClick={() => goToTab("AI Drafts")}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.78rem] font-semibold text-gold transition-colors hover:bg-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
        >
          Review drafts
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      }
    >
      <p>
        Triaged your <span className="font-semibold text-cloud">overnight lead activity</span> into{" "}
        <span className="font-semibold text-cloud">{QUEUE_TOTAL} priorities</span>, drafted{" "}
        <span className="font-semibold text-cloud">{K.aiDraftsWaiting} replies</span>, and flagged{" "}
        <span className="font-semibold text-danger">{K.txAtRisk} deals at risk</span> plus{" "}
        <span className="font-semibold text-danger">{K.workflowErrors} failed automations</span>.
        Nothing went out to clients — everything is waiting for your approval.
      </p>
      <p className="mt-2 text-slate-300/80">
        Top of the list: call Daniel Cho before his speed-to-lead window closes, and resolve the
        8912 SE Hawthorne inspection deadline due tomorrow.
      </p>
    </CalloutCard>
  );

  return (
    <div className="px-4 py-5 md:px-6 lg:px-8">
      {/* Subtitle eyebrow (TopCommandBar already renders the H1) */}
      <p className="text-[0.82rem] leading-snug text-slate">
        One prioritized queue across leads, listings, transactions, marketing, AI
        approvals, and system failures.
      </p>

      {/* ── KPI strip — compact 2-up grid on phone (all 6 visible at a glance,
            no "More metrics" wall), 3-up at sm/lg, single 6-up row at xl. ── */}
      <div className="mt-4">
        <KpiStrip className="lg:grid-cols-3 xl:grid-cols-6">
          {kpiTiles.map((t) => (
            <Fragment key={t.key}>{t.el}</Fragment>
          ))}
        </KpiStrip>
      </div>

      {/* ── Mobile-first stack: AI summary + Vital + Risk float ABOVE the queue
            below lg; the real two-column workspace returns at lg so the
            1024–1279 band gets the queue + rail side-by-side, not a buried
            single column (R1) ─────────────────────────────────────────────── */}
      <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        {/* On < lg, render the rail context first so the user sees it before
            scrolling a long queue. At lg+ it sits in the right column (order-2)
            and STICKS — compact summary widgets stay in view while the wide
            primary column scrolls, so neither column leaves dead space. */}
        <div className="flex min-w-0 flex-col gap-5 lg:order-2 lg:sticky lg:top-4 lg:self-start">
          {aiSummaryCard}
          <BrokerageVitalScore />

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

        </div>

        {/* PRIMARY column (wide) — the work queue plus the calendar/risk and
            activity lists, so the wide column carries the scrolling content and
            the compact rail stays sticky beside it (no empty half-column). */}
        <div className="flex min-w-0 flex-col gap-5 lg:order-1">
        {/* PRIMARY — Human Work Queue */}
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

          {/* Tabs + search + Showing N */}
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

          <RecentActivityFeed limit={7} />
        </div>
      </div>

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
