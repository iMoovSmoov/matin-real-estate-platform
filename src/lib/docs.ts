// ─── Matin Real Estate Document Template Engine ───────────────────────────────

export const MATIN_BROKERAGE = {
  name: "Matin Real Estate",
  address: "4 Centerpointe Dr, Lake Oswego, OR 97035",
  phone: "(503) 622-9624",
  website: "matinrealestate.com",
  license: "Real Estate License #200009148",
  principal: "Jordan Matin, Principal Broker",
}

export const SYSTEM_AGENTS = [
  { id: "jordan-matin", name: "Jordan Matin", title: "Principal Broker", phone: "(503) 622-9624", license: "200009148", email: "jordan@matinrealestate.com" },
  { id: "lisa-chen", name: "Lisa Chen", title: "Buyer's Agent", phone: "(503) 555-0102", license: "201234567", email: "lisa@matinrealestate.com" },
  { id: "marcus-reid", name: "Marcus Reid", title: "Listing Specialist", phone: "(503) 555-0103", license: "201234568", email: "marcus@matinrealestate.com" },
  { id: "sarah-kwon", name: "Sarah Kwon", title: "Buyer's Agent", phone: "(503) 555-0104", license: "201234569", email: "sarah@matinrealestate.com" },
]

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocField = {
  key: string
  label: string
  type: "text" | "date" | "number" | "textarea" | "select"
  autoFill?: string // dot-path into the auto-fill source (e.g. "lead.name", "transaction.property", "agent.name")
  placeholder?: string
  required?: boolean
}

export type DocTemplate = {
  id: string
  name: string
  category: "buyer" | "seller" | "listing" | "offer" | "transaction" | "cash-offer"
  description: string
  fields: DocField[]
  aiPrompt?: string // if set, AI fills the body using this prompt + the field values
}

// ─── Document Templates ───────────────────────────────────────────────────────

