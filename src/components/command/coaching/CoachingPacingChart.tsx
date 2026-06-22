"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { coachingPacing } from "./coachingData";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Coaching · real per-quarter pacing chart (S9 ticket 4, recharts)

   Team practice volume (bars) + conversion % (line) over the quarter, current
   vs prior period. Dark hover tooltip stating both periods. Estate Green = the
   AI/active accent (current period); prior period recedes to a muted ink. No animation.
   ────────────────────────────────────────────────────────────────────────── */

const GRID = "#ebebea";
const AXIS = "#8a8a90";
const ACCENT = "#1f6b4a";
const INK_MUTED = "#c3c3c9";
const SUCCESS = "#56a07d";

type TipPayload = {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}[];

function DarkTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TipPayload;
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-[0.76rem] shadow-xl">
      <p className="mb-1 font-semibold text-cloud">{String(label)}</p>
      <div className="space-y-0.5">
        {payload.map((p, i) => {
          const isConversion = String(p.dataKey).startsWith("conversion");
          return (
            <div key={i} className="flex items-center gap-2 text-slate-300">
              <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />
              <span>{String(p.name)}</span>
              <span className="ml-auto font-semibold tabular-nums text-cloud">
                {isConversion ? `${Number(p.value).toFixed(1)}%` : Number(p.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CoachingPacingChart() {
  return (
    <div className="h-[230px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={coachingPacing}
          margin={{ top: 8, right: 8, bottom: 4, left: -16 }}
          barGap={4}
        >
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: AXIS, fontSize: 11 }}
            axisLine={{ stroke: GRID }}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: AXIS, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 30]}
            tick={{ fill: AXIS, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            cursor={{ fill: "rgba(6,6,6,0.04)" }}
            content={<DarkTooltip />}
          />
          <Bar
            yAxisId="left"
            dataKey="practicePrior"
            name="Practice · prior qtr"
            fill={INK_MUTED}
            radius={[3, 3, 0, 0]}
            maxBarSize={26}
          />
          <Bar
            yAxisId="left"
            dataKey="practiceCurrent"
            name="Practice · this qtr"
            fill={ACCENT}
            radius={[3, 3, 0, 0]}
            maxBarSize={26}
          >
            {coachingPacing.map((_, i) => (
              <Cell key={i} fill={ACCENT} />
            ))}
          </Bar>
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="conversionPrior"
            name="Conversion · prior"
            stroke={INK_MUTED}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="conversionCurrent"
            name="Conversion · this qtr"
            stroke={SUCCESS}
            strokeWidth={2}
            dot={{ r: 3, fill: SUCCESS, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
