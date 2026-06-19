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
import type {
  Agent, Community, Listing, Lead, Transaction, Activity,
  Metrics, Automation, Integration, Company,
} from "./types";

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
