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

export interface Integration { name: string; category: string; status: "connected" | "available"; description: string; records: number | null; }

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
