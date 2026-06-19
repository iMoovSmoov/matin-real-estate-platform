import { Flame, Clock, Briefcase } from "lucide-react";
import { leads, transactions, agents, metrics } from "@/lib/data";
import { StatTile } from "@/components/command/ui";
import { AgentWorkspace } from "@/components/command/AgentWorkspace";

export const metadata = { title: "Agent Workspace" };

const AGENT_SLUG = "joshua-rose";

/** Format today's date as "Wednesday, June 18" */
function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function AgentPage() {
  const agent = agents.find((a) => a.slug === AGENT_SLUG) ?? agents[1];
  const agentSlug = agent.slug;

  const hotLeads = leads.filter(
    (l) => l.score >= 80 && l.lastContactDaysAgo >= 2 && l.assignedAgent === agentSlug,
  );

  const tasksToday = hotLeads.slice(0, 5);

  const allHotLeads = leads.filter(
    (l) => l.score >= 80 && l.assignedAgent === agentSlug,
  );

  const agentTransactions = transactions.filter((t) => t.agentSlug === agentSlug);

  const teamAvg = metrics.kpis.avgResponseMins;
  const agentMins = agent.responseTimeMins ?? 13;
  const respDiff = teamAvg - agentMins;
  const respDelta = respDiff >= 0
    ? { value: `${respDiff}m faster than team`, dir: "up" as const }
    : { value: `${Math.abs(respDiff)}m slower than team`, dir: "down" as const };

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 md:px-6 md:py-8">
      <div>
        <p className="mb-1 text-[0.78rem] font-medium uppercase tracking-widest text-slate/50">
          {todayLabel()}
        </p>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">
          Good morning, {agent.firstName}.
        </h1>
        <p className="mt-1 text-[0.9rem] text-slate">
          Here&rsquo;s what needs your attention today &mdash;{" "}
          <span className="font-semibold text-ink">{hotLeads.length}</span> hot{" "}
          {hotLeads.length === 1 ? "lead" : "leads"} and{" "}
          <span className="font-semibold text-ink">{tasksToday.length}</span>{" "}
          {tasksToday.length === 1 ? "task" : "tasks"} due.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Hot Leads"
          value={allHotLeads.length}
          delta={{ value: "score ≥ 80", dir: "flat" }}
          icon={<Flame className="h-4 w-4" />}
        />
        <StatTile
          label="My Avg Response"
          value={`${agentMins}m`}
          delta={respDelta}
          hint={`Team avg: ${teamAvg}m`}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatTile
          label="Deals In Flight"
          value={agentTransactions.length}
          hint={agentTransactions.length === 0 ? "No active transactions" : "active transactions"}
          icon={<Briefcase className="h-4 w-4" />}
        />
      </div>

      <AgentWorkspace agentSlug={agentSlug} />
    </div>
  );
}
