import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MatinMark } from "@/components/brand/Logo";
import { AIActionCard, type AIAction } from "./AIActionCard";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — AiPanel   (ref §1.8)

   A REUSABLE docked DARK AI panel (ink-900) that PAGES place in their right
   column — distinct from the global shell `AISidecar` (which slides over the
   whole viewport). Same visual law: dark AI surface beside the light record,
   gold accent rail on the left edge signalling an AI affordance.

   Header: "Matin AI" (font-display, light) + a `Context: {context}` line
   (mono-ish, gold). Then free `children` and/or a chat area from `messages`
   (user bubble darker, ai bubble lighter on dark, optional citations), then a
   "Proposed actions" label mapping `actions` (AIAction[]) → AIActionCard.

   Server-safe — interaction handlers (onRun / onEdit / onReject) are passed by
   the page via the action callbacks below.
   ────────────────────────────────────────────────────────────────────────── */

export type AiMessage = {
  role: "user" | "ai";
  text: ReactNode;
  citations?: string[];
};

/** Live per-action state a page drives while streaming a Run result. Keyed by
 *  the action's `id` (falling back to its index, e.g. `"0"`). */
export type AiActionState = { running?: boolean; result?: ReactNode };

export function AiPanel({
  context,
  messages,
  actions,
  actionState,
  onRunAction,
  onEditAction,
  onRejectAction,
  children,
  className,
}: {
  context: string;
  messages?: AiMessage[];
  actions?: AIAction[];
  /** Map of action key → { running, result } so Run can stream into its card. */
  actionState?: Record<string, AiActionState>;
  onRunAction?: (action: AIAction) => void;
  onEditAction?: (action: AIAction) => void;
  onRejectAction?: (action: AIAction) => void;
  children?: ReactNode;
  className?: string;
}) {
  const hasMessages = Array.isArray(messages) && messages.length > 0;
  const hasActions = Array.isArray(actions) && actions.length > 0;

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 text-slate-300 shadow-soft",
        className,
      )}
    >
      {/* Gold accent rail on the left edge — marks an AI surface */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-gold" />

      {/* Header */}
      <div className="border-b border-ink-700 px-5 py-4 pl-6">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold/15 ring-1 ring-inset ring-gold/30">
            <MatinMark theme="white" className="h-3.5 w-3.5" />
          </span>
          <h2 className="font-display text-[1.05rem] font-normal leading-none text-cloud">
            Matin AI
          </h2>
        </div>
        <p className="mt-2 truncate font-mono text-[0.72rem] leading-none text-gold/90">
          Context: {context}
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 pl-6">
        {children}

        {/* Chat area */}
        {hasMessages ? (
          <div className="space-y-3">
            {messages!.map((m, i) =>
              m.role === "ai" ? (
                <div key={i} className="space-y-1.5">
                  <div className="rounded-xl rounded-tl-sm bg-ink-800 px-3.5 py-2.5 text-[0.82rem] leading-relaxed text-slate-300 ring-1 ring-inset ring-ink-700">
                    {m.text}
                  </div>
                  {m.citations && m.citations.length > 0 ? (
                    <p className="pl-1 text-[0.68rem] leading-snug text-slate-300/60">
                      <span className="font-medium text-slate-300/70">Cited: </span>
                      {m.citations.join(" · ")}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div
                  key={i}
                  className="ml-8 rounded-xl rounded-tr-sm bg-ink-700 px-3.5 py-2.5 text-[0.82rem] leading-relaxed text-cloud"
                >
                  {m.text}
                </div>
              ),
            )}
          </div>
        ) : null}

        {/* Proposed actions */}
        {hasActions ? (
          <div className="space-y-2.5">
            <p className="eyebrow text-slate-300/60">Proposed actions</p>
            <div className="space-y-2.5">
              {actions!.map((action, i) => {
                const key = action.id ?? String(i);
                const state = actionState?.[key];
                return (
                  <AIActionCard
                    key={key}
                    title={action.title}
                    riskTag={action.riskTag}
                    evidence={action.evidence}
                    confidence={action.confidence}
                    runLabel={
                      action.riskTag === "Approval required" ? "Approve" : "Run"
                    }
                    running={state?.running}
                    result={state?.result}
                    onRun={onRunAction ? () => onRunAction(action) : undefined}
                    onEdit={
                      onEditAction ? () => onEditAction(action) : undefined
                    }
                    onReject={
                      onRejectAction ? () => onRejectAction(action) : undefined
                    }
                  />
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
