"use client";

import { useId, useMemo, useState } from "react";
import { cn, compactUsd, num } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Reports charts (real SVG, no chart lib)

   Sierra report grammar: a primary time-series (current solid vs prior-period
   faint line, dark tooltip stating BOTH periods + BOTH values) and a
   pipeline-stage bar chart with a single-hue gold/amber ramp + named stages.
   Pure SVG so it stays crisp + themable via tokens; the only interactivity is
   hover-to-inspect a point (drives a local tooltip, not the AI panel).
   ────────────────────────────────────────────────────────────────────────── */

type SeriesPoint = { label: string; value: number };

/* ── shared geometry ─────────────────────────────────────────────────────── */
const W = 640;
const H = 200;
const PAD = { top: 16, right: 14, bottom: 26, left: 44 };
const plotW = W - PAD.left - PAD.right;
const plotH = H - PAD.top - PAD.bottom;

function xAt(i: number, n: number) {
  return n <= 1 ? PAD.left + plotW / 2 : PAD.left + (i / (n - 1)) * plotW;
}
function yAt(v: number, max: number) {
  return PAD.top + plotH - (max <= 0 ? 0 : (v / max) * plotH);
}
function linePath(pts: SeriesPoint[], max: number) {
  return pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i, pts.length).toFixed(1)},${yAt(p.value, max).toFixed(1)}`)
    .join(" ");
}
function areaPath(pts: SeriesPoint[], max: number) {
  const top = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i, pts.length).toFixed(1)},${yAt(p.value, max).toFixed(1)}`)
    .join(" ");
  const x0 = xAt(0, pts.length).toFixed(1);
  const x1 = xAt(pts.length - 1, pts.length).toFixed(1);
  const yb = (PAD.top + plotH).toFixed(1);
  return `${top} L${x1},${yb} L${x0},${yb} Z`;
}

/* ──────────────────────────────────────────────────────────────────────────
   TimeSeriesChart — current solid vs prior faint line, hover tooltip stating
   BOTH periods + BOTH values + the delta (Sierra dark-tooltip pattern).
   ────────────────────────────────────────────────────────────────────────── */
