"use client";

import { CheckCircle2, RotateCcw, Loader2, MapPin, CalendarClock, FileWarning } from "lucide-react";
import {
  RecordDrawer,
  StatusChip,
  Dot,
  Avatar,
  AIActionCard,
  type ChipTone,
} from "@/components/os";
import { BrandedDocument } from "@/components/os/BrandedDocument";
import { getAgent } from "@/lib/data";
import { roles } from "@/lib/data/roles";
import type { WorkflowRun } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  RUN_STATUS,
  STEP_TONE,
  STEP_LABEL,
  RUN_OWNER,
} from "./systemsModel";

/* A run that produces a client-facing document gets a Matin-branded preview of
   exactly what it was rendering (§2.11 ticket 7) — most importantly the FAILED
   "Render branded PDF" CMA run (WR-007), so the operator sees the real artifact
   the pipeline was trying to produce, not just a step name. */
function isDocProducingRun(run: WorkflowRun): boolean {
  return /pdf|cma|branded|report|seller/i.test(`${run.name} ${run.subject} ${run.steps.map((s) => s.name).join(" ")}`);
}

/* ──────────────────────────────────────────────────────────────────────────
   Systems Health — WorkflowRunDrawer (ref §2.11)

   Row-click → this drawer. Shows trigger → ordered step log → status, with an
   accountable owner (real Avatar). Failed runs expose a Retry that mutates run
   state in the parent (failed → running → succeeded) AND an "Explain failure"
   that streams a real AI explanation INLINE into an AIActionCard. The drawer is
   driven entirely by parent state — never opens the global AI sidecar.
   ────────────────────────────────────────────────────────────────────────── */

export function WorkflowRunDrawer({
  run,
  onClose,
  retrying,
  onRetry,
  explaining,
  explanation,
  onExplain,
}: {
  run: WorkflowRun | null;
  onClose: () => void;
  retrying: boolean;
  onRetry: () => void;
  explaining: boolean;
  explanation: string;
  onExplain: () => void;
}) {
  const meta = run ? RUN_STATUS[run.status] : null;
  const owner = run ? RUN_OWNER[run.id] : null;
  const isFailed = run?.status === "failed";
  const failedDetail = run?.steps.find((s) => s.status === "failed")?.detail;

  return (
    <RecordDrawer
      open={run != null}
      onClose={onClose}
      title={run?.name ?? "Workflow run"}
      subtitle={
        run ? `${run.id} · ${run.subject} · started ${run.startedLabel}` : undefined
      }
      actions={
        run ? (
          <>
            {isFailed ? (
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
            ) : (
              <span className="flex-1 text-[0.76rem] text-slate">
                Run is {meta?.label.toLowerCase()}. No action needed.
              </span>
            )}
          </>
        ) : undefined
      }
    >
      {run ? (
        <div className="space-y-5">
          {/* Identity row: status + owner */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow text-[0.64rem] text-slate">Trigger</p>
              <p className="mt-1 truncate text-[0.88rem] font-semibold text-ink">
                {run.name}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[0.76rem] text-slate">
                <MapPin className="h-3 w-3" />
                {run.subject}
              </p>
            </div>
            {meta ? (
              <StatusChip tone={meta.tone}>
                <Dot tone={meta.tone} />
                {meta.label}
              </StatusChip>
            ) : null}
          </div>

          {/* Owner / accountability */}
          {owner ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-mist bg-paper px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <Avatar name={owner.name} slug={owner.slug} size={32} ring />
                <div className="leading-tight">
                  <p className="text-[0.8rem] font-semibold text-ink">{owner.name}</p>
                  <p className="text-[0.72rem] text-slate">Accountable owner</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[0.72rem] text-slate">
                <CalendarClock className="h-3.5 w-3.5" />
                {run.startedLabel}
              </span>
            </div>
          ) : null}

          {/* Failure banner */}
          {isFailed && run.failedStep ? (
            <div className="rounded-xl border border-danger/25 bg-danger/[0.06] px-3.5 py-2.5">
              <p className="text-[0.78rem] font-semibold text-danger">
                Failed at: {run.failedStep}
              </p>
              {failedDetail ? (
                <p className="mt-0.5 text-[0.74rem] leading-snug text-danger/80">
                  {failedDetail}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Branded-doc thumbnail — what this run was rendering (ticket 7) */}
          {isDocProducingRun(run) ? (
            <div>
              <p className="eyebrow mb-2 flex items-center gap-1.5 text-[0.64rem] text-slate">
                {isFailed ? (
                  <>
                    <FileWarning className="h-3 w-3 text-danger" /> Document this run failed to produce
                  </>
                ) : (
                  "Document this run produced"
                )}
              </p>
              <div className={cn("rounded-xl", isFailed && "ring-1 ring-inset ring-danger/30")}>
                <BrandedDocument
                  variant="report"
                  formId="Matin CMA"
                  title="Comparative Market Analysis"
                  recipient={run.subject.replace(/\s*—.*$/, "")}
                  completion={isFailed ? 60 : 100}
                  page={1}
                  pages={4}
                  hideToolbar
                  fields={[
                    { label: "Prepared for", value: run.subject.replace(/\s*—.*$/, "") },
                    { label: "Comps pulled", value: "4 active · 6 sold" },
                    { label: "Render status", value: isFailed ? undefined : "Rendered", filled: !isFailed },
                    { label: "Delivery", value: isFailed ? undefined : "Emailed", filled: !isFailed },
                  ]}
                  agent={(() => {
                    const owner = RUN_OWNER[run.id];
                    const a = getAgent(owner?.slug ?? roles.marketingLead);
                    return a
                      ? { name: a.name, slug: a.slug, title: a.title, license: a.licenseRaw, phone: a.phone }
                      : undefined;
                  })()}
                />
              </div>
              {isFailed ? (
                <p className="mt-2 text-[0.72rem] leading-snug text-slate">
                  The branded PDF service timed out before this CMA could render. Retry the run to
                  re-render and deliver it.
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Step log — trigger → steps → status */}
          <div>
            <p className="eyebrow mb-2.5 text-[0.64rem] text-slate">
              Step log · {run.steps.length} steps
            </p>
            <ol className="relative space-y-3.5 border-l border-mist pl-5">
              {run.steps.map((step, i) => {
                const tone: ChipTone = STEP_TONE[step.status];
                return (
                  <li key={`${step.name}-${i}`} className="relative">
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
                        <CheckCircle2 className="h-2.5 w-2.5 text-cloud" />
                      ) : null}
                      {step.status === "running" ? (
                        <Loader2 className="h-2.5 w-2.5 animate-spin text-cloud" />
                      ) : null}
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[0.83rem] font-medium text-ink">
                        {step.name}
                      </span>
                      <StatusChip tone={tone}>{STEP_LABEL[step.status]}</StatusChip>
                    </div>
                    <p className="mt-0.5 text-[0.76rem] leading-snug text-slate">
                      {step.detail}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* AI: Explain failure — only for failed runs, streams inline */}
          {isFailed ? (
            <div>
              <p className="eyebrow mb-2 text-[0.64rem] text-slate">
                Matin AI · root-cause
              </p>
              <AIActionCard
                title="Explain this failure and the first fix"
                riskTag="Auto-safe"
                evidence={`Run ${run.id} failed at "${run.failedStep}". Get the likely root cause and the first fix to try.`}
                confidence="High"
                runLabel="Explain failure"
                running={explaining}
                result={explanation || undefined}
                onRun={onExplain}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </RecordDrawer>
  );
}
