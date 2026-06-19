import { Plug, Check, Database } from "lucide-react";
import { integrations } from "@/lib/data";
import { num } from "@/lib/utils";
import { StatTile, SectionLabel, LiveDot } from "@/components/command/ui";
import { IntegrationsGrid } from "@/components/command/IntegrationsGrid";

export const metadata = { title: "Integrations" };

export default function IntegrationsPage() {
  const connected = integrations.filter((i) => i.status === "connected").length;
  const totalRecords = integrations.reduce((s, i) => s + (i.records ?? 0), 0);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 md:px-6 md:py-8">
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <LiveDot tone="success" />
          <SectionLabel>Operations · Integration Layer</SectionLabel>
        </div>
        <h1 className="font-display text-3xl text-white">Integrations</h1>
        <p className="mt-1 max-w-2xl text-[0.9rem] text-slate-300">
          The connective tissue of the stack — CRM, MLS, e-signature, SMS/voice, accounting, and AI, all syncing
          into one source of truth. {connected} of {integrations.length} connectors are live.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Connected" value={`${connected}/${integrations.length}`} icon={<Check className="h-4 w-4" />} accent />
        <StatTile label="Records synced" value={num(totalRecords)} icon={<Database className="h-4 w-4" />} hint="Across all systems" />
        <StatTile label="Categories" value={new Set(integrations.map((i) => i.category)).size} icon={<Plug className="h-4 w-4" />} />
        <StatTile label="Sync health" value="100%" delta={{ value: "all green", dir: "up" }} icon={<LiveDot tone="success" />} />
      </div>

      <IntegrationsGrid integrations={integrations} />
    </div>
  );
}
