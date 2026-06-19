"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  Flame,
  CheckCircle2,
  Circle,
  ArrowRight,
  Target,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Panel, PanelHeader, Pill } from "@/components/command/ui";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────────────────── */

type Priority = "high" | "mid" | "low";

interface Task {
  id: string;
  priority: Priority;
  bold: string;
  detail: string;
  href: string;
  done: boolean;
}

interface HotLead {
  id: string;
  name: string;
  source: string;
  budget: string;
  lastContact: string;
  nextAction: string;
  phone: string;
}

interface Deal {
  id: string;
  address: string;
  stage: "Active" | "Under Contract" | "Closing Soon";
  nextDeadline: string;
  daysToClose: number;
  client: string;
}

interface Appointment {
  time: string;
  type: "Call" | "Showing" | "Consultation" | "Listing Appointment";
  client: string;
  phone: string;
  note: string;
}

/* ─── Static demo data ───────────────────────────────────────────────────── */

const INITIAL_TASKS: Task[] = [
  {
    id: "t1",
    priority: "high",
    bold: "Call Sarah M.",
    detail: "Zillow lead · No response to 2 texts (3 days ago)",
    href: "/hub/crm",
    done: false,
  },
  {
    id: "t2",
    priority: "high",
    bold: "Send buyer agreement to Torres family",
    detail: "Meeting was yesterday — unsigned agreement blocks the showing",
    href: "/hub/buyer-agreements",
    done: false,
  },
  {
    id: "t3",
    priority: "mid",
    bold: "Schedule showing for Kim Tran",
    detail: "Interested in West Linn 4BR · Available this weekend",
    href: "/hub/crm",
    done: false,
  },
  {
    id: "t4",
    priority: "mid",
    bold: "Follow up: Harrison listing",
    detail: "Offer expires today — confirm buyer intent before 5 PM",
    href: "/hub/transactions",
    done: false,
  },
  {
    id: "t5",
    priority: "low",
    bold: "Review CMA draft for Chen family",
    detail: "Meeting at 2 PM — CMA was auto-generated, verify comps",
    href: "/hub/ai/cma",
    done: false,
  },
  {
    id: "t6",
    priority: "low",
    bold: "Log notes from last night's showing",
    detail: "1204 NW Lovejoy — clients left with questions about HOA",
    href: "/hub/crm",
    done: false,
  },
];

const HOT_LEADS: HotLead[] = [
  {
    id: "l1",
    name: "Sarah Mitchell",
    source: "Zillow",
    budget: "$650k–$800k",
    lastContact: "3 days ago",
    nextAction: "Call now — missed 2 texts",
    phone: "+15035550001",
  },
  {
    id: "l2",
    name: "Derek & Pam Okafor",
    source: "Referral",
    budget: "$900k–$1.1M",
    lastContact: "1 day ago",
    nextAction: "Confirm weekend showing",
    phone: "+15035550002",
  },
  {
    id: "l3",
    name: "Rina Tanaka",
    source: "Website",
    budget: "$550k–$700k",
    lastContact: "2 days ago",
    nextAction: "Text listing recommendations",
    phone: "+15035550003",
  },
];

const DEALS: Deal[] = [
  {
    id: "d1",
    address: "8457 NW Lakeshore Dr",
    stage: "Closing Soon",
    nextDeadline: "Closing Thu Jun 20",
    daysToClose: 2,
    client: "Harrison family",
  },
  {
    id: "d2",
    address: "1204 NW Lovejoy St",
    stage: "Under Contract",
    nextDeadline: "Inspection Jun 22",
    daysToClose: 9,
    client: "Chen family",
  },
  {
    id: "d3",
    address: "714 SE Morrison Ave",
    stage: "Active",
    nextDeadline: "Offer review Jun 25",
    daysToClose: 18,
    client: "Torres family",
  },
];

