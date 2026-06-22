"use client";

import { useId, type ReactNode } from "react";
import { CheckCircle2, Printer, Download } from "lucide-react";
import { Logo, MatinMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { downloadTextFile } from "@/lib/download";
import company from "@/lib/data/company.json";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — BrandedDocument   (build-reference G-B / §1.10)

   A REAL Matin-branded, printable, downloadable letterhead document shell used
   for EVERY client-facing artifact: buyer agreements, OREF/Matin forms,
   transaction docs, listing-launch seller notes, marketing email/flyer, and
   cash-offer net sheets. Replaces gray-ruled `DocumentPreview` placeholders for
   client-facing types (DocumentPreview stays for internal checklist exports).

   The whole document is the print artifact: the "Print / Download" action calls
   window.print(); a scoped @media print stylesheet (rendered once per document)
   hides everything except `.matindoc-print` and strips app chrome.

   Six variants: letter · agreement · flyer · email · netsheet · report.
   All bind to live values — green ✓ for filled fields, red-outline for missing.
   Gold is rationed to AI/active states only; ink is the primary brand color;
   Fraunces (font-display) is used for titles only.
   ────────────────────────────────────────────────────────────────────────── */

/* ── Public types ──────────────────────────────────────────────────────────── */

export type BrandedDocumentVariant =
  | "letter"
  | "agreement"
  | "flyer"
  | "email"
  | "netsheet"
  | "report";

/** A single label:value row in the structured field grid. */
export type BrandedDocumentField = {
  label: string;
  value?: ReactNode;
  /** Force the filled/missing state; otherwise inferred from `value`. */
  filled?: boolean;
};

/** Real agent identity for the signature block + footer. */
export type BrandedDocumentAgent = {
  name: string;
  title?: string;
  license?: string;
  phone?: string;
  email?: string;
  slug?: string;
  photo?: string;
};

/** Listing/specs payload used by the flyer variant. */
export type BrandedDocumentListing = {
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  price?: string;
  beds?: number | string;
  baths?: number | string;
  sqft?: number | string;
  lot?: string;
  year?: number | string;
  heroPhoto?: string;
  headline?: string;
  blurb?: string;
};

/** One line item in the netsheet waterfall. */
export type NetSheetLine = {
  label: string;
  /** Signed dollar amount: positive = credit/gross, negative = cost/payoff. */
  amount: number;
  note?: string;
};

export type BrandedDocumentProps = {
  /** Form/template id shown on the letterhead, e.g. "OREF C-565". */
  formId?: string;
  title: string;
  recipient?: string;
  agent?: BrandedDocumentAgent;
  /** Structured label:value field grid bound to live values. */
  fields?: BrandedDocumentField[];
  /** Free-form body (overrides the variant default body when provided). */
  body?: ReactNode;
  /** Signature block override; otherwise derived from `agent`. */
  signatureBlock?: ReactNode;
  variant: BrandedDocumentVariant;
  /** 0–100 completion percent → progress meter in the header. */
  completion?: number;
  /** Pager — "Page {page} of {pages}". */
  page?: number;
  pages?: number;

  /* Variant-specific payloads */
  listing?: BrandedDocumentListing;
  /** Visible merge tokens for the email variant, e.g. ["{{first_name}}"]. */
  mergeTokens?: string[];
  /** Email subject + from-name overrides (email variant). */
  emailSubject?: string;
  fromName?: string;
  /** Net-sheet waterfall lines (netsheet variant). */
  netSheetLines?: NetSheetLine[];
  /** Net-sheet sale price header value (netsheet variant). */
  salePrice?: number;

  /** Hide the toolbar (e.g. when embedding a mini preview). */
  hideToolbar?: boolean;
  className?: string;
};

/* ── Office / brand constants (real, from company.json) ────────────────────── */

const OFFICE_LINE = `${company.name} · ${company.address.street}, ${company.address.city} ${company.address.state} ${company.address.zip} · ${company.phone}`;
const FOOTER_LINE = `${company.name} · ${company.address.city}, ${company.address.state} · Equal Housing Opportunity`;

const usd0 = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

function isFilled(f: BrandedDocumentField): boolean {
  if (typeof f.filled === "boolean") return f.filled;
  if (f.value == null) return false;
  if (typeof f.value === "string") return f.value.trim().length > 0;
  return true;
}

/* ── Plain-text assembly (for the "Save copy" .txt download) ─────────────────
   The branded artifact's primary download is the scoped Save-as-PDF print, but
   we ALSO assemble the document's serializable props (letterhead → title →
   field grid → variant payload → signature) into a real .txt so there is a
   tangible file even without printing. Free-form `body` ReactNode can't be
   reliably serialized, so the structured props carry the content. */

function fieldValueText(f: BrandedDocumentField): string {
  if (!isFilled(f)) return "Missing";
  const v = f.value;
  if (typeof v === "string" || typeof v === "number") return String(v);
  return "(see document)";
}

function slugifyTitle(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "document"
  );
}

