"use client";

import { useMemo, useState } from "react";
import {
  FileSignature,
  CalendarCheck,
  AlertTriangle,
  Search,
  FileClock,
  Building2,
  Sparkles,
  Copy,
  Check,
  ArrowUpRight,
} from "lucide-react";
import type { Transaction } from "@/lib/types";
import { getAgent } from "@/lib/data";
import { usd, cn } from "@/lib/utils";
import {
  KpiStrip,
  KpiCard,
  StatusChip,
  Dot,
  MilestoneTimeline,
  ChecklistPanel,
  CalloutCard,
  AIActionCard,
  AIInsightChip,
  ProgressTrack,
  EmptyState,
  useAiSidecar,
  type ChipTone,
} from "@/components/os";
import { streamAi } from "@/lib/ai/client";
import { dealScreenFor } from "./deal-screen";

/* ──────────────────────────────────────────────────────────────────────────
   Transaction Timeline + Checklist — the one-deal cockpit (build ref §2.6).

   Layout:
     • KPI strip — Under contract · Closing this week · At risk (danger) ·
       Inspections due · Pending docs (all derived from real `transactions`).
     • Left: searchable, selectable transaction list (deal = the unit).
     • Right: ONE-DEAL 3-column screen —
         (1) Deal summary  — address + side/stage/close line + status rows.
         (2) Milestone timeline — MilestoneTimeline (Closing node = ink).
         (3) Checklist + Risk — ChecklistPanel + dark "AI Risk Note" callout,
             whose action streams a draft via streamAi('contract-extractor').

   Default selected deal = 1274 NW Everett St (TX-3999). The high-risk deal
   8912 SE Hawthorne Blvd (TX-3998) is pinned to the top of the list and made
   visually prominent. All gold lives on AI affordances only.
   ────────────────────────────────────────────────────────────────────────── */

const DEFAULT_ID = "TX-3999"; // 1274 NW Everett St
const HIGH_RISK_ID = "TX-3998"; // 8912 SE Hawthorne Blvd

const PENDING_STAGES = new Set(["Pending", "Appraisal", "Financing", "Clear to Close", "Inspection"]);

function isUnderContract(t: Transaction) {
  return t.stage !== "Closed" && t.stage !== "Active" && t.stage !== "Cancelled";
}

/** Stage → soft chip tone. */
function stageTone(stage: string): ChipTone {
  if (stage === "Closed") return "success";
  if (stage === "Clear to Close") return "success";
  if (["Appraisal", "Financing"].includes(stage)) return "warn";
  if (stage === "Inspection") return "info";
  if (stage === "Cancelled") return "danger";
  return "ink";
}

function closeLabel(daysOut: number, closed: boolean) {
  if (closed) return "Closed";
  if (daysOut < 0) return `${Math.abs(daysOut)}d past close`;
  if (daysOut === 0) return "Closes today";
  return `Closes in ${daysOut}d`;
}

