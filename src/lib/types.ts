export interface Agent {
  id: string; slug: string; name: string; firstName: string;
  title: string; role: string; email: string; phone: string; officePhone: string;
  photo: string; licenses: string[]; leadership: boolean; support: boolean;
  yearsExperience: number; homesSold: number; volume: number; activeListings: number;
  rating: number; reviews: number; specialties: string[]; communities: string[];
  languages: string[]; bio: string;
  scorecardWeek?: { calls: number; texts: number; appts: number; agreements: number; showings: number; offers: number };
  responseTimeMins?: number;
  rank?: number;
}

export interface Community {
  name: string; slug: string; state: string; county: string; blurb: string; fullName: string;
  hero: string; thumb: string; medianPrice: number; medianPpsf: number; activeListings: number;
  avgDaysOnMarket: number; schoolRating: number; walkScore: number; yoyAppreciation: number;
  vibe: string[]; popular: boolean;
}

export type ListingStatus = "Active" | "New" | "Pending" | "Coming Soon" | "Sold";
export interface Listing {
  id: string; mlsId: string; address: string; city: string; state: string; zip: string;
  communitySlug: string; price: number; beds: number; baths: number; sqft: number;
  lotSize: string; yearBuilt: number; type: string; status: ListingStatus;
  pricePerSqft: number; daysOnMarket: number; hoa: number; garage: number;
  photos: string[]; agentSlug: string; featured: boolean; lat: number; lng: number;
  features: string[]; description: string;
}

export type LeadStage = "New" | "Nurture" | "Active" | "Showing" | "Offer" | "Under Contract" | "Closed" | "Lost";
export interface Lead {
  id: string; name: string; firstName: string; email: string; phone: string;
  source: string; stage: LeadStage; score: number; intent: string;
  budgetMin: number; budgetMax: number; communitySlug: string; community: string;
  assignedAgent: string; createdDaysAgo: number; lastContactDaysAgo: number;
  tags: string[]; aiSummary: string; unread: number;
  nextBestAction?: string;
  propertyViews?: string[];
  responseMinutes?: number;
  likelySeller?: boolean;
}

export interface Transaction {
  id: string; address: string; type: string; client: string; agentSlug: string;
  price: number; commission: number; stage: string; stageIndex: number;
  closeDateDaysOut: number; progress: number;
  checklist: { label: string; done: boolean }[]; riskFlag: string | null;
}

export interface Activity { id: number; agent: string; agentSlug: string; photo: string; text: string; minsAgo: number; }

export interface Automation {
  id: string; name: string; category: string; trigger: string;
  status: "active" | "paused"; runsThisMonth: number; lastRunMins: number; steps: string[];
}

export type IntegrationHealth = "Healthy" | "Needs auth" | "Failing";
export interface Integration {
  name: string;
  category: string;
  status: IntegrationHealth;
  description: string;
  records: number | null;
  /** Enriched Systems Health fields (additive) */
  provider?: string;
  legacyStatus?: "connected" | "available";
  lastSync?: string;
  recordsSynced?: number | null;
  errors?: number;
}

export interface Company {
  name: string; founder: string; tagline: string; phone: string; phoneRaw: string; email: string;
  address: { street: string; city: string; state: string; zip: string };
  hours: string; founded: number; logo: string; officeHero: string; officeMeeting: string;
  stats: Record<string, string | number>;
  social: Record<string, string>; awards: string[];
}

export interface Metrics {
  volumeByMonth: { month: string; volume: number; closings: number }[];
  leadsByMonth: { month: string; leads: number; converted: number }[];
  leadsBySource: { source: string; count: number }[];
  pipelineByStage: { stage: string; value: number; deals: number }[];
  funnel: { stage: string; count: number }[];
  kpis: Record<string, number>;
  speedToLeadMin?: number;
  staleLeadsCount?: number;
  sourceRoi?: { source: string; leads: number; closed: number; revenue: number; spend: number }[];
  agentLeaderboard?: { slug: string; name: string; responseTimeMins: number; leadsThisMonth: number; apptRate: number }[];
}

export type SellerLeadStage =
  | "New Request"
  | "Needs Valuation"
  | "Offer Pending"
  | "Offer Sent"
  | "Accepted"
  | "Converted to Listing"
  | "Dead";

export type PropertyCondition = "Good" | "Fair" | "Excellent" | "Needs Work";

export type SellerTimeline = "ASAP" | "1-3 months" | "3-6 months" | "6+ months";

export interface SellerLead {
  id: string;
  sellerName: string;
  address: string;
  city: string;
  estValue: number;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  condition: PropertyCondition;
  motivation: string;
  timeline: SellerTimeline;
  stage: SellerLeadStage;
  assignedAgent: string;
  daysInStage: number;
  notes: string;
  /** Canonical seller-intent signals (additive) */
  source?: string;
  sellerScore?: number;
  signals?: string[];
}

export type ListingPipelineStage =
  | "Intake"
  | "Photos Scheduled"
  | "MLS Draft"
  | "Broker Review"
  | "Active"
  | "Under Offer";

export interface ChecklistItem {
  label: string;
  done: boolean;
}

