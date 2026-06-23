"use client";

import { useState } from "react";
import { Users, Building2, Route, MailPlus, ScrollText } from "lucide-react";
import { KpiStrip, KpiCard } from "@/components/os";
import { auditLogs } from "@/lib/data";
import { AdminWorkspace } from "@/components/command/admin/AdminWorkspace";
import {
  routingRules,
  teamRows,
  userRows,
  roleDefs,
  type CategoryKey,
} from "@/components/command/admin/adminData";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Admin Settings  (route: /hub/settings, §2.12)

   De-emphasized operator back office: users, teams, roles, routing rules,
   templates, brand kit, AI policies, notifications, and audit. The TopCommandBar
   (AppShell) already renders the section title — page renders a muted subtitle,
   the KPI strip, then the category settings sidebar → content workspace.

   The active category is owned HERE so each KPI tile can drill into the right
   category (S12 ticket 8 — no dead cosmetic counts).
   ────────────────────────────────────────────────────────────────────────── */

export default function AdminSettingsPage() {
  const [active, setActive] = useState<CategoryKey>("routing");

  const totalUsers = roleDefs.reduce((sum, r) => sum + r.members, 0);
  const officeCount = new Set(teamRows.map((t) => t.office)).size;
  const activeRules = routingRules.filter((r) => r.status === "active").length;
  const totalRouted = routingRules.reduce((s, r) => s + r.leadsRouted30d, 0);
  const pendingInvites = userRows.filter((u) => u.status === "invited").length;
  // "today" audit events = anything not dated to a prior day
  const auditToday = auditLogs.filter(
    (a) => !/yesterday|days ago/i.test(a.timeLabel),
  ).length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-5 md:px-6">
      {/* Eyebrow subtitle (TopCommandBar owns the H1) — design's stat-driven
          line with real counts. */}
      <p className="text-[0.8rem] text-slate">
        <span className="tabular-nums">{totalUsers}</span> members
        <span className="mx-1.5 text-mist">·</span>
        <span className="tabular-nums">{teamRows.length}</span> teams across{" "}
        <span className="tabular-nums">{officeCount}</span> offices
        <span className="mx-1.5 text-mist">·</span>
        roles, AI policies &amp; full audit trail
      </p>

      {/* KPI strip — every tile drills into its source category (S12 #8).
          5 tiles is odd → a 2-up phone grid orphans the 5th; use a scroll-snap
          rail on phone (no orphan), reverting to a 3-up grid at sm / 5-up at lg. */}
      <KpiStrip cols={5}>
        <KpiCard
          label="Users"
          value={totalUsers}
          icon={<Users className="h-4 w-4" />}
          hint="35 agents · 5 operations & leadership"
          onDrill={() => setActive("users")}
        />
        <KpiCard
          label="Teams / Offices"
          value={teamRows.length}
          icon={<Building2 className="h-4 w-4" />}
          hint="West Linn HQ · Vancouver satellite"
          onDrill={() => setActive("teams")}
        />
        <KpiCard
          label="Active rules"
          value={activeRules}
          icon={<Route className="h-4 w-4" />}
          hint={`${totalRouted.toLocaleString()} leads routed in 30 days`}
          onDrill={() => setActive("routing")}
        />
        <KpiCard
          label="Pending invites"
          value={pendingInvites}
          valueTone={pendingInvites > 0 ? "danger" : "ink"}
          icon={<MailPlus className="h-4 w-4" />}
          delta={pendingInvites > 0 ? "awaiting acceptance" : "all accepted"}
          deltaTone={pendingInvites > 0 ? "down" : "up"}
          onDrill={() => setActive("users")}
        />
        <KpiCard
          label="Audit events today"
          value={auditToday}
          icon={<ScrollText className="h-4 w-4" />}
          hint="Every admin & system change recorded"
          onDrill={() => setActive("audit")}
        />
      </KpiStrip>

      {/* Category settings sidebar → content (controlled by the KPI drilldowns) */}
      <AdminWorkspace active={active} onActiveChange={setActive} />
    </div>
  );
}
