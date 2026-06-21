"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Mail, CalendarClock, UserPlus, Send, CircleCheck } from "lucide-react";
import type { Lead } from "@/lib/types";
import { agents, getAgent } from "@/lib/data";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import { RecordDrawer, Avatar, AIActionCard, StatusChip } from "@/components/os";
import { budgetLabel } from "./leadView";

/* ──────────────────────────────────────────────────────────────────────────
   CRM & Leads — Compose / Assign drawer (RecordDrawer-backed)

   The lead detail action bar's Text / Email / Schedule / Assign buttons open
   THIS drawer (never the global AI sidecar). Each mode is a real form:
     • text / email  → channel-aware compose textarea + "Draft with Matin"
       (streams streamAi('lead-responder') into an AIActionCard result inline,
       approval-gated — Approve drops it into the textarea, never auto-sends)
     • schedule       → date + time + note, books a real (local) appointment
     • assign         → pick a different owner agent from the roster

   Submit mutates local state in the parent (onComplete) and the parent shows an
   inline confirmation. Nothing here silently sends — Send/Book/Reassign are
   explicit human actions the operator clicks.
   ────────────────────────────────────────────────────────────────────────── */

export type ComposeMode = "text" | "email" | "schedule" | "assign";

const MODE_META: Record<
  ComposeMode,
  { title: string; icon: typeof MessageSquare; submit: string; channel?: "text" | "email" }
> = {
  text: { title: "Text", icon: MessageSquare, submit: "Send text", channel: "text" },
  email: { title: "Email", icon: Mail, submit: "Send email", channel: "email" },
  schedule: { title: "Schedule", icon: CalendarClock, submit: "Book appointment" },
  assign: { title: "Reassign owner", icon: UserPlus, submit: "Reassign lead" },
};

export type ComposeResult =
  | { mode: "text" | "email"; summary: string }
  | { mode: "schedule"; summary: string }
  | { mode: "assign"; agentSlug: string; summary: string };

