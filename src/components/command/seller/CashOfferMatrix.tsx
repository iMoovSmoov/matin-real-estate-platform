"use client";

import { useState } from "react";
import { Check, StickyNote, Sparkles, Star } from "lucide-react";
import { streamAi } from "@/lib/ai/client";
import { cn, usd } from "@/lib/utils";
import { StatusChip, CalloutCard, Dot } from "@/components/os";

/* ──────────────────────────────────────────────────────────────────────────
   Seller / Cash Offers — cash-offer comparison matrix + net sheet (§2.3)

   SkySlope frozen-column offer comparison: terms are ROWS (frozen left label
   column), competing offers are COLUMNS. Each offer column header is a big
   price + agent + an Accept (ink primary) + Add Notes button. The (i) verdict
   is upgraded to an AI verdict — streamAi('cash-offer-eval') renders into a
   dark CalloutCard (AI/system surfaces are dark — §1.8).

   The Net Sheet is a small summary card: hero proceeds $ + underline +
   label/value line items with legend dots. Real, dense, reconcilable numbers.
   ────────────────────────────────────────────────────────────────────────── */

type AttrKey =
  | "price"
  | "closing"
  | "loan"
  | "down"
  | "contingencies";

interface OfferColumn {
  id: string;
  buyer: string;
  agent: string;
  price: number;
  closing: string;
  loan: string;
  down: string;
  contingencies: string;
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
    buyer: "Cash Is King Home Buyers",
    agent: "Jordan Matin",
    price: 798000,
    closing: "Jul 8 · 14 days",
    loan: "All cash",
    down: "100%",
    contingencies: "None — as-is",
    weak: {},
    recommended: true,
  },
  {
    id: "OFF-02",
    buyer: "The Vance Household",
    agent: "Joshua Rose",
    price: 821000,
    closing: "Aug 22 · 59 days",
    loan: "Conventional 30yr",
    down: "20%",
    contingencies: "Inspection + appraisal + financing",
    weak: { closing: true, contingencies: true },
  },
  {
    id: "OFF-03",
    buyer: "R. & M. Okonkwo",
    agent: "Ava Brooks",
    price: 805000,
    closing: "Aug 1 · 38 days",
    loan: "FHA 30yr",
    down: "3.5%",
    contingencies: "Inspection + appraisal",
    weak: { down: true, loan: true },
  },
];

/* Net sheet — reconciles to the recommended offer (OFF-01, $798,000 cash). */
const NET_SHEET: { label: string; value: number; tone: "ink" | "danger" }[] = [
  { label: "Accepted offer price", value: 798000, tone: "ink" },
  { label: "Existing mortgage payoff", value: -214500, tone: "danger" },
  { label: "Agent commission (5%)", value: -39900, tone: "danger" },
  { label: "Title, escrow & recording", value: -6850, tone: "danger" },
  { label: "Property tax proration", value: -3120, tone: "danger" },
];

const NET_PROCEEDS = NET_SHEET.reduce((s, r) => s + r.value, 0);

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

