"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Phone,
  MessageSquare,
  Clock,
  Flame,
  CheckCircle2,
  Circle,
  ArrowRight,
  Target,
  TrendingUp,
  Calendar,
  Users,
} from "lucide-react";
import { Panel, PanelHeader, Pill } from "@/components/command/ui";
import { cn } from "@/lib/utils";
import { salesAgents, leads, transactions } from "@/lib/data";

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Task {
  id: string;
  leadName: string;
  description: string;
  timeDue: string;
  href: string;
  done: boolean;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function greetingWord(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatBudget(min: number, max: number): string {
  const fmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)}M`
      : `$${Math.round(n / 1000)}k`;
  return `${fmt(min)}–${fmt(max)}`;
}

function daysAgoLabel(d: number): string {
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d} days ago`;
}

const STAGE_PILL: Record<string, "azure" | "warn" | "success" | "danger" | "neutral"> = {
  Inspection: "warn",
  "Clear to Close": "success",
  "Under Contract": "azure",
  Active: "neutral",
  Pending: "warn",
  Closing: "danger",
};

function stagePillTone(stage: string): "azure" | "warn" | "success" | "danger" | "neutral" {
  return STAGE_PILL[stage] ?? "neutral";
}

function responseColor(mins: number): { ring: string; bg: string; text: string; label: string } {
  if (mins <= 5)
    return {
      ring: "ring-emerald-300",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      label: "green",
    };
  if (mins <= 15)
    return {
      ring: "ring-amber-300",
      bg: "bg-amber-50",
      text: "text-amber-700",
      label: "amber",
    };
  return { ring: "ring-red-300", bg: "bg-red-50", text: "text-red-700", label: "red" };
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function TaskRow({
  task,
  index,
  onToggle,
}: {
  task: Task;
  index: number;
  onToggle: (id: string) => void;
}) {
  const isEven = index % 2 === 0;
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3.5 transition-colors",
        task.done ? "opacity-50" : isEven ? "bg-white" : "bg-[#f4f4f3]",
        !task.done && "hover:bg-ink/[0.03]",
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        aria-label={task.done ? "Mark incomplete" : "Mark complete"}
        className="shrink-0 text-slate/50 transition-colors hover:text-ink"
      >
        {task.done ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      {/* Lead name */}
      <div className="w-[9rem] shrink-0">
        <p
          className={cn(
            "truncate text-[0.82rem] font-semibold leading-tight",
            task.done ? "text-slate line-through" : "text-ink",
          )}
        >
          {task.leadName}
        </p>
      </div>

      {/* Description */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[0.82rem] leading-tight",
            task.done ? "text-slate/50 line-through" : "text-slate",
          )}
        >
          {task.description}
        </p>
      </div>

      {/* Time due */}
      <span className="hidden shrink-0 text-[0.73rem] text-slate/60 sm:block">
        {task.timeDue}
      </span>

      {/* Done / Do it */}
      {!task.done ? (
        <Link
          href={task.href}
          className="ml-1 inline-flex shrink-0 items-center gap-0.5 rounded-md border border-ink/[0.1] px-2.5 py-1 text-[0.72rem] font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
        >
          Do it
          <ArrowRight className="h-3 w-3" />
        </Link>
      ) : (
        <span className="ml-1 shrink-0 text-[0.72rem] font-medium text-emerald-600">Done</span>
      )}
    </div>
  );
}

