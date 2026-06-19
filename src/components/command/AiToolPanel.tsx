"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Wand2,
  Printer,
  X,
} from "lucide-react";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { LiveDot } from "@/components/command/ui";

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
}) {
  const blank = Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? ""]));
  const [values, setValues] = useState<Record<string, string>>(blank);
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [touched, setTouched] = useState(false);
  const [docDate, setDocDate] = useState("");

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
  }, [output, docDate]);

  // Apply an externally-driven preset (e.g. from a "load from DB" selector on the host page)
  useEffect(() => {
    if (externalPreset) {
      setValues({ ...blank, ...externalPreset.values });
      setOutput("");
      setDocDate("");
      setTouched(false);
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
  }

  async function tryExampleAndRun() {
    if (!tryExample || busy) return;
    const filled = { ...blank, ...tryExample.values };
    setValues(filled);
    setOutput("");
    setDocDate("");
    setTouched(true);
    setBusy(true);
    try {
      await streamAi({ tool, input: filled }, (_chunk, full) => setOutput(full));
    } finally {
      setBusy(false);
    }
  }

  async function run() {
    if (busy) return;
    setBusy(true);
    setTouched(true);
    setOutput("");
    setDocDate("");
    try {
      await streamAi({ tool, input: values }, (_chunk, full) => setOutput(full));
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
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
      {/* ── Input column ── */}
      <div className="rounded-2xl border border-ink/[0.08] bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/[0.06]">
            <Wand2 className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl text-ink">{title}</h2>
              {pillar && (
                <span className="rounded bg-white px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-slate/70 ring-1 ring-inset ring-ink/[0.06]">
                  {pillar}
                </span>
              )}
            </div>
            <p className="mt-1 text-[0.86rem] leading-relaxed text-slate">{description}</p>
          </div>
        </div>

        {/* One-click "Try example" — fills all fields + auto-runs */}
        {tryExample && (
          <button
            type="button"
            onClick={tryExampleAndRun}
            disabled={busy}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-azure/30 bg-azure/[0.07] px-4 py-2.5 text-[0.84rem] font-semibold text-azure transition-colors hover:bg-azure/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
            ) : (
              <><Wand2 className="h-4 w-4" /> {tryExample.label ?? "Try with example data"}</>
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
                (f.full || f.type === "textarea") && "sm:col-span-2"
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
                  className="resize-y rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.85rem] text-ink placeholder:text-slate/40 transition-colors focus:border-ink/40 focus:bg-white focus:outline-none"
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
                  className="rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.85rem] text-ink placeholder:text-slate/40 transition-colors focus:border-ink/40 focus:bg-white focus:outline-none"
                />
              )}
            </div>
          ))}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[0.88rem] font-semibold text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> AI is writing...
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

      {/* ── Output column ── */}
      <div className="flex flex-col rounded-2xl border border-ink/[0.08] bg-white shadow-sm overflow-hidden">
        {/* Output column header bar */}
        <div className="flex items-center justify-between gap-3 border-b border-ink/[0.08] px-5 py-3.5">
          <div className="flex items-center gap-2">
            {busy ? <LiveDot tone="azure" /> : <FileText className="h-4 w-4 text-ink" />}
            <span className="text-[0.84rem] font-semibold text-ink">{outputTitle}</span>
            {busy && (
              <span className="text-[0.72rem] text-slate/70">streaming live</span>
            )}
          </div>
          {output && !busy && (
            <button
              onClick={run}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1.5 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </button>
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

              {/* Document header — shown once output + date are ready */}
              {output && docDate && (
                <div className="bg-[#f8f7f6] ring-1 ring-ink/[0.06] px-4 py-3 flex flex-wrap items-center justify-between gap-2 sm:px-8 sm:py-4 sm:flex-nowrap">
                  <p className="font-display text-[0.68rem] uppercase tracking-[0.18em] text-ink/40 shrink-0 sm:text-[0.72rem]">
                    Matin Real Estate
                  </p>
                  <p className="font-display text-[0.95rem] font-semibold text-ink text-center flex-1 truncate sm:text-[1.05rem]">
                    {outputTitle}
                  </p>
                  <p className="text-[0.72rem] text-slate/50 shrink-0 tabular-nums">{docDate}</p>
                </div>
              )}

              {/* Divider line below header */}
              {output && docDate && (
                <div className="h-px bg-ink/[0.06]" />
              )}

              {/* Main content */}
              <div className="px-4 py-4 flex-1 sm:px-8 sm:py-6">
                <div className="prose-document text-[0.875rem] leading-relaxed text-ink">
                  <AiMarkdown text={output} />
                  {busy && (
                    <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-ink align-middle" />
                  )}
                </div>
              </div>

              {/* Action buttons row — shown after output is complete */}
              {output && !busy && (
                <div className="border-t border-ink/[0.06] bg-[#fafaf9] px-4 py-3 flex flex-wrap items-center gap-2 sm:px-8 sm:py-3.5">
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
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
