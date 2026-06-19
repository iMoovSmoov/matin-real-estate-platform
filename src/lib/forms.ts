/* ──────────────────────────────────────────────────────────────────────────
   Real-estate forms & data-flow catalog (Oregon-grounded).
   Powers the "Forms & Data Flows" and "Contract Builder" modules — the
   answer to the job's "replace spreadsheets and Google Forms with structured
   data + AI-powered contract workflows."
   Form names reference the real OREF (Oregon Real Estate Forms) standard
   library + federal disclosures + Matin internal ops forms.
   ────────────────────────────────────────────────────────────────────────── */

export type FormCategory =
  | "Listing"
  | "Buyer"
  | "Agency & Disclosure"
  | "Offer & Negotiation"
  | "Addenda"
  | "Transaction & Compliance"
  | "Internal Ops";

export const FORM_CATEGORIES: FormCategory[] = [
  "Listing",
  "Buyer",
  "Agency & Disclosure",
  "Offer & Negotiation",
  "Addenda",
  "Transaction & Compliance",
  "Internal Ops",
];

export type FieldType =
  | "text"
  | "number"
  | "currency"
  | "date"
  | "select"
  | "textarea"
  | "checkbox"
  | "signature";

export interface ReFormField {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  /** Can be auto-filled from CRM / MLS / listing data (kills duplicate entry). */
  autofill?: boolean;
  required?: boolean;
}

export interface ReForm {
  code: string;
  name: string;
  category: FormCategory;
  /** Official OREF standard-library form. */
  oref: boolean;
  description: string;
  /** The spreadsheet / Google Form / paper process this replaces. */
  replaces: string;
  /** What Claude does on this form. */
  aiAssist: string;
  esign: boolean;
  /** Statute / regulatory note where relevant. */
  compliance?: string;
  /** Usage frequency across deals, 0–100 (drives "most used" sort). */
  popularity: number;
  pillar: "Structured Data" | "Contract Systems" | "AI Integration";
  fields: ReFormField[];
}

const sig: ReFormField = { name: "signature", label: "Signature", type: "signature" };

