import {
  leads,
  sellerLeads,
  listingPipeline,
  transactions,
  agents,
  aiActions,
  failedWorkflowRuns,
} from "@/lib/data";
import type { WorkQueueItem } from "@/lib/types";
import type { ActivityItem } from "@/components/os";

/* ──────────────────────────────────────────────────────────────────────────
   Today Command Center — work-queue record enrichment

   The work queue stores only a `sourceType` + `sourceId`. To make every row and
   its drawer REAL — owner headshot, property photo, person facts, intent score,
   a true activity trail — we resolve each item back to the underlying record in
   the data layer here. One pure module, no React, so the page stays declarative.

   Resolved shape (`QueueRecord`):
     owner      — the agent who owns the work (Avatar by slug → real headshot)
     person     — the contact/seller/client name behind the task (Avatar token)
     thumbSeed  — stable exterior-photo seed for listing/transaction/seller rows
     score      — lead / seller-intent score for a gold ScoreChip
     facts      — label/value pairs for the drawer identity block
     address    — property address when the unit is a property
   ────────────────────────────────────────────────────────────────────────── */

export type RecordFact = { label: string; value: string };

export type QueueRecord = {
  /** agent slug that owns the queue item (→ real headshot via Avatar) */
  ownerSlug: string;
  ownerName: string;
  /** the human the task is ABOUT (lead/seller/client) — initials token */
  personName?: string;
  /** stable seed into the exteriors pool for a consistent PropertyThumb */
  thumbSeed?: number;
  /** lead / seller-intent score → gold ScoreChip */
  score?: number;
  scoreLabel?: string;
  /** identity facts shown in the drawer */
  facts: RecordFact[];
  /** property address when the unit is a property */
  address?: string;
  /** short context-rail line (provenance / where it came from) */
  provenance?: string;
};

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

/** Deterministic non-negative seed from any id string (stable photo per record). */
function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

const agentName = (slug: string) =>
  agents.find((a) => a.slug === slug)?.name ?? slug;

/** Resolve a queue item to its real underlying record. */
export function enrich(item: WorkQueueItem): QueueRecord {
  const ownerSlug = item.agent;
  const ownerName = agentName(ownerSlug);
  const base: QueueRecord = { ownerSlug, ownerName, facts: [] };

  switch (item.sourceType) {
    case "lead": {
      const lead = leads.find((l) => l.id === item.sourceId);
      if (!lead) return base;
      return {
        ...base,
        personName: lead.name,
        score: lead.score,
        scoreLabel: "intent",
        provenance: `${lead.source} · ${lead.community}`,
        facts: [
          { label: "Stage", value: lead.stage },
          { label: "Intent", value: lead.intent },
          {
            label: "Budget",
            value: `${usd(lead.budgetMin)} – ${usd(lead.budgetMax)}`,
          },
          { label: "Source", value: lead.source },
          {
            label: "Last contact",
            value:
              lead.lastContactDaysAgo === 0
                ? "Today"
                : `${lead.lastContactDaysAgo} days ago`,
          },
          { label: "Assigned to", value: ownerName },
        ],
      };
    }
    case "seller-lead": {
      const sl = sellerLeads.find((s) => s.id === item.sourceId);
      if (!sl) return base;
      return {
        ...base,
        personName: sl.sellerName,
        thumbSeed: seedFromId(sl.id),
        score: sl.sellerScore,
        scoreLabel: "seller",
        address: `${sl.address}, ${sl.city}`,
        provenance: sl.source ? `${sl.source} · ${sl.city}` : sl.city,
        facts: [
          { label: "Property", value: `${sl.address}, ${sl.city}` },
          { label: "Est. value", value: usd(sl.estValue) },
          { label: "Beds / baths", value: `${sl.beds} bd · ${sl.baths} ba` },
          { label: "Timeline", value: sl.timeline },
          { label: "Stage", value: sl.stage },
          { label: "Assigned to", value: ownerName },
        ],
      };
    }
    case "listing": {
      const lp = listingPipeline.find((l) => l.id === item.sourceId);
      if (!lp) return base;
      return {
        ...base,
        personName: lp.agentName,
        thumbSeed: seedFromId(lp.id),
        address: `${lp.address}, ${lp.city}`,
        provenance: `${lp.stage} · ${lp.city}`,
        facts: [
          { label: "Address", value: `${lp.address}, ${lp.city}` },
          { label: "Target price", value: usd(lp.price) },
          { label: "Beds / baths", value: `${lp.beds} bd · ${lp.baths} ba` },
          { label: "Stage", value: lp.stage },
          { label: "Listing agent", value: lp.agentName },
        ],
      };
    }
    case "transaction": {
      const tx = transactions.find((t) => t.id === item.sourceId);
      if (!tx) return base;
      const closes =
        tx.closeDateDaysOut <= 0
          ? "Overdue"
          : `Closes in ${tx.closeDateDaysOut} days`;
      return {
        ...base,
        personName: tx.client,
        thumbSeed: seedFromId(tx.id),
        address: tx.address,
        provenance: `${tx.type} · ${tx.stage}`,
        facts: [
          { label: "Address", value: tx.address },
          { label: "Client", value: tx.client },
          { label: "Price", value: usd(tx.price) },
          { label: "Stage", value: tx.stage },
          { label: "Close", value: closes },
          ...(tx.riskFlag ? [{ label: "Risk", value: tx.riskFlag }] : []),
        ],
      };
    }
    case "ai-action": {
      const ai = aiActions.find((a) => a.id === item.sourceId);
      if (!ai) return base;
      return {
        ...base,
        provenance: ai.context,
        facts: [
          { label: "AI action", value: ai.title },
          { label: "Confidence", value: ai.confidence },
          { label: "Approval", value: ai.riskTag },
          { label: "Context", value: ai.context },
        ],
      };
    }
    case "workflow-run": {
      const wr = failedWorkflowRuns.find((r) => r.id === item.sourceId);
      if (!wr) return base;
      return {
        ...base,
        personName: wr.subject,
        provenance: `${wr.name} · started ${wr.startedLabel}`,
        facts: [
          { label: "Automation", value: wr.name },
          { label: "Subject", value: wr.subject },
          { label: "Failed step", value: wr.failedStep ?? "—" },
          { label: "Started", value: wr.startedLabel },
        ],
      };
    }
    case "agent": {
      const ag = agents.find((a) => a.slug === item.sourceId);
      if (!ag) return base;
      return {
        ...base,
        personName: ag.name,
        provenance: `${ag.title} · ${ag.role}`,
        facts: [
          { label: "Agent", value: ag.name },
          { label: "Title", value: ag.title },
          {
            label: "Response time",
            value: ag.responseTimeMins ? `${ag.responseTimeMins} min` : "—",
          },
          { label: "Coach", value: ownerName },
        ],
      };
    }
    default:
      return base;
  }
}

