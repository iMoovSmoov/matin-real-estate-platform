"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";
import type { Lead } from "@/lib/types";
import { leadSourceAnalysis } from "./leadView";

/* ──────────────────────────────────────────────────────────────────────────
   CRM & Leads — "Lead source analysis" (S2.7)

   Rebuilt from hand-rolled flat bars into a REAL recharts horizontal stacked
   bar chart: per-source HOT (gold, score ≥ 80) stacked over the remaining warm/
   cold volume (ink), with value labels and a dark decomposing tooltip (hot vs
   total). Every row is a real provenance count; the header reconciles to the
   table (sum of bars = total leads). Colors from the §1.1 palette — gold is
   sanctioned here as the lead-temperature signal.
   ────────────────────────────────────────────────────────────────────────── */

const GRID = "#ebebea";
const AXIS = "#8a8a90";
const INK = "#3a3a40";
const GOLD = "#d2a050";

type Row = { source: string; hot: number; rest: number; count: number };

function SourceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: Row }[];
}) {
  const row = active && payload && payload.length > 0 ? payload[0]?.payload : undefined;
  if (!row) return null;
  const pct = row.count ? Math.round((row.hot / row.count) * 100) : 0;
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-900/95 px-3 py-2 text-[0.76rem] shadow-xl backdrop-blur">
      <p className="mb-1 font-semibold text-cloud">{row.source}</p>
      <div className="space-y-0.5 text-slate-300">
        <div className="flex items-center justify-between gap-5">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: GOLD }} /> Hot (80+)
          </span>
          <span className="font-semibold tabular-nums text-cloud">
            {row.hot} · {pct}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: INK }} /> Total
          </span>
          <span className="font-semibold tabular-nums text-cloud">{row.count}</span>
        </div>
      </div>
    </div>
  );
}

export function LeadSourceAnalysis({ leads }: { leads: Lead[] }) {
  const rows: Row[] = leadSourceAnalysis(leads).map((r) => ({
    source: r.source,
    hot: r.hot,
    rest: Math.max(0, r.count - r.hot),
    count: r.count,
  }));
  const total = leads.length;

  return (
    <div className="rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-[1.02rem] font-normal leading-tight text-ink">
          Lead source analysis
        </h3>
        <span className="text-[0.74rem] text-slate tabular-nums">
          {total} leads · {rows.length} sources
        </span>
      </div>
      <p className="mt-0.5 text-[0.74rem] text-slate">
        Volume by channel; the gold segment is hot leads (score ≥ 80).
      </p>

      <div className="mt-3 w-full" style={{ height: Math.max(180, rows.length * 38) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 36, left: 4, bottom: 4 }}
            barCategoryGap="28%"
          >
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: AXIS, fontSize: 11 }}
              axisLine={{ stroke: GRID }}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="source"
              tick={{ fill: AXIS, fontSize: 11 }}
              axisLine={{ stroke: GRID }}
              tickLine={false}
              width={108}
            />
            <Tooltip cursor={{ fill: "#00000008" }} content={<SourceTooltip />} />
            <Bar dataKey="hot" stackId="s" fill={GOLD} radius={[3, 0, 0, 3]} maxBarSize={18} isAnimationActive={false} />
            <Bar dataKey="rest" stackId="s" fill={INK} radius={[0, 3, 3, 0]} maxBarSize={18} isAnimationActive={false}>
              <LabelList
                dataKey="count"
                position="right"
                fill="#161617"
                style={{ fontSize: 11, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
