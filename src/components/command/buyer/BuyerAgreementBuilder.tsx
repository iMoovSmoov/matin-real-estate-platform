"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
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
  ListChecks,
  Home,
  ArrowRight,
} from "lucide-react";
import {
  KpiStrip,
  KpiCard,
  StatusChip,
  Dot,
  CalloutCard,
  AIActionCard,
  AIInsightChip,
  EmptyState,
  RecordDrawer,
  ActivityTimeline,
  ScoreRing,
  Avatar,
  BrandedDocument,
  PaneSwitcher,
  usePaneSwitcher,
  useAiSidecar,
  type ActivityItem,
  type DrawerTab,
} from "@/components/os";
import type { BrandedDocumentField } from "@/components/os/BrandedDocument";
import { MatinMark } from "@/components/brand/Logo";
import { buyerAgreements as seedAgreements, derived, company } from "@/lib/data";
import {
  rosterOption,
  matchedListings,
  SALES_ROSTER,
  type MatchedListing,
} from "@/lib/data/agreement-roster";
import type { BuyerAgreement } from "@/lib/types";
import { streamAi } from "@/lib/ai/client";
import { cn, compactUsd, daysLabel } from "@/lib/utils";
import { IntakeField, intakeInputClass, intakeSelectClass } from "./IntakeField";
import { NewAgreementForm } from "./NewAgreementForm";
import { scrollIntoView } from "./interactions";
import {
  ALL_CLAUSES,
  COMPENSATION_OPTIONS,
  completionFields,
  completionPercent,
  expirationLabel,
  formFromRecord,
  matchesView,
  missingFields,
  parseMoney,
  readinessFactors,
  readinessScore,
  repMonths,
  stateTone,
  type CompletionField,
  type IntakeForm,
  type ViewKey,
} from "./agreementModel";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Buyer Agreement Builder  (ref §2.5, wireframe 08; plan S5 1–10)

   A REAL three-pane builder that replaces Google Forms. Every click does its
   job — no generic element opens the global AI sidecar; that only happens from
   the explicit "Ask Matin" affordance.

     • LEFT     — searchable, saved-view-filtered record list. Row click loads
                  that agreement into the form + branded preview + automation.
     • COL 1    — controlled structured intake form (editable, drives preview).
                  Inputs carry stable ids so the completion checklist can scroll
                  to the exact missing input. Generate packet → streamAi.
     • COL 2    — branded OREF C-565 document (BrandedDocument variant=agreement)
                  with a live field grid (green ✓ / red-outline), completion %,
                  real legal blocks, branded signature, Page 1 of 4 + matched
                  real listings in the budget band + a branded envelope thumbnail.
     • COL 3    — completion checklist (scroll-to-fix), automation chain,
                  broker-rule AIActionCard, readiness radar, explicit "Ask Matin".

   Mobile (R1): below lg a PaneSwitcher (List · Documents · Actions) shows ONE
   pane at a time; selecting a record jumps to Documents.

   Oregon context preserved: OREF C-565 mandatory per HB 4058.
   ────────────────────────────────────────────────────────────────────────── */

/* ── Branded template picker (SkySlope parity, ticket 7) ───────────────────── */
type TemplateKey = "matin" | "oref" | "disclosure";
const TEMPLATES: {
  key: TemplateKey;
  formId: string;
  name: string;
  sub: string;
}[] = [
  { key: "matin", formId: "Matin BA", name: "Matin Buyer Agreement", sub: "House template · broker-reviewed" },
  { key: "oref", formId: "OREF C-565", name: "OREF C-565", sub: "Buyer Representation · HB 4058" },
  { key: "disclosure", formId: "OREF C-530", name: "Initial Agency Disclosure", sub: "Mandatory pamphlet" },
];

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

/** Scroll the source intake input into view + focus it (checklist → input).
   The form is mounted in both the mobile single-pane block and the desktop grid
   (one hidden via CSS at any breakpoint), so the same id can exist twice — pick
   the VISIBLE instance (offsetParent is null for display:none ancestors). */
function focusInput(inputId: string) {
  if (typeof document === "undefined") return;
  const all = Array.from(
    document.querySelectorAll<HTMLElement>(`#${CSS.escape(inputId)}`),
  );
  const el = all.find((n) => n.offsetParent !== null) ?? all[0];
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  // Defer focus so the smooth scroll isn't interrupted on some browsers.
  window.setTimeout(() => el.focus({ preventScroll: true }), 220);
}

