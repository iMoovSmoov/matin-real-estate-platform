import {
  integrations,
  workflowRuns,
  dataQualityIssues,
  automations,
} from "@/lib/data";
import { SystemsHealthWorkspace } from "@/components/command/systems/SystemsHealthWorkspace";

export const metadata = { title: "Systems Health" };

/* ──────────────────────────────────────────────────────────────────────────
   Systems Health / Admin Setup  (ref §2.11)

   Server component. The TopCommandBar (in AppShell) renders the section H1,
   so this page renders only a one-line muted subtitle, then the operator
   workspace. All interactivity (retries, run drawer, "Explain failure" → AI)
   lives in the client SystemsHealthWorkspace.
   ────────────────────────────────────────────────────────────────────────── */

export default function SystemsHealthPage() {
  // Design's stat-driven subtitle ("5 of 6 integrations healthy · …") — real
  // derived counts, not hand-authored literals.
  const totalIntegrations = integrations.length;
  const healthy = integrations.filter((i) => i.status === "Healthy").length;
  const needsAttention = totalIntegrations - healthy;
  const automationRunsThisMonth = automations.reduce(
    (sum, a) => sum + a.runsThisMonth,
    0,
  );

  return (
    <div className="px-4 pb-10 pt-4 md:px-6">
      <p className="mb-5 text-[0.82rem] text-slate">
        <span className="tabular-nums">{healthy}</span> of{" "}
        <span className="tabular-nums">{totalIntegrations}</span> integrations
        healthy
        <span className="mx-1.5 text-mist">·</span>
        <span className="tabular-nums">
          {automationRunsThisMonth.toLocaleString("en-US")}
        </span>{" "}
        automation runs this month
        <span className="mx-1.5 text-mist">·</span>
        {needsAttention > 0 ? (
          <span className="font-medium text-danger tabular-nums">
            {needsAttention} need{needsAttention === 1 ? "s" : ""} attention
          </span>
        ) : (
          <span className="font-medium text-success">all systems healthy</span>
        )}
      </p>

      <SystemsHealthWorkspace
        integrations={integrations}
        workflowRuns={workflowRuns}
        dataQualityIssues={dataQualityIssues}
        automations={automations}
      />
    </div>
  );
}
