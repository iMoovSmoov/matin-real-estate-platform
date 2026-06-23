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
  return (
    <div className="px-4 pb-10 pt-4 md:px-6">
      <p className="mb-5 max-w-3xl text-[0.82rem] leading-relaxed text-slate">
        A business-friendly control room for the tools feeding MatinOS. Leads,
        CRM, transactions, marketing, documents, and AI runs are monitored here
        so the team sees what is healthy, what needs attention, and which
        automations are already doing the busywork.
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
