"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Plus,
  Pencil,
  Send,
  Mail,
  MessageSquare,
  Bell,
  Phone,
  CircleCheck,
} from "lucide-react";
import {
  DataTable,
  TwoLineCell,
  StatusChip,
  Dot,
  PriorityBadge,
  CalloutCard,
  RecordDrawer,
  ActivityTimeline,
  EmptyState,
  Avatar,
  SavedViewTabs,
  type Column,
} from "@/components/os";
import { MatinMark } from "@/components/brand/Logo";
import { auditLogs } from "@/lib/data";
import type { AuditLog } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  userRows as seedUsers,
  roleDefs,
  teamRows as seedTeams,
  templateRows as seedTemplates,
  aiPolicyRows,
  type UserRow,
  type AiPolicyRow,
} from "./adminData";
import {
  InkButton,
  GhostButton,
  Field,
  TextInput,
  SelectInput,
  slugForName,
  useInlineAi,
} from "./adminUi";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Admin · the remaining category views (Users, Teams, Templates,
   Brand Kit, AI Policies, Notifications, Audit). Every row opens a real
   RecordDrawer; every "+ New" appends to local state; AI helpers stream INLINE.
   ────────────────────────────────────────────────────────────────────────── */

function userStatusTone(s: UserRow["status"]) {
  return s === "active" ? "success" : s === "invited" ? "warn" : "info";
}
function userStatusLabel(s: UserRow["status"]) {
  return s === "active" ? "Active" : s === "invited" ? "Invited" : "Deactivated";
}

/* ── Users & Roles ─────────────────────────────────────────────────────────── */

const USER_VIEWS = [
  { key: "all", label: "All", count: undefined as number | undefined },
  { key: "active", label: "Active" },
  { key: "invited", label: "Pending invites" },
  { key: "leadership", label: "Leadership" },
];

