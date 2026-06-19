"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  FileText,
  Loader2,
  RefreshCw,
  Wand2,
} from "lucide-react";
import { leads } from "@/lib/data";
import { streamAi } from "@/lib/ai/client";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { LiveDot } from "@/components/command/ui";
import { cn } from "@/lib/utils";

/* ── helpers ───────────────────────────────────────────────────────────── */

function formatBudget(min: number, max: number) {
  return `$${Math.round(min / 1000)}k–$${Math.round(max / 1000)}k`;
}

function deriveTimeline(lead: (typeof leads)[number]) {
  if (lead.tags.includes("Urgent")) return "ASAP";
  if (lead.stage === "Showing" || lead.stage === "Offer") return "Immediate";
  return "Next 60–90 days";
}

/* ── types ─────────────────────────────────────────────────────────────── */

type FormValues = {
  name: string;
  source: string;
  intent: string;
  area: string;
  budget: string;
  timeline: string;
  message: string;
};

const BLANK: FormValues = {
  name: "",
  source: "",
  intent: "",
  area: "",
  budget: "",
  timeline: "",
  message: "",
};

const SOURCE_OPTIONS = [
  "Zillow",
  "Realtor.com",
  "Google",
  "Facebook",
  "Referral",
  "Open House",
  "Call-In",
  "Walk-in",
  "Other",
];

/* ── label component ───────────────────────────────────────────────────── */

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70"
    >
      {children}
    </label>
  );
}

/* ── main page ─────────────────────────────────────────────────────────── */

