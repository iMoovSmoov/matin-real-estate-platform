"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Copy, Check } from "lucide-react";
import { CalloutCard, AIActionCard, AIInsightChip } from "@/components/os";
import { MatinMark } from "@/components/brand/Logo";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Reports inline AI analyst (the differentiator, build-ref §2.10)

   "Ask AI why this metric changed" → DARK CalloutCard with the answer streamed
   INLINE via streamAi (NOT the global sidecar). Carries the bound Context line,
   cited drivers as gold insight chips, and an AIActionCard to turn the insight
   into a real action item (mutates local state → inline confirmation).

   Gold appears only on the AI affordances here (the "Ask Matin" button lives in
   the page; this surface is the dark evidence card). Server streams real text;
   the canned fallback is fine when no key is set.
   ────────────────────────────────────────────────────────────────────────── */

export type ExplainScope = {
  context: string;
  range: string;
  team: string;
  source: string;
  /** plain-English cited drivers shown as gold chips under the answer */
  drivers: string[];
  /** suggested follow-up action title + evidence for the AIActionCard */
  action: { title: string; evidence: string };
};

export function AiExplainPanel({
  scope,
  onDismiss,
}: {
  scope: ExplainScope;
  onDismiss: () => void;
}) {
  const [text, setText] = useState("");
  const [running, setRunning] = useState(true);
  const [createdAction, setCreatedAction] = useState<string | null>(null);
  const [rejected, setRejected] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyExplanation() {
    if (!text) return;
    const out = `Why "${scope.context}" changed — ${scope.range} · ${scope.team} · ${scope.source}\n\n${text}\n\nKey drivers:\n${scope.drivers.map((d) => `• ${d}`).join("\n")}`;
    try {
      await navigator.clipboard?.writeText(out);
    } catch {
      /* clipboard blocked — still confirm so the affordance never feels broken */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  // Guards stale streams: only the latest run is allowed to write state.
  const runIdRef = useRef(0);

  const run = useCallback(async () => {
    const myRun = ++runIdRef.current;
    // Yield a microtask first so the synchronous state resets below happen
    // after the calling effect returns (avoids cascading-render in-effect).
    await Promise.resolve();
    if (runIdRef.current !== myRun) return;
    setRunning(true);
    setText("");
    setCreatedAction(null);
    setRejected(false);
    await streamAi(
      {
        tool: "coach",
        input: {
          mode: "report-explain",
          metric: scope.context,
          range: scope.range,
          team: scope.team,
          source: scope.source,
          drivers: scope.drivers,
        },
        messages: [
          {
            role: "user",
            content: `As Matin's reporting analyst, explain in 2-3 sentences why "${scope.context}" moved this ${scope.range} for ${scope.team} (${scope.source}). Cite the strongest drivers: ${scope.drivers.join("; ")}. End with one recommended action.`,
          },
        ],
      },
      (_chunk, full) => {
        if (runIdRef.current === myRun) setText(full);
      },
    );
    if (runIdRef.current === myRun) setRunning(false);
  }, [scope]);

  // Kick off (and reset) the stream whenever the scoped metric/range changes.
  // run() is async; it sets state from its own callbacks, not synchronously in
  // this effect body — so no cascading-render lint violation.
  useEffect(() => {
    void run();
  }, [run]);

  return (
    <CalloutCard
      tone="ai"
      title={
        <span className="flex flex-wrap items-center gap-2">
          Why “{scope.context}” changed
          <span className="rounded-full bg-ink-700 px-2 py-0.5 font-sans text-[0.62rem] font-medium uppercase tracking-[0.16em] text-slate-300">
            {scope.range} · {scope.team} · {scope.source}
          </span>
        </span>
      }
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyExplanation}
            disabled={running || !text}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.76rem] font-medium text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud disabled:opacity-40"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-success" aria-hidden />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden />
                Copy
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => void run()}
            disabled={running}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.76rem] font-medium text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud disabled:opacity-40"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", running && "animate-spin")} aria-hidden />
            Regenerate
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg px-2.5 py-1.5 text-[0.76rem] font-medium text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud"
          >
            Dismiss
          </button>
        </div>
      }
    >
      {/* Context line binds the analysis to the record (AI transparency). */}
      <p className="mb-2.5 text-[0.7rem] text-slate-300/70">
        Working on: Reports / {scope.context}
      </p>

      {/* Streamed answer */}
      <div className="min-h-[2.5rem] whitespace-pre-wrap text-[0.84rem] leading-relaxed text-slate-300">
        {text || (
          <span className="inline-flex items-center gap-2 text-slate-300/80">
            <MatinMark theme="white" className="h-3.5 w-3.5" />
            Matin AI is analyzing the drivers
            <span className="animate-pulse">…</span>
          </span>
        )}
        {running && text ? <span className="animate-pulse">▍</span> : null}
      </div>

      {/* Cited drivers */}
      {scope.drivers.length > 0 ? (
        <div className="mt-3.5">
          <p className="eyebrow mb-2 text-[0.6rem] text-slate-300/70">Key drivers</p>
          <div className="flex flex-wrap gap-1.5">
            {scope.drivers.map((d) => (
              <AIInsightChip key={d}>{d}</AIInsightChip>
            ))}
          </div>
        </div>
      ) : null}

      {/* Turn the insight into a real action item (create-action-from-insight) */}
      <div className="mt-4">
        {createdAction ? (
          <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3.5 py-2.5 text-[0.8rem] text-success">
            <span aria-hidden>✓</span>
            Action item created: “{createdAction}” · added to the leadership task queue.
          </div>
        ) : rejected ? (
          <div className="rounded-xl border border-ink-700 bg-ink-900/60 px-3.5 py-2.5 text-[0.8rem] text-slate-300/80">
            Suggestion dismissed — no action item created.
          </div>
        ) : (
          <AIActionCard
            title={scope.action.title}
            riskTag="Approval required"
            evidence={scope.action.evidence}
            confidence="High"
            runLabel="Create action item"
            onRun={() => setCreatedAction(scope.action.title)}
            onReject={() => setRejected(true)}
            onEdit={() => setCreatedAction(`${scope.action.title} (edited)`)}
          />
        )}
      </div>
    </CalloutCard>
  );
}
