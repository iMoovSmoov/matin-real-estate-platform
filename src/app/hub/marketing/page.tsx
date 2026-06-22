"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  Megaphone,
  Layers,
  MailOpen,
  Reply,
  Banknote,
  Plus,
} from "lucide-react";
import { campaigns as seedCampaigns } from "@/lib/data";
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
  Avatar,
  AiPanel,
  type AIAction,
  RecordDrawer,
  useAiSidecar,
} from "@/components/os";
import { TemplateLibrary } from "@/components/command/marketing/TemplateLibrary";
import { AssetPreview } from "@/components/command/marketing/AssetPreview";
import {
  GenerationControls,
  type GenControlsState,
  type Approver,
} from "@/components/command/marketing/GenerationControls";
import { CampaignDrawer } from "@/components/command/marketing/CampaignDrawer";
import {
  CreateCampaignForm,
  type NewCampaignDraft,
} from "@/components/command/marketing/CreateCampaignForm";
import {
  templateByKey,
  campaignOwner,
  seedFor,
  sectionFromKit,
  studioKpis,
  STUDIO_LISTING,
  type PreviewChannel,
  type TemplateKey,
} from "@/components/command/marketing/marketing-data";

/* ──────────────────────────────────────────────────────────────────────────
   Marketing Studio  → /hub/marketing   (ref §2.8 / wireframe 11)

   Three working panes over the real data layer:
     1. Template library — selecting a row LOADS it into the preview (state).
     2. Asset previews — channel tabs switch ONE canvas; AI streams INTO it.
     3. Generation controls — guardrailed brief → ink "Generate full campaign"
        → streamAi('marketing-kit') streams every channel live into the canvas.
   Plus a dark AI producer panel (proposed actions stream inline) and a live
   campaigns table with saved-view filters, a record drawer on row-click, and a
   "+ New campaign" form drawer that appends to local state.

   The global AI sidecar opens ONLY from explicit "Ask Matin" affordances.
   TopCommandBar owns the page title — we render a subtitle + KPI strip only.
   ────────────────────────────────────────────────────────────────────────── */

/** Local mirror of AiPanel's per-action stream state (structurally compatible
 *  with the panel's `actionState` prop; the type isn't re-exported from the os
 *  barrel so we declare it here). */
type ActionStreamState = { running?: boolean; result?: ReactNode };

const CAMPAIGN_STATUS: Record<Campaign["status"], { tone: ChipTone; label: string }> = {
  live: { tone: "success", label: "Live" },
  scheduled: { tone: "info", label: "Scheduled" },
  draft: { tone: "warn", label: "Draft" },
  paused: { tone: "ink", label: "Paused" },
};

const studioContextFor = (templateLabel: string) =>
  `Marketing Studio / ${templateLabel} · ${STUDIO_LISTING.address}`;