export function TimeSeriesChart({
  title,
  unit = "usd",
  current,
  prior,
  currentLabel = "This period",
  priorLabel = "Prior period",
}: {
  title: string;
  unit?: "usd" | "count";
  current: SeriesPoint[];
  prior: SeriesPoint[];
  currentLabel?: string;
  priorLabel?: string;
}) {
  const gid = useId();
  const [hover, setHover] = useState<number | null>(null);

  const fmt = unit === "usd" ? compactUsd : num;
  const max = useMemo(
    () => Math.max(1, ...current.map((p) => p.value), ...prior.map((p) => p.value)) * 1.12,
    [current, prior],
  );

  const totalCur = current.reduce((s, p) => s + p.value, 0);
  const totalPri = prior.reduce((s, p) => s + p.value, 0);
  const deltaPct = totalPri ? Math.round(((totalCur - totalPri) / totalPri) * 100) : 0;
  const up = totalCur >= totalPri;

  // 4 horizontal gridlines
  const grid = [0.25, 0.5, 0.75, 1].map((f) => PAD.top + plotH - f * plotH);

  const hoverX = hover != null ? xAt(hover, current.length) : 0;
  const tipLeftPct = (hoverX / W) * 100;

  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-[1.05rem] font-normal leading-none text-ink">
            {title}
          </h2>
          <p className="mt-1.5 text-[0.74rem] text-slate">
            {currentLabel} vs {priorLabel} · hover a point to compare
          </p>
        </div>
        <div className="flex items-center gap-3 text-[0.74rem]">
          <span className="inline-flex items-center gap-1.5 text-slate">
            <span className="h-0.5 w-4 rounded-full bg-ink" />
            {currentLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate">
            <span className="h-0.5 w-4 rounded-full bg-slate/40" />
            {priorLabel}
          </span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              up ? "text-success" : "text-danger",
            )}
          >
            {up ? "▲" : "▼"} {Math.abs(deltaPct)}%
          </span>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`${title}: ${currentLabel} ${fmt(totalCur)} vs ${priorLabel} ${fmt(totalPri)}`}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-ink)" stopOpacity="0.10" />
              <stop offset="100%" stopColor="var(--color-ink)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* gridlines + y labels */}
          {grid.map((gy, i) => (
            <g key={i}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={gy}
                y2={gy}
                stroke="var(--color-mist)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={gy + 3}
                textAnchor="end"
                className="fill-slate"
                style={{ fontSize: 9 }}
              >
                {fmt((max * (4 - i)) / 4 / 1.12)}
              </text>
            </g>
          ))}

          {/* prior faint line */}
          <path
            d={linePath(prior, max)}
            fill="none"
            stroke="var(--color-slate)"
            strokeOpacity={0.4}
            strokeWidth={1.75}
            strokeDasharray="4 3"
          />

          {/* current area + line */}
          <path d={areaPath(current, max)} fill={`url(#${gid}-fill)`} />
          <path
            d={linePath(current, max)}
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth={2.25}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* x labels */}
          {current.map((p, i) => (
            <text
              key={p.label}
              x={xAt(i, current.length)}
              y={H - 8}
              textAnchor="middle"
              className="fill-slate"
              style={{ fontSize: 9 }}
            >
              {p.label}
            </text>
          ))}

          {/* hover guide + dots + hit targets */}
          {hover != null ? (
            <line
              x1={hoverX}
              x2={hoverX}
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke="var(--color-ink)"
              strokeOpacity={0.25}
              strokeWidth={1}
            />
          ) : null}
          {hover != null ? (
            <>
              <circle cx={hoverX} cy={yAt(current[hover].value, max)} r={4} fill="var(--color-ink)" />
              <circle
                cx={hoverX}
                cy={yAt(prior[hover]?.value ?? 0, max)}
                r={3.5}
                fill="var(--color-cloud)"
                stroke="var(--color-slate)"
                strokeWidth={1.5}
              />
            </>
          ) : null}
          {current.map((_, i) => (
            <rect
              key={i}
              x={xAt(i, current.length) - plotW / current.length / 2}
              y={PAD.top}
              width={plotW / current.length}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>

        {/* dark tooltip — states BOTH periods + BOTH values */}
        {hover != null ? (
          <div
            className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-[0.72rem] shadow-lift"
            style={{ left: `${Math.min(86, Math.max(14, tipLeftPct))}%` }}
          >
            <p className="font-semibold text-cloud">{current[hover].label}</p>
            <p className="mt-1 flex items-center gap-1.5 text-slate-300">
              <span className="h-0.5 w-3 rounded-full bg-cloud" />
              {currentLabel}: <span className="font-semibold tabular-nums text-cloud">{fmt(current[hover].value)}</span>
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-slate-300">
              <span className="h-0.5 w-3 rounded-full bg-slate/50" />
              {priorLabel}: <span className="tabular-nums text-slate-300">{fmt(prior[hover]?.value ?? 0)}</span>
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   PipelineRamp — pipeline-stage bar chart, progressive single-hue gold ramp,
   named stages, attributed $ + deal count per stage. Rows are drilldown
   buttons. Gold here = the report's single-hue ramp accent (a data ramp).
   ────────────────────────────────────────────────────────────────────────── */
/** Single-hue gold ramp via explicit fill-opacity (deepens toward Closed),
    with the terminal stage rendered ink — both as raw SVG attrs (no dynamic
    Tailwind class strings, so nothing can be tree-shaken away). */
function rampFill(i: number, n: number): { fill: string; opacity: number } {
  if (i === n - 1) return { fill: "var(--color-ink)", opacity: 1 };
  const t = n <= 2 ? 1 : i / (n - 2);
  return { fill: "var(--color-gold)", opacity: 0.3 + t * 0.65 };
}

export function PipelineRamp({
  stages,
  onDrill,
}: {
  stages: { stage: string; value: number; deals: number }[];
  onDrill?: (stage: { stage: string; value: number; deals: number }) => void;
}) {
  const max = Math.max(1, ...stages.map((s) => s.value));
  const totalValue = stages.reduce((s, x) => s + x.value, 0);
  const totalDeals = stages.reduce((s, x) => s + x.deals, 0);
  const interactive = typeof onDrill === "function";

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-[1.05rem] font-normal leading-none text-ink">
            Pipeline by stage
          </h2>
          <p className="mt-1.5 text-[0.74rem] text-slate">
            {compactUsd(totalValue)} across {totalDeals} live deals · attributed value
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {stages.map((s, i) => {
          const pct = Math.max(5, Math.round((s.value / max) * 100));
          const rf = rampFill(i, stages.length);
          const body = (
            <div className="flex items-center gap-3">
              <span className="w-[5.5rem] shrink-0 text-[0.78rem] font-medium text-ink sm:w-28">
                {s.stage}
              </span>
              <div className="flex flex-1 items-center gap-3">
                <svg viewBox="0 0 100 14" preserveAspectRatio="none" className="h-3.5 flex-1">
                  <rect x={0} y={2} width={100} height={10} rx={3} fill="var(--color-paper-200)" />
                  <rect
                    x={0}
                    y={2}
                    width={pct}
                    height={10}
                    rx={3}
                    fill={rf.fill}
                    fillOpacity={rf.opacity}
                  />
                </svg>
                <span className="w-16 shrink-0 text-right text-[0.78rem] font-semibold text-ink tabular-nums">
                  {compactUsd(s.value)}
                </span>
                <span className="w-14 shrink-0 text-right text-[0.72rem] text-slate tabular-nums">
                  {s.deals} {s.deals === 1 ? "deal" : "deals"}
                </span>
              </div>
            </div>
          );
          return interactive ? (
            <button
              key={s.stage}
              type="button"
              onClick={() => onDrill!(s)}
              className="-mx-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
            >
              {body}
            </button>
          ) : (
            <div key={s.stage} className="px-2 py-1.5">
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Sparkline — tiny inline trend line for drawer stat panels (no axes/labels).
   ────────────────────────────────────────────────────────────────────────── */
export function Sparkline({
  values,
  tone = "ink",
  className,
}: {
  values: number[];
  tone?: "ink" | "success" | "gold";
  className?: string;
}) {
  if (values.length < 2) return null;
  const w = 120;
  const h = 32;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const stroke =
    tone === "success"
      ? "var(--color-success)"
      : tone === "gold"
        ? "var(--color-gold-bright)"
        : "var(--color-ink)";
  const d = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - 3 - ((v - min) / span) * (h - 6);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("w-full", className)} aria-hidden>
      <path d={d} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
