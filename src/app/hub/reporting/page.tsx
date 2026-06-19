"use client";

import { useState } from "react";
import { BarChart3, TrendingUp, Users, Target, Home, CalendarDays, SlidersHorizontal } from "lucide-react";
import { salesAgents } from "@/lib/data";
import { Panel, PanelHeader, StatTile, SectionLabel, LiveDot } from "@/components/command/ui";
import { cn } from "@/lib/utils";
import {
  VolumeBarsChart,
  ClosingsBarChart,
  LeadsConvertedChart,
  PipelineByStageChart,
} from "@/components/command/DashboardCharts";
import { ReportingTable } from "@/components/command/ReportingTable";

export default function ReportingPage() {
  type Range = "MTD" | "QTD" | "YTD" | "Custom";
  const [range, setRange] = useState<Range>("MTD");
  const [showCustom, setShowCustom] = useState(false);

  /* ── Hardcoded KPIs per date range — clean, presentable numbers ── */
  const KPI: Record<Exclude<Range, "Custom">, { volume: string; sold: number; dom: number; conv: string }> = {
    MTD: { volume: "$8.4M",  sold: 12, dom: 23, conv: "4.2%" },
    QTD: { volume: "$24.1M", sold: 38, dom: 21, conv: "5.1%" },
    YTD: { volume: "$91.7M", sold: 147, dom: 19, conv: "6.8%" },
  };
  const kpi = range === "Custom" ? KPI.YTD : KPI[range];

  const RANGES: Range[] = ["MTD", "QTD", "YTD", "Custom"];

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 md:px-6 md:py-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <LiveDot tone="azure" />
            <SectionLabel>Reporting</SectionLabel>
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Reporting</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate">
            Brokerage-wide performance — volume, closings, days on market, and lead conversion.
          </p>
        </div>

        {/* Date range tabs */}
        <div className="flex flex-col items-end gap-2">
          <div className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-ink/[0.08] bg-white p-1 shadow-sm">
            <CalendarDays className="ml-1.5 h-3.5 w-3.5 shrink-0 text-slate/50" />
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRange(r);
                  if (r === "Custom") setShowCustom(true);
                  else setShowCustom(false);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[0.78rem] font-semibold transition-colors",
                  range === r
                    ? "bg-ink text-white shadow-sm"
                    : "text-slate hover:bg-ink/[0.04] hover:text-ink",
                )}
              >
                {r === "Custom" && <SlidersHorizontal className="h-3 w-3" />}
                {r}
              </button>
            ))}
          </div>
          {showCustom && (
            <div className="flex items-center gap-2 rounded-xl border border-ink/[0.08] bg-white px-3 py-2 shadow-sm">
              <CalendarDays className="h-3.5 w-3.5 text-slate/50" />
              <input
                type="date"
                className="text-[0.78rem] text-ink focus:outline-none"
                defaultValue="2026-01-01"
              />
              <span className="text-[0.78rem] text-slate">to</span>
              <input
                type="date"
                className="text-[0.78rem] text-ink focus:outline-none"
                defaultValue="2026-06-18"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Closed Volume"
          value={kpi.volume}
          icon={<TrendingUp className="h-4 w-4" />}
          accent
          delta={{ value: "12.1%", dir: "up" }}
        />
        <StatTile
          label="Properties Sold"
          value={String(kpi.sold)}
          icon={<Home className="h-4 w-4" />}
          hint={`This ${range.replace("TD", "")}`}
        />
        <StatTile
          label="Avg Days on Market"
          value={String(kpi.dom)}
          icon={<BarChart3 className="h-4 w-4" />}
          delta={{ value: "3d", dir: "down" }}
        />
        <StatTile
          label="Lead Conversion"
          value={kpi.conv}
          icon={<Target className="h-4 w-4" />}
          delta={{ value: "1.2pt", dir: "up" }}
        />
      </div>

      {/* Charts — responsive 2-col grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Monthly Volume"
            subtitle="Closed sales volume by month"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <div className="h-64 px-3 py-4">
            <VolumeBarsChart />
          </div>
        </Panel>
        <Panel>
          <PanelHeader
            title="Closings by Month"
            subtitle="Units closed"
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <div className="h-64 px-3 py-4">
            <ClosingsBarChart />
          </div>
        </Panel>
        <Panel>
          <PanelHeader
            title="Leads vs. Converted"
            subtitle="Capture and conversion trend"
            icon={<Users className="h-4 w-4" />}
          />
          <div className="h-64 px-3 py-4">
            <LeadsConvertedChart />
          </div>
        </Panel>
        <Panel>
          <PanelHeader
            title="Pipeline by Stage"
            subtitle="Open value across the funnel"
            icon={<Target className="h-4 w-4" />}
          />
          <div className="h-64 px-3 py-4">
            <PipelineByStageChart />
          </div>
        </Panel>
      </div>

      {/* Per-agent production table */}
      <section>
        <div className="mb-2.5 flex items-center gap-2">
          <SectionLabel>Agent Production</SectionLabel>
          <span className="h-px flex-1 bg-ink/[0.06]" />
        </div>
        <ReportingTable agents={salesAgents} />
      </section>
    </div>
  );
}
