"use client";

import { Gauge, Timer, TriangleAlert, FileClock } from "lucide-react";
import { ScoreRing } from "@/components/os";
import { reportMetrics, transactions, derived } from "@/lib/data";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Today — Brokerage Vital Score hero (S1.3)

   The signature premium win: the existing ScoreRing (never used on /hub) drives
   a COMPOSITE brokerage-health ring. Every input is DERIVED from the data layer
   (anti-slop §3.2) and the supporting sub-stats reconcile to it:
     • Speed-to-lead   — reportMetrics.automationImpact.speedToLeadMin vs a 5-min goal
     • Deals on-track  — share of open transactions WITHOUT a riskFlag
     • Drafts cleared  — share of AI drafts already actioned (lower waiting = healthier)
   These three sub-scores average into the headline 0–100 vital. Gold here is
   sanctioned (an AI score visualization). No animation, no glow.
   ────────────────────────────────────────────────────────────────────────── */

const SPEED_GOAL_MIN = 5;

function clampPct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function BrokerageVitalScore() {
  // 1) Speed-to-lead health: at/under the 5-min goal = 100, scaling down.
  const speedMin = reportMetrics.automationImpact.speedToLeadMin;
  const speedScore = clampPct((SPEED_GOAL_MIN / Math.max(speedMin, 0.5)) * 100);

  // 2) Deals on-track: open (non-closed) deals without a riskFlag.
  const open = transactions.filter((t) => t.stage !== "Closed");
  const atRisk = open.filter((t) => t.riskFlag != null).length;
  const onTrackScore = open.length
    ? clampPct(((open.length - atRisk) / open.length) * 100)
    : 100;

  // 3) Draft-clearing health: drafts approved vs (approved + still waiting).
  const approved = reportMetrics.automationImpact.aiDraftsApproved;
  const waiting = derived.aiDraftsWaiting;
  const draftScore = clampPct((approved / Math.max(approved + waiting, 1)) * 100);

  const vital = clampPct((speedScore + onTrackScore + draftScore) / 3);

  const band =
    vital >= 80
      ? { label: "Healthy", tone: "text-success" }
      : vital >= 60
        ? { label: "Watch", tone: "text-warn" }
        : { label: "Needs attention", tone: "text-danger" };

  const subs: {
    icon: typeof Timer;
    label: string;
    value: string;
    score: number;
    tone: "success" | "warn" | "danger";
  }[] = [
    {
      icon: Timer,
      label: "Speed-to-lead",
      value: `${speedMin} min`,
      score: speedScore,
      tone: speedScore >= 80 ? "success" : speedScore >= 60 ? "warn" : "danger",
    },
    {
      icon: TriangleAlert,
      label: "Deals on-track",
      value: `${open.length - atRisk}/${open.length}`,
      score: onTrackScore,
      tone: onTrackScore >= 80 ? "success" : onTrackScore >= 60 ? "warn" : "danger",
    },
    {
      icon: FileClock,
      label: "Drafts cleared",
      value: `${draftScore}%`,
      score: draftScore,
      tone: draftScore >= 80 ? "success" : draftScore >= 60 ? "warn" : "danger",
    },
  ];

  const TONE_BAR: Record<"success" | "warn" | "danger", string> = {
    success: "bg-success",
    warn: "bg-warn",
    danger: "bg-danger",
  };

  return (
    <section className="rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <Gauge className="h-4 w-4 text-gold" aria-hidden />
        <h3 className="font-display text-[1.05rem] font-normal leading-tight text-ink">
          Brokerage Vital Score
        </h3>
      </div>
      <p className="mt-0.5 text-[0.78rem] text-slate">
        Composite of speed-to-lead, deals on-track, and draft clearing
      </p>

      <div className="mt-4 flex items-center gap-5">
        <ScoreRing value={vital} size={92} />
        <div className="min-w-0 flex-1">
          <p className={cn("text-[0.82rem] font-semibold", band.tone)}>{band.label}</p>
          <ul className="mt-2 space-y-2.5">
            {subs.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.label} className="flex items-center gap-2.5">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-slate" aria-hidden />
                  <span className="w-24 shrink-0 truncate text-[0.74rem] text-slate">
                    {s.label}
                  </span>
                  <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-paper-200">
                    <span
                      className={cn("absolute inset-y-0 left-0 rounded-full", TONE_BAR[s.tone])}
                      style={{ width: `${s.score}%` }}
                    />
                  </span>
                  <span className="w-12 shrink-0 text-right text-[0.74rem] font-semibold tabular-nums text-ink">
                    {s.value}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