export const DOCUMENT_TEMPLATES: DocTemplate[] = [
  {
    id: "buyer-rep-agreement",
    name: "Buyer Representation Agreement",
    category: "buyer",
    description: "Exclusive buyer rep agreement between client and agent",
    fields: [
      { key: "buyerName", label: "Buyer Name(s)", type: "text", autoFill: "lead.name", required: true },
      { key: "buyerAddress", label: "Buyer Address", type: "text", autoFill: "lead.address" },
      { key: "buyerPhone", label: "Buyer Phone", type: "text", autoFill: "lead.phone" },
      { key: "buyerEmail", label: "Buyer Email", type: "text", autoFill: "lead.email" },
      { key: "searchAreas", label: "Search Areas", type: "text", autoFill: "lead.areas" },
      { key: "priceMin", label: "Min Price", type: "number", autoFill: "lead.budgetMin" },
      { key: "priceMax", label: "Max Price", type: "number", autoFill: "lead.budgetMax" },
      { key: "startDate", label: "Agreement Start", type: "date" },
      { key: "endDate", label: "Agreement End", type: "date" },
      { key: "agentId", label: "Representing Agent", type: "select", autoFill: "agent.id" },
      { key: "commission", label: "Commission (%)", type: "number", placeholder: "3" },
    ],
    aiPrompt: "Generate professional buyer representation agreement body text for Oregon real estate",
  },
  {
    id: "listing-agreement",
    name: "Listing Agreement",
    category: "listing",
    description: "Exclusive right to sell listing agreement",
    fields: [
      { key: "sellerName", label: "Seller Name(s)", type: "text", autoFill: "lead.name", required: true },
      { key: "propertyAddress", label: "Property Address", type: "text", autoFill: "listing.address", required: true },
      { key: "listPrice", label: "List Price", type: "number", autoFill: "listing.price", required: true },
      { key: "listingStart", label: "Listing Start Date", type: "date" },
      { key: "listingExpiry", label: "Listing Expiry Date", type: "date" },
      { key: "commission", label: "Commission (%)", type: "number", placeholder: "6" },
      { key: "agentId", label: "Listing Agent", type: "select", autoFill: "agent.id" },
      { key: "specialTerms", label: "Special Terms", type: "textarea" },
    ],
  },
  {
    id: "purchase-offer",
    name: "Purchase Offer",
    category: "offer",
    description: "Residential purchase and sale agreement",
    fields: [
      { key: "buyerName", label: "Buyer Name(s)", type: "text", autoFill: "lead.name", required: true },
      { key: "propertyAddress", label: "Property Address", type: "text", autoFill: "transaction.property", required: true },
      { key: "offerPrice", label: "Offer Price", type: "number", required: true },
      { key: "earnestMoney", label: "Earnest Money ($)", type: "number" },
      { key: "financeType", label: "Financing", type: "select", placeholder: "Conventional" },
      { key: "closingDate", label: "Target Closing Date", type: "date" },
      { key: "inspectionDays", label: "Inspection Period (days)", type: "number", placeholder: "10" },
      { key: "agentId", label: "Buyer's Agent", type: "select", autoFill: "agent.id" },
      { key: "contingencies", label: "Contingencies / Notes", type: "textarea" },
    ],
  },
  {
    id: "cash-offer-letter",
    name: "Cash Offer Letter",
    category: "cash-offer",
    description: "Cash purchase offer with no financing contingency",
    fields: [
      { key: "sellerName", label: "Seller Name(s)", type: "text", autoFill: "lead.name", required: true },
      { key: "propertyAddress", label: "Property Address", type: "text", autoFill: "lead.address", required: true },
      { key: "offerAmount", label: "Offer Amount ($)", type: "number", required: true },
      { key: "closingDays", label: "Close in (days)", type: "number", placeholder: "14" },
      { key: "asIs", label: "As-Is Purchase?", type: "select" },
      { key: "pocName", label: "Point of Contact", type: "text", autoFill: "agent.name" },
      { key: "pocPhone", label: "Contact Phone", type: "text", autoFill: "agent.phone" },
      { key: "notes", label: "Additional Terms", type: "textarea" },
    ],
    aiPrompt: "Write a professional, motivating cash offer letter for a seller in Oregon",
  },
  {
    id: "inspection-notice",
    name: "Inspection Repair Notice",
    category: "transaction",
    description: "Notice to seller of requested inspection repairs",
    fields: [
      { key: "buyerName", label: "Buyer Name(s)", type: "text", autoFill: "transaction.buyerName", required: true },
      { key: "sellerName", label: "Seller Name(s)", type: "text", autoFill: "transaction.sellerName", required: true },
      { key: "propertyAddress", label: "Property Address", type: "text", autoFill: "transaction.property", required: true },
      { key: "responseDeadline", label: "Seller Response Deadline", type: "date" },
      { key: "repairItems", label: "Requested Repairs", type: "textarea", required: true, placeholder: "List each repair item..." },
      { key: "agentId", label: "Buyer's Agent", type: "select", autoFill: "agent.id" },
    ],
  },
  {
    id: "termination",
    name: "Termination of Purchase Agreement",
    category: "transaction",
    description: "Mutual release and termination of purchase agreement",
    fields: [
      { key: "buyerName", label: "Buyer Name(s)", type: "text", autoFill: "transaction.buyerName", required: true },
      { key: "sellerName", label: "Seller Name(s)", type: "text", autoFill: "transaction.sellerName", required: true },
      { key: "propertyAddress", label: "Property Address", type: "text", autoFill: "transaction.property", required: true },
      { key: "terminationDate", label: "Termination Date", type: "date" },
      { key: "terminationReason", label: "Reason for Termination", type: "select" },
      { key: "earnestDisposition", label: "Earnest Money Return To", type: "select" },
      { key: "agentId", label: "Agent", type: "select", autoFill: "agent.id" },
    ],
  },
  {
    id: "open-house-signin",
    name: "Open House Sign-In Sheet",
    category: "listing",
    description: "Branded sign-in sheet for open houses",
    fields: [
      { key: "propertyAddress", label: "Property Address", type: "text", autoFill: "listing.address", required: true },
      { key: "listPrice", label: "List Price", type: "number", autoFill: "listing.price" },
      { key: "openHouseDate", label: "Open House Date", type: "date" },
      { key: "openHouseTime", label: "Time", type: "text", placeholder: "1:00 PM – 4:00 PM" },
      { key: "agentId", label: "Hosting Agent", type: "select", autoFill: "agent.id" },
    ],
  },
  {
    id: "counteroffer",
    name: "Counteroffer",
    category: "offer",
    description: "Counteroffer to purchase agreement",
    fields: [
      { key: "buyerName", label: "Buyer Name(s)", type: "text", autoFill: "transaction.buyerName", required: true },
      { key: "sellerName", label: "Seller Name(s)", type: "text", autoFill: "transaction.sellerName", required: true },
      { key: "propertyAddress", label: "Property Address", type: "text", autoFill: "transaction.property", required: true },
      { key: "counterPrice", label: "Counter Price ($)", type: "number", required: true },
      { key: "counterTerms", label: "Modified Terms", type: "textarea" },
      { key: "expiryDate", label: "Counter Expires", type: "date" },
      { key: "agentId", label: "Listing Agent", type: "select", autoFill: "agent.id" },
    ],
  },
]

// ─── Auto-Fill ────────────────────────────────────────────────────────────────

export type DocValues = Record<string, string>

/**
 * Given a template and available record data, auto-fill all fields that have
 * autoFill paths by resolving "source.key" dot-paths into the supplied data.
 */