/* ────────────────────────────────────────────────────────────────────────── */

export default function BuyerAgreementBuilder() {
  const { openAi } = useAiSidecar();

  // Desktop preview column anchor — scrolled into view when the selected record
  // changes so the in-place document swap is unmistakable. (Mobile panes scroll
  // by id since they mount on demand.)
  const desktopDocsRef = useRef<HTMLDivElement>(null);

  // Mobile pane switcher (R1) — List / Documents / Actions.
  const pane = usePaneSwitcher(
    [
      { key: "list", label: "List", icon: <ListChecks className="h-3.5 w-3.5" /> },
      { key: "docs", label: "Documents", icon: <FileSignature className="h-3.5 w-3.5" /> },
      { key: "actions", label: "Actions", icon: <Database className="h-3.5 w-3.5" /> },
    ],
    "list",
  );

  // Live record store (local state so create/send/sign mutate immediately).
  const [records, setRecords] = useState<BuyerAgreement[]>(() => [...seedAgreements]);

  // Selection + list controls.
  const [selectedId, setSelectedId] = useState<string>(seedAgreements[0]?.id ?? "");
  const [view, setView] = useState<ViewKey>("all");
  const [search, setSearch] = useState("");
  const [template, setTemplate] = useState<TemplateKey>("oref");

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
    const signed = records.filter((b) => b.agreementStatus === "Signed");
    const signedThisWeek = signed.filter((b) => b.lastContactDaysAgo <= 7).length;
    const expiringSoon = records.filter((b) => b.lastContactDaysAgo >= 14).length;
    const missingFlags =
      records.filter((b) => b.agreementStatus === "Not Signed").length +
      records.filter((b) => b.agreementStatus === "Sent" && b.preapproval !== "Yes").length;
    // Money sub-stats (ticket 6): signed $ volume (band midpoint), pipeline, avg term.
    const signedVolume = signed.reduce((s, b) => s + (b.budgetMin + b.budgetMax) / 2, 0);
    const pipeline = records
      .filter((b) => b.agreementStatus !== "Signed")
      .reduce((s, b) => s + (b.budgetMin + b.budgetMax) / 2, 0);
    const avgTerm = Math.round(
      records.reduce((s, b) => s + repMonths(b.timeline), 0) / Math.max(1, records.length),
    );
    return {
      out,
      awaiting,
      signedThisWeek,
      expiringSoon,
      missingFlags,
      signedVolume,
      pipeline,
      avgTerm,
    };
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
  const budgetMin = parseMoney(form.budgetMin) || buyer.budgetMin;
  const budgetMax = parseMoney(form.budgetMax) || buyer.budgetMax;
  const score = readinessScore(buyer);
  const factors = readinessFactors(buyer);
  const fields = completionFields(form);
  const missing = missingFields(form);
  const completion = completionPercent(form);
  const sent = buyer.agreementStatus !== "Not Signed";
  const signed = buyer.agreementStatus === "Signed";
  const canSend = missing.length === 0 && !sent;
  const aiContext = `Buyer Agreements / ${buyer.name} · OREF C-565`;
  const draftReady = sent || draft.length > 0;

  // Real matched listings in the buyer's representation area + budget band.
  const matches = matchedListings(
    form.areas.split(",").map((a) => a.trim()).filter(Boolean),
    budgetMin,
    budgetMax,
    3,
  );

  // Real agent identity for the branded signature block.
  const signatureAgent = rosterOption(form.agentSlug) ?? {
    slug: buyer.agentSlug,
    name: form.agentName || buyer.agentName,
    title: "Broker",
    phone: buyer.phone,
    email: buyer.email,
  };

  // Branded-document field grid (live values → green/red).
  const docFields: BrandedDocumentField[] = fields.map((f) => ({
    label: f.label,
    value: f.value,
    filled: f.filled,
  }));

  const tmpl = TEMPLATES.find((t) => t.key === template) ?? TEMPLATES[1];

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

  // Is the lg+ (desktop) grid the one currently on screen? Below lg the mobile
  // single-pane stack is visible and the pane switcher governs what's shown.
  function isDesktopWidth() {
    return typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
  }

  /** Scroll whichever record-list instance is currently on screen (the list
     `aside` is mounted in both the mobile + desktop layouts; one is hidden).
     Resolved post-render so a just-switched mobile List pane is found. */
  function scrollListIntoView() {
    if (typeof document === "undefined") return;
    scrollIntoView(() => {
      const lists = Array.from(
        document.querySelectorAll<HTMLElement>("[data-buyer-list]"),
      );
      return lists.find((n) => n.offsetParent !== null) ?? lists[0] ?? null;
    }, "start");
  }

  /** KPI tile drilldown — set the saved view AND surface the filtered list so
     the result is visible (mobile: jump to List pane; both: scroll list in). */
  function drillView(next: ViewKey) {
    setView(next);
    if (!isDesktopWidth()) pane.go("list");
    scrollListIntoView();
  }

  function selectRecord(id: string) {
    setSelectedId(id);
    if (isDesktopWidth()) {
      // Desktop: the preview column updates in place — scroll it into view so
      // the change is unmistakable even if the user had scrolled the page.
      scrollIntoView(desktopDocsRef.current, "start");
    } else {
      // Mobile: jump to the Documents pane and scroll its (freshly-mounted) top
      // into view (R1). Scroll by id so the lookup runs AFTER the pane renders.
      pane.go("docs");
      scrollIntoView("buyer-pane-docs", "start");
    }
  }

  /** Focus + scroll a source intake input, guaranteeing its pane is visible
     first (on mobile the form lives in the Documents pane). */
  function fixField(inputId: string) {
    if (!isDesktopWidth() && !pane.is("docs")) {
      pane.go("docs");
      // Let the docs pane mount before the input can be found/scrolled to.
      window.requestAnimationFrame(() => focusInput(inputId));
      return;
    }
    focusInput(inputId);
  }

  async function handleGeneratePacket() {
    setGenerating(true);
    setDraft("");
    setSaved(false);
    // Scroll the streaming result region into view so the user SEES output land
    // (the draft block lives further down the preview column / actions stack).
    if (!isDesktopWidth()) pane.go("docs");
    scrollIntoView("buyer-draft-result", "start");
    await streamAi(
      {
        tool: "agreement",
        input: {
          form: tmpl.formId,
          buyerName: form.buyerName,
          buyerEmail: form.email,
          agentName: form.agentName,
          brokerage: company.name,
          office: `${company.address.street}, ${company.address.city} ${company.address.state}`,
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
    if (buyer && buyer.agreementStatus === "Not Signed" && missing.length === 0) {
      patchSelected({ agreementStatus: "Sent", lastContactDaysAgo: 0 });
    }
  }

  function handleSendForSignature() {
    if (missing.length > 0 || sent) return;
    patchSelected({ agreementStatus: "Sent", lastContactDaysAgo: 0 });
  }

  function handleCreate(record: BuyerAgreement) {
    setRecords((prev) => [record, ...prev]);
    setSelectedId(record.id);
    setView("all");
    setSearch("");
    setCreateOpen(false);
    pane.go("docs");
  }

  // ── Automation chain rows ────────────────────────────────────────────────
  const autoRows = [
    {
      label: "Draft generated",
      chip: draftReady ? "Complete" : "Pending",
      tone: (draftReady ? "success" : "warn") as "success" | "warn" | "info",
      variant: "soft" as const,
      meta: `${tmpl.formId} packet built from intake`,
    },
    {
      label: "Broker rules checked",
      chip: ruleResult ? "Complete" : "Ready",
      tone: (ruleResult ? "success" : "info") as "success" | "warn" | "info",
      variant: "soft" as const,
      meta: `${months}-mo term · 3% compensation · BIC review`,
    },
    {
      label: "Missing fields",
      chip: missing.length ? `${missing.length} flagged` : "None",
      tone: (missing.length ? "warn" : "success") as "success" | "warn" | "info",
      variant: "soft" as const,
      meta: missing.length ? missing[0].hint : "All required fields complete",
    },
    {
      label: "Send for signature",
      chip: sent ? "Sent" : canSend ? "Ready" : "Blocked",
      tone: (sent ? "success" : canSend ? "info" : "warn") as "success" | "warn" | "info",
      variant: sent ? ("solid" as const) : ("soft" as const),
      meta: sent ? `Delivered to ${buyer.email} via DocuSign` : "DocuSign · buyer + agent recipients",
    },
    {
      label: "Buyer's timeline",
      chip: sent ? "Updated" : "Will update",
      tone: (sent ? "success" : "info") as "success" | "warn" | "info",
      variant: "soft" as const,
      meta: "Logged to the buyer's activity timeline",
    },
    {
      label: "Reminder schedule",
      chip: sent ? "Armed" : "3 days",
      tone: "info" as const,
      variant: "soft" as const,
      meta: "Auto follow-up if unsigned",
    },
  ];

  const recordTabs: DrawerTab[] = [
    { key: "overview", label: "Overview" },
    { key: "activity", label: "Activity" },
    { key: "agreement", label: "Agreement" },
  ];

  /* ── Pane bodies ──────────────────────────────────────────────────────── */

  const ListPane = (
    <aside
      data-buyer-list
      className="flex max-h-[720px] flex-col rounded-2xl border border-mist bg-cloud shadow-soft scroll-mt-20"
    >
      <div className="flex items-center justify-between gap-2 border-b border-mist px-4 py-3">
        <p className="eyebrow text-slate">Buyer agreements</p>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-[0.72rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
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
            className="h-10 w-full rounded-lg border border-mist bg-paper pl-8 pr-3 text-[0.8rem] text-ink placeholder:text-slate/45 focus:border-ink/25 focus:outline-none focus:ring-2 focus:ring-ink/10"
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
              "inline-flex min-h-9 items-center gap-1 rounded-full px-2.5 py-1 text-[0.72rem] font-semibold transition-colors",
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
      <ul key={`${view}:${search}`} className="flex-1 overflow-y-auto motion-safe:animate-fade">
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
                  onClick={() => selectRecord(b.id)}
                  className={cn(
                    "flex min-h-[44px] w-full items-center gap-2.5 border-b border-mist px-3 py-2.5 text-left transition-colors last:border-0",
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
  );

  const FormColumn = (
    <section className="flex min-w-0 flex-col rounded-2xl border border-mist bg-cloud shadow-soft">
      {/* Identity header with real agent avatar */}
      <div className="flex items-center gap-3 border-b border-mist px-5 py-4">
        <Avatar name={form.buyerName || buyer.name} size={36} ring />
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
          className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg border border-mist bg-cloud px-2.5 py-1.5 text-[0.74rem] font-medium text-ink transition-colors hover:bg-paper"
        >
          <Eye className="h-3.5 w-3.5" />
          Record
        </button>
      </div>

      <div className="space-y-4 px-5 py-4">
        <IntakeField label="Buyer">
          <input
            id="f-buyer"
            className={intakeInputClass}
            value={form.buyerName}
            onChange={(e) => setField("buyerName", e.target.value)}
          />
        </IntakeField>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <IntakeField label="Email">
            <input
              id="f-email"
              className={intakeInputClass}
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
          </IntakeField>
          <IntakeField label="Phone">
            <input
              id="f-phone"
              className={intakeInputClass}
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </IntakeField>
        </div>

        <IntakeField label="Agent">
          <select
            id="f-agent"
            className={intakeSelectClass}
            value={form.agentSlug}
            onChange={(e) => {
              const slug = e.target.value;
              const a = rosterOption(slug);
              setForm((f) => ({ ...f, agentSlug: slug, agentName: a?.name ?? f.agentName }));
              setSaved(false);
            }}
          >
            {/* Keep the current record's agent selectable even if support-only */}
            {!SALES_ROSTER.some((a) => a.slug === form.agentSlug) ? (
              <option value={form.agentSlug}>{form.agentName}</option>
            ) : null}
            {SALES_ROSTER.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name} — {a.title}
              </option>
            ))}
          </select>
        </IntakeField>

        <IntakeField label="Representation area">
          <input
            id="f-areas"
            className={intakeInputClass}
            value={form.areas}
            onChange={(e) => setField("areas", e.target.value)}
          />
        </IntakeField>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" id="f-budget">
          <IntakeField label="Budget min">
            <input
              className={intakeInputClass}
              value={form.budgetMin}
              onChange={(e) => setField("budgetMin", e.target.value)}
            />
          </IntakeField>
          <IntakeField label="Budget max">
            <input
              className={intakeInputClass}
              value={form.budgetMax}
              onChange={(e) => setField("budgetMax", e.target.value)}
            />
          </IntakeField>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <IntakeField label="Representation period">
            <select
              id="f-term"
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
          <IntakeField label="Expiration">
            <input
              id="f-expiration"
              className={intakeInputClass}
              value={form.expiration}
              onChange={(e) => setField("expiration", e.target.value)}
            />
          </IntakeField>
        </div>

        <IntakeField label="Broker compensation clause">
          <select
            id="f-compensation"
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

        <IntakeField label="Broker clauses">
          <div id="f-agency" className="space-y-2 rounded-lg border border-mist bg-paper px-3 py-2.5">
            {ALL_CLAUSES.map((clause) => (
              <label
                key={clause}
                className="flex min-h-[40px] cursor-pointer items-center gap-2 text-[0.78rem] text-ink"
              >
                <input
                  type="checkbox"
                  checked={form.clauses.includes(clause)}
                  onChange={() => toggleClause(clause)}
                  className="h-4 w-4 rounded border-mist accent-ink"
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
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-mist px-5 py-4">
        <button
          type="button"
          onClick={handleGeneratePacket}
          disabled={generating}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[0.82rem] font-semibold text-cloud transition-colors hover:bg-ink-800 disabled:opacity-60"
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
            "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-[0.82rem] font-medium transition-colors",
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
  );

  const PreviewColumn = (
    <section className="flex min-w-0 flex-col gap-4">
      {/* Branded template picker row (ticket 7) */}
      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TEMPLATES.map((t) => {
          const on = t.key === template;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTemplate(t.key)}
              aria-pressed={on}
              className={cn(
                "min-h-[60px] min-w-[160px] shrink-0 snap-start rounded-xl border px-3 py-2 text-left transition-colors",
                on ? "border-ink bg-ink text-cloud" : "border-mist bg-cloud text-ink hover:border-ink/25",
              )}
            >
              <span className="flex items-center gap-1.5">
                <MatinMark theme={on ? "white" : "dark"} className="h-3.5 w-3.5" />
                <span className="font-mono text-[0.66rem] font-semibold uppercase tracking-wide opacity-80">
                  {t.formId}
                </span>
              </span>
              <span className="mt-1 block text-[0.8rem] font-semibold leading-tight">{t.name}</span>
              <span className={cn("block text-[0.68rem] leading-tight", on ? "text-cloud/70" : "text-slate")}>
                {t.sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* The REAL branded OREF C-565 document (ticket 1) */}
      <div>
        <p className="eyebrow pb-2 text-slate">Live document preview</p>
        <div
          key={`${buyer.id}:${template}`}
          className="motion-safe:animate-fade"
        >
        <BrandedDocument
          variant="agreement"
          formId={tmpl.formId}
          title="Buyer Representation Agreement"
          recipient={form.buyerName || buyer.name}
          agent={{
            name: signatureAgent.name,
            title: signatureAgent.title,
            license: signatureAgent.license,
            phone: signatureAgent.phone,
            email: signatureAgent.email,
            slug: signatureAgent.slug,
          }}
          fields={docFields}
          completion={completion}
          page={1}
          pages={4}
          listing={
            matches[0]
              ? { address: form.areas.split(",")[0]?.trim() || matches[0].city }
              : undefined
          }
        />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRecordTab("agreement");
              setRecordOpen(true);
            }}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-mist bg-cloud px-3 py-1.5 text-[0.76rem] font-medium text-ink transition-colors hover:bg-paper"
          >
            <Eye className="h-3.5 w-3.5" />
            Full record
          </button>
          <button
            type="button"
            onClick={handleSendForSignature}
            disabled={!canSend}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.76rem] font-semibold transition-colors",
              !canSend
                ? sent
                  ? "bg-success/10 text-success ring-1 ring-inset ring-success/30"
                  : "cursor-not-allowed bg-paper-200 text-slate"
                : "bg-ink text-cloud hover:bg-ink-800",
            )}
          >
            <Send className="h-3.5 w-3.5" />
            {sent ? "Sent" : "Send for signature"}
          </button>
          <p className="basis-full text-[0.72rem] leading-snug text-slate">
            Mandatory in Oregon per HB 4058. Download or Print produces the branded
            Matin document above — a real file you can use.
          </p>
        </div>
      </div>

      {/* Real matched listings in the budget band (ticket 5) */}
      <div className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
        <div className="flex items-center justify-between gap-2 border-b border-mist px-4 py-3">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-slate" />
            <h3 className="font-display text-[0.92rem] font-normal text-ink">
              Matched listings in budget
            </h3>
          </div>
          <span className="text-[0.7rem] text-slate tabular-nums">
            {compactUsd(budgetMin)}–{compactUsd(budgetMax)}
          </span>
        </div>
        {matches.length === 0 ? (
          <p className="px-4 py-5 text-[0.78rem] leading-snug text-slate">
            No active {form.areas.split(",")[0]?.trim() || "area"} listings in this band right now —
            adjust the representation area or budget to surface real inventory.
          </p>
        ) : (
          <ul className="divide-y divide-mist">
            {matches.map((m) => (
              <MatchRow key={m.id} listing={m} />
            ))}
          </ul>
        )}
      </div>

      {/* Streamed AI packet language (Generate packet output) */}
      {(generating || draft) && (
        <div
          id="buyer-draft-result"
          className="rounded-2xl border border-mist bg-cloud p-4 shadow-soft motion-safe:animate-fade scroll-mt-20"
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
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
  );

  const ActionsColumn = (
    <section className="flex min-w-0 flex-col gap-4">
      {/* Per-field completion checklist (ticket 2) — scroll-to-fix */}
      <div className="rounded-2xl border border-mist bg-cloud shadow-soft">
        <div className="flex items-center justify-between gap-2 border-b border-mist px-5 py-4">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-slate" />
            <h2 className="font-display text-[1.02rem] font-normal leading-tight text-ink">
              Completion checklist
            </h2>
          </div>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[0.72rem] font-semibold tabular-nums ring-1 ring-inset",
              completion >= 100
                ? "bg-success/12 text-success ring-success/25"
                : "bg-warn/15 text-warn ring-warn/30",
            )}
          >
            {completion}%
          </span>
        </div>
        <ul className="divide-y divide-mist">
          {fields.map((f) => (
            <ChecklistItem key={f.inputId} field={f} onFix={() => fixField(f.inputId)} />
          ))}
        </ul>
      </div>

      {/* Readiness — ScoreRing + full factor breakdown (ticket 10) */}
      <div className="rounded-2xl border border-mist bg-cloud p-4 shadow-soft">
        <div className="flex items-center gap-4">
          <ScoreRing value={score} size={64} label="Ready" />
          <div className="min-w-0 flex-1">
            <p className="text-[0.78rem] font-semibold text-ink">Representation readiness</p>
            <p className="mt-0.5 text-[0.72rem] leading-snug text-slate">
              Based on how complete the intake is and how engaged the buyer is.
            </p>
          </div>
        </div>
        {/* Full factor breakdown as labeled bars (not slice(0,2)) */}
        <ul className="mt-3 space-y-2">
          {factors.map((f, i) => (
            <li key={i} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  f.good ? "bg-success/15 text-success" : "bg-warn/15 text-warn",
                )}
              >
                {f.good ? <CircleCheck className="h-3 w-3" /> : <TriangleAlert className="h-3 w-3" />}
              </span>
              <span className="min-w-0 flex-1 text-[0.76rem] leading-snug text-ink/90">{f.text}</span>
              <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-paper-200">
                <span
                  className={cn("block h-full rounded-full", f.good ? "bg-success" : "bg-warn")}
                  style={{ width: f.good ? "100%" : "45%" }}
                />
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Automation chain visual (ticket 8) */}
      <div className="rounded-2xl border border-mist bg-cloud shadow-soft">
        <div className="flex items-center gap-2 border-b border-mist px-5 py-4">
          <Database className="h-4 w-4 text-slate" />
          <h2 className="font-display text-[1.02rem] font-normal leading-tight text-ink">
            Automation
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
                <StatusChip tone={r.tone} variant={r.variant}>
                  {r.chip}
                </StatusChip>
              </span>
            </li>
          ))}
        </ul>
        {/* What the buyer receives — branded envelope thumbnail */}
        <div className="border-t border-mist px-5 py-4">
          <p className="eyebrow pb-2 text-slate">What the buyer receives</p>
          <BrandedDocument
            variant="email"
            hideToolbar
            fromName={`${company.name} · ${signatureAgent.name}`}
            emailSubject="Your buyer representation agreement — sign to start your home search"
            recipient={form.email || buyer.email}
            agent={{ name: signatureAgent.name, title: signatureAgent.title, phone: signatureAgent.phone }}
            mergeTokens={["{{first_name}}", "{{address}}", "{{esign_link}}"]}
            title="Buyer agreement for signature"
            className="[&_article]:min-h-0"
          />
          <p className="mt-2 font-mono text-[0.68rem] leading-relaxed text-slate">
            After you send: the e-signature request goes out, it&apos;s saved to
            the buyer&apos;s file, {signatureAgent.name.split(" ")[0]} is notified,
            a reminder is set for 3 days, and the checklist updates.
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
      {missing.length > 0 ? (
        <CalloutCard
          tone="risk"
          title="Missing fields block send"
          action={
            <button
              type="button"
              onClick={() => fixField(missing[0].inputId)}
              className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-gold px-3 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
            >
              Go to first gap
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          }
        >
          {missing.length} required field{missing.length === 1 ? "" : "s"} incomplete:{" "}
          {missing.map((m) => m.label).join(", ")}. The DocuSign envelope cannot be sent
          until these are resolved.
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
          Every required field on the {tmpl.formId} packet is complete. This agreement is
          clear to send for signature.
        </CalloutCard>
      )}

      {/* Explicit "Ask Matin" affordance — the ONLY thing that opens the sidecar */}
      <button
        type="button"
        onClick={() => openAi(`Working on: ${aiContext}`)}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold-soft px-4 py-2.5 text-[0.82rem] font-semibold text-gold-ink transition-colors hover:bg-gold/20"
      >
        <MatinMark theme="dark" className="h-4 w-4" />
        Ask Matin about this agreement
      </button>
    </section>
  );

  return (
    <div className="px-4 py-5 md:px-6">
      {/* Subtitle (TopCommandBar owns the H1) */}
      <p className="text-[0.82rem] leading-snug text-slate">
        One intake builds the agreement, checks it against your broker rules,
        sends it for e-signature, and logs everything to the buyer&apos;s record.
      </p>

      {/* ── KPI strip (ticket 6 — money sub-stats, no orphan) ─────────────── */}
      <div className="mt-4">
        <KpiStrip cols={5}>
          <KpiCard
            label="Agreements out"
            value={kpis.out}
            icon={<FileSignature className="h-4 w-4" />}
            hint={`Avg term ${kpis.avgTerm} mo`}
            onDrill={() => drillView("all")}
          />
          <KpiCard
            label="Awaiting signature"
            value={kpis.awaiting}
            valueTone={kpis.awaiting > 0 ? "danger" : "ink"}
            icon={<Clock className="h-4 w-4" />}
            hint={`${compactUsd(kpis.pipeline)} pipeline`}
            onDrill={() => drillView("sent")}
          />
          <KpiCard
            label="Signed this week"
            value={kpis.signedThisWeek}
            valueTone="success"
            icon={<CircleCheck className="h-4 w-4" />}
            hint={`${compactUsd(kpis.signedVolume)} signed volume`}
            onDrill={() => drillView("signed")}
          />
          <KpiCard
            label="Expiring soon"
            value={kpis.expiringSoon}
            valueTone={kpis.expiringSoon > 0 ? "danger" : "ink"}
            icon={<CalendarClock className="h-4 w-4" />}
            hint="Representation winding down"
            onDrill={() => drillView("expiring")}
          />
          <KpiCard
            label="Missing-field flags"
            value={kpis.missingFlags}
            valueTone={kpis.missingFlags > 0 ? "danger" : "ink"}
            icon={<TriangleAlert className="h-4 w-4" />}
            hint="Cannot send until resolved"
            onDrill={() => drillView("draft")}
          />
        </KpiStrip>
      </div>

      {/* Mobile pane switcher (R1) */}
      <div className="mt-4 lg:hidden">
        <PaneSwitcher {...pane.switcherProps} />
      </div>

      {/* ── Below lg: ONE pane at a time ─────────────────────────────────── */}
      <div className="mt-4 space-y-4 lg:hidden">
        {pane.is("list") ? <div className="motion-safe:animate-fade">{ListPane}</div> : null}
        {pane.is("docs") ? (
          <div
            id="buyer-pane-docs"
            className="scroll-mt-20 space-y-4 motion-safe:animate-fade"
          >
            {FormColumn}
            {PreviewColumn}
          </div>
        ) : null}
        {pane.is("actions") ? (
          <div id="buyer-pane-actions" className="scroll-mt-20 motion-safe:animate-fade">
            {ActionsColumn}
          </div>
        ) : null}
      </div>

      {/* ── lg+: full builder grid (record list + 3 columns) ─────────────── */}
      <div className="mt-5 hidden gap-4 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
        {ListPane}
        <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {FormColumn}
          <div ref={desktopDocsRef} className="min-w-0 scroll-mt-20">
            {PreviewColumn}
          </div>
          <div className="min-w-0 xl:col-span-2 2xl:col-span-1">{ActionsColumn}</div>
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
          <div className="flex w-full flex-wrap items-center gap-2">
            <a
              href={`mailto:${buyer.email}`}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-[0.78rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
            >
              <Mail className="h-3.5 w-3.5" />
              Email
            </a>
            <a
              href={`tel:${buyer.phone}`}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.78rem] font-medium text-ink transition-colors hover:bg-paper"
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
                disabled={!canSend}
                className={cn(
                  "ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 text-[0.78rem] font-semibold transition-colors",
                  !canSend
                    ? "cursor-not-allowed bg-paper-200 text-slate"
                    : "bg-ink text-cloud hover:bg-ink-800",
                )}
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </button>
            ) : null}
          </div>
        }
      >
        {recordTab === "overview" ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={buyer.agentName} slug={buyer.agentSlug} size={44} ring />
              <div className="min-w-0">
                <p className="text-[0.86rem] font-semibold text-ink">{buyer.name}</p>
                <p className="text-[0.76rem] text-slate">Represented by {buyer.agentName}</p>
              </div>
              <span className="ml-auto">
                <StatusChip tone={stateTone(buyer.agreementStatus).tone}>
                  <Dot tone={stateTone(buyer.agreementStatus).tone} />
                  {stateTone(buyer.agreementStatus).label}
                </StatusChip>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            {/* Full branded agreement in the drawer (Page 1 of 4) */}
            <BrandedDocument
              variant="agreement"
              formId={tmpl.formId}
              title="Buyer Representation Agreement"
              recipient={buyer.name}
              agent={{
                name: signatureAgent.name,
                title: signatureAgent.title,
                license: signatureAgent.license,
                phone: signatureAgent.phone,
                email: signatureAgent.email,
                slug: signatureAgent.slug,
              }}
              fields={docFields}
              completion={completion}
              page={1}
              pages={4}
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
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-mist bg-cloud px-4 py-2.5 text-[0.82rem] font-medium text-ink transition-colors hover:bg-paper"
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
          <div className="flex w-full flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.78rem] font-medium text-ink transition-colors hover:bg-paper"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-agreement-form"
              className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[0.78rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Create draft
            </button>
          </div>
        }
      >
        <NewAgreementForm formId="new-agreement-form" onCreate={handleCreate} />
      </RecordDrawer>
    </div>
  );
}

