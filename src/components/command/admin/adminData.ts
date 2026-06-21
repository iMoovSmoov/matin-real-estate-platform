/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Admin Settings local demo data (section-scoped)

   Section-private typed records that back the de-emphasized back-office views.
   These are NOT part of the global @/lib/data layer — they're settings-domain
   records (routing rules, ownership/access, alert/automation config, AI policy,
   templates, teams, users) that only the Admin section composes. Real domain
   data (audit logs, agents) still comes from @/lib/data.

   Member initials/names reuse REAL agents from the agents.json roster so the
   InitialsToken clusters reconcile with the rest of MatinOS.
   ────────────────────────────────────────────────────────────────────────── */

export type RoutingType = "Blast" | "Round Robin";

export type RuleMember = {
  name: string;
  /** Round-robin weight (Blast rules ignore weights). */
  weight: number;
};

export type RoutingRule = {
  id: string;
  source: string;
  sourceMeta: string;
  criteria: string[];
  type: RoutingType;
  members: RuleMember[]; // ordered recipients with weights
  team: string;
  status: "active" | "paused";
  priority: number;
  leadsRouted30d: number;
  /** Plain-English description used in the edit drawer + AI message preview. */
  firstResponseSla: string;
  lastChangedBy: string;
  lastChangedAt: string;
};

/** Build an ordered member list with sensible default weights. */
function members(...rows: [string, number][]): RuleMember[] {
  return rows.map(([name, weight]) => ({ name, weight }));
}

/** Lead-routing rules — ordered by priority (1 = evaluated first). */
export const routingRules: RoutingRule[] = [
  {
    id: "RR-001",
    source: "MatinRealEstate.com / IDX Search",
    sourceMeta: "Saved-search + property inquiry",
    criteria: ["Area: Portland Metro", "Type: Buyer", "Price ≥ $600k"],
    type: "Round Robin",
    members: members(["Ava Brooks", 3], ["Amanda Conlon", 2], ["Andy Wilcox", 1]),
    team: "Oregon",
    status: "active",
    priority: 1,
    leadsRouted30d: 184,
    firstResponseSla: "5 minutes",
    lastChangedBy: "Jordan Matin",
    lastChangedAt: "22 min ago",
  },
  {
    id: "RR-002",
    source: "Zillow / Premier Agent",
    sourceMeta: "Paid lead feed (idempotency-keyed)",
    criteria: ["Area: Lake Oswego, West Linn", "Type: Buyer or Seller"],
    type: "Round Robin",
    members: members(["Amy Mead", 2], ["Ava Brooks", 1]),
    team: "Oregon",
    status: "active",
    priority: 2,
    leadsRouted30d: 96,
    firstResponseSla: "5 minutes",
    lastChangedBy: "Alicia Smith",
    lastChangedAt: "2 days ago",
  },
  {
    id: "RR-003",
    source: "Cash Offer request",
    sourceMeta: "Seller intent ≥ 80 / equity signal",
    criteria: ["Seller-intent score ≥ 80", "Equity ≥ 40%", "Any market"],
    type: "Blast",
    members: members(["Marcus Lee", 1], ["Alicia Smith", 1]),
    team: "Leadership",
    status: "active",
    priority: 3,
    leadsRouted30d: 41,
    firstResponseSla: "10 minutes",
    lastChangedBy: "Jordan Matin",
    lastChangedAt: "6 days ago",
  },
  {
    id: "RR-004",
    source: "Open House sign-in",
    sourceMeta: "QR / kiosk capture",
    criteria: ["Listing agent owns 24h", "Then Round Robin Oregon"],
    type: "Round Robin",
    members: members(["Andy Wilcox", 2], ["Amanda Conlon", 2], ["Amy Mead", 1]),
    team: "Oregon",
    status: "active",
    priority: 4,
    leadsRouted30d: 58,
    firstResponseSla: "1 hour",
    lastChangedBy: "Marcus Lee",
    lastChangedAt: "1 week ago",
  },
  {
    id: "RR-005",
    source: "SW Washington / RMLS",
    sourceMeta: "Vancouver + Clark County",
    criteria: ["State: WA", "Type: Buyer", "Dual-licensed only"],
    type: "Round Robin",
    members: members(["Amy Mead", 1], ["Andy Wilcox", 1]),
    team: "Washington",
    status: "active",
    priority: 5,
    leadsRouted30d: 33,
    firstResponseSla: "15 minutes",
    lastChangedBy: "Amy Mead",
    lastChangedAt: "3 days ago",
  },
  {
    id: "RR-006",
    source: "Recruiting inquiry",
    sourceMeta: "Careers page form",
    criteria: ["Tag: agent-recruit", "Route to leadership"],
    type: "Blast",
    members: members(["Alicia Smith", 1], ["Jordan Matin", 1]),
    team: "Leadership",
    status: "paused",
    priority: 6,
    leadsRouted30d: 0,
    firstResponseSla: "Same day",
    lastChangedBy: "Jordan Matin",
    lastChangedAt: "3 weeks ago",
  },
];

