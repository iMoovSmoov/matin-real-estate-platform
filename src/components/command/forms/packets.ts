/* ──────────────────────────────────────────────────────────────────────────
   Forms & Docs — canonical packet data (section-local; not in src/lib)

   Reusable document PACKETS (templates) and the DOCUMENTS inside each, modeled
   on SkySlope/Dotloop loops. Grounded in the real OREF form library (codes from
   src/lib/forms.ts), REAL Matin records (real listings/leads/seller-leads/
   transactions), and REAL coordinators from roles.ts:
     - Listing / Seller-disclosure packets → real Listing Coordinator
       (sierra-palmeri / Sierra Seggerman)
     - Offer / Closing / Lead-intake packets → real Transaction Coordinator
       (paris-vollstedt / Paris Vollstedt)
     - Broker-review only → principal broker (jordan-matin)
   Each packet binds to a real `listingId` so its hero photo resolves via the
   shared deterministic `listingPhoto` resolver (real photos[0] when present).

   Status taxonomy (carried by chip color per build-reference §1.10):
     complete       → success (green)  "Complete"
     sent           → success (green)  "Out for signature"  (runtime; after Send)
     needs-initials → warn    (amber)  "Needs initials"
     required       → warn    (amber)  "Required"
     correction     → danger  (red)    "Correction requested" (runtime)
     draft          → info    (gray)   "Draft"
   ────────────────────────────────────────────────────────────────────────── */

import type { ChipTone } from "@/components/os";
import type { BrandedDocumentField } from "@/components/os/BrandedDocument";
import { listingPhoto } from "@/lib/data/listing-photo";
import { rosterOption } from "@/lib/data/agreement-roster";
import { roles } from "@/lib/data/roles";
import { reForms } from "@/lib/forms";

/** Resolve a real agent's name from a slug (fallback to the slug if unknown). */
function ownerName(slug: string): string {
  return rosterOption(slug)?.name ?? slug;
}

export type DocStatus =
  | "complete"
  | "sent"
  | "needs-initials"
  | "required"
  | "correction"
  | "draft";

export type PacketDoc = {
  id: string;
  /** OREF / federal / internal form code (from src/lib/forms.ts where applicable). */
  code: string;
  title: string;
  status: DocStatus;
  page: number;
  pages: number;
  signatureField: boolean;
  /** Ruled-line count for the preview body (varies the cards). */
  lines: number;
  /** Exactly what's incomplete and where — surfaced on the card + by AI. */
  missing?: string[];
};

export type Packet = {
  id: string;
  name: string;
  /** What this packet binds to in the storyline. */
  subject: string;
  /** Owner initials token (coordinator/agent). */
  owner: string;
  /** Real coordinator/agent identity for the Avatar (slug → headshot). */
  ownerName: string;
  ownerSlug: string;
  /** Real listing id this packet binds to → resolves the real hero photo. */
  listingId: string;
  /** Plain-English summary of what the packet pulls in (shown in the New packet drawer). */
  source: string;
  lastUpdated: string;
  /** Relative-time label for the packet row (densification). */
  updatedAgo: string;
  docs: PacketDoc[];
};

/** The real hero photo for a packet (real listings[].photos[0] else exterior). */
export function packetHero(p: Packet): string {
  return listingPhoto(p.listingId);
}

/** Done/total document progress for a packet (densification). */
export function packetProgress(p: Packet): { done: number; total: number } {
  const total = p.docs.length;
  const done = p.docs.filter((d) => d.status === "complete" || d.status === "sent").length;
  return { done, total };
}

/** Chip tone + label for a document status (single source of truth). */
export const STATUS_META: Record<DocStatus, { tone: ChipTone; label: string }> = {
  complete: { tone: "success", label: "Complete" },
  sent: { tone: "success", label: "Out for signature" },
  "needs-initials": { tone: "warn", label: "Needs initials" },
  required: { tone: "warn", label: "Required" },
  correction: { tone: "danger", label: "Correction requested" },
  draft: { tone: "info", label: "Draft" },
};

/** A doc is blocked from sending while required fields/initials are missing. */
export function isSendBlocked(status: DocStatus): boolean {
  return status === "required" || status === "needs-initials";
}

/** Docs that count as "open" (not terminal) for the packet open-count badge. */
export function isOpenDoc(status: DocStatus): boolean {
  return status !== "complete" && status !== "sent";
}

