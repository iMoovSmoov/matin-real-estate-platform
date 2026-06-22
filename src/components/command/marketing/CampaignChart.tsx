"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BarChart3, ChevronDown } from "lucide-react";
import { num } from "@/lib/utils";
import type { CampaignPerfRow } from "./marketing-branding";

/* ──────────────────────────────────────────────────────────────────────────
   Marketing Studio — CampaignChart  (S8 ticket 4, ref §2.8 Fello funnel chart)

   The biggest density win: a REAL recharts campaign-performance bar chart with
   a DECOMPOSING dark tooltip (Opens / Clicks / Replies / Leads per campaign),
   plus a metric toggle (Opens · Clicks · Replies · Leads) and a date-range /
   granularity dropdown row (Fello automation-detail header pattern). One bar per
   real campaign; values computed off the recorded sent + open/reply rates.

   Single-hue ink ramp by performance rank (the report's data ramp), so the bars
   stay on-brand — gold is rationed to AI affordances and never used as chart
   decoration. Server-rendered shell, recharts hydrates client-side.
   ────────────────────────────────────────────────────────────────────────── */

type Metric = "opens" | "clicks" | "replies" | "leads";

const METRICS: { key: Metric; label: string }[] = [
  { key: "opens", label: "Opens" },
  { key: "clicks", label: "Clicks" },
  { key: "replies", label: "Replies" },
  { key: "leads", label: "Leads" },
];

const RANGES = ["Last 30 days", "Last 90 days", "Year to date"] as const;
const GRANULARITY = ["By campaign", "Weekly", "Monthly"] as const;

/** Single-hue ink ramp: top performer darkest → lighter down the rank. */
function rampFill(rank: number, n: number): string {
  const t = n <= 1 ? 0 : rank / (n - 1);
  // ink at top → mid-slate at bottom, via opacity-style lightening.
  const lightness = 6 + t * 34; // 6% (near-ink) → 40%
  return `hsl(240 4% ${lightness}%)`;
}

/** Recharts passes `active` + `payload` to a custom tooltip; we read the data
 *  row off the first payload entry. Typed locally to stay version-agnostic. */
type TooltipInjected = {
  active?: boolean;
  payload?: { payload?: CampaignPerfRow }[];
};

function DecomposingTooltip({ active, payload }: TooltipInjected) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  const rows: { label: string; value: number; dot: string }[] = [
    { label: "Opens", value: row.opens, dot: "bg-cloud" },
    { label: "Clicks", value: row.clicks, dot: "bg-slate-300" },
    { label: "Replies", value: row.replies, dot: "bg-gold" },
    { label: "Leads", value: row.leads, dot: "bg-success" },
  ];
  return (
    <div className="min-w-[180px] rounded-lg border border-ink-700 bg-ink-900 px-3 py-2.5 shadow-lift">
      <p className="text-[0.78rem] font-semibold text-cloud">{row.name}</p>
      <p className="mt-0.5 text-[0.68rem] text-slate-300">
        {num(row.sent)} sent · {row.attributedPipeline ? `$${num(Math.round(row.attributedPipeline / 1000))}K attributed` : "no attribution yet"}
      </p>
      <div className="mt-2 space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 text-[0.72rem]">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className={`h-1.5 w-1.5 rounded-full ${r.dot}`} />
              {r.label}
            </span>
            <span className="font-semibold tabular-nums text-cloud">{num(r.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CampaignChart({ data }: { data: CampaignPerfRow[] }) {
  const [metric, setMetric] = useState<Metric>("opens");
  const [range, setRange] = useState<(typeof RANGES)[number]>("Last 90 days");
  const [granularity, setGranularity] = useState<(typeof GRANULARITY)[number]>(
    "By campaign",
  );

  // Rank for the single-hue ramp is by the ACTIVE metric (re-sorts the ramp).
  const ranked = useMemo(() => {
    const order = [...data].sort((a, b) => b[metric] - a[metric]).map((d) => d.id);
    return data.map((d) => ({ ...d, rank: order.indexOf(d.id) }));
  }, [data, metric]);

  const totals = useMemo(
    () => ({
      opens: data.reduce((s, d) => s + d.opens, 0),
      clicks: data.reduce((s, d) => s + d.clicks, 0),
      replies: data.reduce((s, d) => s + d.replies, 0),
      leads: data.reduce((s, d) => s + d.leads, 0),
    }),
    [data],
  );

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-mist bg-cloud p-4 shadow-soft md:p-5">
      {/* Header — title + active "Active" pill + range/granularity dropdowns */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-paper-200 text-slate ring-1 ring-inset ring-mist">
            <BarChart3 className="h-3.5 w-3.5" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-[1.05rem] font-normal leading-tight text-ink">
              Campaign performance
            </h2>
            <p className="mt-1 text-[0.74rem] text-slate tabular-nums">
              {num(totals.opens)} opens · {num(totals.clicks)} clicks ·{" "}
              {num(totals.replies)} replies · {num(totals.leads)} leads
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Dropdown
            options={RANGES as readonly string[]}
            value={range}
            onChange={(v) => setRange(v as (typeof RANGES)[number])}
          />
          <Dropdown
            options={GRANULARITY as readonly string[]}
            value={granularity}
            onChange={(v) => setGranularity(v as (typeof GRANULARITY)[number])}
          />
        </div>
      </div>

      {/* Metric toggle (Opens · Clicks · Replies · Leads) */}
      <div
        role="tablist"
        aria-label="Chart metric"
        className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {METRICS.map((m) => {
          const active = m.key === metric;
          return (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMetric(m.key)}
              className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[0.78rem] font-medium leading-none transition-colors ${
                active
                  ? "bg-ink text-cloud"
                  : "border border-mist bg-cloud text-slate hover:text-ink"
              }`}
            >
              {m.label}
              <span className="tabular-nums opacity-70">{num(totals[m.key])}</span>
            </button>
          );
        })}
      </div>

      {/* The chart */}
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={ranked}
            margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
            barCategoryGap="26%"
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--color-mist)"
              strokeDasharray="0"
            />
            <XAxis
              dataKey="short"
              tickLine={false}
              axisLine={{ stroke: "var(--color-mist)" }}
              tick={{ fontSize: 10, fill: "var(--color-slate)" }}
              interval={0}
              height={32}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "var(--color-slate)" }}
              tickFormatter={(v) => num(v as number)}
              width={42}
            />
            <Tooltip
              cursor={{ fill: "var(--color-paper-200)", opacity: 0.6 }}
              content={<DecomposingTooltip />}
            />
            <Bar dataKey={metric} radius={[4, 4, 0, 0]} maxBarSize={56}>
              {ranked.map((d) => (
                <Cell key={d.id} fill={rampFill(d.rank, ranked.length)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[0.7rem] leading-snug text-slate">
        Funnel decomposed from delivered sends — hover a bar for the full
        open → click → reply → lead breakdown. Syncs back to CRM + Reports
        attribution.
      </p>
    </section>
  );
}

/* Small native-select dropdown styled as a chip (date range / granularity). */
function Dropdown({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-full border border-mist bg-cloud py-1.5 pl-3 pr-7 text-[0.76rem] font-medium text-slate outline-none transition-colors hover:border-ink/20 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 h-3 w-3 text-slate"
        aria-hidden
      />
    </div>
  );
}
