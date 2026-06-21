import { Users, Building2, Route, MailPlus, ScrollText } from "lucide-react";
import { KpiStrip, KpiCard } from "@/components/os";
import { agents, auditLogs } from "@/lib/data";
import { AdminWorkspace } from "@/components/command/admin/AdminWorkspace";
import {
  routingRules,
  teamRows,
  userRows,
} from "@/components/command/admin/adminData";

export const metadata = { title: "Admin" };

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Admin Settings  (route: /hub/settings, §2.12)

   De-emphasized operator back office: users, teams, roles, routing rules,
   templates, brand kit, AI policies, notifications, and audit. The TopCommandBar
   (AppShell) already renders the section title — page renders a muted subtitle,
   the KPI strip, then the category settings sidebar → content workspace.
   ────────────────────────────────────────────────────────────────────────── */

export default function AdminSettingsPage() {
  const activeRules = routingRules.filter((r) => r.status === "active").length;
  const pendingInvites = userRows.filter((u) => u.status === "invited").length;
  // "today" audit events = anything not dated to a prior day
  const auditToday = auditLogs.filter(
    (a) => !/yesterday|days ago/i.test(a.timeLabel),
  ).length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-5 md:px-6">
      {/* Eyebrow subtitle (TopCommandBar owns the H1) */}
      <p className="text-[0.8rem] text-slate">
        Users, teams, roles, routing rules, templates, brand kit, AI policies, and audit — the
        operator back office.
      </p>

      {/* KPI strip */}
      <KpiStrip className="xl:grid-cols-5">
        <KpiCard
          label="Users"
          value={agents.length}
          icon={<Users className="h-4 w-4" />}
          hint="38 agents · 6 operations & leadership"
        />
        <KpiCard
          label="Teams / Offices"
          value={teamRows.length}
          icon={<Building2 className="h-4 w-4" />}
          hint="West Linn HQ · Vancouver satellite"
        />
        <KpiCard
          label="Active rules"
          value={activeRules}
          icon={<Route className="h-4 w-4" />}
          hint="412 leads routed in 30 days"
        />
        <KpiCard
          label="Pending invites"
          value={pendingInvites}
          valueTone={pendingInvites > 0 ? "danger" : "ink"}
          icon={<MailPlus className="h-4 w-4" />}
          delta={pendingInvites > 0 ? "awaiting acceptance" : "all accepted"}
          deltaTone={pendingInvites > 0 ? "down" : "up"}
        />
        <KpiCard
          label="Audit events today"
          value={auditToday}
          icon={<ScrollText className="h-4 w-4" />}
          hint="Every admin & system change recorded"
        />
      </KpiStrip>

      {/* Category settings sidebar → content */}
      <AdminWorkspace />
    </div>
  );
}