/** Real coordinator slugs (from roles.ts) used as packet owners. */
const LC = roles.listingCoordinators[0]; // sierra-palmeri (Listing Coordinator)
const TC = roles.transactionCoordinators[0]; // paris-vollstedt (Transaction Coordinator)
const BROKER = roles.principalBroker; // jordan-matin

export const PACKETS: Packet[] = [
  {
    id: "PKT-LIST-001",
    name: "Listing packet",
    subject: "7750 Iron Mountain Blvd · Lake Oswego",
    owner: "SS",
    ownerName: ownerName(LC),
    ownerSlug: LC,
    listingId: "MRE-1016",
    source: "Pulls in the property listing, its required disclosures, and who needs to sign.",
    lastUpdated: `Updated 2h ago by ${ownerName(LC)}`,
    updatedAgo: "2h ago",
    docs: [
      {
        id: "DOC-1001",
        code: "OREF-015",
        title: "Residential Listing Agreement — Exclusive",
        status: "complete",
        page: 6,
        pages: 6,
        signatureField: true,
        lines: 7,
      },
      {
        id: "DOC-1002",
        code: "C-530",
        title: "Initial Agency Disclosure Pamphlet",
        status: "complete",
        page: 2,
        pages: 2,
        signatureField: false,
        lines: 6,
      },
      {
        id: "DOC-1003",
        code: "SPDS",
        title: "Seller's Property Disclosure Statement",
        status: "needs-initials",
        page: 4,
        pages: 5,
        signatureField: true,
        lines: 8,
        missing: ["Needs seller initials · page 4", "Section 6 (systems) left blank"],
      },
      {
        id: "DOC-1004",
        code: "LBP",
        title: "Lead-Based Paint Disclosure",
        status: "draft",
        page: 1,
        pages: 2,
        signatureField: true,
        lines: 5,
      },
      {
        id: "DOC-1005",
        code: "OREF-040",
        title: "Disclosed Limited Agency — Sellers",
        status: "required",
        page: 1,
        pages: 1,
        signatureField: true,
        lines: 6,
        missing: ["Required before MLS publish", "Seller signature not started"],
      },
    ],
  },
  {
    id: "PKT-BUYER-001",
    name: "Buyer agreement",
    subject: "Daniel Cho · Beaverton search",
    owner: "PV",
    ownerName: ownerName(TC),
    ownerSlug: TC,
    listingId: "MRE-1006",
    source: "Pulls in the buyer's contact details, their saved searches, and any agreements on file.",
    lastUpdated: `Updated 38m ago by ${ownerName(TC)}`,
    updatedAgo: "38m ago",
    docs: [
      {
        id: "DOC-2001",
        code: "C-565",
        title: "Buyer Representation Agreement — Exclusive",
        status: "needs-initials",
        page: 4,
        pages: 5,
        signatureField: true,
        lines: 7,
        missing: ["Needs buyer initials · page 4", "Compensation clause blank"],
      },
      {
        id: "DOC-2002",
        code: "C-530",
        title: "Initial Agency Disclosure Pamphlet",
        status: "complete",
        page: 2,
        pages: 2,
        signatureField: false,
        lines: 6,
      },
      {
        id: "DOC-2003",
        code: "OREF-040",
        title: "Disclosed Limited Agency — Buyers",
        status: "draft",
        page: 1,
        pages: 1,
        signatureField: true,
        lines: 5,
      },
    ],
  },
  {
    id: "PKT-OFFER-001",
    name: "Offer packet",
    subject: "Daniel Cho → 8912 SE Hawthorne Blvd",
    owner: "PV",
    ownerName: ownerName(TC),
    ownerSlug: TC,
    listingId: "MRE-R02",
    source: "Pulls in the deal, the property listing, and any cash-offer requests.",
    lastUpdated: `Updated 1h ago by ${ownerName(TC)}`,
    updatedAgo: "1h ago",
    docs: [
      {
        id: "DOC-3001",
        code: "OREF-001",
        title: "Residential Real Estate Sale Agreement",
        status: "needs-initials",
        page: 9,
        pages: 12,
        signatureField: true,
        lines: 9,
        missing: ["Needs buyer initials · pages 3, 9", "Earnest money amount blank"],
      },
      {
        id: "DOC-3002",
        code: "EMR",
        title: "Earnest Money Receipt",
        status: "required",
        page: 1,
        pages: 1,
        signatureField: false,
        lines: 4,
        missing: ["Required to bind offer", "Escrow / title company not set"],
      },
      {
        id: "DOC-3003",
        code: "LBP",
        title: "Lead-Based Paint Disclosure",
        status: "complete",
        page: 2,
        pages: 2,
        signatureField: true,
        lines: 5,
      },
      {
        id: "DOC-3004",
        code: "OREF-005",
        title: "Addendum / Amendment — Closing date",
        status: "draft",
        page: 1,
        pages: 1,
        signatureField: true,
        lines: 5,
      },
    ],
  },
  {
    id: "PKT-DISC-001",
    name: "Seller disclosure",
    subject: "Sarah Mitchell · 5127 SW Cedar Hills Blvd",
    owner: "SS",
    ownerName: ownerName(LC),
    ownerSlug: LC,
    listingId: "MRE-R05",
    source: "Pulls in the seller's details, the property record, and recent value estimates.",
    lastUpdated: `Updated 4h ago by ${ownerName(LC)}`,
    updatedAgo: "4h ago",
    docs: [
      {
        id: "DOC-4001",
        code: "SPDS",
        title: "Seller's Property Disclosure Statement",
        status: "needs-initials",
        page: 3,
        pages: 5,
        signatureField: true,
        lines: 8,
        missing: ["Needs seller initials · page 3", "Roof age field empty"],
      },
      {
        id: "DOC-4002",
        code: "LBP",
        title: "Lead-Based Paint Disclosure",
        status: "required",
        page: 1,
        pages: 2,
        signatureField: true,
        lines: 5,
        missing: ["Required — home built 1971 (pre-1978)"],
      },
      {
        id: "DOC-4003",
        code: "C-530",
        title: "Initial Agency Disclosure Pamphlet",
        status: "complete",
        page: 2,
        pages: 2,
        signatureField: false,
        lines: 6,
      },
    ],
  },
  {
    id: "PKT-CLOSE-001",
    name: "Closing packet",
    subject: "1274 NW Everett St · Close Jul 22",
    owner: "PV",
    ownerName: ownerName(TC),
    ownerSlug: TC,
    listingId: "MRE-R02",
    source: "Pulls in the deal, broker review notes, and the documents out for signature.",
    lastUpdated: `Updated 25m ago by ${ownerName(TC)}`,
    updatedAgo: "25m ago",
    docs: [
      {
        id: "DOC-5001",
        code: "OREF-026",
        title: "Repair / Inspection Addendum",
        status: "required",
        page: 1,
        pages: 2,
        signatureField: true,
        lines: 6,
        missing: ["Required — email thread cites roof concern", "No repair items entered yet"],
      },
      {
        id: "DOC-5002",
        code: "OREF-002",
        title: "Counter Offer — Inspection response",
        status: "draft",
        page: 1,
        pages: 1,
        signatureField: true,
        lines: 5,
      },
      {
        id: "DOC-5003",
        code: "CDA",
        title: "Commission Disbursement Authorization",
        status: "needs-initials",
        page: 1,
        pages: 1,
        signatureField: true,
        lines: 5,
        missing: ["Needs broker signature · page 1", "Agent split % not confirmed"],
      },
      {
        id: "DOC-5004",
        code: "OREF-001",
        title: "Residential Real Estate Sale Agreement",
        status: "complete",
        page: 12,
        pages: 12,
        signatureField: true,
        lines: 9,
      },
    ],
  },
  {
    id: "PKT-INTAKE-001",
    name: "Lead intake",
    subject: "Melissa Grant · re-activated client",
    owner: "PV",
    ownerName: ownerName(TC),
    ownerSlug: TC,
    listingId: "MRE-1001",
    source: "Pulls in the contact's details and their recent activity.",
    lastUpdated: `Updated 6h ago by ${ownerName(TC)}`,
    updatedAgo: "6h ago",
    docs: [
      {
        id: "DOC-6001",
        code: "C-530",
        title: "Initial Agency Disclosure Pamphlet",
        status: "complete",
        page: 2,
        pages: 2,
        signatureField: false,
        lines: 6,
      },
      {
        id: "DOC-6002",
        code: "C-565",
        title: "Buyer Representation Agreement — Exclusive",
        status: "draft",
        page: 1,
        pages: 5,
        signatureField: true,
        lines: 7,
      },
    ],
  },
];

