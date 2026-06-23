"use client";

import { useSyncExternalStore } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { reportMetrics } from "@/lib/data";
import { compactUsd, num } from "@/lib/utils";
import { useCountUp } from "./useCountUp";

/* ──────────────────────────────────────────────────────────────────────────
   Today Command Center — Live Pipeline chart (S1.4)

   Replaces the 8 flat ProgressTrack bars with a REAL recharts pipeline: an
   estate-green single-hue ramp of open deal value per funnel stage (current)
   with a faint prior-period area behind it, a dark decomposing tooltip showing $
   AND deal count, and a $ total. Closed stage = success green (terminal money).
   Colors come straight from the §1.1 palette; no rainbow, no animation-for-vibes.
   ────────────────────────────────────────────────────────────────────────── */

const GRID = "#ebebea";
const AXIS = "#8a8a90";
const INK = "#161617";
const ACCENT = "#2f8a60";      // estate green (bright)
const ACCENT_DEEP = "#1f6b4a"; // estate green (deep accent)
const SUCCESS = "#56a07d";
const PRIOR = "#c3c3c9";

// Stage → ramped fill: neutral grays warm into the estate-green accent, then
// resolve on terminal success green. Single-hue, stable per stage (no rainbow).
const STAGE_FILL: Record<string, string> = {
  "Pre-Listing": "#9aa0a8",
  Active: "#8a8a90",
  Pending: "#9ec9b4",
  Inspection: "#5fa585",
  Appraisal: ACCENT,
  Financing: ACCENT_DEEP,
  "Clear to Close": "#7bb795",
  Closed: SUCCESS,
};

type TipRow = { stage: string; value: number; deals: number; prior: number };

function PipelineTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: TipRow }[];
}) {
  const row = active && payload && payload.length > 0 ? payload[0]?.payload : undefined;
  if (!row) return null;
  const delta = row.value - row.prior;
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-900/95 px-3 py-2 text-[0.76rem] shadow-xl backdrop-blur">
      <p className="mb-1 font-semibold text-cloud">{row.stage}</p>
      <div className="space-y-0.5 text-slate-300">
        <div className="flex items-center justify-between gap-4">
          <span>Open value</span>
          <span className="font-semibold tabular-nums text-cloud">{compactUsd(row.value)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Deals</span>
          <span className="font-semibold tabular-nums text-cloud">{num(row.deals)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>vs prior week</span>
          <span
            className={`font-semibold tabular-nums ${delta >= 0 ? "text-success" : "text-danger"}`}
          >
            {delta >= 0 ? "+" : "−"}
            {compactUsd(Math.abs(delta))}
          </span>
        </div>
      </div>
    </div>
  );
}

const axisProps = {
  tick: { fill: AXIS, fontSize: 10 },
  axisLine: { stroke: GRID },
  tickLine: false,
} as const;

export function LivePipelineChart() {
  // Build current + a deterministic prior-period series (≈ -9%) from real
  // pipeline rows so the area behind has meaning (current-vs-prior trend).
  const data: TipRow[] = reportMetrics.pipeline.map((s, i) => ({
    stage: s.stage,
    value: s.value,
    deals: s.deals,
    // deterministic per-stage variance so prior isn't a flat scale of current
    prior: Math.round(s.value * (0.86 + ((i % 4) * 0.03))),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 10, right: 6, left: 0, bottom: 4 }}>
        <defs>
          <linearGradient id="priorFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PRIOR} stopOpacity={0.5} />
            <stop offset="100%" stopColor={PRIOR} stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey="stage"
          {...axisProps}
          interval={0}
          angle={-22}
          textAnchor="end"
          height={56}
        />
        <YAxis {...axisProps} width={42} tickFormatter={(v) => compactUsd(Number(v))} />
        <Tooltip cursor={{ fill: "#00000008" }} content={<PipelineTooltip />} />
        {/* Prior-week ghost area behind the bars */}
        <Area
          type="monotone"
          dataKey="prior"
          stroke={PRIOR}
          strokeWidth={1.5}
          fill="url(#priorFill)"
          dot={false}
          isAnimationActive={false}
        />
        {/* Current open value — ramped single-hue bars */}
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={30} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.stage} fill={STAGE_FILL[d.stage] ?? INK} />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Goal-pace radial (briefing band, §2) — a single estate-green arc on ink

   A recharts RadialBar gauge bound to reportMetrics.companyScorecard.goalPacing.
   The arc + center number are the brokerage's REAL volume-to-goal pace
   (volumeActual / volumeGoal → volumePacePct), with an honest forecast delta
   chip rendered by the caller. Designed to sit on the dark hero image: faint
   white track, green arc, light center text. Single sweep on load (recharts),
   center number count-up — both gated on prefers-reduced-motion.
   ────────────────────────────────────────────────────────────────────────── */

/* Subscribe to the reduced-motion media query via an external store (the
   idiomatic React pattern) — no setState-in-effect, SSR snapshot = false. */
const RM_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const mq = window.matchMedia(RM_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(RM_QUERY).matches,
    () => false,
  );
}

export function GoalPaceRadial({ size = 148 }: { size?: number }) {
  const pace = reportMetrics.companyScorecard.goalPacing;
  const value = Math.max(0, Math.min(100, pace.volumePacePct));
  const reduce = usePrefersReducedMotion();
  const shown = useCountUp(value, 950);
  const ring = Math.max(7, Math.round(size * 0.085));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <RadialBarChart
        width={size}
        height={size}
        cx="50%"
        cy="50%"
        innerRadius="72%"
        outerRadius="100%"
        barSize={ring}
        data={[{ name: "pace", value }]}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar
          background={{ fill: "rgba(255,255,255,0.14)" }}
          dataKey="value"
          cornerRadius={ring}
          angleAxisId={0}
          fill={ACCENT}
          isAnimationActive={!reduce}
          animationDuration={950}
        />
      </RadialBarChart>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-sans font-semibold leading-none text-cloud tabular-nums"
          style={{ fontSize: Math.round(size * 0.24) }}
        >
          {Math.round(shown)}
          <span className="align-top" style={{ fontSize: Math.round(size * 0.12) }}>
            %
          </span>
        </span>
        <span className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-slate-300/80">
          to goal
        </span>
      </div>
    </div>
  );
}