function assembleDocumentText(props: BrandedDocumentProps): string {
  const {
    formId,
    title,
    recipient,
    agent,
    fields = [],
    variant,
    emailSubject,
    fromName,
    mergeTokens = [],
    netSheetLines = [],
    salePrice = 0,
    listing,
  } = props;

  const out: string[] = [];
  const rule = "─".repeat(48);
  const push = (s = "") => out.push(s);

  // Letterhead
  push(company.name.toUpperCase());
  push(OFFICE_LINE);
  if (formId) push(`Form: ${formId}`);
  push();

  // Title + recipient
  push(title);
  if (recipient) push(`Prepared for: ${recipient}`);
  push();

  // Structured field grid
  if (fields.length > 0) {
    push("DETAILS");
    push(rule);
    for (const f of fields) push(`${f.label}: ${fieldValueText(f)}`);
    push();
  }

  // Variant-specific structured payload
  if (variant === "email") {
    push("EMAIL");
    push(rule);
    if (emailSubject) push(`Subject: ${emailSubject}`);
    if (fromName) push(`From: ${fromName}`);
    push(`To: ${recipient ?? "{{recipient_email}}"}`);
    if (mergeTokens.length > 0) push(`Merge tokens: ${mergeTokens.join(", ")}`);
    push();
  } else if (variant === "netsheet") {
    const costs = netSheetLines.filter((l) => l.amount < 0);
    const totalCosts = costs.reduce((s, l) => s + Math.abs(l.amount), 0);
    push("ESTIMATED SELLER NET PROCEEDS");
    push(rule);
    push(`Gross sale price: ${usd0(salePrice)}`);
    for (const l of netSheetLines) {
      const amt = l.amount < 0 ? `(${usd0(Math.abs(l.amount))})` : usd0(l.amount);
      push(`${l.label}: ${amt}${l.note ? ` — ${l.note}` : ""}`);
    }
    push(`Estimated net to seller: ${usd0(salePrice - totalCosts)}`);
    push();
  } else if (variant === "flyer" && listing) {
    const addr = [
      listing.address,
      [listing.city, listing.state, listing.zip].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .join(", ");
    const specs = [
      listing.beds != null ? `${listing.beds} bd` : null,
      listing.baths != null ? `${listing.baths} ba` : null,
      listing.sqft != null ? `${listing.sqft} sqft` : null,
      listing.lot ? `lot ${listing.lot}` : null,
      listing.year != null ? `built ${listing.year}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    push("LISTING");
    push(rule);
    if (addr) push(`Address: ${addr}`);
    if (listing.price) push(`Price: ${listing.price}`);
    if (specs) push(`Specs: ${specs}`);
    if (listing.blurb) push(listing.blurb);
    push();
  }

  // Signature block
  if (agent) {
    push("PREPARED BY");
    push(rule);
    push(agent.name);
    const titleLic = [
      agent.title,
      agent.license ? `License #${agent.license}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    if (titleLic) push(titleLic);
    const contact = [agent.phone, agent.email].filter(Boolean).join(" · ");
    if (contact) push(contact);
    push();
  }

  push(FOOTER_LINE);
  return out.join("\n");
}

/* ── Letterhead band ───────────────────────────────────────────────────────── */

function Letterhead({
  formId,
  completion,
}: {
  formId?: string;
  completion?: number;
}) {
  const pct =
    typeof completion === "number"
      ? Math.max(0, Math.min(100, Math.round(completion)))
      : undefined;

  return (
    <header className="px-8 pt-7">
      <div className="flex items-start justify-between gap-4">
        {/* Real Matin wordmark on an ink chip (light-background lockup) */}
        <Logo variant="full" theme="dark" className="h-7" />
        {formId ? (
          <span className="rounded-md border border-mist bg-paper-200 px-2.5 py-1 font-mono text-[0.7rem] font-medium tracking-wide text-slate">
            {formId}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-[0.72rem] font-medium leading-snug text-slate">
        {OFFICE_LINE}
      </p>
      {/* Gold hairline rule — the one rationed accent on the letterhead */}
      <div className="mt-3 h-px w-full bg-gradient-to-r from-gold via-gold/40 to-transparent" />
      {pct != null ? (
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-200">
            <div
              className={cn(
                "h-full rounded-full",
                pct >= 100 ? "bg-success" : "bg-gold",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-[0.7rem] font-medium tabular-nums text-slate">
            {pct}% complete
          </span>
        </div>
      ) : null}
    </header>
  );
}

/* ── Structured field grid (green ✓ filled · red-outline missing) ──────────── */

function FieldGrid({ fields }: { fields: BrandedDocumentField[] }) {
  if (fields.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
      {fields.map((f, i) => {
        const filled = isFilled(f);
        return (
          <div
            key={`${f.label}-${i}`}
            className={cn(
              "flex items-center justify-between gap-3 rounded-md px-3 py-2",
              filled
                ? "bg-paper-200/60"
                : "bg-cloud ring-1 ring-inset ring-danger/45",
            )}
          >
            <div className="min-w-0">
              <p className="eyebrow !text-[0.6rem] !tracking-[0.18em] text-slate">
                {f.label}
              </p>
              <p
                className={cn(
                  "mt-0.5 truncate text-[0.82rem] leading-tight tabular-nums",
                  filled ? "font-medium text-ink" : "italic text-danger",
                )}
              >
                {filled ? f.value : "Missing"}
              </p>
            </div>
            {filled ? (
              <CheckCircle2
                className="h-4 w-4 shrink-0 text-success"
                aria-label="Complete"
              />
            ) : (
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-sm border-2 border-danger"
                aria-label="Missing"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Signature block + brand footer ────────────────────────────────────────── */

function SignatureBlock({
  agent,
  override,
}: {
  agent?: BrandedDocumentAgent;
  override?: ReactNode;
}) {
  if (override) return <>{override}</>;
  if (!agent) return null;
  const photo = agent.photo ?? (agent.slug ? `/matin/agents/${agent.slug}.jpg` : undefined);
  return (
    <div className="flex items-end gap-4">
      {/* Signature line */}
      <div className="flex-1">
        <div className="h-9 border-b-2 border-ink/70" />
        <p className="mt-1.5 text-[0.82rem] font-semibold text-ink">{agent.name}</p>
        <p className="text-[0.72rem] text-slate">
          {[agent.title, agent.license ? `License #${agent.license}` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="text-[0.72rem] text-slate">
          {[agent.phone, agent.email].filter(Boolean).join(" · ")}
        </p>
      </div>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- print-safe headshot, graceful if missing
        <img
          src={photo}
          alt={agent.name}
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-mist"
        />
      ) : null}
    </div>
  );
}

function BrandFooter({ page, pages }: { page?: number; pages?: number }) {
  const showPager = typeof page === "number" && typeof pages === "number";
  return (
    <footer className="mt-auto flex items-center justify-between gap-3 border-t border-mist px-8 py-4">
      <div className="flex items-center gap-2.5">
        <MatinMark theme="dark" className="h-4" />
        <span className="text-[0.68rem] font-medium text-slate">{FOOTER_LINE}</span>
      </div>
      {showPager ? (
        <span className="font-mono text-[0.68rem] font-medium tabular-nums text-slate">
          Page {page} of {pages}
        </span>
      ) : null}
    </footer>
  );
}

/* ── Agreement body — dense numbered legal sections + fillable rectangles ───── */

function FillBox({ label, value }: { label: string; value?: ReactNode }) {
  const filled = value != null && value !== "";
  return (
    <span className="mx-1 inline-flex items-baseline gap-1.5 align-baseline">
      <span className="text-[0.78rem] text-ink">{label}</span>
      <span
        className={cn(
          "inline-flex min-w-[88px] items-center justify-center rounded-sm border px-2 py-0.5 text-[0.78rem] tabular-nums",
          filled
            ? "border-ink/30 bg-paper-200/70 font-semibold text-ink"
            : "border-dashed border-ink/40 bg-cloud text-transparent",
        )}
      >
        {filled ? value : " "}
      </span>
    </span>
  );
}

function InitialsBox() {
  return (
    <span className="ml-1 inline-flex items-baseline gap-1 align-baseline">
      <span className="text-[0.7rem] uppercase tracking-wide text-slate">Initials</span>
      <span className="inline-block h-5 w-9 rounded-sm border border-dashed border-ink/40 align-baseline" />
    </span>
  );
}

function AgreementBody({
  listing,
  fields,
}: {
  listing?: BrandedDocumentListing;
  fields?: BrandedDocumentField[];
}) {
  const priceRaw = fields?.find((f) => /price/i.test(f.label))?.value;
  const buyer = fields?.find((f) => /buyer/i.test(f.label))?.value;
  const area = listing?.address ?? fields?.find((f) => /area|property/i.test(f.label))?.value;

  // Only prefix "$" when the price is a primitive; otherwise pass the node through.
  const priceDisplay =
    typeof priceRaw === "string" || typeof priceRaw === "number"
      ? `$${priceRaw}`
      : priceRaw;

  return (
    <div className="space-y-5 text-justify">
      <section>
        <h3 className="font-display text-[0.98rem] font-normal text-ink">
          1. Parties &amp; Engagement
        </h3>
        <p className="mt-1.5 text-[0.82rem] leading-relaxed text-ink/90">
          This Buyer Service Agreement (the &ldquo;Agreement&rdquo;) is entered into between{" "}
          <span className="font-semibold">{buyer ?? "Buyer"}</span> (&ldquo;Buyer&rdquo;) and{" "}
          {company.name} (&ldquo;Broker&rdquo;), a licensed Oregon real estate brokerage with its
          principal office at {company.address.street}, {company.address.city},{" "}
          {company.address.state} {company.address.zip}. Buyer engages Broker to locate and assist
          in the acquisition of residential real property within the representation area described
          herein, on the terms set forth below. <FillBox label="Purchase Price" value={priceDisplay} />
          <InitialsBox />
        </p>
      </section>

      <section>
        <h3 className="font-display text-[0.98rem] font-normal text-ink">
          2. Representation Area &amp; Term
        </h3>
        <p className="mt-1.5 text-[0.82rem] leading-relaxed text-ink/90">
          Broker&rsquo;s representation extends to{" "}
          <span className="font-semibold">{area ?? "the agreed representation area"}</span> and the
          surrounding Portland-metro communities served by {company.name}. This Agreement commences
          on the date of last signature below and remains in effect through{" "}
          <FillBox label="Expiration" /> unless extended in writing. Broker shall use commercially
          reasonable efforts to identify properties matching Buyer&rsquo;s stated criteria and price
          band, present them promptly, and advise Buyer throughout negotiation, inspection, and
          closing. <InitialsBox />
        </p>
      </section>

      <section>
        <h3 className="font-display text-[0.98rem] font-normal text-ink">
          3. Compensation &amp; Broker Clauses
        </h3>
        <p className="mt-1.5 text-[0.82rem] leading-relaxed text-ink/90">
          Buyer acknowledges that real estate commissions are not set by law and are fully
          negotiable. Broker&rsquo;s compensation, the source of payment, and any cooperative
          compensation offered by a listing broker are disclosed at <FillBox label="Compensation" />{" "}
          of the purchase price or a flat fee, payable at closing. Nothing in this Agreement
          obligates Buyer to pay compensation that is paid by the seller or listing broker. Broker
          policy requires written broker review of all executed agreements prior to submission of
          any offer. <InitialsBox />
        </p>
      </section>

      <section>
        <h3 className="font-display text-[0.98rem] font-normal text-ink">
          4. Agency Disclosure &amp; Oregon Required Notices
        </h3>
        <p className="mt-1.5 text-[0.82rem] leading-relaxed text-ink/90">
          Pursuant to ORS 696.820 and the Oregon Real Estate Agency&rsquo;s mandatory agency
          disclosure (OREF C-565), Buyer has received and reviewed the &ldquo;Initial Agency
          Disclosure Pamphlet&rdquo; describing the duties Broker owes to Buyer, including loyalty,
          confidentiality, disclosure, and accounting. Buyer understands that Broker may, with
          informed written consent, act as a disclosed limited agent in an in-company transaction.
          This Agreement does not create an exclusive obligation to purchase. <InitialsBox />
        </p>
      </section>

      <section>
        <h3 className="font-display text-[0.98rem] font-normal text-ink">
          5. Acceptance
        </h3>
        <p className="mt-1.5 text-[0.82rem] leading-relaxed text-ink/90">
          By signing below, the parties acknowledge they have read, understood, and agree to be
          bound by the terms of this Agreement. Electronic signatures are deemed originals. This
          Agreement constitutes the entire understanding between the parties and supersedes all
          prior discussions.
        </p>
      </section>
    </div>
  );
}

/* ── Net-sheet waterfall (pure SVG, print-safe, themable) ──────────────────── */

function NetSheetWaterfall({
  salePrice,
  lines,
}: {
  salePrice: number;
  lines: NetSheetLine[];
}) {
  // Build the running waterfall: start at salePrice, subtract each cost.
  const costs = lines.filter((l) => l.amount < 0);
  const totalCosts = costs.reduce((s, l) => s + Math.abs(l.amount), 0);
  const net = salePrice - totalCosts;

  const W = 560;
  const H = 220;
  const PAD = { top: 16, right: 16, bottom: 40, left: 16 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // Bars: Gross (full), each cost segment, Net (final). `cap` is the value shown
  // at the top of the bar (signed for cost segments).
  const bars: {
    label: string;
    from: number;
    to: number;
    tone: "gross" | "cost" | "net";
    cap: number;
  }[] = [];
  bars.push({ label: "Gross", from: 0, to: salePrice, tone: "gross", cap: salePrice });
  let running = salePrice;
  for (const c of costs) {
    const next = running - Math.abs(c.amount);
    bars.push({ label: c.label, from: next, to: running, tone: "cost", cap: c.amount });
    running = next;
  }
  bars.push({ label: "Net", from: 0, to: net, tone: "net", cap: net });

  const max = salePrice || 1;
  const yAt = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const bw = plotW / bars.length - 14;
  const xAt = (i: number) => PAD.left + i * (plotW / bars.length) + 7;

  const toneFill: Record<string, string> = {
    gross: "var(--color-ink)",
    cost: "var(--color-danger)",
    net: "var(--color-success)",
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Estimated seller net proceeds waterfall"
    >
      {bars.map((b, i) => {
        const top = yAt(b.to);
        const bottom = yAt(b.from);
        const h = Math.max(2, bottom - top);
        return (
          <g key={`${b.label}-${i}`}>
            <rect
              x={xAt(i)}
              y={top}
              width={bw}
              height={h}
              rx={3}
              fill={toneFill[b.tone]}
              opacity={b.tone === "cost" ? 0.85 : 1}
            />
            <text
              x={xAt(i) + bw / 2}
              y={H - PAD.bottom + 16}
              textAnchor="middle"
              className="fill-slate"
              style={{ fontSize: 9, fontFamily: "var(--font-sans)" }}
            >
              {b.label.length > 12 ? `${b.label.slice(0, 11)}…` : b.label}
            </text>
            <text
              x={xAt(i) + bw / 2}
              y={top - 4}
              textAnchor="middle"
              className="fill-ink"
              style={{ fontSize: 9, fontWeight: 600, fontFamily: "var(--font-sans)" }}
            >
              {usd0(b.cap)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── The document shell ────────────────────────────────────────────────────── */

export function BrandedDocument(props: BrandedDocumentProps) {
  const {
    formId,
    title,
    recipient,
    agent,
    fields = [],
    body,
    signatureBlock,
    variant,
    completion,
    page,
    pages,
    listing,
    mergeTokens = [],
    emailSubject,
    fromName,
    netSheetLines = [],
    salePrice = 0,
    hideToolbar = false,
    className,
  } = props;

  // useId() is React-controlled; strip everything except safe class chars so the
  // class name can never carry anything but [A-Za-z0-9_-] into the <style> text.
  const printId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const printClass = `matindoc-print-${printId}`;

  // Primary: scoped Save-as-PDF. The per-instance print stylesheet below
  // isolates THIS document, so the browser print/PDF carries only the branded
  // letterhead — no app chrome, no toolbar.
  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  // Secondary: a real .txt download of the document's text content, so even
  // without printing there is a tangible file (assembled from the props).
  function handleSaveCopy() {
    downloadTextFile(`matin-${slugifyTitle(title)}.txt`, assembleDocumentText(props));
  }

  /* The print stylesheet: when printing, hide everything except THIS document
     and strip app chrome (no toolbar, no app shell). Scoped by unique class so
     multiple BrandedDocuments on a page each print only themselves when fired. */
  const printCss = `
@media print {
  @page { size: letter portrait; margin: 0.5in; }
  html, body { background: #fff !important; }
  body * { visibility: hidden !important; }
  .${printClass}, .${printClass} * { visibility: visible !important; }
  .${printClass} {
    position: fixed !important; left: 0 !important; top: 0 !important; right: 0 !important;
    width: 100% !important; max-width: none !important; min-height: 0 !important;
    margin: 0 !important; aspect-ratio: auto !important; transform: none !important;
    box-shadow: none !important; border: none !important; border-radius: 0 !important;
    overflow: visible !important;
  }
  .matindoc-toolbar { display: none !important; }
}
`;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Scoped print stylesheet. The class name is sanitized to [A-Za-z0-9_-]
          and the CSS is a static template — no untrusted input, no innerHTML. */}
      <style>{printCss}</style>

      {/* Toolbar — NOT part of the print artifact */}
      {!hideToolbar ? (
        <div className="matindoc-toolbar flex items-center justify-between gap-3">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-slate">
            {variant} preview
          </span>
          <div className="flex items-center gap-2">
            {/* Secondary — a real .txt file even without printing (ink outline, no gold) */}
            <button
              type="button"
              onClick={handleSaveCopy}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.8rem] font-medium text-ink transition-colors hover:border-ink/25 hover:bg-paper"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              Save copy
            </button>
            {/* Primary — scoped print → Save as PDF of just the branded artifact */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[0.8rem] font-semibold text-paper transition-colors hover:bg-ink-800"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden />
              Download PDF
            </button>
          </div>
        </div>
      ) : null}

      {/* The branded artifact — this is what prints. */}
      <article
        className={cn(
          printClass,
          "flex min-h-[440px] flex-col overflow-hidden rounded-xl border border-mist bg-cloud text-ink shadow-soft",
          variant === "flyer" && "aspect-[8.5/11] max-w-[680px]",
        )}
      >
        {variant === "flyer" ? (
          <FlyerVariant listing={listing} agent={agent} title={title} />
        ) : variant === "email" ? (
          <EmailVariant
            title={title}
            emailSubject={emailSubject}
            fromName={fromName}
            recipient={recipient}
            body={body}
            mergeTokens={mergeTokens}
            agent={agent}
          />
        ) : (
          <>
            <Letterhead formId={formId} completion={completion} />

            <div className="flex flex-1 flex-col gap-5 px-8 py-6">
              {/* Title + recipient */}
              <div>
                <h2 className="font-display text-[1.4rem] font-normal leading-tight text-ink">
                  {title}
                </h2>
                {recipient ? (
                  <p className="mt-1 text-[0.82rem] text-slate">
                    Prepared for <span className="font-medium text-ink">{recipient}</span>
                  </p>
                ) : null}
              </div>

              {/* Structured field grid */}
              {fields.length > 0 ? <FieldGrid fields={fields} /> : null}

              {/* Body */}
              <div className="text-[0.84rem] leading-relaxed text-ink/90">
                {body ??
                  (variant === "agreement" ? (
                    <AgreementBody listing={listing} fields={fields} />
                  ) : variant === "netsheet" ? (
                    <NetSheetBody
                      salePrice={salePrice}
                      lines={netSheetLines}
                    />
                  ) : null)}
              </div>

              {/* Signature block */}
              {agent || signatureBlock ? (
                <div className="mt-2 border-t border-mist pt-4">
                  <SignatureBlock agent={agent} override={signatureBlock} />
                </div>
              ) : null}
            </div>

            <BrandFooter page={page} pages={pages} />
          </>
        )}
      </article>
    </div>
  );
}

/* ── Net-sheet body (header + waterfall + line items + footnote) ───────────── */

function NetSheetBody({
  salePrice,
  lines,
}: {
  salePrice: number;
  lines: NetSheetLine[];
}) {
  const costs = lines.filter((l) => l.amount < 0);
  const totalCosts = costs.reduce((s, l) => s + Math.abs(l.amount), 0);
  const net = salePrice - totalCosts;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-slate">Estimated Seller Net Proceeds</p>
          <p className="mt-1 text-[2rem] font-bold leading-none tabular-nums text-success">
            {usd0(net)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[0.72rem] text-slate">Sale price</p>
          <p className="text-[1.05rem] font-semibold tabular-nums text-ink">
            {usd0(salePrice)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-mist bg-paper-200/40 p-4">
        <NetSheetWaterfall salePrice={salePrice} lines={lines} />
      </div>

      {/* Line items */}
      <div className="divide-y divide-mist rounded-lg border border-mist">
        <Row label="Gross sale price" amount={salePrice} tone="ink" bold />
        {lines.map((l, i) => (
          <Row key={`${l.label}-${i}`} label={l.label} amount={l.amount} note={l.note} tone="danger" />
        ))}
        <Row label="Estimated net to seller" amount={net} tone="success" bold />
      </div>

      <p className="text-[0.7rem] leading-snug text-slate">
        Figures are estimates prepared by {company.name} for planning purposes only and are not a
        guarantee of final proceeds. Actual costs are determined by the settlement agent at closing.
        Equal Housing Opportunity.
      </p>
    </div>
  );
}

function Row({
  label,
  amount,
  note,
  tone,
  bold,
}: {
  label: string;
  amount: number;
  note?: string;
  tone: "ink" | "danger" | "success";
  bold?: boolean;
}) {
  const toneClass =
    tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-ink";
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <div className="min-w-0">
        <p className={cn("text-[0.82rem]", bold ? "font-semibold text-ink" : "text-ink/90")}>
          {label}
        </p>
        {note ? <p className="text-[0.7rem] text-slate">{note}</p> : null}
      </div>
      <p
        className={cn(
          "shrink-0 tabular-nums",
          bold ? "text-[0.92rem] font-bold" : "text-[0.84rem] font-medium",
          toneClass,
        )}
      >
        {amount < 0 ? `(${usd0(Math.abs(amount))})` : usd0(amount)}
      </p>
    </div>
  );
}

/* ── Flyer variant (8.5×11 — logo header + hero photo + specs + agent footer) ─ */

function FlyerVariant({
  listing,
  agent,
  title,
}: {
  listing?: BrandedDocumentListing;
  agent?: BrandedDocumentAgent;
  title: string;
}) {
  const photo =
    agent?.photo ?? (agent?.slug ? `/matin/agents/${agent.slug}.jpg` : undefined);
  const addressLine = listing
    ? [listing.address, [listing.city, listing.state, listing.zip].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", ")
    : title;

  const specs = [
    listing?.beds != null ? { k: "Beds", v: String(listing.beds) } : null,
    listing?.baths != null ? { k: "Baths", v: String(listing.baths) } : null,
    listing?.sqft != null ? { k: "Sq Ft", v: String(listing.sqft) } : null,
    listing?.lot ? { k: "Lot", v: listing.lot } : listing?.year != null ? { k: "Built", v: String(listing.year) } : null,
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <div className="flex h-full flex-col">
      {/* Logo header band — ink */}
      <div className="flex items-center justify-between gap-3 bg-ink px-7 py-4">
        <Logo variant="full" theme="white" className="h-7" />
        <p className="font-display text-[0.92rem] font-normal text-paper">
          {listing?.headline ?? "Just Listed"}
        </p>
      </div>

      {/* Hero photo slot */}
      <div className="relative h-[44%] w-full overflow-hidden bg-paper-200">
        {listing?.heroPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element -- print-safe listing hero, graceful if missing
          <img
            src={listing.heroPhoto}
            alt={addressLine}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[0.72rem] uppercase tracking-[0.2em] text-slate">
            Listing hero photo
          </div>
        )}
        {listing?.price ? (
          <span className="absolute bottom-3 left-3 rounded-md bg-ink/90 px-3 py-1.5 text-[1.1rem] font-bold tabular-nums text-paper">
            {listing.price}
          </span>
        ) : null}
      </div>

      {/* Spec block */}
      <div className="flex flex-1 flex-col gap-4 px-7 py-5">
        <div>
          <h2 className="font-display text-[1.25rem] font-normal leading-tight text-ink">
            {addressLine}
          </h2>
          {listing?.blurb ? (
            <p className="mt-1.5 text-[0.82rem] leading-relaxed text-ink/85">{listing.blurb}</p>
          ) : null}
        </div>

        {specs.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 rounded-lg border border-mist bg-paper-200/50 p-3">
            {specs.map((s) => (
              <div key={s.k} className="text-center">
                <p className="text-[1.05rem] font-bold tabular-nums text-ink">{s.v}</p>
                <p className="eyebrow !text-[0.58rem] !tracking-[0.16em] text-slate">{s.k}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Agent footer + Equal Housing */}
      <div className="flex items-center justify-between gap-4 border-t border-mist bg-cloud px-7 py-4">
        <div className="flex items-center gap-3">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- print-safe headshot, graceful if missing
            <img
              src={photo}
              alt={agent?.name ?? ""}
              className="h-12 w-12 rounded-full object-cover ring-1 ring-mist"
            />
          ) : null}
          <div>
            <p className="text-[0.86rem] font-semibold text-ink">{agent?.name}</p>
            <p className="text-[0.72rem] text-slate">
              {[agent?.title, agent?.license ? `Lic #${agent.license}` : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="text-[0.72rem] text-slate">{agent?.phone}</p>
          </div>
        </div>
        <div className="text-right">
          <MatinMark theme="dark" className="ml-auto h-5" />
          <p className="mt-1 text-[0.62rem] text-slate">Equal Housing Opportunity</p>
        </div>
      </div>
    </div>
  );
}

/* ── Email variant (branded from-bar + merge tokens + branded footer) ──────── */

function EmailVariant({
  title,
  emailSubject,
  fromName,
  recipient,
  body,
  mergeTokens,
  agent,
}: {
  title: string;
  emailSubject?: string;
  fromName?: string;
  recipient?: string;
  body?: ReactNode;
  mergeTokens: string[];
  agent?: BrandedDocumentAgent;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Branded from-bar — real Matin mark, never a hand-rolled "M" box */}
      <div className="flex items-center gap-3 border-b border-mist bg-ink px-6 py-3.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cloud">
          <MatinMark theme="dark" className="h-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[0.82rem] font-semibold text-paper">
            {fromName ?? `${company.name} · ${agent?.name ?? "Listings Team"}`}
          </p>
          <p className="truncate text-[0.7rem] text-slate-300">
            {company.email} · to {recipient ?? "{{recipient_email}}"}
          </p>
        </div>
      </div>

      {/* Subject */}
      <div className="border-b border-mist px-6 py-3">
        <p className="text-[0.7rem] uppercase tracking-[0.16em] text-slate">Subject</p>
        <p className="mt-0.5 text-[0.92rem] font-semibold text-ink">
          {emailSubject ?? title}
        </p>
      </div>

      {/* Body with visible merge tokens */}
      <div className="flex-1 space-y-3 px-6 py-5 text-[0.84rem] leading-relaxed text-ink/90">
        {body ?? (
          <>
            <p>
              Hi <MergeToken>{"{{first_name}}"}</MergeToken>,
            </p>
            <p>
              I wanted to reach out about your interest in{" "}
              <MergeToken>{"{{address}}"}</MergeToken>. Based on what&rsquo;s happening in{" "}
              <MergeToken>{"{{community}}"}</MergeToken> right now, I&rsquo;ve pulled a short list of
              homes that fit your budget and timeline — I&rsquo;d love to walk you through them.
            </p>
            <p>
              You can reply here or reach me directly at {agent?.phone ?? company.phone}. Looking
              forward to helping you find the right fit.
            </p>
            <p>
              Warmly,
              <br />
              {agent?.name ?? "The Matin Listings Team"}
              {agent?.title ? `, ${agent.title}` : ""}
            </p>
          </>
        )}
        {mergeTokens.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {mergeTokens.map((t) => (
              <MergeToken key={t}>{t}</MergeToken>
            ))}
          </div>
        ) : null}
      </div>

      {/* Branded footer — real West Linn office line */}
      <div className="border-t border-mist bg-paper-200/50 px-6 py-3.5">
        <div className="flex items-center gap-2">
          <MatinMark theme="dark" className="h-4" />
          <p className="text-[0.68rem] font-medium text-slate">{OFFICE_LINE}</p>
        </div>
        <p className="mt-1 text-[0.62rem] text-slate">
          {company.name} · Equal Housing Opportunity · You received this because you contacted us
          about Oregon &amp; SW Washington real estate.
        </p>
      </div>
    </div>
  );
}

function MergeToken({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-sm bg-gold-soft px-1.5 py-0.5 font-mono text-[0.72rem] font-medium text-gold-ink">
      {children}
    </span>
  );
}