export default function LeadResponderPage() {
  const [values, setValues] = useState<FormValues>(BLANK);
  const [loadedName, setLoadedName] = useState<string | null>(null);
  const [crmValue, setCrmValue] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const [copied, setCopied] = useState(false);

  /* ── CRM loader ─────────────────────────────────────────────────────── */

  function handleCrmChange(id: string) {
    setCrmValue(id);
    if (!id) {
      setLoadedName(null);
      return;
    }
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;
    setValues({
      name: lead.name,
      source: lead.source,
      intent: lead.intent,
      area: lead.community,
      budget: formatBudget(lead.budgetMin, lead.budgetMax),
      timeline: deriveTimeline(lead),
      message: lead.aiSummary ?? "",
    });
    setLoadedName(lead.firstName);
    setOutput("");
    setTouched(false);
  }

  /* ── field updater ──────────────────────────────────────────────────── */

  function set(field: keyof FormValues, v: string) {
    setValues((prev) => ({ ...prev, [field]: v }));
  }

  /* ── AI call ────────────────────────────────────────────────────────── */

  async function run() {
    if (busy) return;
    setBusy(true);
    setTouched(true);
    setOutput("");
    try {
      await streamAi(
        { tool: "lead-responder", input: values },
        (_chunk, full) => setOutput(full),
      );
    } finally {
      setBusy(false);
    }
  }

  async function tryExampleAndRun() {
    if (busy || !leads[0]) return;
    const lead = leads[0];
    const filled: FormValues = {
      name: lead.name,
      source: lead.source,
      intent: lead.intent,
      area: lead.community,
      budget: formatBudget(lead.budgetMin, lead.budgetMax),
      timeline: deriveTimeline(lead),
      message: lead.aiSummary ?? "",
    };
    setCrmValue(lead.id);
    setLoadedName(lead.firstName);
    setValues(filled);
    setOutput("");
    setTouched(true);
    setBusy(true);
    try {
      await streamAi(
        { tool: "lead-responder", input: filled },
        (_chunk, full) => setOutput(full),
      );
    } finally {
      setBusy(false);
    }
  }

  /* ── copy ───────────────────────────────────────────────────────────── */

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  /* ── shared input classes ───────────────────────────────────────────── */

  const inputCls =
    "rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.85rem] text-ink placeholder:text-slate/40 transition-colors focus:border-ink/40 focus:bg-white focus:outline-none";

  const selectCls =
    "w-full appearance-none rounded-lg border border-ink/[0.08] bg-white py-2 pl-3 pr-8 text-[0.85rem] text-ink transition-colors focus:border-ink/40 focus:outline-none";

  /* ── render ─────────────────────────────────────────────────────────── */

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      {/* ── page header ── */}
      <div className="mb-5">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Lead Reply</h1>
        <p className="mt-1 text-[0.92rem] text-slate">
          Craft the perfect first response, personalized to each lead.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* ════════════════ INPUT COLUMN ════════════════ */}
        <div className="rounded-2xl border border-ink/[0.08] bg-white p-5">
          {/* panel header */}
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/[0.06]">
              <Wand2 className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl text-ink">Lead Reply</h2>
                <span className="rounded bg-white px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-slate/70 ring-1 ring-inset ring-ink/[0.06]">
                  Lead Conversion
                </span>
              </div>
              <p className="mt-1 text-[0.86rem] leading-relaxed text-slate">
                Speed-to-lead wins deals. Draft a personalized, ready-to-send
                first reply that references the lead&apos;s area, price point,
                and intent — under 130 words, signed by the Matin team.
              </p>
            </div>
          </div>

          {/* ── One-click example ── */}
          {!loadedName && (
            <button
              type="button"
              onClick={tryExampleAndRun}
              disabled={busy}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-azure/30 bg-azure/[0.07] px-4 py-2.5 text-[0.84rem] font-semibold text-azure transition-colors hover:bg-azure/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
              ) : (
                <><Wand2 className="h-4 w-4" /> Try with live CRM lead</>
              )}
            </button>
          )}

          {/* ── CRM loader ── */}
          <div className="mt-5 flex flex-col items-start gap-2 rounded-xl border border-ink/[0.08] bg-white px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
            <span className="shrink-0 text-[0.72rem] font-semibold uppercase tracking-wider text-slate/60">
              Load from CRM
            </span>
            <div className="relative flex-1 w-full sm:w-auto">
              <select
                value={crmValue}
                onChange={(e) => handleCrmChange(e.target.value)}
                className="w-full appearance-none rounded-lg border border-ink/[0.08] bg-white py-2 pl-3 pr-8 text-sm text-ink transition-colors focus:border-ink/40 focus:outline-none"
              >
                <option value="">— load a lead from CRM —</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} · {l.stage} · {l.community}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate/50" />
            </div>
            {loadedName && (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <Check className="h-3 w-3" />
                Loaded: {loadedName}
              </span>
            )}
          </div>

          {/* ── form ── */}
          <form
            className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              run();
            }}
          >
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="f-name">Lead name</FieldLabel>
              <input
                id="f-name"
                type="text"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Priya Reyes"
                className={inputCls}
              />
            </div>

            {/* Source — select */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="f-source">Source</FieldLabel>
              <div className="relative">
                <select
                  id="f-source"
                  value={values.source}
                  onChange={(e) => set("source", e.target.value)}
                  className={selectCls}
                >
                  <option value="">Select…</option>
                  {SOURCE_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate/50" />
              </div>
            </div>

            {/* Intent */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="f-intent">Intent</FieldLabel>
              <input
                id="f-intent"
                type="text"
                value={values.intent}
                onChange={(e) => set("intent", e.target.value)}
                placeholder="Buying / Selling / Both"
                className={inputCls}
              />
            </div>

            {/* Area */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="f-area">Area / community</FieldLabel>
              <input
                id="f-area"
                type="text"
                value={values.area}
                onChange={(e) => set("area", e.target.value)}
                placeholder="Ridgefield"
                className={inputCls}
              />
            </div>

            {/* Budget */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="f-budget">Budget</FieldLabel>
              <input
                id="f-budget"
                type="text"
                value={values.budget}
                onChange={(e) => set("budget", e.target.value)}
                placeholder="$805k–$980k"
                className={inputCls}
              />
            </div>

            {/* Timeline */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="f-timeline">Timeline</FieldLabel>
              <input
                id="f-timeline"
                type="text"
                value={values.timeline}
                onChange={(e) => set("timeline", e.target.value)}
                placeholder="Next 60–90 days"
                className={inputCls}
              />
            </div>

            {/* Message */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel htmlFor="f-message">
                Their message / context
              </FieldLabel>
              <textarea
                id="f-message"
                value={values.message}
                onChange={(e) => set("message", e.target.value)}
                placeholder="What did they say or ask for?"
                rows={3}
                className={cn(inputCls, "resize-y")}
              />
            </div>

            {/* Submit */}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[0.88rem] font-semibold text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> AI is
                    writing…
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" /> Draft reply
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ════════════════ OUTPUT COLUMN ════════════════ */}
        <div className="flex flex-col rounded-2xl border border-ink/[0.08] bg-white">
          {/* output header bar */}
          <div className="flex items-center justify-between gap-3 border-b border-ink/[0.08] px-5 py-3.5">
            <div className="flex items-center gap-2">
              {busy ? (
                <LiveDot tone="azure" />
              ) : (
                <FileText className="h-4 w-4 text-ink" />
              )}
              <span className="text-[0.84rem] font-semibold text-ink">
                Drafted reply
              </span>
              {busy && (
                <span className="text-[0.72rem] text-slate/70">
                  streaming live
                </span>
              )}
            </div>
            {output && !busy && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={copy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1.5 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={run}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1.5 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </button>
              </div>
            )}
          </div>

          {/* output body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {!touched && !output ? (
              /* empty state */
              <div className="flex h-full min-h-[20rem] flex-col items-center justify-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paper ring-1 ring-inset ring-ink/[0.06]">
                  <Wand2 className="h-6 w-6 text-ink/30" />
                </div>
                <p className="text-center text-[0.82rem] text-slate/45">
                  Fill in the details and draft your lead reply
                </p>
              </div>
            ) : (
              /* email preview wrapper */
              <div className="rounded-xl border border-ink/[0.08] bg-[#f9f8f7] overflow-hidden">
                {/* email header */}
                <div className="border-b border-ink/[0.06] bg-white px-5 py-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-[0.8rem]">
                    <span className="w-14 shrink-0 text-slate/60 font-medium">
                      From:
                    </span>
                    <span className="text-ink">
                      Matin Real Estate · (503) 622-9624
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[0.8rem]">
                    <span className="w-14 shrink-0 text-slate/60 font-medium">
                      To:
                    </span>
                    <span className="text-ink">
                      {values.name || "Lead"}
                    </span>
                  </div>
                </div>

                {/* email body */}
                <div className="px-5 py-5">
                  <div className="prose-document text-[0.875rem] leading-relaxed text-ink">
                    <AiMarkdown text={output} />
                    {busy && (
                      <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-ink align-middle" />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