/* ── Completion checklist item (scroll-to-fix) ─────────────────────────────── */
function ChecklistItem({
  field,
  onFix,
}: {
  field: CompletionField;
  onFix: () => void;
}) {
  return (
    <li className="flex items-center gap-3 px-5 py-2.5">
      {field.filled ? (
        <CircleCheck className="h-4 w-4 shrink-0 text-success" aria-label="Complete" />
      ) : (
        <span
          className="h-3.5 w-3.5 shrink-0 rounded-sm border-2 border-danger"
          aria-label="Missing"
        />
      )}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[0.8rem] font-medium leading-tight",
            field.filled ? "text-ink" : "text-danger",
          )}
        >
          {field.label}
        </p>
        <p className="truncate text-[0.7rem] leading-tight text-slate">
          {field.filled ? field.value : field.hint}
        </p>
      </div>
      {!field.filled ? (
        <button
          type="button"
          onClick={onFix}
          className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg border border-danger/30 bg-danger/[0.06] px-2.5 py-1 text-[0.72rem] font-semibold text-danger transition-colors hover:bg-danger/[0.1]"
        >
          Fix
          <ArrowRight className="h-3 w-3" />
        </button>
      ) : null}
    </li>
  );
}

/* ── Matched-listing row (real address/price/photo) ────────────────────────── */
function MatchRow({ listing }: { listing: MatchedListing }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- deterministic real exterior */}
      <img
        src={listing.photo}
        alt={listing.address}
        className="h-12 w-16 shrink-0 rounded-lg object-cover ring-1 ring-mist"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.82rem] font-medium text-ink">{listing.address}</p>
        <p className="truncate text-[0.72rem] text-slate tabular-nums">
          {listing.city}, {listing.state} · {listing.beds} bd · {listing.baths} ba ·{" "}
          {listing.sqft.toLocaleString()} sqft
        </p>
      </div>
      <span className="shrink-0 text-[0.86rem] font-semibold text-ink tabular-nums">
        {compactUsd(listing.price)}
      </span>
    </li>
  );
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
