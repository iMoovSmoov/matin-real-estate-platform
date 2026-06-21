import type {
  IntegrationHealth,
  DataQualitySeverity,
  WorkflowRun,
  WorkflowStep,
} from "@/lib/types";
import type { ChipTone } from "@/components/os";

/* ──────────────────────────────────────────────────────────────────────────
   Systems Health — shared model + tone maps (ref §2.11)

   Status/tone lookups and the small derived types the Systems Health workspace
   and its drawers share. Kept out of the JSX files so the orchestrator and each
   drawer agree on the same vocabulary. No React here — pure data.
   ────────────────────────────────────────────────────────────────────────── */

export const HEALTH_TONE: Record<IntegrationHealth, ChipTone> = {
  Healthy: "success",
  "Needs auth": "warn",
  Failing: "danger",
};

export const SEVERITY_TONE: Record<DataQualitySeverity, ChipTone> = {
  high: "danger",
  med: "warn",
  low: "info",
};

export const RUN_STATUS: Record<
  WorkflowRun["status"],
  { tone: ChipTone; label: string }
> = {
  succeeded: { tone: "success", label: "Succeeded" },
  running: { tone: "info", label: "Running" },
  waiting_for_approval: { tone: "warn", label: "Awaiting approval" },
  failed: { tone: "danger", label: "Failed" },
};

export const STEP_TONE: Record<WorkflowStep["status"], ChipTone> = {
  succeeded: "success",
  running: "info",
  waiting: "info",
  failed: "danger",
};

export const STEP_LABEL: Record<WorkflowStep["status"], string> = {
  succeeded: "Done",
  running: "Running",
  waiting: "Queued",
  failed: "Failed",
};

/* Owner attribution — who in the brokerage owns each automation run. Real
   agent slugs so Avatar resolves a true headshot (falls back to initials).
   Maps by run id so the inspector can show a human accountable owner. */
export const RUN_OWNER: Record<string, { name: string; slug: string }> = {
  "WR-001": { name: "Ava Brooks", slug: "ava-brooks" },
  "WR-002": { name: "Marcus Lee", slug: "marcus-lee" },
  "WR-003": { name: "Nina Patel", slug: "nina-patel" },
  "WR-004": { name: "Jason Veith", slug: "jason-veith" },
  "WR-005": { name: "Jason Veith", slug: "jason-veith" },
  "WR-006": { name: "Ava Brooks", slug: "ava-brooks" },
  "WR-007": { name: "Nina Patel", slug: "nina-patel" },
  "WR-008": { name: "Erin Martin", slug: "erin-martin" },
  "WR-009": { name: "Jordan Matin", slug: "jordan-matin" },
  "WR-010": { name: "Marcus Lee", slug: "marcus-lee" },
};

/* Automation ownership for the breakdown panel (by automation id). */
export const AUTOMATION_OWNER: Record<string, { name: string; slug: string }> = {
  au1: { name: "Ava Brooks", slug: "ava-brooks" },
  au2: { name: "Marcus Lee", slug: "marcus-lee" },
  au3: { name: "Nina Patel", slug: "nina-patel" },
  au4: { name: "Jason Veith", slug: "jason-veith" },
  au5: { name: "Nina Patel", slug: "nina-patel" },
  au6: { name: "Erin Martin", slug: "erin-martin" },
  au7: { name: "Jordan Matin", slug: "jordan-matin" },
  au8: { name: "Marcus Lee", slug: "marcus-lee" },
};

/* Each integration ties to a real property/seed so its drawer hero can carry a
   real exterior photo where the integration is a property-data source. Returns
   a stable seed per connector name. */
export function integrationSeed(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % 22;
}

export function fmtRecords(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US");
}

/* Apply a synthetic "retry" to a failed run: failed step flips to succeeded,
   downstream waiting steps resume to succeeded, status → succeeded. Used by the
   optimistic retry so the on-screen run reflects the queued re-run. */
export function applyRetry(run: WorkflowRun): WorkflowRun {
  if (run.status !== "failed") return run;
  const steps: WorkflowStep[] = run.steps.map((s) => {
    if (s.status === "failed")
      return { ...s, status: "succeeded", detail: `${s.detail} — re-run succeeded` };
    if (s.status === "waiting")
      return { ...s, status: "succeeded", detail: "Resumed after retry — completed" };
    return s;
  });
  return { ...run, status: "succeeded", failedStep: null, steps };
}
