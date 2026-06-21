"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  UserPlus,
  Home,
  Building2,
  TriangleAlert,
  ServerCrash,
  ArrowRight,
  Loader2,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { MatinMark } from "@/components/brand/Logo";
import {
  KpiStrip,
  KpiCard,
  SavedViewTabs,
  StatusChip,
  Dot,
  CalloutCard,
  ProgressTrack,
  RecordDrawer,
  AIActionCard,
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
import { cn, compactUsd } from "@/lib/utils";
import {
  CATEGORY_TONE,
  sourceHref,
  sourceLabel,
  dueTone,
} from "@/components/command/today/workQueueMeta";

/* ──────────────────────────────────────────────────────────────────────────
   Today Command Center  →  /hub   (build reference §2.1)

   The first screen of the demo: one prioritized queue across leads, listings,
   transactions, marketing, AI approvals, and system failures.

   Layout: subtitle eyebrow → 6-tile KPI strip → Human Work Queue (saved-view
   tabs + judgment-only rows → RecordDrawer) │ AI overnight summary (dark) +
   Live Pipeline bars + Brokerage Calendar & Risk Alerts.
   ────────────────────────────────────────────────────────────────────────── */

/* ── Headline KPI numbers (spec §2.1; counts reconcile to the data layer) ── */
const NEW_LEADS = 47;
const HOT_SELLER_SIGNALS = 12;
const LISTING_LAUNCHES = 8;
const TX_AT_RISK = transactions.filter((t) => Boolean(t.riskFlag)).length; // 3
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
};

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
    })),
  {
    id: "appt-mitchell",
    tone: "info",
    title: "Listing consult — Sarah Mitchell (Beaverton)",
    date: "Today · 2:30 PM",
    href: "/hub/seller-opportunities",
  },
  {
    id: "appt-cho",
    tone: "info",
    title: "Buyer showing tour — Daniel Cho (7 Beaverton homes)",
    date: "Tomorrow · 10:00 AM",
    href: "/hub/crm",
  },
  {
    id: "broker-review",
    tone: "warn",
    title: "Broker review due — 1248 NW Cedar Hills Dr launch",
    date: "Today · before MLS input",
    href: "/hub/listings",
  },
];