export const reForms: ReForm[] = [
  {
    code: "OREF-001",
    name: "Residential Real Estate Sale Agreement",
    category: "Offer & Negotiation",
    oref: true,
    description:
      "The core purchase contract for Oregon residential transactions — price, terms, contingencies, and timelines.",
    replaces: "Hand-keyed offers + a deadlines spreadsheet",
    aiAssist:
      "Auto-fills buyer, property & financing from the CRM, drafts contingency language, and flags missing terms before send.",
    esign: true,
    compliance: "OREF standard form · ORS Chapter 696",
    popularity: 98,
    pillar: "Contract Systems",
    fields: [
      { name: "buyer", label: "Buyer name(s)", type: "text", autofill: true, required: true },
      { name: "property", label: "Property address", type: "text", autofill: true, required: true },
      { name: "price", label: "Purchase price", type: "currency", autofill: true, required: true },
      { name: "earnest", label: "Earnest money", type: "currency" },
      { name: "financing", label: "Financing", type: "select", options: ["Conventional", "FHA", "VA", "Cash", "Other"] },
      { name: "closeDate", label: "Target closing date", type: "date" },
      { name: "contingencies", label: "Contingencies", type: "textarea" },
      sig,
    ],
  },
  {
    code: "OREF-015",
    name: "Residential Listing Agreement — Exclusive",
    category: "Listing",
    oref: true,
    description: "Exclusive right-to-sell listing engagement between the seller and Matin Real Estate.",
    replaces: "Word template + commission tracker spreadsheet",
    aiAssist: "Pulls seller + property from the listing record, proposes list price from the AI CMA, and sets the term.",
    esign: true,
    compliance: "OREF standard form · includes agency disclosure",
    popularity: 95,
    pillar: "Contract Systems",
    fields: [
      { name: "seller", label: "Seller name(s)", type: "text", autofill: true, required: true },
      { name: "property", label: "Property address", type: "text", autofill: true, required: true },
      { name: "listPrice", label: "List price", type: "currency", autofill: true, required: true },
      { name: "commission", label: "Commission", type: "text" },
      { name: "term", label: "Listing term", type: "text" },
      { name: "agent", label: "Listing broker", type: "text", autofill: true },
      sig,
    ],
  },
  {
    code: "C-565",
    name: "Buyer Representation Agreement — Exclusive",
    category: "Buyer",
    oref: true,
    description:
      "Establishes exclusive buyer representation — mandatory for all Oregon buyers since HB 4058 (Jan 1, 2025).",
    replaces: "Verbal agreements + a 'who signed what' spreadsheet",
    aiAssist: "Generates the engagement from the lead record and explains compensation terms in plain English for the buyer.",
    esign: true,
    compliance: "Required by Oregon HB 4058 (effective 2025) · OREF C-565",
    popularity: 92,
    pillar: "Contract Systems",
    fields: [
      { name: "buyer", label: "Buyer name(s)", type: "text", autofill: true, required: true },
      { name: "broker", label: "Buyer's broker", type: "text", autofill: true },
      { name: "term", label: "Representation term", type: "text" },
      { name: "compensation", label: "Compensation", type: "text" },
      { name: "area", label: "Search area", type: "text", autofill: true },
      sig,
    ],
  },
  {
    code: "C-530",
    name: "Initial Agency Disclosure Pamphlet",
    category: "Agency & Disclosure",
    oref: true,
    description: "Mandatory first-contact agency relationships disclosure given to consumers.",
    replaces: "Printed pamphlets handed out by hand",
    aiAssist: "Auto-logs delivery + timestamp to the CRM for compliance audit; reminds the agent when it's overdue.",
    esign: true,
    compliance: "Required at first substantial contact · ORS 696.820",
    popularity: 90,
    pillar: "Structured Data",
    fields: [
      { name: "consumer", label: "Consumer name", type: "text", autofill: true },
      { name: "broker", label: "Broker", type: "text", autofill: true },
      { name: "deliveredOn", label: "Delivered on", type: "date" },
    ],
  },
  {
    code: "OREF-040",
    name: "Disclosed Limited Agency Agreement — Sellers",
    category: "Agency & Disclosure",
    oref: true,
    description: "Consent for disclosed limited (dual) agency on the seller side.",
    replaces: "Paper consent forms filed in a drawer",
    aiAssist: "Flags when a transaction triggers limited agency and pre-fills both parties.",
    esign: true,
    compliance: "ORS 696.815",
    popularity: 64,
    pillar: "Structured Data",
    fields: [
      { name: "seller", label: "Seller name(s)", type: "text", autofill: true },
      { name: "property", label: "Property", type: "text", autofill: true },
      sig,
    ],
  },
  {
    code: "SPDS",
    name: "Seller's Property Disclosure Statement",
    category: "Agency & Disclosure",
    oref: true,
    description: "Statutory seller disclosure of the property's known condition.",
    replaces: "A PDF emailed back and forth with no tracking",
    aiAssist: "Walks the seller through each section and summarizes flagged items for the buyer's broker.",
    esign: true,
    compliance: "ORS 105.464 — required for most residential sales",
    popularity: 88,
    pillar: "Structured Data",
    fields: [
      { name: "seller", label: "Seller", type: "text", autofill: true },
      { name: "property", label: "Property", type: "text", autofill: true },
      { name: "knownIssues", label: "Known issues", type: "textarea" },
      sig,
    ],
  },
  {
    code: "LBP",
    name: "Lead-Based Paint Disclosure",
    category: "Agency & Disclosure",
    oref: false,
    description: "Federal disclosure required for homes built before 1978.",
    replaces: "Easy-to-forget paper rider",
    aiAssist: "Auto-attaches whenever the listing's year-built is before 1978 — never missed again.",
    esign: true,
    compliance: "42 U.S.C. §4852d (federal) · pre-1978 homes",
    popularity: 41,
    pillar: "AI Integration",
    fields: [
      { name: "property", label: "Property", type: "text", autofill: true },
      { name: "yearBuilt", label: "Year built", type: "number", autofill: true },
      sig,
    ],
  },
  {
    code: "OREF-002",
    name: "Counter Offer",
    category: "Offer & Negotiation",
    oref: true,
    description: "Formal counter to an existing offer — price, terms, and deadlines.",
    replaces: "Back-and-forth emails with version confusion",
    aiAssist: "Drafts counter language from the negotiating position and models the net-proceeds delta for the seller.",
    esign: true,
    popularity: 73,
    pillar: "Contract Systems",
    fields: [
      { name: "original", label: "Responding to offer #", type: "text" },
      { name: "counterPrice", label: "Counter price", type: "currency" },
      { name: "changes", label: "Changed terms", type: "textarea" },
      sig,
    ],
  },
  {
    code: "OREF-026",
    name: "Repair / Inspection Addendum",
    category: "Addenda",
    oref: true,
    description: "Buyer's requested repairs following the inspection period.",
    replaces: "A repair-request spreadsheet emailed around",
    aiAssist: "Turns an inspection summary into itemized, professionally-worded repair requests.",
    esign: true,
    popularity: 70,
    pillar: "AI Integration",
    fields: [
      { name: "property", label: "Property", type: "text", autofill: true },
      { name: "items", label: "Requested repairs", type: "textarea" },
      sig,
    ],
  },
  {
    code: "OREF-005",
    name: "Addendum / Amendment",
    category: "Addenda",
    oref: true,
    description: "General-purpose addendum to amend an existing agreement.",
    replaces: "Re-typing the whole contract to change one term",
    aiAssist: "Drafts precise amendment language referencing the right clause of the base agreement.",
    esign: true,
    popularity: 62,
    pillar: "Contract Systems",
    fields: [
      { name: "baseDoc", label: "Amends document", type: "text" },
      { name: "change", label: "Amendment", type: "textarea" },
      sig,
    ],
  },
  {
    code: "EMR",
    name: "Earnest Money Receipt",
    category: "Transaction & Compliance",
    oref: false,
    description: "Records receipt of buyer earnest money into escrow/trust.",
    replaces: "A trust-accounting spreadsheet line",
    aiAssist: "Auto-creates from the accepted sale agreement and posts to the transaction ledger.",
    esign: false,
    compliance: "Trust-account handling · ORS 696.241",
    popularity: 58,
    pillar: "Structured Data",
    fields: [
      { name: "amount", label: "Amount", type: "currency", autofill: true },
      { name: "escrow", label: "Escrow/title company", type: "text" },
      { name: "receivedOn", label: "Received on", type: "date" },
    ],
  },
  {
    code: "CDA",
    name: "Commission Disbursement Authorization",
    category: "Transaction & Compliance",
    oref: false,
    description: "Instructs escrow how to split and disburse commission at closing.",
    replaces: "A commission-split Excel workbook",
    aiAssist: "Computes splits from the agent's tier and the brokerage policy, then generates the CDA.",
    esign: true,
    popularity: 55,
    pillar: "Structured Data",
    fields: [
      { name: "deal", label: "Transaction", type: "text", autofill: true },
      { name: "gci", label: "Gross commission", type: "currency", autofill: true },
      { name: "split", label: "Agent split", type: "text" },
      sig,
    ],
  },
];

