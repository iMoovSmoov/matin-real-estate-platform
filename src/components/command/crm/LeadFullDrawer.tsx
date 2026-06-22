"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Banknote,
  CircleCheck,
  Plus,
  StickyNote,
} from "lucide-react";
import type { Lead } from "@/lib/types";
import { getAgent } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  RecordDrawer,
  Avatar,
  PropertyThumb,
  ScoreRing,
  StatusChip,
  ActivityTimeline,
  AIInsightChip,
  type ActivityItem,
} from "@/components/os";
import { MatinMark } from "@/components/brand/Logo";
import {
  leadTypeLabel,
  leadTypeTone,
  stageTone,
  tempLabel,
  budgetLabel,
  leadTimeline,
} from "./leadView";

/* ──────────────────────────────────────────────────────────────────────────
   CRM & Leads — Lead 360 drawer (RecordDrawer-backed)

   The "Open full 360" affordance on the detail panel opens THIS — a deeper,
   tabbed record drawer (Activity / Comms / Notes / Tasks) than the inline
   panel. Real interactions only:
     • tabs switch the body (local state — never the AI sidecar)
     • Notes  → type + Add Note appends to a local list, shown immediately
     • Tasks  → toggle complete + "+ Add task" appends; inline confirmation
     • Comms  → channel-filtered slice of the synthesized timeline
     • action bar → Call (tel:) + Text/Email handlers handed in by the parent

   Identity header uses Avatar (lead initials) + ScoreRing; PropertyThumb shows
   the lead's tracked-interest photos. No gray placeholders, no AI-panel routing.
   ────────────────────────────────────────────────────────────────────────── */

type Tab = "activity" | "comms" | "notes" | "tasks";

type Note = { id: string; text: string; at: string };
type Task = { id: string; text: string; done: boolean };

const TABS: { key: Tab; label: string }[] = [
  { key: "activity", label: "Activity" },
  { key: "comms", label: "Comms" },
  { key: "notes", label: "Notes" },
  { key: "tasks", label: "Tasks" },
];

function defaultTasks(lead: Lead): Task[] {
  const t: Task[] = [];
  if (lead.lastContactDaysAgo >= 7) t.push({ id: "t-recontact", text: `Re-contact ${lead.firstName} — ${lead.lastContactDaysAgo}d cold`, done: false });
  t.push({ id: "t-nba", text: lead.nextBestAction ?? `Qualify ${lead.firstName}'s timeline & budget`, done: false });
  if ((lead.propertyViews ?? []).length > 0) t.push({ id: "t-send", text: `Send 3 ${lead.community} matches in ${budgetLabel(lead)}`, done: false });
  if (lead.intent.includes("Selling") || lead.likelySeller) t.push({ id: "t-cma", text: "Prepare a CMA / home valuation", done: false });
  return t;
}

