"use client";

import { useMemo, useState } from "react";
import {
  Megaphone,
  Layers,
  MailOpen,
  Reply,
  DollarSign,
  Sparkles,
} from "lucide-react";
import {
  campaigns,
  marketingAssets,
  reportMetrics,
} from "@/lib/data";
import type { Campaign } from "@/lib/types";
import { streamAi } from "@/lib/ai/client";
import { compactUsd, num } from "@/lib/utils";
import {
  KpiStrip,
  KpiCard,
  DataTable,
  type Column,
  StatusChip,
  type ChipTone,
  CalloutCard,
  AIActionCard,
  useAiSidecar,
} from "@/components/os";
import {
  TemplateLibrary,
  TEMPLATES,
} from "@/components/command/marketing/TemplateLibrary";
import {
  AssetPreview,
  type PreviewChannel,
} from "@/components/command/marketing/AssetPreview";
import {
  GenerationControls,
  type GenControlsState,
} from "@/components/command/marketing/GenerationControls";

/* ──────────────────────────────────────────────────────────────────────────
   Marketing Studio  → /hub/marketing   (ref §2.8 / wireframe 11)

   Brand-controlled templates turn one listing into email / web / print / social
   / ad / seller-update assets. Three panes:
     1. Template library (selected = dark-filled, "Most popular" on Listing launch)
     2. Asset previews — channel tabs over ONE preview canvas
     3. Generation controls — guardrailed brief → ink "Generate full campaign",
        wired to streamAi('marketing-kit') which streams copy into the preview.
   Below: a live campaigns table.

   The page title ("Marketing Studio") is rendered by TopCommandBar — we render
   only a subtitle + KPI strip here. Client (streaming + interactive panes).
   ────────────────────────────────────────────────────────────────────────── */

/* The canonical listing this studio is composing a kit for. */
const LISTING = {
  address: "1248 NW Cedar Hills Dr",
  city: "Beaverton, OR",
  beds: "4",
  baths: "3",
  sqft: "2,580",
  yearBuilt: "2016",
  price: "$845,000",
  features: "primary on main, quartz chef's kitchen, 3-car garage",
  highlights: "backs to greenspace, top-rated schools, walk to trails",
};

/* Per-channel seed copy pulled from the real Cedar Hills (CMP-001) assets so the
   canvas looks complete before any generate click. */
const CEDAR_ASSETS = marketingAssets.filter((a) => a.campaignId === "CMP-001");
function seedFor(channel: PreviewChannel): string {
  const map: Record<PreviewChannel, string> = {
    Email: CEDAR_ASSETS.find((a) => a.type === "Email")?.body ?? "",
    Social: CEDAR_ASSETS.find((a) => a.type === "Social")?.body ?? "",
    Flyer: CEDAR_ASSETS.find((a) => a.type === "Flyer")?.body ?? "",
    Ad:
      "Just listed in Beaverton — 4BR on Cedar Hills Dr, primary on main, backs to greenspace. Tour this week before it's gone. Tap to book.",
    "Web page": CEDAR_ASSETS.find((a) => a.type === "Web")?.body ?? "",
  };
  return map[channel];
}

/* Map the streamed marketing-kit markdown (## MLS / Instagram / Facebook / Email
   Blast / Open House) onto the five preview channels. */