export default function MarketingStudioPage() {
  const { openAi } = useAiSidecar();

  /* ── Pane state ── */
  const [template, setTemplate] = useState<TemplateKey>("listing-launch");
  const [channel, setChannel] = useState<PreviewChannel>("Email");

  // Streamed kit text, parsed per channel; null = show seed copy for the template.
  const [kit, setKit] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const [sentState, setSentState] = useState<"idle" | "sending" | "sent">("idle");

  const [controls, setControls] = useState<GenControlsState>({
    audiences: ["Seller database", "Lake Oswego buyers"],
    tones: ["Luxury", "Direct", "Local"],
    channels: ["Email", "Instagram", "Facebook", "Google retargeting"],
  });

  const [approvers, setApprovers] = useState<Approver[]>([
    { slug: "jordan-matin", name: "Jordan Matin", role: "Broker", approved: false },
    { slug: "chase-bright", name: "Chase Bright", role: "Listing agent", approved: false },
  ]);

  /* ── Campaigns (mutable local copy so + New / pause shows immediately) ── */
  const [campaignRows, setCampaignRows] = useState<Campaign[]>(seedCampaigns);
  const [view, setView] = useState("all");
  const [openCampaign, setOpenCampaign] = useState<Campaign | null>(null);

  /* ── Create-campaign form drawer ── */
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<NewCampaignDraft>({
    name: "",
    templateKey: "listing-launch",
    audience: "",
    channels: ["Email", "Social"],
  });

  /* ── AI producer panel action streaming ── */
  const [actionState, setActionState] = useState<Record<string, ActionStreamState>>({});

  const activeTemplate = templateByKey(template);
  const studioContext = studioContextFor(activeTemplate.label);

  const kpi = useMemo(() => studioKpis(campaignRows), [campaignRows]);

  /* ── Template select: load it, reset any generated kit + send state ── */
  const selectTemplate = useCallback((key: TemplateKey) => {
    setTemplate(key);
    setKit(null);
    setSentState("idle");
    // Snap the channel to one this template actually carries.
    const t = templateByKey(key);
    setChannel((prev) => (t.channels.includes(prev) ? prev : t.channels[0]));
  }, []);

  function selectChannel(c: PreviewChannel) {
    setChannel(c);
    setSentState("idle");
  }

  function toggle(group: keyof GenControlsState, value: string) {
    setControls((prev) => {
      const set = new Set(prev[group]);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...prev, [group]: Array.from(set) };
    });
  }

  function toggleApprover(slug: string) {
    setApprovers((prev) =>
      prev.map((a) => (a.slug === slug ? { ...a, approved: !a.approved } : a)),
    );
  }

  /* ── Generate full campaign → stream marketing-kit live into the canvas ── */
  async function handleGenerate() {
    setGenerating(true);
    setKit("");
    setSentState("idle");
    try {
      await streamAi(
        {
          tool: "marketing-kit",
          input: {
            ...STUDIO_LISTING,
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

  /* ── Send test → real inline send simulation with confirmation ── */
  async function handleSendTest() {
    setSentState("sending");
    // Simulate the round-trip the same way a real test send would feel.
    await new Promise((r) => setTimeout(r, 850));
    setSentState("sent");
    setTimeout(() => setSentState("idle"), 4000);
  }

  /* ── Body to show in the canvas for the active channel ── */
  const previewBody = useMemo(() => {
    if (kit !== null) {
      const parsed = sectionFromKit(kit, channel);
      return parsed || (generating ? "" : seedFor(template, channel));
    }
    return seedFor(template, channel);
  }, [kit, channel, generating, template]);

  const isGenerated = kit !== null && !generating;
  const previewStatus = generating
    ? { label: "Generating", tone: "warn" as const }
    : isGenerated
      ? { label: "AI draft", tone: "info" as const }
      : { label: "Approved kit", tone: "success" as const };

  /* ── AI producer proposed actions (stream INLINE into the cards) ── */
  const producerActions: AIAction[] = useMemo(
    () => [
      {
        id: "shorten-subject",
        title: `Tighten the ${channel} subject line`,
        riskTag: "Ready",
        evidence: `Current ${channel} draft for ${STUDIO_LISTING.address}. Shorter subjects lift opens — the Cash Offer Funnel sits 7 pts under the email benchmark on a long subject.`,
        confidence: "High",
      },
      {
        id: "ab-variants",
        title: "Draft A/B subject variants",
        riskTag: "Approval required",
        evidence:
          "Cash Offer Funnel opens 31.2% vs 38.4% on Spring Seller — a weak subject, not a weak audience. Two variants let us test before the full send.",
        confidence: "Medium",
      },
    ],
    [channel],
  );

  const runProducerAction = useCallback(
    async (action: AIAction) => {
      const id = action.id ?? action.title;
      setActionState((prev) => ({ ...prev, [id]: { running: true, result: "" } }));
      const tool = id === "ab-variants" ? "marketing-kit" : "lead-responder";
      try {
        await streamAi(
          {
            tool,
            input: {
              ...STUDIO_LISTING,
              task:
                id === "ab-variants"
                  ? `Write two A/B subject-line variants for the ${channel} asset.`
                  : `Tighten the ${channel} subject line for this listing to under 9 words.`,
              channel,
              tone: controls.tones.join(", "),
            },
          },
          (_chunk, full) =>
            setActionState((prev) => ({
              ...prev,
              [id]: { running: true, result: full },
            })),
        );
      } finally {
        setActionState((prev) => ({
          ...prev,
          [id]: { running: false, result: prev[id]?.result ?? "" },
        }));
      }
    },
    [channel, controls.tones],
  );

  function rejectProducerAction(action: AIAction) {
    const id = action.id ?? action.title;
    setActionState((prev) => ({
      ...prev,
      [id]: { running: false, result: "Dismissed — draft discarded." },
    }));
  }

  /* ── Campaigns: saved-view filtering + mutations ── */
  const filteredCampaigns = useMemo(() => {
    switch (view) {
      case "live":
        return campaignRows.filter((c) => c.status === "live");
      case "scheduled":
        return campaignRows.filter((c) => c.status === "scheduled");
      case "draft":
        return campaignRows.filter((c) => c.status === "draft");
      case "paused":
        return campaignRows.filter((c) => c.status === "paused");
      default:
        return campaignRows;
    }
  }, [campaignRows, view]);

  const savedViews = useMemo(
    () => [
      { key: "all", label: "All", count: campaignRows.length },
      { key: "live", label: "Live", count: campaignRows.filter((c) => c.status === "live").length },
      { key: "scheduled", label: "Scheduled", count: campaignRows.filter((c) => c.status === "scheduled").length },
      { key: "draft", label: "Draft", count: campaignRows.filter((c) => c.status === "draft").length },
      { key: "paused", label: "Paused", count: campaignRows.filter((c) => c.status === "paused").length },
    ],
    [campaignRows],
  );

  function toggleCampaignStatus(id: string) {
    setCampaignRows((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "live" ? "paused" : "live" }
          : c,
      ),
    );
    setOpenCampaign((prev) =>
      prev && prev.id === id
        ? { ...prev, status: prev.status === "live" ? "paused" : "live" }
        : prev,
    );
  }

  function submitCreate() {
    const name = draft.name.trim() || `${templateByKey(draft.templateKey).label} campaign`;
    const id = `CMP-${String(campaignRows.length + 1).padStart(3, "0")}`;
    const t = templateByKey(draft.templateKey);
    const newCampaign: Campaign = {
      id,
      name,
      channel: draft.channels.join(" + ") || "Multi-channel",
      status: "draft",
      audience: draft.audience.trim() || t.blurb,
      sent: 0,
      openRate: 0,
      replyRate: 0,
      attributedPipeline: 0,
    };
    setCampaignRows((prev) => [newCampaign, ...prev]);
    setCreateOpen(false);
    setView("draft");
    setDraft({ name: "", templateKey: "listing-launch", audience: "", channels: ["Email", "Social"] });
    setOpenCampaign(newCampaign);
  }

  /* ── Drill: KPI tiles drive the table (real behavior, never the AI panel) ── */
  function drillToView(v: string) {
    setView(v);
    if (typeof document !== "undefined") {
      document.getElementById("campaigns-table")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
  function drillToTopAttributed() {
    const top = [...campaignRows]
      .filter((c) => c.attributedPipeline > 0)
      .sort((a, b) => b.attributedPipeline - a.attributedPipeline)[0];
    if (top) setOpenCampaign(top);
  }

  /* ── Campaigns table columns ── */
  const columns: Column<Campaign>[] = [
    {
      key: "name",
      header: "Campaign",
      sortable: true,
      render: (c) => {
        const owner = campaignOwner(c.id);
        return (
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar name={owner.name} slug={owner.slug} size={30} ring />
            <div className="min-w-0">
              <div className="truncate text-[0.86rem] font-semibold leading-tight text-ink">
                {c.name}
              </div>
              <div className="truncate text-[0.74rem] leading-tight text-slate">
                {c.audience}
              </div>
            </div>
          </div>
        );
      },
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

  return (
    <div className="flex flex-col gap-5 px-4 py-5 md:px-6 lg:py-6">
      {/* Subtitle (no page-level h1 — TopCommandBar owns the title) */}
      <p className="text-[0.82rem] leading-snug text-slate">
        Brand-controlled templates generate email, web, print, social, ad, and
        seller-update assets.
      </p>

      {/* KPI strip — every tile drills into the campaigns table or a record */}
      <KpiStrip>
        <KpiCard
          label="Campaigns live"
          value={kpi.liveCount}
          icon={<Megaphone className="h-3.5 w-3.5" />}
          delta={`${campaignRows.length} total`}
          deltaTone="flat"
          hint={`${kpi.scheduled} scheduled · ${kpi.draft} draft · ${kpi.paused} paused`}
          onDrill={() => drillToView("live")}
        />
        <KpiCard
          label="Assets generated"
          value={kpi.assetsGenerated}
          icon={<Layers className="h-3.5 w-3.5" />}
          delta="+14 this month"
          deltaTone="up"
          hint="Across all active campaigns"
          onDrill={() => drillToView("all")}
        />
        <KpiCard
          label="Avg open rate"
          value={`${kpi.avgOpen.toFixed(1)}%`}
          icon={<MailOpen className="h-3.5 w-3.5" />}
          delta="+3.2 pts vs Q1"
          deltaTone="up"
          valueTone="success"
          hint="Sent campaigns only"
          onDrill={() => drillToView("live")}
        />
        <KpiCard
          label="Avg reply rate"
          value={`${kpi.avgReply.toFixed(1)}%`}
          icon={<Reply className="h-3.5 w-3.5" />}
          delta="−0.4 pts vs Q1"
          deltaTone="down"
          hint="Two-way engagement"
          onDrill={() => drillToView("live")}
        />
        <KpiCard
          label="Attributed pipeline"
          value={compactUsd(kpi.attributed)}
          icon={<Banknote className="h-3.5 w-3.5" />}
          delta="4 sources tracked"
          deltaTone="flat"
          valueTone="success"
          hint="Closed-loop to CRM + reports"
          onDrill={drillToTopAttributed}
        />
        <KpiCard
          label="New campaign"
          value={<Plus className="h-6 w-6" aria-hidden />}
          hint="Start from an approved template"
          onDrill={() => setCreateOpen(true)}
        />
      </KpiStrip>

      {/* Three panes */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Pane 1 — template library */}
        <div className="xl:col-span-3">
          <TemplateLibrary active={template} onSelect={selectTemplate} />
        </div>

        {/* Pane 2 — asset previews (channel tabs over one canvas) */}
        <div className="flex flex-col gap-5 xl:col-span-5">
          <AssetPreview
            headline={activeTemplate.headline}
            subhead={`${activeTemplate.label} · ${STUDIO_LISTING.address}, ${STUDIO_LISTING.city}`}
            channel={channel}
            onChannel={selectChannel}
            body={previewBody}
            status={previewStatus}
            versionLabel={isGenerated ? "AI v1 · unsaved" : "v2 · approved"}
            streaming={generating}
            onSendTest={handleSendTest}
            onGenerate={handleGenerate}
            sentState={sentState}
            metaLine={`to ${controls.audiences[0] ?? "Seller database"} · ${STUDIO_LISTING.city}`}
          />

          {/* AI producer — dark panel; proposed actions stream INLINE.
              "Ask Matin" is the one sanctioned path to the global sidecar. */}
          <AiPanel
            context={studioContext}
            actions={producerActions}
            actionState={actionState}
            onRunAction={runProducerAction}
            onRejectAction={rejectProducerAction}
          >
            <div className="flex items-start justify-between gap-3 rounded-xl bg-ink-800 px-3.5 py-3 ring-1 ring-inset ring-ink-700">
              <p className="text-[0.82rem] leading-relaxed text-slate-300">
                Brand kit is locked: Matin logo lockup, ink/paper palette, and the
                Oregon fair-housing disclosure apply to every channel. Drafts stay
                drafts until the broker and listing agent approve.
              </p>
              <button
                type="button"
                onClick={() => openAi(`Context: ${studioContext}`)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
              >
                Ask Matin
              </button>
            </div>
          </AiPanel>
        </div>

        {/* Pane 3 — generation controls */}
        <div className="flex flex-col gap-5 xl:col-span-4">
          <GenerationControls
            state={controls}
            onToggle={toggle}
            approvers={approvers}
            onToggleApprover={toggleApprover}
            generating={generating}
            onGenerate={handleGenerate}
          />
        </div>
      </div>

      {/* Campaigns table */}
      <div
        id="campaigns-table"
        className="rounded-2xl border border-mist bg-cloud p-4 shadow-soft md:p-5"
      >
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div>
            <h2 className="font-display text-[1.02rem] font-normal leading-tight text-ink">
              Campaigns
            </h2>
            <p className="mt-0.5 text-[0.74rem] text-slate">
              Performance syncs opens, clicks, and leads back to CRM and Reports.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-[0.8rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New campaign
          </button>
        </div>
        <DataTable<Campaign>
          columns={columns}
          rows={filteredCampaigns}
          getRowId={(c) => c.id}
          selectable
          savedViews={{ views: savedViews, active: view, onChange: setView }}
          onRowClick={(c) => setOpenCampaign(c)}
          emptyState={
            <div className="py-6 text-center">
              <p className="text-[0.86rem] font-medium text-ink">
                No {view === "all" ? "" : view} campaigns
              </p>
              <p className="mt-1 text-[0.78rem] text-slate">
                Start one from an approved template — it lands here as a draft.
              </p>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-[0.78rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                New campaign
              </button>
            </div>
          }
        />
      </div>

      {/* Record drawer — opens on row click (never the AI panel) */}
      <CampaignDrawer
        campaign={openCampaign}
        onClose={() => setOpenCampaign(null)}
        onToggleStatus={toggleCampaignStatus}
        onAskAi={(c) => openAi(`Context: Marketing Studio / Campaign · ${c.name}`)}
      />

      {/* Create-campaign form drawer */}
      <RecordDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New campaign"
        subtitle="From an approved template"
        actions={
          <>
            <button
              type="button"
              onClick={submitCreate}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-[0.8rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Create campaign
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="inline-flex items-center justify-center rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.8rem] font-semibold text-ink transition-colors hover:bg-paper"
            >
              Cancel
            </button>
          </>
        }
      >
        <CreateCampaignForm draft={draft} onChange={setDraft} />
      </RecordDrawer>
    </div>
  );
}
