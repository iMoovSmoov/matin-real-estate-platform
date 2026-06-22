"use client";

import { BrandedDocument } from "@/components/os";
import { getAgent, roles } from "@/lib/data";
import type { Lead } from "@/lib/types";
import { matchedListingsFor, type MatchedListing } from "@/components/command/today/matchedListings";
import { budgetLabel } from "./leadView";

/* ──────────────────────────────────────────────────────────────────────────
   CRM — Branded AI draft (S2.5 / S2.6)

   "Approve" on a buyer AI draft produces a REAL Matin-branded artifact (not a
   raw clipboard copy): a Matin email shell (variant="email") with the agent's
   real signature and a body that cites REAL matched listings from listings.json
   (same community + budget band) — real addresses, prices, specs. Seller-intent
   leads get a CMA/home-value letter instead. The streamed AI text, when present,
   replaces the fallback body so even fallback copy is branded and grounded.
   ────────────────────────────────────────────────────────────────────────── */

const usd0 = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export function matchedHomesFor(lead: Lead): MatchedListing[] {
  return matchedListingsFor(lead.communitySlug, lead.budgetMin, lead.budgetMax, 3);
}

export function BrandedLeadDraft({
  lead,
  mode,
  draft,
}: {
  lead: Lead;
  mode: "buyer" | "seller";
  /** streamed/edited AI body — overrides the grounded fallback body when present */
  draft?: string;
}) {
  const agent = getAgent(lead.assignedAgent) ?? getAgent(roles.principalBroker);
  const agentProps = agent
    ? {
        name: agent.name,
        title: agent.title,
        license: agent.licenseRaw ?? agent.licenses?.[0],
        phone: agent.phone,
        email: agent.email,
        slug: agent.slug,
      }
    : undefined;

  if (mode === "seller") {
    return (
      <BrandedDocument
        variant="letter"
        formId="CMA · Home Value"
        title="Your Home Value Update"
        recipient={lead.name}
        agent={agentProps}
        fields={[
          { label: "Prepared for", value: lead.name },
          { label: "Community", value: lead.community },
          { label: "Source", value: lead.source },
          { label: "Lead score", value: `${lead.score} / 100` },
        ]}
        body={
          <p className="whitespace-pre-wrap">
            {draft ||
              `Hi ${lead.firstName}, thanks for your interest in what your ${lead.community} home could sell for in today's market. Based on recent ${lead.community} sales and current buyer demand, I've prepared a comparative market analysis tailored to your home. ${lead.community} continues to favor well-prepared sellers — inventory is tight and move-in-ready homes are drawing strong, competitive offers. I'd be glad to walk you through your estimated value range, the comps behind it, and a side-by-side cash-offer comparison so you can weigh every option. There's no obligation — just clear numbers to help you decide your next move.`}
          </p>
        }
        page={1}
        pages={1}
      />
    );
  }

  const matches = matchedHomesFor(lead);

  return (
    <BrandedDocument
      variant="email"
      title={`${matches.length} ${lead.community} homes for ${lead.firstName}`}
      emailSubject={`${matches.length} ${lead.community} homes in your budget`}
      fromName={`Matin Real Estate · ${agent?.name ?? "Buyer Team"}`}
      recipient={lead.email}
      mergeTokens={["{{first_name}}"]}
      agent={agentProps}
      body={
        <div className="space-y-3">
          <p>Hi {lead.firstName},</p>
          <p>
            {draft ||
              `Great connecting about your ${lead.community} home search. Based on what you've been viewing and your ${budgetLabel(lead)} budget, here are ${matches.length} active homes I think are worth a look:`}
          </p>
          {matches.length > 0 ? (
            <ul className="space-y-1.5">
              {matches.map((m) => (
                <li key={m.id} className="flex items-baseline justify-between gap-3 border-b border-mist pb-1.5">
                  <span className="min-w-0">
                    <span className="font-semibold text-ink">{m.address}</span>
                    <span className="text-slate">
                      {" "}
                      · {m.beds} bd / {m.baths} ba · {m.sqft.toLocaleString()} sqft · {m.city}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-ink">{usd0(m.price)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate">
              I&rsquo;ll pull a fresh set of {lead.community} matches the moment new inventory lands in
              your budget.
            </p>
          )}
          <p>
            Want me to set up private tours for any of these? Reply here or call me at{" "}
            {agent?.phone ?? "(503) 622-9624"} and I&rsquo;ll get them on the calendar.
          </p>
          <p>
            Warmly,
            <br />
            {agent?.name ?? "The Matin Buyer Team"}
            {agent?.title ? `, ${agent.title}` : ""}
          </p>
        </div>
      }
    />
  );
}
