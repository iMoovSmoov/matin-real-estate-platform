"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Users,
  Building2,
  Route,
  FileText,
  Palette,
  Sparkles,
  Bell,
  ScrollText,
  Plus,
  Pencil,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Lock,
  Send,
  Mail,
  Phone,
  MessageSquare,
} from "lucide-react";
import {
  DataTable,
  TwoLineCell,
  InitialsToken,
  StatusChip,
  Dot,
  PriorityBadge,
  CalloutCard,
  AiPanel,
  AIInsightChip,
  RecordDrawer,
  EmptyState,
  useAiSidecar,
  type Column,
  type AIAction,
} from "@/components/os";
import { auditLogs } from "@/lib/data";
import type { AuditLog } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  settingsCategories,
  routingRules,
  ruleOwnership,
  statusConfig,
  userRows,
  roleDefs,
  teamRows,
  templateRows,
  aiPolicyRows,
  type CategoryKey,
  type RoutingRule,
  type StatusConfigRow,
  type UserRow,
  type AiPolicyRow,
} from "./adminData";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Admin Settings workspace (§2.12)

   Category settings sidebar → content area. Default = Lead Routing (rules
   DataTable + Ownership/Access card + Behavioral Alerts vs Automation grid +
   New-Rule drawer). De-emphasized back office, fully functional-looking.
   Composes ONLY @/components/os primitives. Client (interactive).
   ────────────────────────────────────────────────────────────────────────── */

const CATEGORY_ICON: Record<CategoryKey, typeof Users> = {
  users: Users,
  teams: Building2,
  routing: Route,
  templates: FileText,
  brand: Palette,
  "ai-policies": Sparkles,
  notifications: Bell,
  audit: ScrollText,
};

