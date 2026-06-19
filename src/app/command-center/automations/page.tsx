import { SectionLabel, LiveDot } from "@/components/command/ui";
import { automations } from "@/lib/data";
import { AutomationStudio } from "@/components/command/AutomationStudio";

export const metadata = { title: "Automations" };

export default function AutomationsPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 md:px-6 md:py-8">
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <LiveDot tone="success" />
          <SectionLabel>Pillar 4 · Automation</SectionLabel>
        </div>
        <h1 className="font-display text-3xl text-white">Automation Studio</h1>
        <p className="mt-1 max-w-2xl text-[0.9rem] text-slate-300">
          Visual, n8n-style workflows that eliminate busywork — from instant lead response to seller updates and
          review requests. Each flow shows its trigger and every step; toggle any one on or off.
        </p>
      </div>

      <AutomationStudio automations={automations} />
    </div>
  );
}
