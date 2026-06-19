"use client";

import { useState } from "react";
import { Clock, Flame, TrendingUp, Calendar, Phone, Mail, ArrowRight } from "lucide-react";
import { leads, transactions, agents, metrics } from "@/lib/data";
import {
  Panel,
  PanelHeader,
  Pill,
  ProgressBar,
} from "@/components/command/ui";
import { daysLabel, initials } from "@/lib/utils";

/* Deterministic mock appointments derived from agent slug. */
interface Appt {
  time: string;
  client: string;
  type: "Call" | "Showing" | "Consultation" | "Listing Appointment";
  note: string;
  tone: "azure" | "warn" | "success" | "neutral";
}

function buildAppointments(agentSlug: string): Appt[] {
  // Stable seed from slug length so it's deterministic but varies per agent.
  const seed = agentSlug.length % 4;
  const base: Appt[] = [
    { time: "9:00 AM", client: "Sarah Mitchell", type: "Call", note: "West Linn — Zillow lead, 2nd follow-up", tone: "azure" },
    { time: "11:30 AM", client: "Derek & Pam Okafor", type: "Showing", note: "4BR Sellwood bungalow — active buyers", tone: "success" },
    { time: "1:00 PM", client: "Rina Tanaka", type: "Listing Appointment", note: "Milwaukie — motivated to sell within 60d", tone: "warn" },
    { time: "3:30 PM", client: "Carlos Vega", type: "Consultation", note: "First-time buyer, pre-approved $450k Gresham", tone: "neutral" },
  ];
  // Rotate slightly by seed so different agents show slightly different appts.
  return [...base.slice(seed % 2), ...base.slice(0, seed % 2)];
}

interface Task {
  id: string;
  text: string;
  label: string;
  urgency: "high" | "normal";
  done: boolean;
}

