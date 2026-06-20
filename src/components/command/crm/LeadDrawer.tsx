"use client";

import { useMemo, useRef, useState } from "react";
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
  ChevronLeft,
  UserPlus,
  StickyNote,
  Flame,
  RefreshCw,
  CalendarClock,
  Home,
  Clock,
  FileText,
  ClipboardList,
  Users,
  Printer,
  Sparkles,
  Calendar,
} from "lucide-react";
import type { Lead, LeadStage } from "@/lib/types";
import { getAgent, agents as ALL_AGENTS } from "@/lib/data";
import { streamAi } from "@/lib/ai/client";
import { cn, usd, initials, timeAgo } from "@/lib/utils";
import { Pill } from "@/components/command/ui";
import { LEAD_STAGES, stageTone, scoreTone, scoreLabel } from "@/components/command/crm/leadStyles";
import {
  DOCUMENT_TEMPLATES,
  SYSTEM_AGENTS,
  fillFromRecord,
  renderDocHtml,
} from "@/lib/docs";
import type { DocTemplate, DocValues } from "@/lib/docs";

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

/* ── Speed-to-lead badge ─────────────────────────────────────────────────────
   Shows the lead's age in human-readable form with urgency color coding.
   Green = responded within 5 min, Red = over 30 min or still pending.   */
function SpeedToLeadBadge({ minutes }: { minutes: number }) {
  const urgent = minutes < 5;
  const overdue = minutes >= 30;

  if (minutes < 60) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold ring-1 ring-inset",
          urgent
            ? "bg-success/10 text-success ring-success/25"
            : overdue
            ? "bg-danger/10 text-danger ring-danger/25"
            : "bg-warn/10 text-warn ring-warn/20",
        )}
      >
        <Clock className="h-3 w-3" />
        {minutes} {minutes === 1 ? "minute" : "minutes"} old — respond now!
      </span>
    );
  }

  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-0.5 text-[0.72rem] font-semibold text-danger ring-1 ring-inset ring-danger/25">
      <Clock className="h-3 w-3" />
      Lead age: {hrs}h {mins}m
    </span>
  );
}

/* ── Doc type cards available to show in the Documents tab ── */
const LEAD_DOC_OPTIONS = [
  {
    id: "buyer-rep-agreement",
    icon: FileText,
    name: "Buyer Representation Agreement",
    desc: "Exclusive buyer rep agreement — auto-filled from lead profile",
  },
  {
    id: "purchase-offer",
    icon: ClipboardList,
    name: "Purchase Offer",
    desc: "Residential purchase & sale agreement for an active opportunity",
  },
  {
    id: "open-house-signin",
    icon: Users,
    name: "Open House Sign-In Sheet",
    desc: "Branded sign-in sheet ready to print for your next open house",
  },
];

type DocStep = "select" | "review" | "preview";

