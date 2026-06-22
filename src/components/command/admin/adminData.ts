/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Admin Settings local demo data (section-scoped)

   Section-private typed records that back the de-emphasized back-office views
   (routing rules, ownership/access, alert/automation config, AI policy,
   templates, teams, users). These are NOT part of the global @/lib/data layer.

   REAL-DATA (G-A · S12 ticket 2): every operator here is a REAL Matin agent
   from agents.json — NO invented operators (Ava Brooks / Marcus Lee / Nina
   Patel / Evan Carter / Taylor Reed / Priya Shah are fully purged). Members are
   carried by `slug` so <Avatar slug> always resolves a real headshot (never a
   gray-initials fallback). Names/titles/emails are pulled straight from the
   roster via the helper below.
   ────────────────────────────────────────────────────────────────────────── */

import agentsJson from "@/lib/data/agents.json";
import auditLogsJson from "@/lib/data/audit-logs.json";
import type { Agent } from "@/lib/types";

const agents = agentsJson as Agent[];
const auditCount = (auditLogsJson as unknown[]).length;
const bySlug = new Map(agents.map((a) => [a.slug, a]));

/** Real agent lookup — throws at module load if a slug is mistyped (fail fast). */
function real(slug: string): Agent {
  const a = bySlug.get(slug);
  if (!a) throw new Error(`adminData: unknown agent slug "${slug}"`);
  return a;
}

/* ── Labeled criteria chips (S12 ticket 6 — BoldTrail density) ─────────────── */

export type CriterionChip = { label: string; value: string };

export type RoutingType = "Blast" | "Round Robin";

export type RuleMember = {
  /** REAL agent slug → real headshot + display name. */
  slug: string;
  name: string;
  /** Round-robin weight (Blast rules ignore weights). */
  weight: number;
};

export type RoutingRule = {
  id: string;
  source: string;
  sourceMeta: string;
  /** Labeled criteria chips (Price: $600k+ / Type: Buyer / Area: Portland Metro). */
  criteria: CriterionChip[];
  type: RoutingType;
  members: RuleMember[]; // ordered recipients with weights
  team: string;
  status: "active" | "paused";
  priority: number;
  leadsRouted30d: number;
  /** Fired count over the trailing 7 days (S12 ticket 4 per-row stat). */
  fired7d: number;
  lastTriggered: string;
  /** Plain-English description used in the edit drawer + AI message preview. */
  firstResponseSla: string;
  lastChangedBy: string;
  lastChangedAt: string;
};

/** Build an ordered member list from real slugs with weights. */
function members(...rows: [string, number][]): RuleMember[] {
  return rows.map(([slug, weight]) => ({ slug, name: real(slug).name, weight }));
}

