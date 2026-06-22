"use client";

import { useCallback, useRef } from "react";
import {
  Workflow,
  Play,
  Pause,
  CircleCheck,
  ArrowRight,
  Database,
} from "lucide-react";
import {
  StatusChip,
  Dot,
  Avatar,
  AIActionCard,
} from "@/components/os";
import type { Automation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AUTOMATION_OWNER } from "./systemsModel";
import { scrollElementIntoView } from "./useScrollIntoView";
import { AiDraftResult } from "./AiDraftResult";

/* ──────────────────────────────────────────────────────────────────────────
   Systems Health — AutomationBreakdown (ref §2.11 + §1.6 backend-logic)

   A two-pane, master–detail block. LEFT: a selectable list of every automation
   (click → selects it). RIGHT: the selected automation's steps, owner (real
   Avatar), run cadence, and — for a paused automation — an AI "Diagnose & draft
   a restart plan" that streams INLINE. The selection, paused→active toggle, and
   AI stream are all parent state; nothing opens the global sidecar.
   ────────────────────────────────────────────────────────────────────────── */

export function AutomationBreakdown({
  automations,
  selectedId,
  onSelect,
  onToggle,
  diagnosing,
  diagnosis,
  onDiagnose,
}: {
  automations: Automation[];
  selectedId: string;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  diagnosing: boolean;
  diagnosis: string;
  onDiagnose: () => void;
}) {
  const selected =
    automations.find((a) => a.id === selectedId) ?? automations[0] ?? null;
  const owner = selected ? AUTOMATION_OWNER[selected.id] : null;
  const isPaused = selected?.status === "paused";

  // On a stacked (sub-lg) layout the detail pane renders below the list, so a
  // selection updates content off-screen. Scroll the detail into view so the
  // tap produces an immediate visible result (mandate: "selection updates the
  // right panel" + visible feedback). At lg+ it's already beside the list, so
  // block:"nearest" is a no-op when it's on-screen.
  const detailRef = useRef<HTMLDivElement | null>(null);
  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() =>
          scrollElementIntoView(detailRef.current, "nearest"),
        );
      }
    },
    [onSelect],
  );

  return (
    <section className="space-y-3">
      <header>
        <h2 className="font-display text-[1.12rem] font-normal leading-tight text-ink">
          Automation breakdown
        </h2>
        <p className="mt-0.5 text-[0.78rem] text-slate">
          Select an automation to inspect its exact step chain, owner, and run
          cadence — the plumbing behind every workflow run.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* LEFT — selectable list */}
        <ul className="min-w-0 overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
          {automations.map((a, i) => {
            const active = a.id === selected?.id;
            const paused = a.status === "paused";
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(a.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                    i !== automations.length - 1 && "border-b border-mist/70",
                    active ? "bg-paper" : "hover:bg-paper/60",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                      active
                        ? "bg-ink text-cloud ring-ink"
                        : "bg-paper-200 text-slate ring-mist",
                    )}
                  >
                    <Workflow className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[0.84rem] font-semibold text-ink">
                        {a.name}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[0.72rem] text-slate">
                      <span>{a.category}</span>
                      <span className="text-mist">·</span>
                      <span className="tabular-nums">
                        {a.runsThisMonth.toLocaleString("en-US")} runs/mo
                      </span>
                    </div>
                  </div>
                  <StatusChip tone={paused ? "info" : "success"}>
                    <Dot tone={paused ? "info" : "success"} />
                    {paused ? "Paused" : "Active"}
                  </StatusChip>
                </button>
              </li>
            );
          })}
        </ul>

        {/* RIGHT — detail of the selected automation. scroll-mt clears the
            sticky command bar; keying on the id replays a motion-safe fade so
            the selection swap is visibly felt. */}
        {selected ? (
          <div
            ref={detailRef}
            key={selected.id}
            className="min-w-0 scroll-mt-24 space-y-4 rounded-2xl border border-mist bg-cloud p-5 shadow-soft motion-safe:animate-fade"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow text-[0.64rem] text-slate">
                  {selected.category}
                </p>
                <h3 className="mt-1 font-display text-[1.08rem] font-normal leading-tight text-ink">
                  {selected.name}
                </h3>
                <p className="mt-1 text-[0.78rem] text-slate">
                  Trigger:{" "}
                  <span className="font-medium text-ink">{selected.trigger}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => onToggle(selected.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.76rem] font-semibold transition-colors",
                  isPaused
                    ? "bg-ink text-cloud hover:bg-ink-800"
                    : "border border-mist bg-cloud text-ink hover:bg-paper",
                )}
              >
                {isPaused ? (
                  <Play className="h-3.5 w-3.5" />
                ) : (
                  <Pause className="h-3.5 w-3.5" />
                )}
                {isPaused ? "Resume" : "Pause"}
              </button>
            </div>

            {/* Owner + cadence */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-mist bg-paper px-3.5 py-2.5">
              {owner ? (
                <div className="flex items-center gap-2.5">
                  <Avatar name={owner.name} slug={owner.slug} size={30} ring />
                  <div className="leading-tight">
                    <p className="text-[0.8rem] font-semibold text-ink">
                      {owner.name}
                    </p>
                    <p className="text-[0.71rem] text-slate">Owner</p>
                  </div>
                </div>
              ) : (
                <span />
              )}
              <div className="text-right leading-tight">
                <p className="text-[0.8rem] font-semibold tabular-nums text-ink">
                  {selected.runsThisMonth.toLocaleString("en-US")}
                </p>
                <p className="text-[0.71rem] text-slate">runs this month</p>
              </div>
            </div>

            {/* Step chain */}
            <div>
              <p className="eyebrow mb-2 text-[0.64rem] text-slate">
                Step chain · {selected.steps.length} steps
              </p>
              <ol className="space-y-2">
                {selected.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper-200 text-[0.64rem] font-bold tabular-nums text-slate ring-1 ring-inset ring-mist">
                      {i + 1}
                    </span>
                    <span className="text-[0.82rem] leading-snug text-ink">
                      {step}
                    </span>
                    {!isPaused ? (
                      <CircleCheck className="ml-auto mt-px h-3.5 w-3.5 shrink-0 text-success" />
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>

            {/* Where each run is recorded */}
            <div className="flex items-start gap-2 rounded-xl border border-mist bg-paper px-3.5 py-2.5">
              <Database className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate" />
              <code className="break-words font-mono text-[0.72rem] leading-relaxed text-ink">
                Logged to Automation runs <ArrowRight className="inline h-3 w-3 text-slate" /> AI actions <ArrowRight className="inline h-3 w-3 text-slate" /> Activity log
              </code>
            </div>

            {/* Paused → AI diagnose + restart plan, streams inline */}
            {isPaused ? (
              <div>
                <p className="eyebrow mb-2 text-[0.64rem] text-slate">
                  Matin AI · why is this paused
                </p>
                <AIActionCard
                  title="Diagnose & draft a safe restart plan"
                  riskTag="Approval required"
                  evidence={`"${selected.name}" is paused${
                    selected.runsThisMonth === 0
                      ? " and has not run this month"
                      : ` after ${selected.runsThisMonth.toLocaleString("en-US")} runs this month`
                  }. Get the likely reason and a safe restart plan to approve.`}
                  confidence="Medium"
                  runLabel="Diagnose"
                  running={diagnosing}
                  result={
                    diagnosis ? (
                      <AiDraftResult
                        text={diagnosis}
                        running={diagnosing}
                        filename={`matin-restart-plan-${selected.id}.txt`}
                      />
                    ) : undefined
                  }
                  onRun={onDiagnose}
                />
              </div>
            ) : (
              <p className="text-[0.76rem] leading-relaxed text-slate">
                Running clean — last run {selected.lastRunMins < 60
                  ? `${selected.lastRunMins} min ago`
                  : `${Math.round(selected.lastRunMins / 60)} hr ago`}
                . Every run is inspectable in the workflow timeline.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
