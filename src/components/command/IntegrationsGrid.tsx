"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Wand2,
  Unplug,
  Zap,
  Plug,
  Clock,
} from "lucide-react";
import { streamAi } from "@/lib/ai/client";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { StatTile, Pill, LiveDot, SectionLabel } from "@/components/command/ui";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────────────────────────────────
   Data
───────────────────────────────────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────────────────────────────────
   Per-integration data-flow rows
───────────────────────────────────────────────────────────────────────── */

const DATA_FLOWS: Record<string, Array<{ type: string; dir: string }>> = {
  zillow: [
    { type: "Buyer Leads", dir: "→ Matin Hub" },
    { type: "Seller Leads", dir: "→ Matin Hub" },
    { type: "Lead Activity", dir: "↔ Zillow" },
  ],
  realtor: [
    { type: "Buyer Leads", dir: "→ Matin Hub" },
    { type: "Contact Info", dir: "→ Matin Hub" },
    { type: "Engagement Data", dir: "← Realtor.com" },
  ],
  "google-ads": [
    { type: "Lead Form Fills", dir: "→ Matin Hub" },
    { type: "Campaign Metrics", dir: "← Google Ads" },
    { type: "Conversion Events", dir: "↔ Google Ads" },
  ],
  fub: [
    { type: "Contacts", dir: "↔ Follow Up Boss" },
    { type: "Lead Activity", dir: "← Follow Up Boss" },
    { type: "Deal Stage Updates", dir: "↔ Follow Up Boss" },
  ],
  sierra: [
    { type: "Website Leads", dir: "→ Matin Hub" },
    { type: "IDX Searches", dir: "← Sierra" },
    { type: "Lead Routing Rules", dir: "↔ Sierra" },
  ],
  dotloop: [
    { type: "Transaction Files", dir: "↔ Dotloop" },
    { type: "E-Signatures", dir: "← Dotloop" },
    { type: "Deal Milestones", dir: "→ Matin Hub" },
  ],
  mailchimp: [
    { type: "Contact Lists", dir: "→ Mailchimp" },
    { type: "Campaign Results", dir: "← Mailchimp" },
    { type: "Email Events", dir: "← Mailchimp" },
  ],
  "google-analytics": [
    { type: "Page Views", dir: "← GA4" },
    { type: "Conversion Goals", dir: "↔ GA4" },
    { type: "Traffic Sources", dir: "← GA4" },
  ],
};

const DEFAULT_DATA_FLOW = [
  { type: "Contacts", dir: "→ Integration" },
  { type: "Lead Activity", dir: "← Integration" },
  { type: "Deal Updates", dir: "↔ Integration" },
];

/* ─────────────────────────────────────────────────────────────────────────
   StatusPill
───────────────────────────────────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────────────────────────────────
   IntegrationCard
───────────────────────────────────────────────────────────────────────── */

