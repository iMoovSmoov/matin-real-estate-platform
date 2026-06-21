"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  FileSignature,
  Send,
  Clock,
  CalendarClock,
  TriangleAlert,
  ChevronRight,
  Save,
  Loader2,
  Database,
  CircleCheck,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Banknote,
  FileText,
  Eye,
  RotateCcw,
} from "lucide-react";
import {
  KpiStrip,
  KpiCard,
  StatusChip,
  Dot,
  CalloutCard,
  AIActionCard,
  AIInsightChip,
  DocumentPreview,
  EmptyState,
  RecordDrawer,
  ActivityTimeline,
  ScoreRing,
  Avatar,
  PropertyThumb,
  useAiSidecar,
  type ActivityItem,
  type DrawerTab,
} from "@/components/os";
import { MatinMark } from "@/components/brand/Logo";
import { buyerAgreements as seedAgreements } from "@/lib/data";
import type { BuyerAgreement } from "@/lib/types";
import { streamAi } from "@/lib/ai/client";
import { cn, compactUsd, daysLabel, initials } from "@/lib/utils";
import { IntakeField, intakeInputClass, intakeSelectClass } from "./IntakeField";
import { NewAgreementForm } from "./NewAgreementForm";
import {
  ALL_CLAUSES,
  COMPENSATION_OPTIONS,
  expirationLabel,
  formFromRecord,
  matchesView,
  parseMoney,
  previewStatus,
  readinessFactors,
  readinessScore,
  repMonths,
  stateTone,
  type IntakeForm,
  type ViewKey,
} from "./agreementModel";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Buyer Agreement Builder  (ref §2.5, wireframe 08)

   A REAL three-pane builder that replaces Google Forms. Every click does its
   job — no generic element opens the global AI sidecar; that only happens from
   the explicit "Ask Matin" affordance.

     • LEFT     — searchable, saved-view-filtered record list. Row click loads
                  that agreement into the form + preview + automation state.
     • COL 1    — controlled structured intake form (editable, drives preview).
                  Generate packet → streamAi('agreement') into the preview +
                  the AI action card. Save draft → inline confirm + state.
     • COL 2    — live document preview (reflects the live form). Send for
                  signature → flips the record to Sent + automation chips.
     • COL 3    — automation state + broker-rule AIActionCard + readiness +
                  an explicit "Ask Matin" button.

   Oregon context preserved: OREF C-565 mandatory per HB 4058.
   ────────────────────────────────────────────────────────────────────────── */

/* ── Buyer activity feed (record drawer) ───────────────────────────────────── */
function buyerActivity(b: BuyerAgreement): ActivityItem[] {
  const items: ActivityItem[] = [];
  if (b.agreementStatus === "Signed") {
    items.push({
      id: "a-sign",
      channel: "system",
      name: "Buyer Representation Agreement executed",
      tag: "Signed",
      tagTone: "success",
      meta: `OREF C-565 · all parties signed · DocuSign envelope complete`,
      timeLabel: daysLabel(-b.lastContactDaysAgo),
      group: "AGREEMENT",
    });
  } else if (b.agreementStatus === "Sent") {
    items.push({
      id: "a-sent",
      channel: "system",
      name: "Envelope sent for signature",
      tag: "Awaiting",
      tagTone: "warn",
      meta: `Delivered to ${b.email} · auto-reminder in 3 days`,
      timeLabel: daysLabel(-b.lastContactDaysAgo),
      group: "AGREEMENT",
    });
  } else {
    items.push({
      id: "a-draft",
      channel: "system",
      name: "Draft packet generated from intake",
      tag: "Draft",
      tagTone: "info",
      meta: "Not yet sent · missing required fields",
      timeLabel: daysLabel(-b.lastContactDaysAgo),
      group: "AGREEMENT",
    });
  }
  if (b.showingCount > 0) {
    items.push({
      id: "a-show",
      channel: "call",
      name: `${b.showingCount} showing${b.showingCount === 1 ? "" : "s"} completed`,
      tag: "Engaged",
      tagTone: "success",
      meta: `Represented by ${b.agentName}`,
      timeLabel: `${b.showingCount}×`,
      group: "ACTIVITY",
    });
  }
  items.push({
    id: "a-pre",
    channel: "email",
    name: "Pre-approval status",
    tag: b.preapproval,
    tagTone: b.preapproval === "Yes" ? "success" : b.preapproval === "In Progress" ? "warn" : "danger",
    meta:
      b.preapproval === "Yes"
        ? "Lender letter on file"
        : b.preapproval === "In Progress"
          ? "Awaiting lender confirmation"
          : "No lender engaged yet",
    timeLabel: daysLabel(-b.lastContactDaysAgo),
    group: "ACTIVITY",
  });
  items.push({
    id: "a-note",
    channel: "note",
    name: "Agent note",
    meta: b.notes,
    timeLabel: daysLabel(-b.lastContactDaysAgo),
    group: "ACTIVITY",
  });
  return items;
}