/* ── Branded-document field grids (real values bound per document) ─────────── */

/**
 * The structured field grid for a document, bound to the packet subject + the
 * doc's own status. Filled fields show green ✓, missing show red-outline — and
 * the `missing[]` on the doc maps to red fields so the branded preview matches
 * the field-check exactly. Used by the doc-card preview and the drawer center.
 */
export function docFields(packet: Packet, doc: PacketDoc): BrandedDocumentField[] {
  const subject = packet.subject;
  const party = subject.split("·")[0].trim();
  const blocked = isSendBlocked(doc.status);
  const missing = doc.missing ?? [];
  const hasInitialsGap = missing.some((m) => /initial/i.test(m));
  const hasSigGap = missing.some((m) => /signature|sign/i.test(m));

  const base: BrandedDocumentField[] = [
    { label: "Form", value: `${doc.code} · ${doc.title}`, filled: true },
    { label: "Subject / property", value: subject, filled: true },
    { label: "Prepared by", value: packet.ownerName, filled: true },
    { label: "Party", value: party, filled: party.length > 1 },
    {
      label: "Initials",
      value: hasInitialsGap ? undefined : "All pages",
      filled: !hasInitialsGap,
    },
    {
      label: "Signature",
      value: doc.signatureField ? (hasSigGap || blocked ? undefined : "Executed") : "Not required",
      filled: doc.signatureField ? !(hasSigGap || blocked) : true,
    },
    {
      label: "Broker review",
      value: doc.status === "complete" || doc.status === "sent" ? "Cleared" : undefined,
      filled: doc.status === "complete" || doc.status === "sent",
    },
  ];
  return base;
}