export function UsersView() {
  const [users, setUsers] = useState<UserRow[]>(seedUsers);
  const [view, setView] = useState("all");
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ name: "", email: "", role: "Agent — Licensed Broker", team: "Oregon" });

  const filtered = useMemo(() => {
    if (view === "active") return users.filter((u) => u.status === "active");
    if (view === "invited") return users.filter((u) => u.status === "invited");
    if (view === "leadership") return users.filter((u) => u.team === "Leadership");
    return users;
  }, [users, view]);

  const counts = {
    all: users.length,
    active: users.filter((u) => u.status === "active").length,
    invited: users.filter((u) => u.status === "invited").length,
    leadership: users.filter((u) => u.team === "Leadership").length,
  };

  function submitInvite() {
    if (!invite.name.trim()) return;
    const id = `U-${String(users.length + 1).padStart(3, "0")}`;
    const email = invite.email.trim() || `${invite.name.split(" ")[0].toLowerCase()}@matinrealestate.com`;
    setUsers((prev) => [
      ...prev,
      { id, name: invite.name.trim(), email, role: invite.role, team: invite.team, status: "invited", lastActive: "Invite sent just now" },
    ]);
    setInviteOpen(false);
    setInvite({ name: "", email: "", role: "Agent — Licensed Broker", team: "Oregon" });
  }

  function deactivate(id: string) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: "deactivated", lastActive: "Deactivated just now" } : u)));
    setSelected(null);
  }
  function resend(id: string) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, lastActive: "Invite re-sent just now" } : u)));
    setSelected((s) => (s && s.id === id ? { ...s, lastActive: "Invite re-sent just now" } : s));
  }

  const columns: Column<UserRow>[] = [
    {
      key: "name",
      header: "User",
      width: "30%",
      render: (u) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={u.name} slug={slugForName(u.name)} size={32} ring />
          <TwoLineCell title={u.name} sub={u.email} />
        </span>
      ),
    },
    { key: "role", header: "Role", width: "26%", render: (u) => <span className="text-[0.84rem] text-ink">{u.role}</span> },
    { key: "team", header: "Team", width: "14%", render: (u) => <StatusChip tone="info">{u.team}</StatusChip> },
    {
      key: "status",
      header: "Status",
      width: "14%",
      render: (u) => (
        <StatusChip tone={userStatusTone(u.status)}>
          <Dot tone={userStatusTone(u.status)} />
          {userStatusLabel(u.status)}
        </StatusChip>
      ),
    },
    { key: "lastActive", header: "Last active", align: "right", render: (u) => <span className="text-[0.8rem] text-slate">{u.lastActive}</span> },
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">Users</h2>
            <p className="mt-0.5 text-[0.78rem] text-slate">
              43 members · {counts.invited} pending invites · recently active shown · server-side authorization
            </p>
          </div>
          <InkButton icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setInviteOpen(true)}>
            Invite user
          </InkButton>
        </div>

        <SavedViewTabs
          views={USER_VIEWS.map((v) => ({ ...v, count: counts[v.key as keyof typeof counts] }))}
          active={view}
          onChange={setView}
        />

        <DataTable<UserRow>
          columns={columns}
          rows={filtered}
          getRowId={(u) => u.id}
          selectable
          onRowClick={(u) => setSelected(u)}
          utilityRight={<span className="text-[0.78rem] text-slate">Bulk: assign role · deactivate</span>}
          emptyState={
            <EmptyState
              title="No users in this view"
              body="Invite a broker or operations teammate to populate this list."
              actionLabel="Invite user"
              onAction={() => setInviteOpen(true)}
            />
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

      {/* User detail drawer */}
      <RecordDrawer
        open={selected != null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected?.role}
        actions={
          selected ? (
            <>
              {selected.status === "invited" ? (
                <GhostButton onClick={() => resend(selected.id)}>
                  <Send className="h-3.5 w-3.5" />
                  Resend invite
                </GhostButton>
              ) : null}
              {selected.status !== "deactivated" ? (
                <GhostButton tone="danger" className="ml-auto" onClick={() => deactivate(selected.id)}>
                  Deactivate
                </GhostButton>
              ) : (
                <span className="ml-auto text-[0.78rem] text-slate">Deactivated</span>
              )}
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={selected.name} slug={slugForName(selected.name)} size={56} ring />
              <div>
                <p className="font-display text-[1.05rem] text-ink">{selected.name}</p>
                <p className="text-[0.8rem] text-slate">{selected.email}</p>
                <StatusChip tone={userStatusTone(selected.status)} className="mt-1">
                  <Dot tone={userStatusTone(selected.status)} />
                  {userStatusLabel(selected.status)}
                </StatusChip>
              </div>
            </div>

            <dl className="space-y-2.5 rounded-xl border border-mist bg-paper p-4 text-[0.84rem]">
              {[
                ["User ID", selected.id],
                ["Role", selected.role],
                ["Team", selected.team],
                ["Last active", selected.lastActive],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-slate">{k}</dt>
                  <dd className="text-right font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>

            <div>
              <p className="eyebrow mb-2 text-slate">Recent activity</p>
              <ActivityTimeline
                items={[
                  { id: "a1", channel: "system", name: "Role assigned", tag: selected.role, tagTone: "gold", meta: "by Jordan Matin", timeLabel: "3 hr ago" },
                  { id: "a2", channel: "note", name: "Profile updated", meta: "phone & territory", timeLabel: "2 days ago" },
                  { id: "a3", channel: "system", name: "Signed in", meta: "Portland, OR · Chrome", timeLabel: "today" },
                ]}
              />
            </div>
          </div>
        ) : null}
      </RecordDrawer>

      {/* Invite drawer */}
      <RecordDrawer
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite user"
        subtitle="Sends an invite email · role enforced server-side"
        actions={
          <>
            <button type="button" onClick={() => setInviteOpen(false)} className="rounded-lg border border-mist bg-cloud px-3.5 py-2 text-[0.82rem] font-medium text-slate hover:text-ink">
              Cancel
            </button>
            <InkButton className="ml-auto" icon={<Send className="h-3.5 w-3.5" />} onClick={submitInvite}>
              Send invite
            </InkButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Full name">
            <TextInput value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} placeholder="Taylor Reed" autoFocus />
          </Field>
          <Field label="Email" hint="defaults to @matinrealestate.com">
            <TextInput value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder="taylor@matinrealestate.com" />
          </Field>
          <Field label="Role">
            <SelectInput value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}>
              {["Owner · Principal Broker", "Managing Principal Broker", "Agent — Licensed Broker", "Listing Coordinator", "Transaction Coordinator", "Marketing Director"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Team">
            <SelectInput value={invite.team} onChange={(e) => setInvite({ ...invite, team: e.target.value })}>
              {["Oregon", "Washington", "Operations", "Leadership"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </SelectInput>
          </Field>
          <div className="rounded-xl border border-mist bg-paper px-3.5 py-3">
            <p className="font-mono text-[0.7rem] leading-relaxed text-slate">
              On send · create <span className="text-ink">user (invited)</span> → email invite → write{" "}
              <span className="text-ink">audit_log</span>
            </p>
          </div>
        </div>
      </RecordDrawer>
    </div>
  );
}

/* ── Teams & Offices ───────────────────────────────────────────────────────── */

type TeamRow = (typeof seedTeams)[number];

export function TeamsView() {
  const [teams, setTeams] = useState<TeamRow[]>(seedTeams);
  const [selected, setSelected] = useState<TeamRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", office: "West Linn HQ", lead: "Alicia Smith", markets: "" });

  function submit() {
    if (!draft.name.trim()) return;
    const id = `T-${String(teams.length + 1).padStart(3, "0")}`;
    setTeams((prev) => [...prev, { id, name: draft.name.trim(), office: draft.office, lead: draft.lead, members: 0, markets: draft.markets || "—" }]);
    setCreateOpen(false);
    setDraft({ name: "", office: "West Linn HQ", lead: "Alicia Smith", markets: "" });
  }

  const cols: Column<TeamRow>[] = [
    { key: "name", header: "Team", render: (t) => <TwoLineCell title={t.name} sub={t.office} /> },
    {
      key: "lead",
      header: "Team lead",
      render: (t) => (
        <span className="flex items-center gap-2">
          <Avatar name={t.lead} slug={slugForName(t.lead)} size={26} ring />
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
          <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">Teams &amp; offices</h2>
          <p className="mt-0.5 text-[0.78rem] text-slate">Click a team to view it · scope re-scopes every dashboard to the selected office.</p>
        </div>
        <InkButton icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreateOpen(true)}>
          Create team
        </InkButton>
      </div>
      <DataTable columns={cols} rows={teams} getRowId={(t) => t.id} onRowClick={(t) => setSelected(t)} />

      <RecordDrawer
        open={selected != null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected?.office}
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-mist bg-paper p-4">
              <Avatar name={selected.lead} slug={slugForName(selected.lead)} size={44} ring />
              <div>
                <p className="text-[0.74rem] text-slate">Team lead</p>
                <p className="font-semibold text-ink">{selected.lead}</p>
              </div>
              <span className="ml-auto text-right">
                <p className="text-[1.6rem] font-bold tabular-nums leading-none text-ink">{selected.members}</p>
                <p className="text-[0.72rem] text-slate">members</p>
              </span>
            </div>
            <dl className="space-y-2.5 text-[0.84rem]">
              {[
                ["Office", selected.office],
                ["Markets", selected.markets],
                ["Team ID", selected.id],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-slate">{k}</dt>
                  <dd className="text-right font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <CalloutCard tone="system" title="Scope behavior">
              Selecting <span className="text-cloud">{selected.name}</span> as the active scope filters
              CRM, Reports, Transactions, and the Today queue to this office&apos;s records only.
            </CalloutCard>
          </div>
        ) : null}
      </RecordDrawer>

      <RecordDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create team"
        subtitle="A team scopes records and dashboards"
        actions={
          <>
            <button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg border border-mist bg-cloud px-3.5 py-2 text-[0.82rem] font-medium text-slate hover:text-ink">
              Cancel
            </button>
            <InkButton className="ml-auto" icon={<Plus className="h-3.5 w-3.5" />} onClick={submit}>
              Create team
            </InkButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Team name">
            <TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Salem Expansion" autoFocus />
          </Field>
          <Field label="Office">
            <SelectInput value={draft.office} onChange={(e) => setDraft({ ...draft, office: e.target.value })}>
              {["West Linn HQ", "Vancouver Satellite"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Team lead">
            <SelectInput value={draft.lead} onChange={(e) => setDraft({ ...draft, lead: e.target.value })}>
              {["Alicia Smith", "Amy Mead", "Sierra Seggerman", "Jordan Matin"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Markets / territories">
            <TextInput value={draft.markets} onChange={(e) => setDraft({ ...draft, markets: e.target.value })} placeholder="Salem, Keizer, Marion County" />
          </Field>
        </div>
      </RecordDrawer>
    </section>
  );
}

/* ── Templates ─────────────────────────────────────────────────────────────── */

type TemplateRow = (typeof seedTemplates)[number];

export function TemplatesView() {
  const [templates, setTemplates] = useState<TemplateRow[]>(seedTemplates);
  const [selected, setSelected] = useState<TemplateRow | null>(null);
  const draftAi = useInlineAi();
  const [describe, setDescribe] = useState("");

  function publishToggle(id: string) {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === "published" ? "draft" : "published", updatedAt: "just now", updatedBy: "You" } : t)),
    );
    setSelected((s) => (s && s.id === id ? { ...s, status: s.status === "published" ? "draft" : "published" } : s));
  }

  function runDraft() {
    void draftAi.run({
      tool: "general",
      messages: [
        {
          role: "user",
          content: `Draft a versioned MatinOS checklist template for this workflow: "${describe || "new construction listing in Clark County, WA"}". Output a numbered checklist of 6-9 concrete steps mapped to DB fields where obvious (e.g. disclosures, photos, MLS draft, broker approval). Plain text, no preamble. End with one line noting it is held as a draft for broker review.`,
        },
      ],
    });
  }

  function saveDraft() {
    const id = `TPL-${String(templates.length + 1).padStart(3, "0")}`;
    setTemplates((prev) => [
      ...prev,
      { id, name: describe.trim() ? `${describe.trim().slice(0, 40)} checklist` : "AI-drafted checklist", kind: "Checklist", version: "v1.0", updatedBy: "Matin AI → You", updatedAt: "just now", status: "draft" },
    ]);
    draftAi.reset();
    setDescribe("");
  }

  const cols: Column<TemplateRow>[] = [
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
            <p className="mt-0.5 text-[0.78rem] text-slate">Click a template to preview · every edit version-bumps and writes an audit log.</p>
          </div>
          <InkButton icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setSelected(null)}>
            New template
          </InkButton>
        </div>
        <DataTable columns={cols} rows={templates} getRowId={(t) => t.id} onRowClick={(t) => setSelected(t)} />
      </section>

      {/* AI checklist drafter — streams INLINE in this dark card, not the sidecar */}
      <div className="rounded-2xl border border-ink-700 bg-ink-800 p-5 text-slate-300 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 ring-1 ring-inset ring-gold/30">
            <MatinMark theme="white" className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[1.02rem] font-normal leading-tight text-cloud">
              Generate a checklist template from a description
            </h3>
            <p className="mt-1 text-[0.82rem] text-slate-300">
              Describe a workflow and Matin AI drafts a versioned checklist mapped to DB fields — held as a draft for broker review.
            </p>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={describe}
                onChange={(e) => setDescribe(e.target.value)}
                placeholder="new construction listing in Clark County"
                className="flex-1 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-[0.84rem] text-cloud placeholder:text-slate-300/40 focus:border-gold/40 focus:outline-none"
              />
              <button
                type="button"
                onClick={runDraft}
                disabled={draftAi.state.running}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-[0.8rem] font-semibold text-ink transition-colors hover:bg-gold-bright disabled:bg-gold/70"
              >
                {draftAi.state.running ? "Drafting…" : draftAi.state.done ? "Regenerate" : "Draft template"}
              </button>
            </div>

            {draftAi.state.running && !draftAi.state.result ? (
              <p className="mt-3 flex items-center gap-2 text-[0.78rem] text-slate-300/80">
                <MatinMark theme="white" className="h-3.5 w-3.5" />
                Matin AI is drafting<span className="animate-pulse">…</span>
              </p>
            ) : null}

            {draftAi.state.result ? (
              <div className="mt-3 whitespace-pre-wrap rounded-xl border border-ink-700 bg-ink-900 p-3.5 text-[0.82rem] leading-relaxed text-slate-300">
                {draftAi.state.result}
              </div>
            ) : null}

            {draftAi.state.done && !draftAi.state.error ? (
              <div className="mt-3 flex items-center justify-end gap-2">
                <button type="button" onClick={draftAi.reset} className="rounded-lg px-3 py-1.5 text-[0.78rem] font-medium text-slate-300 hover:text-cloud">
                  Discard
                </button>
                <button type="button" onClick={saveDraft} className="inline-flex items-center gap-1.5 rounded-lg bg-cloud px-3 py-1.5 text-[0.78rem] font-semibold text-ink hover:bg-cloud/90">
                  <CircleCheck className="h-3.5 w-3.5" />
                  Save as draft template
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Template preview drawer */}
      <RecordDrawer
        open={selected != null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected ? `${selected.kind} · ${selected.version}` : undefined}
        actions={
          selected ? (
            <>
              <GhostButton>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </GhostButton>
              <InkButton className="ml-auto" onClick={() => publishToggle(selected.id)}>
                {selected.status === "published" ? "Unpublish" : "Publish"}
              </InkButton>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusChip tone={selected.status === "published" ? "success" : "warn"}>
                {selected.status === "published" ? "Published" : "Draft"}
              </StatusChip>
              <span className="font-mono text-[0.78rem] text-slate">{selected.id}</span>
            </div>
            <div className="rounded-xl border border-mist bg-paper p-4">
              <p className="eyebrow mb-2 text-slate">Template body (preview)</p>
              <div className="space-y-1.5">
                {[88, 72, 94, 60, 80].map((w, i) => (
                  <div key={i} className="h-2.5 rounded bg-mist" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
            <dl className="space-y-2.5 text-[0.84rem]">
              {[
                ["Type", selected.kind],
                ["Version", selected.version],
                ["Last updated", `${selected.updatedAt} · ${selected.updatedBy}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-slate">{k}</dt>
                  <dd className="text-right font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </RecordDrawer>
    </div>
  );
}

/* ── Brand Kit ─────────────────────────────────────────────────────────────── */

export function BrandKitView() {
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
        <GhostButton ariaLabel="Edit brand kit" className="mt-4">
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
          Used in every generated marketing asset and email. Changes propagate to the Marketing Studio template library.
        </p>
      </div>
    </div>
  );
}

/* ── AI Policies (row → explain drawer with inline streaming) ──────────────── */

export function AiPolicyView() {
  const [selected, setSelected] = useState<AiPolicyRow | null>(null);
  const explain = useInlineAi();

  function openPolicy(p: AiPolicyRow) {
    setSelected(p);
    explain.reset();
  }
  function runExplain(p: AiPolicyRow) {
    void explain.run({
      tool: "general",
      messages: [
        {
          role: "user",
          content: `Explain this MatinOS AI approval policy to a broker-owner in 3-4 sentences. Capability: "${p.capability}" (${p.scope}). Current policy: ${p.mode}. Risk: ${p.risk}. Cover what AI can/cannot do under this setting, why the gate exists (compliance/chargeback/FTC where relevant), and what changing it would do. Plain text, no markdown.`,
        },
      ],
    });
  }

  const cols: Column<AiPolicyRow>[] = [
    { key: "capability", header: "Capability", width: "30%", render: (p) => <TwoLineCell title={p.capability} sub={p.scope} /> },
    { key: "risk", header: "Risk", render: (p) => <PriorityBadge level={p.risk} /> },
    {
      key: "mode",
      header: "Policy",
      align: "right",
      render: (p) => (
        <StatusChip tone={p.mode === "Off" ? "info" : p.mode === "Auto-safe" ? "success" : "warn"}>{p.mode}</StatusChip>
      ),
    },
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <section className="space-y-3">
        <div>
          <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">AI approval policies</h2>
          <p className="mt-0.5 text-[0.78rem] text-slate">
            Click a capability for an AI-written explanation. Client-facing, legal, and outbound require approval — enforced server-side.
          </p>
        </div>
        <DataTable columns={cols} rows={aiPolicyRows} getRowId={(p) => p.id} onRowClick={openPolicy} />
      </section>

      <CalloutCard tone="risk" title="Risky policy flagged">
        Turning <span className="text-cloud">Automated outbound send</span> from <span className="text-cloud">Off</span> to{" "}
        <span className="text-cloud">Auto-safe</span> would let AI send client messages with no human in the loop — a compliance
        and chargeback risk. Requires owner sign-off and writes to <span className="font-mono text-[0.72rem]">audit_logs</span>.
      </CalloutCard>

      <RecordDrawer
        open={selected != null}
        onClose={() => setSelected(null)}
        title={selected?.capability ?? ""}
        subtitle={selected?.scope}
        actions={
          selected ? (
            <>
              <span className="text-[0.78rem] text-slate">
                Policy: <span className="font-semibold text-ink">{selected.mode}</span>
              </span>
              <InkButton className="ml-auto">Change policy</InkButton>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <PriorityBadge level={selected.risk} />
              <StatusChip tone={selected.mode === "Off" ? "info" : selected.mode === "Auto-safe" ? "success" : "warn"}>
                {selected.mode}
              </StatusChip>
            </div>

            <div className="rounded-xl border border-ink-700 bg-ink-800 p-4 text-slate-300">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[0.8rem] font-semibold text-cloud">
                  <MatinMark theme="white" className="h-3.5 w-3.5" />
                  What this policy means
                </p>
                <button
                  type="button"
                  onClick={() => runExplain(selected)}
                  disabled={explain.state.running}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-2.5 py-1 text-[0.74rem] font-semibold text-ink transition-colors hover:bg-gold-bright disabled:bg-gold/70"
                >
                  {explain.state.running ? "Explaining…" : explain.state.done ? "Regenerate" : "Explain with AI"}
                </button>
              </div>
              {explain.state.result ? (
                <p className="mt-2.5 whitespace-pre-wrap text-[0.82rem] leading-relaxed text-slate-300">{explain.state.result}</p>
              ) : (
                <p className="mt-2 text-[0.78rem] leading-relaxed text-slate-300/70">
                  Get a plain-English explanation of what AI may do under the {selected.mode} setting and why the gate exists.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-mist bg-paper p-4">
              <p className="font-mono text-[0.7rem] leading-relaxed text-slate">
                Enforced at <span className="text-ink">/api/ai</span> · approval state stored on{" "}
                <span className="text-ink">ai_actions</span> · every change writes <span className="text-ink">audit_logs</span>
              </p>
            </div>
          </div>
        ) : null}
      </RecordDrawer>
    </div>
  );
}

/* ── Notifications ─────────────────────────────────────────────────────────── */

export function NotificationsView({ alertsGrid }: { alertsGrid: ReactNode }) {
  const channels = [
    { icon: Mail, label: "Email", on: true },
    { icon: MessageSquare, label: "SMS", on: true },
    { icon: Bell, label: "Push", on: true },
    { icon: Phone, label: "Call escalation", on: false },
  ];
  const [state, setState] = useState(channels.map((c) => c.on));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">Notification &amp; automation rules</h2>
        <p className="mt-0.5 text-[0.78rem] text-slate">
          Per-status: what notifies a human vs what the system handles automatically.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {channels.map((c, i) => (
          <button
            key={c.label}
            type="button"
            onClick={() => setState((s) => s.map((v, j) => (j === i ? !v : v)))}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.78rem] font-medium transition-colors",
              state[i] ? "border-ink/20 bg-ink text-cloud" : "border-mist bg-cloud text-slate hover:text-ink",
            )}
          >
            <c.icon className="h-3.5 w-3.5" />
            {c.label}
            <Dot tone={state[i] ? "success" : "info"} />
          </button>
        ))}
      </div>
      {alertsGrid}
    </div>
  );
}

/* ── Audit Log (Avatar + saved-view filter + row drawer) ───────────────────── */

const AUDIT_VIEWS = [
  { key: "all", label: "All" },
  { key: "people", label: "By people" },
  { key: "system", label: "System" },
  { key: "ai", label: "AI actions" },
];

function isSystem(actor: string) {
  return actor === "System";
}

export function AuditView() {
  const [view, setView] = useState("all");
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const rows = useMemo(() => {
    if (view === "system") return auditLogs.filter((a) => isSystem(a.actor));
    if (view === "people") return auditLogs.filter((a) => !isSystem(a.actor));
    if (view === "ai") return auditLogs.filter((a) => /\bAI\b/i.test(a.action) || /\bAI\b/i.test(a.target));
    return auditLogs;
  }, [view]);

  const counts = {
    all: auditLogs.length,
    people: auditLogs.filter((a) => !isSystem(a.actor)).length,
    system: auditLogs.filter((a) => isSystem(a.actor)).length,
    ai: auditLogs.filter((a) => /\bAI\b/i.test(a.action) || /\bAI\b/i.test(a.target)).length,
  };

  const cols: Column<AuditLog>[] = [
    {
      key: "actor",
      header: "Actor",
      width: "20%",
      render: (a) =>
        isSystem(a.actor) ? (
          <span className="inline-flex items-center gap-2 text-[0.84rem] font-medium text-slate">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-paper-200 ring-1 ring-inset ring-mist">
              <MatinMark theme="dark" className="h-3.5 w-3.5" />
            </span>
            System
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Avatar name={a.actor} slug={slugForName(a.actor)} size={28} ring />
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
            Click an entry for full context · immutable · exportable for compliance.
          </p>
        </div>
        <GhostButton ariaLabel="Export audit log">
          <Send className="h-3.5 w-3.5" />
          Export
        </GhostButton>
      </div>

      <SavedViewTabs
        views={AUDIT_VIEWS.map((v) => ({ ...v, count: counts[v.key as keyof typeof counts] }))}
        active={view}
        onChange={setView}
      />

      <DataTable
        columns={cols}
        rows={rows}
        getRowId={(a) => a.id}
        onRowClick={(a) => setSelected(a)}
        emptyState={<EmptyState title="No audit events" body="Admin and system changes will appear here as they happen." />}
      />

      <RecordDrawer
        open={selected != null}
        onClose={() => setSelected(null)}
        title={selected?.action ?? ""}
        subtitle={selected ? `${selected.id} · ${selected.timeLabel}` : undefined}
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-mist bg-paper p-4">
              {isSystem(selected.actor) ? (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-paper-200 ring-1 ring-inset ring-mist">
                  <MatinMark theme="dark" className="h-5 w-5" />
                </span>
              ) : (
                <Avatar name={selected.actor} slug={slugForName(selected.actor)} size={44} ring />
              )}
              <div>
                <p className="text-[0.74rem] text-slate">Actor</p>
                <p className="font-semibold text-ink">{selected.actor}</p>
              </div>
            </div>
            <dl className="space-y-2.5 text-[0.84rem]">
              {[
                ["Event ID", selected.id],
                ["Action", selected.action],
                ["Target", selected.target],
                ["When", selected.timeLabel],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="shrink-0 text-slate">{k}</dt>
                  <dd className="text-right font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <CalloutCard tone="system" title="Chain of custody">
              This entry is append-only. It cannot be edited or deleted — only superseded by a newer event.
              Included in the monthly compliance export.
            </CalloutCard>
          </div>
        ) : null}
      </RecordDrawer>
    </section>
  );
}
