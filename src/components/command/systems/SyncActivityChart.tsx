"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { num } from "@/lib/utils";
import { buildSyncSeries } from "@/lib/data/systems-series";

/* ──────────────────────────────────────────────────────────────────────────
   Systems Health — SyncActivityChart (ref §2.11 ticket 3)

   "Sync & error activity (last 7 days)" — a recharts stacked area of successful
   vs failed automation runs with a dark hover tooltip. The series is derived
   from the live run/integration totals (last day = current failed count) so it
   reconciles to the workflow-run table, not flat hand-drawn bars.
   ────────────────────────────────────────────────────────────────────────── */

const GRID = "#ebebea";
const AXIS = "#8a8a90";
const SUCCESS = "#56a07d";
const DANGER = "#c0584a";

type TipPayload = { name?: string | number; value?: number | string; color?: string }[];

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
    <div className="rounded-lg border border-ink-700 bg-ink-900/95 px-3 py-2 text-[0.78rem] shadow-xl backdrop-blur">
      {label != null ? <p className="mb-1 font-semibold text-cloud">{String(label)}</p> : null}
      <div className="space-y-0.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-slate-300">
            <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />
            <span className="capitalize">{p.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-cloud">
              {num(Number(p.value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SyncActivityChart({
  totalRuns,
  failedToday,
}: {
  totalRuns: number;
  failedToday: number;
}) {
  const data = buildSyncSeries(totalRuns, failedToday);

  return (
    <section className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mist px-5 py-4">
        <div>
          <h2 className="font-display text-[1.12rem] font-normal leading-tight text-ink">
            Sync &amp; error activity
          </h2>
          <p className="mt-0.5 text-[0.78rem] text-slate">Successful vs failed runs · last 7 days</p>
        </div>
        <div className="flex items-center gap-3 text-[0.72rem] tabular-nums">
          <span className="inline-flex items-center gap-1.5 text-success">
            <span className="h-2 w-3 rounded-full bg-success" /> Succeeded
          </span>
          <span className="inline-flex items-center gap-1.5 text-danger">
            <span className="h-2 w-3 rounded-full bg-danger" /> Failed
          </span>
        </div>
      </div>
      <div className="h-56 px-3 py-4 sm:h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="okFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SUCCESS} stopOpacity={0.32} />
                <stop offset="100%" stopColor={SUCCESS} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="badFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={DANGER} stopOpacity={0.4} />
                <stop offset="100%" stopColor={DANGER} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: AXIS, fontSize: 11 }}
              axisLine={{ stroke: GRID }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: AXIS, fontSize: 11 }}
              axisLine={{ stroke: GRID }}
              tickLine={false}
              width={36}
            />
            <Tooltip cursor={{ stroke: AXIS, strokeOpacity: 0.25 }} content={<DarkTooltip />} />
            <Area
              type="monotone"
              dataKey="succeeded"
              name="succeeded"
              stroke={SUCCESS}
              strokeWidth={2}
              fill="url(#okFill)"
              dot={false}
              activeDot={{ r: 4, fill: SUCCESS, stroke: "#fff", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="failed"
              name="failed"
              stroke={DANGER}
              strokeWidth={2}
              fill="url(#badFill)"
              dot={false}
              activeDot={{ r: 4, fill: DANGER, stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