export function ComposeDrawer({
  lead,
  mode,
  open,
  onClose,
  onComplete,
}: {
  lead: Lead;
  mode: ComposeMode;
  open: boolean;
  onClose: () => void;
  onComplete: (result: ComposeResult) => void;
}) {
  const meta = MODE_META[mode];
  const owner = getAgent(lead.assignedAgent);

  // Compose (text/email)
  const [body, setBody] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draftResult, setDraftResult] = useState("");

  // Schedule
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [scheduleNote, setScheduleNote] = useState("");

  // Assign
  const [assignSlug, setAssignSlug] = useState(lead.assignedAgent);

  // Reset every field whenever the drawer (re)opens against a lead/mode.
  useEffect(() => {
    if (!open) return;
    setBody(
      mode === "email"
        ? `Hi ${lead.firstName},\n\n`
        : mode === "text"
          ? ""
          : "",
    );
    setDrafting(false);
    setDraftResult("");
    setDate("");
    setTime("10:00");
    setScheduleNote("");
    setAssignSlug(lead.assignedAgent);
  }, [open, mode, lead.id, lead.firstName, lead.assignedAgent]);

  const assignableAgents = useMemo(
    () => agents.filter((a) => !a.slug.startsWith("system-")),
    [],
  );

  async function draftWithAi() {
    if (drafting) return;
    setDrafting(true);
    setDraftResult("");
    await streamAi(
      {
        tool: "lead-responder",
        input: {
          leadName: lead.name,
          firstName: lead.firstName,
          intent: lead.intent,
          community: lead.community,
          budget: budgetLabel(lead),
          score: lead.score,
          signals: lead.propertyViews ?? [],
          channel: meta.channel ?? "text",
        },
      },
      (_chunk, full) => setDraftResult(full),
    );
    setDrafting(false);
  }

  function acceptDraft() {
    setBody((prev) => (prev.trim() ? `${prev.trim()}\n\n${draftResult}` : draftResult));
    setDraftResult("");
  }

  const canSubmit =
    mode === "schedule"
      ? Boolean(date)
      : mode === "assign"
        ? assignSlug !== lead.assignedAgent
        : body.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    if (mode === "assign") {
      const next = getAgent(assignSlug);
      onComplete({
        mode: "assign",
        agentSlug: assignSlug,
        summary: `Reassigned to ${next?.name ?? assignSlug}`,
      });
    } else if (mode === "schedule") {
      const when = new Date(`${date}T${time || "10:00"}`);
      const label = Number.isNaN(when.getTime())
        ? `${date} ${time}`
        : when.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
      onComplete({ mode: "schedule", summary: `Appointment booked for ${label}` });
    } else {
      onComplete({
        mode,
        summary: `${mode === "email" ? "Emailed" : "Texted"} ${lead.firstName}`,
      });
    }
  }

  const Icon = meta.icon;

  return (
    <RecordDrawer
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <Icon className="h-4 w-4" aria-hidden />
          {meta.title}
        </span>
      }
      subtitle={`${lead.name} · ${lead.phone}`}
      actions={
        <>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[0.8rem] font-semibold text-cloud transition-colors hover:bg-ink-800 disabled:cursor-default disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" aria-hidden />
            {meta.submit}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.8rem] font-medium text-slate transition-colors hover:text-ink"
          >
            Cancel
          </button>
        </>
      }
    >
      {/* Identity line */}
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-mist bg-paper px-3.5 py-3">
        <Avatar name={lead.name} size={36} ring />
        <div className="min-w-0">
          <p className="truncate text-[0.86rem] font-semibold text-ink">{lead.name}</p>
          <p className="truncate text-[0.76rem] text-slate">
            {mode === "email" ? lead.email : mode === "text" ? lead.phone : `${lead.community} · ${budgetLabel(lead)}`}
          </p>
        </div>
      </div>

      {/* ── Compose (text / email) ── */}
      {(mode === "text" || mode === "email") && (
        <div className="space-y-3">
          {mode === "email" && (
            <label className="block">
              <span className="eyebrow text-slate">Subject</span>
              <input
                type="text"
                defaultValue={`${lead.community} homes in your range`}
                className="mt-1 w-full rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.84rem] text-ink focus:border-ink/30 focus:outline-none"
              />
            </label>
          )}

          <label className="block">
            <div className="flex items-center justify-between">
              <span className="eyebrow text-slate">{mode === "email" ? "Message" : "Text message"}</span>
              <button
                type="button"
                onClick={draftWithAi}
                disabled={drafting}
                className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-2.5 py-1 text-[0.72rem] font-semibold text-gold-ink ring-1 ring-inset ring-gold/25 transition-colors hover:bg-gold/20 disabled:opacity-60"
              >
                {drafting ? "Drafting…" : "Draft with Matin"}
              </button>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={mode === "email" ? 8 : 5}
              placeholder={mode === "email" ? "Write your email…" : "Write your text…"}
              className="mt-1 w-full resize-y rounded-lg border border-mist bg-cloud px-3 py-2.5 text-[0.84rem] leading-relaxed text-ink placeholder:text-slate/45 focus:border-ink/30 focus:outline-none"
            />
            <p className="mt-1 text-[0.72rem] text-slate tabular-nums">{body.length} characters</p>
          </label>

          {/* Streamed AI draft — approval-gated; Accept appends to the textarea. */}
          {(drafting || draftResult) && (
            <AIActionCard
              title={`Draft a ${meta.channel === "email" ? "first email" : "first text"} for ${lead.firstName}`}
              riskTag="Approval required"
              evidence={`Personalized from ${lead.score}/100 intent, ${lead.community} interest, and ${
                (lead.propertyViews ?? []).length
              } tracked signals. Review before it goes into your message.`}
              confidence={lead.score >= 75 ? "High" : "Medium"}
              runLabel={draftResult ? "Redraft" : "Draft"}
              running={drafting}
              onRun={draftWithAi}
              onReject={draftResult ? () => setDraftResult("") : undefined}
              result={
                draftResult ? (
                  <div className="space-y-2.5">
                    <p>{draftResult}</p>
                    {!drafting && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={acceptDraft}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
                        >
                          <CircleCheck className="h-3.5 w-3.5" aria-hidden />
                          Use this draft
                        </button>
                        <button
                          type="button"
                          onClick={() => setDraftResult("")}
                          className="rounded-lg px-2.5 py-1.5 text-[0.76rem] font-medium text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud"
                        >
                          Discard
                        </button>
                      </div>
                    )}
                  </div>
                ) : undefined
              }
            />
          )}
        </div>
      )}

      {/* ── Schedule ── */}
      {mode === "schedule" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="eyebrow text-slate">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.84rem] text-ink focus:border-ink/30 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="eyebrow text-slate">Time</span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.84rem] text-ink focus:border-ink/30 focus:outline-none"
              />
            </label>
          </div>
          <label className="block">
            <span className="eyebrow text-slate">Appointment type / note</span>
            <textarea
              value={scheduleNote}
              onChange={(e) => setScheduleNote(e.target.value)}
              rows={3}
              placeholder={`Showing for ${lead.community} listings, buyer consult, etc.`}
              className="mt-1 w-full resize-y rounded-lg border border-mist bg-cloud px-3 py-2.5 text-[0.84rem] leading-relaxed text-ink placeholder:text-slate/45 focus:border-ink/30 focus:outline-none"
            />
          </label>
          {date && (
            <p className="rounded-lg border border-mist bg-paper px-3 py-2 text-[0.78rem] text-slate">
              Booking <span className="font-medium text-ink">{date} at {time}</span> with{" "}
              <span className="font-medium text-ink">{owner?.name ?? lead.assignedAgent}</span>.
            </p>
          )}
        </div>
      )}

      {/* ── Assign ── */}
      {mode === "assign" && (
        <div className="space-y-2">
          <p className="text-[0.78rem] text-slate">
            Currently owned by{" "}
            <span className="font-medium text-ink">{owner?.name ?? lead.assignedAgent}</span>. Pick a new owner.
          </p>
          <ul className="max-h-[26rem] space-y-1 overflow-y-auto">
            {assignableAgents.map((a) => {
              const active = a.slug === assignSlug;
              return (
                <li key={a.slug}>
                  <button
                    type="button"
                    onClick={() => setAssignSlug(a.slug)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                      active
                        ? "border-ink bg-paper"
                        : "border-mist bg-cloud hover:border-ink/20 hover:bg-paper",
                    )}
                  >
                    <Avatar name={a.name} slug={a.slug} size={32} ring />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.84rem] font-medium text-ink">{a.name}</p>
                      <p className="truncate text-[0.74rem] text-slate">{a.title}</p>
                    </div>
                    {a.slug === lead.assignedAgent ? (
                      <StatusChip tone="info" variant="soft">
                        Current
                      </StatusChip>
                    ) : active ? (
                      <CircleCheck className="h-4 w-4 text-ink" aria-hidden />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </RecordDrawer>
  );
}

/* Call-href helper so the panel can build a tel: link consistently. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
