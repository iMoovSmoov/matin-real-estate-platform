import type { ReactNode } from "react";
import { BrandedDocument } from "@/components/os/BrandedDocument";
import type {
  BrandedDocumentAgent,
  BrandedDocumentField,
  NetSheetLine,
} from "@/components/os/BrandedDocument";
import { Logo, MatinMark } from "@/components/brand/Logo";
import company from "@/lib/data/company.json";
import agentsData from "@/lib/data/agents.json";

export const metadata = { title: "Brand Preview · Matin Brokerage OS" };

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Branded Document System preview (Wave-0 G-B gate)

   Renders the Logo lockups (proving the MLS-jpg bug is fixed — only real Matin
   marks appear) and each BrandedDocument variant once, bound to REAL
   company.json + agents.json data. This is the gate for the branded-document
   workstream; Wave-1 agents consume BrandedDocument read-only.
   ────────────────────────────────────────────────────────────────────────── */

type AgentRecord = {
  slug: string;
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  licenses?: string[];
};

/** Pull a real agent (with a headshot on disk) into the BrandedDocument shape. */
function agentProp(slug: string, licenseOverride?: string): BrandedDocumentAgent {
  const a = (agentsData as AgentRecord[]).find((r) => r.slug === slug);
  return {
    name: a?.name ?? slug,
    title: a?.title,
    phone: a?.phone,
    email: a?.email,
    slug,
    // Real Matin/brokerage license (from brand.json) for the principal;
    // others carry their state license designation.
    license: licenseOverride ?? "200009148",
  };
}

// Real agents that have headshots on disk.
const principal = agentProp("jordan-matin");
const lister = agentProp("sierra-palmeri");
const broker = agentProp("erin-martin");
const ben = agentProp("benjamin-fabian");

const HERO_PHOTO = "/matin/exteriors/exteriors-04.jpg";

/* ── Sample field grids (some filled, some intentionally missing) ──────────── */

const agreementFields: BrandedDocumentField[] = [
  { label: "Buyer", value: "Daniel Cho" },
  { label: "Representation Area", value: "Lake Oswego, OR" },
  { label: "Budget Band", value: "$750,000 – $895,000" },
  { label: "Purchase Price", value: "895,000" },
  { label: "Agreement Term", value: "90 days" },
  { label: "Expiration", value: undefined }, // intentionally missing → red-outline
  { label: "Buyer Initials (p.4)", value: undefined }, // missing
  { label: "Broker Review", value: "Erin Martin" },
];

const formFields: BrandedDocumentField[] = [
  { label: "Listing", value: "7428 SW Maple Ave" },
  { label: "Seller", value: "The Whitfield Family Trust" },
  { label: "List Price", value: "$895,000" },
  { label: "MLS #", value: "RMLS-24-008812" },
  { label: "Disclosure Pages", value: "12 of 12" },
  { label: "Lead-Based Paint Addendum", value: undefined }, // missing
];

const netSheetLines: NetSheetLine[] = [
  { label: "Mortgage payoff", amount: -412_000, note: "Estimated principal balance at closing" },
  { label: "Listing commission", amount: -26_850, note: "3.0% of sale price" },
  { label: "Buyer-side commission", amount: -22_375, note: "2.5% cooperative" },
  { label: "Title & escrow", amount: -3_120 },
  { label: "Excise / recording", amount: -1_790 },
  { label: "Repairs & staging", amount: -4_500 },
];

/* ── Section wrapper ───────────────────────────────────────────────────────── */