export function CashOfferMatrix() {
  const [accepted, setAccepted] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<{ text: string; loading: boolean } | null>(null);

  async function runVerdict() {
    setVerdict({ text: "", loading: true });
    await streamAi(
      {
        tool: "cash-offer-eval",
        input: {
          property: "5127 SW Cedar Hills Blvd, Beaverton",
          seller: "Sarah Mitchell",
          estValue: 812000,
          offers: OFFERS.map((o) => ({
            buyer: o.buyer,
            price: o.price,
            closing: o.closing,
            loan: o.loan,
            down: o.down,
            contingencies: o.contingencies,
          })),
          netProceedsTopCashOffer: NET_PROCEEDS,
        },
      },
      (_chunk, full) => setVerdict((v) => (v ? { ...v, text: full } : v)),
    );
    setVerdict((v) => (v ? { ...v, loading: false } : v));
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.65fr_1fr]">
      {/* ── Comparison matrix ─────────────────────────────────────────────── */}
      <section className="min-w-0 rounded-2xl border border-mist bg-cloud shadow-soft">
        <div className="flex items-center justify-between gap-3 border-b border-mist px-5 py-3.5">
          <div className="min-w-0">
            <h3 className="font-display text-[1.05rem] font-normal leading-tight text-ink">
              Offer comparison
            </h3>
            <p className="mt-0.5 text-[0.76rem] text-slate">
              5127 SW Cedar Hills Blvd · Sarah Mitchell · 3 active offers
            </p>
          </div>
          <button
            type="button"
            onClick={runVerdict}
            disabled={verdict?.loading}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-gold-bright disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {verdict?.loading ? "Evaluating…" : "AI verdict"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                {/* Frozen attribute-label corner */}
                <th className="sticky left-0 z-10 w-40 bg-paper-200/70 px-4 py-3 align-bottom" />
                {OFFERS.map((o) => {
                  const isAccepted = accepted === o.id;
                  return (
                    <th
                      key={o.id}
                      className={cn(
                        "min-w-[13rem] border-l border-mist px-4 py-3 align-top",
                        o.recommended ? "bg-gold-soft/30" : "bg-cloud",
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-display text-[1.35rem] font-normal leading-none text-ink tabular-nums">
                          {usd(o.price)}
                        </span>
                        {o.recommended ? (
                          <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden />
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-[0.78rem] font-medium text-ink" title={o.buyer}>
                        {o.buyer}
                      </p>
                      <p className="text-[0.72rem] text-slate">{o.agent}</p>
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAccepted(isAccepted ? null : o.id)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[0.74rem] font-semibold transition-colors",
                            isAccepted
                              ? "bg-success text-cloud hover:bg-success/90"
                              : "bg-ink text-cloud hover:bg-ink-800",
                          )}
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden />
                          {isAccepted ? "Accepted" : "Accept"}
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-mist bg-cloud px-2.5 py-1.5 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
                        >
                          <StickyNote className="h-3.5 w-3.5" aria-hidden />
                          Notes
                        </button>
                      </div>
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
                    className="sticky left-0 z-10 w-40 bg-paper-200/70 px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-slate"
                  >
                    {attr.label}
                  </th>
                  {OFFERS.map((o) => {
                    const weak = !!o.weak[attr.key];
                    return (
                      <td
                        key={o.id}
                        className={cn(
                          "border-l border-mist px-4 py-3 align-top text-[0.82rem]",
                          o.recommended ? "bg-gold-soft/15" : "",
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
                          {weak ? <Dot tone="danger" /> : null}
                          {cellValue(o, attr.key)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI verdict — dark callout (AI surface) */}
        {verdict ? (
          <div className="px-5 pb-5 pt-1">
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
                {verdict.text || (verdict.loading ? "Matin AI is weighing the offers…" : "")}
              </p>
            </CalloutCard>
          </div>
        ) : null}
      </section>

      {/* ── Net sheet ─────────────────────────────────────────────────────── */}
      <aside className="min-w-0 rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-[1.05rem] font-normal leading-tight text-ink">
            Net sheet
          </h3>
          <StatusChip tone="gold" variant="soft">
            Top cash offer
          </StatusChip>
        </div>
        <p className="mt-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate">
          Estimated seller proceeds
        </p>
        <p className="mt-1 border-b-2 border-ink pb-2 font-display text-[2rem] font-normal leading-none text-ink tabular-nums">
          {usd(NET_PROCEEDS)}
        </p>

        <dl className="mt-4 space-y-2.5">
          {NET_SHEET.map((row) => (
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
            <Dot tone="success" />
            Net to seller
          </span>
          <span className="font-display text-[1.05rem] font-normal text-success tabular-nums">
            {usd(NET_PROCEEDS)}
          </span>
        </div>

        <p className="mt-3 text-[0.7rem] leading-relaxed text-slate">
          Reconciles to the accepted all-cash offer ({usd(798000)}). Figures are
          estimates pending title and payoff confirmation.
        </p>
      </aside>
    </div>
  );
}
