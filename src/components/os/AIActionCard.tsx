import type { ReactNode } from "react";
import { Pencil, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — AIActionCard   (ref §1.8)

   The must-build AI unit. A DARK card (ink-800 / ink-700 border) docked beside
   a LIGHT workspace record. Anatomy:
     [bold action title]                       [risk tag, muted]
     Evidence: short plain-English why + cited fields/events
     Confidence/quality signal (●●●○ or "High")
     [✎ Edit]  [✕ Reject]               [ ◆ Run / Approve ]gold

   Gold `Run`/`Approve` is the ONLY saturated element — it signals
   "AI-executable". Edit / Reject are light ghost affordances. Approval-gated:
   AI drafts → human approves; nothing runs silently. Server-safe (no hooks);
   handlers are passed in by the page.
   ────────────────────────────────────────────────────────────────────────── */

export type RiskTag = "Approval required" | "Ready" | "Auto-safe";
export type Confidence = "High" | "Medium" | "Low";

/** Shape a sidecar / panel maps over to render proposed actions. */
export type AIAction = {
  id?: string;
  title: string;
  riskTag: RiskTag;
  evidence: string;
  confidence?: Confidence;
};

const RISK_TONE: Record<RiskTag, string> = {
  "Approval required": "text-warn",
  Ready: "text-success",
  "Auto-safe": "text-slate-300",
};

const CONFIDENCE_DOTS: Record<Confidence, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

function ConfidenceSignal({ level }: { level: Confidence }) {
  const filled = CONFIDENCE_DOTS[level];
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.7rem] leading-none text-slate-300">
      <span aria-hidden className="inline-flex items-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              i < filled ? "bg-gold" : "bg-ink-700",
            )}
          />
        ))}
      </span>
      <span className="font-medium">{level} confidence</span>
    </span>
  );
}

export function AIActionCard({
  title,
  riskTag,
  evidence,
  confidence,
  onRun,
  onEdit,
  onReject,
  runLabel = "Run",
  className,
}: {
  title: string;
  riskTag: RiskTag;
  evidence: string;
  confidence?: Confidence;
  onRun?: () => void;
  onEdit?: () => void;
  onReject?: () => void;
  runLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-ink-700 bg-ink-800 p-3.5 text-slate-300",
        className,
      )}
    >
      {/* Title + risk tag */}
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-sans text-[0.86rem] font-semibold leading-snug text-cloud">
          {title}
        </h4>
        <span
          className={cn(
            "shrink-0 whitespace-nowrap text-[0.68rem] font-medium uppercase tracking-[0.12em]",
            RISK_TONE[riskTag],
          )}
        >
          {riskTag}
        </span>
      </div>

      {/* Evidence line */}
      <p className="mt-2 text-[0.8rem] leading-relaxed text-slate-300">
        <span className="font-semibold text-slate-300/80">Evidence: </span>
        {evidence}
      </p>

      {/* Confidence signal */}
      {confidence ? (
        <div className="mt-2.5">
          <ConfidenceSignal level={confidence} />
        </div>
      ) : null}

      {/* Action row */}
      <div className="mt-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.78rem] font-medium text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit
          </button>
          <button
            type="button"
            onClick={onReject}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.78rem] font-medium text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Reject
          </button>
        </div>
        <button
          type="button"
          onClick={onRun}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-1.5 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {runLabel}
        </button>
      </div>
    </div>
  );
}
