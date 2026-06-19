"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  X,
  Wand2,
  Loader2,
  Copy,
  Check,
  Send,
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  Wallet,
  Tag as TagIcon,
  ChevronDown,
  ChevronRight,
  UserPlus,
  StickyNote,
  Flame,
  RefreshCw,
  CalendarClock,
  Home,
  Clock,
} from "lucide-react";
import type { Lead, LeadStage } from "@/lib/types";
import { getAgent } from "@/lib/data";
import { streamAi } from "@/lib/ai/client";
import { cn, usd, initials, timeAgo } from "@/lib/utils";
import { Pill } from "@/components/command/ui";
import { LEAD_STAGES, stageTone, scoreTone, scoreLabel } from "@/components/command/crm/leadStyles";

/* ── Communication timeline ──────────────────────────────────────────────────
   A realistic history, derived DETERMINISTICALLY from the lead's own fields
   (no Math.random). Two leads with different data get different timelines, but
   the same lead is always identical. Newest first; minutes-ago for ordering. */

type TimelineKind = "text" | "email" | "call" | "note" | "registered";
type TimelineEntry = { id: string; kind: TimelineKind; label: string; minsAgo: number };

const DAY = 60 * 24;

/** Stable small integer from a string — keeps the synthesized history varied
    but reproducible per-lead. */
function seedFrom(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function buildTimeline(lead: Lead): TimelineEntry[] {
  const seed = seedFrom(lead.id + lead.name);
  const entries: TimelineEntry[] = [];
  const last = lead.lastContactDaysAgo;
  const created = lead.createdDaysAgo;

  // The most recent touch — its type varies by stage / score.
  if (last >= 0) {
    if (lead.stage === "Showing") {
      entries.push({ id: "t-show", kind: "call", label: `Confirmed showing time for a ${lead.community} listing`, minsAgo: last * DAY });
    } else if (lead.stage === "Offer" || lead.stage === "Under Contract") {
      entries.push({ id: "t-offer", kind: "call", label: "Reviewed offer terms over the phone", minsAgo: last * DAY });
    } else if (lead.score >= 80) {
      entries.push({ id: "t-text", kind: "text", label: `Texted — "Are you free to tour this week?"`, minsAgo: last * DAY });
    } else if (lead.unread > 0) {
      entries.push({ id: "t-in", kind: "text", label: `Inbound text — ${lead.unread} unread`, minsAgo: last * DAY });
    } else {
      entries.push({ id: "t-text2", kind: "text", label: "Texted to check in", minsAgo: last * DAY });
    }
  }

  // A property-matches email a little before the last touch.
  const emailDay = Math.min(created - 1, last + 1 + (seed % 3));
  if (emailDay > last && emailDay >= 1) {
    const matches = 2 + (seed % 4); // 2–5
    entries.push({
      id: "t-email",
      kind: "email",
      label: `Emailed ${matches} ${lead.community} matches in the ${usd(lead.budgetMin)}–${usd(lead.budgetMax)} range`,
      minsAgo: emailDay * DAY,
    });
  }

  // An earlier call — left a voicemail for colder leads, connected for warmer.
  const callDay = Math.min(created - 1, emailDay + 1 + (seed % 4));
  if (callDay > emailDay && callDay >= 1) {
    entries.push({
      id: "t-call",
      kind: "call",
      label: lead.score >= 65 ? "Called — talked through timeline & must-haves" : "Called, left a voicemail",
      minsAgo: callDay * DAY,
    });
  }

  // First-touch email auto-reply, shortly after sign-up.
  if (created >= 2) {
    entries.push({
      id: "t-welcome",
      kind: "email",
      label: "Sent intro email with neighborhood guide",
      minsAgo: (created - 1) * DAY,
    });
  }

  // The origin event — registered / came in via the source.
  entries.push({
    id: "t-reg",
    kind: "registered",
    label: `Registered via ${lead.source}`,
    minsAgo: created * DAY,
  });

  // Sort newest-first; de-dup any colliding timestamps deterministically.
  return entries
    .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i)
    .sort((a, b) => a.minsAgo - b.minsAgo);
}

const KIND_ICON: Record<TimelineKind, typeof MessageSquare> = {
  text: MessageSquare,
  email: Mail,
  call: Phone,
  note: StickyNote,
  registered: UserPlus,
};

/* ── Response time badge ─────────────────────────────────────────────────────
   Shows the lead's last response time with urgency color coding.
   0 = no contact, <60 min = green, <1440 min = amber, >=1440 = red.   */
