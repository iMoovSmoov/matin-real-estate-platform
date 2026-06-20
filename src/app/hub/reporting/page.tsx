"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Home,
  CalendarDays,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { salesAgents, metrics } from "@/lib/data";
import type { Agent } from "@/lib/types";
import { Panel, PanelHeader, StatTile, SectionLabel, Pill } from "@/components/command/ui";
import { cn, compactUsd } from "@/lib/utils";
import {
  VolumeBarsChart,
  ClosingsBarChart,
  LeadsConvertedChart,
  PipelineByStageChart,
  SourceRoiChart,
} from "@/components/command/DashboardCharts";
import { ReportingTable, type Row } from "@/components/command/ReportingTable";
import { AgentDetailPanel } from "@/components/command/AgentDetailPanel";
import Image from "next/image";

type Range = "MTD" | "QTD" | "YTD" | "Custom";
type MobileTab = "overview" | "production" | "roi" | "leaderboard";

type SourceRoi = {
  source: string;
  leads: number;
  closed: number;
  revenue: number;
  spend: number;
};

const KPI: Record<Exclude<Range, "Custom">, { volume: string; sold: number; dom: number; conv: string }> = {
  MTD: { volume: "$8.4M",  sold: 12,  dom: 23, conv: "4.2%" },
  QTD: { volume: "$24.1M", sold: 38,  dom: 21, conv: "5.1%" },
  YTD: { volume: "$91.7M", sold: 147, dom: 19, conv: "6.8%" },
};

const RANGES: Range[] = ["MTD", "QTD", "YTD", "Custom"];

const MOBILE_TABS: { key: MobileTab; label: string }[] = [
  { key: "overview",    label: "Overview" },
  { key: "production",  label: "Agents" },
  { key: "roi",         label: "Source ROI" },
  { key: "leaderboard", label: "Leaderboard" },
];

function respTone(mins: number): "success" | "warn" | "danger" {
  if (mins <= 5) return "success";
  if (mins <= 15) return "warn";
  return "danger";
}