function HotLeadCard({
  lead,
}: {
  lead: {
    id: string;
    name: string;
    phone: string;
    source: string;
    lastContactDaysAgo: number;
    nextBestAction?: string;
    budgetMin: number;
    budgetMax: number;
  };
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-ink/[0.08] bg-white p-4 shadow-sm ring-2 ring-inset ring-red-100">
      <div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[0.88rem] font-semibold text-ink">{lead.name}</span>
          <Pill tone="neutral">{lead.source}</Pill>
        </div>
        <p className="mt-1 text-[0.73rem] text-slate">
          Budget:{" "}
          <span className="font-medium text-ink">
            {formatBudget(lead.budgetMin, lead.budgetMax)}
          </span>
        </p>
        <p className="mt-0.5 text-[0.73rem] text-slate">
          Last contact:{" "}
          <span className="font-medium text-ink">{daysAgoLabel(lead.lastContactDaysAgo)}</span>
        </p>
      </div>

      {/* AI suggested action */}
      <p className="rounded-lg bg-[#f4f4f3] px-2.5 py-1.5 text-[0.73rem] font-medium text-ink ring-1 ring-inset ring-ink/[0.06]">
        <Target className="mr-1 inline h-3.5 w-3.5 text-blue-500" />
        {lead.nextBestAction ?? "Follow up — contact this lead today"}
      </p>

      {/* CTA buttons */}
      <div className="flex gap-2">
        <a
          href={`tel:${lead.phone}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-[0.75rem] font-semibold text-white transition-colors hover:bg-ink/80"
        >
          <Phone className="h-3.5 w-3.5" />
          Call now
        </a>
        <Link
          href="/hub/crm"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink/[0.12] px-3 py-2 text-[0.75rem] font-semibold text-ink transition-colors hover:bg-[#f4f4f3]"
        >
          <Users className="h-3.5 w-3.5" />
          Open lead
        </Link>
      </div>
    </div>
  );
}

function PipelineCard({
  tx,
}: {
  tx: {
    id: string;
    address: string;
    stage: string;
    closeDateDaysOut: number;
    client: string;
  };
}) {
  const urgent = tx.closeDateDaysOut <= 5;
  const soon = tx.closeDateDaysOut <= 14;
  const chipCls = urgent
    ? "bg-red-50 text-red-700 ring-red-200"
    : soon
    ? "bg-amber-50 text-amber-700 ring-amber-200"
    : "bg-slate-50 text-slate-600 ring-slate-200";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-ink/[0.08] bg-white px-4 py-3 shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.83rem] font-semibold text-ink">{tx.address}</p>
        <p className="mt-0.5 text-[0.71rem] text-slate">{tx.client}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <Pill tone={stagePillTone(tx.stage)}>{tx.stage}</Pill>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[0.67rem] font-semibold ring-1 ring-inset",
            chipCls,
          )}
        >
          <Calendar className="mr-1 h-2.5 w-2.5" />
          {tx.closeDateDaysOut}d to close
        </span>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export default function AgentWorkspace() {
  // Pick the first sales agent as "this" agent
  const agent = salesAgents[0];

  // Hot leads: assigned to this agent, score ≥80 OR lastContactDaysAgo >5
  const hotLeads = useMemo(
    () =>
      leads
        .filter(
          (l) =>
            l.assignedAgent === agent.slug &&
            (l.score >= 80 || l.lastContactDaysAgo > 5),
        )
        .slice(0, 4),
    [agent.slug],
  );

  // Pipeline: transactions assigned to this agent
  const pipeline = useMemo(
    () =>
      transactions
        .filter((t) => t.agentSlug === agent.slug)
        .sort((a, b) => a.closeDateDaysOut - b.closeDateDaysOut)
        .slice(0, 4),
    [agent.slug],
  );

  // Generate tasks from hot leads + pipeline urgency
  const [tasks, setTasks] = useState<Task[]>(() => {
    const generated: Task[] = [];

    hotLeads.forEach((l, i) => {
      const daysFmt =
        l.lastContactDaysAgo > 0
          ? `no contact in ${l.lastContactDaysAgo} day${l.lastContactDaysAgo !== 1 ? "s" : ""}`
          : "contacted today";
      generated.push({
        id: `lead-${l.id}`,
        leadName: l.name,
        description: `${l.nextBestAction ?? `Follow up — ${daysFmt}`}`,
        timeDue: i === 0 ? "ASAP" : i === 1 ? "By noon" : "Today",
        href: "/hub/crm",
        done: false,
      });
    });

    pipeline.forEach((tx) => {
      if (tx.closeDateDaysOut <= 7) {
        generated.push({
          id: `tx-${tx.id}`,
          leadName: tx.client,
          description: `${tx.stage} — closes in ${tx.closeDateDaysOut}d · ${tx.address}`,
          timeDue: `${tx.closeDateDaysOut}d left`,
          href: "/hub/transactions",
          done: false,
        });
      }
    });

    // Pad with a couple of standing tasks if we have room
    if (generated.length < 3) {
      generated.push({
        id: "task-ba",
        leadName: "New inquiry",
        description: "Review and send buyer agreement to interested buyers",
        timeDue: "EOD",
        href: "/hub/buyer-agreements",
        done: false,
      });
    }

    return generated;
  });

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  const pendingTasks = tasks.filter((t) => !t.done);
  const hotCount = hotLeads.length;
  const responseTimeMins = agent.responseTimeMins ?? 12;
  const teamAvgMins = 18; // pulled from metrics or hardcoded baseline
  const rtStyle = responseColor(responseTimeMins);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">

      {/* ── 1. Greeting header ───────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate/50">
            {todayLabel()}
          </p>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">
            {greetingWord()}, {agent.firstName}.
          </h1>
          <p className="mt-1.5 text-[0.88rem] text-slate">
            {hotCount > 0 ? (
              <>
                You have{" "}
                <span className="font-semibold text-red-600">
                  {hotCount} hot lead{hotCount !== 1 ? "s" : ""}
                </span>{" "}
                and{" "}
              </>
            ) : (
              <>You have </>
            )}
            <span className="font-semibold text-ink">
              {pendingTasks.length} task{pendingTasks.length !== 1 ? "s" : ""}
            </span>{" "}
            due today.
          </p>
        </div>

        {/* Response time badge — top-right on desktop */}
        <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
          <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-slate/50">
            Response time
          </p>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.75rem] font-semibold ring-1 ring-inset",
              rtStyle.bg,
              rtStyle.text,
              rtStyle.ring,
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            You: {responseTimeMins} min avg
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-[#f4f4f3] px-3 py-1.5 text-[0.75rem] font-medium text-slate ring-1 ring-inset ring-ink/[0.08]">
            Team avg: {teamAvgMins} min
          </span>
        </div>
      </div>

      {/* ── Desktop 2-column layout ──────────────────────────────────────── */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">

        {/* ── LEFT: Tasks + Hot Leads (2/3 width on desktop) ──────────── */}
        <div className="flex flex-col gap-5 lg:flex-[2]">

          {/* ── 2. Priority task list ─────────────────────────────────── */}
          <Panel>
            <PanelHeader
              title="Today's priorities"
              icon={<CheckCircle2 className="h-4 w-4" />}
              subtitle={`${pendingTasks.length} action${pendingTasks.length !== 1 ? "s" : ""} remaining`}
            />

            {/* Column header row */}
            <div className="flex items-center gap-3 border-b border-ink/[0.06] bg-[#f4f4f3] px-4 py-2">
              <div className="w-5 shrink-0" />
              <div className="w-[9rem] shrink-0">
                <p className="text-[0.64rem] font-semibold uppercase tracking-wider text-slate/60">
                  Lead / Client
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[0.64rem] font-semibold uppercase tracking-wider text-slate/60">
                  Task
                </p>
              </div>
              <p className="hidden shrink-0 text-[0.64rem] font-semibold uppercase tracking-wider text-slate/60 sm:block">
                Due
              </p>
              <div className="ml-1 w-[3.75rem] shrink-0" />
            </div>

            {tasks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                <p className="text-[0.88rem] text-slate">All caught up — no tasks today.</p>
              </div>
            ) : (
              <div className="divide-y divide-ink/[0.05] overflow-hidden rounded-b-2xl">
                {tasks.map((task, i) => (
                  <TaskRow key={task.id} task={task} index={i} onToggle={toggleTask} />
                ))}
              </div>
            )}
          </Panel>

          {/* ── 3. Hot leads panel ───────────────────────────────────── */}
          <Panel>
            <PanelHeader
              title="Hot leads"
              icon={<Flame className="h-4 w-4" />}
              subtitle={
                hotLeads.length > 0
                  ? `${hotLeads.length} lead${hotLeads.length !== 1 ? "s" : ""} need a response today`
                  : "No urgent leads right now"
              }
              action={
                <Link
                  href="/hub/crm"
                  className="rounded-lg border border-ink/[0.1] px-3 py-1.5 text-[0.74rem] font-semibold text-ink transition-colors hover:bg-[#f4f4f3]"
                >
                  View all
                </Link>
              }
            />

            {hotLeads.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
                <Target className="h-8 w-8 text-slate/30" />
                <p className="text-[0.88rem] text-slate">No hot leads right now — great work.</p>
              </div>
            ) : (
              /* Mobile: horizontal scroll; desktop: grid */
              <div className="flex gap-4 overflow-x-auto p-5 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-2">
                {hotLeads.map((lead) => (
                  <div key={lead.id} className="min-w-[80vw] sm:min-w-0">
                    <HotLeadCard lead={lead} />
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* ── RIGHT: Pipeline + Response time (1/3 width on desktop) ── */}
        <div className="flex flex-col gap-5 lg:flex-[1]">

          {/* ── 4. Pipeline mini cards ───────────────────────────────── */}
          <Panel>
            <PanelHeader
              title="My pipeline"
              icon={<TrendingUp className="h-4 w-4" />}
              subtitle={
                pipeline.length > 0
                  ? `${pipeline.length} active deal${pipeline.length !== 1 ? "s" : ""}`
                  : "No active transactions"
              }
              action={
                <Link
                  href="/hub/transactions"
                  className="rounded-lg border border-ink/[0.1] px-3 py-1.5 text-[0.74rem] font-semibold text-ink transition-colors hover:bg-[#f4f4f3]"
                >
                  See all
                </Link>
              }
            />

            {pipeline.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
                <TrendingUp className="h-7 w-7 text-slate/30" />
                <p className="text-[0.85rem] text-slate">No transactions in flight.</p>
              </div>
            ) : (
              /* Mobile: horizontal scroll; desktop: stacked vertical */
              <div className="flex gap-3 overflow-x-auto p-4 sm:flex-col sm:overflow-visible">
                {pipeline.map((tx) => (
                  <div key={tx.id} className="min-w-[80vw] sm:min-w-0">
                    <PipelineCard tx={tx} />
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* ── 5. Response time card (standalone on right column) ─── */}
          <Panel>
            <PanelHeader
              title="Response time"
              icon={<Clock className="h-4 w-4" />}
              subtitle="Your avg vs. team"
            />
            <div className="flex flex-col gap-3 p-4">
              {/* Your badge */}
              <div
                className={cn(
                  "flex items-center justify-between rounded-xl px-4 py-3 ring-1 ring-inset",
                  rtStyle.bg,
                  rtStyle.ring,
                )}
              >
                <div>
                  <p className={cn("text-[0.7rem] font-semibold uppercase tracking-wider", rtStyle.text)}>
                    You
                  </p>
                  <p className={cn("mt-0.5 text-2xl font-bold tabular-nums", rtStyle.text)}>
                    {responseTimeMins}m
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn("text-[0.72rem] font-medium", rtStyle.text)}>
                    {responseTimeMins <= 5
                      ? "Excellent"
                      : responseTimeMins <= 15
                      ? "Good"
                      : "Needs work"}
                  </p>
                  <p className={cn("text-[0.7rem]", rtStyle.text)}>
                    {responseTimeMins <= 5
                      ? "Top of team"
                      : responseTimeMins <= 15
                      ? "Near average"
                      : "Above avg"}
                  </p>
                </div>
              </div>

              {/* Team comparison */}
              <div className="flex items-center justify-between rounded-xl bg-[#f4f4f3] px-4 py-3 ring-1 ring-inset ring-ink/[0.07]">
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate/60">
                    Team avg
                  </p>
                  <p className="mt-0.5 text-2xl font-bold tabular-nums text-ink">
                    {teamAvgMins}m
                  </p>
                </div>
                <div className="text-right">
                  {responseTimeMins < teamAvgMins ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[0.72rem] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      {teamAvgMins - responseTimeMins}m faster
                    </span>
                  ) : responseTimeMins > teamAvgMins ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[0.72rem] font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                      {responseTimeMins - teamAvgMins}m slower
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[0.72rem] font-semibold text-slate ring-1 ring-inset ring-slate-200">
                      On par
                    </span>
                  )}
                </div>
              </div>

              <p className="text-center text-[0.68rem] text-slate/50">
                <MessageSquare className="mr-0.5 inline h-3 w-3" />
                Based on last 30 days of lead responses
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
