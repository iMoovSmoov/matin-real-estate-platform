import { Inbox, Clock, Flame, MailQuestion } from "lucide-react";
import { leads } from "@/lib/data";
import { LiveDot } from "@/components/command/ui";
import { CrmWorkspace } from "@/components/command/crm/CrmWorkspace";
import { cn } from "@/lib/utils";

export const metadata = { title: "CRM & Leads" };

export default function CrmPage() {
  const newToday = leads.filter((l) => l.createdDaysAgo === 0).length;
  const newStage = leads.filter((l) => l.stage === "New").length;
  const needsFollowUp = leads.filter(
    (l) => l.lastContactDaysAgo >= 7 && l.stage !== "Closed" && l.stage !== "Lost",
  ).length;
  const hot = leads.filter((l) => l.score >= 80).length;
  const unread = leads.reduce((s, l) => s + l.unread, 0);

  const stats = [
    {
      label: "New leads",
      value: newStage,
      hint: newToday > 0 ? `${newToday} today` : undefined,
      icon: Inbox,
      badgeClass: "bg-azure/10 text-azure",
    },
    {
      label: "Follow-up",
      value: needsFollowUp,
      hint: "7d+ no contact",
      icon: Clock,
      badgeClass: needsFollowUp > 0 ? "bg-warn/10 text-warn" : "bg-ink/[0.06] text-slate",
    },
    {
      label: "Hot",
      value: hot,
      hint: "score ≥ 80",
      icon: Flame,
      badgeClass: "bg-success/10 text-success",
    },
    {
      label: "Unread",
      value: unread,
      hint: "awaiting reply",
      icon: MailQuestion,
      badgeClass: unread > 0 ? "bg-ink text-white" : "bg-ink/[0.06] text-slate",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* ── Compact inline header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-ink/[0.06]">
        <div className="flex items-center gap-2">
          <LiveDot tone="azure" />
          <h1 className="font-display text-[1.05rem] font-semibold text-ink">CRM &amp; Leads</h1>
        </div>
      </div>

      {/* ── Compact stat strip ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 px-4 py-2 border-b border-ink/[0.06]">
        {stats.map(({ label, value, hint, icon: Icon, badgeClass }) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-lg border border-ink/[0.06] bg-white px-3 py-1.5"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon className="h-3.5 w-3.5 shrink-0 text-slate/50" />
              <span className="text-[0.75rem] font-medium text-slate truncate">{label}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {hint && (
                <span className="hidden lg:inline text-[0.66rem] text-slate/45 tabular-nums">{hint}</span>
              )}
              <span className={cn("rounded-md px-1.5 py-0.5 text-[0.72rem] font-bold tabular-nums", badgeClass)}>
                {value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Lead workspace ───────────────────────────────────────────────────── */}
      <div className="px-4 py-2">
        <CrmWorkspace leads={leads} />
      </div>
    </div>
  );
}
