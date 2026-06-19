"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { metrics } from "@/lib/data";
import { compactUsd, num } from "@/lib/utils";

type TipPayload = { name?: string | number; value?: number | string; color?: string }[];
type TipProps = {
  active?: boolean;
  payload?: TipPayload;
  label?: string | number;
  fmt?: (v: number, name: string) => string;
};

const GRID = "#1c2532";
const AXIS = "#5d6b7d";
const AZURE = "#c7a567";
const AZURE_DEEP = "#7a5e32";
const SUCCESS = "#2fa36b";

/* ── Shared dark tooltip ─────────────────────────────────────────────── */
function DarkTooltip({ active, payload, label, fmt }: TipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-ink-800/95 px-3 py-2 text-[0.78rem] shadow-xl backdrop-blur">
      {label != null && (
        <p className="mb-1 font-semibold text-white">{String(label)}</p>
      )}
      <div className="space-y-0.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-slate-300">
            <span className="h-2 w-2 rounded-sm" style={{ background: p.color ?? AZURE }} />
            <span className="capitalize">{p.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-white">
              {fmt ? fmt(Number(p.value), String(p.name)) : num(Number(p.value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const axisProps = {
  tick: { fill: AXIS, fontSize: 11 },
  axisLine: { stroke: GRID },
  tickLine: false,
} as const;

/* ── 1. Volume by month (area) ───────────────────────────────────────── */
export function VolumeAreaChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={metrics.volumeByMonth} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={AZURE} stopOpacity={0.35} />
            <stop offset="100%" stopColor={AZURE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} width={44} tickFormatter={(v) => compactUsd(Number(v))} />
        <Tooltip
          cursor={{ stroke: AZURE, strokeOpacity: 0.25 }}
          content={<DarkTooltip fmt={(v, n) => (n === "volume" ? compactUsd(v) : num(v))} />}
        />
        <Area
          type="monotone"
          dataKey="volume"
          name="volume"
          stroke={AZURE}
          strokeWidth={2}
          fill="url(#volFill)"
          dot={false}
          activeDot={{ r: 4, fill: AZURE, stroke: "#0a0e14", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── 1b. Volume vs closings (combo bars, used in reporting) ──────────── */
export function VolumeBarsChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={metrics.volumeByMonth} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} width={44} tickFormatter={(v) => compactUsd(Number(v))} />
        <Tooltip
          cursor={{ fill: "#ffffff08" }}
          content={<DarkTooltip fmt={(v, n) => (n === "volume" ? compactUsd(v) : num(v))} />}
        />
        <Bar dataKey="volume" name="volume" fill={AZURE} radius={[4, 4, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── 2. Leads by source (horizontal bars) ────────────────────────────── */
export function LeadsBySourceChart() {
  const data = [...metrics.leadsBySource].sort((a, b) => b.count - a.count);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" {...axisProps} />
        <YAxis type="category" dataKey="source" {...axisProps} width={84} />
        <Tooltip cursor={{ fill: "#ffffff08" }} content={<DarkTooltip />} />
        <Bar dataKey="count" name="leads" radius={[0, 4, 4, 0]} maxBarSize={16}>
          {data.map((_, i) => (
            <Cell key={i} fill={i % 2 === 0 ? AZURE : AZURE_DEEP} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── 3. Pipeline by stage (bars, $ value) ────────────────────────────── */
export function PipelineByStageChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={metrics.pipelineByStage} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="stage" {...axisProps} interval={0} angle={-20} textAnchor="end" height={52} />
        <YAxis {...axisProps} width={44} tickFormatter={(v) => compactUsd(Number(v))} />
        <Tooltip
          cursor={{ fill: "#ffffff08" }}
          content={<DarkTooltip fmt={(v, n) => (n === "value" ? compactUsd(v) : num(v))} />}
        />
        <Bar dataKey="value" name="value" fill={AZURE} radius={[4, 4, 0, 0]} maxBarSize={34}>
          {metrics.pipelineByStage.map((s, i) => (
            <Cell key={i} fill={s.stage === "Closed" ? SUCCESS : AZURE} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── 4. Conversion funnel (horizontal tapered bars) ──────────────────── */
export function ConversionFunnelChart() {
  const top = metrics.funnel[0]?.count || 1;
  const data = metrics.funnel.map((f) => ({ ...f, pct: Math.round((f.count / top) * 100) }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 44, left: 4, bottom: 4 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" {...axisProps} hide />
        <YAxis type="category" dataKey="stage" {...axisProps} width={96} />
        <Tooltip
          cursor={{ fill: "#ffffff08" }}
          content={<DarkTooltip fmt={(v) => num(v)} />}
        />
        <Bar dataKey="count" name="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={`color-mix(in oklab, ${AZURE} ${100 - i * 12}%, ${AZURE_DEEP})`}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── 5. Leads vs converted (line, reporting) ─────────────────────────── */
export function LeadsConvertedChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={metrics.leadsByMonth} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} width={36} />
        <Tooltip cursor={{ stroke: AZURE, strokeOpacity: 0.25 }} content={<DarkTooltip />} />
        <Line type="monotone" dataKey="leads" name="leads" stroke={AZURE} strokeWidth={2} dot={false} />
        <Line
          type="monotone"
          dataKey="converted"
          name="converted"
          stroke={SUCCESS}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── 6. Closings by month (bar, reporting) ───────────────────────────── */
export function ClosingsBarChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={metrics.volumeByMonth} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} width={32} />
        <Tooltip cursor={{ fill: "#ffffff08" }} content={<DarkTooltip />} />
        <Bar dataKey="closings" name="closings" fill={SUCCESS} radius={[4, 4, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}
