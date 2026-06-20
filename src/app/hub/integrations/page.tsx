import { LiveDot } from "@/components/command/ui";
import { IntegrationsGrid } from "@/components/command/IntegrationsGrid";

export const metadata = { title: "Integrations" };

export default function IntegrationsPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-4 px-4 pt-3 md:px-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink/[0.06] pb-3">
        <h1 className="font-display text-[1.05rem] font-semibold text-ink">Integrations</h1>
        <LiveDot tone="success" />
      </div>

      {/* Grid (includes stat tiles, filter pills, and slide-over) */}
      <IntegrationsGrid />
    </div>
  );
}
