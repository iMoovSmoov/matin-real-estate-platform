"use client";

import { cn } from "@/lib/utils";

type IntegrationStatus = "connected" | "pending" | "disconnected";

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
    status: "pending",
    description: "Social lead generation from Facebook & Instagram.",
    icon: "f",
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
    status: "disconnected",
    description: "Compliance and brokerage transaction management.",
    icon: "SK",
  },
  {
    id: "glide",
    name: "Glide",
    category: "Transaction Management",
    status: "disconnected",
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
    status: "disconnected",
    description: "Automated home value reports to your sphere.",
    icon: "H",
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
    status: "disconnected",
    description: "Agent performance scorecards and KPI tracking.",
    icon: "SI",
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
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[0.68rem] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Connected
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[0.68rem] font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-[0.68rem] font-semibold text-slate-500 ring-1 ring-inset ring-slate-300/60">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
      Disconnected
    </span>
  );
}

function IntegrationCard({ item }: { item: Integration }) {
  const isConnected = item.status === "connected";
  const isDisconnected = item.status === "disconnected";

  return (
    <div className="flex flex-col rounded-xl bg-white p-4 ring-1 ring-ink/[0.07] shadow-soft">
      {/* Top row: icon + name + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink text-sm font-bold text-white",
              !isConnected && "opacity-50",
            )}
          >
            {item.icon}
          </div>
          <span className="text-[0.88rem] font-semibold text-ink leading-tight">{item.name}</span>
        </div>
        <div className="shrink-0 pt-0.5">
          <StatusPill status={item.status} />
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 flex-1 text-[0.82rem] leading-relaxed text-slate/70">
        {item.description}
      </p>

      {/* Bottom row: lastSync + action */}
      <div className="mt-3 flex items-center justify-between border-t border-ink/[0.06] pt-3">
        {isConnected && item.lastSync ? (
          <span className="text-[0.74rem] text-slate/50">
            Synced {item.lastSync}
          </span>
        ) : (
          <span className="text-[0.74rem] text-slate/35">Not syncing</span>
        )}

        {isDisconnected ? (
          <button className="rounded-md bg-ink px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-ink/80">
            Connect
          </button>
        ) : isConnected ? (
          <button className="text-[0.74rem] font-semibold text-slate/60 hover:text-ink transition-colors">
            Manage
          </button>
        ) : (
          /* pending */
          <button className="text-[0.74rem] font-semibold text-amber-600 hover:text-amber-700 transition-colors">
            Finish setup
          </button>
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
