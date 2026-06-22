"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Plus,
  Pencil,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Lock,
  Play,
  Pause,
  CircleCheck,
  Banknote,
} from "lucide-react";
import {
  DataTable,
  TwoLineCell,
  StatusChip,
  Dot,
  CalloutCard,
  AiPanel,
  AIInsightChip,
  RecordDrawer,
  Avatar,
  useAiSidecar,
  type Column,
  type AIAction,
} from "@/components/os";
import { type AiActionState } from "@/components/os/AiPanel";
import { MatinMark } from "@/components/brand/Logo";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import {
  routingRules as seedRules,
  ruleOwnership,
  statusConfig,
  type RoutingRule,
  type RoutingType,
  type RuleMember,
  type StatusConfigRow,
} from "./adminData";
import {
  InkButton,
  GhostButton,
  MiniToggle,
  Field,
  SelectInput,
  TextInput,
  slugForName,
  useInlineAi,
} from "./adminUi";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Admin · Lead Routing (the default, deepest Admin surface)

   Everything mutates real local state:
     • rules table (state) — row → selects + opens the Edit drawer
     • priority ↑/↓ reorder · Clone · Delete · pause/resume status
     • "+ New Rule" drawer appends to state; Edit drawer patches in place
     • member tokens = <Avatar slug> (real headshots, initials fallback)
     • behavioral-alerts toggles flip in state
     • AI message-preview + the proposed-action cards stream INLINE (streamAi),
       never the global sidecar. One explicit "Ask Matin" pill may open it.
   ────────────────────────────────────────────────────────────────────────── */

/* ── member avatar cluster (real photos) ───────────────────────────────────── */

