import agentsJson from "./data/agents.json";
import communitiesJson from "./data/communities.json";
import listingsJson from "./data/listings.json";
import leadsJson from "./data/leads.json";
import transactionsJson from "./data/transactions.json";
import activitiesJson from "./data/activities.json";
import metricsJson from "./data/metrics.json";
import automationsJson from "./data/automations.json";
import integrationsJson from "./data/integrations.json";
import companyJson from "./data/company.json";
import sellerLeadsJson from "./data/seller-leads.json";
import listingPipelineJson from "./data/listing-pipeline.json";
import buyerAgreementsJson from "./data/buyer-agreements.json";
import workQueueJson from "./data/work-queue.json";
import workflowRunsJson from "./data/workflow-runs.json";
import aiActionsJson from "./data/ai-actions.json";
import campaignsJson from "./data/campaigns.json";
import marketingAssetsJson from "./data/marketing-assets.json";
import dataQualityJson from "./data/data-quality.json";
import auditLogsJson from "./data/audit-logs.json";
import coachingScenariosJson from "./data/coaching-scenarios.json";
import reportMetricsJson from "./data/report-metrics.json";
import type {
  Agent, Community, Listing, Lead, Transaction, Activity,
  Metrics, Automation, Integration, Company,
  SellerLead, ListingPipeline, BuyerAgreement,
  WorkQueueItem, WorkflowRun, AIAction, Campaign, MarketingAsset,
  DataQualityIssue, AuditLog, CoachingScenario, ReportMetrics,
} from "./types";

// ---- G-A Wave-0 real-data layer (roles, remap, photo binding, derived KPIs) ----
import { roles, defaultListingCoordinator, defaultTransactionCoordinator, isLeadership } from "./data/roles";
import {
  remapAgent, remapAgentName, isFabricatedAgent,
  FABRICATED_AGENT_SLUGS, AGENT_REMAP, AGENT_NAME_REMAP,
} from "./data/agent-remap";
import { listingPhoto as listingPhotoBase, exteriorFallback, makeListingPhotoResolver } from "./data/listing-photo";
import { derived, todayKpis } from "./data/derive";

export const company = companyJson as Company;
export const agents = agentsJson as Agent[];
export const communities = communitiesJson as Community[];
export const listings = listingsJson as Listing[];
export const leads = leadsJson as Lead[];
export const transactions = transactionsJson as Transaction[];
export const activities = activitiesJson as Activity[];
export const metrics = metricsJson as Metrics;
export const automations = automationsJson as Automation[];
export const integrations = integrationsJson as Integration[];
export const sellerLeads = sellerLeadsJson as SellerLead[];
export const listingPipeline = listingPipelineJson as ListingPipeline[];
export const buyerAgreements = buyerAgreementsJson as BuyerAgreement[];

// ---- MatinOS module data layer (Today, Systems Health, Marketing, Reports, Coaching) ----
export const workQueue = workQueueJson as WorkQueueItem[];
export const workflowRuns = workflowRunsJson as WorkflowRun[];
export const aiActions = aiActionsJson as AIAction[];
export const campaigns = campaignsJson as Campaign[];
export const marketingAssets = marketingAssetsJson as MarketingAsset[];
export const dataQualityIssues = dataQualityJson as DataQualityIssue[];
export const auditLogs = auditLogsJson as AuditLog[];
export const coachingScenarios = coachingScenariosJson as CoachingScenario[];
export const reportMetrics = reportMetricsJson as ReportMetrics;

// ---- accessors ----
export const getAgent = (slug: string) => agents.find((a) => a.slug === slug);
export const getListing = (id: string) => listings.find((l) => l.id === id);
export const getCommunity = (slug: string) => communities.find((c) => c.slug === slug);

export const salesAgents = agents.filter((a) => !a.support);
export const supportAgents = agents.filter((a) => a.support);
export const leadership = agents.filter((a) => a.leadership);

export const featuredListings = listings.filter((l) => l.featured);
export const activeListings = listings.filter((l) => l.status !== "Sold");
export const popularCommunities = communities.filter((c) => c.popular);

export const listingsInCommunity = (slug: string) => listings.filter((l) => l.communitySlug === slug);
export const listingsByAgent = (slug: string) => listings.filter((l) => l.agentSlug === slug);

// agent leaderboard derived from data (volume desc)
export const agentLeaderboard = [...salesAgents]
  .sort((a, b) => b.volume - a.volume)
  .slice(0, 8);

// ---- MatinOS module accessors ----
export const workQueueByTab = (tab: WorkQueueItem["tab"]) =>
  workQueue.filter((w) => w.tab === tab);
export const failedWorkflowRuns = workflowRuns.filter((r) => r.status === "failed");
export const pendingAIActions = aiActions.filter((a) => a.status === "pending");
export const liveCampaigns = campaigns.filter((c) => c.status === "live");
export const assetsForCampaign = (campaignId: string) =>
  marketingAssets.filter((a) => a.campaignId === campaignId);
export const failingIntegrations = integrations.filter((i) => i.status !== "Healthy");

// ---------------------------------------------------------------------------
// G-A Wave-0 real-data layer — re-exported here so every section imports the
// roles / remap / listing-photo / derived KPIs from a single `@/lib/data` entry.
// ---------------------------------------------------------------------------

// Role slots (real principal broker, coordinators, marketing lead, leadership)
export { roles, defaultListingCoordinator, defaultTransactionCoordinator, isLeadership };

// Agent remap shim (fabricated → real) + the canonical fabricated-slug list
export {
  remapAgent, remapAgentName, isFabricatedAgent,
  FABRICATED_AGENT_SLUGS, AGENT_REMAP, AGENT_NAME_REMAP,
};

// Derived KPIs (computed from rows; never hardcoded)
export { derived, todayKpis };

// Real vs synthetic cohorts (Listings/Communities scrape merge)
export const realListings = listings.filter((l) => l.real);
export const realCommunities = communities.filter((c) => c.real);

/** Both real Matin offices (OR HQ + WA), if present. */
export const offices = company.offices ?? [];
/** Real counties served (live-site URLs). */
export const counties = company.counties ?? [];

/**
 * listingPhoto(listingIdOrListing) — returns the listing's real hero
 * (`photos[0]`) when available, else a DETERMINISTIC `/matin/exteriors`
 * fallback keyed by listing id. Bound to the canonical `listings` collection so
 * passing a bare id still resolves a real hero when one exists.
 */
const _resolveById = makeListingPhotoResolver(listings);
export function listingPhoto(
  input: string | { id: string; photos?: string[] } | null | undefined,
): string {
  if (typeof input === "string") return _resolveById(input);
  return listingPhotoBase(input);
}
export { exteriorFallback };
