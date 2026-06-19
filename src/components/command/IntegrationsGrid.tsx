"use client";

import { cn } from "@/lib/utils";

type IntegrationStatus = "connected" | "available" | "coming-soon";

interface Integration {
  id: string;
  name: string;
  category: string;
  status: IntegrationStatus;
  description: string;
  lastSync?: string;
  icon: string;
}

const INTEGRATIONS: Integration[] = [
  // Lead Sources
  {
    id: "zillow",
    name: "Zillow Premier Agent",
    category: "Lead Sources",
    status: "connected",
    description: "Buyer and seller leads from Zillow's network.",
    lastSync: "12 min ago",
    icon: "Z",
  },
  {
    id: "realtor",
    name: "Realtor.com Connections",
    category: "Lead Sources",
    status: "connected",
    description: "High-intent buyer leads via Realtor.com.",
    lastSync: "1h ago",
    icon: "R",
  },
  {
    id: "google-ads",
    name: "Google Ads",
    category: "Lead Sources",
    status: "connected",
    description: "PPC lead campaigns, tracked to close.",
    lastSync: "3h ago",
    icon: "G",
  },
  {
    id: "facebook",
    name: "Facebook Lead Ads",
    category: "Lead Sources",
    status: "available",
    description: "Social lead generation from Facebook & Instagram.",
    icon: "f",
  },
  {
    id: "homes",
    name: "Homes.com",
    category: "Lead Sources",
    status: "coming-soon",
    description: "Buyer intent signals from the Homes.com marketplace.",
    icon: "Ho",
  },
  // CRM & Website
  {
    id: "fub",
    name: "Follow Up Boss",
    category: "CRM & Website",
    status: "connected",
    description: "Two-way sync with your FUB lead pipeline.",
    lastSync: "5 min ago",
    icon: "F",
  },
  {
    id: "sierra",
    name: "Sierra Interactive",
    category: "CRM & Website",
    status: "connected",
    description: "Website IDX and lead routing integration.",
    lastSync: "30 min ago",
    icon: "S",
  },
  {
    id: "lofty",
    name: "Lofty CRM",
    category: "CRM & Website",
    status: "available",
    description: "AI-powered CRM with automated follow-up sequences.",
    icon: "L",
  },
  // Transaction Management
  {
    id: "dotloop",
    name: "Dotloop",
    category: "Transaction Management",
    status: "connected",
    description: "E-signature and transaction file management.",
    lastSync: "8h ago",
    icon: "D",
  },
  {
    id: "skyslope",
    name: "SkySlope",
    category: "Transaction Management",
    status: "available",
    description: "Compliance and brokerage transaction management.",
    icon: "SK",
  },
  {
    id: "glide",
    name: "Glide",
    category: "Transaction Management",
    status: "coming-soon",
    description: "Seller disclosures and disclosure management.",
    icon: "GL",
  },
  // Marketing
  {
    id: "mailchimp",
    name: "Mailchimp",
    category: "Marketing",
    status: "connected",
    description: "Email marketing and drip campaigns.",
    lastSync: "1 day ago",
    icon: "M",
  },
  {
    id: "homebot",
    name: "Homebot",
    category: "Marketing",
    status: "available",
    description: "Automated home value reports to your sphere.",
    icon: "H",
  },
  {
    id: "canva",
    name: "Canva for Real Estate",
    category: "Marketing",
    status: "coming-soon",
    description: "AI-generated listing graphics and social templates.",
    icon: "Ca",
  },
  // Analytics
  {
    id: "google-analytics",
    name: "Google Analytics",
    category: "Analytics",
    status: "connected",
    description: "Website traffic, source attribution, and conversions.",
    lastSync: "2h ago",
    icon: "GA",
  },
  {
    id: "sisu",
    name: "Sisu",
    category: "Analytics",
    status: "available",
    description: "Agent performance scorecards and KPI tracking.",
    icon: "SI",
  },
  {
    id: "looker",
    name: "Looker Studio",
    category: "Analytics",
    status: "coming-soon",
    description: "Custom brokerage dashboards powered by your data.",
    icon: "LS",
  },
];

const CATEGORY_ORDER = [
  "Lead Sources",
  "CRM & Website",
  "Transaction Management",
  "Marketing",
  "Analytics",
];

function StatusPill({ status }: { status: IntegrationStatus }) {
  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-[0.68rem] font-semibold text-success ring-1 ring-inset ring-success/25">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        Connected
      </span>
    );
  }
  if (status === "available") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-ink/[0.06] px-2.5 py-0.5 text-[0.68rem] font-semibold text-ink ring-1 ring-inset ring-ink/[0.08]">
        <span className="h-1.5 w-1.5 rounded-full bg-slate" />
        Available
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2.5 py-0.5 text-[0.68rem] font-semibold text-slate ring-1 ring-inset ring-ink/[0.06]">
      Coming soon
    </span>
  );
}

function IntegrationCard({ item }: { item: Integration }) {
  const isConnected = item.status === "connected";
  const isAvailable = item.status === "available";
  const isComingSoon = item.status === "coming-soon";

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl bg-white p-5 ring-1 ring-ink/[0.06] transition-colors",
        !isComingSoon && "hover:bg-paper hover:ring-ink/[0.10]",
        isComingSoon && "opacity-70",
      )}
    >
      {/* Top row: icon + status */}
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-white text-[0.85rem] shadow-sm",
            isConnected ? "bg-ink" : isAvailable ? "bg-ink/70" : "bg-ink/30",
          )}
        >
          {item.icon}
        </div>
        <StatusPill status={item.status} />
      </div>

      {/* Name + Description */}
      <div className="mt-3 flex-1">
        <h3 className="text-[0.92rem] font-semibold leading-tight text-ink">{item.name}</h3>
        <p className="mt-1.5 text-[0.82rem] leading-relaxed text-slate/70">
          {item.description}
        </p>
      </div>

      {/* Bottom row: lastSync + action */}
      <div className="mt-4 flex items-center justify-between border-t border-ink/[0.06] pt-3.5">
        {isConnected && item.lastSync ? (
          <span className="text-[0.72rem] text-slate/50">
            Synced {item.lastSync}
          </span>
        ) : isComingSoon ? (
          <span className="text-[0.72rem] text-slate/40">Not yet available</span>
        ) : (
          <span className="text-[0.72rem] text-slate/40">Not connected</span>
        )}

        {isAvailable && (
          <button className="rounded-lg bg-azure px-3.5 py-1.5 text-[0.78rem] font-semibold text-white transition-colors hover:bg-azure/80">
            Connect
          </button>
        )}
        {isConnected && (
          <button className="text-[0.74rem] font-semibold text-slate/60 transition-colors hover:text-ink">
            Manage
          </button>
        )}
        {isComingSoon && (
          <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-[0.74rem] font-medium text-slate/40 ring-1 ring-inset ring-ink/[0.05]">
            Coming soon
          </span>
        )}
      </div>
    </div>
  );
}

export function IntegrationsGrid() {
  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: INTEGRATIONS.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-8">
      {byCategory.map(({ category, items }) => (
        <section key={category}>
          <h2 className="mb-3 text-[0.72rem] font-semibold uppercase tracking-widest text-slate/50">
            {category}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <IntegrationCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
