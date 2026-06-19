"use client";

import { useState } from "react";
import {
  Zap,
  ArrowRight,
  Play,
  CircleDot,
  Workflow,
  Activity,
} from "lucide-react";
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
        <Mini icon={<Workflow className="h-4 w-4" />} label="Active flows" value={`${activeCount}/${automations.length}`} accent />
        <Mini icon={<Activity className="h-4 w-4" />} label="Runs this month" value={num(totalRuns)} />
        <Mini icon={<Zap className="h-4 w-4" />} label="Tasks automated" value="~3,100" />
        <Mini icon={<CircleDot className="h-4 w-4" />} label="Avg time saved" value="11 hrs/wk" />
      </div>

      {/* Flows */}
      <div className="space-y-3">
        {automations.map((a) => {
          const on = state[a.id];
          return (
            <div
              key={a.id}
              className={cn(
                "rounded-2xl border bg-ink-900/70 p-4 transition-colors md:p-5",
                on ? "border-white/10" : "border-white/[0.06] opacity-70",
              )}
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-3">
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
                    <div className="flex items-center gap-2">
                      <h3 className="text-[0.95rem] font-semibold text-white">{a.name}</h3>
                      <span className={cn("rounded-md px-2 py-0.5 text-[0.64rem] font-semibold ring-1 ring-inset", catTone(a.category))}>
                        {a.category}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[0.76rem] text-slate-300/65">
                      {num(a.runsThisMonth)} runs this month · last ran {timeAgo(a.lastRunMins)}
                    </p>
                  </div>
                </div>

                {/* Toggle */}
                <div className="flex items-center gap-2.5">
                  <span className={cn("text-[0.72rem] font-semibold", on ? "text-success" : "text-slate-300/55")}>
                    {on ? "Active" : "Paused"}
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

              {/* Flow nodes */}
              <div className="mt-4 overflow-x-auto">
                <div className="flex min-w-max items-stretch gap-1.5">
                  {/* Trigger node */}
                  <Node label="Trigger" text={a.trigger} kind="trigger" on={on} />
                  {a.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <ArrowRight className={cn("h-4 w-4 shrink-0", on ? "text-azure/60" : "text-slate-300/25")} />
                      <Node label={`Step ${i + 1}`} text={step} kind="step" on={on} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Node({
  label,
  text,
  kind,
  on,
}: {
  label: string;
  text: string;
  kind: "trigger" | "step";
  on: boolean;
}) {
  const trigger = kind === "trigger";
  return (
    <div
      className={cn(
        "flex w-[10.5rem] shrink-0 flex-col rounded-xl border px-3 py-2.5",
        trigger
          ? on
            ? "border-azure/35 bg-azure/[0.08]"
            : "border-white/10 bg-white/[0.03]"
          : on
            ? "border-white/12 bg-ink-800/70"
            : "border-white/[0.06] bg-ink-800/40",
      )}
    >
      <div className="mb-1 flex items-center gap-1.5">
        {trigger ? (
          <Play className={cn("h-3 w-3", on ? "text-azure-bright" : "text-slate-300/45")} />
        ) : (
          <CircleDot className={cn("h-3 w-3", on ? "text-azure-bright" : "text-slate-300/45")} />
        )}
        <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-slate-300/55">{label}</span>
      </div>
      <p className="text-[0.74rem] leading-snug text-white">{text}</p>
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