/** Lead-routing rules — ordered by priority (1 = evaluated first). */
export const routingRules: RoutingRule[] = [
  {
    id: "RR-001",
    source: "MatinRealEstate.com / IDX Search",
    sourceMeta: "Saved-search + property inquiry",
    criteria: [
      { label: "Area", value: "Portland Metro" },
      { label: "Type", value: "Buyer" },
      { label: "Price", value: "$600k+" },
    ],
    type: "Round Robin",
    members: members(["chase-bright", 3], ["amanda-conlon", 2], ["andy-wilcox", 1]),
    team: "Oregon",
    status: "active",
    priority: 1,
    leadsRouted30d: 184,
    fired7d: 43,
    lastTriggered: "8 min ago",
    firstResponseSla: "5 minutes",
    lastChangedBy: "Jordan Matin",
    lastChangedAt: "22 min ago",
  },
  {
    id: "RR-002",
    source: "Zillow / Premier Agent",
    sourceMeta: "Paid lead feed (de-duplicated)",
    criteria: [
      { label: "Area", value: "Lake Oswego, West Linn" },
      { label: "Type", value: "Buyer or Seller" },
    ],
    type: "Round Robin",
    members: members(["amy-mead", 2], ["chase-bright", 1]),
    team: "Oregon",
    status: "active",
    priority: 2,
    leadsRouted30d: 96,
    fired7d: 21,
    lastTriggered: "34 min ago",
    firstResponseSla: "5 minutes",
    lastChangedBy: "Alicia Smith",
    lastChangedAt: "2 days ago",
  },
  {
    id: "RR-003",
    source: "Cash Offer request",
    sourceMeta: "Seller intent ≥ 80 · high equity",
    criteria: [
      { label: "Seller score", value: "≥ 80" },
      { label: "Equity", value: "≥ 40%" },
      { label: "Market", value: "Any" },
    ],
    type: "Blast",
    members: members(["sierra-palmeri", 1], ["alicia-smith", 1]),
    team: "Leadership",
    status: "active",
    priority: 3,
    leadsRouted30d: 41,
    fired7d: 9,
    lastTriggered: "2 hr ago",
    firstResponseSla: "10 minutes",
    lastChangedBy: "Jordan Matin",
    lastChangedAt: "6 days ago",
  },
  {
    id: "RR-004",
    source: "Open House sign-in",
    sourceMeta: "QR / kiosk capture",
    criteria: [
      { label: "First", value: "Listing agent 24h" },
      { label: "Then", value: "Round Robin · Oregon" },
    ],
    type: "Round Robin",
    members: members(["andy-wilcox", 2], ["amanda-conlon", 2], ["amy-mead", 1]),
    team: "Oregon",
    status: "active",
    priority: 4,
    leadsRouted30d: 58,
    fired7d: 12,
    lastTriggered: "5 hr ago",
    firstResponseSla: "1 hour",
    lastChangedBy: "Sierra Seggerman",
    lastChangedAt: "1 week ago",
  },
  {
    id: "RR-005",
    source: "SW Washington / RMLS",
    sourceMeta: "Vancouver + Clark County",
    criteria: [
      { label: "State", value: "WA" },
      { label: "Type", value: "Buyer" },
      { label: "License", value: "Dual-licensed" },
    ],
    type: "Round Robin",
    members: members(["amy-mead", 1], ["andy-wilcox", 1]),
    team: "Washington",
    status: "active",
    priority: 5,
    leadsRouted30d: 33,
    fired7d: 7,
    lastTriggered: "Yesterday",
    firstResponseSla: "15 minutes",
    lastChangedBy: "Amy Mead",
    lastChangedAt: "3 days ago",
  },
  {
    id: "RR-006",
    source: "Recruiting inquiry",
    sourceMeta: "Careers page form",
    criteria: [
      { label: "Tag", value: "agent-recruit" },
      { label: "Route", value: "Leadership" },
    ],
    type: "Blast",
    members: members(["alicia-smith", 1], ["jordan-matin", 1]),
    team: "Leadership",
    status: "paused",
    priority: 6,
    leadsRouted30d: 0,
    fired7d: 0,
    lastTriggered: "Paused 3 weeks ago",
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
  ownedBySlug: "jordan-matin",
  ownedByTitle: "Founder & Principal Broker",
  assignedTo: "Alicia Smith",
  assignedToSlug: "alicia-smith",
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
  /** Fired count over the trailing 7 days (S12 ticket 4 per-row stat). */
  fired7d: number;
};

export const statusConfig: StatusConfigRow[] = [
  {
    id: "SC-001",
    status: "New lead routed",
    statusTone: "info",
    notify: { label: "Push + email to assigned agent", on: true },
    automate: { label: "AI drafts first reply (held for approval)", on: true, risk: "approval" },
    fired7d: 312,
  },
  {
    id: "SC-002",
    status: "Uncontacted > 24h",
    statusTone: "warn",
    notify: { label: "Slack + email nudge to agent", on: true },
    automate: { label: "Auto-enroll in 5-touch nurture", on: true, risk: "auto" },
    fired7d: 47,
  },
  {
    id: "SC-003",
    status: "Hot seller signal",
    statusTone: "danger",
    notify: { label: "Alert agent + team lead", on: true },
    automate: { label: "AI generates home-value outreach (approval)", on: true, risk: "approval" },
    fired7d: 18,
  },
  {
    id: "SC-004",
    status: "Buyer agreement unsigned > 3d",
    statusTone: "warn",
    notify: { label: "Email reminder to agent", on: true },
    automate: { label: "Auto-resend the e-signature request", on: false, risk: "auto" },
    fired7d: 6,
  },
  {
    id: "SC-005",
    status: "Contract deadline < 48h",
    statusTone: "danger",
    notify: { label: "SMS + push to agent & TC", on: true },
    automate: { label: "Create Today risk item + checklist", on: true, risk: "auto" },
    fired7d: 11,
  },
  {
    id: "SC-006",
    status: "Automation didn't run",
    statusTone: "danger",
    notify: { label: "Email admin + alert in Systems Health", on: true },
    automate: { label: "Try again up to 3×, then escalate", on: true, risk: "auto" },
    fired7d: 3,
  },
];

/** Leads routed (30d) mini-bar source (S12 ticket 9) — reconciles to rules. */
export const leadsRouted30d = routingRules.map((r) => ({
  id: r.id,
  source: r.source,
  count: r.leadsRouted30d,
}));

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

/* ── Users & Roles (REAL agents only) ──────────────────────────────────────── */

export type UserRow = {
  id: string;
  slug: string;
  name: string;
  email: string;
  role: string;
  team: string;
  status: "active" | "invited" | "deactivated";
  lastActive: string;
};

/** One real agent → a user row (display fields pulled from the roster). */
function userRow(
  id: string,
  slug: string,
  role: string,
  team: string,
  status: UserRow["status"],
  lastActive: string,
): UserRow {
  const a = real(slug);
  return { id, slug, name: a.name, email: a.email, role, team, status, lastActive };
}

/**
 * Active roster sample (REAL agents). The full brokerage is 40 agents; these
 * rows are the operators/leads the Admin views surface — all real, all with
 * headshots. Two "invited" rows are REAL roster agents shown mid-onboarding
 * (no invented people).
 */
export const userRows: UserRow[] = [
  userRow("U-001", "jordan-matin", "Owner · Principal Broker", "Leadership", "active", "Online now"),
  userRow("U-002", "alicia-smith", "Managing Principal Broker", "Leadership", "active", "8 min ago"),
  userRow("U-003", "chase-bright", "Agent — Licensed Broker", "Oregon", "active", "Online now"),
  userRow("U-004", "sierra-palmeri", "Listing Coordinator", "Operations", "active", "38 min ago"),
  userRow("U-005", "paris-vollstedt", "Transaction Coordinator", "Operations", "active", "1 hr ago"),
  userRow("U-006", "kimberly-ilosvay", "Marketing Director", "Operations", "active", "2 hr ago"),
  userRow("U-007", "amy-mead", "Agent — OR & WA Broker", "Washington", "active", "Yesterday"),
  userRow("U-008", "lexa-brice", "Agent — Licensed Broker", "Oregon", "active", "26 min ago"),
  userRow("U-009", "reed-bright", "Agent — Licensed Broker", "Oregon", "invited", "Invite sent 2d ago"),
  userRow("U-010", "nick-chamberlin", "Agent — Licensed Broker", "Oregon", "invited", "Invite sent 4h ago"),
];

/** Real agents available to add as routing recipients / invite (by slug). */
export const assignableAgents: { slug: string; name: string }[] = [
  "chase-bright",
  "amanda-conlon",
  "andy-wilcox",
  "amy-mead",
  "sierra-palmeri",
  "alicia-smith",
  "jordan-matin",
  "paris-vollstedt",
  "lexa-brice",
  "joshua-rose",
  "russell-xay",
  "reed-bright",
  "nick-chamberlin",
  "kimberly-ilosvay",
].map((slug) => ({ slug, name: real(slug).name }));

export const roleDefs: { role: string; members: number; scope: string }[] = [
  { role: "Owner", members: 1, scope: "Full access · billing · audit export" },
  { role: "Managing Broker", members: 1, scope: "All records · compliance · approve AI" },
  { role: "Agent", members: 35, scope: "Own + shared records · draft AI" },
  { role: "Listing Coordinator", members: 1, scope: "Listings · marketing · no compliance" },
  { role: "Transaction Coordinator", members: 1, scope: "Transactions · docs · checklists" },
  { role: "Marketing Director", members: 1, scope: "Campaigns · brand kit · assets" },
];

export const settingsCategories: SettingsCategory[] = [
  { key: "users", label: "Users & Roles", desc: "Members, roles, permissions, invites", count: 40 },
  { key: "teams", label: "Teams & Offices", desc: "Teams, markets, territories", count: 4 },
  { key: "routing", label: "Lead Routing", desc: "Assignment rules & recipients", count: routingRules.length },
  { key: "templates", label: "Templates", desc: "Checklists, documents, forms", count: 5 },
  { key: "brand", label: "Brand Kit", desc: "Logo, colors, voice, merge fields", count: 8 },
  { key: "ai-policies", label: "AI Policies", desc: "Approvals & safeguards", count: 7 },
  { key: "notifications", label: "Notifications", desc: "Alerts vs automation", count: statusConfig.length },
  { key: "audit", label: "Audit Log", desc: "Every admin & system change", count: auditCount },
];

/* ── Teams & Offices (real leads by slug) ──────────────────────────────────── */

export type TeamRow = {
  id: string;
  name: string;
  office: string;
  lead: string;
  leadSlug: string;
  members: number;
  markets: string;
};

function teamRow(
  id: string,
  name: string,
  office: string,
  leadSlug: string,
  members: number,
  markets: string,
): TeamRow {
  return { id, name, office, lead: real(leadSlug).name, leadSlug, members, markets };
}

export const teamRows: TeamRow[] = [
  teamRow("T-001", "Oregon", "West Linn HQ", "alicia-smith", 28, "Portland Metro, Lake Oswego, West Linn"),
  teamRow("T-002", "Washington", "Vancouver Satellite", "amy-mead", 9, "Clark County, Vancouver"),
  teamRow("T-003", "Operations", "West Linn HQ", "sierra-palmeri", 4, "Brokerage-wide"),
  teamRow("T-004", "Leadership", "West Linn HQ", "jordan-matin", 3, "Brokerage-wide"),
];

/* ── Templates ─────────────────────────────────────────────────────────────── */

export type TemplateRow = {
  id: string;
  name: string;
  kind: "Checklist" | "Document" | "Email";
  /** Form/template id printed on the BrandedDocument preview. */
  formId?: string;
  version: string;
  updatedBy: string;
  updatedAt: string;
  status: "published" | "draft";
};

export const templateRows: TemplateRow[] = [
  { id: "TPL-001", name: "Listing launch checklist", kind: "Checklist", formId: "MRE-LL-04", version: "v4.2", updatedBy: "Sierra Seggerman", updatedAt: "2 days ago", status: "published" },
  { id: "TPL-002", name: "Buyer agreement (OREF C-565)", kind: "Document", formId: "OREF C-565", version: "v2.1", updatedBy: "Alicia Smith", updatedAt: "1 week ago", status: "published" },
  { id: "TPL-003", name: "Seller disclosure packet", kind: "Document", formId: "OREF SP-100", version: "v3.0", updatedBy: "Paris Vollstedt", updatedAt: "3 days ago", status: "published" },
  { id: "TPL-004", name: "Under-contract concierge checklist", kind: "Checklist", formId: "MRE-UC-02", version: "v1.8", updatedBy: "Paris Vollstedt", updatedAt: "5 hr ago", status: "draft" },
  { id: "TPL-005", name: "New-lead first reply", kind: "Email", formId: "MRE-EM-06", version: "v6.0", updatedBy: "Kimberly Ilosvay", updatedAt: "Yesterday", status: "published" },
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

/* ── Brand Kit (S12 ticket 3) — wordmark lockups + gold AI tokens ──────────── */

export type BrandSwatch = { name: string; hex: string; cls: string; note?: string };

/** Core ink/paper/status palette. */
export const brandCoreSwatches: BrandSwatch[] = [
  { name: "Ink", hex: "#060606", cls: "bg-ink", note: "Primary text · dark surfaces" },
  { name: "Paper", hex: "#F6F6F5", cls: "bg-paper", note: "Workspace canvas" },
  { name: "Cloud", hex: "#FFFFFF", cls: "bg-cloud", note: "Card surface" },
  { name: "Success", hex: "#56A07D", cls: "bg-success", note: "Good · complete · up" },
  { name: "Warn", hex: "#C1934A", cls: "bg-warn", note: "Pending · attention" },
  { name: "Danger", hex: "#C0584A", cls: "bg-danger", note: "At-risk · failed · cost" },
];

/** Estate Green AI-accent tokens — rationed to AI/active states only (S12 ticket 3). */
export const brandGoldSwatches: BrandSwatch[] = [
  { name: "Estate Green", hex: "#1F6B4A", cls: "bg-gold", note: "Ask AI · Run · active" },
  { name: "Estate Green bright", hex: "#2F8A60", cls: "bg-gold-bright", note: "Hover · score ring" },
  { name: "Estate Green soft", hex: "#E7F1EA", cls: "bg-gold-soft", note: "AI chip fill" },
];