export function TransactionsCockpit({ transactions }: { transactions: Transaction[] }) {
  const { openAi } = useAiSidecar();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_ID);

  /* ── KPI roll-ups from real data ──────────────────────────────────────── */
  const kpis = useMemo(() => {
    const open = transactions.filter((t) => t.stage !== "Closed" && t.stage !== "Cancelled");
    const underContract = open.filter(isUnderContract).length;
    const closingThisWeek = open.filter(
      (t) => t.closeDateDaysOut >= 0 && t.closeDateDaysOut <= 7,
    ).length;
    const atRisk = open.filter((t) => t.riskFlag != null).length;
    const inspectionsDue = open.filter(
      (t) => t.stage === "Inspection" || !t.checklist.find((c) => c.label === "Inspection complete")?.done,
    ).length;
    const pendingDocs = open.reduce(
      (sum, t) => sum + t.checklist.filter((c) => !c.done).length,
      0,
    );
    return { underContract, closingThisWeek, atRisk, inspectionsDue, pendingDocs };
  }, [transactions]);

  /* ── List ordering: high-risk pinned, then soonest close, closed sinks ─── */
  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions
      .filter((t) =>
        !q ? true : t.address.toLowerCase().includes(q) || t.client.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        if (a.id === HIGH_RISK_ID) return -1;
        if (b.id === HIGH_RISK_ID) return 1;
        const ar = a.riskFlag ? 0 : 1;
        const br = b.riskFlag ? 0 : 1;
        if (ar !== br) return ar - br;
        const ac = a.stage === "Closed" ? 1 : 0;
        const bc = b.stage === "Closed" ? 1 : 0;
        if (ac !== bc) return ac - bc;
        return a.closeDateDaysOut - b.closeDateDaysOut;
      });
  }, [transactions, search]);

  const selected = transactions.find((t) => t.id === selectedId) ?? transactions[0] ?? null;

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <KpiStrip className="xl:grid-cols-5">
        <KpiCard
          label="Under contract"
          value={kpis.underContract}
          icon={<FileSignature className="h-4 w-4" />}
          hint="Active contract-to-close deals"
          onDrill={() => setSearch("")}
        />
        <KpiCard
          label="Closing this week"
          value={kpis.closingThisWeek}
          icon={<CalendarCheck className="h-4 w-4" />}
          hint="Close date within 7 days"
        />
        <KpiCard
          label="At risk"
          value={kpis.atRisk}
          valueTone="danger"
          icon={<AlertTriangle className="h-4 w-4" />}
          delta="needs attention"
          deltaTone="down"
          hint="Open risk flag on the deal"
          onDrill={() => setSelectedId(HIGH_RISK_ID)}
        />
        <KpiCard
          label="Inspections due"
          value={kpis.inspectionsDue}
          icon={<FileClock className="h-4 w-4" />}
          hint="Inspection contingency still open"
        />
        <KpiCard
          label="Pending docs"
          value={kpis.pendingDocs}
          icon={<Building2 className="h-4 w-4" />}
          hint="Checklist items not yet complete"
        />
      </KpiStrip>

      {/* Main split: list + one-deal screen */}
      <div className="grid gap-5 lg:grid-cols-[19rem_minmax(0,1fr)]">
        {/* ── Left: transaction list ─────────────────────────────────────── */}
        <aside className="flex flex-col overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
          <div className="border-b border-mist px-4 py-3">
            <p className="eyebrow text-slate">Deals · {list.length}</p>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search address or client…"
                className="h-8 w-full rounded-lg border border-mist bg-paper pl-8 pr-3 text-[0.78rem] text-ink placeholder:text-slate focus:border-ink/30 focus:outline-none focus:ring-1 focus:ring-ink/20"
              />
            </div>
          </div>

          <ul className="max-h-[34rem] divide-y divide-mist overflow-y-auto lg:max-h-[calc(100vh-22rem)]">
            {list.map((t) => {
              const on = t.id === selected?.id;
              const closed = t.stage === "Closed";
              const soon = !closed && t.closeDateDaysOut >= 0 && t.closeDateDaysOut <= 7;
              const isHighRisk = t.id === HIGH_RISK_ID;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={cn(
                      "block w-full px-4 py-3 text-left transition-colors",
                      on ? "bg-paper-200" : "hover:bg-paper",
                      isHighRisk && !on ? "bg-danger/[0.04]" : "",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <Dot
                        tone={t.riskFlag ? "danger" : closed ? "success" : soon ? "warn" : "info"}
                        className="mt-1.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.84rem] font-semibold leading-snug text-ink">
                          {t.address.replace(/, .*$/, "")}
                        </p>
                        <p className="mt-0.5 truncate text-[0.74rem] text-slate">
                          {t.client} · {/purchase|buyer/i.test(t.type) ? "Buyer" : "Listing"}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <StatusChip tone={stageTone(t.stage)}>{t.stage}</StatusChip>
                          {t.riskFlag ? (
                            <StatusChip tone="danger" variant="solid">
                              <AlertTriangle className="h-2.5 w-2.5" /> At risk
                            </StatusChip>
                          ) : null}
                        </div>
                        <p
                          className={cn(
                            "mt-1.5 text-[0.72rem] tabular-nums",
                            closed ? "text-success" : soon ? "text-warn" : "text-slate",
                          )}
                        >
                          {closeLabel(t.closeDateDaysOut, closed)} · {usd(t.price)}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
            {list.length === 0 ? (
              <li className="px-4 py-8">
                <EmptyState
                  title="No deals match"
                  body="Clear the search to see every contract-to-close deal in the pipeline."
                  actionLabel="Show all deals"
                  onAction={() => setSearch("")}
                />
              </li>
            ) : null}
          </ul>
        </aside>

        {/* ── Right: one-deal screen ─────────────────────────────────────── */}
        {selected ? (
          <DealScreen key={selected.id} tx={selected} onOpenAi={openAi} />
        ) : (
          <EmptyState
            title="Select a deal"
            body="Pick a transaction to see its deadlines, milestone timeline, checklist, and AI risk note on one screen."
            icon={<FileSignature className="h-5 w-5" />}
          />
        )}
      </div>
    </div>
  );
}

/* ── The 3-column deal screen ─────────────────────────────────────────────── */

function DealScreen({
  tx,
  onOpenAi,
}: {
  tx: Transaction;
  onOpenAi: (ctx: string) => void;
}) {
  const screen = dealScreenFor(tx);
  const agent = getAgent(tx.agentSlug);
  const addressShort = tx.address.replace(/, .*$/, "");

  const doneCount = screen.checklist.filter((c) => c.status === "done").length;
  const issueCount = screen.checklist.filter((c) => c.status === "issue").length;
  const pct = Math.round((doneCount / screen.checklist.length) * 100);

  // AI draft (contract-extractor) state.
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleDraft() {
    if (!screen.risk || drafting) return;
    setDrafting(true);
    setDraft("");
    await streamAi(
      {
        tool: "contract-extractor",
        input: { contractText: screen.risk.draftPrompt, address: tx.address },
        messages: [{ role: "user", content: screen.risk.draftPrompt }],
      },
      (_chunk, full) => setDraft(full),
    );
    setDrafting(false);
  }

  function handleCopy() {
    if (!draft) return;
    navigator.clipboard.writeText(draft).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  const aiContext = `Transactions / ${addressShort} (${tx.id})`;

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      {/* (1) Deal summary */}
      <section className="flex flex-col overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
        <div className="border-b border-mist px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <p className="eyebrow text-slate">Deal summary</p>
            <span className="font-mono text-[0.7rem] text-slate">{tx.id}</span>
          </div>
          <h2 className="mt-2 font-display text-[1.3rem] leading-tight text-ink">{addressShort}</h2>
          <p className="mt-1 text-[0.8rem] text-slate">{screen.sideLine}</p>

          {tx.riskFlag ? (
            <div className="mt-3">
              <AIInsightChip icon={<AlertTriangle className="h-3.5 w-3.5" />}>
                {tx.riskFlag}
              </AIInsightChip>
            </div>
          ) : null}
        </div>

        {/* Status rows: label + solid chip */}
        <div className="divide-y divide-mist px-5">
          {screen.statusRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 py-3">
              <span className="text-[0.82rem] font-medium text-ink">{row.label}</span>
              <StatusChip tone={row.tone} variant="solid">
                {row.value}
              </StatusChip>
            </div>
          ))}
        </div>

        {/* Facts */}
        <div className="grid grid-cols-2 gap-px border-t border-mist bg-mist">
          <Fact label="Sale price" value={usd(tx.price)} />
          <Fact label="Commission" value={usd(tx.commission)} tone="success" />
          <Fact label="Stage" value={tx.stage} />
          <Fact label="Close" value={closeLabel(tx.closeDateDaysOut, tx.stage === "Closed")} />
        </div>

        {agent ? (
          <div className="flex items-center justify-between gap-3 border-t border-mist px-5 py-3">
            <div className="min-w-0">
              <p className="eyebrow text-slate">Lead agent · TC</p>
              <p className="mt-1 truncate text-[0.84rem] font-semibold text-ink">{agent.name}</p>
            </div>
            <button
              type="button"
              onClick={() => onOpenAi(`Context: ${aiContext}`)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Ask AI
            </button>
          </div>
        ) : null}
      </section>

      {/* (2) Milestone timeline */}
      <section className="flex flex-col overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
        <div className="flex items-center justify-between gap-3 border-b border-mist px-5 py-4">
          <p className="eyebrow text-slate">Milestone timeline</p>
          <StatusChip tone={tx.stage === "Closed" ? "success" : "info"}>
            {tx.stage === "Closed" ? "Closed" : "On track"}
          </StatusChip>
        </div>
        <div className="px-5 py-5">
          <MilestoneTimeline milestones={screen.milestones} />
        </div>
        <p className="mt-auto border-t border-mist px-5 py-3 text-[0.72rem] leading-snug text-slate">
          Date-driven and audit-friendly. Each status change writes an{" "}
          <span className="font-mono text-[0.7rem]">activity_event</span>.
        </p>
      </section>

      {/* (3) Checklist + Risk */}
      <section className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
          <div className="flex items-center justify-between gap-3 border-b border-mist px-5 py-4">
            <p className="eyebrow text-slate">Closing checklist</p>
            <span className="text-[0.74rem] font-medium text-slate tabular-nums">
              {doneCount}/{screen.checklist.length} done
            </span>
          </div>
          <div className="px-5 pt-4">
            <ProgressTrack
              label="Contract-to-close"
              value={pct}
              tone={issueCount > 0 ? "danger" : pct === 100 ? "success" : "warn"}
            />
          </div>
          <div className="px-5 pb-4 pt-2">
            <ChecklistPanel
              items={screen.checklist.map((c) => ({
                id: c.id,
                label: c.label,
                status: c.status,
                meta: c.meta,
              }))}
            />
          </div>
        </div>

        {/* AI Risk Note — dark callout + streamed draft */}
        {screen.risk ? (
          <CalloutCard
            tone="risk"
            title={screen.risk.title}
            action={
              <button
                type="button"
                onClick={handleDraft}
                disabled={drafting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-1.5 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-gold-bright disabled:opacity-60"
              >
                {drafting ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
                    Drafting…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    {screen.risk.actionLabel}
                  </>
                )}
              </button>
            }
          >
            <p>{screen.risk.body}</p>

            {/* Streamed draft preview */}
            {draft || drafting ? (
              <div className="mt-3.5 rounded-xl border border-ink-700 bg-ink-900 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="eyebrow text-gold/80">AI draft · {screen.risk.actionLabel}</span>
                  {draft ? (
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-slate-300 transition-colors hover:text-cloud"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  ) : null}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[0.8rem] leading-relaxed text-slate-300">
                  {draft || "Reading the contract and email thread…"}
                </p>
                <p className="mt-2.5 text-[0.66rem] leading-none text-slate-300/50">
                  Draft only — review before sending for signature.
                </p>
              </div>
            ) : (
              <div className="mt-3.5">
                <AIActionCard
                  title={screen.risk.actionLabel}
                  riskTag="Approval required"
                  evidence="Email thread referenced against deal state; no matching addendum on file before the contingency deadline."
                  confidence="High"
                  runLabel="Draft"
                  onRun={handleDraft}
                  onEdit={() => onOpenAi(`Context: ${aiContext}`)}
                />
              </div>
            )}
          </CalloutCard>
        ) : (
          <CalloutCard
            tone="system"
            title="No open risk"
            action={
              <button
                type="button"
                onClick={() => onOpenAi(`Context: ${aiContext}`)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-1.5 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Summarize status
              </button>
            }
          >
            <p>
              Matin AI cross-referenced deadlines, the email thread, and document state for{" "}
              {addressShort}. Every contingency is on track — no addendum or deadline action is
              outstanding right now.
            </p>
          </CalloutCard>
        )}
      </section>
    </div>
  );
}

function Fact({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success";
}) {
  return (
    <div className="bg-cloud px-5 py-3">
      <p className="eyebrow text-slate">{label}</p>
      <p
        className={cn(
          "mt-1 text-[0.92rem] font-semibold tabular-nums",
          tone === "success" ? "text-success" : "text-ink",
        )}
      >
        {value}
      </p>
    </div>
  );
}