/* ── Ownership / Access (record-level, BoldTrail pattern) ──────────────────── */

export type AccessLevel = "Private" | "Team" | "Office" | "Brokerage";

export const ruleOwnership = {
  ruleId: "RR-001",
  ruleName: "IDX Search → Round Robin (Portland Metro)",
  ownedBy: "Jordan Matin",
  ownedByTitle: "Principal Broker · Owner",
  assignedTo: "Alicia Smith",
  assignedToTitle: "Managing Principal Broker",
  sharedWith: ["Oregon Team", "Leadership"],
  access: "Private" as AccessLevel,
  trust: ["Validated", "Private Contact"],
  lastChangedBy: "Jordan Matin",
  lastChangedAt: "22 min ago",
};

/* ── Behavioral Alerts vs Automation (per-status config grid) ──────────────── */

export type AlertTone = "success" | "danger" | "warn" | "info" | "ink";

export type StatusConfigRow = {
  id: string;
  status: string;
  statusTone: AlertTone;
  /** Left column — what notifies a human. */
  notify: { label: string; on: boolean };
  /** Right column — what the system does automatically. */
  automate: { label: string; on: boolean; risk?: "auto" | "approval" };
};

export const statusConfig: StatusConfigRow[] = [
  {
    id: "SC-001",
    status: "New lead routed",
    statusTone: "info",
    notify: { label: "Push + email to assigned agent", on: true },
    automate: { label: "AI drafts first reply (held for approval)", on: true, risk: "approval" },
  },
  {
    id: "SC-002",
    status: "Uncontacted > 24h",
    statusTone: "warn",
    notify: { label: "Slack + email nudge to agent", on: true },
    automate: { label: "Auto-enroll in 5-touch nurture", on: true, risk: "auto" },
  },
  {
    id: "SC-003",
    status: "Hot seller signal",
    statusTone: "danger",
    notify: { label: "Alert agent + team lead", on: true },
    automate: { label: "AI generates home-value outreach (approval)", on: true, risk: "approval" },
  },
  {
    id: "SC-004",
    status: "Buyer agreement unsigned > 3d",
    statusTone: "warn",
    notify: { label: "Email reminder to agent", on: true },
    automate: { label: "Auto-resend signature envelope", on: false, risk: "auto" },
  },
  {
    id: "SC-005",
    status: "Contract deadline < 48h",
    statusTone: "danger",
    notify: { label: "SMS + push to agent & TC", on: true },
    automate: { label: "Create Today risk item + checklist", on: true, risk: "auto" },
  },
  {
    id: "SC-006",
    status: "Workflow failed",
    statusTone: "danger",
    notify: { label: "Email admin + Systems Health flag", on: true },
    automate: { label: "Retry up to 3× then escalate", on: true, risk: "auto" },
  },
];

/* ── Settings categories (sidebar) ─────────────────────────────────────────── */

export type CategoryKey =
  | "users"
  | "teams"
  | "routing"
  | "templates"
  | "brand"
  | "ai-policies"
  | "notifications"
  | "audit";

export type SettingsCategory = {
  key: CategoryKey;
  label: string;
  desc: string;
  count?: number;
};

export const settingsCategories: SettingsCategory[] = [
  { key: "users", label: "Users & Roles", desc: "Members, roles, permissions, invites", count: 44 },
  { key: "teams", label: "Teams & Offices", desc: "Teams, markets, territories", count: 4 },
  { key: "routing", label: "Lead Routing", desc: "Assignment rules & recipients", count: 6 },
  { key: "templates", label: "Templates", desc: "Checklists, documents, forms", count: 18 },
  { key: "brand", label: "Brand Kit", desc: "Logo, colors, voice, merge fields" },
  { key: "ai-policies", label: "AI Policies", desc: "Approval gates & guardrails", count: 7 },
  { key: "notifications", label: "Notifications", desc: "Alerts vs automation", count: 6 },
  { key: "audit", label: "Audit Log", desc: "Every admin & system change" },
];

/* ── Users & Roles ─────────────────────────────────────────────────────────── */

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  status: "active" | "invited" | "deactivated";
  lastActive: string;
};