const APPOINTMENTS: Appointment[] = [
  {
    time: "9:00 AM",
    type: "Call",
    client: "Sarah Mitchell",
    phone: "+15035550001",
    note: "West Linn — Zillow lead, 2nd follow-up",
  },
  {
    time: "11:30 AM",
    type: "Showing",
    client: "Derek & Pam Okafor",
    phone: "+15035550002",
    note: "4BR Sellwood bungalow — active buyers",
  },
  {
    time: "2:00 PM",
    type: "Consultation",
    client: "Chen family",
    phone: "+15035550003",
    note: "CMA review before listing conversation",
  },
  {
    time: "4:30 PM",
    type: "Listing Appointment",
    client: "Rina Tanaka",
    phone: "+15035550004",
    note: "Milwaukie — motivated to sell within 60 days",
  },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const PRIORITY_DOT: Record<Priority, string> = {
  high: "bg-red-500",
  mid: "bg-amber-400",
  low: "bg-emerald-400",
};

const STAGE_PILL: Record<Deal["stage"], "azure" | "warn" | "success"> = {
  Active: "azure",
  "Under Contract": "warn",
  "Closing Soon": "success",
};

const APPT_PILL: Record<Appointment["type"], "azure" | "warn" | "success" | "neutral"> = {
  Call: "azure",
  Showing: "success",
  Consultation: "neutral",
  "Listing Appointment": "warn",
};

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function TaskCard({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: (id: string) => void;
}) {
  return (
    <div
      className={[
        "flex items-start gap-3 rounded-xl border p-4 transition-all",
        task.done
          ? "border-ink/[0.06] bg-ink/[0.02] opacity-50"
          : "border-ink/[0.08] bg-white hover:border-azure/30",
      ].join(" ")}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        aria-label={task.done ? "Mark incomplete" : "Mark complete"}
        className="mt-0.5 shrink-0 text-slate transition-colors hover:text-ink"
      >
        {task.done ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      {/* Priority dot */}
      <span
        className={[
          "mt-[5px] h-2.5 w-2.5 shrink-0 rounded-full",
          PRIORITY_DOT[task.priority],
        ].join(" ")}
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={[
            "text-[0.88rem] font-semibold leading-snug",
            task.done ? "text-slate line-through" : "text-ink",
          ].join(" ")}
        >
          {task.bold}
        </p>
        <p className="mt-0.5 text-[0.76rem] text-slate">{task.detail}</p>
      </div>

      {/* Action link */}
      {!task.done && (
        <Link
          href={task.href}
          className="ml-1 shrink-0 inline-flex items-center gap-0.5 text-[0.76rem] font-semibold text-azure transition-colors hover:text-azure/70 hover:underline"
        >
          Do it
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function LeadCard({ lead }: { lead: HotLead }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border-l-4 border-l-red-400 bg-white p-4 shadow-sm ring-1 ring-inset ring-ink/[0.06]">
      <div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[0.9rem] font-semibold text-ink">{lead.name}</span>
          <Pill tone="neutral">{lead.source}</Pill>
        </div>
        <p className="mt-1 text-[0.76rem] text-slate">
          Budget: <span className="font-medium text-ink">{lead.budget}</span>
        </p>
        <p className="mt-0.5 text-[0.76rem] text-slate">
          Last contact: <span className="font-medium text-ink">{lead.lastContact}</span>
        </p>
      </div>
      <p className="rounded-lg bg-ink/[0.04] px-2.5 py-1.5 text-[0.76rem] font-medium text-ink ring-1 ring-inset ring-ink/[0.06]">
        <Target className="mr-1 inline h-3.5 w-3.5 text-azure" />
        {lead.nextAction}
      </p>
      <div className="flex gap-2">
        <a
          href={`tel:${lead.phone}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-[0.78rem] font-semibold text-white transition-colors hover:bg-ink/80"
        >
          <Phone className="h-3.5 w-3.5" />
          Call now
        </a>
        <a
          href={`sms:${lead.phone}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink/[0.12] px-3 py-2 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-ink/[0.04]"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Text
        </a>
      </div>
    </div>
  );
}

function DaysToCloseChip({ days }: { days: number }) {
  const cls =
    days <= 3
      ? "bg-red-50 text-red-700 ring-red-200"
      : days <= 10
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-slate-50 text-slate-600 ring-slate-200";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ring-1 ring-inset",
        cls,
      )}
    >
      {days}d to close
    </span>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-ink/[0.08] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[0.85rem] font-semibold text-ink">{deal.address}</p>
          <p className="mt-0.5 text-[0.73rem] text-slate">{deal.client}</p>
        </div>
        <Pill tone={STAGE_PILL[deal.stage]}>{deal.stage}</Pill>
      </div>
      <div className="flex items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2">
        <p className="text-[0.73rem] text-slate">
          <Calendar className="mr-1 inline h-3.5 w-3.5 text-slate/60" />
          {deal.nextDeadline}
        </p>
        <DaysToCloseChip days={deal.daysToClose} />
      </div>
    </div>
  );
}

function ApptRow({ appt }: { appt: Appointment }) {
  return (
    <li className="flex items-start gap-3 px-5 py-3.5">
      {/* Time — bold and fixed-width */}
      <div className="w-[4.5rem] shrink-0 text-right">
        <span className="text-[0.8rem] font-bold tabular-nums text-ink">{appt.time}</span>
      </div>
      {/* Dot */}
      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-ink/20" />
      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[0.85rem] font-semibold leading-snug text-ink">{appt.client}</p>
          <Pill tone={APPT_PILL[appt.type]}>{appt.type}</Pill>
        </div>
        <p className="mt-0.5 text-[0.73rem] text-slate">{appt.note}</p>
        {(appt.type === "Call" || appt.type === "Showing") && (
          <a
            href={`tel:${appt.phone}`}
            className="mt-1 inline-flex items-center gap-1 text-[0.72rem] font-medium text-azure transition-colors hover:underline"
          >
            <Phone className="h-3 w-3" />
            Dial
          </a>
        )}
      </div>
    </li>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export default function AgentWorkspace() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  const pendingCount = tasks.filter((t) => !t.done).length;
  const hotCount = HOT_LEADS.length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 md:px-6 md:py-8">

      {/* ── 1. Greeting header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate/50">
            {todayLabel()}
          </p>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">
            Good morning, Jordan.
          </h1>
          <p className="mt-1.5 text-[0.9rem] text-slate">
            You have{" "}
            <span className="font-semibold text-danger">{hotCount} hot lead{hotCount !== 1 ? "s" : ""}</span>
            {" "}and{" "}
            <span className="font-semibold text-ink">{pendingCount} task{pendingCount !== 1 ? "s" : ""}</span>
            {" "}due today.
          </p>
        </div>

        {/* Response time badges */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <p className="text-[0.64rem] font-semibold uppercase tracking-wider text-slate/50">
            Response time
          </p>
          <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-[0.76rem] font-semibold text-success ring-1 ring-inset ring-success/20">
            <Clock className="h-3.5 w-3.5" />
            You: 4 min avg
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-ink/[0.05] px-3 py-1.5 text-[0.76rem] font-medium text-slate ring-1 ring-inset ring-ink/[0.08]">
            Team: 18 min avg
          </span>
        </div>
      </div>

      {/* ── 2. Today's priority list ───────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-display text-[1.05rem] font-semibold text-ink">Today&rsquo;s priorities</h2>
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-ink px-1.5 text-[0.64rem] font-bold text-white">
            {pendingCount}
          </span>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onToggle={toggleTask} />
          ))}
        </div>
      </section>

      {/* ── 3. Hot leads panel ────────────────────────────────────────────── */}
      <section>
        <Panel>
          <PanelHeader
            title="Hot leads"
            icon={<Flame className="h-4 w-4" />}
            subtitle={`${HOT_LEADS.length} leads need a response today`}
            action={
              <Link
                href="/hub/crm"
                className="rounded-lg border border-ink/[0.1] px-3 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-ink/[0.04]"
              >
                View all
              </Link>
            }
          />
          {HOT_LEADS.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
              <Target className="h-8 w-8 text-slate/30" />
              <p className="text-[0.88rem] text-slate">No hot leads right now — great work.</p>
              <Link
                href="/hub/crm"
                className="rounded-lg bg-ink px-4 py-2 text-[0.82rem] font-semibold text-white transition-colors hover:bg-ink/80"
              >
                View all leads
              </Link>
            </div>
          ) : (
          <div className="flex gap-4 overflow-x-auto p-5 sm:grid sm:grid-cols-3 sm:overflow-visible">
            {HOT_LEADS.map((lead) => (
              <div key={lead.id} className="min-w-[75vw] sm:min-w-[320px]">
                <LeadCard lead={lead} />
              </div>
            ))}
          </div>
          )}
        </Panel>
      </section>

      {/* ── 4 + 5. My pipeline + Appointments (two-column on lg) ─────────── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* My pipeline */}
        <Panel>
          <PanelHeader
            title="My active transactions"
            icon={<TrendingUp className="h-4 w-4" />}
            subtitle={`${DEALS.length} deals in flight`}
            action={
              <Link
                href="/hub/transactions"
                className="rounded-lg border border-ink/[0.1] px-3 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-ink/[0.04]"
              >
                See all
              </Link>
            }
          />
          <div className="grid gap-3 p-5 sm:grid-cols-1">
            {DEALS.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </Panel>

        {/* Appointments today */}
        <Panel>
          <PanelHeader
            title="Appointments today"
            icon={<Calendar className="h-4 w-4" />}
            subtitle={`${APPOINTMENTS.length} scheduled`}
          />
          {APPOINTMENTS.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
              <AlertCircle className="h-8 w-8 text-slate/40" />
              <p className="text-[0.88rem] text-slate">No appointments scheduled today.</p>
              <Link
                href="/hub/crm"
                className="rounded-lg bg-ink px-4 py-2 text-[0.82rem] font-semibold text-white transition-colors hover:bg-ink/80"
              >
                Call a lead
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-ink/[0.06]">
              {APPOINTMENTS.map((appt, i) => (
                <ApptRow key={i} appt={appt} />
              ))}
            </ul>
          )}
        </Panel>
      </div>

    </div>
  );
}
