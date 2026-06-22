"use client";

import { Loader2, CircleCheck, Wrench, FileText } from "lucide-react";
import {
  RecordDrawer,
  StatusChip,
  Dot,
  AIActionCard,
  type ChipTone,
} from "@/components/os";
import type { DataQualityIssue } from "@/lib/types";
import { SEVERITY_TONE } from "./systemsModel";
import { AiDraftResult } from "./AiDraftResult";

/* ──────────────────────────────────────────────────────────────────────────
   Systems Health — DataQualityDrawer (ref §2.11)

   Data-quality row-click → this drawer. Shows the flagged records as a real
   sample list (import source + the exact field problem), a "Queue auto-fix"
   action that mutates the flag count toward zero in parent state with inline
   confirmation, and an AI "Draft a fix plan" that streams INLINE. Never opens
   the global AI sidecar.
   ────────────────────────────────────────────────────────────────────────── */

const SEVERITY_LABEL: Record<DataQualityIssue["severity"], string> = {
  high: "High severity",
  med: "Medium severity",
  low: "Low severity",
};

/* Plausible affected-record samples per rule, so the drawer shows real rows
   rather than a count. Keyed by issue id; falls back to a generic line. */
const SAMPLE_RECORDS: Record<string, { label: string; detail: string }[]> = {
  "DQ-001": [
    { label: "Lead #FB-20481 · Carla Jiménez", detail: "address: (empty) · captured from Meta lead form" },
    { label: "Lead #FB-20477 · Demarcus Hill", detail: "address: (empty) · captured from Meta lead form" },
    { label: "Lead #FB-20455 · Priya N.", detail: "city present, street missing" },
  ],
  "DQ-002": [
    { label: "j.kwas@gmail.com", detail: "2 contacts: 'Jennifer Kwas' + 'Jen K.'" },
    { label: "mgrant@outlook.com", detail: "2 contacts: 'Melissa Grant' + 'M. Grant'" },
  ],
  "DQ-003": [
    { label: "Preferred area = 'Lake O'", detail: "doesn't match a known community" },
    { label: "Preferred area = 'PDX metro'", detail: "doesn't match a known community" },
    { label: "Preferred area = 'West side'", detail: "doesn't match a known community" },
  ],
  "DQ-004": [
    { label: "Lead #IDX-7741 · phone '503.555.21'", detail: "phone number isn't a valid format" },
    { label: "Lead #IDX-7720 · phone '(503) 5-0188'", detail: "too few digits" },
  ],
  "DQ-005": [
    { label: "Lead #Z-9981 · source: (none)", detail: "Zillow handoff dropped the lead source" },
    { label: "Lead #Z-9970 · source: (none)", detail: "Zillow handoff dropped the lead source" },
  ],
  "DQ-006": [
    { label: "MLS #23457881", detail: "list price blank — saved as a draft" },
    { label: "MLS #23457902", detail: "list price blank — coming-soon hold" },
  ],
};

export function DataQualityDrawer({
  issue,
  remaining,
  onClose,
  fixing,
  fixed,
  onQueueFix,
  drafting,
  draft,
  onDraftPlan,
}: {
  issue: DataQualityIssue | null;
  /** live remaining flag count from parent state (drops to 0 after auto-fix) */
  remaining: number;
  onClose: () => void;
  fixing: boolean;
  fixed: boolean;
  onQueueFix: () => void;
  drafting: boolean;
  draft: string;
  onDraftPlan: () => void;
}) {
  const dq = issue;
  const tone: ChipTone | null = dq ? SEVERITY_TONE[dq.severity] : null;
  const samples = dq ? SAMPLE_RECORDS[dq.id] ?? [] : [];

  return (
    <RecordDrawer
      open={dq != null}
      onClose={onClose}
      title={dq?.issue ?? "Data-quality rule"}
      subtitle={dq ? `${dq.source} · ${dq.id}` : undefined}
      actions={
        dq ? (
          <button
            type="button"
            onClick={onQueueFix}
            disabled={fixing || fixed || remaining === 0}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-[0.8rem] font-semibold text-cloud transition-colors hover:bg-ink-800 disabled:opacity-60"
          >
            {fixing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wrench className="h-3.5 w-3.5" />
            )}
            {fixed || remaining === 0
              ? "All records fixed"
              : fixing
                ? "Queuing fixes…"
                : `Queue auto-fix · ${remaining}`}
          </button>
        ) : undefined
      }
    >
      {dq ? (
        <div className="space-y-5">
          {/* Severity + remaining */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-[0.64rem] text-slate">Severity</p>
              <p className="mt-1 text-[0.86rem] text-slate">
                Continuous check across imported records.
              </p>
            </div>
            {tone ? (
              <StatusChip tone={tone}>
                <Dot tone={tone} />
                {SEVERITY_LABEL[dq.severity]}
              </StatusChip>
            ) : null}
          </div>

          {/* Flag count tile */}
          <div className="flex items-center justify-between rounded-xl border border-mist bg-paper px-4 py-3">
            <div>
              <p className="text-[0.72rem] font-medium uppercase tracking-wide text-slate">
                Records flagged
              </p>
              <p
                className={
                  "mt-0.5 text-[1.4rem] font-bold tabular-nums " +
                  (remaining === 0 ? "text-success" : "text-danger")
                }
              >
                {remaining.toLocaleString("en-US")}
              </p>
            </div>
            <span className="text-right text-[0.72rem] text-slate">
              Source
              <br />
              <span className="font-semibold text-ink">{dq.source}</span>
            </span>
          </div>

          {/* Inline confirmation */}
          {fixed ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-success/25 bg-success/[0.07] px-3.5 py-2.5">
              <CircleCheck className="mt-px h-4 w-4 shrink-0 text-success" />
              <p className="text-[0.78rem] font-medium leading-snug text-success">
                Queued {dq.count.toLocaleString("en-US")} records for auto-repair.
                They will clear on the next sync and be recorded in the activity log.
              </p>
            </div>
          ) : null}

          {/* Affected records sample */}
          <div>
            <p className="eyebrow mb-2 text-[0.64rem] text-slate">
              Affected records · sample
            </p>
            <ul className="divide-y divide-mist/70 overflow-hidden rounded-xl border border-mist bg-cloud">
              {samples.length > 0 ? (
                samples.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 px-3.5 py-2.5">
                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate" />
                    <div className="min-w-0">
                      <p className="truncate text-[0.8rem] font-medium text-ink">
                        {s.label}
                      </p>
                      <p className="truncate font-mono text-[0.72rem] text-slate">
                        {s.detail}
                      </p>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-3.5 py-3 text-[0.78rem] text-slate">
                  {dq.count.toLocaleString("en-US")} records match this rule.
                </li>
              )}
            </ul>
          </div>

          {/* AI: draft a fix plan — streams inline */}
          <div>
            <p className="eyebrow mb-2 text-[0.64rem] text-slate">
              Matin AI · remediation
            </p>
            <AIActionCard
              title="Draft a fix plan for this rule"
              riskTag="Auto-safe"
              evidence={`"${dq.issue}" — ${dq.count} records from ${dq.source}. Get a safe, step-by-step plan to clean these up.`}
              confidence="High"
              runLabel="Draft fix plan"
              running={drafting}
              result={
                draft ? (
                  <AiDraftResult
                    text={draft}
                    running={drafting}
                    filename={`matin-fix-plan-${dq.id}.txt`}
                  />
                ) : undefined
              }
              onRun={onDraftPlan}
            />
          </div>
        </div>
      ) : null}
    </RecordDrawer>
  );
}
