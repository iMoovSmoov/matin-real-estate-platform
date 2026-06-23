"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { MatinMark } from "@/components/brand/Logo";
import { useAiSidecar } from "@/components/os";
import { company, reportMetrics } from "@/lib/data";
import { compactUsd, num } from "@/lib/utils";
import { useCountUp } from "./useCountUp";
import { GoalPaceRadial } from "./TodayCharts";

/* ──────────────────────────────────────────────────────────────────────────
   Today Command Center — image-led briefing band (§2)

   A single full-bleed band seated above the KPI strip. Background = the REAL
   West Linn office interior (company.officeHero) under an obsidian→transparent
   left scrim, with a green left rail (the rationed Estate-Green accent). The
   left overlay carries the Matin mark, a time-aware Fraunces greeting, the date,
   and the single hero figure — open pipeline value + active-deal count summed
   from reportMetrics.pipeline. The right overlay carries the goal-pace radial
   (volume-to-goal, from companyScorecard.goalPacing) + an honest forecast chip.
   CTAs: green "Ask AI to prioritize my day" (AI) and ink "+ Add lead" (human).
   All numbers are real; only the reveal animates (count-up + a slow ≤1.04
   Ken-Burns), gated on prefers-reduced-motion.
   ────────────────────────────────────────────────────────────────────────── */

function greetWord(d: Date): string {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export function BriefingBand() {
  const { openAi } = useAiSidecar();

  // Time-aware greeting/date — seeded once (lazy) so it's stable across the
  // render. The displayed spans carry suppressHydrationWarning so a rare
  // server/client hour-boundary difference never logs a hydration warning.
  const [now] = useState(() => new Date());

  const pipelineTotal = reportMetrics.pipeline.reduce((s, p) => s + p.value, 0); // 57.3M
  const pipelineDeals = reportMetrics.pipeline.reduce((s, p) => s + p.deals, 0); // 67
  const pace = reportMetrics.companyScorecard.goalPacing;
  const forecastPct = Math.round((pace.forecastVolume / pace.volumeGoal) * 100);

  const totalShown = useCountUp(pipelineTotal, 1000);
  const dealsShown = useCountUp(pipelineDeals, 1000);

  return (
    <section className="relative isolate overflow-hidden rounded-2xl shadow-soft">
      {/* Local, reduced-motion-gated Ken-Burns (≤1.04 scale, slow, no pulsing). */}
      <style>{`
        @keyframes today-kenburns { from { transform: scale(1); } to { transform: scale(1.04); } }
        @media (prefers-reduced-motion: no-preference) {
          .today-kenburns { animation: today-kenburns 30s ease-out both alternate infinite; }
        }
      `}</style>

      {/* Real office photography — brand context (BUILD_REFERENCE Part 3). */}
      <Image
        src={company.officeHero}
        alt="Matin Real Estate — West Linn office interior"
        fill
        priority
        sizes="100vw"
        className="today-kenburns -z-10 object-cover object-center"
      />

      {/* Obsidian → transparent left scrim for legibility (ink-900 .86 → 0). */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-900/[0.88] via-ink-900/60 to-ink-900/20 lg:to-transparent"
      />
      {/* Bottom lift so the stacked mobile figure stays legible over the photo. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-900/70 via-transparent to-transparent lg:hidden"
      />
      {/* Estate-green left rail — the rationed accent. */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-gold-bright via-gold to-transparent"
      />

      <div className="relative flex min-h-[360px] flex-col items-start justify-between gap-6 p-6 sm:p-8 lg:min-h-[280px] lg:flex-row lg:items-center lg:gap-8">
        {/* Left overlay — identity + greeting + the single hero figure */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MatinMark theme="white" className="h-5 w-auto" />
            <span className="eyebrow eyebrow-light">Command Center</span>
          </div>

          <h2
            suppressHydrationWarning
            className="mt-3 font-display text-[1.9rem] font-normal leading-[1.05] text-cloud hero-text-shadow sm:text-[2.4rem]"
          >
            {greetWord(now)}, Talon
          </h2>
          <span aria-hidden className="mt-2.5 block h-px w-14 bg-gradient-to-r from-gold-bright to-transparent" />
          <p suppressHydrationWarning className="mt-2 text-[0.85rem] text-slate-300">
            {formatDate(now)} · here is your brokerage at a glance
          </p>

          {/* The hero figure — open pipeline value + active deals (real, summed) */}
          <div className="mt-6">
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-sans text-[2.6rem] font-bold leading-none text-cloud tabular-nums hero-text-shadow sm:text-[3.2rem]">
                {compactUsd(totalShown)}
              </span>
              <span className="text-[0.95rem] font-medium text-slate-300 tabular-nums">
                open pipeline · {num(Math.round(dealsShown))} active deals
              </span>
            </p>
          </div>

          {/* CTAs — green = AI affordance, ink = primary human action */}
          <div className="mt-6 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => openAi("Prioritize my day")}
              className="btn-accent inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[0.85rem] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            >
              <MatinMark theme="white" className="h-4 w-4" />
              <span>Ask AI to prioritize my day</span>
            </button>
            <Link
              href="/hub/crm?create=lead"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-[0.85rem] font-semibold text-cloud ring-1 ring-inset ring-white/15 transition-colors hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <Plus className="h-4 w-4" aria-hidden />
              <span>Add lead</span>
            </Link>
          </div>
        </div>

        {/* Right overlay — goal-pace radial + honest forecast chip */}
        <div className="flex shrink-0 flex-col items-start gap-3 lg:items-center">
          <div className="lg:hidden">
            <GoalPaceRadial size={104} />
          </div>
          <div className="hidden lg:block">
            <GoalPaceRadial size={150} />
          </div>
          <div className="flex flex-col items-start gap-1 lg:items-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[0.72rem] font-semibold text-slate-300 ring-1 ring-inset ring-white/15 tabular-nums">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
              Forecast <span className="text-cloud">{forecastPct}%</span> of goal
            </span>
            <span className="text-[0.72rem] text-slate-300/80 tabular-nums">
              {compactUsd(pace.volumeActual)} of {compactUsd(pace.volumeGoal)} volume
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