function sectionFromKit(full: string, channel: PreviewChannel): string {
  const grab = (header: string) => {
    const re = new RegExp(`##\\s*${header}[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "i");
    const m = full.match(re);
    return m ? m[1].replace(/^\s*---\s*$/gm, "").trim() : "";
  };
  switch (channel) {
    case "Email":
      return grab("Email Blast");
    case "Social":
      return grab("Instagram Caption") || grab("Facebook Post");
    case "Flyer":
      return grab("Open House Invite");
    case "Ad":
      return grab("Facebook Post");
    case "Web page":
      return grab("MLS Description");
  }
}

const CAMPAIGN_STATUS: Record<Campaign["status"], { tone: ChipTone; label: string }> = {
  live: { tone: "success", label: "Live" },
  scheduled: { tone: "info", label: "Scheduled" },
  draft: { tone: "warn", label: "Draft" },
  paused: { tone: "ink", label: "Paused" },
};

export default function MarketingStudioPage() {
  const { openAi } = useAiSidecar();

  const [template, setTemplate] = useState("listing-launch");
  const [channel, setChannel] = useState<PreviewChannel>("Email");

  // Streamed kit text, parsed per channel; null = show seed copy.
  const [kit, setKit] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const [controls, setControls] = useState<GenControlsState>({
    audiences: ["Seller database", "Lake Oswego buyers"],
    tones: ["Luxury", "Direct", "Local"],
    channels: ["Email", "Instagram", "Facebook", "Google retargeting"],
  });

  const activeTemplate =
    TEMPLATES.find((t) => t.key === template) ?? TEMPLATES[0];

  /* ── KPI math — reconciles to the campaigns / assets / report data ── */
  const liveCount = campaigns.filter((c) => c.status === "live").length;
  const assetsGenerated = marketingAssets.length;
  const perf = reportMetrics.marketingPerformance;
  const avgOpen =
    perf.reduce((s, p) => s + p.openRate, 0) / (perf.length || 1);
  const avgReply =
    perf.reduce((s, p) => s + p.replyRate, 0) / (perf.length || 1);
  const attributed = campaigns.reduce((s, c) => s + c.attributedPipeline, 0);

  function toggle(group: keyof GenControlsState, value: string) {
    setControls((prev) => {
      const set = new Set(prev[group]);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...prev, [group]: Array.from(set) };
    });
  }

  async function handleGenerate() {
    setGenerating(true);
    setKit("");
    try {
      await streamAi(
        {
          tool: "marketing-kit",
          input: {
            ...LISTING,
            features: LISTING.features,
            highlights: LISTING.highlights,
            tone: controls.tones.join(", "),
            audience: controls.audiences.join(", "),
            channels: controls.channels.join(", "),
          },
        },
        (_chunk, full) => setKit(full),
      );
    } finally {
      setGenerating(false);
    }
  }

  // Body to show in the canvas for the active channel.
  const previewBody = useMemo(() => {
    if (kit !== null) {
      const parsed = sectionFromKit(kit, channel);
      return parsed || (generating ? "" : seedFor(channel));
    }
    return seedFor(channel);
  }, [kit, channel, generating]);

  const isGenerated = kit !== null && !generating;
  const previewStatus = generating
    ? { label: "Generating", tone: "warn" as const }
    : isGenerated
      ? { label: "AI draft", tone: "info" as const }
      : { label: "Approved kit", tone: "success" as const };

  /* ── Campaigns table ── */
  const columns: Column<Campaign>[] = [
    {
      key: "name",
      header: "Campaign",
      sortable: true,
      render: (c) => (
        <div className="min-w-0">
          <div className="truncate text-[0.86rem] font-semibold leading-tight text-ink">
            {c.name}
          </div>
          <div className="truncate text-[0.74rem] leading-tight text-slate">
            {c.audience}
          </div>
        </div>
      ),
    },
    {
      key: "channel",
      header: "Channel",
      render: (c) => <span className="text-[0.82rem] text-ink">{c.channel}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (c) => {
        const s = CAMPAIGN_STATUS[c.status];
        return (
          <StatusChip tone={s.tone} variant="soft">
            {s.label}
          </StatusChip>
        );
      },
    },
    {
      key: "sent",
      header: "Sent",
      align: "right",
      sortable: true,
      render: (c) => (
        <span className="tabular-nums text-ink">{c.sent ? num(c.sent) : "—"}</span>
      ),
    },
    {
      key: "openRate",
      header: "Open",
      align: "right",
      sortable: true,
      render: (c) => (
        <span className="tabular-nums text-ink">
          {c.openRate ? `${c.openRate.toFixed(1)}%` : "—"}
        </span>
      ),
    },
    {
      key: "replyRate",
      header: "Reply",
      align: "right",
      sortable: true,
      render: (c) => (
        <span className="tabular-nums text-ink">
          {c.replyRate ? `${c.replyRate.toFixed(1)}%` : "—"}
        </span>
      ),
    },
    {
      key: "attributedPipeline",
      header: "Attributed $",
      align: "right",
      sortable: true,
      render: (c) => (
        <span className="tabular-nums font-semibold text-success">
          {c.attributedPipeline ? compactUsd(c.attributedPipeline) : "—"}
        </span>
      ),
    },
  ];

  const studioContext = `Context: Marketing Studio / ${activeTemplate.label} · ${LISTING.address}`;

  return (
    <div className="flex flex-col gap-5 px-4 py-5 md:px-6 lg:py-6">
      {/* Subtitle (no page-level h1 — TopCommandBar owns the title) */}
      <p className="text-[0.82rem] leading-snug text-slate">
        Brand-controlled templates generate email, web, print, social, ad, and
        seller-update assets.
      </p>

      {/* KPI strip */}
      <KpiStrip>
        <KpiCard
          label="Campaigns live"
          value={liveCount}
          icon={<Megaphone className="h-3.5 w-3.5" />}
          delta={`${campaigns.length} total`}
          deltaTone="flat"
          hint="3 scheduled · 1 draft · 1 paused"
          onDrill={() => openAi(`${studioContext} — live campaigns`)}
        />
        <KpiCard
          label="Assets generated"
          value={assetsGenerated}
          icon={<Layers className="h-3.5 w-3.5" />}
          delta="+14 this month"
          deltaTone="up"
          hint="Across 8 active campaigns"
          onDrill={() => openAi(`${studioContext} — asset library`)}
        />
        <KpiCard
          label="Avg open rate"
          value={`${avgOpen.toFixed(1)}%`}
          icon={<MailOpen className="h-3.5 w-3.5" />}
          delta="+3.2 pts vs Q1"
          deltaTone="up"
          valueTone="success"
          hint="Email + social, sent campaigns"
          onDrill={() => openAi(`${studioContext} — open-rate drivers`)}
        />
        <KpiCard
          label="Avg reply rate"
          value={`${avgReply.toFixed(1)}%`}
          icon={<Reply className="h-3.5 w-3.5" />}
          delta="−0.4 pts vs Q1"
          deltaTone="down"
          hint="Two-way engagement"
          onDrill={() => openAi(`${studioContext} — reply-rate drivers`)}
        />
        <KpiCard
          label="Attributed pipeline"
          value={compactUsd(attributed)}
          icon={<DollarSign className="h-3.5 w-3.5" />}
          delta="4 sources tracked"
          deltaTone="flat"
          valueTone="success"
          hint="Closed-loop to CRM + reports"
          onDrill={() => openAi(`${studioContext} — attributed pipeline ROI`)}
        />
      </KpiStrip>

      {/* Three panes */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Pane 1 — template library */}
        <div className="xl:col-span-3">
          <TemplateLibrary active={template} onSelect={setTemplate} />
        </div>

        {/* Pane 2 — asset previews (channel tabs over one canvas) */}
        <div className="flex flex-col gap-5 xl:col-span-5">
          <AssetPreview
            headline="New Lake Oswego Listing"
            subhead={`${activeTemplate.label} · ${LISTING.address}, ${LISTING.city}`}
            channel={channel}
            onChannel={setChannel}
            body={previewBody}
            status={previewStatus}
            versionLabel={isGenerated ? "AI v1 · unsaved" : "v2 · approved"}
            streaming={generating}
            onSendTest={() =>
              openAi(`${studioContext} — send test ${channel} to my inbox`)
            }
            metaLine={`to ${controls.audiences[0] ?? "Seller database"} · ${LISTING.city}`}
          />

          {/* AI commentary on the kit — dark callout beside the light canvas */}
          <CalloutCard
            tone="ai"
            title="AI campaign producer"
            action={
              <button
                type="button"
                onClick={() => openAi(studioContext)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Open producer
              </button>
            }
          >
            Brand kit is locked to this output: Matin logo lockup, ink/paper palette,
            and the Oregon fair-housing disclosure are applied to every channel. I drafted{" "}
            {CEDAR_ASSETS.length} assets for {LISTING.address} — all sit as drafts until
            the broker and listing agent approve.
          </CalloutCard>
        </div>

        {/* Pane 3 — generation controls + proposed AI action */}
        <div className="flex flex-col gap-5 xl:col-span-4">
          <GenerationControls
            state={controls}
            onToggle={toggle}
            generating={generating}
            onGenerate={handleGenerate}
          />

          {/* A pre-seeded proposed AI action (evidence-backed, approval-gated) */}
          <div className="rounded-2xl border border-ink-700 bg-ink-900 p-4 shadow-soft">
            <p className="mb-3 px-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-slate-300/60">
              Proposed action
            </p>
            <AIActionCard
              title="A/B test the Cash Offer subject line"
              riskTag="Approval required"
              evidence="Cash Offer Funnel opens 31.2% vs 38.4% on Spring Seller — 7 pts behind the email benchmark. Reply rate 3.1% suggests a weak subject, not weak audience."
              confidence="Medium"
              runLabel="Draft variants"
              onRun={() => openAi(`${studioContext} — draft subject-line A/B variants`)}
              onEdit={() => openAi(`${studioContext} — edit the A/B test brief`)}
            />
          </div>
        </div>
      </div>

      {/* Campaigns table */}
      <div className="rounded-2xl border border-mist bg-cloud p-4 shadow-soft md:p-5">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div>
            <h2 className="font-display text-[1.02rem] font-normal leading-tight text-ink">
              Campaigns
            </h2>
            <p className="mt-0.5 text-[0.74rem] text-slate">
              Performance syncs opens, clicks, and leads back to CRM and Reports.
            </p>
          </div>
        </div>
        <DataTable<Campaign>
          columns={columns}
          rows={campaigns}
          getRowId={(c) => c.id}
          selectable
          onRowClick={(c) => openAi(`Context: Marketing Studio / Campaign · ${c.name}`)}
        />
      </div>
    </div>
  );
}
