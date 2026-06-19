import { Inbox, Clock, Flame, MailQuestion } from "lucide-react";
import { leads } from "@/lib/data";
import { StatTile, SectionLabel, LiveDot } from "@/components/command/ui";
import { CrmWorkspace } from "@/components/command/crm/CrmWorkspace";

export const metadata = { title: "CRM & Leads" };

export default function CrmPage() {
  const newToday = leads.filter((l) => l.createdDaysAgo === 0).length;
  const newStage = leads.filter((l) => l.stage === "New").length;
  const needsFollowUp = leads.filter(
    (l) => l.lastContactDaysAgo >= 7 && l.stage !== "Closed" && l.stage !== "Lost",
  ).length;
  const hot = leads.filter((l) => l.score >= 80).length;
  const unread = leads.reduce((s, l) => s + l.unread, 0);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 md:px-6 md:py-8">
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <LiveDot tone="azure" />
          <SectionLabel>CRM &amp; Leads</SectionLabel>
        </div>
        <h1 className="font-display text-3xl text-white">CRM &amp; Leads</h1>
        <p className="mt-1 max-w-2xl text-[0.9rem] text-slate-300">
          Your lead inbox. Work the smart lists top to bottom, open a lead to see every call, text, and
          email in one timeline, then reply in seconds with AI.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="New leads"
          value={newStage}
          hint={newToday > 0 ? `${newToday} came in today` : "in the New list"}
          icon={<Inbox className="h-4 w-4" />}
        />
        <StatTile
          label="Needs follow-up"
          value={needsFollowUp}
          delta={{ value: "7d+ no contact", dir: "flat" }}
          icon={<Clock className="h-4 w-4" />}
          accent
        />
        <StatTile
          label="Hot leads"
          value={hot}
          delta={{ value: "score ≥ 80", dir: "flat" }}
          icon={<Flame className="h-4 w-4" />}
        />
        <StatTile
          label="Unread"
          value={unread}
          hint="waiting on a reply"
          icon={<MailQuestion className="h-4 w-4" />}
        />
      </div>

      <CrmWorkspace leads={leads} />
    </div>
  );
}
