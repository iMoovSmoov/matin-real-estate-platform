#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Resolve-or-fail data reference audit (G-A task 8)

   Walks every cross-record reference in the canonical data layer and asserts it
   resolves to a REAL record:
     - every work-queue `sourceId` (typed: lead / seller-lead / transaction /
       listing(=listing-pipeline) / ai-action / workflow-run / agent)
     - every work-queue `agent` (owner) slug
     - every ai-action `sourceId`
     - every agentSlug / assignedAgent on leads, seller-leads, listings,
       listing-pipeline, transactions, buyer-agreements
     - every report leaderboard slug
     - that NONE of the 4 fabricated agent slugs survive anywhere
     - that every agent photo path is /matin/agents/<slug>.jpg

   Exit 0 = zero dangling refs. Exit 1 = at least one dangling/fabricated ref.
   Wire into prebuild/CI.
   ────────────────────────────────────────────────────────────────────────── */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "..", "src", "lib", "data");
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));

const agents = read("agents.json");
const leads = read("leads.json");
const sellerLeads = read("seller-leads.json");
const transactions = read("transactions.json");
const listingPipeline = read("listing-pipeline.json");
const listings = read("listings.json");
const workQueue = read("work-queue.json");
const aiActions = read("ai-actions.json");
const workflowRuns = read("workflow-runs.json");
const campaigns = read("campaigns.json");
const reportMetrics = read("report-metrics.json");
const buyerAgreements = read("buyer-agreements.json");

const FABRICATED = new Set(["ava-brooks", "evan-carter", "marcus-lee", "nina-patel"]);

const agentSlugs = new Set(agents.map((a) => a.slug));
const sets = {
  agent: agentSlugs,
  lead: new Set(leads.map((x) => x.id)),
  "seller-lead": new Set(sellerLeads.map((x) => x.id)),
  transaction: new Set(transactions.map((x) => x.id)),
  // work-queue uses sourceType "listing" for listing-PIPELINE records (LP-xxx)
  listing: new Set([...listingPipeline.map((x) => x.id), ...listings.map((x) => x.id)]),
  "listing-pipeline": new Set(listingPipeline.map((x) => x.id)),
  "ai-action": new Set(aiActions.map((x) => x.id)),
  "workflow-run": new Set(workflowRuns.map((x) => x.id)),
  campaign: new Set(campaigns.map((x) => x.id)),
};

// sourceTypes that don't point at a record (computed/aggregate refs) — allowed.
const NON_RECORD_SOURCE_TYPES = new Set(["summary", "report", "source-roi"]);

const errors = [];
const fail = (msg) => errors.push(msg);

function checkSlug(slug, where) {
  if (slug == null || slug === "") return; // empty = intentionally unassigned (non-Matin listing brokerage)
  if (FABRICATED.has(slug)) fail(`FABRICATED agent slug "${slug}" still referenced in ${where}`);
  else if (!agentSlugs.has(slug)) fail(`dangling agentSlug "${slug}" in ${where}`);
}

function checkRef(type, id, where) {
  if (NON_RECORD_SOURCE_TYPES.has(type)) return;
  const set = sets[type];
  if (!set) { fail(`unknown sourceType "${type}" in ${where}`); return; }
  if (!set.has(id)) fail(`dangling ${type} ref "${id}" in ${where}`);
}

let refs = 0;

// 1. work-queue: typed sourceId + owner agent
for (const w of workQueue) {
  checkRef(w.sourceType, w.sourceId, `work-queue ${w.id}`); refs++;
  // when sourceType === agent the sourceId is itself an agent slug
  if (w.sourceType === "agent") { checkSlug(w.sourceId, `work-queue ${w.id}.sourceId`); }
  checkSlug(w.agent, `work-queue ${w.id}.agent`); refs++;
}

// 2. ai-actions: typed sourceId
for (const a of aiActions) {
  checkRef(a.sourceType, a.sourceId, `ai-action ${a.id}`); refs++;
  if (a.sourceType === "agent") checkSlug(a.sourceId, `ai-action ${a.id}.sourceId`);
}

// 3. owner slugs on domain records
for (const l of leads) { checkSlug(l.assignedAgent, `lead ${l.id}.assignedAgent`); refs++; }
for (const s of sellerLeads) { checkSlug(s.assignedAgent, `seller-lead ${s.id}.assignedAgent`); refs++; }
for (const t of transactions) { checkSlug(t.agentSlug, `transaction ${t.id}.agentSlug`); refs++; }
for (const lp of listingPipeline) { checkSlug(lp.agentSlug, `listing-pipeline ${lp.id}.agentSlug`); refs++; }
for (const l of listings) { checkSlug(l.agentSlug, `listing ${l.id}.agentSlug`); refs++; }
for (const b of buyerAgreements) { checkSlug(b.agentSlug, `buyer-agreement ${b.id}.agentSlug`); refs++; }

// 4. report leaderboard slugs
for (const r of reportMetrics.agentLeaderboard ?? []) {
  checkSlug(r.slug, `report leaderboard "${r.agent}"`); refs++;
}

// 5. agent photo paths + no fabricated agents present
for (const a of agents) {
  if (FABRICATED.has(a.slug)) fail(`FABRICATED agent "${a.slug}" present in agents.json`);
  const expected = `/matin/agents/${a.slug}.jpg`;
  if (a.photo !== expected) fail(`agent ${a.slug} photo "${a.photo}" != "${expected}"`);
}

// 6. canonical hero records must still resolve (guardrail)
const CANONICAL = [
  ["work-queue", "WQ-006", workQueue.some((w) => w.id === "WQ-006")],
  ["listing-pipeline", "LP-008", listingPipeline.some((l) => l.id === "LP-008")],
  ["transaction", "TX-3998", transactions.some((t) => t.id === "TX-3998")],
  ["transaction", "TX-3999", transactions.some((t) => t.id === "TX-3999")],
  ["lead", "LD-1999", leads.some((l) => l.id === "LD-1999" && l.name === "Daniel Cho")],
];
for (const [kind, id, ok] of CANONICAL) {
  if (!ok) fail(`canonical record missing: ${kind} ${id}`);
}

// ── report ────────────────────────────────────────────────────────────────
if (errors.length) {
  console.error(`✗ verify-data-refs: ${errors.length} problem(s) across ${refs} refs:\n`);
  for (const e of errors) console.error("  • " + e);
  process.exit(1);
}
console.log(`✓ verify-data-refs: ${refs} references resolve; 0 dangling, 0 fabricated agents.`);
console.log(`  agents=${agents.length} leads=${leads.length} sellerLeads=${sellerLeads.length} ` +
  `tx=${transactions.length} listingPipeline=${listingPipeline.length} listings=${listings.length} ` +
  `aiActions=${aiActions.length} workflowRuns=${workflowRuns.length}`);
process.exit(0);
