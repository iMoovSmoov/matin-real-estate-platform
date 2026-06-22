"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { compactUsd, usd } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Seller / Cash Offers — real recharts visualizations (S3 tickets 2 & 4)

   • HomeValueSparkline — a 12-month estimated-value line that sits beside the
     drawer hero $. Deterministic from the record (estValue + id) so the same
     home always traces the same curve; ends exactly at the record's estValue.
   • NetToSellerBar — a tiny per-column horizontal bar for the comparison matrix
     so the winning offer's net proceeds are obvious at a glance (filled
     relative to the strongest net in the set; success-green; ink for the top).

   Tokens match DashboardCharts.tsx so charts read as one system. No animated
   decoration; dark-on-light tooltip. Gold is NOT used here (charts are data,
   not AI). Server-safe except the recharts wrapper (client).
   ────────────────────────────────────────────────────────────────────────── */

const GRID = "#ebebea";
const AXIS = "#8a8a90";
const INK = "#1a1a1a";
const SUCCESS = "#2fa36b";

const MONTHS = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

/** Stable 32-bit hash so the curve is reproducible from the record id. */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * A plausible 12-month estimated-value series that lands exactly on `estValue`
 * in the final month. Slight, deterministic month-to-month wobble + a gentle
 * appreciation trend keyed off the record id — never random, never flat.
 */
export function homeValueSeries(
  estValue: number,
  id: string,
): { month: string; value: number }[] {
  const seed = hashId(id);
  // Total appreciation over the window: 3%–8% keyed off the id.
  const totalGrowth = 0.03 + (seed % 50) / 1000; // 0.030 … 0.079
  const start = Math.round(estValue / (1 + totalGrowth));
  return MONTHS.map((month, i) => {
    const t = i / (MONTHS.length - 1);
    const trend = start + (estValue - start) * t;
    // Deterministic ± wobble (±0.9%) that zeroes out on the last point.
    const wobble =
      i === MONTHS.length - 1
        ? 0
        : Math.sin((seed % 17) + i * 1.3) * estValue * 0.009;
    return { month, value: Math.round(trend + wobble) };
  });
}

function ValueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number | string }[];
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-ink/[0.08] bg-white/95 px-2.5 py-1.5 text-[0.74rem] shadow-xl backdrop-blur">
      <p className="font-semibold text-ink">{String(label)}</p>
      <p className="tabular-nums text-slate">{usd(Number(payload[0]?.value ?? 0))}</p>
    </div>
  );
}

/** 12-month estimated-value area sparkline beside the drawer hero number. */
export function HomeValueSparkline({
  estValue,
  id,
  height = 84,
}: {
  estValue: number;
  id: string;
  height?: number;
}) {
  const data = homeValueSeries(estValue, id);
  const lo = Math.min(...data.map((d) => d.value));
  const hi = Math.max(...data.map((d) => d.value));
  const gradId = `hv-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SUCCESS} stopOpacity={0.28} />
              <stop offset="100%" stopColor={SUCCESS} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            tick={{ fill: AXIS, fontSize: 9 }}
            axisLine={{ stroke: GRID }}
            tickLine={false}
            interval={2}
          />
          <YAxis hide domain={[lo - (hi - lo) * 0.4, hi + (hi - lo) * 0.2]} />
          <Tooltip
            cursor={{ stroke: SUCCESS, strokeOpacity: 0.3 }}
            content={<ValueTooltip />}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={SUCCESS}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 3.5, fill: SUCCESS, stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Tiny net-to-seller bar for a matrix column. Fills relative to `max` (the
 * strongest net across the offers). The top offer renders ink (terminal/best),
 * others success-green; weaker fills read at a glance which column wins.
 */
export function NetToSellerBar({
  net,
  max,
  isTop,
}: {
  net: number;
  max: number;
  isTop?: boolean;
}) {
  const pct = max > 0 ? Math.max(6, Math.round((net / max) * 100)) : 0;
  return (
    <div className="mt-1.5">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-200">
        <div
          className={isTop ? "h-full rounded-full bg-ink" : "h-full rounded-full bg-success"}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[0.66rem] tabular-nums text-slate">{compactUsd(net)} net</p>
    </div>
  );
}
