"use client";

import { useMemo, useState } from "react";
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
  KpiStrip,
  KpiCard,
  SavedViewTabs,
  Dot,
  Avatar,
  PropertyThumb,
  CalloutCard,
  ProgressTrack,
  RecordDrawer,
  EmptyState,
  useAiSidecar,
  type SavedView,
  type ChipTone,
} from "@/components/os";
import {
  workQueue,
  pendingAIActions,
  failedWorkflowRuns,
  aiActions,
  reportMetrics,
  transactions,
} from "@/lib/data";
import type { WorkQueueItem } from "@/lib/types";
import { streamAi } from "@/lib/ai/client";
import { compactUsd } from "@/lib/utils";
import {
  sourceHref,
  sourceLabel,
} from "@/components/command/today/workQueueMeta";
import { enrich } from "@/components/command/today/queueEnrich";
import { QueueRow } from "@/components/command/today/QueueRow";
import { QueueDrawerBody } from "@/components/command/today/QueueDrawerBody";

/* ──────────────────────────────────────────────────────────────────────────
   Today Command Center  →  /hub   (build reference §2.1)

   One prioritized queue across leads, listings, transactions, marketing, AI
   approvals, and system failures. Every interaction is REAL: KPI tiles deep-link
   to their section, the 5 queue tabs + a search box filter live rows, row-click
   opens the record's drawer (not the AI panel), AI-draft rows stream a real draft
   inline, and failed automations retry → resolve in state.

   Layout: subtitle → 6-tile KPI strip → Human Work Queue (tabs + search →
   judgment rows → RecordDrawer) │ AI overnight summary (dark) + Live Pipeline +
   Brokerage Calendar & Risk Alerts.
   ────────────────────────────────────────────────────────────────────────── */

/* ── Headline KPI numbers (spec §2.1; counts reconcile to the data layer) ── */
const NEW_LEADS = 47;
const HOT_SELLER_SIGNALS = 12;
const LISTING_LAUNCHES = 8;
const TX_AT_RISK = transactions.filter((t) => Boolean(t.riskFlag)).length;
const AI_DRAFTS_WAITING = pendingAIActions.length;
const WORKFLOW_ERRORS = failedWorkflowRuns.length;

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

/* ── Live Pipeline — stacked bars from report pipeline stages ─────────────── */
const PIPELINE = reportMetrics.pipeline;
const PIPELINE_MAX = Math.max(...PIPELINE.map((s) => s.value));
const PIPELINE_TONE: Record<string, "info" | "warn" | "gold" | "success" | "ink"> = {
  "Pre-Listing": "info",
  Active: "info",
  Pending: "warn",
  Inspection: "warn",
  Appraisal: "gold",
  Financing: "gold",
  "Clear to Close": "success",
  Closed: "ink",
};

/* ── Brokerage Calendar + Risk Alerts ─────────────────────────────────────── */
type AlertRow = {
  id: string;
  tone: ChipTone;
  title: string;
  date: string;
  href: string;
  ownerSlug?: string;
  ownerName?: string;
  thumbSeed?: number;
};

function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