function IntegrationCard({
  item,
  onOpen,
  isActive,
  effectiveStatus,
}: {
  item: Integration;
  onOpen: (id: string) => void;
  isActive: boolean;
  effectiveStatus: IntegrationStatus;
}) {
  const isConnected = effectiveStatus === "connected";
  const isAvailable = effectiveStatus === "available";
  const isComingSoon = effectiveStatus === "coming-soon";

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl bg-white p-5 ring-1 ring-ink/[0.06] transition-all",
        !isComingSoon && "cursor-pointer hover:bg-paper hover:ring-ink/[0.10]",
        isComingSoon && "opacity-60",
        isActive && "ring-2 ring-ink/[0.30]",
      )}
      onClick={
        isComingSoon
          ? undefined
          : () => onOpen(item.id)
      }
    >
      {/* Top row: icon + status */}
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[0.85rem] font-bold text-white shadow-sm",
            isConnected ? "bg-ink" : isAvailable ? "bg-ink/70" : "bg-ink/30",
          )}
        >
          {item.icon}
        </div>
        <StatusPill status={effectiveStatus} />
      </div>

      {/* Name + Description */}
      <div className="mt-3 flex-1">
        <h3 className="text-[0.92rem] font-semibold leading-tight text-ink">{item.name}</h3>
        <p className="mt-1.5 text-[0.82rem] leading-relaxed text-slate/70">{item.description}</p>
      </div>

      {/* Bottom row */}
      <div className="mt-4 flex items-center justify-between border-t border-ink/[0.06] pt-3.5">
        {isConnected && item.lastSync ? (
          <span className="text-[0.72rem] text-slate/50">Synced {item.lastSync}</span>
        ) : isComingSoon ? (
          <span className="text-[0.72rem] text-slate/40">Not yet available</span>
        ) : (
          <span className="text-[0.72rem] text-slate/40">Not connected</span>
        )}

        {isAvailable && (
          <button
            className="rounded-lg bg-ink px-3.5 py-1.5 text-[0.78rem] font-semibold text-white transition-colors hover:bg-ink/80"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(item.id);
            }}
          >
            Connect
          </button>
        )}
        {isConnected && (
          <button
            className="text-[0.74rem] font-semibold text-slate/60 transition-colors hover:text-ink"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(item.id);
            }}
          >
            Manage
          </button>
        )}
        {isComingSoon && (
          <button
            disabled
            className="cursor-default rounded-lg bg-paper px-3 py-1.5 text-[0.74rem] font-medium text-slate/40 ring-1 ring-inset ring-ink/[0.05]"
          >
            Coming soon
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   IntegrationSlideOver
───────────────────────────────────────────────────────────────────────── */

function IntegrationSlideOver({
  item,
  onClose,
  onStatusChange,
  isMobile,
}: {
  item: Integration;
  onClose: () => void;
  onStatusChange: (id: string, status: IntegrationStatus) => void;
  isMobile: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"setup" | "guide">("setup");
  const [apiKey, setApiKey] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [connectSuccess, setConnectSuccess] = useState(false);
  const [disconnectPhase, setDisconnectPhase] = useState<"idle" | "confirm">("idle");
  const [disconnectInput, setDisconnectInput] = useState("");
  const [disconnecting, setDisconnecting] = useState(false);
  const [aiOutput, setAiOutput] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");

  /* auto-trigger AI guide when tab switches with a queued question */
  useEffect(() => {
    if (activeTab === "guide" && aiQuestion && aiOutput === "" && !aiBusy) {
      void triggerAiGuide(aiQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, aiQuestion]);

  const triggerAiGuide = async (customQuestion?: string) => {
    if (aiBusy) return;
    setAiBusy(true);
    const q =
      customQuestion ??
      aiQuestion ??
      `Provide a step-by-step setup guide for using ${item.name} in a real estate brokerage, including how to find API credentials, what data syncs, and recommended configuration.`;
    await streamAi(
      {
        tool: "integration_setup_guide",
        input: {
          integrationId: item.id,
          integrationName: item.name,
          category: item.category,
          question: q,
        },
      },
      (_chunk, full) => setAiOutput(full),
    );
    setAiBusy(false);
  };

  const handleConnect = async () => {
    setConnecting(true);
    setConnectError("");
    await new Promise((r) => setTimeout(r, 1500));
    if (apiKey.trim().length < 8) {
      setConnectError("Invalid API key — must be at least 8 characters.");
      setConnecting(false);
      return;
    }
    setConnectSuccess(true);
    onStatusChange(item.id, "connected");
    setConnecting(false);
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    await new Promise((r) => setTimeout(r, 1000));
    onStatusChange(item.id, "available");
    setDisconnectPhase("idle");
    setDisconnectInput("");
    setConnectSuccess(false);
    setApiKey("");
    setDisconnecting(false);
  };

  const dataFlows = DATA_FLOWS[item.id] ?? DEFAULT_DATA_FLOW;

  /* ── Setup Tab Body ─────────────────────────────────────────────────── */
  const renderSetupBody = () => {
    /* Success state */
    if (connectSuccess) {
      return (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <CheckCircle2 className="h-12 w-12 text-success" />
          <h3 className="text-xl font-semibold text-ink">Connected!</h3>
          <p className="max-w-[280px] text-[0.88rem] text-slate/70">
            {item.name} is now syncing data into your pipeline.
          </p>
          <button
            onClick={onClose}
            className="mt-2 rounded-xl bg-ink px-8 py-2.5 text-[0.9rem] font-semibold text-white hover:bg-ink/90"
          >
            Done
          </button>
        </div>
      );
    }

    /* Available — API key form */
    if (item.status === "available") {
      return (
        <div className="relative">
          {/* Disconnect confirm overlay — not applicable here, but wrapper needed */}
          <p className="mb-5 text-[0.88rem] leading-relaxed text-slate/70">{item.description}</p>

          <div>
            <label className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
              API Key / Access Token
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your access token or API key…"
              className="mb-1.5 w-full rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.85rem] text-ink placeholder:text-slate/40 transition-colors focus:border-ink/40 focus:outline-none"
            />
            <button
              className="text-[0.78rem] font-medium text-azure hover:underline"
              onClick={() => {
                const q = `How do I find my API key for ${item.name}?`;
                setAiQuestion(q);
                setActiveTab("guide");
              }}
            >
              How do I find my API key?
            </button>

            {connectError && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-danger/[0.07] px-3 py-2.5 text-[0.82rem] text-danger ring-1 ring-danger/20">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {connectError}
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={connecting || apiKey.trim().length < 8}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 text-[0.9rem] font-semibold text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting…
                </>
              ) : (
                "Connect"
              )}
            </button>
          </div>
        </div>
      );
    }

    /* Connected — sync health + data flow + disconnect */
    return (
      <div className="relative">
        {/* Disconnect confirmation overlay */}
        {disconnectPhase === "confirm" && (
          <div className="absolute inset-0 z-10 flex flex-col justify-start bg-white/95 pt-4 backdrop-blur-sm">
            <div className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-danger/25">
              <AlertTriangle className="mb-3 h-8 w-8 text-danger" />
              <h3 className="mb-1.5 text-[1rem] font-semibold text-ink">
                Disconnect {item.name}?
              </h3>
              <p className="mb-5 text-[0.82rem] text-slate/70">
                This stops all data sync immediately. Existing CRM data is not deleted.
              </p>
              <label className="mb-1.5 block text-[0.68rem] font-semibold uppercase tracking-wider text-slate/50">
                Type DISCONNECT to confirm
              </label>
              <input
                value={disconnectInput}
                onChange={(e) => setDisconnectInput(e.target.value)}
                className="mb-4 w-full rounded-lg border border-ink/[0.08] px-3 py-2 font-mono text-[0.85rem] text-ink focus:border-danger/40 focus:outline-none"
                placeholder="DISCONNECT"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDisconnectPhase("idle");
                    setDisconnectInput("");
                  }}
                  className="flex-1 rounded-xl border border-ink/[0.10] bg-white px-4 py-2.5 text-[0.85rem] text-ink"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnectInput !== "DISCONNECT" || disconnecting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger px-4 py-2.5 text-[0.85rem] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {disconnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Disconnecting…
                    </>
                  ) : (
                    "Disconnect"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sync health row */}
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-success/[0.07] px-4 py-3 ring-1 ring-success/20">
          <LiveDot tone="success" />
          <span className="flex-1 text-[0.88rem] font-semibold text-ink">Live sync active</span>
          <span className="text-[0.72rem] tabular-nums text-slate/50">
            Synced {item.lastSync ?? "recently"}
          </span>
        </div>

        {/* Data flow table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[0.82rem]">
            <thead>
              <tr>
                <th className="border-b border-ink/[0.06] pb-2 text-left text-[0.68rem] font-semibold uppercase tracking-wider text-slate/50">
                  Data Type
                </th>
                <th className="border-b border-ink/[0.06] pb-2 text-left text-[0.68rem] font-semibold uppercase tracking-wider text-slate/50">
                  Direction
                </th>
                <th className="border-b border-ink/[0.06] pb-2 text-left text-[0.68rem] font-semibold uppercase tracking-wider text-slate/50">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {dataFlows.map((row, i) => (
                <tr key={i}>
                  <td className="border-b border-ink/[0.04] py-2.5 text-ink/80">{row.type}</td>
                  <td className="border-b border-ink/[0.04] py-2.5 font-mono text-[0.78rem] text-slate/60">
                    {row.dir}
                  </td>
                  <td className="border-b border-ink/[0.04] py-2.5">
                    <Pill tone="success">Active</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Disconnect */}
        <div className="my-5 border-t border-ink/[0.06]" />
        <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-wider text-slate/40">
          Disconnect
        </p>
        <button
          onClick={() => setDisconnectPhase("confirm")}
          className="inline-flex items-center gap-2 rounded-xl border border-danger/25 px-4 py-2.5 text-[0.85rem] font-semibold text-danger transition-colors hover:border-danger/50 hover:bg-danger/[0.05]"
        >
          <Unplug className="h-4 w-4" />
          Disconnect integration
        </button>
      </div>
    );
  };

  /* ── AI Guide Tab Body ──────────────────────────────────────────────── */
  const renderGuideBody = () => {
    if (aiOutput === "" && !aiBusy) {
      return (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <Wand2 className="h-10 w-10 text-ink/25" />
          <p className="max-w-[260px] text-[0.85rem] text-slate/60">
            Generate a step-by-step setup guide for this integration.
          </p>
          <button
            onClick={() => triggerAiGuide()}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 text-[0.9rem] font-semibold text-white hover:bg-ink/90"
          >
            <Wand2 className="h-4 w-4" />
            Generate Setup Guide
          </button>
        </div>
      );
    }

    return (
      <div>
        {/* Loading button or regenerate */}
        {aiBusy ? (
          <button
            disabled
            className="mb-4 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-ink/70 px-6 py-3 text-[0.9rem] font-semibold text-white"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating guide…
          </button>
        ) : (
          <div className="mb-3 flex items-center gap-2">
            <LiveDot tone="azure" className="opacity-0" />
            <button
              onClick={() => {
                setAiOutput("");
                void triggerAiGuide();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-3 py-1.5 text-[0.78rem] font-medium text-slate hover:border-ink/[0.20] hover:text-ink"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </button>
          </div>
        )}

        {/* Output area */}
        {aiOutput !== "" && (
          <div className="rounded-xl bg-[#f4f4f3] p-5 text-[0.88rem] ring-1 ring-ink/[0.06]">
            <AiMarkdown text={aiOutput} />
            {aiBusy && (
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-ink align-middle" />
            )}
          </div>
        )}
      </div>
    );
  };

  /* ── Slide-over shell ───────────────────────────────────────────────── */
  const panelClass = isMobile
    ? "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border-t border-ink/[0.08] bg-white shadow-2xl"
    : "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-ink/[0.08] bg-white shadow-2xl sm:max-w-[480px]";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={panelClass}
        style={isMobile ? { maxHeight: "90dvh" } : undefined}
        aria-label={`${item.name} integration settings`}
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div className="mx-auto mb-1 mt-3 h-1 w-10 rounded-full bg-ink/[0.15]" />
        )}

        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-ink/[0.08] px-5 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-[0.85rem] font-bold text-white">
            {item.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[1rem] font-semibold text-ink">{item.name}</h2>
            <div className="mt-0.5 flex items-center gap-2">
              <StatusPill status={item.status} />
              <SectionLabel>{item.category}</SectionLabel>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-2 text-slate hover:bg-paper hover:text-ink"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex shrink-0 border-b border-ink/[0.08]">
          {(["setup", "guide"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-3 text-[0.85rem] transition-colors",
                activeTab === tab
                  ? "border-b-2 border-ink font-semibold text-ink"
                  : "text-slate hover:text-ink",
              )}
            >
              {tab === "setup" ? "Setup" : "AI Guide"}
              {tab === "guide" && aiBusy && (
                <LiveDot tone="azure" className="ml-1.5 inline-flex" />
              )}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {activeTab === "setup" ? renderSetupBody() : renderGuideBody()}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   IntegrationsGrid (main export)
───────────────────────────────────────────────────────────────────────── */

export function IntegrationsGrid() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, IntegrationStatus>>({});
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [isMobile, setIsMobile] = useState(false);

  /* Escape key closes slide-over */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Mobile detection */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const effectiveStatus = (id: string): IntegrationStatus =>
    statuses[id] ?? INTEGRATIONS.find((i) => i.id === id)?.status ?? "available";

  const selectedItem = useMemo(
    () => INTEGRATIONS.find((i) => i.id === activeId) ?? null,
    [activeId],
  );

  /* Derived counts (accounting for runtime status overrides) */
  const connectedCount = INTEGRATIONS.filter((i) => effectiveStatus(i.id) === "connected").length;
  const availableCount = INTEGRATIONS.filter((i) => effectiveStatus(i.id) === "available").length;
  const comingSoonCount = INTEGRATIONS.filter(
    (i) => effectiveStatus(i.id) === "coming-soon",
  ).length;

  /* Category grouping + filter */
  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: INTEGRATIONS.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  const filteredCategories =
    activeCategory === "All"
      ? byCategory
      : byCategory.filter((g) => g.category === activeCategory);

  return (
    <>
      {/* Stat tiles */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatTile
          label="Connected"
          value={connectedCount}
          icon={<Zap className="h-3.5 w-3.5" />}
        />
        <StatTile
          label="Available"
          value={availableCount}
          icon={<Plug className="h-3.5 w-3.5" />}
        />
        <StatTile
          label="Coming Soon"
          value={comingSoonCount}
          icon={<Clock className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Category filter pills */}
      <div className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {["All", ...CATEGORY_ORDER].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-[0.78rem] font-semibold transition-colors",
              activeCategory === cat
                ? "bg-ink text-white"
                : "bg-white text-slate ring-1 ring-ink/[0.08] hover:text-ink hover:ring-ink/[0.20]",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Category sections */}
      <div className="space-y-8">
        {filteredCategories.map(({ category, items }) => (
          <section key={category}>
            <SectionLabel className="mb-3">{category}</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <IntegrationCard
                  key={item.id}
                  item={item}
                  onOpen={setActiveId}
                  isActive={activeId === item.id}
                  effectiveStatus={effectiveStatus(item.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Slide-over / bottom sheet */}
      {activeId && selectedItem && (
        <IntegrationSlideOver
          item={{ ...selectedItem, status: effectiveStatus(selectedItem.id) }}
          onClose={() => setActiveId(null)}
          onStatusChange={(id, s) =>
            setStatuses((prev) => ({ ...prev, [id]: s }))
          }
          isMobile={isMobile}
        />
      )}
    </>
  );
}
