"use client";

import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { CalloutCard } from "@/components/os";
import { workQueue, todayKpis } from "@/lib/data";

/* ──────────────────────────────────────────────────────────────────────────
   Today — AI overnight summary (§4 · §5)

   The dark .surface-ai callout that opens the right rail (and floats above the
   queue on mobile). Every count is DERIVED — total priorities reconcile to the
   work-queue length, drafts/at-risk/errors to the todayKpis bundle — so the
   prose can never drift from the tables it summarizes. The Matin wordmark marks
   it as an AI surface; the action reviews the AI Drafts queue view.
   ────────────────────────────────────────────────────────────────────────── */

export function AiOvernightSummary({ onReviewDrafts }: { onReviewDrafts: () => void }) {
  const K = todayKpis;
  const queueTotal = workQueue.length;

  return (
    <CalloutCard
      tone="ai"
      title={
        <span className="flex items-center gap-2">
          <Logo variant="full" theme="white" className="h-4" />
          <span>AI overnight summary</span>
        </span>
      }
      action={
        <button
          type="button"
          onClick={onReviewDrafts}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.78rem] font-semibold text-gold transition-colors hover:bg-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
        >
          Review drafts
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      }
    >
      <p>
        Triaged your <span className="font-semibold text-cloud">overnight lead activity</span> into{" "}
        <span className="font-semibold text-cloud">{queueTotal} priorities</span>, drafted{" "}
        <span className="font-semibold text-cloud">{K.aiDraftsWaiting} replies</span>, and flagged{" "}
        <span className="font-semibold text-danger">{K.txAtRisk} deals at risk</span> plus{" "}
        <span className="font-semibold text-danger">{K.workflowErrors} failed automations</span>.
        Nothing went out to clients — everything is waiting for your approval.
      </p>
      <p className="mt-2 text-slate-300/80">
        Top of the list: call Daniel Cho before his speed-to-lead window closes, and resolve the
        8912 SE Hawthorne inspection deadline due tomorrow.
      </p>
    </CalloutCard>
  );
}
