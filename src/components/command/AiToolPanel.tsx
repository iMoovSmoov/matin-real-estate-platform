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
  const [docDate, setDocDate] = useState("");

  useEffect(() => {
    if (output && !docDate) {
      setDocDate(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
    }
  }, [output, docDate]);

  function set(name: string, v: string) {
    setValues((prev) => ({ ...prev, [name]: v }));
  }

  function applyPreset(p: Preset) {
    setValues({ ...blank, ...p.values });
    setOutput("");
    setDocDate("");
    setTouched(false);
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
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* ── Input column ── */}
      <div className="rounded-2xl border border-ink/[0.08] bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/[0.06]">
            <Wand2 className="h-5 w-5" />
          </span>
          <div>
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
            <div key={f.name} className={cn("flex flex-col gap-1.5", (f.full || f.type === "textarea") && "sm:col-span-2")}>
              <label htmlFor={`f-${f.name}`} className="text-[0.72rem] font-semibold text-slate">
                {f.label}
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
                    Select…
                  </option>
                  {f.options?.map((o) => (
                    <option key={o} value={o} className="bg-white">
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
                  className="rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.85rem] text-ink placeholder:text-slate/40 transition-colors focus:border-ink/40 focus:bg-white focus:outline-none"
                />
              )}
            </div>
          ))}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[0.88rem] font-semibold text-white transition-colors hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> AI is writing…
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
      <div className="flex flex-col rounded-2xl border border-ink/[0.08] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-ink/[0.08] px-5 py-3.5">
          <div className="flex items-center gap-2">
            {busy ? <LiveDot tone="azure" /> : <FileText className="h-4 w-4 text-ink" />}
            <span className="text-[0.84rem] font-semibold text-ink">{outputTitle}</span>
            {busy && <span className="text-[0.72rem] text-slate/70">streaming live</span>}
          </div>
          {output && !busy && (
            <div className="flex items-center gap-1.5">
              {printable && (
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1.5 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
                >
                  <Printer className="h-3.5 w-3.5" /> Print
                </button>
              )}
              <button
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1.5 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
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

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!touched && !output ? (
            <EmptyState outputTitle={outputTitle} />
          ) : (
            <div>
              {output && !busy && docDate && (
                <div className="mb-4 flex items-center justify-between border-b border-ink/[0.08] pb-3">
                  <div>
                    <p className="text-[0.78rem] font-semibold uppercase tracking-widest text-ink/40">Matin Real Estate</p>
                    <p className="mt-0.5 font-display text-[1rem] text-ink">{outputTitle}</p>
                  </div>
                  <p className="text-[0.72rem] text-slate/50">{docDate}</p>
                </div>
              )}
              <div className="prose-document text-[0.875rem] leading-relaxed text-ink">
                <AiMarkdown text={output} />
                {busy && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-ink align-middle" />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ outputTitle }: { outputTitle: string }) {
  return (
    <div className="flex h-full min-h-[20rem] flex-col items-center justify-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paper ring-1 ring-inset ring-ink/[0.06]">
        <Wand2 className="h-6 w-6 text-ink/30" />
      </div>
      <p className="text-center text-[0.82rem] text-slate/45">Fill in the details and generate your {outputTitle.toLowerCase()}</p>
    </div>
  );
}
