"use client";

import { useMemo, useRef, useState } from "react";
import {
  CircleCheck,
  StickyNote,
  Banknote,
  TriangleAlert,
  Link2,
  Copy,
  Receipt,
} from "lucide-react";
import { scrollToEl } from "./motion";
import { streamAi } from "@/lib/ai/client";
import { getAgent, listingPhoto } from "@/lib/data";
import { cn, usd } from "@/lib/utils";
import {
  StatusChip,
  CalloutCard,
  Dot,
  Avatar,
  PropertyThumb,
  BrandedDocument,
} from "@/components/os";
import type { NetSheetLine } from "@/components/os/BrandedDocument";
import { MatinMark } from "@/components/brand/Logo";
import { NetToSellerBar } from "./SellerCharts";

/* Real listing agent representing Sarah Mitchell (SL-000 → chase-bright). */
const LISTING_AGENT_SLUG = "chase-bright";

/* ──────────────────────────────────────────────────────────────────────────
   Seller / Cash Offers — cash-offer comparison matrix + net sheet (§2.3)

   SkySlope frozen-column offer comparison: terms are ROWS (frozen left label
   column), competing offers are COLUMNS. Each offer column header carries the
   buyer agent's real Avatar, a big price, an Accept (state-mutating) + Add
   Notes (opens an inline note field). Accepting an offer highlights it, DISABLES
   the others, shows an inline confirmation, and recomputes the Net Sheet to the
   accepted offer. The (i) verdict is upgraded to an AI verdict — streamAi
   ('cash-offer-eval') streams into a dark CalloutCard inline (AI surfaces are
   dark — §1.8). A share-link block lets a buyer agent submit an offer.
   ────────────────────────────────────────────────────────────────────────── */

type AttrKey = "price" | "closing" | "loan" | "down" | "contingencies";

interface OfferColumn {
  id: string;
  buyer: string;
  agent: string;
  agentSlug: string;
  price: number;
  closing: string;
  loan: string;
  down: string;
  contingencies: string;
  /** Costs that net out against this offer's gross price (per-offer net sheet). */
  payoff: number;
  commissionRate: number;
  closingCosts: number;
  taxProration: number;
  /** Flags weak terms in the grid (auto-ranked — §2.3 AI behavior). */
  weak: Partial<Record<AttrKey, boolean>>;
  recommended?: boolean;
}

const ATTRS: { key: AttrKey; label: string }[] = [
  { key: "price", label: "Offer price" },
  { key: "closing", label: "Closing date" },
  { key: "loan", label: "Loan type" },
  { key: "down", label: "Down payment" },
  { key: "contingencies", label: "Contingencies" },
];

/* Canonical offers on Sarah Mitchell's home (5127 SW Cedar Hills Blvd). */
const OFFERS: OfferColumn[] = [
  {
    id: "OFF-01",
    buyer: "Cascade Cash Offers (partner)",
    agent: "Jordan Matin",
    agentSlug: "jordan-matin",
    price: 798000,
    closing: "Jul 8 · 14 days",
    loan: "All cash",
    down: "100%",
    contingencies: "None — as-is",
    payoff: 214500,
    commissionRate: 0.05,
    closingCosts: 6850,
    taxProration: 3120,
    weak: {},
    recommended: true,
  },
  {
    id: "OFF-02",
    buyer: "The Vance Household",
    agent: "Joshua Rose",
    agentSlug: "joshua-rose",
    price: 821000,
    closing: "Aug 22 · 59 days",
    loan: "Conventional 30yr",
    down: "20%",
    contingencies: "Inspection + appraisal + financing",
    payoff: 214500,
    commissionRate: 0.05,
    closingCosts: 7300,
    taxProration: 4180,
    weak: { closing: true, contingencies: true },
  },
  {
    id: "OFF-03",
    buyer: "R. & M. Okonkwo",
    agent: "Chase Bright",
    agentSlug: "chase-bright",
    price: 805000,
    closing: "Aug 1 · 38 days",
    loan: "FHA 30yr",
    down: "3.5%",
    contingencies: "Inspection + appraisal",
    payoff: 214500,
    commissionRate: 0.05,
    closingCosts: 7050,
    taxProration: 3650,
    weak: { down: true, loan: true },
  },
];