function MemberCluster({ members }: { members: RuleMember[] }) {
  const shown = members.slice(0, 4);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((m) => (
          <Avatar
            key={m.name}
            name={m.name}
            slug={slugForName(m.name)}
            size={26}
            ring
            className="ring-2 ring-cloud"
          />
        ))}
      </div>
      {extra > 0 ? (
        <span className="ml-1.5 text-[0.74rem] font-medium text-slate tabular-nums">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

/* ── Behavioral Alerts vs Automation grid (state-backed toggles) ───────────── */

export function AlertsAutomationGrid() {
  const [rows, setRows] = useState<StatusConfigRow[]>(statusConfig);

  const onCount = rows.filter((r) => r.notify.on).length;
  const autoCount = rows.filter((r) => r.automate.on).length;

  function setNotify(id: string, v: boolean) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, notify: { ...r.notify, on: v } } : r)));
  }
  function setAutomate(id: string, v: boolean) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, automate: { ...r.automate, on: v } } : r)),
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
      <div className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-mist bg-paper-200/60">
        <div className="px-4 py-2.5">
          <p className="eyebrow text-[0.66rem]">Status / signal</p>
        </div>
        <div className="border-l border-mist px-4 py-2.5">
          <p className="eyebrow text-[0.66rem]">Notifies a human · {onCount} on</p>
        </div>
        <div className="border-l border-mist px-4 py-2.5">
          <p className="eyebrow text-[0.66rem]">System does · {autoCount} on</p>
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
          <div className="flex items-center gap-2 px-4 py-3.5">
            <Dot tone={r.statusTone} />
            <span className="text-[0.84rem] font-semibold text-ink">{r.status}</span>
          </div>

          <div className="flex items-center justify-between gap-3 border-l border-mist px-4 py-3.5">
            <span
              className={cn(
                "text-[0.8rem] leading-snug transition-colors",
                r.notify.on ? "text-slate" : "text-slate/40 line-through",
              )}
            >
              {r.notify.label}
            </span>
            <MiniToggle on={r.notify.on} onChange={(v) => setNotify(r.id, v)} label={`Notify — ${r.status}`} />
          </div>

          <div className="flex items-center justify-between gap-3 border-l border-mist px-4 py-3.5">
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block text-[0.8rem] leading-snug transition-colors",
                  r.automate.on ? "text-slate" : "text-slate/40 line-through",
                )}
              >
                {r.automate.label}
              </span>
              {r.automate.risk === "approval" ? (
                <StatusChip tone="warn" className="mt-1">Approval gate</StatusChip>
              ) : (
                <StatusChip tone="success" className="mt-1">Auto-safe</StatusChip>
              )}
            </span>
            <MiniToggle on={r.automate.on} onChange={(v) => setAutomate(r.id, v)} label={`Automate — ${r.status}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Ownership / Access card (reflects the selected rule) ──────────────────── */

function OwnershipCard({ rule }: { rule: RoutingRule }) {
  const o = ruleOwnership;
  const rows: { label: string; value: ReactNode }[] = [
    {
      label: "Owned by",
      value: (
        <span className="inline-flex items-center gap-2">
          <Avatar name={o.ownedBy} slug={slugForName(o.ownedBy)} size={26} ring />
          <TwoLineCell title={o.ownedBy} sub={o.ownedByTitle} />
        </span>
      ),
    },
    {
      label: "Assigned to",
      value: (
        <span className="inline-flex items-center gap-2">
          <Avatar name={o.assignedTo} slug={slugForName(o.assignedTo)} size={26} ring />
          <TwoLineCell title={o.assignedTo} sub={o.assignedToTitle} />
        </span>
      ),
    },
    {
      label: "Shared with",
      value: (
        <span className="flex flex-wrap items-center justify-end gap-1.5">
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
        <div className="min-w-0">
          <p className="eyebrow text-slate">Ownership / Access</p>
          <h3 className="mt-1 truncate font-display text-[1.02rem] font-normal leading-tight text-ink">
            {rule.id} · {rule.source}
          </h3>
        </div>
        <span className="shrink-0 font-mono text-[0.7rem] text-slate">{rule.team}</span>
      </div>

      <dl className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4">
            <dt className="shrink-0 text-[0.78rem] font-medium text-slate">{r.label}</dt>
            <dd className="min-w-0 text-right text-[0.84rem] text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-mist pt-3.5">
        {o.trust.map((t) => (
          <StatusChip key={t} tone="success">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            {t}
          </StatusChip>
        ))}
      </div>

      <p className="mt-3 text-[0.72rem] text-slate">
        Last changed by <span className="font-medium text-ink">{rule.lastChangedBy}</span> · {rule.lastChangedAt}
        <span className="mx-1.5 text-mist">·</span>
        writes to <span className="font-mono text-[0.7rem]">audit_logs</span>
      </p>
    </div>
  );
}

/* ── Recipient builder (shared by New + Edit drawers) ──────────────────────── */

const ALL_AGENTS = [
  "Chase Bright",
  "Amanda Conlon",
  "Andy Wilcox",
  "Amy Mead",
  "Sierra Seggerman",
  "Alicia Smith",
  "Jordan Matin",
  "Paris Vollstedt",
];

function RecipientBuilder({
  members,
  onChange,
}: {
  members: RuleMember[];
  onChange: (next: RuleMember[]) => void;
}) {
  const available = ALL_AGENTS.filter((n) => !members.some((m) => m.name === n));

  function move(idx: number, dir: -1 | 1) {
    const next = [...members];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  }
  function setWeight(name: string, weight: number) {
    onChange(members.map((m) => (m.name === name ? { ...m, weight: Math.max(1, weight) } : m)));
  }
  function remove(name: string) {
    onChange(members.filter((m) => m.name !== name));
  }
  function add(name: string) {
    if (!name) return;
    onChange([...members, { name, weight: 1 }]);
  }

  return (
    <div className="space-y-1.5">
      {members.map((m, i) => (
        <div
          key={m.name}
          className="flex items-center justify-between gap-2 rounded-lg border border-mist bg-paper px-3 py-2"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Avatar name={m.name} slug={slugForName(m.name)} size={24} ring />
            <span className="truncate text-[0.84rem] font-medium text-ink">{m.name}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <label className="flex items-center gap-1 text-[0.72rem] text-slate">
              Weight
              <input
                type="number"
                min={1}
                value={m.weight}
                onChange={(e) => setWeight(m.name, Number(e.target.value))}
                className="w-12 rounded-md border border-mist bg-cloud px-1.5 py-1 text-center text-[0.76rem] tabular-nums text-ink focus:border-ink/30 focus:outline-none"
              />
            </label>
            <span className="flex flex-col text-slate">
              <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="hover:text-ink disabled:opacity-30">
                <ChevronUp className="h-3 w-3" />
              </button>
              <button type="button" aria-label="Move down" disabled={i === members.length - 1} onClick={() => move(i, 1)} className="hover:text-ink disabled:opacity-30">
                <ChevronDown className="h-3 w-3" />
              </button>
            </span>
            <button type="button" aria-label={`Remove ${m.name}`} onClick={() => remove(m.name)} className="text-slate hover:text-danger">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </span>
        </div>
      ))}

      {available.length > 0 ? (
        <SelectInput
          value=""
          onChange={(e) => add(e.target.value)}
          aria-label="Add recipient"
          className="mt-1 text-[0.8rem]"
        >
          <option value="">+ Add recipient · set weight…</option>
          {available.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </SelectInput>
      ) : (
        <p className="text-[0.74rem] text-slate">All available agents added.</p>
      )}
    </div>
  );
}

/* ── Rule form drawer (New + Edit share it) ────────────────────────────────── */

type RuleDraft = {
  id: string;
  source: string;
  sourceMeta: string;
  criteria: string[];
  type: RoutingType;
  members: RuleMember[];
  team: string;
  firstResponseSla: string;
};

function blankDraft(nextId: string): RuleDraft {
  return {
    id: nextId,
    source: "MatinRealEstate.com / IDX Search",
    sourceMeta: "Saved-search + property inquiry",
    criteria: ["Area: Portland Metro", "Type: Buyer"],
    type: "Round Robin",
    members: [{ name: "Chase Bright", weight: 1 }],
    team: "Oregon",
    firstResponseSla: "5 minutes",
  };
}

function RuleFormDrawer({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "new" | "edit";
  initial: RuleDraft | null;
  onClose: () => void;
  onSubmit: (draft: RuleDraft) => void;
}) {
  const [draft, setDraft] = useState<RuleDraft | null>(initial);
  const [lastInitial, setLastInitial] = useState<RuleDraft | null>(initial);

  // Inline AI: preview the exact merge-field message this rule will send.
  const preview = useInlineAi();

  // Re-seed when a different record opens (adjust-state-on-prop-change pattern).
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setDraft(initial);
    preview.reset();
  }

  if (!open || !draft) return null;

  function patch(p: Partial<RuleDraft>) {
    setDraft((d) => (d ? { ...d, ...p } : d));
  }
  function setCriterion(idx: number, value: string) {
    patch({ criteria: draft!.criteria.map((c, i) => (i === idx ? value : c)) });
  }
  function addCriterion() {
    patch({ criteria: [...draft!.criteria, ""] });
  }
  function removeCriterion(idx: number) {
    patch({ criteria: draft!.criteria.filter((_, i) => i !== idx) });
  }

  function runPreview() {
    const recip = draft!.members.map((m) => m.name).join(", ") || "the assigned agent";
    void preview.run({
      tool: "lead_reply",
      messages: [
        {
          role: "user",
          content: `Write the exact first auto-reply this lead-routing rule will send. Rule source: "${draft!.source}". Criteria: ${draft!.criteria.filter(Boolean).join("; ")}. Distribution: ${draft!.type} to ${recip}. First-response SLA: ${draft!.firstResponseSla}. Keep it under 60 words, warm, with one clear next step. Use {{first_name}}, {{search_area}}, {{agent_name}} merge fields.`,
        },
      ],
    });
  }

  return (
    <RecordDrawer
      open={open}
      onClose={onClose}
      title={mode === "new" ? "New routing rule" : `Edit ${draft.id}`}
      subtitle={mode === "new" ? "Define source, criteria, and recipients" : draft.source}
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-mist bg-cloud px-3.5 py-2 text-[0.82rem] font-medium text-slate transition-colors hover:text-ink"
          >
            Cancel
          </button>
          <InkButton
            className="ml-auto"
            icon={mode === "new" ? <Plus className="h-3.5 w-3.5" /> : <CircleCheck className="h-3.5 w-3.5" />}
            onClick={() => onSubmit(draft)}
          >
            {mode === "new" ? "Create rule" : "Save changes"}
          </InkButton>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rule ID">
            <TextInput value={draft.id} readOnly className="font-mono text-[0.8rem] text-slate" />
          </Field>
          <Field label="Team / office">
            <SelectInput value={draft.team} onChange={(e) => patch({ team: e.target.value })}>
              {["Oregon", "Washington", "Leadership", "Operations"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <Field label="Lead source">
          <SelectInput value={draft.source} onChange={(e) => patch({ source: e.target.value })}>
            <option>MatinRealEstate.com / IDX Search</option>
            <option>Zillow / Premier Agent</option>
            <option>Cash Offer request</option>
            <option>Open House sign-in</option>
            <option>SW Washington / RMLS</option>
            <option>Recruiting inquiry</option>
          </SelectInput>
        </Field>

        <Field label="Criteria" hint="All conditions must match (AND)">
          <div className="space-y-2">
            {draft.criteria.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <TextInput value={c} onChange={(e) => setCriterion(i, e.target.value)} placeholder="e.g. Price ≥ $600k" />
                <button type="button" aria-label="Remove condition" onClick={() => removeCriterion(i)} className="shrink-0 text-slate hover:text-danger">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addCriterion} className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-slate hover:text-ink">
              <Plus className="h-3.5 w-3.5" />
              Add condition
            </button>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Distribution type">
            <div className="grid grid-cols-2 gap-2">
              {(["Round Robin", "Blast"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => patch({ type: t })}
                  className={cn(
                    "rounded-lg border px-2.5 py-2 text-[0.78rem] font-medium transition-colors",
                    draft.type === t ? "border-ink bg-ink text-cloud" : "border-mist bg-paper text-ink hover:border-ink/25",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <Field label="First-response SLA">
            <SelectInput value={draft.firstResponseSla} onChange={(e) => patch({ firstResponseSla: e.target.value })}>
              {["5 minutes", "10 minutes", "15 minutes", "1 hour", "Same day"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <Field label="Recipients" hint={draft.type === "Round Robin" ? "Ordered · weighted" : "Blast — all at once"}>
          <RecipientBuilder members={draft.members} onChange={(m) => patch({ members: m })} />
        </Field>

        {/* Inline AI — preview the message, streamed RIGHT HERE (not the sidecar) */}
        <div className="rounded-xl border border-ink-700 bg-ink-800 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[0.78rem] font-semibold text-cloud">
              <MatinMark theme="white" className="h-3.5 w-3.5" />
              Message this rule will send
            </p>
            <button
              type="button"
              onClick={runPreview}
              disabled={preview.state.running}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-2.5 py-1 text-[0.74rem] font-semibold text-ink transition-colors hover:bg-gold-bright disabled:bg-gold/70"
            >
              {preview.state.running ? "Drafting…" : preview.state.done ? "Regenerate" : "Preview message"}
            </button>
          </div>
          {preview.state.result ? (
            <p className="mt-2.5 whitespace-pre-wrap text-[0.82rem] leading-relaxed text-slate-300">
              {preview.state.result}
            </p>
          ) : (
            <p className="mt-2 text-[0.78rem] leading-relaxed text-slate-300/70">
              Generates the exact merge-field auto-reply leads matching this rule receive — review before it can fire.
            </p>
          )}
          {preview.state.done && !preview.state.error ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <AIInsightChip>Merge fields validated</AIInsightChip>
              <AIInsightChip>Brand voice · approved</AIInsightChip>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-mist bg-paper px-3.5 py-3">
          <p className="font-mono text-[0.7rem] leading-relaxed text-slate">
            Automation after save · upsert <span className="text-ink">routing_rule</span> → test simulated
            leads → write <span className="text-ink">audit_log</span> → notify recipients
          </p>
        </div>
      </div>
    </RecordDrawer>
  );
}

/* ── Main Routing view ─────────────────────────────────────────────────────── */

export function RoutingView() {
  const { openAi } = useAiSidecar();
  const [rules, setRules] = useState<RoutingRule[]>(seedRules);
  const [selectedId, setSelectedId] = useState<string>(seedRules[0].id);
  const [drawer, setDrawer] = useState<{ mode: "new" | "edit"; draft: RuleDraft } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Per-action inline streaming state for the AI panel's proposed actions.
  const [actionState, setActionState] = useState<Record<string, AiActionState>>({});

  const selected = rules.find((r) => r.id === selectedId) ?? rules[0];
  const sorted = useMemo(() => [...rules].sort((a, b) => a.priority - b.priority), [rules]);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600);
  }

  function reorder(id: string, dir: -1 | 1) {
    setRules((prev) => {
      const ordered = [...prev].sort((a, b) => a.priority - b.priority);
      const idx = ordered.findIndex((r) => r.id === id);
      const j = idx + dir;
      if (j < 0 || j >= ordered.length) return prev;
      [ordered[idx], ordered[j]] = [ordered[j], ordered[idx]];
      return ordered.map((r, i) => ({ ...r, priority: i + 1 }));
    });
    flash("Priority reordered · audit_log written");
  }

  function toggleStatus(id: string) {
    setRules((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === "active" ? "paused" : "active" } : r,
      ),
    );
    const r = rules.find((x) => x.id === id);
    flash(r?.status === "active" ? `${id} paused` : `${id} resumed`);
  }

  function cloneRule(id: string) {
    setRules((prev) => {
      const src = prev.find((r) => r.id === id);
      if (!src) return prev;
      const nextNum = prev.length + 1;
      const clone: RoutingRule = {
        ...src,
        id: `RR-${String(nextNum).padStart(3, "0")}`,
        source: `${src.source} (copy)`,
        status: "paused",
        priority: prev.length + 1,
        leadsRouted30d: 0,
        lastChangedBy: "You",
        lastChangedAt: "just now",
      };
      return [...prev, clone];
    });
    flash(`${id} cloned (paused)`);
  }

  function deleteRule(id: string) {
    setRules((prev) =>
      prev
        .filter((r) => r.id !== id)
        .sort((a, b) => a.priority - b.priority)
        .map((r, i) => ({ ...r, priority: i + 1 })),
    );
    if (selectedId === id) setSelectedId((cur) => (cur === id ? seedRules[0].id : cur));
    flash(`${id} deleted · audit_log written`);
  }

  function openNew() {
    const nextId = `RR-${String(rules.length + 1).padStart(3, "0")}`;
    setDrawer({ mode: "new", draft: blankDraft(nextId) });
  }
  function openEdit(rule: RoutingRule) {
    setSelectedId(rule.id);
    setDrawer({
      mode: "edit",
      draft: {
        id: rule.id,
        source: rule.source,
        sourceMeta: rule.sourceMeta,
        criteria: [...rule.criteria],
        type: rule.type,
        members: rule.members.map((m) => ({ ...m })),
        team: rule.team,
        firstResponseSla: rule.firstResponseSla,
      },
    });
  }

  function submitDraft(draft: RuleDraft) {
    const cleanCriteria = draft.criteria.map((c) => c.trim()).filter(Boolean);
    if (drawer?.mode === "new") {
      const rule: RoutingRule = {
        id: draft.id,
        source: draft.source,
        sourceMeta: draft.sourceMeta,
        criteria: cleanCriteria,
        type: draft.type,
        members: draft.members,
        team: draft.team,
        status: "active",
        priority: rules.length + 1,
        leadsRouted30d: 0,
        firstResponseSla: draft.firstResponseSla,
        lastChangedBy: "You",
        lastChangedAt: "just now",
      };
      setRules((prev) => [...prev, rule]);
      setSelectedId(rule.id);
      flash(`${rule.id} created`);
    } else {
      setRules((prev) =>
        prev.map((r) =>
          r.id === draft.id
            ? {
                ...r,
                source: draft.source,
                criteria: cleanCriteria,
                type: draft.type,
                members: draft.members,
                team: draft.team,
                firstResponseSla: draft.firstResponseSla,
                lastChangedBy: "You",
                lastChangedAt: "just now",
              }
            : r,
        ),
      );
      flash(`${draft.id} saved`);
    }
    setDrawer(null);
  }

  /* Proposed AI actions — Run streams a real draft INLINE into the card. */
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
        "Chase Bright holds 47% of RR-001 volume vs a 33% target. Andy Wilcox's first-response time is 2.1× the team median. Lower Ava's weight 3→2 to even distribution.",
      confidence: "Medium",
    },
  ];

  function runAction(a: AIAction) {
    const key = a.id ?? a.title;
    setActionState((prev) => ({ ...prev, [key]: { running: true, result: "" } }));
    void streamActionDraft(a, key);
  }

  async function streamActionDraft(a: AIAction, key: string) {
    try {
      await streamAi(
        {
          tool: "general",
          messages: [
            {
              role: "user",
              content: `You are the MatinOS routing admin assistant. A broker is reviewing this proposed change to lead-routing rules: "${a.title}". Evidence: ${a.evidence}. Write a concise (under 90 words) confirmation of the exact change you will stage, the one audit_log entry it writes, and a one-line revert note. Plain text, no markdown headers.`,
            },
          ],
        },
        (_chunk, full) => {
          setActionState((prev) => ({ ...prev, [key]: { running: true, result: full } }));
        },
      );
      setActionState((prev) => ({ ...prev, [key]: { running: false, result: prev[key]?.result ?? "" } }));
    } catch {
      setActionState((prev) => ({
        ...prev,
        [key]: { running: false, result: "Matin AI is unavailable right now. Please try again." },
      }));
    }
  }

  function rejectAction(a: AIAction) {
    const key = a.id ?? a.title;
    setActionState((prev) => ({ ...prev, [key]: { running: false, result: "Dismissed — no change staged." } }));
  }

  /* ── Table columns ───────────────────────────────────────────────────────── */
  const columns: Column<RoutingRule>[] = [
    {
      key: "source",
      header: "Source",
      width: "23%",
      render: (r) => (
        <span className="flex items-center gap-2">
          <Dot tone={r.status === "active" ? "success" : "info"} />
          <TwoLineCell title={r.source} sub={`${r.id} · SLA ${r.firstResponseSla}`} />
        </span>
      ),
    },
    {
      key: "criteria",
      header: "Criteria",
      width: "24%",
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
      width: "11%",
      render: (r) => <StatusChip tone={r.type === "Blast" ? "warn" : "info"}>{r.type}</StatusChip>,
    },
    {
      key: "members",
      header: "Members",
      width: "13%",
      render: (r) => <MemberCluster members={r.members} />,
    },
    {
      key: "priority",
      header: "Priority",
      align: "center",
      width: "11%",
      render: (r) => (
        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="tabular-nums text-[0.84rem] font-semibold text-ink">{r.priority}</span>
          <span className="flex flex-col text-slate">
            <button type="button" aria-label="Move up" className="hover:text-ink disabled:opacity-30" disabled={r.priority === 1} onClick={() => reorder(r.id, -1)}>
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button type="button" aria-label="Move down" className="hover:text-ink disabled:opacity-30" disabled={r.priority === rules.length} onClick={() => reorder(r.id, 1)}>
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
      width: "18%",
      render: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <GhostButton ariaLabel={`${r.status === "active" ? "Pause" : "Resume"} ${r.id}`} onClick={() => toggleStatus(r.id)}>
            {r.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </GhostButton>
          <GhostButton ariaLabel={`Edit ${r.id}`} onClick={() => openEdit(r)}>
            <Pencil className="h-3.5 w-3.5" />
          </GhostButton>
          <GhostButton ariaLabel={`Clone ${r.id}`} onClick={() => cloneRule(r.id)}>
            <Copy className="h-3.5 w-3.5" />
          </GhostButton>
          <GhostButton ariaLabel={`Delete ${r.id}`} tone="danger" onClick={() => deleteRule(r.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </GhostButton>
        </div>
      ),
    },
  ];

  const totalRouted = rules.reduce((s, r) => s + r.leadsRouted30d, 0);

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        {/* Left: rules table + alerts/automation */}
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">
                  Lead routing rules
                </h2>
                <p className="mt-0.5 text-[0.78rem] text-slate">
                  Evaluated top-to-bottom by priority. First match wins · click a rule to edit.
                </p>
              </div>
              <InkButton icon={<Plus className="h-3.5 w-3.5" />} onClick={openNew}>
                New Rule
              </InkButton>
            </div>

            <DataTable<RoutingRule>
              columns={columns}
              rows={sorted}
              getRowId={(r) => r.id}
              onRowClick={(r) => openEdit(r)}
              utilityLeft={
                <span className="text-[0.78rem] text-slate tabular-nums">
                  {rules.length} rules · {totalRouted.toLocaleString()} leads routed in 30 days
                </span>
              }
            />
          </section>

          <section>
            <div className="mb-3">
              <h2 className="font-display text-[1.1rem] font-normal leading-tight text-ink">
                Behavioral alerts vs automation
              </h2>
              <p className="mt-0.5 text-[0.78rem] text-slate">
                Left = what notifies a human. Right = what the system does on its own. Toggle to change.
              </p>
            </div>
            <AlertsAutomationGrid />
          </section>
        </div>

        {/* Right: selected-rule ownership + AI panel */}
        <div className="space-y-5">
          <OwnershipCard rule={selected} />

          <AiPanel
            context={`Admin / Lead Routing — ${selected.id}`}
            messages={[
              {
                role: "ai",
                text: (
                  <>
                    {selected.id} is {selected.status === "active" ? "active" : "paused"} ·{" "}
                    {selected.leadsRouted30d.toLocaleString()} leads / 30d. I checked all {rules.length} rules
                    for overlap and weight imbalance — {aiActions.length} advisories below. None auto-fire;
                    routing changes are approval-gated. Run one to stream the staged change inline.
                  </>
                ),
                citations: ["routing_rules", "leads.source", "agents.responseTime"],
              },
            ]}
            actions={aiActions}
            actionState={actionState}
            onRunAction={runAction}
            onRejectAction={rejectAction}
          >
            <div className="flex items-center justify-between gap-2 rounded-xl border border-ink-700 bg-ink-800 px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[0.8rem] text-slate-300">
                <Banknote className="h-3.5 w-3.5 text-gold" />
                {selected.firstResponseSla} SLA · {selected.type}
              </p>
              <button
                type="button"
                onClick={() => openAi(`Context: Admin / Routing — ${selected.id} ${selected.source}`)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gold/40 px-2.5 py-1 text-[0.74rem] font-semibold text-gold transition-colors hover:bg-gold/10"
              >
                <MatinMark theme="white" className="h-3 w-3" />
                Ask Matin
              </button>
            </div>
          </AiPanel>

          <CalloutCard tone="system" title="Routing engine health">
            All {rules.filter((r) => r.status === "active").length} active rules evaluated in{" "}
            <span className="text-cloud">42ms</span> median. Last simulated-lead test passed at{" "}
            <span className="text-cloud">06:12</span> · 0 unrouted leads in the last 30 days.
          </CalloutCard>
        </div>
      </div>

      <RuleFormDrawer
        open={drawer != null}
        mode={drawer?.mode ?? "new"}
        initial={drawer?.draft ?? null}
        onClose={() => setDrawer(null)}
        onSubmit={submitDraft}
      />

      {/* Inline confirmation toast */}
      {toast ? (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-40 -translate-x-1/2">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[0.8rem] font-medium text-cloud shadow-lift">
            <CircleCheck className="h-4 w-4 text-success" />
            {toast}
          </div>
        </div>
      ) : null}
    </>
  );
}
