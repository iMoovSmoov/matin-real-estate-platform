/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Derived KPIs (G-A task 7)

   Single source of truth for the headline counts every section's KPI strip and
   AI-summary prose binds to. NOTHING here is a literal — every value is COMPUTED
   from the canonical JSON rows so a count can never drift from the table it
   summarizes (anti-slop §3.2). Each derived value documents exactly which rows
   it reconciles to, so a reviewer can verify "Pending docs 14" by counting 14
   rows. Sections import from here instead of hardcoding `NEW_LEADS = 47`.
   ────────────────────────────────────────────────────────────────────────── */

import leadsJson from "./leads.json";
import sellerLeadsJson from "./seller-leads.json";
import listingPipelineJson from "./listing-pipeline.json";
import transactionsJson from "./transactions.json";
import aiActionsJson from "./ai-actions.json";
import workflowRunsJson from "./workflow-runs.json";
import workQueueJson from "./work-queue.json";
import buyerAgreementsJson from "./buyer-agreements.json";
import type {
  Lead, SellerLead, ListingPipeline, Transaction,
  AIAction, WorkflowRun, WorkQueueItem, BuyerAgreement,
} from "../types";

const leads = leadsJson as Lead[];
const sellerLeads = sellerLeadsJson as SellerLead[];
const listingPipeline = listingPipelineJson as ListingPipeline[];
const transactions = transactionsJson as Transaction[];
const aiActions = aiActionsJson as AIAction[];
const workflowRuns = workflowRunsJson as WorkflowRun[];
const workQueue = workQueueJson as WorkQueueItem[];
const buyerAgreements = buyerAgreementsJson as BuyerAgreement[];

/** Seller-intent threshold that counts a lead as a "hot" seller signal. */
export const HOT_SELLER_SCORE = 80;
/** Pre-active listing-pipeline stages = a launch still in flight. */
const IN_FLIGHT_LAUNCH_STAGES = ["Intake", "Photos Scheduled", "MLS Draft", "Broker Review"];

/* ── Today / cross-section headline KPIs ──────────────────────────────────── */

/** New leads = leads in the "New" stage. Reconciles to CRM "New" rows. */
export const newLeads = leads.filter((l) => l.stage === "New").length;

/** Hot seller signals = seller-leads scored ≥ HOT_SELLER_SCORE (Cash-Offer hot list). */
export const hotSellerSignals = sellerLeads.filter(
  (s) => (s.sellerScore ?? 0) >= HOT_SELLER_SCORE,
).length;

/** Seller-leads carrying any tracked intent signal (broader "watching" count). */
export const sellerSignalsTracked = sellerLeads.filter(
  (s) => Array.isArray(s.signals) && s.signals.length > 0,
).length;

/** Listing launches still in flight (pre-Active pipeline stages). */
export const listingLaunches = listingPipeline.filter(
  (l) => IN_FLIGHT_LAUNCH_STAGES.includes(l.stage),
).length;

/** Listing launches blocked on a broker/disclosure/photo blocker. */
export const launchesBlocked = listingPipeline.filter(
  (l) => Array.isArray(l.blockers) && l.blockers.length > 0,
).length;

/** Transactions at risk = deals carrying a non-null riskFlag. */
export const txAtRisk = transactions.filter((t) => t.riskFlag != null).length;

/** AI drafts waiting on a human = AI actions in "pending" status. */
export const aiDraftsWaiting = aiActions.filter((a) => a.status === "pending").length;

/** Workflow errors = failed automation runs (Systems Health / Today prose). */
export const workflowErrors = workflowRuns.filter((r) => r.status === "failed").length;

/* ── Supporting counts used by section KPI strips ─────────────────────────── */

/** Total active (non-closed/non-lost) leads in the pipeline. */
export const activeLeads = leads.filter(
  (l) => !["Closed", "Lost"].includes(l.stage),
).length;

/** Leads not contacted in 3+ days (excluding closed/lost) — stale follow-ups. */
export const staleLeads = leads.filter(
  (l) => l.lastContactDaysAgo >= 3 && !["Closed", "Lost"].includes(l.stage),
).length;

/** Open transactions (not yet Closed) — the live deal board. */
export const openTransactions = transactions.filter((t) => t.stage !== "Closed").length;

/** Sum of commission on open (non-closed) transactions. */
export const openTransactionVolume = transactions
  .filter((t) => t.stage !== "Closed")
  .reduce((sum, t) => sum + t.price, 0);

/** Buyer agreements awaiting signature (Sent but not Signed). */
export const agreementsAwaitingSignature = buyerAgreements.filter(
  (b) => b.agreementStatus === "Sent",
).length;

/** Signed buyer agreements. */
export const agreementsSigned = buyerAgreements.filter(
  (b) => b.agreementStatus === "Signed",
).length;

/** Work-queue items on the "High Risk" tab — Today risk strip. */
export const highRiskQueueItems = workQueue.filter((w) => w.tab === "High Risk").length;

/** Failed-automation work-queue items (reconciles to Failed Automations tab). */
export const failedAutomationQueueItems = workQueue.filter(
  (w) => w.tab === "Failed Automations",
).length;

/* ── Today Command Center — the 6 hero KPIs, bundled ──────────────────────── */

export const todayKpis = {
  newLeads,
  hotSellerSignals,
  listingLaunches,
  txAtRisk,
  aiDraftsWaiting,
  workflowErrors,
} as const;

/** Everything bundled, so a consumer can `import { derived } from data`. */
export const derived = {
  HOT_SELLER_SCORE,
  newLeads,
  hotSellerSignals,
  sellerSignalsTracked,
  listingLaunches,
  launchesBlocked,
  txAtRisk,
  aiDraftsWaiting,
  workflowErrors,
  activeLeads,
  staleLeads,
  openTransactions,
  openTransactionVolume,
  agreementsAwaitingSignature,
  agreementsSigned,
  highRiskQueueItems,
  failedAutomationQueueItems,
  todayKpis,
} as const;

export type DerivedKpis = typeof derived;