/* Small ink-filled / ghost button helpers (human-action = ink, never gold). */
function InkButton({
  children,
  onClick,
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[0.8rem] font-semibold text-cloud transition-colors hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
    >
      {icon}
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  tone = "default",
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "default" | "danger";
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-mist bg-cloud px-2.5 py-1.5 text-[0.78rem] font-medium transition-colors hover:bg-paper",
        tone === "danger" ? "text-danger hover:border-danger/30" : "text-slate hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

/* InitialsToken cluster for rule members. */
function MemberCluster({ names }: { names: string[] }) {
  const shown = names.slice(0, 3);
  const extra = names.length - shown.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5">
        {shown.map((n) => (
          <InitialsToken key={n} name={n} className="ring-2 ring-cloud" />
        ))}
      </div>
      {extra > 0 ? (
        <span className="ml-1.5 text-[0.74rem] font-medium text-slate tabular-nums">+{extra}</span>
      ) : null}
    </div>
  );
}

/* ── Behavioral Alerts vs Automation two-column config ─────────────────────── */

function MiniToggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25",
        on ? "bg-ink" : "bg-mist",
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-0.5 h-4 w-4 rounded-full bg-cloud shadow-sm transition-transform",
          on ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function AlertsAutomationGrid() {
  const [rows, setRows] = useState<StatusConfigRow[]>(statusConfig);

  function setNotify(id: string, v: boolean) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, notify: { ...r.notify, on: v } } : r)),
    );
  }
  function setAutomate(id: string, v: boolean) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, automate: { ...r.automate, on: v } } : r)),
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
      {/* Column heads */}
      <div className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-mist bg-paper-200/60">
        <div className="px-4 py-2.5">
          <p className="eyebrow text-[0.66rem]">Status / signal</p>
        </div>
        <div className="border-l border-mist px-4 py-2.5">
          <p className="eyebrow text-[0.66rem]">What notifies a human</p>
        </div>
        <div className="border-l border-mist px-4 py-2.5">
          <p className="eyebrow text-[0.66rem]">What the system does</p>
        </div>
      </div>

      {rows.map((r, i) => (
        <div
          key={r.id}
          className={cn(
            "grid grid-cols-[1.1fr_1fr_1fr]",
            i < rows.length - 1 && "border-b border-mist/70",
          )}
        >
          {/* Status */}
          <div className="flex items-center gap-2 px-4 py-3.5">
            <Dot tone={r.statusTone} />
            <span className="text-[0.84rem] font-semibold text-ink">{r.status}</span>
          </div>

          {/* Notify */}
          <div className="flex items-center justify-between gap-3 border-l border-mist px-4 py-3.5">
            <span className="text-[0.8rem] leading-snug text-slate">{r.notify.label}</span>
            <MiniToggle
              on={r.notify.on}
              onChange={(v) => setNotify(r.id, v)}
              label={`Notify — ${r.status}`}
            />
          </div>

          {/* Automate */}
          <div className="flex items-center justify-between gap-3 border-l border-mist px-4 py-3.5">
            <span className="min-w-0 flex-1">
              <span className="block text-[0.8rem] leading-snug text-slate">{r.automate.label}</span>
              {r.automate.risk === "approval" ? (
                <StatusChip tone="warn" className="mt-1">Approval gate</StatusChip>
              ) : (
                <StatusChip tone="success" className="mt-1">Auto-safe</StatusChip>
              )}
            </span>
            <MiniToggle
              on={r.automate.on}
              onChange={(v) => setAutomate(r.id, v)}
              label={`Automate — ${r.status}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Ownership / Access card (BoldTrail record-level pattern) ──────────────── */

function OwnershipCard() {
  const o = ruleOwnership;
  const rows: { label: string; value: ReactNode }[] = [
    {
      label: "Owned by",
      value: (
        <span className="inline-flex items-center gap-2">
          <InitialsToken name={o.ownedBy} />
          <TwoLineCell title={o.ownedBy} sub={o.ownedByTitle} />
        </span>
      ),
    },
    {
      label: "Assigned to",
      value: (
        <span className="inline-flex items-center gap-2">
          <InitialsToken name={o.assignedTo} />
          <TwoLineCell title={o.assignedTo} sub={o.assignedToTitle} />
        </span>
      ),
    },
    {
      label: "Shared with",
      value: (
        <span className="flex flex-wrap items-center gap-1.5">
          {o.sharedWith.map((s) => (
            <StatusChip key={s} tone="info">{s}</StatusChip>
          ))}
        </span>
      ),
    },
    {
      label: "Access",
      value: (
        <StatusChip tone="ink">
          <Lock className="h-3 w-3" aria-hidden />
          {o.access}
        </StatusChip>
      ),
    },
  ];

  return (
    <div className="rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-slate">Ownership / Access</p>
          <h3 className="mt-1 font-display text-[1.02rem] font-normal leading-tight text-ink">
            {o.ruleName}
          </h3>
        </div>
        <GhostButton ariaLabel="Edit access">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </GhostButton>
      </div>

      <dl className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4">
            <dt className="shrink-0 text-[0.78rem] font-medium text-slate">{r.label}</dt>
            <dd className="min-w-0 text-right text-[0.84rem] text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>

      {/* Trust chips */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-mist pt-3.5">
        {o.trust.map((t) => (
          <StatusChip key={t} tone="success">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            {t}
          </StatusChip>
        ))}
      </div>

      <p className="mt-3 text-[0.72rem] text-slate">
        Last changed by <span className="font-medium text-ink">{o.lastChangedBy}</span> · {o.lastChangedAt}
        <span className="mx-1.5 text-mist">·</span>
        writes to <span className="font-mono text-[0.7rem]">audit_logs</span>
      </p>
    </div>
  );
}

/* ── New Rule drawer (recipient builder) ───────────────────────────────────── */

function NewRuleDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [recipientMode, setRecipientMode] = useState<"agents" | "office">("agents");
  const [ruleType, setRuleType] = useState<"Round Robin" | "Blast">("Round Robin");

  return (
    <RecordDrawer
      open={open}
      onClose={onClose}
      title="New routing rule"
      subtitle="Define source, criteria, and recipients"
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-mist bg-cloud px-3.5 py-2 text-[0.82rem] font-medium text-slate transition-colors hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-mist bg-cloud px-3.5 py-2 text-[0.82rem] font-medium text-slate transition-colors hover:text-ink"
          >
            Test simulated leads
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[0.82rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Create rule
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Lead source">
          <select className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-[0.86rem] text-ink focus:border-ink/30 focus:bg-cloud focus:outline-none">
            <option>MatinRealEstate.com / IDX Search</option>
            <option>Zillow / Premier Agent</option>
            <option>Cash Offer request</option>
            <option>Open House sign-in</option>
            <option>SW Washington / RMLS</option>
          </select>
        </Field>

        <Field label="Criteria" hint="All conditions must match (AND)">
          <div className="space-y-2">
            {["Area: Portland Metro", "Type: Buyer", "Price ≥ $600k"].map((c) => (
              <div
                key={c}
                className="flex items-center justify-between rounded-lg border border-mist bg-paper px-3 py-2 text-[0.82rem] text-ink"
              >
                {c}
                <button type="button" aria-label={`Remove ${c}`} className="text-slate hover:text-danger">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-slate hover:text-ink"
            >
              <Plus className="h-3.5 w-3.5" />
              Add condition
            </button>
          </div>
        </Field>

        <Field label="Distribution type">
          <div className="grid grid-cols-2 gap-2">
            {(["Round Robin", "Blast"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setRuleType(t)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-[0.82rem] font-medium transition-colors",
                  ruleType === t
                    ? "border-ink bg-ink text-cloud"
                    : "border-mist bg-paper text-ink hover:border-ink/25",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Recipients">
          <div className="mb-2 inline-flex rounded-lg border border-mist bg-paper p-0.5">
            {(["agents", "office"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setRecipientMode(m)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[0.78rem] font-medium capitalize transition-colors",
                  recipientMode === m ? "bg-ink text-cloud" : "text-slate hover:text-ink",
                )}
              >
                {m === "agents" ? "Agents" : "Office"}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            {["Ava Brooks", "Amanda Conlon", "Andy Wilcox"].map((n, i) => (
              <div
                key={n}
                className="flex items-center justify-between rounded-lg border border-mist bg-paper px-3 py-2"
              >
                <span className="flex items-center gap-2">
                  <InitialsToken name={n} />
                  <span className="text-[0.84rem] font-medium text-ink">{n}</span>
                </span>
                <span className="flex items-center gap-2 text-[0.74rem] text-slate">
                  <span className="tabular-nums">Weight {[3, 2, 1][i]}</span>
                  <span className="flex flex-col">
                    <ChevronUp className="h-3 w-3 hover:text-ink" />
                    <ChevronDown className="h-3 w-3 hover:text-ink" />
                  </span>
                </span>
              </div>
            ))}
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-slate hover:text-ink"
            >
              <Plus className="h-3.5 w-3.5" />
              Add recipient · Set weights
            </button>
          </div>
        </Field>

        <div className="rounded-xl border border-mist bg-paper px-3.5 py-3">
          <p className="font-mono text-[0.7rem] leading-relaxed text-slate">
            Automation after save · creates <span className="text-ink">routing_rule</span> → tests
            simulated leads → writes <span className="text-ink">audit_log</span> → notifies recipients
          </p>
        </div>
      </div>
    </RecordDrawer>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[0.78rem] font-semibold text-ink">{label}</span>
        {hint ? <span className="text-[0.72rem] text-slate">{hint}</span> : null}
      </label>
      {children}
    </div>
  );
}

/* ── Lead Routing view (default) ───────────────────────────────────────────── */

function RoutingView() {
  const { openAi } = useAiSidecar();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<RoutingRule | null>(routingRules[0]);

  const columns: Column<RoutingRule>[] = [
    {
      key: "source",
      header: "Source",
      width: "22%",
      render: (r) => <TwoLineCell title={r.source} sub={r.sourceMeta} />,
    },
    {
      key: "criteria",
      header: "Criteria",
      width: "26%",
      render: (r) => (
        <div className="space-y-0.5">
          {r.criteria.map((c) => (
            <p key={c} className="text-[0.78rem] leading-snug text-slate">
              {c}
            </p>
          ))}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      width: "12%",
      render: (r) => (
        <StatusChip tone={r.type === "Blast" ? "warn" : "info"}>{r.type}</StatusChip>
      ),
    },
    {
      key: "members",
      header: "Members",
      width: "14%",
      render: (r) => <MemberCluster names={r.members} />,
    },
    {
      key: "priority",
      header: "Priority",
      align: "center",
      width: "12%",
      render: (r) => (
        <div
          className="flex items-center justify-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="tabular-nums text-[0.84rem] font-semibold text-ink">{r.priority}</span>
          <span className="flex flex-col text-slate">
            <button type="button" aria-label="Move up" className="hover:text-ink disabled:opacity-30" disabled={r.priority === 1}>
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button type="button" aria-label="Move down" className="hover:text-ink disabled:opacity-30" disabled={r.priority === routingRules.length}>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "14%",
      render: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <GhostButton ariaLabel={`Edit ${r.id}`} onClick={() => setSelectedRule(r)}>
            <Pencil className="h-3.5 w-3.5" />
          </GhostButton>
          <GhostButton ariaLabel={`Clone ${r.id}`}>
            <Copy className="h-3.5 w-3.5" />
          </GhostButton>
          <GhostButton ariaLabel={`Delete ${r.id}`} tone="danger">
            <Trash2 className="h-3.5 w-3.5" />
          </GhostButton>
        </div>
      ),
    },
  ];

  const aiActions: AIAction[] = [
    {
      id: "AIA-ROUTE-1",
      title: "Resolve overlapping criteria in RR-002 / RR-004",
      riskTag: "Approval required",
      evidence:
        "Lake Oswego open-house leads match both Zillow (RR-002) and Open House (RR-004). 11 leads in 30 days were assigned twice. Suggest adding 'Source ≠ Open House' to RR-002.",
      confidence: "High",
    },
    {
      id: "AIA-ROUTE-2",
      title: "Rebalance RR-001 round-robin weights",
      riskTag: "Auto-safe",
      evidence:
        "Ava Brooks holds 47% of RR-001 volume vs 33% target. Andy Wilcox's first-response time is 2.1× the team median. Lower Ava's weight 3→2 to even distribution.",
      confidence: "Medium",
    },
  ];

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        {/* Left: rules table + ownership + alerts/automation */}
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">
                  Lead routing rules
                </h2>
                <p className="mt-0.5 text-[0.78rem] text-slate">
                  Evaluated top-to-bottom by priority. First match wins.
                </p>
              </div>
              <InkButton icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setDrawerOpen(true)}>
                New Rule
              </InkButton>
            </div>

            <DataTable<RoutingRule>
              columns={columns}
              rows={routingRules}
              getRowId={(r) => r.id}
              onRowClick={(r) => setSelectedRule(r)}
              utilityLeft={
                <span className="text-[0.78rem] text-slate">
                  6 rules · 412 leads routed in 30 days
                </span>
              }
            />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">
                  Behavioral alerts vs automation
                </h2>
                <p className="mt-0.5 text-[0.78rem] text-slate">
                  Left = what notifies a human. Right = what the system does on its own.
                </p>
              </div>
            </div>
            <AlertsAutomationGrid />
          </section>
        </div>

        {/* Right: ownership + AI panel */}
        <div className="space-y-5">
          <OwnershipCard />

          <AiPanel
            context="Admin / Lead Routing — RR-001 IDX Search"
            messages={[
              {
                role: "ai",
                text: (
                  <>
                    RR-001 is your highest-volume rule (184 leads / 30d). I checked all 6 rules for
                    overlap and weight imbalance — 2 advisories below. None auto-fire; routing changes
                    are approval-gated.
                  </>
                ),
                citations: ["routing_rules", "leads.source", "agents.responseTime"],
              },
            ]}
            actions={aiActions}
            onRunAction={(a) => openAi(`Context: Admin / Routing — apply ${a.title}`)}
            onEditAction={(a) => openAi(`Context: Admin / Routing — edit ${a.title}`)}
          >
            <div className="rounded-xl border border-ink-700 bg-ink-800 p-3.5">
              <p className="eyebrow text-slate-300/60">Message a rule will send</p>
              <p className="mt-2 text-[0.82rem] leading-relaxed text-slate-300">
                Hi <span className="text-cloud">{"{{first_name}}"}</span>, thanks for your interest in{" "}
                <span className="text-cloud">{"{{search_area}}"}</span>. I&apos;m{" "}
                <span className="text-cloud">{"{{agent_name}}"}</span> with Matin Real Estate — I&apos;ll
                send a few <span className="text-cloud">{"{{price_band}}"}</span> matches within the hour.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <AIInsightChip>Merge fields validated</AIInsightChip>
                <AIInsightChip>Brand voice · approved</AIInsightChip>
              </div>
            </div>
          </AiPanel>
        </div>
      </div>

      <NewRuleDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      {/* selectedRule reserved for inline edit — kept to drive Ownership focus */}
      <span className="sr-only">{selectedRule?.id}</span>
    </>
  );
}

/* ── Users & Roles view ────────────────────────────────────────────────────── */

function statusTone(s: UserRow["status"]) {
  return s === "active" ? "success" : s === "invited" ? "warn" : "info";
}

function UsersView() {
  const userColumns: Column<UserRow>[] = [
    {
      key: "name",
      header: "User",
      width: "26%",
      render: (u) => (
        <span className="flex items-center gap-2.5">
          <InitialsToken name={u.name} />
          <TwoLineCell title={u.name} sub={u.email} />
        </span>
      ),
    },
    { key: "role", header: "Role", width: "24%", render: (u) => <span className="text-[0.84rem] text-ink">{u.role}</span> },
    { key: "team", header: "Team", width: "14%", render: (u) => <StatusChip tone="info">{u.team}</StatusChip> },
    {
      key: "status",
      header: "Status",
      width: "14%",
      render: (u) => (
        <StatusChip tone={statusTone(u.status)}>
          <Dot tone={statusTone(u.status)} />
          {u.status === "active" ? "Active" : u.status === "invited" ? "Invited" : "Deactivated"}
        </StatusChip>
      ),
    },
    {
      key: "lastActive",
      header: "Last active",
      align: "right",
      render: (u) => <span className="text-[0.8rem] text-slate">{u.lastActive}</span>,
    },
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">Users</h2>
            <p className="mt-0.5 text-[0.78rem] text-slate">44 members · 2 pending invites · server-side authorization</p>
          </div>
          <InkButton icon={<Plus className="h-3.5 w-3.5" />}>Invite user</InkButton>
        </div>
        <DataTable<UserRow>
          columns={userColumns}
          rows={userRows}
          getRowId={(u) => u.id}
          selectable
          utilityRight={
            <span className="text-[0.78rem] text-slate">Bulk: assign role · deactivate</span>
          }
        />
      </section>

      <section>
        <h2 className="mb-3 font-display text-[1.1rem] font-normal leading-tight text-ink">Roles</h2>
        <div className="divide-y divide-mist overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
          {roleDefs.map((r) => (
            <div key={r.role} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-[0.86rem] font-semibold text-ink">{r.role}</p>
                <p className="truncate text-[0.76rem] text-slate">{r.scope}</p>
              </div>
              <span className="shrink-0 text-[0.78rem] font-medium tabular-nums text-slate">
                {r.members} {r.members === 1 ? "member" : "members"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── Teams & Offices view ──────────────────────────────────────────────────── */

function TeamsView() {
  const cols: Column<(typeof teamRows)[number]>[] = [
    { key: "name", header: "Team", render: (t) => <TwoLineCell title={t.name} sub={t.office} /> },
    {
      key: "lead",
      header: "Team lead",
      render: (t) => (
        <span className="flex items-center gap-2">
          <InitialsToken name={t.lead} />
          <span className="text-[0.84rem] text-ink">{t.lead}</span>
        </span>
      ),
    },
    { key: "markets", header: "Markets / territories", width: "34%", render: (t) => <span className="text-[0.8rem] text-slate">{t.markets}</span> },
    { key: "members", header: "Members", align: "right", render: (t) => <span className="tabular-nums text-[0.84rem] font-semibold text-ink">{t.members}</span> },
  ];
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">Teams & offices</h2>
          <p className="mt-0.5 text-[0.78rem] text-slate">Scope dropdown re-scopes every dashboard to the selected office.</p>
        </div>
        <InkButton icon={<Plus className="h-3.5 w-3.5" />}>Create team</InkButton>
      </div>
      <DataTable columns={cols} rows={teamRows} getRowId={(t) => t.id} />
    </section>
  );
}

/* ── Templates view ────────────────────────────────────────────────────────── */

function TemplatesView() {
  const cols: Column<(typeof templateRows)[number]>[] = [
    { key: "name", header: "Template", width: "32%", render: (t) => <TwoLineCell title={t.name} sub={`${t.kind} · ${t.version}`} /> },
    { key: "kind", header: "Type", render: (t) => <StatusChip tone="info">{t.kind}</StatusChip> },
    { key: "version", header: "Version", render: (t) => <span className="font-mono text-[0.78rem] text-slate">{t.version}</span> },
    {
      key: "status",
      header: "Status",
      render: (t) => (
        <StatusChip tone={t.status === "published" ? "success" : "warn"}>
          {t.status === "published" ? "Published" : "Draft"}
        </StatusChip>
      ),
    },
    { key: "updatedAt", header: "Last updated", align: "right", render: (t) => <span className="text-[0.8rem] text-slate">{t.updatedAt} · {t.updatedBy}</span> },
  ];
  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">Templates</h2>
            <p className="mt-0.5 text-[0.78rem] text-slate">Every edit version-bumps and writes an audit log.</p>
          </div>
          <InkButton icon={<Plus className="h-3.5 w-3.5" />}>New template</InkButton>
        </div>
        <DataTable columns={cols} rows={templateRows} getRowId={(t) => t.id} />
      </section>
      <CalloutCard
        tone="ai"
        title="Generate checklist template from a description"
        action={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-1.5 text-[0.8rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Draft template
          </button>
        }
      >
        Describe a workflow (e.g. &ldquo;new construction listing in Clark County&rdquo;) and AI drafts a
        versioned checklist mapped to existing DB fields. Output is held as a draft for broker review —
        nothing publishes without approval.
      </CalloutCard>
    </div>
  );
}

/* ── Brand Kit view ────────────────────────────────────────────────────────── */

function BrandKitView() {
  const swatches: { name: string; hex: string; cls: string }[] = [
    { name: "Ink", hex: "#060606", cls: "bg-ink" },
    { name: "Paper", hex: "#F6F6F5", cls: "bg-paper" },
    { name: "Success", hex: "#56A07D", cls: "bg-success" },
    { name: "Warn", hex: "#C1934A", cls: "bg-warn" },
    { name: "Danger", hex: "#C0584A", cls: "bg-danger" },
  ];
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
        <p className="eyebrow text-slate">Identity</p>
        <h2 className="mt-1 font-display text-[1.1rem] font-normal text-ink">Matin Real Estate</h2>
        <p className="mt-0.5 text-[0.8rem] text-slate">Portland &amp; SW Washington&apos;s most advanced brokerage.</p>
        <dl className="mt-4 space-y-2.5 text-[0.84rem]">
          {[
            ["Display font", "Fraunces"],
            ["Body / numbers", "Inter (tabular)"],
            ["Brand voice", "Confident · precise · no hype"],
            ["Reply-to", "info@matinrealestate.com"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-slate">{k}</dt>
              <dd className="font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <GhostButton ariaLabel="Edit brand kit">
          <Pencil className="h-3.5 w-3.5" />
          Edit brand kit
        </GhostButton>
      </div>

      <div className="rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
        <p className="eyebrow text-slate">Palette</p>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {swatches.map((s) => (
            <div key={s.name} className="text-center">
              <span className={cn("block h-12 w-full rounded-lg ring-1 ring-inset ring-mist", s.cls)} />
              <p className="mt-1.5 text-[0.72rem] font-medium text-ink">{s.name}</p>
              <p className="font-mono text-[0.64rem] text-slate">{s.hex}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[0.74rem] text-slate">
          Used in every generated marketing asset and email. Changes propagate to the Marketing Studio
          template library.
        </p>
      </div>
    </div>
  );
}

/* ── AI Policies view ──────────────────────────────────────────────────────── */

function AiPolicyView() {
  const cols: Column<AiPolicyRow>[] = [
    { key: "capability", header: "Capability", width: "28%", render: (p) => <TwoLineCell title={p.capability} sub={p.scope} /> },
    {
      key: "risk",
      header: "Risk",
      render: (p) => <PriorityBadge level={p.risk} />,
    },
    {
      key: "mode",
      header: "Policy",
      align: "right",
      render: (p) => (
        <StatusChip
          tone={p.mode === "Off" ? "info" : p.mode === "Auto-safe" ? "success" : "warn"}
          variant={p.mode === "Off" ? "soft" : "soft"}
        >
          {p.mode}
        </StatusChip>
      ),
    },
  ];
  return (
    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <section className="space-y-3">
        <div>
          <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">AI approval policies</h2>
          <p className="mt-0.5 text-[0.78rem] text-slate">
            Client-facing, legal, and outbound capabilities require human approval — not toggled off in the UI, enforced server-side.
          </p>
        </div>
        <DataTable columns={cols} rows={aiPolicyRows} getRowId={(p) => p.id} />
      </section>
      <CalloutCard tone="risk" title="Risky policy flagged">
        Turning <span className="text-cloud">Automated outbound send</span> from{" "}
        <span className="text-cloud">Off</span> to <span className="text-cloud">Auto-safe</span> would let
        AI send client messages with no human in the loop — a compliance and chargeback risk. This change
        requires owner sign-off and writes to <span className="font-mono text-[0.72rem]">audit_logs</span>.
      </CalloutCard>
    </div>
  );
}

/* ── Notifications view (reuses the alerts/automation grid) ────────────────── */

function NotificationsView() {
  const channels = [
    { icon: Mail, label: "Email" },
    { icon: MessageSquare, label: "SMS" },
    { icon: Bell, label: "Push" },
    { icon: Phone, label: "Call escalation" },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">
          Notification &amp; automation rules
        </h2>
        <p className="mt-0.5 text-[0.78rem] text-slate">
          Per-status: what notifies a human vs what the system handles automatically.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {channels.map((c) => (
          <span
            key={c.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-mist bg-cloud px-3 py-1.5 text-[0.78rem] font-medium text-slate"
          >
            <c.icon className="h-3.5 w-3.5" />
            {c.label}
          </span>
        ))}
      </div>
      <AlertsAutomationGrid />
    </div>
  );
}

/* ── Audit Log view ────────────────────────────────────────────────────────── */

function AuditView() {
  const isSystem = (actor: string) => actor === "System";
  const cols: Column<AuditLog>[] = [
    {
      key: "actor",
      header: "Actor",
      width: "18%",
      render: (a) =>
        isSystem(a.actor) ? (
          <span className="inline-flex items-center gap-2 text-[0.84rem] font-medium text-slate">
            <Dot tone="info" />
            System
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <InitialsToken name={a.actor} />
            <span className="text-[0.84rem] font-medium text-ink">{a.actor}</span>
          </span>
        ),
    },
    { key: "action", header: "Action", width: "24%", render: (a) => <span className="text-[0.84rem] text-ink">{a.action}</span> },
    { key: "target", header: "Target", render: (a) => <span className="text-[0.8rem] text-slate">{a.target}</span> },
    { key: "timeLabel", header: "Time", align: "right", render: (a) => <span className="text-[0.8rem] text-slate">{a.timeLabel}</span> },
  ];
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">Audit log</h2>
          <p className="mt-0.5 text-[0.78rem] text-slate">
            Every admin and system change is recorded · immutable · exportable for compliance.
          </p>
        </div>
        <GhostButton ariaLabel="Export audit log">
          <Send className="h-3.5 w-3.5" />
          Export
        </GhostButton>
      </div>
      <DataTable
        columns={cols}
        rows={auditLogs}
        getRowId={(a) => a.id}
        emptyState={
          <EmptyState
            title="No audit events"
            body="Admin and system changes will appear here as they happen."
          />
        }
      />
    </section>
  );
}

/* ── Workspace shell: category sidebar + content ───────────────────────────── */

export function AdminWorkspace() {
  const [active, setActive] = useState<CategoryKey>("routing");

  const content = useMemo(() => {
    switch (active) {
      case "users":
        return <UsersView />;
      case "teams":
        return <TeamsView />;
      case "routing":
        return <RoutingView />;
      case "templates":
        return <TemplatesView />;
      case "brand":
        return <BrandKitView />;
      case "ai-policies":
        return <AiPolicyView />;
      case "notifications":
        return <NotificationsView />;
      case "audit":
        return <AuditView />;
      default:
        return <RoutingView />;
    }
  }, [active]);

  return (
    <div className="grid gap-6 lg:grid-cols-[224px_1fr]">
      {/* Category settings sidebar */}
      <nav aria-label="Settings categories" className="lg:sticky lg:top-4 lg:self-start">
        <p className="eyebrow mb-2 px-2 text-slate">Settings</p>
        <ul className="space-y-0.5">
          {settingsCategories.map((c) => {
            const Icon = CATEGORY_ICON[c.key];
            const isActive = c.key === active;
            return (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={() => setActive(c.key)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                    isActive ? "bg-ink text-cloud" : "text-slate hover:bg-paper-200 hover:text-ink",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.84rem] font-medium">{c.label}</span>
                    <span
                      className={cn(
                        "block truncate text-[0.7rem]",
                        isActive ? "text-slate-300" : "text-slate/70",
                      )}
                    >
                      {c.desc}
                    </span>
                  </span>
                  {c.count != null ? (
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[0.66rem] font-semibold tabular-nums",
                        isActive ? "bg-cloud/15 text-cloud" : "bg-paper-200 text-slate",
                      )}
                    >
                      {c.count}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 rounded-lg border border-mist bg-cloud p-3">
          <p className="flex items-center gap-1.5 text-[0.72rem] font-medium text-ink">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            Compliance mode on
          </p>
          <p className="mt-1 text-[0.7rem] leading-snug text-slate">
            Dangerous changes require a confirm dialog and audit note.
          </p>
        </div>
      </nav>

      {/* Content area */}
      <div className="min-w-0">{content}</div>
    </div>
  );
}