/* ── A single queue row ───────────────────────────────────────────────────── */
function QueueRow({
  item,
  onOpen,
}: {
  item: WorkQueueItem;
  onOpen: (item: WorkQueueItem) => void;
}) {
  const tone = CATEGORY_TONE[item.category];
  const dt = dueTone(item.dueLabel);
  const isAi = item.category === "Approve" || item.category === "Coach";
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="group flex w-full items-start gap-3 border-b border-mist px-5 py-3.5 text-left transition-colors last:border-0 hover:bg-paper-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink/20"
    >
      <span className="mt-0.5 shrink-0">
        <StatusChip tone={tone}>
          {isAi ? <MatinMark theme="dark" className="h-3 w-3" /> : <Dot tone={tone} />}
          {item.category}
        </StatusChip>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.9rem] font-semibold leading-tight text-ink">
          {item.subject}
        </span>
        <span className="mt-0.5 block text-[0.8rem] leading-snug text-slate line-clamp-2">
          {item.why}
        </span>
      </span>
      <span
        className={cn(
          "shrink-0 whitespace-nowrap pt-0.5 text-[0.74rem] font-medium tabular-nums",
          dt === "danger" ? "text-danger" : dt === "warn" ? "text-warn" : "text-slate",
        )}
      >
        {item.dueLabel}
      </span>
    </button>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function TodayCommandCenter() {
  const { openAi } = useAiSidecar();
  const [activeTab, setActiveTab] = useState<string>("My Work");

  const [selected, setSelected] = useState<WorkQueueItem | null>(null);
  const [drawerTab, setDrawerTab] = useState<"preview" | "draft">("preview");

  /* per-item AI draft state, keyed by work-queue id */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [drafting, setDrafting] = useState<string | null>(null);
  const [retried, setRetried] = useState<Record<string, boolean>>({});

  const rows = useMemo(
    () => workQueue.filter((w) => w.tab === activeTab),
    [activeTab],
  );

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
    setDrawerTab("preview");
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

  return (
    <div className="px-4 py-5 md:px-6 lg:px-8">
      {/* Subtitle eyebrow (TopCommandBar already renders the H1) */}
      <p className="text-[0.82rem] leading-snug text-slate">
        One prioritized queue across leads, listings, transactions, marketing, AI
        approvals, and system failures.
      </p>

      {/* ── KPI strip (6 tiles) ───────────────────────────────────────────── */}
      <KpiStrip className="mt-4">
        <KpiCard
          label="New leads"
          value={NEW_LEADS}
          icon={<UserPlus className="h-4 w-4" />}
          delta="+11 today"
          deltaTone="up"
          hint="Across IDX, Zillow & referrals"
          onDrill={() => setActiveTab("My Work")}
        />
        <KpiCard
          label="Hot seller signals"
          value={HOT_SELLER_SIGNALS}
          icon={<Home className="h-4 w-4" />}
          delta="4 new overnight"
          deltaTone="up"
          hint="Intent score 80+ this week"
          onDrill={() => setActiveTab("My Work")}
        />
        <KpiCard
          label="Listing launches"
          value={LISTING_LAUNCHES}
          icon={<Building2 className="h-4 w-4" />}
          hint="2 launching this week"
          onDrill={() => setActiveTab("My Work")}
        />
        <KpiCard
          label="Transactions at risk"
          value={TX_AT_RISK}
          valueTone="danger"
          icon={<TriangleAlert className="h-4 w-4" />}
          hint="Deadlines & financing flags"
          onDrill={() => setActiveTab("High Risk")}
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
          onDrill={() => setActiveTab("Failed Automations")}
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

          <div className="px-5 pb-3 pt-3.5">
            <SavedViewTabs views={VIEWS} active={activeTab} onChange={setActiveTab} />
          </div>

          <div className="border-t border-mist">
            {rows.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  title="Queue clear"
                  body="Nothing in this view needs human judgment right now. Automation is handling the rest — check back as new signals land."
                  actionLabel="View My Work"
                  onAction={() => setActiveTab("My Work")}
                />
              </div>
            ) : (
              <div role="list">
                {rows.map((item) => (
                  <QueueRow key={item.id} item={item} onOpen={openRow} />
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
                    className="group flex items-start gap-3 py-3 transition-colors hover:opacity-90"
                  >
                    <Dot tone={a.tone} className="mt-1.5" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.84rem] font-medium leading-snug text-ink">
                        {a.title}
                      </span>
                      <span className="mt-0.5 block text-[0.76rem] text-slate tabular-nums">
                        {a.date}
                      </span>
                    </span>
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate transition-transform group-hover:translate-x-0.5" />
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
        title={selected?.subject ?? ""}
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
                  disabled={retried[selected.id]}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-mist px-3 py-2 text-[0.82rem] font-medium text-ink transition-colors hover:bg-paper-200 disabled:opacity-50"
                >
                  {retried[selected.id] ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden />
                      Retrying
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                      Retry
                    </>
                  )}
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
          <div className="space-y-4">
            {/* Why this is in the queue */}
            <div>
              <p className="eyebrow text-slate">Why this is here</p>
              <p className="mt-1.5 text-[0.86rem] leading-relaxed text-ink">{selected.why}</p>
            </div>

            {/* Source provenance */}
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip tone={CATEGORY_TONE[selected.category]}>
                {selected.category}
              </StatusChip>
              <span className="text-[0.76rem] text-slate">
                Source:{" "}
                <span className="font-medium text-ink">
                  {sourceLabel(selected.sourceType)}
                </span>{" "}
                · {selected.sourceId}
              </span>
            </div>

            {/* Failed-automation step detail */}
            {failedRun ? (
              <div className="rounded-xl border border-mist bg-paper-200/50 p-3.5">
                <p className="eyebrow text-slate">Automation: {failedRun.name}</p>
                <p className="mt-1 text-[0.82rem] text-ink">
                  Failed at{" "}
                  <span className="font-semibold text-danger">{failedRun.failedStep}</span> ·
                  started {failedRun.startedLabel}
                </p>
                <ul className="mt-2.5 space-y-1.5">
                  {failedRun.steps.map((s, i) => {
                    const sTone: ChipTone =
                      s.status === "succeeded"
                        ? "success"
                        : s.status === "failed"
                          ? "danger"
                          : "info";
                    return (
                      <li key={i} className="flex items-start gap-2">
                        <Dot tone={sTone} className="mt-1.5" />
                        <span className="min-w-0 flex-1">
                          <span className="text-[0.8rem] font-medium text-ink">{s.name}</span>
                          <span className="block text-[0.74rem] text-slate">{s.detail}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {/* Preview vs AI draft */}
            {linkedAction && drawerTab === "draft" ? (
              <div className="space-y-3">
                <AIActionCard
                  title={linkedAction.title}
                  riskTag={linkedAction.riskTag}
                  evidence={linkedAction.evidence}
                  confidence={linkedAction.confidence}
                  runLabel={drafting === selected.id ? "Drafting…" : "Generate draft"}
                  onRun={() => runDraft(selected, linkedAction)}
                  onEdit={() => openAi(`Context: Today / ${selected.subject}`)}
                  onReject={() => setDrafts((d) => ({ ...d, [selected.id]: "" }))}
                />
                {drafting === selected.id && !drafts[selected.id] ? (
                  <div className="flex items-center gap-2 text-[0.82rem] text-slate">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    Matin AI is drafting from the source record…
                  </div>
                ) : drafts[selected.id] ? (
                  <div className="rounded-xl border border-mist bg-paper-200/40 p-3.5">
                    <p className="eyebrow text-slate">Draft — review before sending</p>
                    <p className="mt-2 whitespace-pre-wrap text-[0.84rem] leading-relaxed text-ink">
                      {drafts[selected.id]}
                    </p>
                  </div>
                ) : (
                  <p className="text-[0.8rem] leading-relaxed text-slate">
                    Generate an editable draft from the cited evidence above. Nothing sends
                    until you approve it.
                  </p>
                )}
              </div>
            ) : linkedAction ? (
              <div className="rounded-xl border border-mist bg-paper-200/40 p-3.5">
                <p className="text-[0.82rem] leading-relaxed text-slate">
                  <span className="font-semibold text-ink">{linkedAction.evidence}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setDrawerTab("draft")}
                  className="mt-3 inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-ink transition-colors hover:opacity-80"
                >
                  <MatinMark theme="dark" className="h-3.5 w-3.5" />
                  Open AI draft
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </RecordDrawer>
    </div>
  );
}