/* ── DocGeneratorPanel ────────────────────────────────────────────────────── */
function DocGeneratorPanel({
  lead,
  initialTemplate,
  onBack,
}: {
  lead: Lead;
  initialTemplate: DocTemplate | null;
  onBack: () => void;
}) {
  const agentRecord = getAgent(lead.assignedAgent);

  function defaultValues(tpl: DocTemplate): DocValues {
    return fillFromRecord(tpl, {
      lead: {
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        areas: lead.community,
        budgetMin: lead.budgetMin,
        budgetMax: lead.budgetMax,
      },
      agent: {
        id: agentRecord?.slug ?? SYSTEM_AGENTS[0].id,
        name: agentRecord?.name ?? SYSTEM_AGENTS[0].name,
        phone: agentRecord?.phone ?? SYSTEM_AGENTS[0].phone,
      },
    });
  }

  const firstTemplate = initialTemplate ?? (DOCUMENT_TEMPLATES.find((t) => t.id === "buyer-rep-agreement") ?? DOCUMENT_TEMPLATES[0]);

  const [selectedDoc, setSelectedDoc] = useState<DocTemplate>(firstTemplate);
  const [values, setValues] = useState<DocValues>(() => defaultValues(firstTemplate));
  const [step, setStep] = useState<DocStep>(initialTemplate ? "review" : "select");
  const [aiBody, setAiBody] = useState("");
  const [aiStreaming, setAiStreaming] = useState(false);
  const [htmlCopied, setHtmlCopied] = useState(false);

  function selectTemplate(tpl: DocTemplate) {
    setSelectedDoc(tpl);
    setValues(defaultValues(tpl));
    setAiBody("");
    setStep("review");
  }

  function setField(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function generateDoc() {
    setStep("preview");
    setAiBody("");
  }

  async function runAiWrite() {
    if (aiStreaming) return;
    setAiStreaming(true);
    setAiBody("");
    try {
      await streamAi(
        {
          tool: "doc-generate",
          input: { templateName: selectedDoc.name, fields: values },
        },
        (_chunk, full) => setAiBody(full),
      );
    } finally {
      setAiStreaming(false);
    }
  }

  async function copyHtml() {
    try {
      const html = renderDocHtml(selectedDoc, values);
      await navigator.clipboard.writeText(html);
      setHtmlCopied(true);
      setTimeout(() => setHtmlCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  function printDoc() {
    const html = renderDocHtml(selectedDoc, values);
    // Use a Blob URL instead of document.write() to avoid XSS surface
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) {
      URL.revokeObjectURL(url);
      return;
    }
    win.addEventListener("load", () => {
      win.print();
      URL.revokeObjectURL(url);
    });
  }

  // Resolve agent options for <select> fields
  const agentOptions = SYSTEM_AGENTS.map((a) => ({ value: a.id, label: `${a.name} — ${a.title}` }));

  /* ── SELECT step ── */
  if (step === "select") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-ink/[0.08] px-4 py-3">
          <button onClick={onBack} className="flex items-center gap-1 rounded-md px-2 py-1 text-[0.76rem] font-medium text-slate hover:bg-ink/[0.04] hover:text-ink transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" /> Back to lead
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <h3 className="mb-0.5 text-[0.95rem] font-semibold text-ink">Select a Document Type</h3>
          <p className="mb-4 text-[0.78rem] text-slate/60">Choose a template — fields are auto-filled from this lead</p>
          <div className="space-y-2.5">
            {DOCUMENT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => selectTemplate(tpl)}
                className="group flex w-full items-start gap-3 rounded-xl border border-ink/[0.08] bg-white px-4 py-3.5 text-left transition-colors hover:border-ink/20 hover:bg-paper"
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate/50 transition-colors group-hover:text-ink" />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.85rem] font-semibold text-ink">{tpl.name}</p>
                  <p className="text-[0.76rem] text-slate/60">{tpl.description}</p>
                </div>
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate/30 transition-colors group-hover:text-ink" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── REVIEW step ── */
  if (step === "review") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-ink/[0.08] px-4 py-3">
          <button
            onClick={() => setStep("select")}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[0.76rem] font-medium text-slate hover:bg-ink/[0.04] hover:text-ink transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Change template
          </button>
          <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate/40">
            Review fields
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <div>
            <h3 className="text-[0.95rem] font-semibold text-ink">{selectedDoc.name}</h3>
            <p className="text-[0.76rem] text-slate/55">{selectedDoc.description}</p>
          </div>
          {selectedDoc.fields.map((field) => {
            if (field.type === "select" && field.key === "agentId") {
              return (
                <div key={field.key}>
                  <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wide text-slate/50">
                    {field.label}{field.required && <span className="ml-0.5 text-danger">*</span>}
                  </label>
                  <select
                    value={values[field.key] ?? ""}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className="w-full rounded-lg border border-ink/[0.08] bg-paper px-3 py-2 text-[0.82rem] text-ink focus:border-ink/20 focus:outline-none"
                  >
                    <option value="">— Select agent —</option>
                    {agentOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              );
            }
            if (field.type === "select") {
              return (
                <div key={field.key}>
                  <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wide text-slate/50">
                    {field.label}{field.required && <span className="ml-0.5 text-danger">*</span>}
                  </label>
                  <input
                    type="text"
                    value={values[field.key] ?? ""}
                    onChange={(e) => setField(field.key, e.target.value)}
                    placeholder={field.placeholder ?? ""}
                    className="w-full rounded-lg border border-ink/[0.08] bg-paper px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/35 focus:border-ink/20 focus:outline-none"
                  />
                </div>
              );
            }
            if (field.type === "textarea") {
              return (
                <div key={field.key}>
                  <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wide text-slate/50">
                    {field.label}{field.required && <span className="ml-0.5 text-danger">*</span>}
                  </label>
                  <textarea
                    value={values[field.key] ?? ""}
                    onChange={(e) => setField(field.key, e.target.value)}
                    placeholder={field.placeholder ?? ""}
                    rows={3}
                    className="w-full resize-y rounded-lg border border-ink/[0.08] bg-paper px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/35 focus:border-ink/20 focus:outline-none"
                  />
                </div>
              );
            }
            return (
              <div key={field.key}>
                <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wide text-slate/50">
                  {field.label}{field.required && <span className="ml-0.5 text-danger">*</span>}
                </label>
                <input
                  type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                  value={values[field.key] ?? ""}
                  onChange={(e) => setField(field.key, e.target.value)}
                  placeholder={field.placeholder ?? ""}
                  className="w-full rounded-lg border border-ink/[0.08] bg-paper px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/35 focus:border-ink/20 focus:outline-none"
                />
              </div>
            );
          })}
        </div>
        <div className="shrink-0 border-t border-ink/[0.08] px-4 py-3">
          <button
            onClick={generateDoc}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-[0.88rem] font-semibold text-white transition-colors hover:bg-teal-700"
          >
            <FileText className="h-4 w-4" />
            Generate Document
          </button>
        </div>
      </div>
    );
  }

  /* ── PREVIEW step ── */
  const previewHtml = renderDocHtml(selectedDoc, values);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-ink/[0.08] px-4 py-3">
        <button
          onClick={() => setStep("review")}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[0.76rem] font-medium text-slate hover:bg-ink/[0.04] hover:text-ink transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Edit fields
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={copyHtml}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.1] bg-white px-3 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-paper"
          >
            {htmlCopied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            {htmlCopied ? "Copied" : "Copy HTML"}
          </button>
          <button
            onClick={printDoc}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[0.76rem] font-semibold text-white transition-colors hover:bg-ink/90"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* AI Write Body */}
      {selectedDoc.aiPrompt && (
        <div className="shrink-0 border-b border-ink/[0.08] px-4 py-3">
          <button
            onClick={runAiWrite}
            disabled={aiStreaming}
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-[0.76rem] font-semibold text-teal-700 transition-colors hover:bg-teal-100 disabled:opacity-60"
          >
            {aiStreaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {aiStreaming ? "AI writing…" : "AI Write Body"}
          </button>
          {aiBody && (
            <div className="mt-2.5 rounded-lg border border-ink/[0.08] bg-paper px-3.5 py-3 text-[0.82rem] leading-relaxed text-ink whitespace-pre-wrap">
              {aiBody}
            </div>
          )}
        </div>
      )}

      {/* Document preview */}
      <div className="flex-1 overflow-hidden">
        <iframe
          srcDoc={previewHtml}
          title={`Preview: ${selectedDoc.name}`}
          className="h-full w-full border-0"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}

/* ── Tabs ─────────────────────────────────────────────────────────────────── */
type DrawerTab = "overview" | "timeline" | "details" | "documents" | "notes";

const TABS: { id: DrawerTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "details", label: "Details" },
  { id: "documents", label: "Documents" },
  { id: "notes", label: "Notes" },
];

/* ── Main LeadDrawer component ───────────────────────────────────────────── */
export function LeadDrawer({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stage, setStage] = useState<LeadStage | null>(null);
  const [stageOpen, setStageOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [extra, setExtra] = useState<TimelineEntry[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DrawerTab>("overview");
  const [docMode, setDocMode] = useState(false);
  const [preselectedDoc, setPreselectedDoc] = useState<DocTemplate | null>(null);
  const draftSectionRef = useRef<HTMLDivElement>(null);

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
    setActiveTab("overview");
    setDocMode(false);
    setPreselectedDoc(null);
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

  function openDocGenerator(templateId?: string) {
    const tpl = templateId
      ? (DOCUMENT_TEMPLATES.find((t) => t.id === templateId) ?? null)
      : null;
    setPreselectedDoc(tpl);
    setActiveTab("documents");
    setDocMode(true);
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
                    {lead.responseMinutes !== undefined && lead.responseMinutes < 1440 && (
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
                  onClick={() => {
                    draftSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    if (!draft && !busy) generate();
                  }}
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

            {/* Quick Actions bar */}
            <div className="flex shrink-0 gap-2 border-b border-ink/[0.06] px-4 py-2.5">
              <button
                onClick={() => {
                  setActiveTab("overview");
                  setDocMode(false);
                  draftSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  if (!draft && !busy) generate();
                }}
                className="flex-1 rounded-lg bg-ink py-2 text-[0.78rem] font-semibold text-white transition-colors hover:bg-ink/90"
              >
                Draft Reply
              </button>
              <button
                onClick={() => openDocGenerator("buyer-rep-agreement")}
                className="flex-1 rounded-lg border border-ink/[0.1] py-2 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-ink/[0.04]"
              >
                Generate Doc
              </button>
              <button
                onClick={() => flash("Showing booking coming soon")}
                className="flex-1 rounded-lg border border-ink/[0.1] py-2 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-ink/[0.04]"
              >
                Book Showing
              </button>
            </div>

            {/* Tab navigation */}
            <div className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-ink/[0.08] px-4">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== "documents") setDocMode(false);
                  }}
                  className={cn(
                    "shrink-0 whitespace-nowrap px-3 py-2.5 text-[0.8rem] font-medium transition-colors",
                    activeTab === tab.id
                      ? "border-b-2 border-ink text-ink"
                      : "text-slate/60 hover:text-ink",
                  )}
                >
                  {tab.label}
                  {tab.id === "documents" && (
                    <span className="ml-1.5 rounded-full bg-teal-100 px-1.5 py-0.5 text-[0.62rem] font-bold text-teal-700">3</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab body */}
            <div className="flex-1 overflow-hidden">
              {/* ── OVERVIEW TAB ── */}
              {activeTab === "overview" && (
                <div className="h-full space-y-5 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
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
                  <div ref={draftSectionRef} className="rounded-xl border border-ink/[0.08] bg-white">
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
                            rows={4}
                            placeholder="Your reply…"
                            className="min-h-[5rem] w-full resize-y rounded-lg border border-ink/[0.08] bg-paper px-3.5 py-3 text-[0.85rem] leading-relaxed text-ink placeholder:text-slate/40 focus:border-ink/20 focus:outline-none"
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
                </div>
              )}

              {/* ── TIMELINE TAB ── */}
              {activeTab === "timeline" && (
                <div className="h-full overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
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
              )}

              {/* ── DETAILS TAB ── */}
              {activeTab === "details" && (
                <div className="h-full overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Fact icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={lead.email} />
                    <Fact icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={lead.phone} />
                    <Fact icon={<MapPin className="h-3.5 w-3.5" />} label="Area" value={lead.community} />
                    <Fact icon={<Wallet className="h-3.5 w-3.5" />} label="Budget" value={`${usd(lead.budgetMin)}–${usd(lead.budgetMax)}`} />
                    <Fact icon={<TagIcon className="h-3.5 w-3.5" />} label="Intent" value={lead.intent} />
                    <Fact icon={<CalendarClock className="h-3.5 w-3.5" />} label="Source" value={lead.source} />
                    <Fact
                      icon={<CalendarClock className="h-3.5 w-3.5" />}
                      label="Last contact"
                      value={lead.lastContactDaysAgo === 0 ? "today" : `${lead.lastContactDaysAgo}d ago`}
                    />
                    <Fact
                      icon={<CalendarClock className="h-3.5 w-3.5" />}
                      label="Lead age"
                      value={`${lead.createdDaysAgo}d`}
                    />
                  </div>

                  {lead.tags.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-wide text-slate/50">Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {lead.tags.map((t) => (
                          <Pill key={t} tone="azure">{t}</Pill>
                        ))}
                      </div>
                    </div>
                  )}

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

                  {lead.propertyViews && lead.propertyViews.length > 0 && (
                    <div className="rounded-2xl border border-ink/[0.07] bg-white p-4">
                      <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-widest text-slate/50">Property interests</p>
                      <div className="flex flex-wrap gap-2">
                        {lead.propertyViews.map((view, idx) => (
                          <span key={idx} className="rounded-full border border-ink/[0.08] bg-[#f4f4f3] px-2.5 py-1 text-xs text-ink">
                            {view}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── DOCUMENTS TAB ── */}
              {activeTab === "documents" && (
                docMode ? (
                  <DocGeneratorPanel
                    lead={lead}
                    initialTemplate={preselectedDoc}
                    onBack={() => {
                      setDocMode(false);
                      setPreselectedDoc(null);
                    }}
                  />
                ) : (
                  <div className="h-full overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
                    <div className="mb-4">
                      <h3 className="text-[0.95rem] font-semibold text-ink">Generate Document</h3>
                      <p className="text-[0.78rem] text-slate/55">Auto-filled from this lead&apos;s record</p>
                    </div>

                    <div className="space-y-2.5">
                      {LEAD_DOC_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <div
                            key={opt.id}
                            className="flex items-start gap-3.5 rounded-xl border border-ink/[0.08] bg-white p-4 transition-colors hover:border-ink/[0.14] hover:bg-paper"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                              <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[0.85rem] font-semibold text-ink">{opt.name}</p>
                              <p className="mt-0.5 text-[0.75rem] leading-snug text-slate/60">{opt.desc}</p>
                            </div>
                            <button
                              onClick={() => openDocGenerator(opt.id)}
                              className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-[0.76rem] font-semibold text-white transition-colors hover:bg-teal-700"
                            >
                              Generate <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 rounded-xl border border-dashed border-ink/[0.12] bg-ink/[0.015] px-4 py-3 text-center">
                      <p className="text-[0.78rem] text-slate/50">Need a different document type?</p>
                      <button
                        onClick={() => {
                          setPreselectedDoc(null);
                          setDocMode(true);
                        }}
                        className="mt-1 inline-flex items-center gap-1 text-[0.78rem] font-semibold text-teal-600 hover:text-teal-700"
                      >
                        Browse all templates <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )
              )}

              {/* ── NOTES TAB ── */}
              {activeTab === "notes" && (
                <div className="h-full overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
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
                        rows={3}
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

                  {/* Logged notes from extra timeline */}
                  {extra.filter((e) => e.kind === "note").length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-slate/45">Saved notes</p>
                      {extra
                        .filter((e) => e.kind === "note")
                        .map((n) => (
                          <div key={n.id} className="rounded-lg border border-ink/[0.06] bg-white px-3.5 py-2.5">
                            <p className="text-[0.82rem] text-ink">{n.label}</p>
                            <p className="mt-1 text-[0.7rem] text-slate/45">just now</p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
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
