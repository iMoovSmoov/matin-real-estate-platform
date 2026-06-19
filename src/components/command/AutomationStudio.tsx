"use client";

import { useState } from "react";
import { Zap, Workflow, Activity, CircleDot, ArrowRight, Clock } from "lucide-react";
import type { Automation } from "@/lib/types";
import { cn, num, timeAgo } from "@/lib/utils";

const CATEGORY_TONE: Record<string, string> = {
  "Lead Gen": "bg-azure/12 text-azure-bright ring-azure/25",
  Listings: "bg-info/12 text-info ring-info/25",
  Seller: "bg-success/12 text-success ring-success/25",
  Transactions: "bg-warn/15 text-warn ring-warn/25",
  Marketing: "bg-azure/12 text-azure-300 ring-azure/25",
  Reputation: "bg-success/12 text-success ring-success/25",
  Operations: "bg-white/[0.06] text-slate-300 ring-white/12",
};

function catTone(c: string) {
  return CATEGORY_TONE[c] ?? "bg-white/[0.06] text-slate-300 ring-white/12";
}

/** Plain-English outcome for each automation — what it does for the business
 *  (not the underlying steps). */
const OUTCOME: Record<string, string> = {
  au1: "Every new lead gets a personal reply in under 60 seconds, then routes to the right agent.",
  au2: "New listings go live with polished copy, marketing, and matched-buyer alerts — hands-off.",
  au3: "Quiet seller leads receive a branded market analysis until they book an appointment.",
  au4: "Every pending deal gets its checklist, deadlines tracked, and a daily risk check.",
  au5: "Past clients get a timely home-value touch that reopens conversations.",
  au6: "Closed clients are asked for a review and a referral at exactly the right moment.",
  au7: "Each agent gets a personalized Monday coaching note built from their numbers.",
  au8: "Showing feedback is collected and summarized into a clean seller report.",
};

export function AutomationStudio({ automations }: { automations: Automation[] }) {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(automations.map((a) => [a.id, a.status === "active"])),
  );

  const activeCount = Object.values(state).filter(Boolean).length;
  const totalRuns = automations.reduce((s, a) => s + a.runsThisMonth, 0);

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Mini icon={<Workflow className="h-4 w-4" />} label="Active workflows" value={`${activeCount}/${automations.length}`} accent />
        <Mini icon={<Activity className="h-4 w-4" />} label="Runs this month" value={num(totalRuns)} />
        <Mini icon={<Zap className="h-4 w-4" />} label="Tasks automated" value="~3,100" />
        <Mini icon={<Clock className="h-4 w-4" />} label="Avg time saved" value="11 hrs/wk" />
      </div>

      {/* Workflows */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {automations.map((a) => {
          const on = state[a.id];
          return (
            <div
              key={a.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-ink-900/70 p-5 transition-colors",
                on ? "border-white/10" : "border-white/[0.06] opacity-70",
              )}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset",
                      on ? "bg-azure/12 text-azure-bright ring-azure/20" : "bg-white/[0.05] text-slate-300/60 ring-white/10",
                    )}
                  >
                    <Zap className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-[0.95rem] font-semibold text-white">{a.name}</h3>
                    <span className={cn("mt-1 inline-block rounded-md px-2 py-0.5 text-[0.64rem] font-semibold ring-1 ring-inset", catTone(a.category))}>
                      {a.category}
                    </span>
                  </div>
                </div>

                {/* Toggle */}
                <div className="flex items-center gap-2.5">
                  <span className={cn("text-[0.72rem] font-semibold", on ? "text-success" : "text-slate-300/55")}>
                    {on ? "On" : "Off"}
                  </span>
                  <button
                    role="switch"
                    aria-checked={on}
                    aria-label={`Toggle ${a.name}`}
                    onClick={() => setState((s) => ({ ...s, [a.id]: !s[a.id] }))}
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                      on ? "bg-success" : "bg-white/12",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                        on ? "translate-x-[1.4rem]" : "translate-x-0.5",
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Outcome */}
              <p className="mt-4 text-[0.86rem] leading-relaxed text-slate-300/90">
                {OUTCOME[a.id] ?? a.trigger}
              </p>

              {/* When → result */}
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.07] bg-ink-800/40 px-3 py-2.5">
                <span className="text-[0.66rem] font-semibold uppercase tracking-wider text-slate-300/55">When</span>
                <span className="min-w-0 flex-1 truncate text-[0.78rem] text-white">{a.trigger}</span>
                <ArrowRight className={cn("h-3.5 w-3.5 shrink-0", on ? "text-azure-bright" : "text-slate-300/30")} />
                <span className="shrink-0 text-[0.72rem] font-semibold text-azure-bright">Runs automatically</span>
              </div>

              {/* Stats */}
              <div className="mt-3 flex items-center gap-4 text-[0.74rem] text-slate-300/65">
                <span className="flex items-center gap-1.5">
                  <CircleDot className="h-3.5 w-3.5 text-azure/70" /> {num(a.runsThisMonth)} runs this month
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-azure/70" /> last ran {timeAgo(a.lastRunMins)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Mini({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl border border-white/10 p-4", accent ? "bg-azure/[0.07]" : "bg-ink-900/70")}>
      <div className="flex items-center gap-2 text-slate-300/70">
        <span className="text-azure-bright">{icon}</span>
        <span className="text-[0.72rem] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1.5 font-display text-2xl text-white tabular-nums">{value}</p>
    </div>
  );
}
