import { BarChart3, TrendingUp, Users, Target } from "lucide-react";
import { salesAgents, metrics } from "@/lib/data";
import { compactUsd, num } from "@/lib/utils";
import { Panel, PanelHeader, StatTile, SectionLabel, LiveDot } from "@/components/command/ui";
import {
  VolumeBarsChart,
  ClosingsBarChart,
  LeadsConvertedChart,
  PipelineByStageChart,
} from "@/components/command/DashboardCharts";
import { ReportingTable } from "@/components/command/ReportingTable";

export const metadata = { title: "Reporting" };

export default function ReportingPage() {
  const ytdVolume = metrics.volumeByMonth.reduce((s, m) => s + m.volume, 0);
  const ytdClosings = metrics.volumeByMonth.reduce((s, m) => s + m.closings, 0);
  const totalLeads = metrics.leadsByMonth.reduce((s, m) => s + m.leads, 0);
  const totalConverted = metrics.leadsByMonth.reduce((s, m) => s + m.converted, 0);
  const convRate = ((totalConverted / totalLeads) * 100).toFixed(1);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 md:px-6 md:py-8">
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <LiveDot tone="azure" />
          <SectionLabel>Reporting</SectionLabel>
        </div>
        <h1 className="font-display text-3xl text-white">Reporting</h1>
        <p className="mt-1 max-w-2xl text-[0.9rem] text-slate-300">
          Real-time reporting across the brokerage — volume, closings, lead conversion, and per-agent production.
          One source of truth, exportable in a click.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Trailing volume" value={compactUsd(ytdVolume)} icon={<TrendingUp className="h-4 w-4" />} accent delta={{ value: "12.1%", dir: "up" }} />
        <StatTile label="Closings" value={num(ytdClosings)} icon={<BarChart3 className="h-4 w-4" />} hint="Last 12 months" />
        <StatTile label="Leads captured" value={num(totalLeads)} icon={<Users className="h-4 w-4" />} />
        <StatTile label="Conversion" value={`${convRate}%`} icon={<Target className="h-4 w-4" />} delta={{ value: "1.2pt", dir: "up" }} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Monthly Volume" subtitle="Closed sales volume by month" icon={<TrendingUp className="h-4 w-4" />} />
          <div className="h-64 px-3 py-4">
            <VolumeBarsChart />
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Closings by Month" subtitle="Units closed" icon={<BarChart3 className="h-4 w-4" />} />
          <div className="h-64 px-3 py-4">
            <ClosingsBarChart />
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Leads → Converted" subtitle="Capture vs conversion trend" icon={<Users className="h-4 w-4" />} />
          <div className="h-64 px-3 py-4">
            <LeadsConvertedChart />
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Pipeline by Stage" subtitle="Open value across the funnel" icon={<Target className="h-4 w-4" />} />
          <div className="h-64 px-3 py-4">
            <PipelineByStageChart />
          </div>
        </Panel>
      </div>

      <ReportingTable agents={salesAgents} />
    </div>
  );
}