const EST_VALUE = 812000;

function netSheetFor(o: OfferColumn) {
  const commission = Math.round(o.price * o.commissionRate);
  const rows: { label: string; value: number; tone: "ink" | "danger" }[] = [
    { label: "Accepted offer price", value: o.price, tone: "ink" },
    { label: "Existing mortgage payoff", value: -o.payoff, tone: "danger" },
    {
      label: `Agent commission (${Math.round(o.commissionRate * 100)}%)`,
      value: -commission,
      tone: "danger",
    },
    { label: "Title, escrow & recording", value: -o.closingCosts, tone: "danger" },
    { label: "Property tax proration", value: -o.taxProration, tone: "danger" },
  ];
  const net = rows.reduce((s, r) => s + r.value, 0);
  return { rows, net };
}

function cellValue(o: OfferColumn, key: AttrKey): string {
  switch (key) {
    case "price":
      return usd(o.price);
    case "closing":
      return o.closing;
    case "loan":
      return o.loan;
    case "down":
      return o.down;
    case "contingencies":
      return o.contingencies;
  }
}

/* Real Matin host (not the fake matinos.app — S3 ticket 6). */
const SHARE_LINK = "matinrealestate.com/offer/5127-cedar-hills";

/** Map an accepted/top offer's net-sheet rows to BrandedDocument net lines. */
function brandedNetLines(o: OfferColumn): NetSheetLine[] {
  const commission = Math.round(o.price * o.commissionRate);
  return [
    { label: "Existing mortgage payoff", amount: -o.payoff, note: "Pending lender statement" },
    { label: `Brokerage commission (${Math.round(o.commissionRate * 100)}%)`, amount: -commission, note: "Fully negotiable" },
    { label: "Title, escrow & recording", amount: -o.closingCosts },
    { label: "Property-tax proration", amount: -o.taxProration },
  ];
}