export function AgentWorkspace({ agentSlug }: { agentSlug: string }) {
  const agent = agents.find((a) => a.slug === agentSlug);
  const agentLeads = leads.filter((l) => l.assignedAgent === agentSlug);
  const agentTransactions = transactions.filter((t) => t.agentSlug === agentSlug);
  const teamAvg = metrics.kpis.avgResponseMins;
  const agentMins = agent?.responseTimeMins ?? 13;

  // ── Build deterministic task list ────────────────────────────────────────
  const initialTasks: Task[] = [];

  // From hot leads (score >= 80) assigned to agent
  const hotLeads = agentLeads.filter((l) => l.score >= 80);

  for (const lead of hotLeads) {
    if (initialTasks.length >= 8) break;
    if (lead.lastContactDaysAgo >= 3) {
      initialTasks.push({
        id: `lead-call-${lead.id}`,
        text: `Call ${lead.firstName} — ${lead.lastContactDaysAgo}d no contact`,
        label: lead.community,
        urgency: "high",
        done: false,
      });
    } else if (lead.lastContactDaysAgo >= 1) {
      initialTasks.push({
        id: `lead-followup-${lead.id}`,
        text: `Follow up with ${lead.firstName} — ${lead.nextBestAction ?? "check in"}`,
        label: lead.community,
        urgency: "normal",
        done: false,
      });
    }
  }

  // From transactions closing soon (closeDateDaysOut <= 7)
  for (const tx of agentTransactions) {
    if (initialTasks.length >= 8) break;
    if (tx.closeDateDaysOut <= 7) {
      initialTasks.push({
        id: `tx-deadline-${tx.id}`,
        text: `Deadline: ${tx.address} closes in ${tx.closeDateDaysOut}d`,
        label: tx.stage,
        urgency: "high",
        done: false,
      });
    }
  }

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const appointments = buildAppointments(agentSlug);

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }

  // ── Hot leads panel ───────────────────────────────────────────────────────
  const attentionLeads = agentLeads
    .filter((l) => l.score >= 80 || l.lastContactDaysAgo >= 7)
    .sort((a, b) => b.lastContactDaysAgo - a.lastContactDaysAgo)
    .slice(0, 6);

  // ── Pipeline panel ────────────────────────────────────────────────────────
  const pipelineItems = agentTransactions.slice(0, 4);

  // ── Response time color ──────────────────────────────────────────────────
  const ratio = agentMins / (teamAvg || 1);
  const respColor =
    ratio <= 1
      ? "text-success"
      : ratio <= 2
        ? "text-warn"
        : "text-danger";

  // ── Stage pill tones ─────────────────────────────────────────────────────
  function stageTone(
    stage: string,
  ): "success" | "danger" | "warn" | "neutral" | "azure" {
    if (stage === "Closed") return "success";
    if (stage === "Clear to Close") return "success";
    if (stage === "Financing") return "azure";
    if (stage === "Inspection") return "warn";
    if (stage === "Active") return "azure";
    if (stage === "Pending") return "neutral";
    return "neutral";
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* ── Left column: tasks + response widget ── */}
      <div className="space-y-5 lg:col-span-1">
        {/* Priority Tasks */}
        <Panel>
          <PanelHeader
            title="Today's priorities"
            icon={<Clock className="h-4 w-4" />}
          />
          <div className="divide-y divide-ink/[0.06]">
            {tasks.length === 0 ? (
              <p className="px-5 py-6 text-center text-[0.85rem] text-slate">
                No urgent tasks — great day to prospect.
              </p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={[
                    "flex flex-col gap-2.5 px-5 py-3.5 transition-colors hover:bg-ink/[0.02]",
                    task.done ? "opacity-50" : "",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    {/* Priority dot */}
                    <span
                      className={[
                        "mt-[5px] h-2 w-2 shrink-0 rounded-full",
                        task.urgency === "high" ? "bg-danger" : "bg-ink/20",
                      ].join(" ")}
                    />
                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={[
                          "text-[0.85rem] font-medium leading-snug",
                          task.done ? "text-slate line-through" : "text-ink",
                        ].join(" ")}
                      >
                        {task.text}
                      </p>
                      <p className="mt-0.5 text-[0.72rem] text-slate">
                        {task.label}
                      </p>
                    </div>
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                      aria-label="Mark done"
                      className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-ink"
                    />
                  </div>
                  {!task.done && (
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="ml-5 inline-flex w-fit items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[0.76rem] font-semibold text-white transition-colors hover:bg-ink/80"
                    >
                      Do it <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </Panel>

        {/* Response Time Widget */}
        <Panel className="px-5 py-4">
          <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate">
            Response time
          </p>
          <div className="mt-2 flex items-end gap-2">
            <span className={["font-display text-4xl leading-none tabular-nums", respColor].join(" ")}>
              {agentMins}
            </span>
            <span className="mb-0.5 text-[0.85rem] text-slate">min</span>
          </div>
          <p className="mt-1 text-[0.72rem] text-slate">Your avg response</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-[0.72rem] text-slate/70">
              Team avg:{" "}
              <span className="font-semibold text-ink">{teamAvg}m</span>
            </p>
            {ratio <= 1 && (
              <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-[0.66rem] font-semibold text-success ring-1 ring-inset ring-success/20">
                {Math.round(teamAvg - agentMins)}m faster
              </span>
            )}
            {ratio > 1 && ratio <= 2 && (
              <span className="rounded-full bg-warn/10 px-2.5 py-0.5 text-[0.66rem] font-semibold text-warn ring-1 ring-inset ring-warn/20">
                {Math.round(agentMins - teamAvg)}m slower
              </span>
            )}
            {ratio > 2 && (
              <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-[0.66rem] font-semibold text-danger ring-1 ring-inset ring-danger/20">
                {Math.round(agentMins - teamAvg)}m above avg
              </span>
            )}
          </div>
        </Panel>

        {/* Appointments Today */}
        <Panel>
          <PanelHeader
            title="Appointments today"
            icon={<Calendar className="h-4 w-4" />}
            subtitle={`${appointments.length} scheduled`}
          />
          <ul className="divide-y divide-ink/[0.06]">
            {appointments.map((appt, i) => (
              <li key={i} className="flex items-start gap-3 px-5 py-3.5">
                {/* Time */}
                <div className="w-[4.5rem] shrink-0 text-right">
                  <span className="text-[0.76rem] font-semibold tabular-nums text-slate">
                    {appt.time}
                  </span>
                </div>
                {/* Divider dot */}
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ink/15" />
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-[0.85rem] font-semibold leading-snug text-ink">
                    {appt.client}
                  </p>
                  <p className="mt-0.5 text-[0.72rem] text-slate">{appt.note}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Pill tone={appt.tone}>{appt.type}</Pill>
                    {appt.type === "Call" && (
                      <a
                        href="tel:"
                        className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-azure hover:underline"
                      >
                        <Phone className="h-3 w-3" /> Dial
                      </a>
                    )}
                    {appt.type !== "Call" && (
                      <a
                        href="mailto:"
                        className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-azure hover:underline"
                      >
                        <Mail className="h-3 w-3" /> Prep
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* ── Right column: hot leads + pipeline ── */}
      <div className="space-y-5 lg:col-span-2">
        {/* Hot Leads */}
        <Panel>
          <PanelHeader
            title="Leads needing attention"
            icon={<Flame className="h-4 w-4" />}
            subtitle={`${attentionLeads.length} lead${attentionLeads.length !== 1 ? "s" : ""} sorted by days since contact`}
          />
          <div className="divide-y divide-ink/[0.06]">
            {attentionLeads.length === 0 ? (
              <p className="px-5 py-6 text-center text-[0.85rem] text-slate">
                All leads are up to date.
              </p>
            ) : (
              attentionLeads.map((lead) => {
                const scoreColor =
                  lead.score >= 85
                    ? "success"
                    : lead.score >= 70
                      ? "warn"
                      : "neutral";
                return (
                  <div
                    key={lead.id}
                    className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center"
                  >
                    {/* Avatar */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-[0.72rem] font-semibold text-white">
                      {initials(lead.name)}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[0.85rem] font-semibold text-ink">
                          {lead.name}
                        </span>
                        <Pill tone="neutral">{lead.source}</Pill>
                        <Pill tone={scoreColor as "success" | "warn" | "neutral"}>
                          {lead.score}
                        </Pill>
                        {lead.lastContactDaysAgo >= 7 && (
                          <Pill tone="danger">
                            {lead.lastContactDaysAgo}d no contact
                          </Pill>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[0.78rem] text-slate">
                        {lead.nextBestAction ?? `Last contact: ${daysLabel(-lead.lastContactDaysAgo)}`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 gap-2">
                      <a
                        href={`tel:${lead.phone}`}
                        className="rounded-xl border border-ink/[0.08] px-4 py-2 text-[0.85rem] font-medium text-ink hover:bg-ink/[0.04]"
                      >
                        Call
                      </a>
                      <a
                        href={`mailto:${lead.email}`}
                        className="rounded-xl border border-ink/[0.08] px-4 py-2 text-[0.85rem] font-medium text-ink hover:bg-ink/[0.04]"
                      >
                        Email
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Panel>

        {/* My Pipeline */}
        <Panel>
          <PanelHeader
            title="Active transactions"
            icon={<TrendingUp className="h-4 w-4" />}
            subtitle={
              pipelineItems.length > 0
                ? `${pipelineItems.length} deal${pipelineItems.length !== 1 ? "s" : ""} in pipeline`
                : "No active transactions"
            }
          />
          <div className="divide-y divide-ink/[0.06]">
            {pipelineItems.length === 0 ? (
              <p className="px-5 py-8 text-center text-[0.85rem] text-slate">
                No active transactions — time to build pipeline.
              </p>
            ) : (
              pipelineItems.map((tx) => (
                <div key={tx.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[0.85rem] font-semibold text-ink">
                        {tx.address}
                      </p>
                      <p className="mt-0.5 text-[0.72rem] text-slate">
                        {tx.client} · {tx.type}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      <Pill tone={stageTone(tx.stage)}>{tx.stage}</Pill>
                      {tx.riskFlag && (
                        <Pill tone="danger">{tx.riskFlag}</Pill>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={tx.progress} tone={tx.riskFlag ? "danger" : "azure"} />
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[0.72rem] text-slate">
                        {tx.progress}% complete
                      </span>
                      <span className="text-[0.72rem] text-slate">
                        Closes{" "}
                        <span className="font-medium text-ink">
                          {daysLabel(tx.closeDateDaysOut)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
