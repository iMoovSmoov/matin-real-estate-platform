"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
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
  Sparkles,
  ChevronRight,
  X,
  Copy,
  Check,
  Loader2,
  PhoneCall,
  FileText,
} from "lucide-react";
import { Panel, PanelHeader, StatTile, Pill, SectionLabel } from "@/components/command/ui";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { streamAi, type AiRequest } from "@/lib/ai/client";
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

/* ─── AI stream hook ─────────────────────────────────────────────────────── */

function useAiStream() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (req: AiRequest) => {
    setText("");
    setLoading(true);
    setError(null);
    try {
      await streamAi(req, (_chunk, full) => {
        setText(full);
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { text, loading, error, run };
}

/* ─── SlideOver primitive ────────────────────────────────────────────────── */

function SlideOver({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm"
      />
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-2xl sm:max-w-[480px] border-l border-ink/[0.08]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-ink/[0.08] px-5 py-4">
          <p className="font-semibold text-ink truncate pr-4">{title}</p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-slate hover:bg-ink/[0.05] hover:text-ink transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </>
  );
}

/* ─── Skeleton shimmer ───────────────────────────────────────────────────── */

function AiSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 animate-pulse rounded bg-ink/10",
            i === lines - 1 ? "w-3/4" : "w-full",
          )}
        />
      ))}
    </div>
  );
}

/* ─── Task SlideOver ─────────────────────────────────────────────────────── */

