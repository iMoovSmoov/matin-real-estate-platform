"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Wand2,
  Printer,
  X,
  ClipboardCopy,
  Share2,
  MessageSquare,
  PhoneCall,
} from "lucide-react";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { LiveDot, StatTile } from "@/components/command/ui";
import { company } from "@/lib/data";

export type Field = {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea" | "select" | "number";
  options?: string[];
  full?: boolean;
  /** Optional prefix symbol rendered inside the input (e.g. "$" for currency fields) */
  prefix?: string;
  /** When true, renders a lighter "(optional)" badge next to the label */
  optional?: boolean;
};

export type Preset = {
  label: string;
  hint?: string;
  values: Record<string, string>;
};

export function AiToolPanel({
  tool,
  title,
  description,
  pillar,
  fields,
  submitLabel = "Generate",
  presets,
  presetLabel = "Quick-fill",
  outputTitle = "AI output",
  printable = false,
  initial = {},
  outputMinHeight,
  reportBannerLabel,
  reportBannerSub,
  externalPreset,
  tryExample,
  onOutputChange,
  mobileOutputFirst = false,
}: {
  tool: string;
  title: string;
  description: string;
  pillar?: string;
  fields: Field[];
  submitLabel?: string;
  presets?: Preset[];
  presetLabel?: string;
  outputTitle?: string;
  printable?: boolean;
  initial?: Record<string, string>;
  /** Minimum height (px) for the output document area — useful for long reports like CMAs */
  outputMinHeight?: number;
  /** Small-caps eyebrow text shown in the report banner above AI output */
  reportBannerLabel?: string;
  /** Sub-line shown below the address in the report banner */
  reportBannerSub?: string;
  /** An externally-driven preset (e.g. from a "load from DB" selector on the host page) */
  externalPreset?: Preset;
  /** One-click demo: fills all fields with realistic sample data and auto-runs the AI */
  tryExample?: Preset;
  /** Called with the accumulated output text on every token — use to extract signals from the stream */
  onOutputChange?: (text: string) => void;
  /** When true, the output panel renders above the input form on mobile (output-primary layout) */
  mobileOutputFirst?: boolean;
}) {
  const blank = Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? ""]));
  const [values, setValues] = useState<Record<string, string>>(blank);
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedTalking, setCopiedTalking] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [touched, setTouched] = useState(false);
  const [docDate, setDocDate] = useState("");
  const [tone, setTone] = useState<"professional" | "warm" | "luxury">("professional");
  const [drafts, setDrafts] = useState<string[]>([]);
  const [activeDraft, setActiveDraft] = useState(0);
  const [priceRange, setPriceRange] = useState<{ low: string; mid: string; high: string } | null>(null);
  // Mobile slide-over: opens when generation starts on screens < lg (1024px)
  const [mobileSlideOver, setMobileSlideOver] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // Track mobile breakpoint
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 1024);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (output && !docDate) {
      setDocDate(
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    }
    // Parse recommended price range for StatTile KPIs
    if (output && !busy) {
      const match = output.match(/Recommended List Price Range:\s*\$([0-9,]+)\s*[–\-]\s*\$([0-9,]+)/i);
      if (match) {
        const low = parseInt(match[1].replace(/,/g, ""), 10);
        const high = parseInt(match[2].replace(/,/g, ""), 10);
        const mid = Math.round((low + high) / 2);
        setPriceRange({
          low: "$" + low.toLocaleString(),
          mid: "$" + mid.toLocaleString(),
          high: "$" + high.toLocaleString(),
        });
      }
    }
  }, [output, docDate, busy]);

  // Apply an externally-driven preset (e.g. from a "load from DB" selector on the host page)
  useEffect(() => {
    if (externalPreset) {
      setValues({ ...blank, ...externalPreset.values });
      setOutput("");
      setDocDate("");
      setTouched(false);
      setPriceRange(null);
      setMobileSlideOver(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPreset]);

  function set(name: string, v: string) {
    setValues((prev) => ({ ...prev, [name]: v }));
  }

  function applyPreset(p: Preset) {
    setValues({ ...blank, ...p.values });
    setOutput("");
    setDocDate("");
    setTouched(false);
    setPriceRange(null);
  }

  function handleOutputUpdate(full: string) {
    setOutput(full);
    onOutputChange?.(full);
  }

  async function copyScript() {
    const scriptSection = output.split("## Phone Script Opener")[1]?.split(/^## /m)[0] ?? "";
    if (!scriptSection.trim()) return;
    try {
      await navigator.clipboard.writeText(scriptSection.trim());
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function copyTalkingPoints() {
    const match = output.match(/###\s*Talking Points[\s\S]*?(?=###|\n---|##|$)/i);
    if (!match) return;
    try {
      await navigator.clipboard.writeText(match[0].trim());
      setCopiedTalking(true);
      setTimeout(() => setCopiedTalking(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function tryExampleAndRun() {
    if (!tryExample || busy) return;
    const filled = { ...blank, ...tryExample.values };
    setValues(filled);
    // Save current output as a draft before clearing
    setDrafts((prev) => {
      if (output) {
        const next = [...prev, output].slice(-3);
        setActiveDraft(next.length - 1);
        return next;
      }
      return prev;
    });
    setOutput("");
    setDocDate("");
    setTouched(true);
    setBusy(true);
    setPriceRange(null);
    if (isMobile) {
      setMobileSlideOver(true);
    } else {
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
    try {
      const finalOutput = await streamAi({ tool, input: { ...filled, tone } }, (_chunk, full) => handleOutputUpdate(full));
      if (finalOutput) {
        setDrafts((prev) => {
          const next = [...prev, finalOutput].slice(-3);
          setActiveDraft(next.length - 1);
          return next;
        });
        try { localStorage.setItem(`matin_ai_last_${tool}`, finalOutput.slice(0, 600)); } catch { /* private mode */ }
      }
    } finally {
      setBusy(false);
    }
  }

  async function run() {
    if (busy) return;
    // Save current output as a draft before clearing
    setDrafts((prev) => {
      if (output) {
        const next = [...prev, output].slice(-3);
        setActiveDraft(next.length - 1);
        return next;
      }
      return prev;
    });
    setBusy(true);
    setTouched(true);
    setOutput("");
    setDocDate("");
    setPriceRange(null);
    if (isMobile) {
      setMobileSlideOver(true);
    } else {
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
    try {
      const finalOutput = await streamAi({ tool, input: { ...values, tone } }, (_chunk, full) => handleOutputUpdate(full));
      if (finalOutput) {
        setDrafts((prev) => {
          const next = [...prev, finalOutput].slice(-3);
          setActiveDraft(next.length - 1);
          return next;
        });
        try { localStorage.setItem(`matin_ai_last_${tool}`, finalOutput.slice(0, 600)); } catch { /* private mode */ }
      }
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  function clear() {
    setOutput("");
    setDocDate("");
    setTouched(false);
    setDrafts([]);
    setActiveDraft(0);
    setPriceRange(null);
  }

  return (
    <>
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
      {/* ── Input column ── */}
      <div className={cn(
        "rounded-2xl border border-ink/[0.08] bg-white px-4 py-5 md:px-6 md:py-6",
        printable && "print:hidden",
        mobileOutputFirst && "order-last lg:order-first"
      )}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/[0.06]">
            <Wand2 className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            {pillar && (
              <span className="mb-1.5 inline-block rounded-full bg-azure/[0.09] px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-azure">
                {pillar}
              </span>
            )}
            <h2 className="font-display text-xl text-ink sm:text-2xl">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate max-w-2xl">{description}</p>
          </div>
        </div>

        {/* One-click "Try example" — fills all fields + auto-runs */}
        {tryExample && (
          <button
            type="button"
            onClick={tryExampleAndRun}
            disabled={busy}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-azure/30 bg-gradient-to-r from-azure/[0.08] to-azure-bright/[0.06] px-4 py-2.5 text-sm font-semibold text-azure transition-colors hover:border-azure/60 hover:bg-azure/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              <><Wand2 className="h-4 w-4" /> Try with live data &rarr;</>
            )}
          </button>
        )}

        {presets && presets.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-slate/55">
              {presetLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="group inline-flex items-center gap-1.5 rounded-lg border border-ink/10 bg-white px-3 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:border-ink/20 hover:bg-paper hover:text-ink"
                  title={p.hint}
                >
                  <Wand2 className="h-3.5 w-3.5 text-ink" />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
        >
          {fields.map((f) => (
            <div
              key={f.name}
              className={cn(
                "flex flex-col gap-1.5",
                (f.full || f.type === "textarea") ? "col-span-1 sm:col-span-2" : "col-span-1"
              )}
            >
              <label
                htmlFor={`f-${f.name}`}
                className="flex items-center gap-1.5 text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70"
              >
                {f.label}
                {f.optional && (
                  <span className="text-[0.6rem] font-normal normal-case tracking-normal text-slate/40">
                    optional
                  </span>
                )}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  id={`f-${f.name}`}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                  placeholder={f.placeholder}
                  rows={3}
                  className="w-full resize-y rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.85rem] text-ink placeholder:text-slate/40 transition-colors focus:border-ink/40 focus:bg-white focus:outline-none"
                />
              ) : f.type === "select" ? (
                <select
                  id={`f-${f.name}`}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                  className="rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.85rem] text-ink transition-colors focus:border-ink/40 focus:outline-none"
                >
                  <option value="" className="bg-white">
                    Select...
                  </option>
                  {f.options?.map((o) => (
                    <option key={o} value={o} className="bg-white">
                      {o}
                    </option>
                  ))}
                </select>
              ) : f.prefix ? (
                /* Prefix input — e.g. "$" for currency fields */
                <div className="flex overflow-hidden rounded-lg border border-ink/[0.08] bg-white transition-colors focus-within:border-ink/40">
                  <span className="flex select-none items-center border-r border-ink/[0.08] bg-paper px-3 text-[0.85rem] font-medium text-slate/60">
                    {f.prefix}
                  </span>
                  <input
                    id={`f-${f.name}`}
                    type={f.type === "number" ? "number" : "text"}
                    value={values[f.name] ?? ""}
                    onChange={(e) => set(f.name, e.target.value)}
                    placeholder={f.placeholder?.replace(/^\$/, "")}
                    className="flex-1 bg-white px-3 py-2 text-[0.85rem] text-ink placeholder:text-slate/40 focus:outline-none"
                  />
                </div>
              ) : (
                <input
                  id={`f-${f.name}`}
                  type={f.type === "number" ? "number" : "text"}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                  placeholder={f.placeholder}
                  className={cn(
                    "rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.85rem] text-ink placeholder:text-slate/40 transition-colors focus:border-ink/40 focus:bg-white focus:outline-none",
                    f.type === "number" && "sm:max-w-[200px]"
                  )}
                />
              )}
            </div>
          ))}

          {/* Tone selector */}
          <div className="col-span-1 sm:col-span-2">
            <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">Tone</p>
            <div className="flex gap-2">
              {(["professional", "warm", "luxury"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-[0.78rem] font-medium capitalize transition-colors",
                    tone === t
                      ? "border-ink bg-ink text-white"
                      : "border-ink/[0.08] bg-white text-slate hover:border-ink/20 hover:text-ink"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-1 sm:col-span-2 sticky bottom-4 sm:static">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:shadow-none"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" /> {submitLabel}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Output column (desktop only — mobile uses slide-over) ── */}
      <div ref={outputRef} className={cn(
        "hidden lg:flex flex-col rounded-2xl border border-ink/[0.08] bg-white shadow-sm overflow-hidden lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-hidden",
        printable && "print:flex print:rounded-none print:border-0 print:shadow-none",
        mobileOutputFirst && "order-first lg:order-last"
      )}>
        {/* Output column header bar */}
        <div className="no-print flex items-center gap-3 border-b border-ink/[0.08] px-5 py-3.5">
          <div className="flex items-center gap-2">
            {busy ? <LiveDot tone="azure" /> : <FileText className="h-4 w-4 text-ink" />}
            <span className="text-[0.84rem] font-semibold text-ink">{outputTitle}</span>
            {busy && (
              <span className="text-[0.72rem] text-slate/70">streaming live</span>
            )}
          </div>
          {output && (
            <span className="ml-auto mr-1 text-[0.72rem] tabular-nums text-slate/40">
              {output.split(/\s+/).filter(Boolean).length} words
              {" · "}
              {output.length} chars
            </span>
          )}
          {output && !busy && (
            <div className={cn("flex items-center gap-1.5", output ? "" : "ml-auto")}>
              <button
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1.5 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <ClipboardCopy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied!" : "Copy all"}
              </button>
              <button
                onClick={() => run()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1.5 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate
              </button>
            </div>
          )}
        </div>

        {/* Document area */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ minHeight: outputMinHeight ?? 400 }}
        >
          {!touched && !output ? (
            <EmptyState outputTitle={outputTitle} minHeight={outputMinHeight} />
          ) : (
            <div className="flex flex-col h-full">
              {/* CMA report banner — rendered when reportBannerLabel is provided */}
              {output && !busy && reportBannerLabel && (
                <div className="mx-4 mt-4 mb-1 rounded-xl border border-ink/[0.08] bg-paper px-4 py-3 sm:mx-8 sm:mt-6 sm:px-5 sm:py-4">
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-slate/50">
                    {reportBannerLabel}
                  </p>
                  {values.address && (
                    <p className="mt-1 font-display text-[1.05rem] font-semibold text-ink">
                      {values.address}
                      {values.city ? `, ${values.city}` : ""}
                    </p>
                  )}
                  {reportBannerSub && (
                    <p className="mt-1 text-[0.7rem] text-slate/55">
                      {reportBannerSub}
                    </p>
                  )}
                </div>
              )}

              {/* Price range stat tiles — appear after stream completes if range detected */}
              {priceRange && !busy && (
                <div className="mx-4 mt-3 grid grid-cols-3 gap-3 sm:mx-8">
                  <StatTile label="Low end" value={priceRange.low} />
                  <StatTile label="Recommended" value={priceRange.mid} accent={true} />
                  <StatTile label="High end" value={priceRange.high} />
                </div>
              )}

              {/* Document header — shown once output + date are ready */}
              {output && docDate && (
                <div className="bg-[#f8f7f6] ring-1 ring-ink/[0.06] px-4 py-3 flex flex-wrap items-center justify-between gap-2 sm:px-8 sm:py-4 sm:flex-nowrap">
                  <p className="font-display text-[0.68rem] uppercase tracking-[0.18em] text-ink/40 shrink-0 sm:text-[0.72rem]">
                    Matin Real Estate
                  </p>
                  <p className="font-display text-[0.95rem] font-semibold text-ink text-center flex-1 truncate sm:text-[1.05rem]">
                    {values.docType && values.docType !== "" ? values.docType : outputTitle}
                  </p>
                  <p className="text-[0.72rem] text-slate/50 shrink-0 tabular-nums">{docDate}</p>
                </div>
              )}

              {/* Draft comparison tabs — shown after 2+ drafts exist */}
              {drafts.length > 1 && (
                <div className="flex gap-1 border-b border-ink/[0.08] bg-[#fafaf9] px-5 py-2">
                  {drafts.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setActiveDraft(i); setOutput(drafts[i]); }}
                      className={cn(
                        "rounded-md px-3 py-1 text-[0.74rem] font-medium transition-colors",
                        activeDraft === i
                          ? "bg-ink text-white"
                          : "text-slate hover:text-ink"
                      )}
                    >
                      Draft {i + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Divider line below header */}
              {output && docDate && (
                <div className="h-px bg-ink/[0.06]" />
              )}

              {/* Main content */}
              <div className="px-4 py-4 flex-1 sm:px-8 sm:py-6">
                <div className="prose-document rounded-xl border border-ink/[0.08] bg-white p-5 sm:p-6 text-[0.875rem] leading-relaxed text-ink">
                  <AiMarkdown text={output} />
                  {busy && (
                    <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-ink align-middle" />
                  )}
                </div>
              </div>

              {/* Schedule Walkthrough CTA — cash offer tool only */}
              {output && !busy && tool === "cash-offer-eval" && (
                <div className="mx-4 mb-1 mt-3 flex items-center gap-3 rounded-xl border border-ink/[0.08] bg-ink/[0.03] px-4 py-3 sm:mx-8">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink text-white">
                    <PhoneCall className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[0.78rem] font-semibold text-ink">Ready to firm up the number?</p>
                    <a
                      href={`tel:+1${company.phoneRaw}`}
                      className="text-[0.78rem] text-slate transition-colors hover:text-ink"
                    >
                      {company.phone} · Schedule a walkthrough
                    </a>
                  </div>
                </div>
              )}

              {/* Action buttons row — shown after output is complete */}
              {output && !busy && (
                <div className="no-print border-t border-ink/[0.06] bg-[#fafaf9] px-4 py-3 flex flex-wrap items-center gap-2 sm:px-8 sm:py-3.5">
                  <button
                    onClick={copy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-3 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:border-ink/20 hover:bg-paper hover:text-ink"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied ? "Copied!" : "Copy All"}
                  </button>
                  {tool === "seller-intel" && output.includes("## Phone Script Opener") && (
                    <button
                      onClick={copyScript}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-3 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:border-ink/20 hover:bg-paper hover:text-ink"
                    >
                      {copiedScript ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <PhoneCall className="h-3.5 w-3.5" />
                      )}
                      {copiedScript ? "Script copied!" : "Copy Script"}
                    </button>
                  )}
                  {output.toLowerCase().includes("talking points") && (
                    <button
                      onClick={copyTalkingPoints}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-3 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:border-ink/20 hover:bg-paper hover:text-ink"
                    >
                      {copiedTalking ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <MessageSquare className="h-3.5 w-3.5" />
                      )}
                      {copiedTalking ? "Copied!" : "Copy talking points"}
                    </button>
                  )}
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-3 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:border-ink/20 hover:bg-paper hover:text-ink"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print
                  </button>
                  <button
                    onClick={clear}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-3 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:border-red-100 hover:border-red-200 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" /> Clear
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.setItem("marketing-prefill-description", output);
                      window.location.href = "/hub/marketing";
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-3 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:border-ink/20 hover:bg-paper hover:text-ink"
                  >
                    <Share2 className="h-3.5 w-3.5" /> Push to Marketing
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
      {/* Mobile slide-over output panel */}
      {mobileSlideOver && (
        <div className="fixed inset-y-0 right-0 z-50 w-full bg-white border-l border-ink/[0.08] shadow-2xl flex flex-col lg:hidden">
          <div className="flex items-center justify-between gap-3 border-b border-ink/[0.08] px-4 py-3.5 shrink-0">
            <div className="flex items-center gap-2">
              {busy ? <LiveDot tone="azure" /> : <FileText className="h-4 w-4 text-ink" />}
              <span className="text-[0.84rem] font-semibold text-ink">{outputTitle}</span>
              {busy && <span className="text-[0.72rem] text-slate/70">streaming live</span>}
            </div>
            <div className="flex items-center gap-1.5">
              {output && !busy && (
                <>
                  <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1.5 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button onClick={() => run()} className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1.5 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink">
                    <RefreshCw className="h-3.5 w-3.5" /> Redo
                  </button>
                </>
              )}
              <button onClick={() => setMobileSlideOver(false)} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/[0.08] bg-white text-slate transition-colors hover:border-ink/20 hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {!touched && !output ? (
              <EmptyState outputTitle={outputTitle} minHeight={outputMinHeight} />
            ) : (
              <div className="flex flex-col h-full">
                {output && docDate && (
                  <div className="bg-[#f8f7f6] ring-1 ring-ink/[0.06] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-display text-[0.68rem] uppercase tracking-[0.18em] text-ink/40 shrink-0">Matin Real Estate</p>
                    <p className="font-display text-[0.95rem] font-semibold text-ink text-center flex-1 truncate">
                      {values.docType && values.docType !== "" ? values.docType : outputTitle}
                    </p>
                    <p className="text-[0.72rem] text-slate/50 shrink-0 tabular-nums">{docDate}</p>
                  </div>
                )}
                {output && docDate && <div className="h-px bg-ink/[0.06]" />}
                <div className="px-4 py-4 flex-1">
                  <div className="prose-document rounded-xl border border-ink/[0.08] bg-white p-5 text-[0.875rem] leading-relaxed text-ink">
                    <AiMarkdown text={output} />
                    {busy && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-ink align-middle" />}
                  </div>
                </div>
                {output && !busy && (
                  <div className="border-t border-ink/[0.06] bg-[#fafaf9] px-4 py-3 flex flex-wrap items-center gap-2">
                    <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-3 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:border-ink/20 hover:bg-paper hover:text-ink">
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied!" : "Copy All"}
                    </button>
                    <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-3 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:border-ink/20 hover:bg-paper hover:text-ink">
                      <Printer className="h-3.5 w-3.5" /> Print
                    </button>
                    <button onClick={clear} className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-3 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:border-red-100 hover:border-red-200 hover:text-red-600">
                      <X className="h-3.5 w-3.5" /> Clear
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function EmptyState({
  outputTitle,
  minHeight,
}: {
  outputTitle: string;
  minHeight?: number;
}) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-3 px-8 py-12"
      style={{ minHeight: minHeight ? `${Math.round(minHeight * 0.6)}px` : "400px" }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paper ring-1 ring-inset ring-ink/[0.06]">
        <Wand2 className="h-6 w-6 text-ink/30" />
      </div>
      <p className="text-center text-[0.82rem] text-slate/45 max-w-[18rem]">
        Fill in the details above and generate your{" "}
        <span className="font-medium text-slate/60">{outputTitle.toLowerCase()}</span>
      </p>
    </div>
  );
}
