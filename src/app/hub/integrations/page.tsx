import { SectionLabel, LiveDot } from "@/components/command/ui";
import { IntegrationsGrid } from "@/components/command/IntegrationsGrid";

export const metadata = { title: "Integrations" };

export default function IntegrationsPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 md:px-6 md:py-8">
      {/* Header */}
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <LiveDot tone="success" />
          <SectionLabel>Matin Hub · Integrations</SectionLabel>
        </div>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Integrations</h1>
        <p className="mt-1 text-[0.9rem] text-slate/70">
          Connect your brokerage stack — leads, transactions, marketing, and analytics.
        </p>
        {/* Summary strip */}
        <p className="mt-2 text-[0.78rem] font-medium text-slate/50">
          9 connected &middot; 4 available
        </p>
      </div>

      {/* Grid */}
      <IntegrationsGrid />
    </div>
  );
}
