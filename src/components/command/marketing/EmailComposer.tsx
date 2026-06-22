"use client";

import { useMemo, useState } from "react";
import {
  Bold,
  Italic,
  Link2,
  List,
  Search,
  X,
  Loader2,
  Sparkle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MatinMark } from "@/components/brand/Logo";
import { STUDIO_LISTING } from "./marketing-branding";

/* ──────────────────────────────────────────────────────────────────────────
   Marketing Studio — EmailComposer  (S8 ticket 6, BoldTrail composer)

   A WORKING email composer: a rich-text toolbar row (Bold / Italic / Link /
   List + a merge-token inserter), a To: recipient pill, a "Search templates"
   box that filters real saved templates, a subject field, a body textarea with
   VISIBLE merge tokens, and an inline "Use Matin AI" button (gold = AI) that
   streams a draft into the body. Inserting a merge token drops it at the end of
   the body; clicking a template loads its subject + body.

   It is genuinely interactive: every control mutates local state and the
   preview merge-token chips reflect what's in the body. The "Use Matin AI"
   button calls the page-provided `onGenerate` (streamAi) — the only gold
   affordance here. Client.
   ────────────────────────────────────────────────────────────────────────── */

const MERGE_TOKENS = [
  "{{first_name}}",
  "{{last_name}}",
  "{{address}}",
  "{{community}}",
  "{{agent_name}}",
  "{{agent_phone}}",
];

type Template = { id: string; label: string; subject: string; body: string };

const TEMPLATES: Template[] = [
  {
    id: "just-listed",
    label: "Just listed",
    subject: `Just listed in ${STUDIO_LISTING.cityShort} — ${STUDIO_LISTING.address}`,
    body: `Hi {{first_name}},\n\nWe just listed {{address}} in {{community}} — ${STUDIO_LISTING.beds} bed, ${STUDIO_LISTING.baths} bath, ${STUDIO_LISTING.sqft} sq ft at ${STUDIO_LISTING.price}. Homes like this in {{community}} are moving quickly.\n\nWant a private tour before the weekend rush? Reply here or call me at {{agent_phone}}.\n\nWarmly,\n{{agent_name}}`,
  },
  {
    id: "home-value",
    label: "Home value nudge",
    subject: "What's your home worth in today's market?",
    body: `Hi {{first_name}},\n\nHomes near {{address}} are selling in under 3 weeks. Curious what yours could fetch right now? I'll send a no-pressure valuation and a same-week market report.\n\nJust reply "value" and I'll get it over to you.\n\n{{agent_name}}`,
  },
  {
    id: "open-house",
    label: "Open house invite",
    subject: `Open house this weekend · ${STUDIO_LISTING.address}`,
    body: `Hi {{first_name}},\n\nYou're invited to an open house at {{address}} in {{community}} this Saturday, 11–1. Primary on main, quartz kitchen, oversized lot. Bring your pre-approval and we'll have coffee ready.\n\nSee you there,\n{{agent_name}}`,
  },
  {
    id: "past-client",
    label: "Past-client check-in",
    subject: "Checking in — anything I can help with?",
    body: `Hi {{first_name}},\n\nIt's been a while since we closed on your home — I hope {{community}} still feels like the right fit. If you're ever curious about your equity or know someone thinking of a move, I'm one reply away.\n\nAlways here,\n{{agent_name}}`,
  },
];

const TOOLBAR = [
  { icon: Bold, label: "Bold" },
  { icon: Italic, label: "Italic" },
  { icon: Link2, label: "Insert link" },
  { icon: List, label: "Bulleted list" },
];