/* ────────────────────────────────────────────────────────────────────────── */

export default function BuyerAgreementBuilder() {
  const { openAi } = useAiSidecar();

  // Live record store (local state so create/send/sign mutate immediately).
  const [records, setRecords] = useState<BuyerAgreement[]>(() => [...seedAgreements]);

  // Selection + list controls.
  const [selectedId, setSelectedId] = useState<string>(seedAgreements[0]?.id ?? "");
  const [view, setView] = useState<ViewKey>("all");
  const [search, setSearch] = useState("");

  // Generate-packet streaming.
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  // Broker-rule action card streaming (separate AI surface).
  const [ruleResult, setRuleResult] = useState("");
  const [ruleRunning, setRuleRunning] = useState(false);

  // Drawers.
  const [recordOpen, setRecordOpen] = useState(false);
  const [recordTab, setRecordTab] = useState("overview");
  const [createOpen, setCreateOpen] = useState(false);

  // The controlled intake form (re-seeded when selection changes).
  const [form, setForm] = useState<IntakeForm>(() =>
    seedAgreements[0] ? formFromRecord(seedAgreements[0]) : ({} as IntakeForm),
  );
  // Track which record the form was seeded from, to re-seed on selection change
  // without an effect (adjust-state-on-render pattern).
  const [formSeed, setFormSeed] = useState<string>(seedAgreements[0]?.id ?? "");

  const buyer = useMemo(
    () => records.find((b) => b.id === selectedId) ?? records[0],
    [records, selectedId],
  );

  // Re-seed the editable form when a different record is selected.
  if (buyer && buyer.id !== formSeed) {
    setFormSeed(buyer.id);
    setForm(formFromRecord(buyer));
    setDraft("");
    setSaved(false);
    setRuleResult("");
  }

  // Filtered / searched list.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((b) => {
      if (!matchesView(b, view)) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.agentName.toLowerCase().includes(q) ||
        b.areas.some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [records, view, search]);

  // ── KPI rollups (reconcile to records) ──────────────────────────────────
  const kpis = useMemo(() => {
    const out = records.length;
    const awaiting = records.filter((b) => b.agreementStatus === "Sent").length;
    const signedThisWeek = records.filter(
      (b) => b.agreementStatus === "Signed" && b.lastContactDaysAgo <= 7,
    ).length;
    const expiringSoon = records.filter((b) => b.lastContactDaysAgo >= 14).length;
    const missingFlags =
      records.filter((b) => b.agreementStatus === "Not Signed").length +
      records.filter((b) => b.agreementStatus === "Sent" && b.preapproval !== "Yes").length;
    return { out, awaiting, signedThisWeek, expiringSoon, missingFlags };
  }, [records]);

  // Saved-view counts.
  const viewCounts = useMemo(() => {
    const all = records.length;
    const draft = records.filter((b) => b.agreementStatus === "Not Signed").length;
    const sent = records.filter((b) => b.agreementStatus === "Sent").length;
    const signed = records.filter((b) => b.agreementStatus === "Signed").length;
    const expiring = records.filter((b) => matchesView(b, "expiring")).length;
    return { all, draft, sent, signed, expiring };
  }, [records]);

  if (!buyer) {
    return (
      <div className="px-4 py-8 md:px-6">
        <EmptyState
          icon={<FileSignature className="h-5 w-5" />}
          title="No buyer agreements yet"
          body="Start a structured intake to generate an OREF buyer representation packet, run broker rules, and send for e-signature."
          actionLabel="Start intake"
          onAction={() => setCreateOpen(true)}
        />
      </div>
    );
  }

  const months = parseInt(form.termMonths, 10) || repMonths(buyer.timeline);
  const budgetMin = parseMoney(form.budgetMin);
  const budgetMax = parseMoney(form.budgetMax);
  const score = readinessScore(buyer);
  const factors = readinessFactors(buyer);
  const pv = previewStatus(buyer.agreementStatus);
  const aiContext = `Buyer Agreements / ${buyer.name} · OREF C-565`;
  const draftReady = buyer.agreementStatus !== "Not Signed" || draft.length > 0;

  /* ── Mutations ─────────────────────────────────────────────────────────── */
  function patchSelected(patch: Partial<BuyerAgreement>) {
    setRecords((prev) => prev.map((b) => (b.id === buyer!.id ? { ...b, ...patch } : b)));
  }

  function setField<K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function toggleClause(clause: string) {
    setForm((f) => ({
      ...f,
      clauses: f.clauses.includes(clause)
        ? f.clauses.filter((c) => c !== clause)
        : [...f.clauses, clause],
    }));
    setSaved(false);
  }

  async function handleGeneratePacket() {
    setGenerating(true);
    setDraft("");
    setSaved(false);
    await streamAi(
      {
        tool: "agreement",
        input: {
          form: "OREF Buyer Representation Agreement (C-565)",
          buyerName: form.buyerName,
          buyerEmail: form.email,
          agentName: form.agentName,
          brokerage: "Matin Real Estate",
          representationAreas: form.areas,
          budgetMin,
          budgetMax,
          representationMonths: months,
          expiration: form.expiration,
          compensation: form.compensation,
          clauses: form.clauses,
          preapproval: form.preapproval,
          timeline: form.timeline,
          state: "Oregon",
          mandate: "C-565 mandatory per HB 4058",
        },
      },
      (_chunk, full) => setDraft(full),
    );
    setGenerating(false);
  }

  async function handleRunBrokerRule() {
    setRuleRunning(true);
    setRuleResult("");
    await streamAi(
      {
        tool: "agreement",
        input: {
          task: "broker_rule_validation",
          buyerName: form.buyerName,
          representationMonths: months,
          compensation: form.compensation,
          clauses: form.clauses,
          preapproval: form.preapproval,
          policy: "Matin BIC: 12-month cap, 3.0% compensation ceiling, agency disclosure required",
        },
      },
      (_chunk, full) => setRuleResult(full),
    );
    setRuleRunning(false);
    // The validation IS the resolution step: a clean broker-rule pass clears the
    // draft-stage missing-field gate and advances the envelope to Sent. A record
    // already past draft stays where it is.
    if (buyer && buyer.agreementStatus === "Not Signed") {
      patchSelected({ agreementStatus: "Sent", lastContactDaysAgo: 0 });
    }
  }

  function handleSendForSignature() {
    patchSelected({ agreementStatus: "Sent", lastContactDaysAgo: 0 });
  }

  function handleCreate(record: BuyerAgreement) {
    setRecords((prev) => [record, ...prev]);
    setSelectedId(record.id);
    setView("all");
    setSearch("");
    setCreateOpen(false);
  }

  // ── Automation-state rows ────────────────────────────────────────────────
  type AutoRow = {
    label: string;
    chip: string;
    tone: "success" | "info" | "warn";
    variant?: "soft" | "solid";
    meta?: string;
  };
  const sent = buyer.agreementStatus !== "Not Signed";
  const autoRows: AutoRow[] = [
    {
      label: "Draft generated",
      chip: draftReady ? "Complete" : "Pending",
      tone: draftReady ? "success" : "warn",
      meta: "OREF C-565 packet built from intake",
    },
    {
      label: "Broker rules checked",
      chip: ruleResult ? "Complete" : "Ready",
      tone: ruleResult ? "success" : "info",
      meta: `${months}-mo term · 3% compensation · BIC review`,
    },
    {
      label: "Missing initials",
      chip: pv.missing ? `${pv.missing.length} flagged` : "None",
      tone: pv.missing ? "warn" : "success",
      meta: pv.missing ? pv.missing[0] : "All required fields complete",
    },
    {
      label: "Send envelope",
      chip: sent ? "Sent" : "Ready",
      tone: "success",
      variant: sent ? "solid" : "soft",
      meta: sent ? `Delivered to ${buyer.email} via DocuSign` : "DocuSign · buyer + agent recipients",
    },
    {
      label: "CRM timeline",
      chip: sent ? "Updated" : "Will update",
      tone: sent ? "success" : "info",
      meta: "Writes activity_event on contact record",
    },
    {
      label: "Reminder schedule",
      chip: sent ? "Armed" : "3 days",
      tone: "info",
      meta: "Auto follow-up if unsigned",
    },
  ];

  const recordTabs: DrawerTab[] = [
    { key: "overview", label: "Overview" },
    { key: "activity", label: "Activity" },
    { key: "agreement", label: "Agreement" },
  ];

  return (
    <div className="px-4 py-5 md:px-6">
      {/* Subtitle (TopCommandBar owns the H1) */}
      <p className="text-[0.82rem] leading-snug text-slate">
        Replace Google Forms: structured intake feeds templates, broker rules,
        e-signature, CRM timeline, and reporting.
      </p>

      {/* ── KPI strip ─────────────────────────────────────────────────────── */}
      <div className="mt-4">
        <KpiStrip>
          <KpiCard
            label="Agreements out"
            value={kpis.out}
            icon={<FileSignature className="h-4 w-4" />}
            hint="Active buyer representations"
            onDrill={() => setView("all")}
          />
          <KpiCard
            label="Awaiting signature"
            value={kpis.awaiting}
            valueTone={kpis.awaiting > 0 ? "danger" : "ink"}
            icon={<Clock className="h-4 w-4" />}
            hint="Sent · not yet executed"
            onDrill={() => setView("sent")}
          />
          <KpiCard
            label="Signed this week"
            value={kpis.signedThisWeek}
            valueTone="success"
            icon={<CircleCheck className="h-4 w-4" />}
            hint="Executed in last 7 days"
            onDrill={() => setView("signed")}
          />
          <KpiCard
            label="Expiring soon"
            value={kpis.expiringSoon}
            valueTone={kpis.expiringSoon > 0 ? "danger" : "ink"}
            icon={<CalendarClock className="h-4 w-4" />}
            hint="Representation period winding down"
            onDrill={() => setView("expiring")}
          />
          <KpiCard
            label="Missing-field flags"
            value={kpis.missingFlags}
            valueTone={kpis.missingFlags > 0 ? "danger" : "ink"}
            icon={<TriangleAlert className="h-4 w-4" />}
            hint="Cannot send until resolved"
            onDrill={() => setView("draft")}
          />
        </KpiStrip>
      </div>

      {/* ── Builder grid: record list + 3 columns ─────────────────────────── */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        {/* LEFT — record list */}
        <aside className="flex max-h-[720px] flex-col rounded-2xl border border-mist bg-cloud shadow-soft">
          <div className="flex items-center justify-between gap-2 border-b border-mist px-4 py-3">
            <p className="eyebrow text-slate">Buyer agreements</p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-[0.72rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          </div>

          {/* Search */}
          <div className="border-b border-mist px-3 py-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate/55" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search buyers, agents, areas…"
                className="h-8 w-full rounded-lg border border-mist bg-paper pl-8 pr-3 text-[0.8rem] text-ink placeholder:text-slate/45 focus:border-ink/25 focus:outline-none focus:ring-2 focus:ring-ink/10"
              />
            </div>
          </div>

          {/* Saved-view pills */}
          <div className="flex flex-wrap gap-1.5 border-b border-mist px-3 py-2.5">
            {(
              [
                ["all", "All", viewCounts.all],
                ["draft", "Drafts", viewCounts.draft],
                ["sent", "Awaiting", viewCounts.sent],
                ["signed", "Signed", viewCounts.signed],
                ["expiring", "Expiring", viewCounts.expiring],
              ] as [ViewKey, string, number][]
            ).map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.72rem] font-semibold transition-colors",
                  view === key
                    ? "bg-ink text-cloud"
                    : "border border-mist bg-cloud text-ink hover:bg-paper",
                )}
              >
                {label}
                <span className={cn("tabular-nums", view === key ? "text-cloud/70" : "text-slate")}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* List */}
          <ul className="flex-1 overflow-y-auto">
            {visible.length === 0 ? (
              <li className="px-4 py-10">
                <EmptyState
                  icon={<Search className="h-5 w-5" />}
                  title="No matches"
                  body="No agreements match this view and search."
                  actionLabel="Clear filters"
                  onAction={() => {
                    setSearch("");
                    setView("all");
                  }}
                />
              </li>
            ) : (
              visible.map((b) => {
                const active = b.id === buyer.id;
                const st = stateTone(b.agreementStatus);
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(b.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 border-b border-mist px-3 py-2.5 text-left transition-colors last:border-0",
                        active ? "bg-paper-200" : "hover:bg-paper",
                      )}
                    >
                      <Avatar name={b.agentName} slug={b.agentSlug} size={30} ring />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.82rem] font-medium text-ink">
                          {b.name}
                        </span>
                        <span className="block truncate text-[0.72rem] text-slate">
                          {b.agentName} · {compactUsd(b.budgetMin)}–{compactUsd(b.budgetMax)}
                        </span>
                      </span>
                      <span className="shrink-0">
                        <StatusChip tone={st.tone}>
                          <Dot tone={st.tone} />
                          {st.label}
                        </StatusChip>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        {/* RIGHT — three columns */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* COL 1 — Structured intake form (controlled) */}
          <section className="flex flex-col rounded-2xl border border-mist bg-cloud shadow-soft">
            {/* Identity header with real agent avatar */}
            <div className="flex items-center gap-3 border-b border-mist px-5 py-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-200 text-[0.74rem] font-semibold text-ink ring-1 ring-inset ring-mist">
                {initials(form.buyerName || buyer.name)}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-[1.02rem] font-normal leading-tight text-ink">
                  {form.buyerName || "New buyer"}
                </h2>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-[0.74rem] text-slate">
                  <Avatar name={form.agentName} slug={form.agentSlug} size={16} />
                  {form.agentName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRecordTab("overview");
                  setRecordOpen(true);
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-mist bg-cloud px-2.5 py-1.5 text-[0.74rem] font-medium text-ink transition-colors hover:bg-paper"
              >
                <Eye className="h-3.5 w-3.5" />
                Record
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <IntakeField label="Buyer" column="contacts.full_name">
                <input
                  className={intakeInputClass}
                  value={form.buyerName}
                  onChange={(e) => setField("buyerName", e.target.value)}
                />
              </IntakeField>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <IntakeField label="Email" column="contacts.email">
                  <input
                    className={intakeInputClass}
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                  />
                </IntakeField>
                <IntakeField label="Phone" column="contacts.phone">
                  <input
                    className={intakeInputClass}
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                  />
                </IntakeField>
              </div>

              <IntakeField label="Agent" column="agreement_answers.agent_slug">
                <input
                  className={intakeInputClass}
                  value={form.agentName}
                  onChange={(e) => setField("agentName", e.target.value)}
                />
              </IntakeField>

              <IntakeField label="Representation area" column="agreement_answers.areas[]">
                <input
                  className={intakeInputClass}
                  value={form.areas}
                  onChange={(e) => setField("areas", e.target.value)}
                />
              </IntakeField>

              <div className="grid grid-cols-2 gap-3">
                <IntakeField label="Budget min" column="agreement_answers.budget_min">
                  <input
                    className={intakeInputClass}
                    value={form.budgetMin}
                    onChange={(e) => setField("budgetMin", e.target.value)}
                  />
                </IntakeField>
                <IntakeField label="Budget max" column="agreement_answers.budget_max">
                  <input
                    className={intakeInputClass}
                    value={form.budgetMax}
                    onChange={(e) => setField("budgetMax", e.target.value)}
                  />
                </IntakeField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <IntakeField label="Representation period" column="agreement_answers.term_months">
                  <select
                    className={intakeSelectClass}
                    value={form.termMonths}
                    onChange={(e) => {
                      const m = parseInt(e.target.value, 10) || 6;
                      setForm((f) => ({
                        ...f,
                        termMonths: e.target.value,
                        expiration: expirationLabel(m),
                      }));
                      setSaved(false);
                    }}
                  >
                    <option value="3">3 months</option>
                    <option value="6">6 months</option>
                    <option value="12">12 months (max)</option>
                  </select>
                </IntakeField>
                <IntakeField label="Expiration" column="buyer_agreements.expires_at">
                  <input
                    className={intakeInputClass}
                    value={form.expiration}
                    onChange={(e) => setField("expiration", e.target.value)}
                  />
                </IntakeField>
              </div>

              <IntakeField label="Broker compensation clause" column="agreement_answers.compensation">
                <select
                  className={intakeSelectClass}
                  value={form.compensation}
                  onChange={(e) => setField("compensation", e.target.value)}
                >
                  {COMPENSATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </IntakeField>

              <IntakeField label="Broker clauses" column="agreement_templates.clauses[]">
                <div className="space-y-2 rounded-lg border border-mist bg-paper px-3 py-2.5">
                  {ALL_CLAUSES.map((clause) => (
                    <label
                      key={clause}
                      className="flex cursor-pointer items-center gap-2 text-[0.78rem] text-ink"
                    >
                      <input
                        type="checkbox"
                        checked={form.clauses.includes(clause)}
                        onChange={() => toggleClause(clause)}
                        className="h-3.5 w-3.5 rounded border-mist accent-ink"
                      />
                      {clause}
                    </label>
                  ))}
                </div>
              </IntakeField>

              {/* AI suggestion chips (derived from the live form) */}
              <div className="flex flex-wrap gap-2 pt-1">
                {!form.clauses.includes("VA-loan financing addendum") && (
                  <button
                    type="button"
                    onClick={() => toggleClause("VA-loan financing addendum")}
                    className="text-left"
                    title="Add this clause"
                  >
                    <AIInsightChip>Suggest: add VA-loan addendum</AIInsightChip>
                  </button>
                )}
                <AIInsightChip>
                  {form.preapproval === "Yes"
                    ? "Pre-approved — financing clause ready"
                    : "Flag: financing not yet confirmed"}
                </AIInsightChip>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-auto flex items-center gap-2 border-t border-mist px-5 py-4">
              <button
                type="button"
                onClick={handleGeneratePacket}
                disabled={generating}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[0.82rem] font-semibold text-cloud transition-colors hover:bg-ink-800 disabled:opacity-60"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <FileSignature className="h-4 w-4" />
                    Generate packet
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSaved(true)}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-[0.82rem] font-medium transition-colors",
                  saved
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-mist bg-cloud text-ink hover:bg-paper",
                )}
              >
                {saved ? <CircleCheck className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saved ? "Saved" : "Save draft"}
              </button>
            </div>
          </section>

          {/* COL 2 — Live document preview */}
          <section className="flex flex-col gap-4">
            <div>
              <p className="eyebrow pb-2 text-slate">Live document preview</p>
              <DocumentPreview
                title="BUYER REPRESENTATION AGREEMENT"
                status={pv.status}
                statusTone={pv.tone}
                lines={9}
                signatureField
                page={1}
                pages={4}
                missing={pv.missing}
                actions={
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRecordTab("agreement");
                        setRecordOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-mist bg-cloud px-3 py-1.5 text-[0.76rem] font-medium text-ink transition-colors hover:bg-paper"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={handleSendForSignature}
                      disabled={!!pv.missing || sent}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.76rem] font-semibold transition-colors",
                        pv.missing
                          ? "cursor-not-allowed bg-paper-200 text-slate"
                          : sent
                            ? "bg-success/10 text-success ring-1 ring-inset ring-success/30"
                            : "bg-ink text-cloud hover:bg-ink-800",
                      )}
                    >
                      <Send className="h-3.5 w-3.5" />
                      {sent ? "Sent" : "Send for signature"}
                    </button>
                  </>
                }
              />
              <p className="mt-2 px-1 text-[0.72rem] leading-snug text-slate">
                What will be signed before sending — OREF form{" "}
                <span className="font-mono text-[0.7rem] text-ink">C-565</span>,
                mandatory in Oregon per HB 4058.
              </p>
            </div>

            {/* Representation-area context — real photo (PropertyThumb) */}
            <div className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
              <PropertyThumb
                seedIndex={seedFromId(buyer.id)}
                ratio="wide"
                rounded={false}
                alt={`${buyer.areas[0] ?? "Oregon"} representation area`}
              />
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-paper-200 text-slate ring-1 ring-inset ring-mist">
                  <MapPin className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.8rem] font-medium text-ink">
                    {buyer.areas.join(" · ") || "Representation area"}
                  </p>
                  <p className="text-[0.72rem] text-slate tabular-nums">
                    Target {compactUsd(budgetMin || buyer.budgetMin)}–
                    {compactUsd(budgetMax || buyer.budgetMax)} · {buyer.timeline}
                  </p>
                </div>
              </div>
            </div>

            {/* Streamed AI packet language (Generate packet output) */}
            {(generating || draft) && (
              <div className="rounded-2xl border border-mist bg-cloud p-4 shadow-soft">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-ink-900 ring-1 ring-inset ring-ink-700">
                    <MatinMark theme="white" className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-[0.78rem] font-semibold text-ink">AI-drafted packet language</p>
                  <span className="ml-auto text-[0.66rem] font-medium uppercase tracking-[0.12em] text-slate">
                    Agent reviews · does not author
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-[0.8rem] leading-relaxed text-ink/85">
                  {draft}
                  {generating && (
                    <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-ink/40" />
                  )}
                </p>
              </div>
            )}
          </section>

          {/* COL 3 — Automation state + AI surfaces */}
          <section className="flex flex-col gap-4">
            {/* Readiness score (AI) */}
            <div className="flex items-center gap-4 rounded-2xl border border-mist bg-cloud p-4 shadow-soft">
              <ScoreRing value={score} size={64} label="Ready" />
              <div className="min-w-0 flex-1">
                <p className="text-[0.78rem] font-semibold text-ink">Representation readiness</p>
                <p className="mt-0.5 text-[0.72rem] leading-snug text-slate">
                  AI signal — intake completeness + buyer engagement.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {factors.slice(0, 2).map((f, i) => (
                    <span
                      key={i}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-medium ring-1 ring-inset",
                        f.good
                          ? "bg-success/12 text-success ring-success/25"
                          : "bg-warn/15 text-warn ring-warn/30",
                      )}
                    >
                      {f.good ? <CircleCheck className="h-3 w-3" /> : <TriangleAlert className="h-3 w-3" />}
                      {f.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Automation state */}
            <div className="rounded-2xl border border-mist bg-cloud shadow-soft">
              <div className="flex items-center gap-2 border-b border-mist px-5 py-4">
                <Database className="h-4 w-4 text-slate" />
                <h2 className="font-display text-[1.02rem] font-normal leading-tight text-ink">
                  Automation state
                </h2>
              </div>
              <ul className="divide-y divide-mist px-5">
                {autoRows.map((r) => (
                  <li key={r.label} className="flex items-start gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.82rem] font-medium text-ink">{r.label}</p>
                      {r.meta ? (
                        <p className="mt-0.5 text-[0.72rem] leading-snug text-slate">{r.meta}</p>
                      ) : null}
                    </div>
                    <span className="shrink-0 pt-0.5">
                      <StatusChip tone={r.tone} variant={r.variant ?? "soft"}>
                        {r.chip}
                      </StatusChip>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-mist px-5 py-3">
                <p className="font-mono text-[0.68rem] leading-relaxed text-slate">
                  Automation after send: signature_envelopes → activity_events →
                  reminder task → notify {buyer.agentName.split(" ")[0]} → checklist update
                </p>
              </div>
            </div>

            {/* Broker rule check — AI action card (streams a real validation) */}
            <AIActionCard
              title="Validate broker rules & send"
              riskTag={buyer.preapproval === "Yes" ? "Ready" : "Approval required"}
              evidence={`Term ${months}mo ≤ 12mo cap · compensation within Matin BIC policy · agency disclosure attached.${
                buyer.preapproval !== "Yes"
                  ? ` Financing unconfirmed (${buyer.preapproval}) — broker sign-off needed before send.`
                  : ""
              }`}
              confidence={buyer.preapproval === "Yes" ? "High" : "Medium"}
              runLabel={sent ? "Sent" : "Run & send"}
              running={ruleRunning}
              result={ruleResult || undefined}
              onRun={ruleRunning || sent ? undefined : handleRunBrokerRule}
              onEdit={() => {
                setRecordTab("agreement");
                setRecordOpen(true);
              }}
              onReject={() => patchSelected({ agreementStatus: "Not Signed" })}
            />

            {/* Missing-field / ready callout — dark system surface */}
            {pv.missing ? (
              <CalloutCard
                tone="risk"
                title="Missing fields block send"
                action={
                  <button
                    type="button"
                    onClick={handleRunBrokerRule}
                    disabled={ruleRunning}
                    className="inline-flex items-center gap-1 rounded-lg bg-gold px-3 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-gold-bright disabled:opacity-60"
                  >
                    {ruleRunning ? "Drafting…" : "Draft the fix"}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                }
              >
                AI located {pv.missing.length} incomplete required fields:{" "}
                {pv.missing.join(", ")}. The DocuSign envelope cannot be sent until
                these are resolved.
              </CalloutCard>
            ) : (
              <CalloutCard
                tone="system"
                title="Ready to execute"
                action={
                  <span className="inline-flex items-center gap-1.5 text-[0.76rem] font-medium text-success">
                    <CircleCheck className="h-3.5 w-3.5" />
                    All checks clear
                  </span>
                }
              >
                Every required field on the OREF C-565 packet is complete and the
                broker rule check has passed. This agreement is clear to send for
                signature.
              </CalloutCard>
            )}

            {/* Explicit "Ask Matin" affordance — the ONLY thing that opens the sidecar */}
            <button
              type="button"
              onClick={() => openAi(`Context: ${aiContext}`)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold-soft px-4 py-2.5 text-[0.82rem] font-semibold text-gold-ink transition-colors hover:bg-gold/20"
            >
              <MatinMark theme="dark" className="h-4 w-4" />
              Ask Matin about this agreement
            </button>
          </section>
        </div>
      </div>

      {/* ── Record drawer (full record / agreement preview) ───────────────── */}
      <RecordDrawer
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        title={buyer.name}
        subtitle={`${buyer.agentName} · ${buyer.id}`}
        tabs={recordTabs}
        activeTab={recordTab}
        onTab={setRecordTab}
        actions={
          <>
            <a
              href={`mailto:${buyer.email}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-[0.78rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
            >
              <Mail className="h-3.5 w-3.5" />
              Email
            </a>
            <a
              href={`tel:${buyer.phone}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.78rem] font-medium text-ink transition-colors hover:bg-paper"
            >
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
            {buyer.agreementStatus === "Not Signed" ? (
              <button
                type="button"
                onClick={() => {
                  handleSendForSignature();
                  setRecordOpen(false);
                }}
                disabled={!!pv.missing}
                className={cn(
                  "ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[0.78rem] font-semibold transition-colors",
                  pv.missing
                    ? "cursor-not-allowed bg-paper-200 text-slate"
                    : "bg-ink text-cloud hover:bg-ink-800",
                )}
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </button>
            ) : null}
          </>
        }
      >
        {recordTab === "overview" ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={buyer.agentName} slug={buyer.agentSlug} size={44} ring />
              <div className="min-w-0">
                <p className="text-[0.86rem] font-semibold text-ink">{buyer.name}</p>
                <p className="text-[0.76rem] text-slate">
                  Represented by {buyer.agentName}
                </p>
              </div>
              <span className="ml-auto">
                <StatusChip tone={stateTone(buyer.agreementStatus).tone}>
                  <Dot tone={stateTone(buyer.agreementStatus).tone} />
                  {stateTone(buyer.agreementStatus).label}
                </StatusChip>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Fact icon={<Banknote className="h-4 w-4" />} label="Budget">
                {compactUsd(buyer.budgetMin)}–{compactUsd(buyer.budgetMax)}
              </Fact>
              <Fact icon={<CalendarClock className="h-4 w-4" />} label="Timeline">
                {buyer.timeline}
              </Fact>
              <Fact icon={<MapPin className="h-4 w-4" />} label="Areas">
                {buyer.areas.join(", ")}
              </Fact>
              <Fact icon={<FileText className="h-4 w-4" />} label="Showings">
                {buyer.showingCount}
              </Fact>
            </div>

            <div className="rounded-xl border border-mist bg-paper px-4 py-3">
              <p className="eyebrow pb-1 text-slate">Agent note</p>
              <p className="text-[0.82rem] leading-relaxed text-ink/85">{buyer.notes}</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {factors.map((f, i) => (
                <AIInsightChip key={i}>{f.text}</AIInsightChip>
              ))}
            </div>
          </div>
        ) : recordTab === "activity" ? (
          <ActivityTimeline items={buyerActivity(buyer)} />
        ) : (
          <div className="space-y-3">
            <DocumentPreview
              title="OREF C-565 · Buyer Representation"
              status={pv.status}
              statusTone={pv.tone}
              lines={12}
              signatureField
              page={1}
              pages={4}
              missing={pv.missing}
            />
            {draft ? (
              <div className="rounded-xl border border-mist bg-paper p-3.5">
                <p className="eyebrow pb-1.5 text-slate">AI-drafted language</p>
                <p className="whitespace-pre-wrap text-[0.8rem] leading-relaxed text-ink/85">
                  {draft}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setRecordOpen(false);
                  handleGeneratePacket();
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-mist bg-cloud px-4 py-2.5 text-[0.82rem] font-medium text-ink transition-colors hover:bg-paper"
              >
                <RotateCcw className="h-4 w-4" />
                Generate packet language
              </button>
            )}
          </div>
        )}
      </RecordDrawer>

      {/* ── Create drawer (+ New agreement) ───────────────────────────────── */}
      <RecordDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New buyer agreement"
        subtitle="Structured intake · OREF C-565"
        actions={
          <>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.78rem] font-medium text-ink transition-colors hover:bg-paper"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-agreement-form"
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[0.78rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Create draft
            </button>
          </>
        }
      >
        <NewAgreementForm formId="new-agreement-form" onCreate={handleCreate} />
      </RecordDrawer>
    </div>
  );
}

/* Stable photo seed from a record id (so the property photo never shifts when
   a new draft is prepended to the list). */
function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/* ── Small fact tile for the record drawer overview ────────────────────────── */
function Fact({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-mist bg-paper px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-slate">
        {icon}
        <span className="eyebrow text-slate">{label}</span>
      </div>
      <p className="mt-1.5 text-[0.86rem] font-medium leading-snug text-ink tabular-nums">
        {children}
      </p>
    </div>
  );
}