/** Completion percent for a single document, reconciled to its field grid. */
export function docCompletion(packet: Packet, doc: PacketDoc): number {
  const fields = docFields(packet, doc);
  const done = fields.filter((f) => f.filled).length;
  return Math.round((done / fields.length) * 100);
}

/** A filesystem-safe slug for a document download filename. */
export function docSlug(doc: PacketDoc): string {
  const base = `${doc.code}-${doc.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "document";
}

/**
 * Assemble a real, serializable plain-text version of a packet document — the
 * branded letterhead, the live field grid (filled vs missing), and any
 * outstanding items — so "Download" / "Copy" produce a tangible artifact the
 * demo viewer can keep, not a dead-end preview.
 */
export function documentText(packet: Packet, doc: PacketDoc): string {
  const fields = docFields(packet, doc);
  const rule = "────────────────────────────────────";
  const out: string[] = [];
  out.push("MATIN REAL ESTATE");
  out.push("18825 Willamette Dr, West Linn OR 97068 · (503) 622-9624");
  out.push(`Form: ${doc.code}`);
  out.push("");
  out.push(doc.title);
  out.push(`Packet: ${packet.name} — ${packet.subject}`);
  out.push(`Prepared by: ${packet.ownerName}`);
  out.push(`Status: ${STATUS_META[doc.status].label} · Page ${doc.page} of ${doc.pages}`);
  out.push("");
  out.push("DETAILS");
  out.push(rule);
  for (const f of fields) {
    const v = f.filled
      ? typeof f.value === "string" || typeof f.value === "number"
        ? String(f.value)
        : "Complete"
      : "Missing";
    out.push(`${f.label}: ${v}`);
  }
  const missing = doc.missing ?? [];
  if (missing.length > 0) {
    out.push("");
    out.push("OUTSTANDING — RESOLVE BEFORE SENDING");
    out.push(rule);
    for (const mi of missing) out.push(`• ${mi}`);
  }
  out.push("");
  out.push("Matin Real Estate · West Linn, OR · Equal Housing Opportunity");
  return out.join("\n");
}

/**
 * Aggregate counters reconciled from the packet/doc records (KPI strip).
 * Accepts the LIVE packet array so the numbers re-derive after a Send / fix —
 * KPIs always equal the rows they summarize (build-reference §1.4 / §3).
 */
export function packetMetrics(packets: Packet[] = PACKETS) {
  const allDocs = packets.flatMap((p) => p.docs);
  const inProgress = packets.filter((p) =>
    p.docs.some((d) => isOpenDoc(d.status)),
  ).length;
  // "Awaiting signature" = out for e-sign OR still needing initials before send.
  const awaitingSignature = allDocs.filter(
    (d) => d.status === "needs-initials" || d.status === "sent",
  ).length;
  const missingFields = allDocs.reduce(
    (n, d) => n + (d.missing?.length ?? 0),
    0,
  );
  const completedThisWeek = allDocs.filter((d) => d.status === "complete").length;
  return {
    inProgress,
    awaitingSignature,
    missingFields,
    completedThisWeek,
    // The Templates tab renders the full OREF + Matin form library (reForms) —
    // count that, so the KPI tile + tab badge match what the tab actually shows.
    templates: reForms.length,
  };
}