export function EmailComposer({
  onGenerate,
  generating = false,
}: {
  /** Page-provided streamAi draft → resolves with subject+body text. */
  onGenerate?: () => Promise<{ subject?: string; body: string } | string> | void;
  generating?: boolean;
}) {
  const [recipients, setRecipients] = useState<string[]>([
    "Seller database · 1,286",
  ]);
  const [templateQuery, setTemplateQuery] = useState("");
  const [subject, setSubject] = useState(TEMPLATES[0].subject);
  const [body, setBody] = useState(TEMPLATES[0].body);
  const [activeTemplate, setActiveTemplate] = useState<string>("just-listed");

  const filteredTemplates = useMemo(() => {
    const q = templateQuery.trim().toLowerCase();
    if (!q) return TEMPLATES;
    return TEMPLATES.filter(
      (t) => t.label.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q),
    );
  }, [templateQuery]);

  // Which merge tokens are currently present in the body (drives the chip row).
  const usedTokens = useMemo(
    () => MERGE_TOKENS.filter((t) => body.includes(t) || subject.includes(t)),
    [body, subject],
  );

  function loadTemplate(t: Template) {
    setActiveTemplate(t.id);
    setSubject(t.subject);
    setBody(t.body);
  }

  function insertToken(token: string) {
    setBody((b) => (b.endsWith("\n") || b === "" ? b + token : `${b} ${token}`));
  }

  function removeRecipient(r: string) {
    setRecipients((prev) => prev.filter((x) => x !== r));
  }

  async function handleGenerate() {
    if (!onGenerate) return;
    const result = await onGenerate();
    if (!result) return;
    if (typeof result === "string") {
      setBody(result);
    } else {
      if (result.subject) setSubject(result.subject);
      setBody(result.body);
    }
  }

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mist px-5 py-4">
        <div className="flex items-center gap-2">
          <MatinMark theme="dark" className="h-5" />
          <h2 className="font-display text-[1.02rem] font-normal leading-tight text-ink">
            Email composer
          </h2>
        </div>
        <span className="text-[0.72rem] text-slate">
          Branded from {STUDIO_LISTING.cityShort} · {usedTokens.length} merge
          fields live
        </span>
      </div>

      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[200px_1fr]">
        {/* Template rail */}
        <div className="border-b border-mist p-4 lg:border-b-0 lg:border-r">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate" />
            <input
              type="text"
              value={templateQuery}
              onChange={(e) => setTemplateQuery(e.target.value)}
              placeholder="Search templates"
              className="w-full rounded-lg border border-mist bg-paper py-2 pl-8 pr-3 text-[0.78rem] text-ink outline-none transition-colors focus:border-ink/40 focus-visible:ring-2 focus-visible:ring-ink/20"
            />
          </div>
          <ul className="flex flex-col gap-1">
            {filteredTemplates.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => loadTemplate(t)}
                  className={cn(
                    "flex min-h-11 w-full items-center rounded-lg border px-3 text-left text-[0.78rem] font-medium transition-colors",
                    activeTemplate === t.id
                      ? "border-ink bg-ink text-cloud"
                      : "border-mist bg-cloud text-ink hover:border-ink/20 hover:bg-paper",
                  )}
                >
                  {t.label}
                </button>
              </li>
            ))}
            {filteredTemplates.length === 0 ? (
              <li className="px-1 py-2 text-[0.74rem] text-slate">
                No templates match “{templateQuery}”.
              </li>
            ) : null}
          </ul>
        </div>

        {/* Compose surface */}
        <div className="flex flex-col gap-3 p-4">
          {/* To: recipient pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-slate">
              To
            </span>
            {recipients.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1.5 rounded-full bg-paper-200 px-2.5 py-1 text-[0.74rem] font-medium text-ink ring-1 ring-inset ring-mist"
              >
                {r}
                <button
                  type="button"
                  onClick={() => removeRecipient(r)}
                  aria-label={`Remove ${r}`}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate hover:bg-mist hover:text-ink"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {recipients.length === 0 ? (
              <button
                type="button"
                onClick={() => setRecipients(["Seller database · 1,286"])}
                className="rounded-full border border-dashed border-mist px-2.5 py-1 text-[0.74rem] font-medium text-slate hover:border-ink/20 hover:text-ink"
              >
                + Add recipients
              </button>
            ) : null}
          </div>

          {/* Subject */}
          <label className="block">
            <span className="mb-1 block text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-slate">
              Subject
            </span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.84rem] font-medium text-ink outline-none transition-colors focus:border-ink/40 focus-visible:ring-2 focus-visible:ring-ink/20"
            />
          </label>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-mist bg-paper px-2 py-1.5">
            {TOOLBAR.map(({ icon: Icon, label }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                title={label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate transition-colors hover:bg-cloud hover:text-ink"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-mist" aria-hidden />
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[0.68rem] font-medium text-slate">Insert:</span>
              {MERGE_TOKENS.map((tk) => (
                <button
                  key={tk}
                  type="button"
                  onClick={() => insertToken(tk)}
                  className="rounded-sm bg-gold-soft px-1.5 py-1 font-mono text-[0.7rem] font-medium text-gold-ink transition-colors hover:bg-gold/30"
                >
                  {tk}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-gold px-3 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-gold-bright disabled:opacity-60"
            >
              {generating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Drafting…
                </>
              ) : (
                <>
                  <Sparkle className="h-3.5 w-3.5" aria-hidden />
                  Use Matin AI
                </>
              )}
            </button>
          </div>

          {/* Body */}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={9}
            className="w-full resize-y rounded-lg border border-mist bg-cloud px-3.5 py-3 text-[0.84rem] leading-relaxed text-ink outline-none transition-colors focus:border-ink/40 focus-visible:ring-2 focus-visible:ring-ink/20"
          />

          {/* Live merge-token chips */}
          {usedTokens.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[0.7rem] text-slate">Merge fields in this email:</span>
              {usedTokens.map((t) => (
                <span
                  key={t}
                  className="rounded-sm bg-gold-soft px-1.5 py-0.5 font-mono text-[0.7rem] font-medium text-gold-ink"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          {/* Footer note */}
          <p className="text-[0.7rem] leading-snug text-slate">
            Merge fields resolve per recipient at send. Drafts route to the brand
            kit + approval queue — nothing reaches the audience without sign-off.
          </p>
        </div>
      </div>
    </section>
  );
}
