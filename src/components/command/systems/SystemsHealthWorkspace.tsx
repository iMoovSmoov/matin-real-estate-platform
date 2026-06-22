"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plug,
  Workflow,
  TriangleAlert,
  ShieldAlert,
  RefreshCw,
  RotateCcw,
  Loader2,
  ArrowRight,
  CircleCheck,
} from "lucide-react";
import {
  KpiStrip,
  KpiCard,
  StatusChip,
  Dot,
  DataTable,
  AiPanel,
  Avatar,
  EmptyState,
  Skeleton,
  type Column,
  type AIAction,
} from "@/components/os";
import type { ReactNode } from "react";
import { MatinMark } from "@/components/brand/Logo";
import { streamAi } from "@/lib/ai/client";
import type {
  Integration,
  WorkflowRun,
  DataQualityIssue,
  Automation,
  IntegrationHealth,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import company from "@/lib/data/company.json";
import { KPI_SPARKS, sparkDelta } from "@/lib/data/systems-series";
import {
  HEALTH_TONE,
  SEVERITY_TONE,
  RUN_STATUS,
  RUN_OWNER,
  fmtRecords,
  applyRetry,
} from "./systemsModel";
import { VendorMark } from "./VendorMark";
import { SystemsDiagram } from "./SystemsDiagram";
import { SyncActivityChart } from "./SyncActivityChart";
import { WorkflowRunDrawer } from "./WorkflowRunDrawer";
import { IntegrationDrawer, type ProbeState } from "./IntegrationDrawer";
import { DataQualityDrawer } from "./DataQualityDrawer";
import { AutomationBreakdown } from "./AutomationBreakdown";

/* ──────────────────────────────────────────────────────────────────────────
   Systems Health / Admin Setup — operator workspace (ref §2.11)

   "Hide technical plumbing from normal users, but make it inspectable for the
   builder/operator — the part most demos miss."

   EVERY click does its real job:
     • Integration row  → IntegrationDrawer (Test connection / Reauthorize that
                          MUTATE status in state with inline confirmation).
     • Workflow run row → WorkflowRunDrawer (Retry flips failed→running→
                          succeeded; "Explain failure" streams AI inline).
     • Data-quality row → DataQualityDrawer (Queue auto-fix drops the flag count;
                          "Draft fix plan" streams AI inline).
     • Automation list  → selectable; loads its steps on the right; paused →
                          AI restart plan streams inline.
   The DARK AiPanel ("Ask Matin") is the ONLY surface that talks to streamAi for
   ad-hoc questions; the global sidecar is never opened from a generic row.
   ────────────────────────────────────────────────────────────────────────── */

export function SystemsHealthWorkspace({
  integrations: initialIntegrations,
  workflowRuns: initialRuns,
  dataQualityIssues,
  automations: initialAutomations,
}: {
  integrations: Integration[];
  workflowRuns: WorkflowRun[];
  dataQualityIssues: DataQualityIssue[];
  automations: Automation[];
}) {
  // ── Skeleton on first mount (layout-preserving) ──────────────────────────
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 360);
    return () => window.clearTimeout(t);
  }, []);

  // ── Live mutable copies (real state — actions write here) ────────────────
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [runs, setRuns] = useState<WorkflowRun[]>(initialRuns);
  const [automations, setAutomations] = useState<Automation[]>(initialAutomations);
  // remaining flag count per data-quality rule (drops to 0 after auto-fix)
  const [dqRemaining, setDqRemaining] = useState<Record<string, number>>(() =>
    Object.fromEntries(dataQualityIssues.map((d) => [d.id, d.count])),
  );
  const [dqFixed, setDqFixed] = useState<Set<string>>(new Set());

  // ── Drawer selections ────────────────────────────────────────────────────
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeIntegrationName, setActiveIntegrationName] = useState<string | null>(null);
  const [activeDqId, setActiveDqId] = useState<string | null>(null);

  const activeRun = runs.find((r) => r.id === activeRunId) ?? null;
  const activeIntegration =
    integrations.find((i) => i.name === activeIntegrationName) ?? null;
  const activeDq = dataQualityIssues.find((d) => d.id === activeDqId) ?? null;

  // ── Per-action async state ───────────────────────────────────────────────
  const [retrying, setRetrying] = useState<Set<string>>(new Set());
  const [probe, setProbe] = useState<ProbeState>({ phase: "idle" });
  const [explainState, setExplainState] = useState<{ running: boolean; text: string }>({
    running: false,
    text: "",
  });
  const [dqDraft, setDqDraft] = useState<{ running: boolean; text: string; fixing: boolean }>({
    running: false,
    text: "",
    fixing: false,
  });

  // Automation breakdown
  const [selectedAutomationId, setSelectedAutomationId] = useState<string>(
    initialAutomations[0]?.id ?? "",
  );
  const [diagnoseState, setDiagnoseState] = useState<{ running: boolean; text: string }>({
    running: false,
    text: "",
  });

  // Ask Matin panel (the ONLY explicit global-AI affordance). Structurally
  // matches AiPanel's AiActionState ({ running?, result? }) without importing it
  // (the type isn't re-exported from the os barrel).
  const [askState, setAskState] = useState<
    Record<string, { running?: boolean; result?: ReactNode }>
  >({});

  // ── Derived KPI math (reconciles to the rows) ────────────────────────────
  const connected = integrations.filter((i) => i.status === "Healthy").length;
  const needsAttention = integrations.filter((i) => i.status !== "Healthy").length;
  const automationsRunning = automations.filter((a) => a.status === "active").length;
  const webhookErrors = integrations.reduce((s, i) => s + (i.errors ?? 0), 0);
  const dqFlags = Object.values(dqRemaining).reduce((s, n) => s + n, 0);
  const maxDqCount = Math.max(1, ...dataQualityIssues.map((d) => d.count));
  const failedRuns = runs.filter((r) => r.status === "failed");

  // Derive "last sync" from the freshest connector's lastSync (§2.11 ticket 4)
  // — the smallest "N min ago" among healthy connectors, not a hardcoded "2 min".
  const freshest = useMemo(() => {
    const parse = (s?: string): number => {
      if (!s) return Number.POSITIVE_INFINITY;
      const m = s.match(/(\d+)\s*min/i);
      if (m) return Number(m[1]);
      if (/live/i.test(s) || /just now/i.test(s)) return 0;
      const h = s.match(/(\d+)\s*hr/i);
      if (h) return Number(h[1]) * 60;
      return Number.POSITIVE_INFINITY;
    };
    let best: { name: string; mins: number; label: string } | null = null;
    for (const i of integrations) {
      if (i.status !== "Healthy") continue;
      const mins = parse(i.lastSync);
      if (!best || mins < best.mins) best = { name: i.name, mins, label: i.lastSync ?? "Live" };
    }
    return best;
  }, [integrations]);

  const lastSyncValue = freshest
    ? freshest.mins === 0
      ? "Live"
      : `${freshest.mins} min`
    : "—";

  // KPI trend deltas from the sparkline series (§2.11 ticket 4)
  const connDelta = sparkDelta(KPI_SPARKS.connected);
  const autoDelta = sparkDelta(KPI_SPARKS.automations);
  const errDelta = sparkDelta(KPI_SPARKS.errors);
  const dqDelta = sparkDelta(KPI_SPARKS.dataQuality);

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

  const orderedRuns = useMemo(() => {
    const rank: Record<WorkflowRun["status"], number> = {
      failed: 0,
      waiting_for_approval: 1,
      running: 2,
      succeeded: 3,
    };
    return [...runs].sort((a, b) => rank[a.status] - rank[b.status]);
  }, [runs]);

  // ── Actions: Retry a failed run (failed → running → succeeded) ────────────
  function retryRun(id: string) {
    setRetrying((prev) => new Set(prev).add(id));
    // flip to running immediately so the inspector reflects the re-run
    setRuns((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "running" } : r)),
    );
    window.setTimeout(() => {
      setRuns((prev) => prev.map((r) => (r.id === id ? applyRetry({ ...r, status: "failed" }) : r)));
      setRetrying((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 1600);
  }

  // ── Actions: Integration Test / Reauthorize (mutate status) ──────────────
  function testConnection() {
    if (!activeIntegration) return;
    setProbe({ phase: "testing" });
    window.setTimeout(() => {
      const ok = activeIntegration.status === "Healthy";
      setProbe({
        phase: "done",
        message: ok
          ? `Connection live · ${fmtRecords(activeIntegration.recordsSynced ?? activeIntegration.records)} records reachable · responded in 240 ms.`
          : `Reached endpoint but auth is rejected (HTTP 401). Reauthorize to restore sync.`,
      });
    }, 1300);
  }

  function reauthorize() {
    if (!activeIntegration) return;
    setProbe({ phase: "reauth" });
    window.setTimeout(() => {
      const name = activeIntegration.name;
      setIntegrations((prev) =>
        prev.map((i) =>
          i.name === name
            ? { ...i, status: "Healthy", errors: 0, lastSync: "just now" }
            : i,
        ),
      );
      setProbe({
        phase: "done",
        message: `Reauthorized ${name}. Token refreshed, two-way sync restored — backfilling now.`,
      });
    }, 1500);
  }

  // ── Actions: Explain failure (stream into the run drawer) ─────────────────
  async function explainFailure() {
    if (!activeRun) return;
    setExplainState({ running: true, text: "" });
    const failedDetail = activeRun.steps.find((s) => s.status === "failed")?.detail ?? "";
    const prompt = `A workflow automation in our brokerage platform failed. Run "${activeRun.name}" for "${activeRun.subject}" failed at step "${activeRun.failedStep}". Step detail: "${failedDetail}". In 3 short sentences, explain to an operator what broke, the most likely root cause, and the single first fix to try. Be concrete and plain-English.`;
    try {
      await streamAi(
        { tool: "integration_setup_guide", messages: [{ role: "user", content: prompt }] },
        (_c, full) => setExplainState({ running: true, text: full }),
      );
    } finally {
      setExplainState((s) => ({ running: false, text: s.text }));
    }
  }

  // ── Actions: Data-quality auto-fix + draft plan ──────────────────────────
  function queueDqFix() {
    if (!activeDq) return;
    const id = activeDq.id;
    setDqDraft((s) => ({ ...s, fixing: true }));
    window.setTimeout(() => {
      setDqRemaining((prev) => ({ ...prev, [id]: 0 }));
      setDqFixed((prev) => new Set(prev).add(id));
      setDqDraft((s) => ({ ...s, fixing: false }));
    }, 1300);
  }

  async function draftDqPlan() {
    if (!activeDq) return;
    setDqDraft((s) => ({ ...s, running: true, text: "" }));
    const prompt = `Our brokerage CRM has a data-quality rule flagging ${activeDq.count} records: "${activeDq.issue}" from source ${activeDq.source}. In 3 short sentences, give the operator a concrete remediation plan: what mapping or normalization to apply, and how to prevent it recurring. Plain English.`;
    try {
      await streamAi(
        { tool: "integration_setup_guide", messages: [{ role: "user", content: prompt }] },
        (_c, full) => setDqDraft((s) => ({ ...s, text: full })),
      );
    } finally {
      setDqDraft((s) => ({ ...s, running: false }));
    }
  }

  // ── Actions: Automation toggle + diagnose ────────────────────────────────
  function toggleAutomation(id: string) {
    setAutomations((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === "active" ? "paused" : "active" }
          : a,
      ),
    );
  }

  async function diagnoseAutomation() {
    const a = automations.find((x) => x.id === selectedAutomationId);
    if (!a) return;
    setDiagnoseState({ running: true, text: "" });
    const prompt = `Our brokerage automation "${a.name}" (trigger: ${a.trigger}) is paused with 0 runs this month. Its steps are: ${a.steps.join("; ")}. In 3 short sentences, diagnose the most likely reason it was paused and give a safe restart plan an operator can approve. Plain English.`;
    try {
      await streamAi(
        { tool: "integration_setup_guide", messages: [{ role: "user", content: prompt }] },
        (_c, full) => setDiagnoseState({ running: true, text: full }),
      );
    } finally {
      setDiagnoseState((s) => ({ running: false, text: s.text }));
    }
  }

  // ── Ask Matin panel actions (explicit AI surface) ────────────────────────
  const askActions: AIAction[] = [
    {
      id: "summary",
      title: "Summarize system health right now",
      riskTag: "Auto-safe",
      evidence: `${connected} connected · ${needsAttention} need attention · ${failedRuns.length} failed runs · ${dqFlags} data-quality flags.`,
      confidence: "High",
    },
    {
      id: "triage",
      title: "What should I fix first?",
      riskTag: "Auto-safe",
      evidence:
        "Ranks failing integrations, failed runs, and high-severity data flags into a single ordered action list.",
      confidence: "High",
    },
  ];

  async function runAskAction(action: AIAction) {
    const key = action.id ?? "0";
    setAskState((prev) => ({ ...prev, [key]: { running: true, result: "" } }));
    const ctx = `Connected: ${connected}/${integrations.length}. Need attention: ${integrations
      .filter((i) => i.status !== "Healthy")
      .map((i) => `${i.name} (${i.status})`)
      .join(", ")}. Failed runs: ${failedRuns
      .map((r) => `${r.name} @ ${r.failedStep}`)
      .join(", ")}. Data-quality flags: ${dataQualityIssues
      .map((d) => `${d.issue} (${dqRemaining[d.id]})`)
      .join(", ")}.`;
    const prompt =
      action.id === "triage"
        ? `You are an operations copilot for a real-estate brokerage's automation platform. ${ctx} Give a numbered, prioritized fix list (max 4 items), highest-impact first, one line each.`
        : `You are an operations copilot for a real-estate brokerage's automation platform. ${ctx} In 3 short sentences, summarize overall system health and the single most urgent item.`;
    try {
      await streamAi(
        { tool: "integration_setup_guide", messages: [{ role: "user", content: prompt }] },
        (_c, full) =>
          setAskState((prev) => ({ ...prev, [key]: { running: true, result: full } })),
      );
    } finally {
      setAskState((prev) => ({
        ...prev,
        [key]: { running: false, result: prev[key]?.result ?? "" },
      }));
    }
  }

  function rejectAskAction(action: AIAction) {
    const key = action.id ?? "0";
    setAskState((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  // ── Integration table columns ────────────────────────────────────────────
  const integrationColumns: Column<Integration>[] = [
    {
      key: "name",
      header: "System",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          {/* Real vendor mark in a white chip (ticket 1) */}
          <VendorMark provider={row.provider ?? row.name} name={row.name} size={22} />
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
      primary: true,
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
          <span className={cn("text-[0.8rem] tabular-nums", bad ? "text-danger" : "text-slate")}>
            {row.lastSync ?? "—"}
          </span>
        );
      },
    },
  ];

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (!ready) {
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.62fr_1fr]">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[7.5rem] rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.62fr_1fr]">
      {/* ════════════ LEFT — the plumbing, inspectable ════════════ */}
      <div className="order-2 min-w-0 space-y-5 lg:order-1">
        {/* KPI strip — scroll-snap rail on phone (R4), trend deltas (ticket 4) */}
        <KpiStrip cols={5} rail>
          <KpiCard
            label="Integrations connected"
            value={connected}
            icon={<Plug className="h-3.5 w-3.5" />}
            delta={`${needsAttention} need attention`}
            deltaTone={needsAttention > 0 ? "down" : "flat"}
            hint={`of ${integrations.length} connectors · ${connDelta.delta >= 0 ? "+" : ""}${connDelta.delta} vs 7d`}
            onDrill={() =>
              setActiveIntegrationName(
                sortedIntegrations.find((i) => i.status !== "Healthy")?.name ??
                  sortedIntegrations[0]?.name ??
                  null,
              )
            }
          />
          <KpiCard
            label="Automations running"
            value={automationsRunning}
            icon={<Workflow className="h-3.5 w-3.5" />}
            delta={`${autoDelta.delta >= 0 ? "+" : ""}${autoDelta.delta} vs 7d`}
            deltaTone={autoDelta.dir === "up" ? "up" : autoDelta.dir === "down" ? "down" : "flat"}
            hint={`${automations.length - automationsRunning} paused`}
            onDrill={() => {
              const paused = automations.find((a) => a.status === "paused");
              if (paused) setSelectedAutomationId(paused.id);
              document
                .getElementById("automation-breakdown")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
          <KpiCard
            label="Webhook errors"
            value={webhookErrors}
            valueTone={webhookErrors > 0 ? "danger" : "ink"}
            icon={<TriangleAlert className="h-3.5 w-3.5" />}
            delta={`${failedRuns.length} failed runs`}
            deltaTone={webhookErrors > 0 ? "down" : "flat"}
            hint={`across all connectors · ${errDelta.delta >= 0 ? "+" : ""}${errDelta.delta} vs 7d`}
            onDrill={() => setActiveRunId(failedRuns[0]?.id ?? orderedRuns[0]?.id ?? null)}
          />
          <KpiCard
            label="Data-quality flags"
            value={dqFlags}
            valueTone={dqFlags > 0 ? "danger" : "ink"}
            icon={<ShieldAlert className="h-3.5 w-3.5" />}
            delta={`${dqDelta.delta >= 0 ? "+" : ""}${dqDelta.delta} vs 7d`}
            deltaTone={dqDelta.dir === "down" ? "up" : dqDelta.dir === "up" ? "down" : "flat"}
            hint={`${dataQualityIssues.length} rule types`}
            onDrill={() =>
              setActiveDqId(
                [...dataQualityIssues].sort(
                  (a, b) => (dqRemaining[b.id] ?? 0) - (dqRemaining[a.id] ?? 0),
                )[0]?.id ?? null,
              )
            }
          />
          <KpiCard
            label="Last sync"
            value={lastSyncValue}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            hint={freshest ? `freshest: ${freshest.name}` : "no live connector"}
            onDrill={() => freshest && setActiveIntegrationName(freshest.name)}
          />
        </KpiStrip>

        {/* Data-flow diagram (hero) + sync/error time-series (tickets 2 & 3) */}
        <SystemsDiagram integrations={integrations} />
        <SyncActivityChart totalRuns={runs.length} failedToday={failedRuns.length} />

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
              onClick={() =>
                setActiveIntegrationName(
                  sortedIntegrations.find((i) => i.status === "Needs auth")?.name ??
                    sortedIntegrations[0]?.name ??
                    null,
                )
              }
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
            responsive
            onRowClick={(r) => setActiveIntegrationName(r.name)}
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
              fix, not a silent error. Click a rule to inspect and repair.
            </p>
          </header>

          <div className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
            {dataQualityIssues.map((dq, i) => {
              const remaining = dqRemaining[dq.id] ?? dq.count;
              const cleared = remaining === 0;
              // Flagged-vs-total proportion bar relative to the noisiest rule.
              const proportion = maxDqCount > 0 ? Math.round((remaining / maxDqCount) * 100) : 0;
              const sevColor =
                dq.severity === "high" ? "bg-danger" : dq.severity === "med" ? "bg-warn" : "bg-info";
              return (
                <button
                  key={dq.id}
                  type="button"
                  onClick={() => setActiveDqId(dq.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-4 border-l-[3px] px-4 py-3 text-left transition-colors hover:bg-paper",
                    cleared
                      ? "border-l-success/50"
                      : dq.severity === "high"
                        ? "border-l-danger"
                        : dq.severity === "med"
                          ? "border-l-warn"
                          : "border-l-info",
                    i !== dataQualityIssues.length - 1 && "border-b border-mist/70",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <VendorMark provider={dq.source} size={20} />
                    <div className="min-w-0">
                      <div className="truncate text-[0.84rem] font-medium text-ink">
                        {dq.issue}
                      </div>
                      <div className="truncate text-[0.74rem] text-slate">
                        Source <span className="font-semibold text-ink">{dq.source}</span>
                      </div>
                      {!cleared ? (
                        <div className="mt-1.5 h-1 w-28 overflow-hidden rounded-full bg-paper-200">
                          <div
                            className={cn("h-full rounded-full", sevColor)}
                            style={{ width: `${Math.max(8, proportion)}%` }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {cleared ? (
                      <StatusChip tone="success">
                        <CircleCheck className="h-3 w-3" />
                        Fixed
                      </StatusChip>
                    ) : (
                      <StatusChip tone={SEVERITY_TONE[dq.severity]}>
                        {remaining.toLocaleString("en-US")} flagged
                      </StatusChip>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 text-slate/50" />
                  </div>
                </button>
              );
            })}
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
            ) : (
              <StatusChip tone="success" variant="soft">
                <Dot tone="success" />
                All clear
              </StatusChip>
            )}
          </header>

          {orderedRuns.length === 0 ? (
            <EmptyState
              icon={<Workflow className="h-5 w-5" />}
              title="No workflow runs yet"
              body="As automations fire, every run lands here with its full step log. Connect a system to start the first workflow."
              actionLabel="Connect a system"
              onAction={() => setActiveIntegrationName(sortedIntegrations[0]?.name ?? null)}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
              {orderedRuns.map((run, i) => {
                const meta = RUN_STATUS[run.status];
                const isFailed = run.status === "failed";
                const isRetrying = retrying.has(run.id);
                const owner = RUN_OWNER[run.id];
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
                        <div className="mt-1 flex items-center gap-2 pl-4 text-[0.76rem] text-slate">
                          {owner ? (
                            <Avatar name={owner.name} slug={owner.slug} size={18} />
                          ) : null}
                          <span className="truncate">
                            {run.subject} · started {run.startedLabel}
                          </span>
                        </div>
                        {/* compact step trail — full at sm+, truncated "+N" on phone (R8) */}
                        <StepTrail steps={run.steps} />
                        {isFailed && run.failedStep ? (
                          <p className="mt-2 pl-4 text-[0.74rem] font-medium text-danger">
                            Failed at: {run.failedStep}
                          </p>
                        ) : null}
                      </button>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <StatusChip tone={meta.tone}>
                          {run.status === "running" && isRetrying ? "Re-running…" : meta.label}
                        </StatusChip>
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
          )}
        </section>

        {/* Automation breakdown (selectable master–detail) */}
        <div id="automation-breakdown" className="scroll-mt-24">
          <AutomationBreakdown
            automations={automations}
            selectedId={selectedAutomationId}
            onSelect={(id) => {
              setSelectedAutomationId(id);
              setDiagnoseState({ running: false, text: "" });
            }}
            onToggle={toggleAutomation}
            diagnosing={diagnoseState.running}
            diagnosis={diagnoseState.text}
            onDiagnose={diagnoseAutomation}
          />
        </div>
      </div>

      {/* ════════════ RIGHT — admin detail + Ask Matin ════════════ */}
      <div className="order-1 min-w-0 space-y-5 lg:order-2">
        {/* Matin section lockup + grounding context line (ticket 6) */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-mist bg-cloud px-5 py-3.5 shadow-soft">
          <MatinMark theme="dark" className="!h-5 w-auto" />
          <p className="text-[0.74rem] leading-snug text-slate">
            {company.name} · {company.address.city}, {company.address.state} ·{" "}
            {company.stats?.agents ?? 40} agents · primary store: Supabase Postgres
          </p>
        </div>

        {/* Ask Matin — the ONLY explicit global-AI affordance on this page */}
        <AiPanel
          context="Systems Health / live status"
          actions={askActions}
          actionState={askState}
          onRunAction={runAskAction}
          onRejectAction={rejectAskAction}
        >
          <p className="text-[0.82rem] leading-relaxed text-slate-300">
            Ask Matin to read the live integration, run, and data-quality state
            and tell you exactly what to fix — grounded in the records on this
            page, not a generic chatbot.
          </p>
        </AiPanel>

        {/* New Seller Lead — admin breakdown */}
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
              <div key={stage.label} className="flex items-center gap-4 px-5 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper-200 text-[0.68rem] font-bold tabular-nums text-slate ring-1 ring-inset ring-mist">
                  {i + 1}
                </span>
                <dt className="w-[5.5rem] shrink-0 text-[0.78rem] font-semibold text-ink">
                  {stage.label}
                </dt>
                <dd className="min-w-0 flex-1 text-[0.82rem] text-slate">{stage.value}</dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-mist px-5 py-3.5">
            <code className="block break-words font-mono text-[0.72rem] leading-relaxed text-ink">
              every run writes → workflow_runs · ai_actions · audit_logs
            </code>
          </div>
        </section>

        {/* AI usage / quota — Structurely-style */}
        <section className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
          <div className="border-b border-mist px-5 py-3">
            <p className="eyebrow text-[0.66rem] text-slate">AI usage · this month</p>
          </div>
          <div className="space-y-4 px-5 py-4">
            {USAGE_QUOTAS.map((q) => {
              const pct = Math.min(100, Math.round((q.used / q.cap) * 100));
              const warn = pct >= 90;
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
                      className={cn("h-full rounded-full", warn ? "bg-warn" : "bg-success")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── Drawers (all parent-state driven; none open the global sidecar) ── */}
      <WorkflowRunDrawer
        run={activeRun}
        onClose={() => {
          setActiveRunId(null);
          setExplainState({ running: false, text: "" });
        }}
        retrying={activeRun ? retrying.has(activeRun.id) : false}
        onRetry={() => activeRun && retryRun(activeRun.id)}
        explaining={explainState.running}
        explanation={explainState.text}
        onExplain={explainFailure}
      />

      <IntegrationDrawer
        integration={activeIntegration}
        onClose={() => {
          setActiveIntegrationName(null);
          setProbe({ phase: "idle" });
        }}
        probe={probe}
        onTest={testConnection}
        onReauthorize={reauthorize}
      />

      <DataQualityDrawer
        issue={activeDq}
        remaining={activeDq ? (dqRemaining[activeDq.id] ?? activeDq.count) : 0}
        onClose={() => {
          setActiveDqId(null);
          setDqDraft({ running: false, text: "", fixing: false });
        }}
        fixing={dqDraft.fixing}
        fixed={activeDq ? dqFixed.has(activeDq.id) : false}
        onQueueFix={queueDqFix}
        drafting={dqDraft.running}
        draft={dqDraft.text}
        onDraftPlan={draftDqPlan}
      />
    </div>
  );
}

/* Step trail: shows every step at sm+, but truncates to the first two + a
   "+N" pill on phone so a 6-step trail never wraps to four lines (R8/ticket 8). */
function StepTrail({ steps }: { steps: WorkflowRun["steps"] }) {
  const pill = (step: WorkflowRun["steps"][number], si: number, last: boolean) => (
    <span key={`${step.name}-${si}`} className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.68rem] font-medium ring-1 ring-inset",
          step.status === "failed" && "bg-danger/10 text-danger ring-danger/25",
          step.status === "succeeded" && "bg-success/10 text-success ring-success/20",
          step.status === "running" && "bg-info/10 text-info ring-info/25",
          step.status === "waiting" && "bg-paper-200 text-slate ring-mist",
        )}
      >
        {step.name}
      </span>
      {!last ? <ArrowRight className="h-3 w-3 text-slate/40" /> : null}
    </span>
  );
  const extra = Math.max(0, steps.length - 2);
  return (
    <>
      {/* Phone: first two + "+N" */}
      <div className="mt-2 flex flex-nowrap items-center gap-x-1.5 overflow-hidden pl-4 sm:hidden">
        {steps.slice(0, 2).map((s, si) => pill(s, si, si === 1 && extra === 0))}
        {extra > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <ArrowRight className="h-3 w-3 text-slate/40" />
            <span className="rounded-md bg-paper-200 px-1.5 py-0.5 text-[0.68rem] font-medium text-slate ring-1 ring-inset ring-mist">
              +{extra}
            </span>
          </span>
        ) : null}
      </div>
      {/* sm+: full trail */}
      <div className="mt-2 hidden flex-wrap items-center gap-x-1.5 gap-y-1 pl-4 sm:flex">
        {steps.map((s, si) => pill(s, si, si === steps.length - 1))}
      </div>
    </>
  );
}

/* The "New Seller Lead" admin breakdown — label → plain-English value. */
const SELLER_LEAD_STAGES: { label: string; value: string }[] = [
  { label: "Trigger", value: "Website home-value submit" },
  { label: "Enrich", value: "Property + owner + equity" },
  { label: "Score", value: "Seller intent > 80" },
  { label: "Create", value: "CRM person + seller opportunity" },
  { label: "Route", value: "Best agent by area + load" },
  { label: "AI draft", value: "Text + email + task notes" },
  { label: "Log", value: "Audit trail + report metrics" },
];

const USAGE_QUOTAS: { label: string; used: number; cap: number }[] = [
  { label: "Anthropic Claude", used: 184_200, cap: 250_000 },
  { label: "OpenAI GPT", used: 96_400, cap: 150_000 },
  { label: "Twilio SMS", used: 38_400, cap: 40_000 },
];