export function fillFromRecord(
  template: DocTemplate,
  data: {
    lead?: {
      name?: string
      address?: string
      phone?: string
      email?: string
      areas?: string
      budgetMin?: number
      budgetMax?: number
    }
    transaction?: {
      buyerName?: string
      sellerName?: string
      property?: string
    }
    listing?: {
      address?: string
      price?: number
    }
    agent?: {
      id?: string
      name?: string
      phone?: string
    }
  },
): DocValues {
  const values: DocValues = {}
  for (const field of template.fields) {
    if (!field.autoFill) continue
    const dotIdx = field.autoFill.indexOf(".")
    if (dotIdx === -1) continue
    const source = field.autoFill.slice(0, dotIdx)
    const key = field.autoFill.slice(dotIdx + 1)
    const record = (data as Record<string, Record<string, unknown>>)[source]
    if (record && record[key] != null) {
      values[field.key] = String(record[key])
    }
  }
  return values
}

// ─── HTML Renderer ────────────────────────────────────────────────────────────

/**
 * Generates a clean, Matin-branded HTML document ready for print/PDF.
 * Uses string concatenation for inner field loops to avoid nested template
 * literal escaping issues.
 */
export function renderDocHtml(template: DocTemplate, values: DocValues): string {
  const agent = SYSTEM_AGENTS.find((a) => a.id === values.agentId) ?? SYSTEM_AGENTS[0]
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const nonTextareaFields = template.fields.filter((f) => f.type !== "textarea")
  const textareaFields = template.fields.filter((f) => f.type === "textarea")

  const nonTextareaHtml = nonTextareaFields
    .map(
      (f) =>
        '<div class="field">' +
        '<div class="field-label">' + f.label + "</div>" +
        '<div class="field-value">' + (values[f.key] ?? "") + "</div>" +
        "</div>",
    )
    .join("\n")

  const textareaHtml = textareaFields
    .map(
      (f) =>
        '<div class="field textarea-field">' +
        '<div class="field-label">' + f.label + "</div>" +
        '<div class="field-value" style="min-height:60px; white-space:pre-wrap;">' +
        (values[f.key] ?? "") +
        "</div>" +
        "</div>",
    )
    .join("\n")

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Georgia, serif; font-size: 11pt; color: #111; max-width: 720px; margin: 40px auto; padding: 0 40px; }
  .header { border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
  .brand-name { font-size: 18pt; font-weight: bold; letter-spacing: -0.5px; }
  .brand-info { font-size: 9pt; color: #555; line-height: 1.6; text-align: right; }
  h1 { font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .doc-date { font-size: 9pt; color: #777; margin-bottom: 24px; }
  .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin-bottom: 24px; }
  .field { border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  .field-label { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.5px; color: #777; margin-bottom: 2px; }
  .field-value { font-size: 11pt; min-height: 18px; }
  .textarea-field { grid-column: 1 / -1; }
  .agent-block { margin-top: 32px; border-top: 1px solid #ddd; padding-top: 16px; }
  .sig-line { border-bottom: 1px solid #111; height: 32px; margin-bottom: 4px; margin-top: 20px; }
  .sig-label { font-size: 8.5pt; color: #555; }
  .footer { margin-top: 40px; font-size: 8pt; color: #999; border-top: 1px solid #eee; padding-top: 12px; text-align: center; }
</style>
</head>
<body>
<div class="header">
  <div class="brand-name">${MATIN_BROKERAGE.name}</div>
  <div class="brand-info">
    ${MATIN_BROKERAGE.address}<br>
    ${MATIN_BROKERAGE.phone} &middot; ${MATIN_BROKERAGE.website}<br>
    ${MATIN_BROKERAGE.license}
  </div>
</div>

<h1>${template.name}</h1>
<div class="doc-date">Date: ${today}</div>

<div class="field-grid">
${nonTextareaHtml}
${textareaHtml}
</div>

<div class="agent-block">
  <strong>Representing Agent:</strong><br>
  ${agent.name} &mdash; ${agent.title}<br>
  License: ${agent.license} &middot; ${agent.phone} &middot; ${agent.email}<br>
  ${MATIN_BROKERAGE.name}
</div>

<div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:32px;">
  <div>
    <div class="sig-line"></div>
    <div class="sig-label">Client Signature / Date</div>
  </div>
  <div>
    <div class="sig-line"></div>
    <div class="sig-label">Agent Signature / Date</div>
  </div>
</div>

<div class="footer">
  ${MATIN_BROKERAGE.name} &middot; ${MATIN_BROKERAGE.address} &middot; ${MATIN_BROKERAGE.phone}<br>
  This document is prepared by ${MATIN_BROKERAGE.name} for informational purposes. Consult a licensed attorney for legal advice.
</div>
</body>
</html>`.trim()
}