function TaskSlideOver({
  task,
  open,
  onClose,
  onToggle,
}: {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onToggle: (id: string) => void;
}) {
  const { text, loading, run } = useAiStream();

  useEffect(() => {
    if (open && task) {
      run({
        tool: "task_coach",
        input: { taskBold: task.bold, taskDetail: task.detail, href: task.href },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id]);

  if (!task) return null;

  return (
    <SlideOver open={open} onClose={onClose} title={task.bold}>
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-xl text-ink">{task.bold}</h2>
          <p className="mt-1 text-sm text-slate">{task.detail}</p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn("h-2.5 w-2.5 rounded-full shrink-0", PRIORITY_DOT[task.priority])}
            />
            <span className="text-[0.72rem] font-semibold uppercase tracking-wide text-slate">
              {task.priority === "high" ? "High priority" : task.priority === "mid" ? "Medium priority" : "Low priority"}
            </span>
          </div>
        </div>

        <a
          href={task.href}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-[0.88rem] font-semibold text-white transition-colors hover:bg-ink/80"
        >
          Open in tool
          <ArrowRight className="h-4 w-4" />
        </a>

        <button
          onClick={() => {
            onToggle(task.id);
            onClose();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink/[0.12] py-3 text-[0.88rem] font-semibold text-ink transition-colors hover:bg-ink/[0.04]"
        >
          <CheckCircle2 className="h-4 w-4 text-success" />
          Mark done &amp; close
        </button>

        <div className="border-t border-ink/[0.08] pt-4">
          <SectionLabel className="mb-3">AI coaching</SectionLabel>
          {loading && !text ? (
            <AiSkeleton lines={3} />
          ) : text ? (
            <div className="rounded-xl border border-ink/[0.08] bg-[#f4f4f3] p-4">
              <AiMarkdown text={text} />
            </div>
          ) : null}
        </div>
      </div>
    </SlideOver>
  );
}

/* ─── Lead Call SlideOver ────────────────────────────────────────────────── */

function LeadCallSlideOver({
  lead,
  open,
  onClose,
}: {
  lead: HotLead | null;
  open: boolean;
  onClose: () => void;
}) {
  const [noteText, setNoteText] = useState("");
  const [savedNotes, setSavedNotes] = useState<Array<{ text: string; time: string }>>([]);

  function saveNote() {
    if (!noteText.trim()) return;
    setSavedNotes((prev) => [
      ...prev,
      { text: noteText.trim(), time: new Date().toLocaleTimeString() },
    ]);
    setNoteText("");
  }

  if (!lead) return null;

  return (
    <SlideOver open={open} onClose={onClose} title={`Call ${lead.name}`}>
      <div className="space-y-4">
        {/* Lead context strip */}
        <div className="rounded-xl border border-ink/[0.08] bg-[#f4f4f3] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">{lead.name}</span>
            <Pill tone="neutral">{lead.source}</Pill>
          </div>
          <p className="mt-1 text-[0.78rem] text-slate">
            Budget: <span className="font-medium text-ink">{lead.budget}</span>
          </p>
          <p className="text-[0.78rem] text-slate">
            Last contact: <span className="font-medium text-ink">{lead.lastContact}</span>
          </p>
        </div>

        {/* Dial button */}
        <a
          href={`tel:${lead.phone}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-[0.9rem] font-semibold text-white transition-colors hover:bg-ink/80"
        >
          <PhoneCall className="h-4 w-4" />
          Dial {lead.phone}
        </a>

        {/* Log this call */}
        <div className="space-y-2">
          <SectionLabel>Log this call</SectionLabel>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="What happened? Key details..."
            rows={3}
            className="w-full resize-none rounded-xl border border-ink/[0.12] bg-white p-3 text-[0.88rem] text-ink placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-ink/20"
          />
          <button
            onClick={saveNote}
            disabled={!noteText.trim()}
            className="flex items-center gap-1.5 rounded-lg border border-ink/[0.12] bg-ink/[0.04] px-4 py-2 text-[0.82rem] font-semibold text-ink transition-colors hover:bg-ink/[0.08] disabled:opacity-40"
          >
            Save note
          </button>
        </div>

        {/* Call log */}
        {savedNotes.length > 0 && (
          <div className="space-y-2">
            <SectionLabel>Call log</SectionLabel>
            {savedNotes.map((note, i) => (
              <div key={i} className="rounded-lg border border-ink/[0.08] bg-[#f4f4f3] p-3">
                <SectionLabel className="mb-1">{note.time}</SectionLabel>
                <p className="text-[0.85rem] text-ink">{note.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </SlideOver>
  );
}

/* ─── Lead Text SlideOver ────────────────────────────────────────────────── */

function LeadTextSlideOver({
  lead,
  open,
  onClose,
}: {
  lead: HotLead | null;
  open: boolean;
  onClose: () => void;
}) {
  const [draftText, setDraftText] = useState("");
  const { loading, run } = useAiStream();

  async function handleAiDraft() {
    if (!lead) return;
    await streamAi(
      {
        tool: "sms_draft",
        input: {
          leadName: lead.name,
          source: lead.source,
          budget: lead.budget,
          lastContact: lead.lastContact,
          nextAction: lead.nextAction,
        },
      },
      (_chunk, full) => {
        setDraftText(full);
      },
    );
  }

  if (!lead) return null;

  return (
    <SlideOver open={open} onClose={onClose} title={`Text ${lead.name}`}>
      <div className="space-y-4">
        {/* Lead context strip */}
        <div className="rounded-xl border border-ink/[0.08] bg-[#f4f4f3] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">{lead.name}</span>
            <Pill tone="neutral">{lead.source}</Pill>
          </div>
          <p className="mt-1 text-[0.78rem] text-slate">
            Budget: <span className="font-medium text-ink">{lead.budget}</span>
          </p>
          <p className="text-[0.78rem] text-slate">
            Last contact: <span className="font-medium text-ink">{lead.lastContact}</span>
          </p>
          <p className="mt-1 text-[0.78rem] text-slate">
            Next: <span className="font-medium text-ink">{lead.nextAction}</span>
          </p>
        </div>

        {/* Compose area */}
        <textarea
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          placeholder="Write your message..."
          rows={5}
          className="w-full resize-none rounded-xl border border-ink/[0.12] bg-white p-3 text-[0.88rem] text-ink placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-ink/20"
        />

        <div className="flex gap-2">
          <button
            onClick={handleAiDraft}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink/[0.12] bg-ink/[0.04] py-2.5 text-[0.82rem] font-semibold text-ink transition-colors hover:bg-ink/[0.08] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            AI Draft — fill for me
          </button>
          <a
            href={`sms:${lead.phone}${draftText ? `&body=${encodeURIComponent(draftText)}` : ""}`}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[0.82rem] font-semibold transition-colors",
              draftText.trim()
                ? "bg-ink text-white hover:bg-ink/80"
                : "pointer-events-none bg-ink/30 text-white/60",
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Send text
          </a>
        </div>
      </div>
    </SlideOver>
  );
}

/* ─── Lead AI Reply SlideOver ────────────────────────────────────────────── */

function LeadAiSlideOver({
  lead,
  open,
  onClose,
}: {
  lead: HotLead | null;
  open: boolean;
  onClose: () => void;
}) {
  const { text, loading, run } = useAiStream();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && lead) {
      run({
        tool: "lead_reply",
        input: {
          leadName: lead.name,
          source: lead.source,
          budget: lead.budget,
          lastContact: lead.lastContact,
          nextAction: lead.nextAction,
          phone: lead.phone,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead?.id]);

  function handleCopy() {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!lead) return null;

  return (
    <SlideOver open={open} onClose={onClose} title={`AI Reply — ${lead.name}`}>
      <div className="space-y-4">
        {/* Lead context strip */}
        <div className="rounded-xl border border-ink/[0.08] bg-[#f4f4f3] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">{lead.name}</span>
            <Pill tone="neutral">{lead.source}</Pill>
          </div>
          <p className="mt-1 text-[0.78rem] text-slate">
            Budget: <span className="font-medium text-ink">{lead.budget}</span>
          </p>
          <p className="text-[0.78rem] text-slate">
            Last contact: <span className="font-medium text-ink">{lead.lastContact}</span>
          </p>
          <p className="mt-1 text-[0.78rem] text-slate">
            Next: <span className="font-medium text-ink">{lead.nextAction}</span>
          </p>
        </div>

        <SectionLabel>AI-generated reply</SectionLabel>

        {loading && !text ? (
          <AiSkeleton lines={4} />
        ) : text ? (
          <div className="rounded-xl border border-ink/[0.08] bg-[#f4f4f3] p-4">
            <AiMarkdown text={text} />
          </div>
        ) : null}

        {text && (
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink/[0.12] bg-ink/[0.04] py-2.5 text-[0.82rem] font-semibold text-ink transition-colors hover:bg-ink/[0.08]"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
            <a
              href={`sms:${lead.phone}&body=${encodeURIComponent(text)}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink py-2.5 text-[0.82rem] font-semibold text-white transition-colors hover:bg-ink/80"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Open text thread
            </a>
          </div>
        )}
      </div>
    </SlideOver>
  );
}

/* ─── Deal SlideOver ─────────────────────────────────────────────────────── */

const DEAL_MILESTONES: Record<string, Array<{ label: string; date: string }>> = {
  d1: [
    { label: "Final walkthrough", date: "Jun 19" },
    { label: "Closing", date: "Jun 20" },
  ],
  d2: [
    { label: "Inspection", date: "Jun 22" },
    { label: "Repair request deadline", date: "Jun 24" },
    { label: "Closing", date: "Jul 7" },
  ],
  d3: [
    { label: "Offer review", date: "Jun 25" },
    { label: "Inspection (est.)", date: "Jul 1" },
    { label: "Closing (est.)", date: "Jul 15" },
  ],
};

function DealSlideOver({
  deal,
  open,
  onClose,
}: {
  deal: Deal | null;
  open: boolean;
  onClose: () => void;
}) {
  const { text, loading, run } = useAiStream();
  const [briefGenerated, setBriefGenerated] = useState(false);

  function generateBrief() {
    if (!deal) return;
    setBriefGenerated(true);
    run({
      tool: "deal_brief",
      input: {
        address: deal.address,
        stage: deal.stage,
        nextDeadline: deal.nextDeadline,
        daysToClose: deal.daysToClose,
        client: deal.client,
      },
    });
  }

  if (!deal) return null;

  const milestones = DEAL_MILESTONES[deal.id] ?? [];

  return (
    <SlideOver open={open} onClose={onClose} title="Deal details">
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-xl text-ink">{deal.address}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-[0.85rem] text-slate">{deal.client}</span>
            <Pill tone={STAGE_PILL[deal.stage]}>{deal.stage}</Pill>
            <DaysToCloseChip days={deal.daysToClose} />
          </div>
        </div>

        {/* Milestones */}
        {milestones.length > 0 && (
          <div className="space-y-2">
            <SectionLabel>Milestones</SectionLabel>
            {milestones.map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-ink/[0.07] bg-[#f4f4f3] px-3 py-2"
              >
                <Calendar className="h-3.5 w-3.5 shrink-0 text-slate/60" />
                <span className="text-[0.82rem] font-medium text-ink">{m.label}</span>
                <span className="ml-auto text-[0.78rem] text-slate">{m.date}</span>
              </div>
            ))}
          </div>
        )}

        {/* AI deal brief */}
        <div className="space-y-2">
          <SectionLabel>AI deal brief</SectionLabel>
          {!briefGenerated ? (
            <button
              onClick={generateBrief}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink/[0.12] bg-ink/[0.04] py-2.5 text-[0.85rem] font-semibold text-ink transition-colors hover:bg-ink/[0.08]"
            >
              <Sparkles className="h-4 w-4" />
              Generate deal summary
            </button>
          ) : loading && !text ? (
            <AiSkeleton lines={4} />
          ) : text ? (
            <>
              <div className="rounded-xl border border-ink/[0.08] bg-[#f4f4f3] p-4">
                <AiMarkdown text={text} />
              </div>
              <button
                onClick={generateBrief}
                className="flex items-center gap-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:text-ink"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Regenerate
              </button>
            </>
          ) : null}
        </div>

        <Link
          href="/hub/transactions"
          className="flex items-center gap-1.5 text-[0.82rem] font-medium text-azure transition-colors hover:underline"
        >
          Go to full transaction
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </SlideOver>
  );
}

/* ─── Appointment Prep SlideOver ─────────────────────────────────────────── */

function ApptPrepSlideOver({
  appt,
  open,
  onClose,
}: {
  appt: Appointment | null;
  open: boolean;
  onClose: () => void;
}) {
  const { text, loading, run } = useAiStream();
  const [noteText, setNoteText] = useState("");
  const [savedNotes, setSavedNotes] = useState<Array<{ text: string; time: string }>>([]);

  useEffect(() => {
    if (open && appt) {
      run({
        tool: "appt_prep",
        input: {
          clientName: appt.client,
          appointmentType: appt.type,
          time: appt.time,
          note: appt.note,
          phone: appt.phone,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appt?.client]);

  function saveNote() {
    if (!noteText.trim()) return;
    setSavedNotes((prev) => [
      ...prev,
      { text: noteText.trim(), time: new Date().toLocaleTimeString() },
    ]);
    setNoteText("");
  }

  if (!appt) return null;

  return (
    <SlideOver open={open} onClose={onClose} title={`Pre-meeting brief — ${appt.client}`}>
      <div className="space-y-4">
        {/* Context strip */}
        <div className="rounded-xl border border-ink/[0.08] bg-[#f4f4f3] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">{appt.client}</span>
            <Pill tone={APPT_PILL[appt.type]}>{appt.type}</Pill>
          </div>
          <p className="mt-1 text-[0.78rem] text-slate">
            Time: <span className="font-medium text-ink">{appt.time}</span>
          </p>
          <p className="mt-0.5 text-[0.78rem] text-slate">{appt.note}</p>
        </div>

        {/* AI pre-meeting brief */}
        <div className="space-y-2">
          <SectionLabel>Pre-meeting brief</SectionLabel>
          {loading && !text ? (
            <AiSkeleton lines={5} />
          ) : text ? (
            <div className="rounded-xl border border-ink/[0.08] bg-[#f4f4f3] p-4">
              <AiMarkdown text={text} />
            </div>
          ) : null}
        </div>

        <div className="border-t border-ink/[0.08] pt-4 space-y-2">
          <SectionLabel>Your notes</SectionLabel>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note before the meeting..."
            rows={3}
            className="w-full resize-none rounded-xl border border-ink/[0.12] bg-white p-3 text-[0.88rem] text-ink placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-ink/20"
          />
          <button
            onClick={saveNote}
            disabled={!noteText.trim()}
            className="flex items-center gap-1.5 rounded-lg border border-ink/[0.12] bg-ink/[0.04] px-4 py-2 text-[0.82rem] font-semibold text-ink transition-colors hover:bg-ink/[0.08] disabled:opacity-40"
          >
            Save
          </button>

          {savedNotes.length > 0 && (
            <div className="space-y-2 pt-1">
              {savedNotes.map((note, i) => (
                <div key={i} className="rounded-lg border border-ink/[0.08] bg-[#f4f4f3] p-3">
                  <SectionLabel className="mb-1">{note.time}</SectionLabel>
                  <p className="text-[0.85rem] text-ink">{note.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SlideOver>
  );
}

/* ─── Appt Call SlideOver ────────────────────────────────────────────────── */

function ApptCallSlideOver({
  appt,
  open,
  onClose,
}: {
  appt: Appointment | null;
  open: boolean;
  onClose: () => void;
}) {
  const [noteText, setNoteText] = useState("");
  const [savedNotes, setSavedNotes] = useState<Array<{ text: string; time: string }>>([]);

  function saveNote() {
    if (!noteText.trim()) return;
    setSavedNotes((prev) => [
      ...prev,
      { text: noteText.trim(), time: new Date().toLocaleTimeString() },
    ]);
    setNoteText("");
  }

  if (!appt) return null;

  return (
    <SlideOver open={open} onClose={onClose} title={`Call — ${appt.client}`}>
      <div className="space-y-4">
        <div className="rounded-xl border border-ink/[0.08] bg-[#f4f4f3] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">{appt.client}</span>
            <Pill tone={APPT_PILL[appt.type]}>{appt.type}</Pill>
          </div>
          <p className="mt-1 text-[0.78rem] text-slate">
            Time: <span className="font-medium text-ink">{appt.time}</span>
          </p>
          <p className="mt-0.5 text-[0.78rem] text-slate">{appt.note}</p>
        </div>

        <a
          href={`tel:${appt.phone}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-[0.9rem] font-semibold text-white transition-colors hover:bg-ink/80"
        >
          <PhoneCall className="h-4 w-4" />
          Dial {appt.phone}
        </a>

        <div className="space-y-2">
          <SectionLabel>Log this call</SectionLabel>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="What happened? Key details..."
            rows={3}
            className="w-full resize-none rounded-xl border border-ink/[0.12] bg-white p-3 text-[0.88rem] text-ink placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-ink/20"
          />
          <button
            onClick={saveNote}
            disabled={!noteText.trim()}
            className="flex items-center gap-1.5 rounded-lg border border-ink/[0.12] bg-ink/[0.04] px-4 py-2 text-[0.82rem] font-semibold text-ink transition-colors hover:bg-ink/[0.08] disabled:opacity-40"
          >
            Save note
          </button>
        </div>

        {savedNotes.length > 0 && (
          <div className="space-y-2">
            <SectionLabel>Call log</SectionLabel>
            {savedNotes.map((note, i) => (
              <div key={i} className="rounded-lg border border-ink/[0.08] bg-[#f4f4f3] p-3">
                <SectionLabel className="mb-1">{note.time}</SectionLabel>
                <p className="text-[0.85rem] text-ink">{note.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </SlideOver>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function TaskCard({
  task,
  onToggle,
  onOpen,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onOpen: (task: Task) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 transition-all",
        task.done
          ? "border-ink/[0.06] bg-ink/[0.02] opacity-50"
          : "border-ink/[0.08] bg-white hover:border-azure/30",
      )}
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
        className={cn(
          "mt-[5px] h-2.5 w-2.5 shrink-0 rounded-full",
          PRIORITY_DOT[task.priority],
        )}
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[0.88rem] font-semibold leading-snug",
            task.done ? "text-slate line-through" : "text-ink",
          )}
        >
          {task.bold}
        </p>
        <p className="mt-0.5 text-[0.76rem] text-slate">{task.detail}</p>
      </div>

      {/* Action button — opens slide-over instead of navigating */}
      {!task.done && (
        <button
          onClick={() => onOpen(task)}
          className="ml-1 shrink-0 inline-flex items-center gap-0.5 text-[0.76rem] font-semibold text-azure transition-colors hover:text-azure/70 hover:underline"
        >
          Do it
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  onCall,
  onText,
  onAiReply,
}: {
  lead: HotLead;
  onCall: () => void;
  onText: () => void;
  onAiReply: () => void;
}) {
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
        <button
          onClick={onCall}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-[0.78rem] font-semibold text-white transition-colors hover:bg-ink/80"
        >
          <Phone className="h-3.5 w-3.5" />
          Call
        </button>
        <button
          onClick={onText}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink/[0.12] px-3 py-2 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-ink/[0.04]"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Text
        </button>
        <button
          onClick={onAiReply}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink/[0.08] bg-ink/[0.06] px-3 py-2 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-ink/[0.1]"
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI Reply
        </button>
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

function DealCard({
  deal,
  onOpen,
}: {
  deal: Deal;
  onOpen: (deal: Deal) => void;
}) {
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
      <button
        onClick={() => onOpen(deal)}
        className="flex items-center justify-end gap-1 text-[0.76rem] font-medium text-azure transition-colors hover:underline"
      >
        View details
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ApptRow({
  appt,
  onDial,
  onAiPrep,
}: {
  appt: Appointment;
  onDial: (appt: Appointment) => void;
  onAiPrep: (appt: Appointment) => void;
}) {
  const showAiPrep = appt.type === "Consultation" || appt.type === "Listing Appointment";

  return (
    <li className="flex items-start gap-3 px-5 py-3.5">
      {/* Time */}
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
        <div className="mt-1 flex flex-wrap items-center gap-3">
          {/* All types get Dial */}
          <button
            onClick={() => onDial(appt)}
            className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-azure transition-colors hover:underline"
          >
            <Phone className="h-3 w-3" />
            Dial
          </button>
          {/* Consultation and Listing Appointment get AI Prep */}
          {showAiPrep && (
            <button
              onClick={() => onAiPrep(appt)}
              className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-azure transition-colors hover:underline"
            >
              <FileText className="h-3 w-3" />
              AI Prep
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

type SlideOverState<T> = { open: boolean; item: T | null };

function initSO<T>(): SlideOverState<T> {
  return { open: false, item: null };
}

export default function AgentWorkspace() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  // Slide-over states
  const [taskSO, setTaskSO] = useState<SlideOverState<Task>>(initSO());
  const [leadCallSO, setLeadCallSO] = useState<SlideOverState<HotLead>>(initSO());
  const [leadTextSO, setLeadTextSO] = useState<SlideOverState<HotLead>>(initSO());
  const [leadAiSO, setLeadAiSO] = useState<SlideOverState<HotLead>>(initSO());
  const [dealSO, setDealSO] = useState<SlideOverState<Deal>>(initSO());
  const [apptDialSO, setApptDialSO] = useState<SlideOverState<Appointment>>(initSO());
  const [apptPrepSO, setApptPrepSO] = useState<SlideOverState<Appointment>>(initSO());

  // Section highlight state
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  const pendingCount = tasks.filter((t) => !t.done).length;

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setHighlightedSection(id);
      setTimeout(() => setHighlightedSection(null), 1500);
    }
  }

  function highlightClass(id: string) {
    return highlightedSection === id
      ? "ring-2 ring-ink/20 transition-all"
      : "transition-all";
  }

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
            <span className="font-semibold text-danger">
              {HOT_LEADS.length} hot lead{HOT_LEADS.length !== 1 ? "s" : ""}
            </span>
            {" "}and{" "}
            <span className="font-semibold text-ink">
              {pendingCount} task{pendingCount !== 1 ? "s" : ""}
            </span>
            {" "}due today.
          </p>
        </div>

        {/* Response time badges — vertical stack on mobile, row on sm+ */}
        <div className="flex shrink-0 flex-col gap-1.5 sm:items-end">
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

      {/* ── 2. KPI StatTile row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <button
          onClick={() => scrollToSection("hot-leads-section")}
          className="text-left focus:outline-none"
        >
          <StatTile
            label="Hot Leads"
            value={HOT_LEADS.length}
            icon={<Flame className="h-4 w-4" />}
            accent
          />
        </button>
        <button
          onClick={() => scrollToSection("tasks-section")}
          className="text-left focus:outline-none"
        >
          <StatTile
            label="Tasks Due"
            value={pendingCount}
            icon={<Circle className="h-4 w-4" />}
          />
        </button>
        <button
          onClick={() => scrollToSection("appts-section")}
          className="text-left focus:outline-none"
        >
          <StatTile
            label="Appts Today"
            value={APPOINTMENTS.length}
            icon={<Calendar className="h-4 w-4" />}
          />
        </button>
        <button
          onClick={() => scrollToSection("pipeline-section")}
          className="text-left focus:outline-none"
        >
          <StatTile
            label="Soonest Close"
            value={`${DEALS[0].daysToClose}d`}
            icon={<TrendingUp className="h-4 w-4" />}
            delta={{ value: "Jun 20", dir: "flat" }}
          />
        </button>
      </div>

      {/* ── 3. Today's priority list ───────────────────────────────────────── */}
      <section id="tasks-section">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-display text-[1.05rem] font-semibold text-ink">
            Today&rsquo;s priorities
          </h2>
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-ink px-1.5 text-[0.64rem] font-bold text-white">
            {pendingCount}
          </span>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onOpen={(t) => setTaskSO({ open: true, item: t })}
            />
          ))}
        </div>
      </section>

      {/* ── 4. Hot leads panel ────────────────────────────────────────────── */}
      <section id="hot-leads-section">
        <Panel className={highlightClass("hot-leads-section")}>
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
            <div className="flex gap-4 overflow-x-auto p-5 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
              {HOT_LEADS.map((lead) => (
                <div key={lead.id} className="min-w-[82vw] sm:min-w-0">
                  <LeadCard
                    lead={lead}
                    onCall={() => setLeadCallSO({ open: true, item: lead })}
                    onText={() => setLeadTextSO({ open: true, item: lead })}
                    onAiReply={() => setLeadAiSO({ open: true, item: lead })}
                  />
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>

      {/* ── 5 + 6. My pipeline + Appointments (two-column on lg) ─────────── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* My pipeline */}
        <div id="pipeline-section" className={highlightClass("pipeline-section")}>
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
            <div className="grid gap-3 p-5">
              {DEALS.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onOpen={(d) => setDealSO({ open: true, item: d })}
                />
              ))}
            </div>
          </Panel>
        </div>

        {/* Appointments today */}
        <div id="appts-section" className={highlightClass("appts-section")}>
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
                  <ApptRow
                    key={i}
                    appt={appt}
                    onDial={(a) => setApptDialSO({ open: true, item: a })}
                    onAiPrep={(a) => setApptPrepSO({ open: true, item: a })}
                  />
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {/* ── Slide-overs ──────────────────────────────────────────────────── */}

      {taskSO.open && (
        <TaskSlideOver
          task={taskSO.item}
          open
          onClose={() => setTaskSO(initSO())}
          onToggle={toggleTask}
        />
      )}

      {leadCallSO.open && (
        <LeadCallSlideOver
          lead={leadCallSO.item}
          open
          onClose={() => setLeadCallSO(initSO())}
        />
      )}

      {leadTextSO.open && (
        <LeadTextSlideOver
          lead={leadTextSO.item}
          open
          onClose={() => setLeadTextSO(initSO())}
        />
      )}

      {leadAiSO.open && (
        <LeadAiSlideOver
          lead={leadAiSO.item}
          open
          onClose={() => setLeadAiSO(initSO())}
        />
      )}

      {dealSO.open && (
        <DealSlideOver
          deal={dealSO.item}
          open
          onClose={() => setDealSO(initSO())}
        />
      )}

      {apptDialSO.open && (
        <ApptCallSlideOver
          appt={apptDialSO.item}
          open
          onClose={() => setApptDialSO(initSO())}
        />
      )}

      {apptPrepSO.open && (
        <ApptPrepSlideOver
          appt={apptPrepSO.item}
          open
          onClose={() => setApptPrepSO(initSO())}
        />
      )}
    </div>
  );
}
