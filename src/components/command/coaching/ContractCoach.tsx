"use client";

import { useState } from "react";
import {
  PenTool,
  Wand2,
  ShieldCheck,
  Copy,
  Check,
  FileText,
  Eraser,
} from "lucide-react";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { LiveDot, Pill } from "@/components/command/ui";

type Sample = { label: string; text: string };

/** Realistic Oregon-flavored sample clauses to drop into the editor. */
const SAMPLES: Sample[] = [
  {
    label: "Inspection contingency",
    text: "Buyer shall have 10 days to inspect the property. If buyer is not happy with the inspection, buyer can cancel and get the earnest money back. Seller will fix anything that is found to be broken before closing.",
  },
  {
    label: "Financing contingency",
    text: "This offer is contingent on buyer getting a loan. Buyer will try to get financing within a reasonable time. If the loan does not go through, the deal is off and everyone walks away.",
  },
  {
    label: "Counter-offer paragraph",
    text: "Seller counters at $635,000. Seller will not pay closing costs. Buyer needs to remove the inspection contingency. Please respond soon as we have other interest. All other terms stay the same as the original offer.",
  },
];

export function ContractCoach() {
  const [draft, setDraft] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function coach() {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    setOutput("");
    setCopied(false);
    const content =
      "You are a contract-writing coach for Oregon real estate. Review and coach this contract clause, " +
      "then suggest stronger language. Review the clause for clarity, completeness, and risk, then provide " +
      "in markdown: (1) a `## Quick assessment` with a one-line read and a risk level, " +
      "(2) `### Specific fixes` as a short list of concrete gaps to close, and " +
      "(3) `### Stronger rewrite` with a tightened, professional version of the clause. " +
      "Be practical and specific to Oregon practice.\n\nCLAUSE:\n" +
      text;
    try {
      await streamAi({ tool: "coach", messages: [{ role: "user", content }] }, (_chunk, full) => {
        setOutput(full);
      });
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <div className="rounded-2xl border border-ink/[0.08] bg-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-ink/[0.08] px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/[0.06]">
            <PenTool className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-sans text-[0.95rem] font-semibold tracking-tight text-ink">
              Contract Coach
            </h3>
            <p className="mt-0.5 text-[0.78rem] text-slate">
              Paste a clause or agreement section — get a risk read, specific fixes, and a stronger
              rewrite.
            </p>
          </div>
        </div>
        <Pill tone="azure">
          <ShieldCheck className="h-3 w-3" /> Oregon
        </Pill>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
        {/* Editor side */}
        <div className="flex min-w-0 flex-col">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate/80">
              Your draft
            </p>
            {draft && (
              <button
                onClick={() => { setDraft(""); setOutput(""); setCopied(false); }}
                className="inline-flex items-center gap-1 text-[0.72rem] text-slate/70 transition-colors hover:text-ink"
              >
                <Eraser className="h-3 w-3" /> Clear
              </button>
            )}
          </div>

          {/* Sample loader chips */}
          <div className="mb-2.5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 text-[0.72rem] text-slate/60">
              <FileText className="h-3 w-3" /> Load a sample:
            </span>
            {SAMPLES.map((s) => (
              <button
                key={s.label}
                onClick={() => {
                  setDraft(s.text);
                  setOutput("");
                }}
                className="rounded-full border border-ink/10 bg-white px-3 py-1 text-[0.72rem] font-medium text-slate transition-colors hover:border-ink/20 hover:bg-paper hover:text-ink"
              >
                {s.label}
              </button>
            ))}
          </div>

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={12}
            placeholder="Write or paste a contingency clause, counter-offer paragraph, or any agreement language you want sharpened…"
            className="min-h-[16rem] flex-1 resize-y rounded-xl border border-ink/10 bg-white px-4 py-3 text-[0.86rem] leading-relaxed text-ink placeholder:text-slate/35 focus:border-ink/40 focus:outline-none"
          />

          <button
            onClick={coach}
            disabled={busy || !draft.trim()}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[0.85rem] font-semibold text-white transition-colors hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Wand2 className="h-4 w-4" />
            {busy ? "Coaching your draft…" : "Coach my draft"}
          </button>
        </div>

        {/* Critique side */}
        <div className="flex min-w-0 flex-col">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate/80">
              Coaching critique
            </p>
            {output && !busy && (
              <button
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1 text-[0.72rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-success" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            )}
          </div>

          <div
            className={cn(
              "min-h-[18rem] flex-1 overflow-y-auto rounded-xl border border-ink/[0.08] bg-white px-4 py-3.5",
              !output && "grid place-items-center",
            )}
          >
            {output ? (
              <AiMarkdown text={output} />
            ) : busy ? (
              <div className="flex items-center gap-2 text-[0.82rem] text-slate/70">
                <LiveDot tone="azure" /> Reading your clause…
              </div>
            ) : (
              <div className="px-4 text-center text-[0.82rem] leading-relaxed text-slate/55">
                <PenTool className="mx-auto mb-2 h-5 w-5 text-ink/60" />
                Your assessment, fixes, and a stronger rewrite will appear here.
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="border-t border-ink/[0.08] px-5 py-3 text-[0.68rem] text-slate/45">
        AI · AI-generated coaching for training only — not legal advice. Have counsel
        review any binding agreement.
      </p>
    </div>
  );
}