export interface ListingPipeline {
  id: string;
  address: string;
  city: string;
  beds: number;
  baths: number;
  sqft: number;
  price: number;
  yearBuilt: number;
  features: string[];
  agentSlug: string;
  agentName: string;
  stage: ListingPipelineStage;
  daysInStage: number;
  checklist: {
    prep: ChecklistItem[];
    photos: ChecklistItem[];
    mls: ChecklistItem[];
    marketing: ChecklistItem[];
    launch: ChecklistItem[];
  };
  brokerApproved: boolean;
  /** Canonical launch-readiness fields (additive) */
  readiness?: number;
  blockers?: string[];
}

// ---------------------------------------------------------------------------
// MatinOS module data layer (additive — Today, Systems Health, Marketing,
// Reports, Coaching). All names exported from data.ts.
// ---------------------------------------------------------------------------

export type WorkQueueCategory = "Call" | "Review" | "Approve" | "Coach" | "Send";
export type WorkQueueTab = "My Work" | "Team" | "High Risk" | "AI Drafts" | "Failed Automations";
export interface WorkQueueItem {
  id: string;
  category: WorkQueueCategory;
  subject: string;
  why: string;
  dueLabel: string;
  tab: WorkQueueTab;
  sourceType: string;
  sourceId: string;
  agent: string;
}

export type WorkflowRunStatus = "succeeded" | "failed" | "waiting_for_approval" | "running";
export type WorkflowStepStatus = "succeeded" | "failed" | "waiting" | "running";
export interface WorkflowStep {
  name: string;
  status: WorkflowStepStatus;
  detail: string;
}
export interface WorkflowRun {
  id: string;
  name: string;
  status: WorkflowRunStatus;
  subject: string;
  startedLabel: string;
  failedStep: string | null;
  steps: WorkflowStep[];
}

export type AIConfidence = "High" | "Medium" | "Low";
export type AIRiskTag = "Approval required" | "Ready" | "Auto-safe";
export type AIActionStatus = "pending" | "approved" | "rejected";
export interface AIAction {
  id: string;
  title: string;
  context: string;
  evidence: string;
  confidence: AIConfidence;
  riskTag: AIRiskTag;
  status: AIActionStatus;
  sourceType: string;
  sourceId: string;
}

export type CampaignStatus = "live" | "draft" | "scheduled" | "paused";
export interface Campaign {
  id: string;
  name: string;
  channel: string;
  status: CampaignStatus;
  audience: string;
  sent: number;
  openRate: number;
  replyRate: number;
  attributedPipeline: number;
}

export type MarketingAssetType = "Email" | "Social" | "Flyer" | "Ad" | "Web";
export type MarketingAssetStatus = "draft" | "approved" | "scheduled";
export interface MarketingAsset {
  id: string;
  campaignId: string;
  type: MarketingAssetType;
  title: string;
  status: MarketingAssetStatus;
  version: number;
  body: string;
}

export type DataQualitySeverity = "high" | "med" | "low";
export interface DataQualityIssue {
  id: string;
  issue: string;
  source: string;
  count: number;
  severity: DataQualitySeverity;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  timeLabel: string;
}

export interface CoachingScenario {
  id: string;
  title: string;
  category: string;
  prompt: string;
}

export interface ReportSourceRoi {
  source: string;
  leads: number;
  closed: number;
  revenue: number;
  spend: number;
  roi: number | null;
  cpl: number;
}
export interface ReportAgentLeaderboardRow {
  agent: string;
  slug: string;
  leads: number;
  appts: number;
  signed: number;
  gci: number;
}
export interface ReportFunnelStage {
  stage: string;
  count: number;
}
export interface ReportPipelineStage {
  stage: string;
  value: number;
  deals: number;
}
export interface ReportMarketingRow {
  campaign: string;
  channel: string;
  sent: number;
  openRate: number;
  replyRate: number;
  attributedPipeline: number;
}
export interface CompanyScorecard {
  annualVolume: number;
  activeListings: number;
  propertiesSold: number;
  growthPct: number;
  gci: number;
  avgSalePrice: number;
  goalPacing: {
    volumeGoal: number;
    volumeActual: number;
    volumePacePct: number;
    soldGoal: number;
    soldActual: number;
    soldPacePct: number;
    forecastVolume: number;
    statusHeadline: string;
  };
}
export interface ReportMetrics {
  companyScorecard: CompanyScorecard;
  sourceRoi: ReportSourceRoi[];
  agentLeaderboard: ReportAgentLeaderboardRow[];
  funnel: ReportFunnelStage[];
  pipeline: ReportPipelineStage[];
  marketingPerformance: ReportMarketingRow[];
  automationImpact: {
    hoursSavedThisMonth: number;
    tasksAutomated: number;
    aiDraftsApproved: number;
    speedToLeadMin: number;
  };
}

export type BuyerAgreementStatus = "Not Signed" | "Sent" | "Signed";
export type PreapprovalStatus = "Yes" | "No" | "In Progress";
export type BuyerTimeline = "Immediately" | "1-3 months" | "3-6 months";

export interface BuyerAgreement {
  id: string;
  name: string;
  email: string;
  phone: string;
  agentSlug: string;
  agentName: string;
  budgetMin: number;
  budgetMax: number;
  areas: string[];
  preapproval: PreapprovalStatus;
  agreementStatus: BuyerAgreementStatus;
  showingCount: number;
  lastContactDaysAgo: number;
  timeline: BuyerTimeline;
  notes: string;
}
