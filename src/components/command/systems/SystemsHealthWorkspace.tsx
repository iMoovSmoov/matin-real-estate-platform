"use client";

import { useMemo, useState } from "react";
import {
  Plug,
  Workflow,
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Database,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";
import {
  KpiStrip,
  KpiCard,
  StatusChip,
  Dot,
  DataTable,
  RecordDrawer,
  CalloutCard,
  AIInsightChip,
  useAiSidecar,
  type Column,
  type ChipTone,
} from "@/components/os";
import { streamAi } from "@/lib/ai/client";
import type {
  Integration,
  WorkflowRun,
  WorkflowStep,
  DataQualityIssue,
  Automation,
  IntegrationHealth,
  DataQualitySeverity,
} from "@/lib/types";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Systems Health / Admin Setup — operator workspace (ref §2.11)

   "Hide technical plumbing from normal users, but make it inspectable for the
   builder/operator — the part most demos miss."

   Left ~58%  : Integrations status grid · Data-quality rules · Workflow Runs
   Right ~38% : Admin detail panel — the "New Seller Lead" automation broken
                down step-by-step, with "Explain failure" wired to streamAi.
   ────────────────────────────────────────────────────────────────────────── */

const HEALTH_TONE: Record<IntegrationHealth, ChipTone> = {
  Healthy: "success",
  "Needs auth": "warn",
  Failing: "danger",
};

const SEVERITY_TONE: Record<DataQualitySeverity, ChipTone> = {
  high: "danger",
  med: "warn",
  low: "info",
};

const RUN_STATUS: Record<
  WorkflowRun["status"],
  { tone: ChipTone; label: string }
> = {
  succeeded: { tone: "success", label: "Succeeded" },
  running: { tone: "info", label: "Running" },
  waiting_for_approval: { tone: "warn", label: "Awaiting approval" },
  failed: { tone: "danger", label: "Failed" },
};

const STEP_TONE: Record<WorkflowStep["status"], ChipTone> = {
  succeeded: "success",
  running: "info",
  waiting: "info",
  failed: "danger",
};

const STEP_LABEL: Record<WorkflowStep["status"], string> = {
  succeeded: "Done",
  running: "Running",
  waiting: "Queued",
  failed: "Failed",
};

/* The "New Seller Lead" admin breakdown — the automation an operator inspects.
   Each stage maps a label → plain-English value (matches the data spec). */
const SELLER_LEAD_STAGES: { label: string; value: string }[] = [
  { label: "Trigger", value: "Website home-value submit" },
  { label: "Enrich", value: "Property + owner + equity" },
  { label: "Score", value: "Seller intent > 80" },
  { label: "Create", value: "CRM person + seller opportunity" },
  { label: "Route", value: "Best agent by area + load" },
  { label: "AI draft", value: "Text + email + task notes" },
  { label: "Log", value: "Audit trail + report metrics" },
];

function fmtRecords(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US");
}

export function SystemsHealthWorkspace({
  integrations,
  workflowRuns,
  dataQualityIssues,
  automations,
}: {
  integrations: Integration[];
  workflowRuns: WorkflowRun[];
  dataQualityIssues: DataQualityIssue[];
  automations: Automation[];
}) {
  const { openAi } = useAiSidecar();

  // Row-click → run inspection drawer (trigger → steps → status)
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const activeRun = workflowRuns.find((r) => r.id === activeRunId) ?? null;

  // Locally-tracked retries (optimistic UI for a reversible action)
  const [retrying, setRetrying] = useState<Set<string>>(new Set());

  // "Explain failure" AI stream (admin panel) — wired to streamAi
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string>("");

  // ── KPI math (numbers reconcile to the underlying rows) ──────────────────
  const connected = integrations.filter((i) => i.status === "Healthy").length;
  const needsAttention = integrations.filter((i) => i.status !== "Healthy").length;
  const automationsRunning = automations.filter((a) => a.status === "active").length;
  const webhookErrors = integrations.reduce((s, i) => s + (i.errors ?? 0), 0);
  const dqFlags = dataQualityIssues.reduce((s, d) => s + d.count, 0);

  // Sort: trouble first (Failing → Needs auth → Healthy), so problems surface.
  const sortedIntegrations = useMemo(() => {
    const order: Record<IntegrationHealth, number> = {
      Failing: 0,
      "Needs auth": 1,
      Healthy: 2,
    };
    return [...integrations].sort(
      (a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name),
    );
  }, [integrations]);

  // Failed runs float to the top of the timeline so they are never hidden.
  const orderedRuns = useMemo(() => {
    const rank: Record<WorkflowRun["status"], number> = {
      failed: 0,
      waiting_for_approval: 1,
      running: 2,
      succeeded: 3,
    };
    return [...workflowRuns].sort((a, b) => rank[a.status] - rank[b.status]);
  }, [workflowRuns]);

  const failedRuns = workflowRuns.filter((r) => r.status === "failed");

  function retryRun(id: string) {
    setRetrying((prev) => new Set(prev).add(id));
    // reversible action → optimistic; clears the spinner after the queue accepts
    window.setTimeout(() => {
      setRetrying((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2200);
  }

  async function explainFailure() {
    setExplaining(true);
    setExplanation("");
    const focus = failedRuns[0];
    const prompt = focus
      ? `A workflow automation in our brokerage platform just failed. Run "${focus.name}" for "${focus.subject}" failed at step "${focus.failedStep}". The step detail was: "${
          focus.steps.find((s) => s.status === "failed")?.detail ?? ""
        }". In 3 short sentences, explain to an operator what broke, the most likely root cause, and the single fix to try first. Be concrete and non-technical.`
      : `Explain why a CRM field-mapping automation would fail when an external field has no internal mapping, and the one fix to try first. Keep it under 3 sentences.`;
    try {
      await streamAi(
        { tool: "integration_setup_guide", messages: [{ role: "user", content: prompt }] },
        (_chunk, full) => setExplanation(full),
      );
    } finally {
      setExplaining(false);
    }
  }

  // ── Integrations table columns ───────────────────────────────────────────
  const integrationColumns: Column<Integration>[] = [
    {
      key: "name",
      header: "System",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-paper-200 text-[0.62rem] font-bold uppercase leading-none text-slate ring-1 ring-inset ring-mist">
            {row.name.slice(0, 2)}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[0.84rem] font-semibold leading-tight text-ink">
              {row.name}
            </div>
            <div className="truncate text-[0.72rem] leading-tight text-slate">
              {row.category}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "provider",
      header: "Provider",
      render: (row) => (
        <span className="text-[0.8rem] text-slate">{row.provider ?? row.name}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => (
        <StatusChip tone={HEALTH_TONE[row.status]}>
          <Dot tone={HEALTH_TONE[row.status]} />
          {row.status}
        </StatusChip>
      ),
    },
    {
      key: "records",
      header: "Records",
      align: "right",
      sortable: true,
      render: (row) => (
        <span className="text-[0.82rem] tabular-nums text-slate">
          {fmtRecords(row.recordsSynced ?? row.records)}
        </span>
      ),
    },
    {
      key: "lastSync",
      header: "Sync",
      render: (row) => {
        const bad = row.status !== "Healthy";
        return (
          <span
            className={cn(
              "text-[0.8rem] tabular-nums",
              bad ? "text-danger" : "text-slate",
            )}
          >
            {row.lastSync ?? "—"}
          </span>
        );
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.62fr_1fr]">
      {/* ════════════════ LEFT COLUMN — the plumbing, inspectable ════════════ */}
      <div className="min-w-0 space-y-5">
        {/* KPI strip */}
        <KpiStrip className="xl:grid-cols-5">
          <KpiCard
            label="Integrations connected"
            value={connected}
            icon={<Plug className="h-3.5 w-3.5" />}
            delta={`${needsAttention} need attention`}
            deltaTone={needsAttention > 0 ? "down" : "flat"}
            hint={`of ${integrations.length} connectors`}
            onDrill={() => openAi("Systems Health / Integration health")}
          />
          <KpiCard
            label="Automations running"
            value={automationsRunning}
            icon={<Workflow className="h-3.5 w-3.5" />}
            hint={`${automations.length - automationsRunning} paused`}
            onDrill={() => openAi("Systems Health / Automations")}
          />
          <KpiCard
            label="Webhook errors"
            value={webhookErrors}
            valueTone={webhookErrors > 0 ? "danger" : "ink"}
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            delta={`${failedRuns.length} failed runs`}
            deltaTone={webhookErrors > 0 ? "down" : "flat"}
            hint="across all connectors"
            onDrill={() =>
              setActiveRunId(failedRuns[0]?.id ?? orderedRuns[0]?.id ?? null)
            }
          />
          <KpiCard
            label="Data-quality flags"
            value={dqFlags}
            valueTone={dqFlags > 0 ? "danger" : "ink"}
            icon={<ShieldAlert className="h-3.5 w-3.5" />}
            hint={`${dataQualityIssues.length} rule types`}
            onDrill={() => openAi("Systems Health / Data quality")}
          />
          <KpiCard
            label="Last sync"
            value="2 min"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            hint="MatinRealEstate.com IDX"
          />
        </KpiStrip>

        {/* Integrations status grid */}
        <section className="space-y-3">
          <header className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-[1.12rem] font-normal leading-tight text-ink">
                Integrations status
              </h2>
              <p className="mt-0.5 text-[0.78rem] text-slate">
                Every external system behind MatinOS — connection, owner of the
                data, and last sync. Trouble surfaces first.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[0.78rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
            >
              <Plug className="h-3.5 w-3.5" />
              Connect system
            </button>
          </header>

          <DataTable<Integration>
            columns={integrationColumns}
            rows={sortedIntegrations}
            getRowId={(r) => r.name}
            onRowClick={(r) =>
              openAi(`Systems Health / ${r.name} — ${r.status}`)
            }
            utilityRight={
              <span className="inline-flex items-center gap-3 text-[0.74rem] tabular-nums">
                <span className="inline-flex items-center gap-1.5 text-success">
                  <Dot tone="success" /> {connected} healthy
                </span>
                <span className="inline-flex items-center gap-1.5 text-warn">
                  <Dot tone="warn" />{" "}
                  {integrations.filter((i) => i.status === "Needs auth").length} needs auth
                </span>
                <span className="inline-flex items-center gap-1.5 text-danger">
                  <Dot tone="danger" />{" "}
                  {integrations.filter((i) => i.status === "Failing").length} failing
                </span>
              </span>
            }
          />
        </section>

        {/* Data quality rules */}
        <section className="space-y-3">
          <header>
            <h2 className="font-display text-[1.12rem] font-normal leading-tight text-ink">
              Data quality rules
            </h2>
            <p className="mt-0.5 text-[0.78rem] text-slate">
              Continuous checks across imported records — each flag is a queued
              fix, not a silent error.
            </p>
          </header>

          <div className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
            {dataQualityIssues.map((dq, i) => (
              <div
                key={dq.id}
                className={cn(
                  "flex items-center justify-between gap-4 px-4 py-3",
                  i !== dataQualityIssues.length - 1 && "border-b border-mist/70",
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Dot tone={SEVERITY_TONE[dq.severity]} />
                  <div className="min-w-0">
                    <div className="truncate text-[0.84rem] font-medium text-ink">
                      {dq.issue}
                    </div>
                    <div className="truncate text-[0.74rem] text-slate">
                      Source <span className="font-semibold text-ink">{dq.source}</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusChip tone={SEVERITY_TONE[dq.severity]}>
                    {dq.count.toLocaleString("en-US")} flagged
                  </StatusChip>
                  <button
                    type="button"
                    onClick={() => openAi(`Systems Health / Data quality — ${dq.issue}`)}
                    className="rounded-lg border border-mist bg-cloud px-2.5 py-1 text-[0.74rem] font-medium text-slate transition-colors hover:text-ink"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow Runs */}
        <section className="space-y-3">
          <header className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-[1.12rem] font-normal leading-tight text-ink">
                Workflow runs
              </h2>
              <p className="mt-0.5 text-[0.78rem] text-slate">
                Every automation run is inspectable. Failures are surfaced here
                and in Today — and they are retryable.
              </p>
            </div>
            {failedRuns.length > 0 ? (
              <StatusChip tone="danger" variant="soft">
                <Dot tone="danger" />
                {failedRuns.length} failed
              </StatusChip>
            ) : null}
          </header>

          <div className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
            {orderedRuns.map((run, i) => {
              const meta = RUN_STATUS[run.status];
              const isFailed = run.status === "failed";
              const isRetrying = retrying.has(run.id);
              return (
                <div
                  key={run.id}
                  className={cn(
                    "px-4 py-3.5 transition-colors hover:bg-paper",
                    i !== orderedRuns.length - 1 && "border-b border-mist/70",
                    isFailed && "bg-danger/[0.035]",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveRunId(run.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Dot tone={meta.tone} />
                        <span className="truncate text-[0.85rem] font-semibold text-ink">
                          {run.name}
                        </span>
                        <span className="shrink-0 font-mono text-[0.68rem] text-slate">
                          {run.id}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate pl-4 text-[0.76rem] text-slate">
                        {run.subject} · started {run.startedLabel}
                      </div>
                      {/* compact step trail */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 pl-4">
                        {run.steps.map((step, si) => (
                          <span key={step.name} className="inline-flex items-center gap-1.5">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.68rem] font-medium ring-1 ring-inset",
                                step.status === "failed" &&
                                  "bg-danger/10 text-danger ring-danger/25",
                                step.status === "succeeded" &&
                                  "bg-success/10 text-success ring-success/20",
                                step.status === "running" &&
                                  "bg-info/10 text-info ring-info/25",
                                step.status === "waiting" &&
                                  "bg-paper-200 text-slate ring-mist",
                              )}
                            >
                              {step.name}
                            </span>
                            {si !== run.steps.length - 1 ? (
                              <ArrowRight className="h-3 w-3 text-slate/40" />
                            ) : null}
                          </span>
                        ))}
                      </div>
                      {isFailed && run.failedStep ? (
                        <p className="mt-2 pl-4 text-[0.74rem] font-medium text-danger">
                          Failed at: {run.failedStep}
                        </p>
                      ) : null}
                    </button>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <StatusChip tone={meta.tone}>{meta.label}</StatusChip>
                      {isFailed ? (
                        <button
                          type="button"
                          onClick={() => retryRun(run.id)}
                          disabled={isRetrying}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-2.5 py-1.5 text-[0.74rem] font-semibold text-cloud transition-colors hover:bg-ink-800 disabled:opacity-60"
                        >
                          {isRetrying ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          {isRetrying ? "Retrying…" : "Retry"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ════════════════ RIGHT COLUMN — admin detail panel ══════════════════ */}
      <div className="min-w-0 space-y-5">
        {/* Selected automation breakdown — "New Seller Lead" */}
        <section className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
          <div className="border-b border-mist px-5 py-4">
            <p className="eyebrow text-[0.66rem] text-slate">Admin detail panel</p>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <h2 className="font-display text-[1.12rem] font-normal leading-tight text-ink">
                New Seller Lead
              </h2>
              <StatusChip tone="success">
                <Dot tone="success" />
                Active
              </StatusChip>
            </div>
            <p className="mt-1 text-[0.76rem] text-slate">
              What the operator sees, hidden from the agent: the exact chain a
              home-value submit triggers — end to end.
            </p>
          </div>

          <dl className="divide-y divide-mist/70">
            {SELLER_LEAD_STAGES.map((stage, i) => (
              <div
                key={stage.label}
                className="flex items-center gap-4 px-5 py-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper-200 text-[0.68rem] font-bold tabular-nums text-slate ring-1 ring-inset ring-mist">
                  {i + 1}
                </span>
                <dt className="w-[5.5rem] shrink-0 text-[0.78rem] font-semibold text-ink">
                  {stage.label}
                </dt>
                <dd className="min-w-0 flex-1 text-[0.82rem] text-slate">
                  {stage.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-mist px-5 py-3.5">
            <AIInsightChip icon={<Sparkles className="h-3 w-3" />}>
              Every run writes to workflow_runs, ai_actions &amp; audit_logs
            </AIInsightChip>
          </div>
        </section>

        {/* Backend record joins — the transparency note */}
        <section className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
          <div className="flex items-center gap-2 border-b border-mist px-5 py-3">
            <Database className="h-3.5 w-3.5 text-slate" />
            <p className="eyebrow text-[0.66rem] text-slate">Backend record joins</p>
          </div>
          <div className="px-5 py-3.5">
            <code className="block break-words font-mono text-[0.74rem] leading-relaxed text-ink">
              contacts &gt; ownership_signals &gt; valuations &gt;
              seller_opportunities &gt; tasks &gt; ai_actions
            </code>
            <p className="mt-2 text-[0.74rem] text-slate">
              Stored with external IDs so any run can be replayed or debugged.
            </p>
          </div>
        </section>

        {/* AI: Explain failure — DARK callout, wired to streamAi */}
        <CalloutCard
          tone="risk"
          title={
            failedRuns[0]
              ? `Failing: ${failedRuns[0].name}`
              : "Automation health"
          }
          action={
            <button
              type="button"
              onClick={explainFailure}
              disabled={explaining}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-1.5 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-gold-bright disabled:opacity-60"
            >
              {explaining ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {explaining ? "Analyzing…" : "Explain failure"}
            </button>
          }
        >
          {explanation ? (
            <p className="whitespace-pre-wrap leading-relaxed">{explanation}</p>
          ) : failedRuns[0] ? (
            <p>
              Run{" "}
              <span className="font-mono text-[0.78rem] text-cloud">
                {failedRuns[0].id}
              </span>{" "}
              ({failedRuns[0].subject}) failed at{" "}
              <span className="font-semibold text-cloud">
                {failedRuns[0].failedStep}
              </span>
              . Ask Matin AI to explain what broke and the first fix to try.
            </p>
          ) : (
            <p>
              All automations are running clean. Ask Matin AI to summarize
              integration health and surface anything trending toward failure.
            </p>
          )}
        </CalloutCard>

        {/* Usage / quota card — Structurely-style */}
        <section className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
          <div className="border-b border-mist px-5 py-3">
            <p className="eyebrow text-[0.66rem] text-slate">AI usage · this month</p>
          </div>
          <div className="space-y-4 px-5 py-4">
            {[
              { label: "Anthropic Claude", used: 184_200, cap: 250_000, tone: "success" as ChipTone },
              { label: "OpenAI GPT", used: 96_400, cap: 150_000, tone: "success" as ChipTone },
              { label: "Twilio SMS", used: 38_400, cap: 40_000, tone: "warn" as ChipTone },
            ].map((q) => {
              const pct = Math.round((q.used / q.cap) * 100);
              return (
                <div key={q.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-[0.8rem] font-medium text-ink">{q.label}</span>
                    <span className="text-[0.76rem] tabular-nums text-slate">
                      {q.used.toLocaleString("en-US")} / {q.cap.toLocaleString("en-US")}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-200">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        q.tone === "warn" ? "bg-warn" : "bg-success",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── Workflow-run inspection drawer (trigger → steps → logs → retry) ── */}
      <RecordDrawer
        open={activeRun != null}
        onClose={() => setActiveRunId(null)}
        title={activeRun?.name ?? "Workflow run"}
        subtitle={
          activeRun
            ? `${activeRun.id} · ${activeRun.subject} · ${activeRun.startedLabel}`
            : undefined
        }
        actions={
          activeRun ? (
            <RunDrawerActions
              run={activeRun}
              retrying={retrying.has(activeRun.id)}
              onRetry={() => retryRun(activeRun.id)}
              onExplain={() => openAi(`Systems Health / ${activeRun.name} — ${activeRun.id}`)}
            />
          ) : undefined
        }
      >
        {activeRun ? <RunDrawerBody run={activeRun} /> : null}
      </RecordDrawer>
    </div>
  );
}

/* ── Drawer body: trigger + per-step run log ──────────────────────────────── */
function RunDrawerBody({ run }: { run: WorkflowRun }) {
  const meta = RUN_STATUS[run.status];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-[0.64rem] text-slate">Trigger</p>
          <p className="mt-1 text-[0.86rem] font-semibold text-ink">{run.name}</p>
        </div>
        <StatusChip tone={meta.tone}>{meta.label}</StatusChip>
      </div>

      {run.status === "failed" && run.failedStep ? (
        <div className="rounded-xl border border-danger/25 bg-danger/[0.06] px-3.5 py-2.5">
          <p className="text-[0.78rem] font-semibold text-danger">
            Failed at: {run.failedStep}
          </p>
        </div>
      ) : null}

      <div>
        <p className="eyebrow mb-2 text-[0.64rem] text-slate">Step log</p>
        <ol className="relative space-y-3 border-l border-mist pl-5">
          {run.steps.map((step) => (
            <li key={step.name} className="relative">
              <span
                className={cn(
                  "absolute -left-[1.46rem] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-2 ring-cloud",
                  step.status === "succeeded" && "bg-success",
                  step.status === "running" && "bg-info",
                  step.status === "waiting" && "bg-paper-200 ring-mist",
                  step.status === "failed" && "bg-danger",
                )}
              >
                {step.status === "succeeded" ? (
                  <Check className="h-2 w-2 text-cloud" />
                ) : null}
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.82rem] font-medium text-ink">{step.name}</span>
                <StatusChip tone={STEP_TONE[step.status]}>
                  {STEP_LABEL[step.status]}
                </StatusChip>
              </div>
              <p className="mt-0.5 text-[0.76rem] leading-snug text-slate">
                {step.detail}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function RunDrawerActions({
  run,
  retrying,
  onRetry,
  onExplain,
}: {
  run: WorkflowRun;
  retrying: boolean;
  onRetry: () => void;
  onExplain: () => void;
}) {
  return (
    <>
      {run.status === "failed" ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-[0.8rem] font-semibold text-cloud transition-colors hover:bg-ink-800 disabled:opacity-60"
        >
          {retrying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )}
          {retrying ? "Retrying…" : "Retry run"}
        </button>
      ) : null}
      <button
        type="button"
        onClick={onExplain}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-[0.8rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Ask AI
      </button>
    </>
  );
}
