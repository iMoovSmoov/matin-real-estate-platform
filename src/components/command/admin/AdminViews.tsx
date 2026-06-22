"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  Plus,
  Pencil,
  Send,
  Mail,
  MessageSquare,
  Bell,
  Phone,
  CircleCheck,
  Download,
  Copy,
  Check,
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
  BrandedDocument,
  type Column,
} from "@/components/os";
import { Logo, MatinMark } from "@/components/brand/Logo";
import { auditLogs, company, roles, getAgent } from "@/lib/data";
import type { AuditLog } from "@/lib/types";
import { cn } from "@/lib/utils";
import { downloadCsv, downloadTextFile } from "@/lib/download";
import {
  userRows as seedUsers,
  roleDefs,
  teamRows as seedTeams,
  templateRows as seedTemplates,
  aiPolicyRows,
  assignableAgents,
  brandCoreSwatches,
  brandGoldSwatches,
  type UserRow,
  type TemplateRow,
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
  useFlash,
  FlashToast,
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
  const [invite, setInvite] = useState({ slug: "", name: "", email: "", role: "Agent — Licensed Broker", team: "Oregon" });

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

  // Real agents not already in the table — the only people you can invite.
  const inviteCandidates = useMemo(
    () => assignableAgents.filter((a) => !users.some((u) => u.slug === a.slug)),
    [users],
  );

  function submitInvite() {
    if (!invite.slug) return;
    const agent = getAgent(invite.slug);
    if (!agent) return;
    const id = `U-${String(users.length + 1).padStart(3, "0")}`;
    setUsers((prev) => [
      ...prev,
      {
        id,
        slug: agent.slug,
        name: agent.name,
        email: invite.email.trim() || agent.email,
        role: invite.role,
        team: invite.team,
        status: "invited",
        lastActive: "Invite sent just now",
      },
    ]);
    setInviteOpen(false);
    setInvite({ slug: "", name: "", email: "", role: "Agent — Licensed Broker", team: "Oregon" });
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
          <Avatar name={u.name} slug={u.slug} size={32} ring />
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
      primary: true,
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
      <section className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">Users</h2>
            <p className="mt-0.5 text-[0.78rem] text-slate">
              40 brokerage members · {counts.invited} pending invites · most recently active shown
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

        {/* Key on the active saved-view so a filter change cross-fades the list
            (motion-safe) — the tab click produces a visible content transition. */}
        <div key={view} className="motion-safe:animate-fade">
          <DataTable<UserRow>
            columns={columns}
            rows={filtered}
            getRowId={(u) => u.id}
            selectable
            responsive
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
        </div>
      </section>

      <section className="min-w-0">
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
              <Avatar name={selected.name} slug={selected.slug} size={56} ring />
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
        subtitle="Sends an invite email · their role sets what they can access"
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
          <Field label="Agent" hint="from the Matin roster">
            <SelectInput
              value={invite.slug}
              onChange={(e) => {
                const a = getAgent(e.target.value);
                setInvite({ ...invite, slug: e.target.value, name: a?.name ?? "", email: a?.email ?? "" });
              }}
              autoFocus
            >
              <option value="">Select an agent…</option>
              {inviteCandidates.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Email" hint="defaults to the roster email">
            <TextInput
              value={invite.email}
              onChange={(e) => setInvite({ ...invite, email: e.target.value })}
              placeholder={invite.slug ? getAgent(invite.slug)?.email : "name@matinrealestate.com"}
            />
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
              When you send: the invite email goes out, the person shows as{" "}
              <span className="text-ink">Invited</span>, and the change is saved to the{" "}
              <span className="text-ink">activity log</span>.
            </p>
          </div>
        </div>
      </RecordDrawer>
    </div>
  );
}

/* ── Teams & Offices ───────────────────────────────────────────────────────── */

type TeamRow = (typeof seedTeams)[number];

/** Real agents eligible to lead a team (leadership + operations leads). */
const TEAM_LEADS = ["alicia-smith", "amy-mead", "sierra-palmeri", "jordan-matin"];

export function TeamsView() {
  const [teams, setTeams] = useState<TeamRow[]>(seedTeams);
  const [selected, setSelected] = useState<TeamRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", office: "West Linn HQ", leadSlug: "alicia-smith", markets: "" });

  function submit() {
    if (!draft.name.trim()) return;
    const lead = getAgent(draft.leadSlug);
    const id = `T-${String(teams.length + 1).padStart(3, "0")}`;
    setTeams((prev) => [
      ...prev,
      {
        id,
        name: draft.name.trim(),
        office: draft.office,
        lead: lead?.name ?? "",
        leadSlug: draft.leadSlug,
        members: 0,
        markets: draft.markets || "—",
      },
    ]);
    setCreateOpen(false);
    setDraft({ name: "", office: "West Linn HQ", leadSlug: "alicia-smith", markets: "" });
  }

  const cols: Column<TeamRow>[] = [
    { key: "name", header: "Team", render: (t) => <TwoLineCell title={t.name} sub={t.office} /> },
    {
      key: "lead",
      header: "Team lead",
      cardLabel: "Team lead",
      render: (t) => (
        <span className="flex items-center gap-2">
          <Avatar name={t.lead} slug={t.leadSlug} size={26} ring />
          <span className="text-[0.84rem] text-ink">{t.lead}</span>
        </span>
      ),
    },
    { key: "markets", header: "Markets / territories", width: "34%", cardLabel: "Markets", render: (t) => <span className="text-[0.8rem] text-slate">{t.markets}</span> },
    { key: "members", header: "Members", align: "right", primary: true, render: (t) => <span className="tabular-nums text-[0.84rem] font-semibold text-ink">{t.members}</span> },
  ];

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">Teams &amp; offices</h2>
          <p className="mt-0.5 text-[0.78rem] text-slate">Click a team to view it · choosing one filters every dashboard to that office.</p>
        </div>
        <InkButton icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreateOpen(true)}>
          Create team
        </InkButton>
      </div>
      <DataTable columns={cols} rows={teams} getRowId={(t) => t.id} onRowClick={(t) => setSelected(t)} responsive />

      <RecordDrawer
        open={selected != null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected?.office}
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-mist bg-paper p-4">
              <Avatar name={selected.lead} slug={selected.leadSlug} size={44} ring />
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
            <CalloutCard tone="system" title="What this does">
              Selecting <span className="text-cloud">{selected.name}</span> as your active office filters
              CRM, Reports, Transactions, and the Today list to that office only.
            </CalloutCard>
          </div>
        ) : null}
      </RecordDrawer>

      <RecordDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create team"
        subtitle="A team groups agents and filters dashboards to one office"
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
            <SelectInput value={draft.leadSlug} onChange={(e) => setDraft({ ...draft, leadSlug: e.target.value })}>
              {TEAM_LEADS.map((slug) => (
                <option key={slug} value={slug}>
                  {getAgent(slug)?.name ?? slug}
                </option>
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

/* ── Templates (TemplateRow is the canonical type imported from adminData) ──── */

export function TemplatesView() {
  const [templates, setTemplates] = useState<TemplateRow[]>(seedTemplates);
  const [selected, setSelected] = useState<TemplateRow | null>(null);
  const draftAi = useInlineAi();
  const [describe, setDescribe] = useState("");
  const [copiedDraft, setCopiedDraft] = useState(false);
  const { msg, flash } = useFlash();

  // The AI-drafted checklist is a real artifact — copy it or keep a .txt, not
  // just Save-to-table or Discard.
  async function copyDraft() {
    if (!draftAi.state.result) return;
    try {
      await navigator.clipboard.writeText(draftAi.state.result);
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 1600);
    } catch {
      /* clipboard blocked — no-op */
    }
  }
  function downloadDraft() {
    if (!draftAi.state.result) return;
    downloadTextFile("matin-checklist-template.txt", draftAi.state.result);
  }

  // "New template" is the AI drafter below the table — scroll it into view and
  // focus the description input so the button has a visible, real result (not a
  // dead click). Honors prefers-reduced-motion.
  const drafterRef = useRef<HTMLDivElement>(null);
  const describeRef = useRef<HTMLInputElement>(null);
  function focusDrafter() {
    setSelected(null);
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => {
      drafterRef.current?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "center",
      });
      describeRef.current?.focus();
    });
  }

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
          content: `Draft a checklist template for this listing or transaction: "${describe || "new construction listing in Clark County, WA"}". Output a numbered checklist of 6-9 concrete steps covering the real work (e.g. disclosures, photos, MLS draft, broker approval). Plain text, no preamble. End with one line noting it is saved as a draft for broker review.`,
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
    { key: "kind", header: "Type", cardLabel: "Type", render: (t) => <StatusChip tone="info">{t.kind}</StatusChip> },
    { key: "version", header: "Version", cardLabel: "Version", render: (t) => <span className="font-mono text-[0.78rem] text-slate">{t.version}</span> },
    {
      key: "status",
      header: "Status",
      primary: true,
      render: (t) => (
        <StatusChip tone={t.status === "published" ? "success" : "warn"}>
          {t.status === "published" ? "Published" : "Draft"}
        </StatusChip>
      ),
    },
    { key: "updatedAt", header: "Last updated", align: "right", cardLabel: "Last updated", render: (t) => <span className="text-[0.8rem] text-slate">{t.updatedAt} · {t.updatedBy}</span> },
  ];

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">Templates</h2>
            <p className="mt-0.5 text-[0.78rem] text-slate">Click a template to preview · every edit saves a new version and is logged.</p>
          </div>
          <InkButton icon={<Plus className="h-3.5 w-3.5" />} onClick={focusDrafter}>
            New template
          </InkButton>
        </div>
        <DataTable columns={cols} rows={templates} getRowId={(t) => t.id} onRowClick={(t) => setSelected(t)} responsive />
      </section>

      {/* AI checklist drafter — streams INLINE in this dark card, not the sidecar */}
      <div ref={drafterRef} className="scroll-mt-20 rounded-2xl border border-ink-700 bg-ink-800 p-5 text-slate-300 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 ring-1 ring-inset ring-gold/30">
            <MatinMark theme="white" className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[1.02rem] font-normal leading-tight text-cloud">
              Generate a checklist template from a description
            </h3>
            <p className="mt-1 text-[0.82rem] text-slate-300">
              Describe a listing or transaction and Matin AI drafts a step-by-step checklist — saved as a draft for broker review.
            </p>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                ref={describeRef}
                value={describe}
                onChange={(e) => setDescribe(e.target.value)}
                placeholder="new construction listing in Clark County"
                className="flex-1 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-[0.84rem] text-cloud placeholder:text-slate-300/40 focus:border-gold/40 focus:outline-none"
              />
              <button
                type="button"
                onClick={runDraft}
                disabled={draftAi.state.running}
                className="btn-accent inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-[0.8rem] font-semibold disabled:bg-gold/70"
              >
                <span>{draftAi.state.running ? "Drafting…" : draftAi.state.done ? "Regenerate" : "Draft template"}</span>
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
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={copyDraft}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-ink-700 px-2.5 py-1.5 text-[0.78rem] font-medium text-slate-300 transition-colors hover:border-gold/40 hover:text-cloud"
                  >
                    {copiedDraft ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-success" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={downloadDraft}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-ink-700 px-2.5 py-1.5 text-[0.78rem] font-medium text-slate-300 transition-colors hover:border-gold/40 hover:text-cloud"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={draftAi.reset} className="rounded-lg px-3 py-1.5 text-[0.78rem] font-medium text-slate-300 hover:text-cloud">
                    Discard
                  </button>
                  <button type="button" onClick={saveDraft} className="inline-flex items-center gap-1.5 rounded-lg bg-cloud px-3 py-1.5 text-[0.78rem] font-semibold text-ink hover:bg-cloud/90">
                    <CircleCheck className="h-3.5 w-3.5" />
                    Save as draft template
                  </button>
                </div>
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
              <GhostButton onClick={() => flash(`Opening ${selected.id} in the template editor…`)}>
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

            {/* Real branded preview (S12 ticket 10) — letterhead + ruled fields
                + boxed signature + green completion checks + Page X of N. */}
            <TemplatePreviewDoc template={selected} />

            <dl className="space-y-2.5 text-[0.84rem]">
              {[
                ["Type", selected.kind],
                ["Form ID", selected.formId ?? "—"],
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

      <FlashToast msg={msg} />
    </div>
  );
}

/* ── Branded template preview (S12 ticket 10) ──────────────────────────────── */

function TemplatePreviewDoc({ template }: { template: TemplateRow }) {
  const broker = getAgent(roles.principalBroker);
  const coordinator = getAgent(roles.listingCoordinators[0]);
  const isEmail = template.kind === "Email";

  // A real BrandedDocument so even the template preview is a Matin artifact,
  // not gray bars. Email templates render the branded email shell; document /
  // checklist templates render the letterhead with a completion-checked grid.
  if (isEmail) {
    return (
      <BrandedDocument
        variant="email"
        title={template.name}
        emailSubject="Your Matin home search — first homes inside"
        fromName={`Matin Real Estate · ${coordinator?.name ?? "Listings Team"}`}
        mergeTokens={["{{first_name}}", "{{search_area}}", "{{agent_name}}"]}
        hideToolbar
      />
    );
  }

  return (
    <BrandedDocument
      variant={template.kind === "Checklist" ? "report" : "agreement"}
      formId={template.formId}
      title={template.name}
      completion={template.status === "published" ? 100 : 60}
      page={1}
      pages={template.kind === "Checklist" ? 1 : 4}
      agent={
        broker
          ? {
              name: broker.name,
              title: broker.title,
              license: broker.licenseNumbers?.OR,
              phone: broker.phone,
              email: broker.email,
              slug: broker.slug,
              photo: broker.photo,
            }
          : undefined
      }
      fields={[
        { label: "Template ID", value: template.id },
        { label: "Version", value: template.version },
        { label: "Maintained by", value: template.updatedBy },
        { label: "Status", value: template.status === "published" ? "Published" : "Draft", filled: template.status === "published" },
      ]}
    />
  );
}

/* ── Brand Kit (S12 ticket 3) ──────────────────────────────────────────────── */

function Swatch({ name, hex, cls, note }: { name: string; hex: string; cls: string; note?: string }) {
  return (
    <div>
      <span
        className={cn(
          "block h-12 w-full rounded-lg ring-1 ring-inset ring-mist",
          cls,
        )}
      />
      <p className="mt-1.5 truncate text-[0.72rem] font-medium text-ink">{name}</p>
      <p className="font-mono text-[0.64rem] text-slate">{hex}</p>
      {note ? <p className="mt-0.5 truncate text-[0.62rem] leading-tight text-slate/70">{note}</p> : null}
    </div>
  );
}

export function BrandKitView() {
  const broker = getAgent(roles.principalBroker);
  const marketing = getAgent(roles.marketingLead);
  const { msg, flash } = useFlash();

  // Real .txt brand spec (palette hexes, fonts, voice) — a tangible asset, not a
  // fake "preparing pack…" toast. The letterhead/email previews below are also
  // downloadable via their own BrandedDocument toolbars.
  function downloadBrandKit() {
    const lines = [
      "MATIN REAL ESTATE — BRAND KIT",
      "Portland & SW Washington's most advanced brokerage.",
      "",
      "IDENTITY",
      "Display font: Fraunces",
      "Body / numbers: Inter (tabular)",
      "Brand voice: Confident · precise · no hype",
      `Office: ${company.address.city}, ${company.address.state}`,
      `Reply-to: ${company.email}`,
      "",
      "CORE PALETTE",
      ...brandCoreSwatches.map((s) => `${s.name}  ${s.hex}${s.note ? ` — ${s.note}` : ""}`),
      "",
      "AI ACCENT · GOLD (rationed to AI/active affordances only)",
      ...brandGoldSwatches.map((s) => `${s.name}  ${s.hex}${s.note ? ` — ${s.note}` : ""}`),
    ];
    downloadTextFile("matin-brand-kit.txt", lines.join("\n"));
    flash("Brand kit downloaded (palette, fonts, voice)");
  }

  return (
    <>
    <div className="grid gap-5 lg:grid-cols-2">
      {/* ── Wordmark lockups (real Matin marks — white-on-dark + dark-on-light) ── */}
      <div className="min-w-0 rounded-2xl border border-mist bg-cloud p-5 shadow-soft lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="eyebrow text-slate">Logo lockups</p>
            <h2 className="mt-1 font-display text-[1.1rem] font-normal text-ink">Matin Real Estate marks</h2>
          </div>
          <GhostButton ariaLabel="Download brand kit" onClick={downloadBrandKit}>
            <Download className="h-3.5 w-3.5" />
            Download brand kit
          </GhostButton>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {/* white wordmark on dark */}
          <div className="flex flex-col">
            <div className="flex flex-1 items-center justify-center rounded-xl bg-ink px-4 py-6">
              <Logo variant="full" theme="white" className="h-8" />
            </div>
            <p className="mt-1.5 text-[0.72rem] text-slate">Wordmark · on dark</p>
          </div>
          {/* dark-context wordmark on light (ink-chip lockup) */}
          <div className="flex flex-col">
            <div className="flex flex-1 items-center justify-center rounded-xl border border-mist bg-paper px-4 py-6">
              <Logo variant="full" theme="dark" className="h-8" />
            </div>
            <p className="mt-1.5 text-[0.72rem] text-slate">Wordmark · on light</p>
          </div>
          {/* M-mark */}
          <div className="flex flex-col">
            <div className="flex flex-1 items-center justify-center rounded-xl border border-mist bg-paper px-4 py-6">
              <MatinMark theme="dark" className="h-9" />
            </div>
            <p className="mt-1.5 text-[0.72rem] text-slate">M-mark · favicon</p>
          </div>
        </div>
      </div>

      {/* ── Identity + palette ──────────────────────────────────────────────── */}
      <div className="min-w-0 rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
        <p className="eyebrow text-slate">Identity</p>
        <h2 className="mt-1 font-display text-[1.1rem] font-normal text-ink">Matin Real Estate</h2>
        <p className="mt-0.5 text-[0.8rem] text-slate">Portland &amp; SW Washington&apos;s most advanced brokerage.</p>
        <dl className="mt-4 space-y-2.5 text-[0.84rem]">
          {[
            ["Display font", "Fraunces"],
            ["Body / numbers", "Inter (tabular)"],
            ["Brand voice", "Confident · precise · no hype"],
            ["Office", `${company.address.city}, ${company.address.state}`],
            ["Reply-to", company.email],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-slate">{k}</dt>
              <dd className="font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="min-w-0 rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
        <p className="eyebrow text-slate">Palette</p>
        {/* responsive 2/3 cols so hex labels never clip (S12 ticket 12) */}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {brandCoreSwatches.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </div>

        {/* Estate Green AI-accent tokens — rationed to AI/active only (S12 ticket 3) */}
        <div className="mt-4 border-t border-mist pt-3.5">
          <p className="flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate">
            <MatinMark theme="dark" className="h-3.5 w-3.5" />
            AI accent · Estate Green (rationed)
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {brandGoldSwatches.map((s) => (
              <Swatch key={s.name} {...s} />
            ))}
          </div>
        </div>
        <p className="mt-4 text-[0.74rem] text-slate">
          Used in every generated marketing asset and email. Estate Green appears only on AI/active affordances.
        </p>
      </div>

      {/* ── Branded letterhead preview (its own Save copy / Download PDF) ────── */}
      <div className="min-w-0 rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
        <p className="eyebrow mb-3 text-slate">Letterhead preview</p>
        <BrandedDocument
          variant="letter"
          title="Matin Real Estate letterhead"
          completion={100}
          page={1}
          pages={1}
          agent={
            broker
              ? {
                  name: broker.name,
                  title: broker.title,
                  license: broker.licenseNumbers?.OR,
                  phone: broker.phone,
                  email: broker.email,
                  slug: broker.slug,
                  photo: broker.photo,
                }
              : undefined
          }
          fields={[
            { label: "Office", value: `${company.address.street}` },
            { label: "City", value: `${company.address.city}, ${company.address.state} ${company.address.zip}` },
            { label: "Phone", value: company.phone },
            { label: "Web", value: "matinrealestate.com" },
          ]}
          body={
            <p className="text-[0.82rem] leading-relaxed text-ink/85">
              Every client-facing artifact — agreements, disclosures, net sheets, flyers, and emails —
              renders on this Matin letterhead with the real West Linn office line and an Equal Housing
              footer. This is the shell the Marketing Studio and Forms sections compose.
            </p>
          }
        />
      </div>

      {/* ── Branded email-header preview ────────────────────────────────────── */}
      <div className="min-w-0 rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
        <p className="eyebrow mb-3 text-slate">Email header preview</p>
        <BrandedDocument
          variant="email"
          title="Matin branded email"
          emailSubject="A quick note from Matin Real Estate"
          fromName={`Matin Real Estate · ${marketing?.name ?? "Marketing"}`}
          mergeTokens={["{{first_name}}", "{{address}}", "{{community}}"]}
          hideToolbar
        />
      </div>
    </div>
    <FlashToast msg={msg} />
    </>
  );
}

/* ── AI Policies (row → explain drawer with inline streaming) ──────────────── */

export function AiPolicyView() {
  const [selected, setSelected] = useState<AiPolicyRow | null>(null);
  const explain = useInlineAi();
  const { msg, flash } = useFlash();

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
    { key: "risk", header: "Risk", cardLabel: "Risk", render: (p) => <PriorityBadge level={p.risk} /> },
    {
      key: "mode",
      header: "Policy",
      align: "right",
      primary: true,
      render: (p) => (
        <StatusChip tone={p.mode === "Off" ? "info" : p.mode === "Auto-safe" ? "success" : "warn"}>{p.mode}</StatusChip>
      ),
    },
  ];

  return (
    <>
    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <section className="min-w-0 space-y-3">
        <div>
          <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">AI approval policies</h2>
          <p className="mt-0.5 text-[0.78rem] text-slate">
            Click a capability for an AI-written explanation. Client-facing, legal, and outbound messages always require human approval.
          </p>
        </div>
        <DataTable columns={cols} rows={aiPolicyRows} getRowId={(p) => p.id} onRowClick={openPolicy} responsive />
      </section>

      <CalloutCard tone="risk" title="Risky policy flagged" className="min-w-0">
        Turning <span className="text-cloud">Automated outbound send</span> from <span className="text-cloud">Off</span> to{" "}
        <span className="text-cloud">Auto-safe</span> would let AI send client messages with no one reviewing them first — a compliance
        and chargeback risk. Requires owner sign-off and is recorded in the activity log.
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
              <InkButton
                className="ml-auto"
                onClick={() =>
                  flash(`Change to “${selected.capability}” is ready — needs owner sign-off and will be logged`)
                }
              >
                Change policy
              </InkButton>
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
                  className="btn-accent inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[0.74rem] font-semibold disabled:bg-gold/70"
                >
                  <span>{explain.state.running ? "Explaining…" : explain.state.done ? "Regenerate" : "Explain with AI"}</span>
                </button>
              </div>
              {explain.state.result ? (
                <p className="mt-2.5 whitespace-pre-wrap text-[0.82rem] leading-relaxed text-slate-300">{explain.state.result}</p>
              ) : (
                <p className="mt-2 text-[0.78rem] leading-relaxed text-slate-300/70">
                  Get a plain-English explanation of what AI may do under the {selected.mode} setting and why approval is required.
                </p>
              )}
              {explain.state.done && !explain.state.error && explain.state.result ? (
                <div className="mt-2.5 flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(explain.state.result);
                        flash("Explanation copied");
                      } catch {
                        /* clipboard blocked — no-op */
                      }
                    }}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-ink-700 px-2.5 py-1.5 text-[0.74rem] font-medium text-slate-300 transition-colors hover:border-gold/40 hover:text-cloud"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </button>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-mist bg-paper p-4">
              <p className="font-mono text-[0.7rem] leading-relaxed text-slate">
                Every AI action runs through this approval check, and each change to a policy is recorded in the{" "}
                <span className="text-ink">activity log</span>.
              </p>
            </div>
          </div>
        ) : null}
      </RecordDrawer>
    </div>
    <FlashToast msg={msg} />
    </>
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
          For each stage of a deal: what alerts a person, and what the system handles automatically.
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
  const { msg, flash } = useFlash();

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

  // Real CSV export of the current view — a downloadable compliance record, not
  // a fake "exporting…" toast.
  function exportCsv() {
    const header = ["Event ID", "Actor", "Action", "Target", "When"];
    const body = rows.map((a) => [a.id, a.actor, a.action, a.target, a.timeLabel]);
    downloadCsv(`matin-audit-log-${view}.csv`, [header, ...body]);
    flash(`Exported ${rows.length} log entries to CSV`);
  }

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
    { key: "action", header: "Action", width: "24%", cardLabel: "Action", render: (a) => <span className="text-[0.84rem] text-ink">{a.action}</span> },
    { key: "target", header: "Target", cardLabel: "Target", render: (a) => <span className="text-[0.8rem] text-slate">{a.target}</span> },
    { key: "timeLabel", header: "Time", align: "right", primary: true, render: (a) => <span className="text-[0.8rem] text-slate">{a.timeLabel}</span> },
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">Audit log</h2>
          <p className="mt-0.5 text-[0.78rem] text-slate">
            Click an entry for full detail · permanent record · exportable for compliance.
          </p>
        </div>
        <GhostButton ariaLabel="Export audit log to CSV" onClick={exportCsv}>
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </GhostButton>
      </div>

      <SavedViewTabs
        views={AUDIT_VIEWS.map((v) => ({ ...v, count: counts[v.key as keyof typeof counts] }))}
        active={view}
        onChange={setView}
      />

      {/* Key on the active saved-view so the filter change cross-fades the log. */}
      <div key={view} className="motion-safe:animate-fade">
        <DataTable
          columns={cols}
          rows={rows}
          getRowId={(a) => a.id}
          onRowClick={(a) => setSelected(a)}
          responsive
          emptyState={<EmptyState title="No audit events" body="Admin and system changes will appear here as they happen." />}
        />
      </div>

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
              This entry is permanent. It cannot be edited or deleted — only followed by a newer entry.
              Included in the monthly compliance export.
            </CalloutCard>
          </div>
        ) : null}
      </RecordDrawer>

      <FlashToast msg={msg} />
    </section>
  );
}