/* ── Intake flows — the structured data flows that replace Google Forms ── */
export interface IntakeFlow {
  code: string;
  name: string;
  description: string;
  replaces: string;
  fieldsCount: number;
  routesTo: string;
  aiStep: string;
  submissionsThisMonth: number;
  fields: ReFormField[];
}

export const intakeFlows: IntakeFlow[] = [
  {
    code: "MRE-INTAKE",
    name: "New Client Intake",
    description: "First-touch capture for any new buyer or seller lead.",
    replaces: "A Google Form dumping to a spreadsheet",
    fieldsCount: 9,
    routesTo: "CRM → auto-assign to best-fit broker",
    aiStep: "Claude scores the lead, summarizes intent, and drafts the first reply.",
    submissionsThisMonth: 412,
    fields: [
      { name: "name", label: "Full name", type: "text", required: true },
      { name: "email", label: "Email", type: "text", required: true },
      { name: "phone", label: "Phone", type: "text" },
      { name: "intent", label: "Looking to", type: "select", options: ["Buy", "Sell", "Both", "Invest"] },
      { name: "area", label: "Area of interest", type: "text" },
      { name: "budget", label: "Budget", type: "currency" },
      { name: "timeline", label: "Timeline", type: "select", options: ["ASAP", "1–3 months", "3–6 months", "Just browsing"] },
      { name: "notes", label: "Anything else?", type: "textarea" },
    ],
  },
  {
    code: "MRE-LISTING-INTAKE",
    name: "Pre-Listing Questionnaire",
    description: "Everything needed to launch a listing — collected once.",
    replaces: "An email thread + a property-details spreadsheet",
    fieldsCount: 14,
    routesTo: "Listing record → photographer + MLS draft",
    aiStep: "Claude drafts the MLS description and a launch marketing plan from the answers.",
    submissionsThisMonth: 38,
    fields: [
      { name: "address", label: "Property address", type: "text", required: true },
      { name: "beds", label: "Bedrooms", type: "number" },
      { name: "baths", label: "Bathrooms", type: "number" },
      { name: "sqft", label: "Square feet", type: "number" },
      { name: "upgrades", label: "Recent upgrades", type: "textarea" },
      { name: "targetPrice", label: "Hoped-for price", type: "currency" },
      { name: "timeline", label: "Move timeline", type: "text" },
    ],
  },
  {
    code: "MRE-SHOWING",
    name: "Showing Feedback",
    description: "Capture buyer-agent feedback after every showing.",
    replaces: "Texts the listing agent has to chase down",
    fieldsCount: 6,
    routesTo: "Listing → seller feedback report",
    aiStep: "Claude rolls up sentiment across showings into a weekly seller report.",
    submissionsThisMonth: 184,
    fields: [
      { name: "listing", label: "Listing", type: "text", autofill: true },
      { name: "rating", label: "Buyer interest", type: "select", options: ["High", "Medium", "Low"] },
      { name: "priceFeedback", label: "On price", type: "select", options: ["Priced right", "A little high", "Too high"] },
      { name: "comments", label: "Comments", type: "textarea" },
    ],
  },
  {
    code: "MRE-VENDOR",
    name: "Vendor / Referral Onboarding",
    description: "Onboard lenders, inspectors, contractors & referral partners.",
    replaces: "A W-9 PDF + a vendor contacts spreadsheet",
    fieldsCount: 8,
    routesTo: "Vendor directory + accounting",
    aiStep: "Claude validates the W-9 fields and de-dupes against existing vendors.",
    submissionsThisMonth: 11,
    fields: [
      { name: "company", label: "Company", type: "text", required: true },
      { name: "type", label: "Vendor type", type: "select", options: ["Lender", "Inspector", "Contractor", "Title/Escrow", "Stager", "Referral partner"] },
      { name: "contact", label: "Contact name", type: "text" },
      { name: "email", label: "Email", type: "text" },
      { name: "ein", label: "EIN / SSN (W-9)", type: "text" },
    ],
  },
  {
    code: "MRE-OPENHOUSE",
    name: "Open House Sign-In",
    description: "Digital sign-in that captures and nurtures every visitor.",
    replaces: "A paper clipboard with illegible handwriting",
    fieldsCount: 5,
    routesTo: "CRM → instant text follow-up",
    aiStep: "Claude sends each visitor a personalized follow-up within 60 seconds.",
    submissionsThisMonth: 96,
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "email", label: "Email", type: "text" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "working", label: "Working with an agent?", type: "select", options: ["No", "Yes"] },
      { name: "interested", label: "Interested in this home?", type: "select", options: ["Yes", "Maybe", "Just looking"] },
    ],
  },
];

export const getForm = (code: string) => reForms.find((f) => f.code === code);
export const formsByCategory = (cat: FormCategory) => reForms.filter((f) => f.category === cat);
export const mostUsedForms = [...reForms].sort((a, b) => b.popularity - a.popularity);