function SpeedToLeadBadge({ minutes }: { minutes: number }) {
  // No contact yet
  if (minutes === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-0.5 text-[0.72rem] font-semibold text-danger ring-1 ring-inset ring-danger/25">
        <Clock className="h-3 w-3" />
        No contact yet
      </span>
    );
  }

  // Responded within the hour — green
  if (minutes < 60) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-[0.72rem] font-semibold text-success ring-1 ring-inset ring-success/25">
        <Clock className="h-3 w-3" />
        Responded {minutes} min ago
      </span>
    );
  }

  // Within the day — amber
  if (minutes < 1440) {
    const hrs = Math.round(minutes / 60);
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warn/10 px-2.5 py-0.5 text-[0.72rem] font-semibold text-warn ring-1 ring-inset ring-warn/20">
        <Clock className="h-3 w-3" />
        Responded {hrs}h ago
      </span>
    );
  }

  // Over a day — red
  const days = Math.floor(minutes / 1440);
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-0.5 text-[0.72rem] font-semibold text-danger ring-1 ring-inset ring-danger/25">
      <Clock className="h-3 w-3" />
      Last contact: {days} {days === 1 ? "day" : "days"} ago
    </span>
  );
}

export function LeadDrawer({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stage, setStage] = useState<LeadStage | null>(null);
  const [stageOpen, setStageOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [extra, setExtra] = useState<TimelineEntry[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Reset transient state whenever a different lead is opened.
  const [activeId, setActiveId] = useState<string | null>(null);
  if (lead && lead.id !== activeId) {
    setActiveId(lead.id);
    setDraft("");
    setBusy(false);
    setStage(lead.stage);
    setStageOpen(false);
    setNoteText("");
    setExtra([]);
    setToast(null);
  }

  const agent = lead ? getAgent(lead.assignedAgent) : undefined;
  const currentStage = stage ?? lead?.stage ?? "New";

  const timeline = useMemo(() => {
    if (!lead) return [];
    return [...extra, ...buildTimeline(lead)].sort((a, b) => a.minsAgo - b.minsAgo);
  }, [lead, extra]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 2200);
  }

  async function generate() {
    if (!lead || busy) return;
    setBusy(true);
    setDraft("");
    try {
      await streamAi(
        {
          tool: "lead-responder",
          input: {
            name: lead.name,
            intent: lead.intent,
            area: lead.community,
            budget: `${usd(lead.budgetMin)}–${usd(lead.budgetMax)}`,
            timeline: lead.tags.includes("Urgent") || lead.tags.includes("Hot") ? "ASAP" : "—",
            source: lead.source,
            message: lead.aiSummary,
          },
        },
        (_chunk, full) => setDraft(full),
      );
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  function sendReply() {
    if (!draft.trim() || !lead) return;
    setExtra((e) => [{ id: `sent-${Date.now()}`, kind: "text", label: `Texted ${lead.firstName} a reply`, minsAgo: 0 }, ...e]);
    setDraft("");
    flash(`Sent to ${lead.firstName}`);
  }

  function logNote() {
    const t = noteText.trim();
    if (!t) return;
    setExtra((e) => [{ id: `note-${Date.now()}`, kind: "note", label: t, minsAgo: 0 }, ...e]);
    setNoteText("");
    flash("Note saved");
  }

  const open = !!lead;

  return (
    <>
      {/* Scrim */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Slide-over */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-ink/[0.08] bg-white shadow-[0_0_80px_rgba(0,0,0,.7)] transition-transform duration-300 ease-out sm:w-[480px]",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
      >
        {lead && (
          <>
            {/* Header */}
            <div className="relative shrink-0 border-b border-ink/[0.08] bg-gradient-to-br from-paper to-white px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg text-slate transition-colors hover:bg-ink/[0.06] hover:text-ink sm:right-4 sm:top-4"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-start gap-3 pr-10">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-base font-bold text-white">
                  {initials(lead.name)}
                </span>
                <div className="min-w-0">
                  {/* Lead name + speed-to-lead badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-display text-2xl text-ink">{lead.name}</h2>
                    {lead.responseMinutes !== undefined && (
                      <SpeedToLeadBadge minutes={lead.responseMinutes} />
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {/* Stage selector */}
                    <div className="relative">
                      <button
                        onClick={() => setStageOpen((o) => !o)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.72rem] font-semibold ring-1 ring-inset transition-colors",
                          stageTone(currentStage),
                        )}
                      >
                        {currentStage}
                        <ChevronDown className="h-3 w-3 opacity-70" />
                      </button>
                      {stageOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setStageOpen(false)} aria-hidden />
                          <div className="absolute left-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-ink/10 bg-paper py-1 shadow-xl">
                            {LEAD_STAGES.map((s) => (
                              <button
                                key={s}
                                onClick={() => {
                                  setStage(s);
                                  setStageOpen(false);
                                  if (s !== currentStage) flash(`Moved to ${s}`);
                                }}
                                className={cn(
                                  "flex w-full items-center justify-between px-3 py-1.5 text-left text-[0.8rem] transition-colors hover:bg-white",
                                  s === currentStage ? "text-ink" : "text-slate",
                                )}
                              >
                                {s}
                                {s === currentStage && <Check className="h-3.5 w-3.5 text-ink" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.72rem] font-semibold ring-1 ring-inset", scoreTone(lead.score))}>
                      {lead.score >= 80 && <Flame className="h-3 w-3" />}
                      {scoreLabel(lead.score)} · {lead.score}
                    </span>
                    <Pill tone="neutral">{lead.source}</Pill>
                  </div>
                </div>
              </div>

              {/* Quick comms actions — full-width on mobile, 3-col on sm */}
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-1.5">
                <a
                  href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink/12 bg-white py-2.5 text-[0.82rem] font-semibold text-ink transition-colors hover:bg-paper min-h-[44px]"
                >
                  <Phone className="h-3.5 w-3.5" /> Call
                </a>
                <button
                  onClick={() => flash(`Texting ${lead.firstName}…`)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink/12 bg-white py-2.5 text-[0.82rem] font-semibold text-ink transition-colors hover:bg-paper min-h-[44px]"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Text
                </button>
                <a
                  href={`mailto:${lead.email}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink/12 bg-white py-2.5 text-[0.82rem] font-semibold text-ink transition-colors hover:bg-paper min-h-[44px]"
                >
                  <Mail className="h-3.5 w-3.5" /> Email
                </a>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
              {/* Contact + facts */}
              <div className="grid grid-cols-2 gap-2">
                <Fact icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={lead.email} />
                <Fact icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={lead.phone} />
                <Fact icon={<MapPin className="h-3.5 w-3.5" />} label="Area" value={lead.community} />
                <Fact icon={<Wallet className="h-3.5 w-3.5" />} label="Budget" value={`${usd(lead.budgetMin)}–${usd(lead.budgetMax)}`} />
                <Fact icon={<TagIcon className="h-3.5 w-3.5" />} label="Intent" value={lead.intent} />
                <Fact
                  icon={<CalendarClock className="h-3.5 w-3.5" />}
                  label="Last contact"
                  value={lead.lastContactDaysAgo === 0 ? "today" : `${lead.lastContactDaysAgo}d ago`}
                />
              </div>

              {/* Tags */}
              {lead.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {lead.tags.map((t) => (
                    <Pill key={t} tone="azure">
                      {t}
                    </Pill>
                  ))}
                </div>
              )}

              {/* Assigned agent */}
              {agent && (
                <div className="flex items-center gap-3 rounded-xl border border-ink/[0.08] bg-white px-3.5 py-3">
                  <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-ink/[0.06]">
                    <Image src={agent.photo} alt={agent.name} fill sizes="36px" className="object-cover" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.66rem] uppercase tracking-wider text-slate/55">Assigned to</p>
                    <p className="truncate text-[0.86rem] font-semibold text-ink">{agent.name}</p>
                  </div>
                </div>
              )}

              {/* ── AI Lead Intel callout ── */}
              <div className="rounded-r-xl border-l-4 border-azure bg-azure/[0.06] p-4 mb-5">
                <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-azure">AI Intel</p>
                <p className="text-[0.85rem] leading-relaxed text-slate">
                  {lead.aiSummary || (() => {
                    const views = lead.propertyViews?.length ?? 0;
                    return `${lead.firstName} has viewed ${views} ${views === 1 ? "property" : "properties"}${lead.community ? ` in ${lead.community}` : ""}. Budget aligns with median price. High email engagement — 3 opens in 48 hours.`;
                  })()}
                </p>
                {lead.nextBestAction && (
                  <p className="mt-2 text-[0.82rem] font-semibold text-ink">
                    <span className="text-slate/60">Best action: </span>{lead.nextBestAction}
                  </p>
                )}
              </div>

              {/* ── Likely Seller banner ── */}
              {lead.likelySeller === true && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <Home className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.83rem] leading-snug text-amber-800">
                      This contact may have selling intent. Consider pitching a free home valuation.
                    </p>
                    <a
                      href="/hub/ai/cma"
                      className="mt-1 inline-flex items-center gap-0.5 text-[0.76rem] font-semibold text-amber-700 hover:text-amber-900"
                    >
                      Generate CMA
                      <ChevronRight className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* ── Property Interests ── */}
              {lead.propertyViews && lead.propertyViews.length > 0 && (
                <div className="rounded-2xl border border-ink/[0.07] bg-white p-4 shadow-soft">
                  <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-widest text-slate/50">
                    Behavioral data
                  </p>
                  <p className="mb-2 text-[0.8rem] font-semibold text-ink">Property interests</p>
                  <div className="flex flex-wrap gap-2">
                    {lead.propertyViews.map((view, idx) => (
                      <span
                        key={idx}
                        className="rounded-full border border-ink/[0.08] bg-[#f4f4f3] px-2.5 py-1 text-xs text-ink"
                      >
                        {view}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Draft reply ── */}
              <div className="rounded-xl border border-ink/[0.08] bg-white">
                <div className="flex items-center justify-between gap-2 border-b border-ink/[0.08] px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Wand2 className="h-4 w-4 text-ink" />
                    <span className="text-[0.82rem] font-semibold text-ink">Draft reply</span>
                  </div>
                  {draft && !busy && (
                    <div className="flex items-center gap-1.5">
                      <button onClick={copy} className="inline-flex items-center gap-1 rounded-md border border-ink/[0.08] px-2 py-1 text-[0.7rem] text-slate transition-colors hover:bg-white hover:text-ink">
                        {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                      <button onClick={generate} className="inline-flex items-center gap-1 rounded-md border border-ink/[0.08] px-2 py-1 text-[0.7rem] text-slate transition-colors hover:bg-white hover:text-ink">
                        <RefreshCw className="h-3 w-3" /> Redo
                      </button>
                    </div>
                  )}
                </div>

                <div className="px-4 py-3">
                  {!draft && !busy ? (
                    <button
                      onClick={generate}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[0.85rem] font-semibold text-white transition-colors hover:bg-ink-700"
                    >
                      <Wand2 className="h-4 w-4" /> Draft reply with AI
                    </button>
                  ) : (
                    <>
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        readOnly={busy}
                        rows={6}
                        placeholder="Your reply…"
                        className="min-h-[7rem] w-full resize-y rounded-lg border border-ink/[0.08] bg-paper px-3.5 py-3 text-[0.85rem] leading-relaxed text-ink placeholder:text-slate/40 focus:border-ink/20 focus:outline-none"
                      />
                      {busy ? (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-[0.78rem] text-slate">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-ink" /> AI is drafting a personalized reply…
                        </div>
                      ) : (
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            onClick={sendReply}
                            disabled={!draft.trim()}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[0.82rem] font-semibold text-white transition-colors hover:bg-ink-700 disabled:opacity-40"
                          >
                            <Send className="h-3.5 w-3.5" /> Send to {lead.firstName}
                          </button>
                          <button
                            onClick={copy}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-ink/12 bg-white px-3 py-2 text-[0.8rem] font-semibold text-ink transition-colors hover:bg-paper"
                          >
                            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied ? "Copied" : "Copy"}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* ── Communication timeline ── */}
              <div>
                <div className="mb-2.5 flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-ink" />
                  <h3 className="text-[0.84rem] font-semibold text-ink">Communication history</h3>
                </div>
                <ol className="relative space-y-3.5 pl-1">
                  <span className="absolute bottom-2 left-[10px] top-2 w-px bg-ink/[0.06]" aria-hidden />
                  {timeline.map((e) => {
                    const Icon = KIND_ICON[e.kind];
                    return (
                      <li key={e.id} className="relative flex gap-3">
                        <span className="relative z-10 mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-paper text-ink ring-1 ring-inset ring-ink/[0.08]">
                          <Icon className="h-3 w-3" />
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="text-[0.82rem] leading-snug text-ink/80">{e.label}</p>
                          <p className="mt-0.5 text-[0.7rem] text-slate/55">
                            {e.minsAgo === 0 ? "just now" : timeAgo(e.minsAgo)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* ── Log a note ── */}
              <div className="rounded-xl border border-ink/[0.08] bg-white p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <StickyNote className="h-3.5 w-3.5 text-ink" />
                  <span className="text-[0.78rem] font-semibold text-ink">Log a note</span>
                </div>
                <div className="flex items-start gap-2">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        logNote();
                      }
                    }}
                    rows={2}
                    placeholder="Add a note about this lead…"
                    className="min-h-[2.5rem] flex-1 resize-y rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/40 focus:border-ink/20 focus:outline-none"
                  />
                  <button
                    onClick={logNote}
                    disabled={!noteText.trim()}
                    className="shrink-0 rounded-lg bg-ink px-3.5 py-2 text-[0.8rem] font-semibold text-white transition-colors hover:bg-ink-700 disabled:opacity-40"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* Toast */}
            <div
              className={cn(
                "pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2 transition-all duration-300",
                toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
              )}
              aria-live="polite"
            >
              {toast && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-paper px-3.5 py-1.5 text-[0.78rem] font-medium text-ink shadow-lg">
                  <Check className="h-3.5 w-3.5 text-success" /> {toast}
                </span>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/[0.06] bg-white/[0.02] px-3 py-2">
      <div className="flex items-center gap-1.5 text-slate/55">
        {icon}
        <span className="text-[0.62rem] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-0.5 truncate text-[0.82rem] font-medium text-ink">{value}</p>
    </div>
  );
}