function Section({
  n,
  title,
  blurb,
  children,
}: {
  n: string;
  title: string;
  blurb: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-mist pt-6">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[0.72rem] font-medium text-gold-ink">{n}</span>
        <h2 className="font-display text-[1.25rem] font-normal leading-tight text-ink">
          {title}
        </h2>
      </div>
      <p className="mt-1 max-w-2xl text-[0.82rem] leading-snug text-slate">{blurb}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function BrandPreviewPage() {
  return (
    <div className="mx-auto max-w-[920px] px-4 py-6 md:px-6">
      <header>
        <p className="eyebrow text-slate">Wave-0 · G-B</p>
        <h1 className="mt-1 font-display text-[1.8rem] font-normal leading-tight text-ink">
          Matin Branded Document System
        </h1>
        <p className="mt-1.5 max-w-2xl text-[0.86rem] leading-relaxed text-slate">
          Every client-facing artifact renders as a real, printable, downloadable
          Matin-branded document — letterhead, live field grid with completion checks,
          dense legal body, signature block, and a {company.address.city} office footer.
          Use the <span className="font-medium text-ink">Download / Print</span> action on
          any document to print that branded artifact.
        </p>
      </header>

      {/* ── Logo lockups — proves the MLS-jpg bug is fixed ──────────────────── */}
      <Section
        n="00"
        title="Brand marks (logo fix)"
        blurb="The dark-on-light wordmark previously rendered a Willamette Valley MLS logo. Fixed: light contexts now seat the real white Matin wordmark on an ink chip; the M-mark is the real Matin favicon mark. No MLS asset is ever shown."
      >
        <div className="flex flex-wrap items-stretch gap-4">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-mist bg-cloud p-6">
            <Logo variant="full" theme="dark" />
            <span className="text-[0.68rem] text-slate">full · light bg (ink chip)</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-xl border border-ink-700 bg-ink p-6">
            <Logo variant="full" theme="white" />
            <span className="text-[0.68rem] text-slate-300">full · dark bg</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-mist bg-cloud p-6">
            <MatinMark theme="dark" className="h-8" />
            <span className="text-[0.68rem] text-slate">mark · light</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-ink-700 bg-ink p-6">
            <MatinMark theme="white" className="h-8" />
            <span className="text-[0.68rem] text-slate-300">mark · dark</span>
          </div>
        </div>
      </Section>

      {/* ── letter ──────────────────────────────────────────────────────────── */}
      <Section
        n="01"
        title="variant: letter"
        blurb="General Matin letterhead — wordmark band, gold hairline, structured field grid, body, signature block, brand footer + pager."
      >
        <BrandedDocument
          variant="letter"
          title="Listing Engagement Confirmation"
          recipient="The Whitfield Family Trust"
          agent={lister}
          completion={83}
          page={1}
          pages={1}
          fields={formFields}
          body={
            <div className="space-y-3">
              <p>
                Thank you for choosing {company.name} to represent the sale of your home. This letter
                confirms that our listing team has begun preparing your property for market —
                including photography, disclosures, and MLS entry — and outlines what to expect over
                the next several days.
              </p>
              <p>
                Your dedicated listing coordinator, {lister.name}, will keep you updated at every
                milestone. If anything needs your signature or attention, you&rsquo;ll hear from us
                directly. We&rsquo;re committed to luxury service and exceptional results on the sale
                of your home.
              </p>
            </div>
          }
        />
      </Section>

      {/* ── agreement ───────────────────────────────────────────────────────── */}
      <Section
        n="02"
        title="variant: agreement"
        blurb="OREF C-565 buyer agreement at SkySlope density — numbered legal sections, inline fillable rectangles (Purchase Price, initials), live field grid with green checks / red-outline-missing, signature block, Page 1 of 4."
      >
        <BrandedDocument
          variant="agreement"
          formId="OREF C-565"
          title="Buyer Service Agreement"
          recipient="Daniel Cho"
          agent={broker}
          fields={agreementFields}
          completion={75}
          page={1}
          pages={4}
          listing={{ address: "Lake Oswego, OR" }}
        />
      </Section>

      {/* ── flyer ───────────────────────────────────────────────────────────── */}
      <Section
        n="03"
        title="variant: flyer"
        blurb="8.5×11 listing flyer — ink logo header, real listing hero photo with price overlay, 4-cell spec block, agent headshot footer, Matin mark + Equal Housing Opportunity."
      >
        <BrandedDocument
          variant="flyer"
          title="7428 SW Maple Ave"
          agent={ben}
          listing={{
            address: "7428 SW Maple Ave",
            city: "Lake Oswego",
            state: "OR",
            zip: "97035",
            price: "$895,000",
            beds: 4,
            baths: 3,
            sqft: "3,140",
            year: 2016,
            heroPhoto: HERO_PHOTO,
            headline: "Just Listed",
            blurb:
              "Light-filled craftsman on a quarter-acre lot in the heart of Lake Oswego — chef's kitchen, primary on main, and a private backyard minutes from the lake.",
          }}
        />
      </Section>

      {/* ── email ───────────────────────────────────────────────────────────── */}
      <Section
        n="04"
        title="variant: email"
        blurb="Branded from-bar with the real Matin mark (never a hand-rolled 'M' box), visible merge tokens, and a branded footer with the real West Linn office line."
      >
        <BrandedDocument
          variant="email"
          title="New homes that fit your search"
          emailSubject="3 Lake Oswego homes in your budget — want to see them this week?"
          recipient="daniel.cho@example.com"
          fromName={`${company.name} · ${broker.name}`}
          agent={broker}
          mergeTokens={["{{first_name}}", "{{address}}", "{{community}}", "{{budget}}"]}
        />
      </Section>

      {/* ── netsheet ────────────────────────────────────────────────────────── */}
      <Section
        n="05"
        title="variant: netsheet"
        blurb="Estimated Seller Net Proceeds — Matin header, a gross→costs→net waterfall (pure SVG, print-safe), itemized credits/debits, and a compliance footnote."
      >
        <BrandedDocument
          variant="netsheet"
          formId="Net Sheet"
          title="Estimated Seller Net Proceeds"
          recipient="The Whitfield Family Trust"
          agent={lister}
          salePrice={895_000}
          netSheetLines={netSheetLines}
          page={1}
          pages={1}
        />
      </Section>

      {/* ── report ──────────────────────────────────────────────────────────── */}
      <Section
        n="06"
        title="variant: report"
        blurb="Letterhead report export — scope field grid + body, branded footer + pager. Used for Reports exports and internal-but-branded summaries."
      >
        <BrandedDocument
          variant="report"
          formId="Performance Report"
          title="Q2 Brokerage Performance"
          recipient="Leadership · Oregon Team"
          agent={principal}
          completion={100}
          page={1}
          pages={3}
          fields={[
            { label: "Date Range", value: "Apr 1 – Jun 30, 2026" },
            { label: "Team", value: "Oregon" },
            { label: "Closed Volume", value: company.stats.annualVolume },
            { label: "Properties Sold", value: company.stats.propertiesSold },
            { label: "Active Listings", value: String(company.stats.activeListingsNum) },
            { label: "Agents", value: String(company.stats.agents) },
          ]}
          body={
            <div className="space-y-3">
              <p>
                {company.name} closed{" "}
                <span className="font-semibold">{company.stats.annualVolume}</span> in volume across{" "}
                <span className="font-semibold">{company.stats.propertiesSold}</span> properties this
                period, with {company.stats.activeListingsNum} active listings carried into the next
                quarter. Speed-to-lead held under five minutes team-wide and at-risk transactions were
                resolved ahead of their contingency deadlines.
              </p>
              <p>
                This report scopes to the Oregon team across the West Linn and Vancouver offices. KPI
                figures reconcile to the underlying CRM, transaction, and reporting records.
              </p>
            </div>
          }
        />
      </Section>
    </div>
  );
}