export function LeadFullDrawer({
  lead,
  open,
  onClose,
  onCall,
  onText,
  onEmail,
}: {
  lead: Lead;
  open: boolean;
  onClose: () => void;
  onCall: () => void;
  onText: () => void;
  onEmail: () => void;
}) {
  const [tab, setTab] = useState<Tab>("activity");
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [tasks, setTasks] = useState<Task[]>(() => defaultTasks(lead));
  const [taskDraft, setTaskDraft] = useState("");

  const owner = getAgent(lead.assignedAgent);
  const temp = tempLabel(lead.score);
  const timeline = useMemo(() => leadTimeline(lead), [lead]);

  // Re-seed transient state whenever a different lead opens.
  useEffect(() => {
    if (!open) return;
    setTab("activity");
    setNotes([]);
    setNoteDraft("");
    setTasks(defaultTasks(lead));
    setTaskDraft("");
  }, [open, lead.id]);

  function addNote() {
    const text = noteDraft.trim();
    if (!text) return;
    setNotes((prev) => [{ id: `note-${Date.now()}`, text, at: "Just now" }, ...prev]);
    setNoteDraft("");
  }

  function addTask() {
    const text = taskDraft.trim();
    if (!text) return;
    setTasks((prev) => [...prev, { id: `task-${Date.now()}`, text, done: false }]);
    setTaskDraft("");
  }

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  const commsItems: ActivityItem[] = timeline.filter(
    (i) => i.channel === "call" || i.channel === "text" || i.channel === "email",
  );
  const openTasks = tasks.filter((t) => !t.done).length;

  return (
    <RecordDrawer
      open={open}
      onClose={onClose}
      title={lead.name}
      subtitle={`${lead.community} · ${budgetLabel(lead)} · ${leadTypeLabel(lead)}`}
      tabs={TABS.map((t) => ({
        key: t.key,
        label: t.key === "tasks" && openTasks > 0 ? `${t.label} ${openTasks}` : t.label,
      }))}
      activeTab={tab}
      onTab={(k) => setTab(k as Tab)}
      actions={
        <>
          <button
            type="button"
            onClick={onCall}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[0.8rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
          >
            <Phone className="h-4 w-4" aria-hidden />
            Call
          </button>
          <button
            type="button"
            onClick={onText}
            className="inline-flex items-center gap-1.5 rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.8rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
          >
            <MessageSquare className="h-4 w-4" aria-hidden />
            Text
          </button>
          <button
            type="button"
            onClick={onEmail}
            className="inline-flex items-center gap-1.5 rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.8rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
          >
            <Mail className="h-4 w-4" aria-hidden />
            Email
          </button>
        </>
      }
    >
      {/* Identity spine */}
      <div className="flex items-start gap-4 pb-4">
        <ScoreRing value={lead.score} size={56} label="Intent" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Avatar name={lead.name} size={28} ring />
            <StatusChip tone={temp.tone} variant="soft">
              {temp.label}
            </StatusChip>
            <StatusChip tone={leadTypeTone(lead)} variant="soft">
              {leadTypeLabel(lead)}
            </StatusChip>
            <StatusChip tone={stageTone(lead.stage)} variant="soft">
              {lead.stage}
            </StatusChip>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[0.78rem]">
            <Fact icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={lead.phone} />
            <Fact icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={lead.email} />
            <Fact icon={<MapPin className="h-3.5 w-3.5" />} label="Area" value={lead.community} />
            <Fact icon={<Banknote className="h-3.5 w-3.5" />} label="Budget" value={budgetLabel(lead)} />
          </dl>
          {owner ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-mist bg-paper px-3 py-2">
              <Avatar name={owner.name} slug={owner.slug} size={26} ring />
              <span className="text-[0.76rem] text-slate">
                Owned by <span className="font-medium text-ink">{owner.name}</span>
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Plain-English note on what this 360 view pulls together */}
      <p className="mb-4 rounded-lg border border-mist bg-paper px-3 py-2 font-mono text-[0.7rem] leading-relaxed text-slate">
        What this 360 pulls together: contact details, saved searches, the homes they&rsquo;ve viewed,
        follow-up tasks, and signed agreements.
      </p>

      {/* ── ACTIVITY ── */}
      {tab === "activity" && (
        <div className="space-y-4">
          {(lead.propertyViews ?? []).length > 0 && (
            <section>
              <p className="eyebrow pb-2 text-slate">Tracked interest</p>
              <div className="grid grid-cols-3 gap-2">
                {(lead.propertyViews ?? []).slice(0, 3).map((pv, i) => (
                  <figure key={pv} className="overflow-hidden rounded-xl border border-mist">
                    <PropertyThumb seedIndex={lead.score + i} ratio="square" rounded={false} alt={pv} />
                    <figcaption className="truncate px-2 py-1.5 text-[0.7rem] text-slate">{pv}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}
          <ActivityTimeline items={timeline} />
        </div>
      )}

      {/* ── COMMS ── */}
      {tab === "comms" && (
        <div>
          {commsItems.length > 0 ? (
            <ActivityTimeline items={commsItems} />
          ) : (
            <EmptyTab
              icon={<MessageSquare className="h-5 w-5" />}
              title="No conversations yet"
              body={`Start the thread with ${lead.firstName} — call, text, or email from the action bar below.`}
            />
          )}
        </div>
      )}

      {/* ── NOTES ── */}
      {tab === "notes" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-mist bg-paper p-3">
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={3}
              placeholder={`Log a note about ${lead.firstName}…`}
              className="w-full resize-y rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.82rem] leading-relaxed text-ink placeholder:text-slate/45 focus:border-ink/30 focus:outline-none"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={addNote}
                disabled={!noteDraft.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[0.78rem] font-semibold text-cloud transition-colors hover:bg-ink-800 disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Add note
              </button>
            </div>
          </div>
          {/* Seeded AI summary as a pinned note */}
          {lead.aiSummary && (
            <div className="rounded-xl border border-gold/25 bg-gold-soft/50 px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-gold-ink">
                <MatinMark theme="dark" className="h-3.5 w-3.5" /> Matin AI summary
              </p>
              <p className="mt-1.5 text-[0.82rem] leading-relaxed text-ink">{lead.aiSummary}</p>
            </div>
          )}
          {notes.length === 0 ? (
            <p className="px-1 text-[0.78rem] text-slate">No manual notes yet — add the first one above.</p>
          ) : (
            <ul className="space-y-2">
              {notes.map((n) => (
                <li key={n.id} className="rounded-xl border border-mist bg-cloud px-3.5 py-2.5">
                  <p className="flex items-center gap-1.5 text-[0.7rem] text-slate">
                    <StickyNote className="h-3 w-3" aria-hidden /> {n.at}
                  </p>
                  <p className="mt-1 text-[0.82rem] leading-relaxed text-ink">{n.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── TASKS ── */}
      {tab === "tasks" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={taskDraft}
              onChange={(e) => setTaskDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTask();
                }
              }}
              placeholder="Add a follow-up task…"
              className="flex-1 rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/45 focus:border-ink/30 focus:outline-none"
            />
            <button
              type="button"
              onClick={addTask}
              disabled={!taskDraft.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-[0.78rem] font-semibold text-cloud transition-colors hover:bg-ink-800 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add
            </button>
          </div>
          <ul className="space-y-1.5">
            {tasks.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => toggleTask(t.id)}
                  className="flex w-full items-start gap-2.5 rounded-lg border border-mist bg-cloud px-3 py-2.5 text-left transition-colors hover:border-ink/20"
                >
                  <span
                    className={cn(
                      "mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                      t.done
                        ? "border-success bg-success text-cloud"
                        : "border-danger/50 bg-transparent",
                    )}
                  >
                    {t.done ? <CircleCheck className="h-3 w-3" aria-hidden /> : null}
                  </span>
                  <span
                    className={cn(
                      "text-[0.82rem] leading-snug",
                      t.done ? "text-slate line-through" : "text-ink",
                    )}
                  >
                    {t.text}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {openTasks === 0 && tasks.length > 0 && (
            <p className="flex items-center gap-1.5 px-1 text-[0.78rem] font-medium text-success">
              <CircleCheck className="h-3.5 w-3.5" aria-hidden /> All tasks complete for {lead.firstName}.
            </p>
          )}
        </div>
      )}

      {/* AI insight footer (sanctioned gold — AI affordance) */}
      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-mist pt-4">
        {(lead.propertyViews ?? []).slice(0, 2).map((pv) => (
          <AIInsightChip key={pv}>{pv}</AIInsightChip>
        ))}
        <AIInsightChip>Intent {lead.score}/100</AIInsightChip>
      </div>
    </RecordDrawer>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[0.66rem] font-medium uppercase tracking-[0.1em] text-slate">
        <span className="text-slate/70" aria-hidden>{icon}</span>
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-[0.82rem] font-medium text-ink" title={value}>
        {value}
      </dd>
    </div>
  );
}

function EmptyTab({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-mist bg-paper px-4 py-8 text-center">
      <span className="text-slate/60" aria-hidden>{icon}</span>
      <p className="text-[0.86rem] font-semibold text-ink">{title}</p>
      <p className="max-w-[20rem] text-[0.78rem] leading-relaxed text-slate">{body}</p>
    </div>
  );
}