export function CashOfferMatrix() {
  // Default the net sheet to the recommended offer until one is accepted.
  const [accepted, setAccepted] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [verdict, setVerdict] = useState<{ text: string; running: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  /** Net sheet: quick summary card vs the printable branded document. */
  const [netView, setNetView] = useState<"summary" | "branded">("summary");
  /** The streaming AI-verdict callout — scrolled into view when it runs so the
   *  user SEES the result appear (the trigger is at the top of a tall table). */
  const verdictRef = useRef<HTMLDivElement>(null);

  const netSheetOffer = useMemo(
    () => OFFERS.find((o) => o.id === accepted) ?? OFFERS.find((o) => o.recommended)!,
    [accepted],
  );
  const { rows: netRows, net: netProceeds } = useMemo(
    () => netSheetFor(netSheetOffer),
    [netSheetOffer],
  );

  // Strongest net across offers — drives the per-column net-to-seller bar.
  const maxNet = useMemo(() => Math.max(...OFFERS.map((o) => netSheetFor(o).net)), []);
  const topNetId = useMemo(
    () =>
      OFFERS.reduce((best, o) =>
        netSheetFor(o).net > netSheetFor(best).net ? o : best,
      ).id,
    [],
  );

  // Real listing agent identity for the branded net sheet signature.
  const listingAgent = getAgent(LISTING_AGENT_SLUG);
  const brandedAgent = {
    name: listingAgent?.name ?? "Chase Bright",
    title: listingAgent?.title ?? "Real Estate Broker",
    license: listingAgent?.licenseNumbers?.OR ?? listingAgent?.licenses?.[0],
    phone: listingAgent?.phone,
    email: listingAgent?.email,
    slug: LISTING_AGENT_SLUG,
  };

  async function runVerdict() {
    setVerdict({ text: "", running: true });
    // Scroll the (now-mounting) verdict callout into view so the result is
    // visible immediately rather than appearing below the fold.
    scrollToEl(verdictRef.current, "nearest");
    await streamAi(
      {
        tool: "cash-offer-eval",
        input: {
          property: "5127 SW Cedar Hills Blvd, Beaverton",
          seller: "Sarah Mitchell",
          estValue: EST_VALUE,
          offers: OFFERS.map((o) => ({
            buyer: o.buyer,
            price: o.price,
            closing: o.closing,
            loan: o.loan,
            down: o.down,
            contingencies: o.contingencies,
            netProceeds: netSheetFor(o).net,
          })),
        },
      },
      (_chunk, full) => setVerdict((v) => (v ? { ...v, text: full } : v)),
    );
    setVerdict((v) => (v ? { ...v, running: false } : v));
  }

  function copyLink() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(`https://${SHARE_LINK}`);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const acceptedOffer = accepted ? OFFERS.find((o) => o.id === accepted) : null;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.65fr_1fr]">
      {/* ── Comparison matrix ─────────────────────────────────────────────── */}
      <section className="min-w-0 rounded-2xl border border-mist bg-cloud shadow-soft">
        {/* Header — property photo + AI verdict trigger */}
        <div className="flex items-center justify-between gap-3 border-b border-mist px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <PropertyThumb
              src={listingPhoto({ id: "SL-000" })}
              ratio="square"
              alt="5127 SW Cedar Hills Blvd"
              className="h-11 w-11 shrink-0 rounded-lg"
            />
            <div className="min-w-0">
              <h3 className="font-display text-[1.05rem] font-normal leading-tight text-ink">
                Offer comparison
              </h3>
              <p className="mt-0.5 truncate text-[0.76rem] text-slate">
                5127 SW Cedar Hills Blvd · Sarah Mitchell · 3 active offers · est. {usd(EST_VALUE)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={runVerdict}
            disabled={verdict?.running}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-gold-bright disabled:opacity-50"
          >
            <MatinMark theme="dark" className="h-3.5 w-3.5" />
            {verdict?.running ? "Evaluating…" : "AI verdict"}
          </button>
        </div>

        {/* Accepted-offer confirmation banner (inline mutation feedback) */}
        {acceptedOffer ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-success/25 bg-success/[0.07] px-5 py-2.5 text-[0.8rem] motion-safe:animate-fade">
            <CircleCheck className="h-4 w-4 shrink-0 text-success" aria-hidden />
            <span className="min-w-0 flex-1 text-ink">
              Accepted <span className="font-semibold">{acceptedOffer.buyer}</span> at{" "}
              <span className="font-semibold tabular-nums">{usd(acceptedOffer.price)}</span> — other
              offers are on hold. Net sheet updated.
            </span>
            <button
              type="button"
              onClick={() => setAccepted(null)}
              className="ml-auto inline-flex min-h-11 shrink-0 items-center rounded-md px-2 py-1 text-[0.74rem] font-medium text-slate transition-colors hover:text-ink"
            >
              Undo
            </button>
          </div>
        ) : null}

        {/* Swipe affordance on narrow screens — the matrix keeps a frozen label
            column and scrolls horizontally (SkySlope pattern); tell the phone
            user there are more offer columns to the right. */}
        <p className="px-5 pt-2 text-[0.7rem] text-slate sm:hidden">
          Swipe the grid sideways to compare all {OFFERS.length} offers →
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                {/* Frozen attribute-label corner */}
                <th className="sticky left-0 z-10 w-36 bg-cloud px-4 py-3 align-bottom shadow-[6px_0_8px_-6px_rgba(6,6,6,0.12)]" />
                {OFFERS.map((o) => {
                  const isAccepted = accepted === o.id;
                  const disabled = accepted != null && !isAccepted;
                  return (
                    <th
                      key={o.id}
                      className={cn(
                        "min-w-[12rem] border-l border-mist px-4 py-3 align-top transition-colors",
                        isAccepted
                          ? "bg-success/[0.06]"
                          : o.recommended
                            ? "bg-gold-soft/30"
                            : "bg-cloud",
                        disabled && "opacity-45",
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-display text-[1.35rem] font-normal leading-none text-ink tabular-nums">
                          {usd(o.price)}
                        </span>
                        {o.recommended && !accepted ? (
                          <StatusChip tone="gold" variant="soft">
                            Top pick
                          </StatusChip>
                        ) : null}
                        {isAccepted ? (
                          <StatusChip tone="success" variant="soft">
                            Accepted
                          </StatusChip>
                        ) : null}
                      </div>

                      {/* Buyer agent identity — real Avatar */}
                      <div className="mt-2 flex items-center gap-2">
                        <Avatar name={o.agent} slug={o.agentSlug} size={26} ring />
                        <div className="min-w-0">
                          <p
                            className="truncate text-[0.78rem] font-medium leading-tight text-ink"
                            title={o.buyer}
                          >
                            {o.buyer}
                          </p>
                          <p className="truncate text-[0.72rem] leading-tight text-slate">
                            {o.agent}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => setAccepted(isAccepted ? null : o.id)}
                          className={cn(
                            "inline-flex min-h-11 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[0.74rem] font-semibold transition-colors disabled:cursor-not-allowed",
                            isAccepted
                              ? "bg-success text-cloud hover:bg-success/90"
                              : "bg-ink text-cloud hover:bg-ink-800 disabled:bg-ink/30",
                          )}
                        >
                          <CircleCheck className="h-3.5 w-3.5" aria-hidden />
                          {isAccepted ? "Accepted" : "Accept"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setNotesOpen((cur) => (cur === o.id ? null : o.id))
                          }
                          className={cn(
                            "inline-flex min-h-11 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[0.74rem] font-medium transition-colors",
                            notes[o.id]
                              ? "border-ink/20 bg-paper-200 text-ink"
                              : "border-mist bg-cloud text-slate hover:border-ink/20 hover:text-ink",
                          )}
                        >
                          <StickyNote className="h-3.5 w-3.5" aria-hidden />
                          {notes[o.id] ? "Note ✓" : "Notes"}
                        </button>
                      </div>

                      {/* Inline note editor */}
                      {notesOpen === o.id ? (
                        <div className="mt-2">
                          <textarea
                            rows={2}
                            value={notes[o.id] ?? ""}
                            onChange={(e) =>
                              setNotes((n) => ({ ...n, [o.id]: e.target.value }))
                            }
                            placeholder="Add a note for the seller…"
                            className="w-full resize-none rounded-lg border border-mist bg-paper px-2.5 py-1.5 text-[0.76rem] text-ink outline-none focus:border-ink/30"
                          />
                          <button
                            type="button"
                            onClick={() => setNotesOpen(null)}
                            className="mt-1 rounded-md bg-ink px-2.5 py-1 text-[0.72rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
                          >
                            Save note
                          </button>
                        </div>
                      ) : notes[o.id] ? (
                        <p className="mt-2 line-clamp-2 rounded-lg bg-paper-200/70 px-2.5 py-1.5 text-[0.72rem] leading-snug text-slate">
                          {notes[o.id]}
                        </p>
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ATTRS.map((attr) => (
                <tr key={attr.key} className="border-t border-mist">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 w-36 bg-cloud px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-slate shadow-[6px_0_8px_-6px_rgba(6,6,6,0.12)]"
                  >
                    {attr.label}
                  </th>
                  {OFFERS.map((o) => {
                    const weak = !!o.weak[attr.key];
                    const isAccepted = accepted === o.id;
                    const disabled = accepted != null && !isAccepted;
                    return (
                      <td
                        key={o.id}
                        className={cn(
                          "border-l border-mist px-4 py-3 align-top text-[0.82rem] transition-colors",
                          isAccepted
                            ? "bg-success/[0.04]"
                            : o.recommended && !accepted
                              ? "bg-gold-soft/15"
                              : "",
                          disabled && "opacity-45",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 font-medium tabular-nums",
                            attr.key === "price"
                              ? "text-success"
                              : weak
                                ? "text-danger"
                                : "text-ink",
                          )}
                        >
                          {weak ? <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
                          {cellValue(o, attr.key)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Net-proceeds row — reconciles each column to the net sheet,
                  with a per-column net-to-seller mini bar so the winner is
                  obvious at a glance (S3 ticket 2). */}
              <tr className="border-t border-mist bg-paper-200/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 w-36 bg-paper-200 px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-slate shadow-[6px_0_8px_-6px_rgba(6,6,6,0.12)]"
                >
                  Net to seller
                </th>
                {OFFERS.map((o) => {
                  const isAccepted = accepted === o.id;
                  const disabled = accepted != null && !isAccepted;
                  const net = netSheetFor(o).net;
                  return (
                    <td
                      key={o.id}
                      className={cn(
                        "border-l border-mist px-4 py-3 align-top",
                        isAccepted && "bg-success/[0.06]",
                        disabled && "opacity-45",
                      )}
                    >
                      <span className="font-semibold tabular-nums text-ink">{usd(net)}</span>
                      <NetToSellerBar net={net} max={maxNet} isTop={o.id === topNetId} />
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* AI verdict — dark callout (AI surface) */}
        {verdict ? (
          <div ref={verdictRef} className="px-5 pb-5 pt-1 motion-safe:animate-fade">
            <CalloutCard
              tone="ai"
              title="AI offer verdict"
              action={
                <span className="text-[0.72rem] text-slate-300/70">
                  Auto-ranked from price, net proceeds, speed &amp; risk
                </span>
              }
            >
              <p className="whitespace-pre-wrap leading-relaxed">
                {verdict.text ||
                  (verdict.running ? "Matin AI is weighing the offers…" : "")}
              </p>
            </CalloutCard>
          </div>
        ) : null}
      </section>

      {/* ── Right rail: net sheet + share-link intake ─────────────────────── */}
      <aside className="flex min-w-0 flex-col gap-5">
        <div className="rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-[1.05rem] font-normal leading-tight text-ink">
              Net sheet
            </h3>
            <div className="flex items-center gap-2">
              <StatusChip tone={accepted ? "success" : "gold"} variant="soft">
                {accepted ? "Accepted offer" : "Top cash offer"}
              </StatusChip>
              {/* Summary vs printable branded document (S3 ticket 7) */}
              <div className="inline-flex items-center gap-0.5 rounded-lg border border-mist bg-paper-200/60 p-0.5">
                <button
                  type="button"
                  onClick={() => setNetView("summary")}
                  aria-pressed={netView === "summary"}
                  className={cn(
                    "inline-flex min-h-[40px] items-center rounded-md px-2 py-1 text-[0.72rem] font-medium transition-colors",
                    netView === "summary" ? "bg-cloud text-ink shadow-soft" : "text-slate hover:text-ink",
                  )}
                >
                  Summary
                </button>
                <button
                  type="button"
                  onClick={() => setNetView("branded")}
                  aria-pressed={netView === "branded"}
                  className={cn(
                    "inline-flex min-h-[40px] items-center gap-1 rounded-md px-2 py-1 text-[0.72rem] font-medium transition-colors",
                    netView === "branded" ? "bg-cloud text-ink shadow-soft" : "text-slate hover:text-ink",
                  )}
                >
                  <Receipt className="h-3 w-3" aria-hidden />
                  Branded
                </button>
              </div>
            </div>
          </div>
          <p className="mt-1 text-[0.74rem] text-slate">
            {netSheetOffer.buyer} · {usd(netSheetOffer.price)}
          </p>

          {/* `key` remounts on each Summary ↔ Branded swap AND on accept (the
              net sheet recomputes to the accepted offer) so the change fades in
              — visible feedback for both the toggle and the Accept action. */}
          <div key={`${netView}::${netSheetOffer.id}`} className="motion-safe:animate-fade">
          {netView === "summary" ? (
            <>
              <p className="mt-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate">
                Estimated seller proceeds
              </p>
              <p className="mt-1 border-b-2 border-ink pb-2 font-display text-[2rem] font-normal leading-none text-ink tabular-nums">
                {usd(netProceeds)}
              </p>

              <dl className="mt-4 space-y-2.5">
                {netRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-[0.8rem] text-slate">
                      <Dot tone={row.tone === "danger" ? "danger" : "ink"} />
                      {row.label}
                    </dt>
                    <dd
                      className={cn(
                        "text-[0.84rem] font-semibold tabular-nums",
                        row.tone === "danger" ? "text-danger" : "text-ink",
                      )}
                    >
                      {row.value < 0 ? `(${usd(Math.abs(row.value))})` : usd(row.value)}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-mist pt-3">
                <span className="flex items-center gap-2 text-[0.8rem] font-semibold text-ink">
                  <Banknote className="h-4 w-4 text-success" aria-hidden />
                  Net to seller
                </span>
                <span className="font-display text-[1.05rem] font-normal text-success tabular-nums">
                  {usd(netProceeds)}
                </span>
              </div>

              <p className="mt-3 text-[0.7rem] leading-relaxed text-slate">
                Reconciles to {accepted ? "the accepted" : "the top"} offer ({usd(netSheetOffer.price)}).
                Figures are estimates pending title and payoff confirmation.
              </p>
            </>
          ) : (
            /* Printable Matin-branded net sheet via BrandedDocument (G-B) */
            <div className="mt-3">
              <BrandedDocument
                variant="netsheet"
                title="Estimated Seller Net Proceeds"
                recipient="Sarah Mitchell"
                agent={brandedAgent}
                salePrice={netSheetOffer.price}
                netSheetLines={brandedNetLines(netSheetOffer)}
                page={1}
                pages={1}
              />
            </div>
          )}
          </div>
        </div>

        {/* Share-link offer intake (realism must — §2.3) with a Matin-branded
            mini-preview of the public offer-submission page (S3 ticket 6). */}
        <div className="rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
          <h3 className="flex items-center gap-1.5 font-display text-[1.02rem] font-normal leading-tight text-ink">
            <Link2 className="h-4 w-4 text-slate" aria-hidden />
            Buyer-agent intake
          </h3>
          <p className="mt-1.5 text-[0.78rem] leading-relaxed text-slate">
            Share this link with cash buyers and agents. Submitted offers land in
            this grid for the seller to compare.
          </p>

          {/* Branded preview of the public page the link opens */}
          <div className="mt-3 overflow-hidden rounded-xl border border-mist">
            <div className="flex items-center justify-between gap-2 bg-ink px-3.5 py-2.5">
              <MatinMark theme="white" className="h-4" />
              <span className="font-mono text-[0.64rem] text-slate-300">Submit a cash offer</span>
            </div>
            <div className="space-y-2 bg-cloud px-3.5 py-3">
              <p className="text-[0.78rem] font-semibold text-ink">5127 SW Cedar Hills Blvd</p>
              <p className="text-[0.7rem] text-slate">Beaverton, OR · est. {usd(EST_VALUE)}</p>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {["Offer price", "Closing date", "Loan type", "Contingencies"].map((f) => (
                  <span
                    key={f}
                    className="rounded-md border border-dashed border-mist bg-paper-200/50 px-2 py-1 text-[0.64rem] text-slate"
                  >
                    {f}
                  </span>
                ))}
              </div>
              <p className="pt-1 text-[0.62rem] text-slate">
                Submissions land in this grid · Matin Real Estate · Equal Housing Opportunity
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-lg border border-mist bg-paper-200/60 px-3 py-2">
            <span className="min-w-0 flex-1 truncate font-mono text-[0.74rem] text-ink">
              {SHARE_LINK}
            </span>
            <button
              type="button"
              onClick={copyLink}
              className={cn(
                "inline-flex min-h-[40px] shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[0.72rem] font-semibold transition-colors",
                copied ? "text-success" : "text-slate hover:text-ink",
              )}
            >
              {copied ? (
                <>
                  <CircleCheck className="h-3.5 w-3.5" aria-hidden />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