const RISK_ALERTS: AlertRow[] = [
  ...transactions
    .filter((t) => Boolean(t.riskFlag))
    .sort((a, b) => a.closeDateDaysOut - b.closeDateDaysOut)
    .map<AlertRow>((t) => ({
      id: t.id,
      tone: "danger",
      title: `${t.address.split(",")[0]} — ${t.riskFlag}`,
      date:
        t.closeDateDaysOut <= 1
          ? "Deadline tomorrow"
          : `Closes in ${t.closeDateDaysOut} days`,
      href: "/hub/transactions",
      ownerSlug: t.agentSlug,
      thumbSeed: seedFromId(t.id),
    })),
  {
    id: "appt-mitchell",
    tone: "info",
    title: "Listing consult — Sarah Mitchell (Beaverton)",
    date: "Today · 2:30 PM",
    href: "/hub/cash-offer",
    ownerSlug: "ava-brooks",
  },
  {
    id: "appt-cho",
    tone: "info",
    title: "Buyer showing tour — Daniel Cho (7 Beaverton homes)",
    date: "Tomorrow · 10:00 AM",
    href: "/hub/crm",
    ownerSlug: "ava-brooks",
  },
  {
    id: "broker-review",
    tone: "warn",
    title: "Broker review due — 1248 NW Cedar Hills Dr launch",
    date: "Today · before MLS input",
    href: "/hub/listing-launch",
    ownerSlug: "marcus-lee",
  },
];

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function TodayCommandCenter() {
  const router = useRouter();
  const { openAi } = useAiSidecar();

  const [activeTab, setActiveTab] = useState<string>("My Work");
  const [query, setQuery] = useState("");

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
    // AI-draft rows open straight to the draft tab; everything else previews.
    setDrawerTab(item.tab === "AI Drafts" ? "draft" : "preview");
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

  return (
    <div className="px-4 py-5 md:px-6 lg:px-8">
      {/* Subtitle eyebrow (TopCommandBar already renders the H1) */}
      <p className="text-[0.82rem] leading-snug text-slate">
        One prioritized queue across leads, listings, transactions, marketing, AI
        approvals, and system failures.
      </p>

      {/* ── KPI strip (6 tiles) — each drills to its real section ──────────── */}
      <KpiStrip className="mt-4">
        <KpiCard
          label="New leads"
          value={NEW_LEADS}
          icon={<UserPlus className="h-4 w-4" />}
          delta="+11 today"
          deltaTone="up"
          hint="Across IDX, Zillow & referrals"
          onDrill={() => router.push("/hub/crm")}
        />
        <KpiCard
          label="Hot seller signals"
          value={HOT_SELLER_SIGNALS}
          icon={<Home className="h-4 w-4" />}
          delta="4 new overnight"
          deltaTone="up"
          hint="Intent score 80+ this week"
          onDrill={() => router.push("/hub/cash-offer")}
        />
        <KpiCard
          label="Listing launches"
          value={LISTING_LAUNCHES}
          icon={<Building2 className="h-4 w-4" />}
          hint="2 launching this week"
          onDrill={() => router.push("/hub/listing-launch")}
        />
        <KpiCard
          label="Transactions at risk"
          value={TX_AT_RISK}
          valueTone="danger"
          icon={<TriangleAlert className="h-4 w-4" />}
          hint="Deadlines & financing flags"
          onDrill={() => router.push("/hub/transactions")}
        />
        <KpiCard
          label="AI drafts waiting"
          value={AI_DRAFTS_WAITING}
          icon={<MatinMark theme="dark" className="h-4 w-4" />}
          hint="Need your approval to send"
          onDrill={() => setActiveTab("AI Drafts")}
        />
        <KpiCard
          label="Workflow errors"
          value={WORKFLOW_ERRORS}
          valueTone="danger"
          icon={<ServerCrash className="h-4 w-4" />}
          hint="Retryable from the queue"
          onDrill={() => router.push("/hub/systems-health")}
        />
      </KpiStrip>

      {/* ── Work surface + right rail ─────────────────────────────────────── */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        {/* PRIMARY — Human Work Queue */}
        <section className="rounded-2xl border border-mist bg-cloud shadow-soft">
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
                  "Context: Today / Human Work Queue — prioritize my queue and explain what to do first",
                )
              }
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              <MatinMark theme="dark" className="h-3.5 w-3.5" />
              Ask AI to prioritize
            </button>
          </div>

          {/* Tabs + search */}
          <div className="flex flex-wrap items-center gap-3 px-5 pb-3 pt-3.5">
            <div className="min-w-0 flex-1">
              <SavedViewTabs views={VIEWS} active={activeTab} onChange={setActiveTab} />
            </div>
            <label className="inline-flex items-center gap-2 rounded-lg border border-mist bg-paper-200/60 px-2.5 py-1.5 focus-within:border-ink/30">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter queue…"
                aria-label="Filter the work queue by subject"
                className="w-32 bg-transparent text-[0.8rem] text-ink outline-none placeholder:text-slate sm:w-40"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear filter"
                  className="shrink-0 text-slate transition-colors hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </label>
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
                  onAction={() => (query ? setQuery("") : setActiveTab("My Work"))}
                />
              </div>
            ) : (
              <div role="list">
                {rows.map((item) => (
                  <QueueRow
                    key={item.id}
                    item={item}
                    resolved={Boolean(retried[item.id])}
                    onOpen={openRow}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT RAIL */}
        <div className="flex flex-col gap-5">
          {/* AI overnight summary — DARK callout */}
          <CalloutCard
            tone="ai"
            title="AI overnight summary"
            action={
              <button
                type="button"
                onClick={() => setActiveTab("AI Drafts")}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.78rem] font-semibold text-gold transition-colors hover:bg-ink-700"
              >
                Review drafts
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            }
          >
            <p>
              Grouped <span className="font-semibold text-cloud">181 lead events</span> into{" "}
              <span className="font-semibold text-cloud">22 priorities</span>, drafted{" "}
              <span className="font-semibold text-cloud">14 replies</span>, and flagged{" "}
              <span className="font-semibold text-danger">3 deals at risk</span> plus{" "}
              <span className="font-semibold text-danger">3 failed automations</span>. No
              client-facing message was sent — everything is held for your approval.
            </p>
            <p className="mt-2 text-slate-300/80">
              Top of the list: call Daniel Cho before his speed-to-lead window closes, and
              resolve the 8912 SE Hawthorne inspection deadline due tomorrow.
            </p>
          </CalloutCard>

          {/* Live Pipeline */}
          <section className="rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[1.05rem] font-normal leading-tight text-ink">
                Live Pipeline
              </h3>
              <Link
                href="/hub/reporting"
                className="inline-flex items-center gap-1 text-[0.76rem] font-semibold text-slate transition-colors hover:text-ink"
              >
                Full report
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
            <p className="mt-0.5 text-[0.78rem] text-slate">Open deal value across the funnel</p>
            <div className="mt-4 space-y-3.5">
              {PIPELINE.map((stage) => (
                <ProgressTrack
                  key={stage.stage}
                  label={`${stage.stage} · ${stage.deals} deals`}
                  value={(stage.value / PIPELINE_MAX) * 100}
                  tone={PIPELINE_TONE[stage.stage] ?? "info"}
                  valueRight={compactUsd(stage.value)}
                />
              ))}
            </div>
          </section>

          {/* Brokerage Calendar + Risk Alerts */}
          <section className="rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
            <h3 className="font-display text-[1.05rem] font-normal leading-tight text-ink">
              Brokerage Calendar + Risk Alerts
            </h3>
            <p className="mt-0.5 text-[0.78rem] text-slate">
              Deadlines inside 48 hours auto-surface here
            </p>
            <ul className="mt-3 divide-y divide-mist">
              {RISK_ALERTS.map((a) => (
                <li key={a.id}>
                  <Link
                    href={a.href}
                    className="group flex items-center gap-3 py-3 transition-colors hover:bg-paper-200/40"
                  >
                    {a.thumbSeed != null ? (
                      <span className="h-9 w-12 shrink-0 overflow-hidden rounded-md">
                        <PropertyThumb
                          seedIndex={a.thumbSeed}
                          ratio="video"
                          rounded={false}
                          alt={a.title}
                          className="h-full w-full"
                        />
                      </span>
                    ) : a.ownerSlug ? (
                      <Avatar name={a.ownerName ?? a.title} slug={a.ownerSlug} size={32} ring />
                    ) : (
                      <Dot tone={a.tone} className="mx-2" />
                    )}
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
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
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
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-[0.82rem] font-semibold text-ink transition-colors hover:bg-gold-bright disabled:cursor-default disabled:bg-gold/70"
                >
                  <MatinMark theme="dark" className="h-3.5 w-3.5" />
                  {drafting === selected.id
                    ? "Drafting…"
                    : drafts[selected.id]
                      ? "Regenerate"
                      : "Approve & draft"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAi(`Context: Today / ${selected.subject}`)}
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
            onAskAi={() => openAi(`Context: Today / ${selected.subject}`)}
          />
        ) : null}
      </RecordDrawer>
    </div>
  );
}
