import { Users, Flame, Gauge, MailQuestion } from "lucide-react";
import { leads } from "@/lib/data";
import { StatTile, SectionLabel, LiveDot } from "@/components/command/ui";
import { CrmWorkspace } from "@/components/command/crm/CrmWorkspace";

export const metadata = { title: "CRM & Leads" };

export default function CrmPage() {
  const total = leads.length;
  const hot = leads.filter((l) => l.score >= 80).length;
  const unread = leads.reduce((s, l) => s + l.unread, 0);
  const avgScore = Math.round(leads.reduce((s, l) => s + l.score, 0) / total);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 md:px-6 md:py-8">
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <LiveDot tone="azure" />
          <SectionLabel>Pillar 1 · Structured Data Systems</SectionLabel>
        </div>
        <h1 className="font-display text-3xl text-white">CRM &amp; Leads</h1>
        <p className="mt-1 max-w-2xl text-[0.9rem] text-slate-300">
          Every lead in one structured database — scored, stage-tracked, and assigned. Open any lead to draft a
          personalized AI reply in seconds. This is the spreadsheet-to-system upgrade, with Claude built in.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Total leads" value={total} icon={<Users className="h-4 w-4" />} hint="In the active database" />
        <StatTile label="Hot leads" value={hot} delta={{ value: "score ≥ 80", dir: "flat" }} icon={<Flame className="h-4 w-4" />} accent />
        <StatTile label="Avg score" value={avgScore} icon={<Gauge className="h-4 w-4" />} hint="Across all stages" />
        <StatTile label="Unread" value={unread} delta={{ value: "needs reply", dir: "flat" }} icon={<MailQuestion className="h-4 w-4" />} />
      </div>

      <CrmWorkspace leads={leads} />
    </div>
  );
}