export const userRows: UserRow[] = [
  { id: "U-001", name: "Jordan Matin", email: "jordan@matinrealestate.com", role: "Owner · Principal Broker", team: "Leadership", status: "active", lastActive: "Online now" },
  { id: "U-002", name: "Alicia Smith", email: "alicia@matinrealestate.com", role: "Managing Principal Broker", team: "Leadership", status: "active", lastActive: "8 min ago" },
  { id: "U-003", name: "Ava Brooks", email: "ava@matinrealestate.com", role: "Agent — Licensed Broker", team: "Oregon", status: "active", lastActive: "Online now" },
  { id: "U-004", name: "Marcus Lee", email: "marcus@matinrealestate.com", role: "Listing Coordinator", team: "Operations", status: "active", lastActive: "38 min ago" },
  { id: "U-005", name: "Evan Carter", email: "evan@matinrealestate.com", role: "Transaction Coordinator", team: "Operations", status: "active", lastActive: "1 hr ago" },
  { id: "U-006", name: "Nina Patel", email: "nina@matinrealestate.com", role: "Marketing Director", team: "Operations", status: "active", lastActive: "2 hr ago" },
  { id: "U-007", name: "Amy Mead", email: "amy@matinrealestate.com", role: "Agent — OR & WA Broker", team: "Washington", status: "active", lastActive: "Yesterday" },
  { id: "U-008", name: "Taylor Reed", email: "taylor@matinrealestate.com", role: "Agent — Licensed Broker", team: "Oregon", status: "invited", lastActive: "Invite sent 2d ago" },
  { id: "U-009", name: "Priya Shah", email: "priya@matinrealestate.com", role: "Agent — Licensed Broker", team: "Oregon", status: "invited", lastActive: "Invite sent 4h ago" },
];

export const roleDefs: { role: string; members: number; scope: string }[] = [
  { role: "Owner", members: 1, scope: "Full access · billing · audit export" },
  { role: "Managing Broker", members: 1, scope: "All records · compliance · approve AI" },
  { role: "Agent", members: 38, scope: "Own + shared records · draft AI" },
  { role: "Listing Coordinator", members: 1, scope: "Listings · marketing · no compliance" },
  { role: "Transaction Coordinator", members: 1, scope: "Transactions · docs · checklists" },
  { role: "Marketing Director", members: 1, scope: "Campaigns · brand kit · assets" },
];

/* ── Teams & Offices ───────────────────────────────────────────────────────── */

export const teamRows: { id: string; name: string; office: string; lead: string; members: number; markets: string }[] = [
  { id: "T-001", name: "Oregon", office: "West Linn HQ", lead: "Alicia Smith", members: 28, markets: "Portland Metro, Lake Oswego, West Linn" },
  { id: "T-002", name: "Washington", office: "Vancouver Satellite", lead: "Amy Mead", members: 9, markets: "Clark County, Vancouver" },
  { id: "T-003", name: "Operations", office: "West Linn HQ", lead: "Marcus Lee", members: 4, markets: "Brokerage-wide" },
  { id: "T-004", name: "Leadership", office: "West Linn HQ", lead: "Jordan Matin", members: 3, markets: "Brokerage-wide" },
];

/* ── Templates ─────────────────────────────────────────────────────────────── */

export const templateRows: {
  id: string;
  name: string;
  kind: "Checklist" | "Document" | "Email";
  version: string;
  updatedBy: string;
  updatedAt: string;
  status: "published" | "draft";
}[] = [
  { id: "TPL-001", name: "Listing launch checklist", kind: "Checklist", version: "v4.2", updatedBy: "Marcus Lee", updatedAt: "2 days ago", status: "published" },
  { id: "TPL-002", name: "Buyer agreement (OREF C-565)", kind: "Document", version: "v2.1", updatedBy: "Alicia Smith", updatedAt: "1 week ago", status: "published" },
  { id: "TPL-003", name: "Seller disclosure packet", kind: "Document", version: "v3.0", updatedBy: "Evan Carter", updatedAt: "3 days ago", status: "published" },
  { id: "TPL-004", name: "Under-contract concierge checklist", kind: "Checklist", version: "v1.8", updatedBy: "Evan Carter", updatedAt: "5 hr ago", status: "draft" },
  { id: "TPL-005", name: "New-lead first reply", kind: "Email", version: "v6.0", updatedBy: "Nina Patel", updatedAt: "Yesterday", status: "published" },
];

/* ── AI Policies ───────────────────────────────────────────────────────────── */

export type AiPolicyRow = {
  id: string;
  capability: string;
  scope: string;
  mode: "Approval required" | "Auto-safe" | "Off";
  risk: "high" | "medium" | "low";
};

export const aiPolicyRows: AiPolicyRow[] = [
  { id: "AIP-001", capability: "Client-facing message drafts", scope: "Email, SMS to leads/clients", mode: "Approval required", risk: "high" },
  { id: "AIP-002", capability: "Legal & compliance documents", scope: "Agreements, disclosures, addenda", mode: "Approval required", risk: "high" },
  { id: "AIP-003", capability: "Internal summaries & notes", scope: "Call summaries, overnight digest", mode: "Auto-safe", risk: "low" },
  { id: "AIP-004", capability: "Lead & seller-intent scoring", scope: "CRM scoring, signal extraction", mode: "Auto-safe", risk: "low" },
  { id: "AIP-005", capability: "Marketing asset generation", scope: "Flyers, social, listing copy", mode: "Approval required", risk: "medium" },
  { id: "AIP-006", capability: "Routing-rule conflict suggestions", scope: "Admin settings advisories", mode: "Auto-safe", risk: "low" },
  { id: "AIP-007", capability: "Automated outbound send", scope: "Any message leaving the brokerage", mode: "Off", risk: "high" },
];