/** Slug for the person token — uses the seller/listing agent slug when known. */
export function personSlugFor(item: WorkQueueItem): string | undefined {
  if (item.sourceType === "agent") return item.sourceId;
  if (item.sourceType === "listing")
    return listingPipeline.find((l) => l.id === item.sourceId)?.agentSlug;
  return undefined;
}

/* ── Synthetic-but-real activity trail per source type (drawer timeline) ───── */

export function activityFor(item: WorkQueueItem, rec: QueueRecord): ActivityItem[] {
  const who = rec.personName ?? item.subject;
  switch (item.sourceType) {
    case "lead":
      return [
        {
          id: `${item.id}-a1`,
          channel: "system",
          name: "Matin AI grouped this lead",
          tag: "prioritized",
          tagTone: "gold",
          meta: rec.provenance,
          timeLabel: "12m ago",
          group: "Now",
        },
        {
          id: `${item.id}-a2`,
          channel: "system",
          name: "Property views tracked",
          tag: "IDX activity",
          tagTone: "info",
          meta: `${who} viewed listings in ${rec.facts.find((f) => f.label === "Source")?.value ?? "search"}`,
          timeLabel: "1h ago",
        },
        {
          id: `${item.id}-a3`,
          channel: "email",
          name: "Inbound message received",
          tag: "asked about showings",
          tagTone: "warn",
          meta: `From ${who}`,
          timeLabel: "Today",
          group: "Earlier",
        },
      ];
    case "transaction":
      return [
        {
          id: `${item.id}-a1`,
          channel: "system",
          name: "AI risk scan flagged this deal",
          tag: "at risk",
          tagTone: "danger",
          meta: item.why,
          timeLabel: "3m ago",
          group: "Now",
        },
        {
          id: `${item.id}-a2`,
          channel: "note",
          name: "Inspection report uploaded",
          tag: "needs review",
          tagTone: "warn",
          meta: rec.address,
          timeLabel: "Yesterday",
          group: "Earlier",
        },
      ];
    case "seller-lead":
      return [
        {
          id: `${item.id}-a1`,
          channel: "system",
          name: "Seller-intent score computed",
          tag: rec.score ? `${rec.score} score` : "scored",
          tagTone: "gold",
          meta: rec.provenance,
          timeLabel: "Overnight",
          group: "Now",
        },
        {
          id: `${item.id}-a2`,
          channel: "system",
          name: "Home-value page opened",
          tag: "high intent",
          tagTone: "warn",
          meta: rec.address,
          timeLabel: "Today",
        },
      ];
    case "listing":
      return [
        {
          id: `${item.id}-a1`,
          channel: "system",
          name: "Launch checklist blocked",
          tag: "needs approval",
          tagTone: "warn",
          meta: item.why,
          timeLabel: "2h ago",
          group: "Now",
        },
        {
          id: `${item.id}-a2`,
          channel: "system",
          name: "AI generated marketing assets",
          tag: "6 drafts",
          tagTone: "gold",
          meta: rec.address,
          timeLabel: "Today",
        },
      ];
    case "agent":
      return [
        {
          id: `${item.id}-a1`,
          channel: "system",
          name: "Weekly scorecard rolled up",
          tag: "behind pace",
          tagTone: "danger",
          meta: item.why,
          timeLabel: "Monday 7:00 AM",
          group: "This week",
        },
      ];
    default:
      return [
        {
          id: `${item.id}-a1`,
          channel: "system",
          name: "Surfaced to your work queue",
          tag: "needs you",
          tagTone: "warn",
          meta: item.why,
          timeLabel: item.dueLabel,
          group: "Now",
        },
      ];
  }
}
