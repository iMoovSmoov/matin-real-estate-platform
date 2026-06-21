/* ──────────────────────────────────────────────────────────────────────────
   Forms & Docs — canonical packet data (section-local; not in src/lib)

   Reusable document PACKETS (templates) and the DOCUMENTS inside each, modeled
   on SkySlope/Dotloop loops. Grounded in the real OREF form library (codes from
   src/lib/forms.ts) and the canonical MatinOS demo records so the storyline
   flows: listing 1248 NW Cedar Hills Dr / 7428 SW Maple Ave, transaction
   8912 SE Hawthorne Blvd / 1274 NW Everett St, seller Sarah Mitchell, lead
   Daniel Cho, broker Jordan Matin.

   Status taxonomy (carried by chip color per build-reference §1.10):
     complete       → success (green)  "Complete"
     needs-initials → warn    (amber)  "Needs initials"
     required       → warn    (amber)  "Required"
     draft          → info    (gray)   "Draft"
   ────────────────────────────────────────────────────────────────────────── */

import type { ChipTone } from "@/components/os";

export type DocStatus = "complete" | "needs-initials" | "required" | "draft";

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
  /** Source-record join, shown as a mono backend note. */
  source: string;
  lastUpdated: string;
  docs: PacketDoc[];
};

/** Chip tone + label for a document status (single source of truth). */
export const STATUS_META: Record<DocStatus, { tone: ChipTone; label: string }> = {
  complete: { tone: "success", label: "Complete" },
  "needs-initials": { tone: "warn", label: "Needs initials" },
  required: { tone: "warn", label: "Required" },
  draft: { tone: "info", label: "Draft" },
};

export const PACKETS: Packet[] = [
  {
    id: "PKT-LIST-001",
    name: "Listing packet",
    subject: "7428 SW Maple Ave · Lake Oswego",
    owner: "JM",
    source: "listings > document_packets > document_fields + document_signers",
    lastUpdated: "Updated 2h ago by Jordan Matin",
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
    owner: "AC",
    source: "contacts > document_packets > saved_searches + agreements",
    lastUpdated: "Updated 38m ago by Amanda Conlon",
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
    subject: "Daniel Cho → 1248 NW Cedar Hills Dr",
    owner: "AC",
    source: "transactions > document_packets > listings + cash_offer_requests",
    lastUpdated: "Updated 1h ago by Amanda Conlon",
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
    subject: "Sarah Mitchell · 14920 SW Greenway",
    owner: "JM",
    source: "seller_leads > document_packets > properties + valuations",
    lastUpdated: "Updated 4h ago by Jordan Matin",
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
    subject: "8912 SE Hawthorne Blvd · Close Jul 22",
    owner: "JM",
    source: "transactions > document_packets > broker_reviews + signature_envelopes",
    lastUpdated: "Updated 25m ago by Jordan Matin",
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
    owner: "AC",
    source: "contacts > document_packets > activity_events",
    lastUpdated: "Updated 6h ago by Amanda Conlon",
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

/** Aggregate counters reconciled from the packet/doc records (KPI strip). */
export function packetMetrics() {
  const allDocs = PACKETS.flatMap((p) => p.docs);
  const inProgress = PACKETS.filter((p) =>
    p.docs.some((d) => d.status !== "complete"),
  ).length;
  const awaitingSignature = allDocs.filter(
    (d) => d.status === "needs-initials",
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
    templates: PACKETS.length,
  };
}