export default function ReportingPage() {
  const [range, setRange] = useState<Range>("MTD");
  const [showCustom, setShowCustom] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("overview");

  /* Desktop interactions */
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeStageFilter, setActiveStageFilter] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<SourceRoi | null>(null);

  /* Mobile bottom sheet */
  const [mobileAgent, setMobileAgent] = useState<Agent | null>(null);

  const kpi = range === "Custom" ? KPI.YTD : KPI[range];

  function handleAgentRowClick(row: Row) {
    const a = salesAgents.find((a) => a.name === row.name);
    if (a) {
      setSelectedAgent(a);
      setSelectedSource(null);
    }
  }

  function handleMobileAgentCardClick(a: Agent) {
    setMobileAgent(a);
  }

  /* Leaderboard data: sort salesAgents by volume desc */
  const leaderboardAgents = [...salesAgents].sort((a, b) => b.volume - a.volume);
  const maxVolume = Math.max(...leaderboardAgents.map((a) => a.volume), 1);

  /* Source ROI data */
  const sourceRoiData: SourceRoi[] =
    metrics.sourceRoi && metrics.sourceRoi.length > 0
      ? (metrics.sourceRoi as SourceRoi[])
      : [];

  const bestRoiSource = [...sourceRoiData].sort(
    (a, b) => b.revenue - b.spend - (a.revenue - a.spend),
  )[0];

  /* Stage filter chip: find stage deals count */
  const activeStageDeals = activeStageFilter
    ? (metrics.pipelineByStage.find((s) => s.stage === activeStageFilter)?.deals ?? 0)
    : 0;

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 px-4 pt-3 md:px-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between border-b border-ink/[0.06] pb-3">
        <h1 className="font-display text-[1.05rem] font-semibold text-ink">Reporting</h1>

        {/* Date range chip bar */}
        <div className="flex flex-col items-end gap-2">
          <div className="inline-flex shrink-0 items-center gap-1 overflow-x-auto rounded-xl border border-ink/[0.08] bg-white p-1 shadow-sm">
            <CalendarDays className="ml-1.5 h-3.5 w-3.5 shrink-0 text-slate/50" />
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRange(r);
                  setShowCustom(r === "Custom");
                }}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[0.78rem] font-semibold transition-colors",
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
              <input type="date" className="text-[0.78rem] text-ink focus:outline-none" defaultValue="2026-01-01" />
              <span className="text-[0.78rem] text-slate">to</span>
              <input type="date" className="text-[0.78rem] text-ink focus:outline-none" defaultValue="2026-06-19" />
            </div>
          )}
        </div>
      </div>

      {/* ── KPI tiles ── */}
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

      {/* ══════════════════════════════════════════
          MOBILE LAYOUT (< lg)
      ══════════════════════════════════════════ */}
      <div className="lg:hidden space-y-4">
        {/* Mobile tab chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {MOBILE_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMobileTab(key)}
              className={cn(
                "shrink-0 rounded-lg px-3.5 py-1.5 text-[0.78rem] font-semibold transition-colors",
                mobileTab === key
                  ? "bg-ink text-white"
                  : "border border-ink/[0.08] bg-white text-slate hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {mobileTab === "overview" && (
          <div className="space-y-4">
            <Panel>
              <PanelHeader title="Monthly Volume" subtitle="Closed sales volume" icon={<TrendingUp className="h-4 w-4" />} />
              <div className="h-52 px-3 py-4"><VolumeBarsChart /></div>
            </Panel>
            <Panel>
              <PanelHeader title="Closings by Month" subtitle="Units closed" icon={<BarChart3 className="h-4 w-4" />} />
              <div className="h-52 px-3 py-4"><ClosingsBarChart /></div>
            </Panel>
            <Panel>
              <PanelHeader title="Leads vs. Converted" subtitle="Capture and conversion trend" icon={<Users className="h-4 w-4" />} />
              <div className="h-52 px-3 py-4"><LeadsConvertedChart /></div>
            </Panel>
            <Panel>
              <PanelHeader title="Pipeline Velocity" subtitle="Open value by stage" icon={<Target className="h-4 w-4" />} />
              <div className="h-52 px-3 py-4">
                <PipelineByStageChart
                  onBarClick={(stage) =>
                    setActiveStageFilter(stage === activeStageFilter ? null : stage)
                  }
                />
              </div>
              {activeStageFilter && (
                <div className="flex items-center gap-2 px-5 pb-3">
                  <Pill tone="azure">
                    {activeStageFilter} &middot; {activeStageDeals} deals
                  </Pill>
                  <button
                    onClick={() => setActiveStageFilter(null)}
                    className="text-[0.72rem] text-slate hover:text-ink"
                  >
                    ✕ Clear
                  </button>
                </div>
              )}
            </Panel>
          </div>
        )}

        {/* AGENT PRODUCTION TAB (mobile cards) */}
        {mobileTab === "production" && (
          <div className="space-y-2">
            {salesAgents.map((a) => (
              <button
                key={a.slug}
                onClick={() => handleMobileAgentCardClick(a)}
                className="flex w-full items-center gap-3 rounded-xl border border-ink/[0.08] bg-white p-3 text-left shadow-sm transition-colors hover:border-ink/20 active:bg-paper"
              >
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-ink/[0.06]">
                  <Image src={a.photo} alt={a.name} fill sizes="40px" className="object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.84rem] font-semibold text-ink">{a.name}</p>
                  <p className="truncate text-[0.7rem] text-slate/60">{a.title}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="text-[0.84rem] font-semibold text-ink">{compactUsd(a.volume)}</span>
                  <Pill tone={respTone(a.responseTimeMins ?? 0)}>{a.responseTimeMins ?? 0}m</Pill>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* SOURCE ROI TAB */}
        {mobileTab === "roi" && (
          <div className="space-y-4">
            <Panel>
              <PanelHeader title="Lead Source ROI" subtitle="Revenue vs. spend by channel" icon={<BarChart3 className="h-4 w-4" />} />
              <div className="h-72 px-3 py-4">
                <SourceRoiChart onBarClick={(src) => {
                  const found = sourceRoiData.find((s) => s.source === src);
                  if (found) setSelectedSource(found);
                }} />
              </div>
            </Panel>
            {sourceRoiData.map((s) => {
              const roi = s.spend === 0 ? "∞" : `${Math.round(((s.revenue - s.spend) / s.spend) * 100)}%`;
              return (
                <button
                  key={s.source}
                  onClick={() => setSelectedSource(s)}
                  className="flex w-full items-center justify-between rounded-xl border border-ink/[0.08] bg-white p-3 text-left shadow-sm hover:border-ink/20"
                >
                  <div>
                    <p className="text-[0.84rem] font-semibold text-ink">{s.source}</p>
                    <p className="text-[0.7rem] text-slate/60">{s.leads} leads · {s.closed} closed · {compactUsd(s.spend)} spend</p>
                  </div>
                  <span className={cn(
                    "text-[0.9rem] font-display font-semibold",
                    s.spend === 0 || ((s.revenue - s.spend) / s.spend) > 1 ? "text-success" : "text-warn",
                  )}>
                    {roi}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {mobileTab === "leaderboard" && (
          <Panel>
            <PanelHeader title="Agent Leaderboard" subtitle="Ranked by closed volume" icon={<Users className="h-4 w-4" />} />
            <div className="divide-y divide-ink/[0.06]">
              {leaderboardAgents.map((a, i) => (
                <button
                  key={a.slug}
                  onClick={() => handleMobileAgentCardClick(a)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-paper transition-colors"
                >
                  <span className="w-8 shrink-0 text-center font-display text-3xl text-ink/10">{i + 1}</span>
                  <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-ink/[0.06]">
                    <Image src={a.photo} alt={a.name} fill sizes="32px" className="object-cover" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.84rem] font-semibold text-ink">{a.name}</p>
                    <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-[#f0f0ef]">
                      <div
                        className="h-full rounded-full bg-ink transition-[width]"
                        style={{ width: `${(a.volume / maxVolume) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-[0.82rem] font-semibold tabular-nums text-ink">
                    {compactUsd(a.volume)}
                  </span>
                </button>
              ))}
            </div>
          </Panel>
        )}
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP LAYOUT (lg+)
      ══════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:items-start lg:gap-5">
        {/* Left column */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Charts grid (top) */}
          <div className="grid grid-cols-2 gap-4">
            <Panel>
              <PanelHeader title="Monthly Volume" subtitle="Closed sales volume" icon={<TrendingUp className="h-4 w-4" />} />
              <div className="h-64 px-3 py-4"><VolumeBarsChart /></div>
            </Panel>
            <Panel>
              <PanelHeader title="Closings by Month" subtitle="Units closed" icon={<BarChart3 className="h-4 w-4" />} />
              <div className="h-64 px-3 py-4"><ClosingsBarChart /></div>
            </Panel>
            <Panel>
              <PanelHeader title="Leads vs. Converted" subtitle="Capture and conversion" icon={<Users className="h-4 w-4" />} />
              <div className="h-64 px-3 py-4"><LeadsConvertedChart /></div>
            </Panel>
            <Panel>
              <PanelHeader title="Pipeline Velocity" subtitle="Open value by stage" icon={<Target className="h-4 w-4" />} />
              <div className="h-64 px-3 py-4">
                <PipelineByStageChart
                  onBarClick={(stage) =>
                    setActiveStageFilter(stage === activeStageFilter ? null : stage)
                  }
                />
              </div>
              {activeStageFilter && (
                <div className="flex items-center gap-2 px-5 pb-3">
                  <Pill tone="azure">
                    Filtering: {activeStageFilter} &middot; {activeStageDeals} deals
                  </Pill>
                  <button
                    onClick={() => setActiveStageFilter(null)}
                    className="text-[0.72rem] text-slate hover:text-ink"
                  >
                    ✕ Clear
                  </button>
                </div>
              )}
            </Panel>
          </div>

          {/* Source ROI panel */}
          <Panel>
            <PanelHeader
              title="Lead Source ROI"
              subtitle="Revenue vs. spend by channel"
              icon={<BarChart3 className="h-4 w-4" />}
              action={
                selectedSource ? (
                  <button
                    onClick={() => setSelectedSource(null)}
                    className="text-[0.78rem] font-semibold text-ink hover:underline"
                  >
                    View All
                  </button>
                ) : undefined
              }
            />
            <div className="h-72 px-3 py-4">
              <SourceRoiChart
                onBarClick={(src) => {
                  const found = sourceRoiData.find((s) => s.source === src);
                  if (found) {
                    setSelectedSource(found);
                    setSelectedAgent(null);
                  }
                }}
              />
            </div>
            {bestRoiSource && (
              <p className="px-5 pb-3 text-[0.78rem] text-slate">
                Best ROI:{" "}
                <span className="font-semibold text-ink">{bestRoiSource.source}</span>
                {bestRoiSource.spend === 0
                  ? " — pure referral revenue at $0 spend"
                  : ` — ${Math.round(((bestRoiSource.revenue - bestRoiSource.spend) / bestRoiSource.spend) * 100)}% ROI`}
              </p>
            )}
          </Panel>

          {/* Agent production table */}
          <ReportingTable agents={salesAgents} onAgentClick={handleAgentRowClick} />
        </div>

        {/* Right column — sticky detail panel */}
        <div className="w-[400px] xl:w-[440px] shrink-0 sticky top-6">
          <Panel className="overflow-hidden">
            {selectedSource ? (
              /* Source ROI detail */
              <>
                <PanelHeader
                  title={`Source ROI: ${selectedSource.source}`}
                  subtitle="Lead performance breakdown"
                  action={
                    <button onClick={() => setSelectedSource(null)} className="flex items-center gap-1 text-[0.78rem] text-slate hover:text-ink">
                      ← Back
                    </button>
                  }
                />
                <div className="p-5 space-y-4">
                  {/* 3-col stat grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Leads", value: String(selectedSource.leads) },
                      { label: "Closed", value: String(selectedSource.closed) },
                      {
                        label: "ROI",
                        value:
                          selectedSource.spend === 0
                            ? "∞"
                            : `${Math.round(((selectedSource.revenue - selectedSource.spend) / selectedSource.spend) * 100)}%`,
                      },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-xl bg-[#f4f4f3] p-3 text-center">
                        <p className="text-[0.66rem] uppercase tracking-wider text-slate/70">{label}</p>
                        <p className="mt-1 font-display text-lg text-ink">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Large ROI number */}
                  <div className="rounded-xl bg-[#f4f4f3] p-4">
                    <p className="text-[0.7rem] uppercase tracking-wider text-slate/60 mb-1">Net Return on Spend</p>
                    <p className={cn(
                      "font-display text-4xl",
                      selectedSource.spend === 0 || ((selectedSource.revenue - selectedSource.spend) / selectedSource.spend) > 1
                        ? "text-success"
                        : "text-warn",
                    )}>
                      {selectedSource.spend === 0
                        ? "∞"
                        : `${Math.round(((selectedSource.revenue - selectedSource.spend) / selectedSource.spend) * 100)}%`}
                    </p>
                  </div>

                  {/* Revenue vs spend */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[0.78rem] text-slate">Revenue</span>
                      <span className="text-[0.84rem] font-semibold text-ink">{compactUsd(selectedSource.revenue)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[0.78rem] text-slate">Spend</span>
                      <span className="text-[0.84rem] font-semibold text-ink">{compactUsd(selectedSource.spend)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-ink/[0.06] pt-2">
                      <span className="text-[0.78rem] text-slate">Net</span>
                      <span className="text-[0.84rem] font-semibold text-success">{compactUsd(selectedSource.revenue - selectedSource.spend)}</span>
                    </div>
                  </div>

                  {/* Recent closes placeholder */}
                  <div>
                    <SectionLabel className="mb-2">Recent Closes from this Source</SectionLabel>
                    <div className="rounded-xl border border-ink/[0.08] overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-ink/[0.08] bg-[#f4f4f3]">
                            {["Agent", "Price", "Days"].map((h) => (
                              <th key={h} className="px-3 py-2 text-[0.66rem] font-semibold uppercase tracking-wider text-slate/60">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink/[0.06]">
                          {salesAgents.slice(0, 3).map((a) => (
                            <tr key={a.slug}>
                              <td className="px-3 py-2 text-[0.78rem] text-ink">{a.firstName}</td>
                              <td className="px-3 py-2 text-[0.78rem] text-slate">{compactUsd(Math.round(selectedSource.revenue / selectedSource.closed))}</td>
                              <td className="px-3 py-2 text-[0.78rem] text-slate">{19 + Math.floor(Math.random() * 10)}d</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Agent detail */
              <>
                <PanelHeader
                  title={selectedAgent ? selectedAgent.name : "Agent Detail"}
                  subtitle={selectedAgent?.title ?? "Select an agent from the table"}
                  action={
                    selectedAgent ? (
                      <button onClick={() => setSelectedAgent(null)}>
                        <X className="h-4 w-4 text-slate" />
                      </button>
                    ) : undefined
                  }
                />
                <div className="p-5">
                  <AgentDetailPanel
                    agent={selectedAgent}
                    onClose={() => setSelectedAgent(null)}
                  />
                </div>
              </>
            )}
          </Panel>
        </div>
      </div>

      {/* ── Mobile agent bottom sheet ── */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-ink/[0.08] bg-white shadow-2xl transition-transform duration-300 lg:hidden",
          mobileAgent ? "translate-y-0" : "translate-y-full",
        )}
        style={{ height: "85vh", overflowY: "auto" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-ink/20" />
        </div>
        <div className="flex items-center justify-between px-5 py-2">
          <SectionLabel>Agent Detail</SectionLabel>
          <button onClick={() => setMobileAgent(null)}>
            <X className="h-5 w-5 text-slate" />
          </button>
        </div>
        <div className="px-5 pb-10">
          <AgentDetailPanel agent={mobileAgent} onClose={() => setMobileAgent(null)} />
        </div>
      </div>

      {/* Backdrop for mobile sheet */}
      {mobileAgent && (
        <div
          className="fixed inset-0 z-40 bg-ink/30 lg:hidden"
          onClick={() => setMobileAgent(null)}
        />
      )}

      {/* Source ROI detail slide-over on mobile (when a source is selected from ROI tab) */}
      {selectedSource && (
        <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-ink/[0.08] bg-white shadow-2xl lg:hidden"
          style={{ height: "85vh", overflowY: "auto" }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-ink/20" />
          </div>
          <div className="flex items-center justify-between px-5 py-2">
            <SectionLabel>Source ROI: {selectedSource.source}</SectionLabel>
            <button onClick={() => setSelectedSource(null)}>
              <X className="h-5 w-5 text-slate" />
            </button>
          </div>
          <div className="px-5 pb-10 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Leads", value: String(selectedSource.leads) },
                { label: "Closed", value: String(selectedSource.closed) },
                {
                  label: "ROI",
                  value:
                    selectedSource.spend === 0
                      ? "∞"
                      : `${Math.round(((selectedSource.revenue - selectedSource.spend) / selectedSource.spend) * 100)}%`,
                },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-[#f4f4f3] p-3 text-center">
                  <p className="text-[0.66rem] uppercase tracking-wider text-slate/70">{label}</p>
                  <p className="mt-1 font-display text-lg text-ink">{value}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-[0.78rem] text-slate">Revenue</span><span className="text-[0.84rem] font-semibold text-ink">{compactUsd(selectedSource.revenue)}</span></div>
              <div className="flex justify-between"><span className="text-[0.78rem] text-slate">Spend</span><span className="text-[0.84rem] font-semibold text-ink">{compactUsd(selectedSource.spend)}</span></div>
              <div className="flex justify-between border-t border-ink/[0.06] pt-2"><span className="text-[0.78rem] text-slate">Net</span><span className="text-[0.84rem] font-semibold text-success">{compactUsd(selectedSource.revenue - selectedSource.spend)}</span></div>
            </div>
          </div>
        </div>
      )}
      {selectedSource && (
        <div className="fixed inset-0 z-40 bg-ink/30 lg:hidden" onClick={() => setSelectedSource(null)} />
      )}
    </div>
  );
}
