"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Wand2,
  Printer,
  ArrowRight,
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
}) {
  const blank = Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? ""]));
  const [values, setValues] = useState<Record<string, string>>(blank);
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [touched, setTouched] = useState(false);

  function set(name: string, v: string) {
    setValues((prev) => ({ ...prev, [name]: v }));
  }

  function applyPreset(p: Preset) {
    setValues({ ...blank, ...p.values });
    setOutput("");
    setTouched(false);
  }

  async function run() {
    if (busy) return;
    setBusy(true);
    setTouched(true);
    setOutput("");
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
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* ── Input column ── */}
      <div className="rounded-2xl border border-white/10 bg-ink-900/70 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-azure/12 text-azure-bright ring-1 ring-inset ring-azure/20">
            <Wand2 className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl text-white">{title}</h2>
              {pillar && (
                <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-slate-300/70 ring-1 ring-inset ring-white/10">
                  {pillar}
                </span>
              )}
            </div>
            <p className="mt-1 text-[0.86rem] leading-relaxed text-slate-300">{description}</p>
          </div>
        </div>

        {presets && presets.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-slate-300/55">
              {presetLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="group inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[0.78rem] font-medium text-slate-300 transition-colors hover:border-azure/45 hover:bg-azure/10 hover:text-white"
                  title={p.hint}
                >
                  <Sparkles className="h-3.5 w-3.5 text-azure-bright" />
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
            <div key={f.name} className={cn("flex flex-col gap-1.5", (f.full || f.type === "textarea") && "sm:col-span-2")}>
              <label htmlFor={`f-${f.name}`} className="text-[0.72rem] font-semibold text-slate-300">
                {f.label}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  id={`f-${f.name}`}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                  placeholder={f.placeholder}
                  rows={3}
                  className="resize-y rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[0.85rem] text-white placeholder:text-slate-300/40 transition-colors focus:border-azure/50 focus:bg-white/[0.05] focus:outline-none"
                />
              ) : f.type === "select" ? (
                <select
                  id={`f-${f.name}`}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[0.85rem] text-white transition-colors focus:border-azure/50 focus:outline-none"
                >
                  <option value="" className="bg-ink-800">
                    Select…
                  </option>
                  {f.options?.map((o) => (
                    <option key={o} value={o} className="bg-ink-800">
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`f-${f.name}`}
                  type={f.type === "number" ? "number" : "text"}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                  placeholder={f.placeholder}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[0.85rem] text-white placeholder:text-slate-300/40 transition-colors focus:border-azure/50 focus:bg-white/[0.05] focus:outline-none"
                />
              )}
            </div>
          ))}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-azure px-4 py-2.5 text-[0.88rem] font-semibold text-white shadow-glow transition-colors hover:bg-azure-bright disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> AI is writing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> {submitLabel}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Output column ── */}
      <div className="flex flex-col rounded-2xl border border-white/10 bg-ink-900/70">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
          <div className="flex items-center gap-2">
            {busy ? <LiveDot tone="azure" /> : <Sparkles className="h-4 w-4 text-azure-bright" />}
            <span className="text-[0.84rem] font-semibold text-white">{outputTitle}</span>
            {busy && <span className="text-[0.72rem] text-slate-300/70">streaming live</span>}
          </div>
          {output && !busy && (
            <div className="flex items-center gap-1.5">
              {printable && (
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[0.74rem] font-medium text-slate-300 transition-colors hover:border-azure/40 hover:text-white"
                >
                  <Printer className="h-3.5 w-3.5" /> Print
                </button>
              )}
              <button
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[0.74rem] font-medium text-slate-300 transition-colors hover:border-azure/40 hover:text-white"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={run}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[0.74rem] font-medium text-slate-300 transition-colors hover:border-azure/40 hover:text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!touched && !output ? (
            <EmptyState submitLabel={submitLabel} />
          ) : (
            <div className="prose-none">
              <AiMarkdown text={output} />
              {busy && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-azure-bright align-middle" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ submitLabel }: { submitLabel: string }) {
  return (
    <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-azure/10 text-azure-bright ring-1 ring-inset ring-azure/20">
        <Sparkles className="h-6 w-6" />
      </span>
      <p className="mt-3 text-[0.9rem] font-semibold text-white">Powered by AI</p>
      <p className="mt-1 max-w-xs text-[0.8rem] leading-relaxed text-slate-300/70">
        Fill the form (or load a quick-fill example) and hit{" "}
        <span className="inline-flex items-center gap-1 font-semibold text-azure-bright">
          {submitLabel} <ArrowRight className="h-3 w-3" />
        </span>{" "}
        to stream a result live.
      </p>
    </div>
  );
}
