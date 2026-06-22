/* ──────────────────────────────────────────────────────────────────────────
   Matin AI — Business context (the "database" the AI is grounded in)

   Assembles the REAL Matin brokerage data — company facts, both offices,
   service areas, the full agent roster, and the live listing inventory — into
   a compact text block injected into the AI system prompt. This is what makes
   "Ask Matin" fully connected: it can answer "what's our office address",
   "which agents cover Lake Oswego", "show me listings under $600k", etc. from
   real data rather than guessing.

   Two sizes:
     • businessFacts() — short header (company + offices + stats + areas), for
       every tool so even a quick draft knows the real office/phone/brand.
     • businessContext() — facts + full agent roster + listing inventory, for
       the conversational/knowledge tools (ask-matin, concierge, general).
   ────────────────────────────────────────────────────────────────────────── */

import { agents, listings, communities, company } from "@/lib/data";

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

/** Short company/office/area header — cheap, included for every tool. */
export function businessFacts(): string {
  const c = company;
  const offices = (c.offices ?? []).map(
    (o) => `  - ${o.name}: ${o.address}, ${o.city}, ${o.state} ${o.zip} · ${o.phone} (${o.role})`,
  );
  const areas = (c.communitiesServed ?? []).join(", ");
  const counties = (c.counties ?? []).map((x) => `${x.name} (${x.state})`).join(", ");

  return [
    `MATIN REAL ESTATE — company facts (use these exact details; never invent contact info):`,
    `Founder/Principal Broker: ${c.founder}. Founded ${c.founded}. ${c.tagline}`,
    `Main phone: ${c.phone} · Email: ${c.email} · Hours: ${c.hours}`,
    `Offices:`,
    ...offices,
    `Licensed in Oregon and Washington. Awards: ${(c.awards ?? []).join("; ")}.`,
    `Brokerage scale: ${c.stats.annualVolume} annual volume · ${c.stats.propertiesSold} homes sold · ${c.stats.activeListings} active listings · ${c.stats.agents}+ brokers · ${c.stats.growth} YoY growth.`,
    `Counties served: ${counties}.`,
    `Communities served: ${areas}.`,
  ].join("\n");
}

/** One compact line per agent: name · title · areas · phone. */
function agentRoster(): string {
  const lines = agents.map((a) => {
    const areas = (a.communities ?? []).slice(0, 4).join(", ");
    const role = a.role || a.title || "Broker";
    const parts = [`${a.name} — ${role}`];
    if (areas) parts.push(`areas: ${areas}`);
    if (a.specialties?.length) parts.push(`focus: ${a.specialties.slice(0, 3).join(", ")}`);
    if (a.phone) parts.push(a.phone);
    return `  - ${parts.join(" · ")}`;
  });
  return `MATIN AGENT ROSTER (${agents.length} brokers — refer clients to the right one by area/specialty):\n${lines.join("\n")}`;
}

/** Compact listing inventory: a summary + one line per listing. */
function listingInventory(): string {
  const prices = listings.map((l) => l.price).filter((p) => typeof p === "number");
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const byCity = listings.reduce<Record<string, number>>((acc, l) => {
    acc[l.city] = (acc[l.city] ?? 0) + 1;
    return acc;
  }, {});
  const cityBreak = Object.entries(byCity)
    .sort((a, b) => b[1] - a[1])
    .map(([city, n]) => `${city} (${n})`)
    .join(", ");

  const rows = listings.map((l) => {
    const status = l.status ? ` · ${l.status}` : "";
    return `  - ${l.address}, ${l.city} ${l.state} · ${usd(l.price)} · ${l.beds}bd/${l.baths}ba · ${l.sqft} sqft · ${l.type}${status}`;
  });

  return [
    `MATIN LISTING INVENTORY (${listings.length} listings · ${usd(min)}–${usd(max)} · by city: ${cityBreak}):`,
    ...rows,
  ].join("\n");
}

/** Compact community guide (name · county · median price where known). */
function communityGuide(): string {
  const rows = communities.slice(0, 30).map((c) => {
    const county = (c as { county?: string }).county;
    const median = (c as { medianPrice?: number | string }).medianPrice;
    const bits = [c.name];
    if (county) bits.push(county);
    if (median) bits.push(typeof median === "number" ? usd(median) : String(median));
    return `  - ${bits.join(" · ")}`;
  });
  return `MATIN COMMUNITY GUIDE:\n${rows.join("\n")}`;
}

/** Full context — facts + roster + inventory + communities. For knowledge tools. */
export function businessContext(): string {
  return [
    businessFacts(),
    "",
    agentRoster(),
    "",
    listingInventory(),
    "",
    communityGuide(),
    "",
    `When asked about Matin's office, phone, agents, listings, communities, or stats, answer from the data above — it is the real, current brokerage database. If something isn't in the data, say so rather than inventing it.`,
  ].join("\n");
}

/** Tools that should get the FULL database (conversational / knowledge tools). */
export const FULL_CONTEXT_TOOLS = new Set(["ask-matin", "concierge", "general"]);
