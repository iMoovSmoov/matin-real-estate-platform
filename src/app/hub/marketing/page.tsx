"use client";

import { Suspense, useCallback, useMemo, useState, type ReactNode } from "react";
import {
  Megaphone,
  Layers,
  MailOpen,
  Reply,
  Banknote,
  Plus,
  PanelsTopLeft,
  Eye,
  SlidersHorizontal,
  Copy,
  Check,
  Download,
} from "lucide-react";
import { campaigns as seedCampaigns, roles, getAgent } from "@/lib/data";
import type { Campaign } from "@/lib/types";
import { streamAi } from "@/lib/ai/client";
import { downloadTextFile } from "@/lib/download";
import { cn, compactUsd, num } from "@/lib/utils";
import { MatinMark } from "@/components/brand/Logo";
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
  PaneSwitcher,
  usePaneSwitcher,
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
import { CreateParamWatcher } from "@/components/command/marketing/CreateParamWatcher";
import { CampaignChart } from "@/components/command/marketing/CampaignChart";
import { CampaignFlyer } from "@/components/command/marketing/CampaignFlyer";
import { EmailComposer } from "@/components/command/marketing/EmailComposer";
import { SequenceBuilder } from "@/components/command/marketing/SequenceBuilder";
import { AudiencePanel } from "@/components/command/marketing/AudiencePanel";
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
import { campaignPerformance } from "@/components/command/marketing/marketing-branding";

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

/* Local pane visibility at the XL split (not lg).

   The 3-pane studio (Templates / Preview / Controls) is too tight in the
   1024–1279 "lg-but-not-xl" band: with the 280px sidebar, the workspace is only
   ~700px wide at lg, so a 3/5/4 split crushes the full AssetPreview document
   into a ~290px cell (the "never crowd a full document into a narrow grid cell"
   rule). So we keep the single-pane PaneSwitcher all the way to xl and only open
   the real 3-pane grid at xl+ where the workspace clears ~1000px.

   The os `paneClass` helper is hardcoded to `lg`; we can't edit it, so this
   local helper mirrors it at `xl`: show only the active pane below xl, show all
   panes at xl and up. */
function paneClassXl(active: boolean, rest: string) {
  return cn(active ? "block xl:block" : "hidden xl:block", rest);
}

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

  // Email-composer AI draft state (separate from the kit generate).
  const [composing, setComposing] = useState(false);

  const [sentState, setSentState] = useState<"idle" | "sending" | "sent">("idle");

  const [controls, setControls] = useState<GenControlsState>({
    audiences: ["Seller database", "Lake Oswego buyers"],
    tones: ["Luxury", "Direct", "Local"],
    channels: ["Email", "Instagram", "Facebook", "Google retargeting"],
  });

  const [approvers, setApprovers] = useState<Approver[]>(() => {
    const broker = getAgent(roles.principalBroker);
    const listingAgent = getAgent(STUDIO_LISTING.agentSlug);
    return [
      {
        slug: roles.principalBroker,
        name: broker?.name ?? "Jordan Matin",
        role: "Principal broker",
        approved: false,
      },
      {
        slug: STUDIO_LISTING.agentSlug,
        name: listingAgent?.name ?? "Listing agent",
        role: "Listing agent",
        approved: false,
      },
    ];
  });

  /* Mobile pane switcher (R1) — Templates · Preview · Controls (one at a time
     below lg; the full 3-pane grid takes over at lg+). */
  const pane = usePaneSwitcher(
    [
      { key: "templates", label: "Templates", icon: <PanelsTopLeft className="h-3.5 w-3.5" /> },
      { key: "preview", label: "Preview", icon: <Eye className="h-3.5 w-3.5" /> },
      { key: "controls", label: "Controls", icon: <SlidersHorizontal className="h-3.5 w-3.5" /> },
    ],
    "preview",
  );

  /* ── Campaigns (mutable local copy so + New / pause shows immediately) ── */
  const [campaignRows, setCampaignRows] = useState<Campaign[]>(seedCampaigns);
  const [view, setView] = useState("all");
  const [openCampaign, setOpenCampaign] = useState<Campaign | null>(null);

  /* ── Create-campaign form drawer ── */
  const [createOpen, setCreateOpen] = useState(false);
  // Stable opener for the "+ Create" command-bar deep link (?create=campaign).
  const openCreate = useCallback(() => setCreateOpen(true), []);
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

  // Only the three templates that market THIS studio listing carry its specific
  // address/price/specs chrome. Sphere/market templates (just-sold, nurture,
  // recruiting, spotlight, cash-offer) render as branded creative without
  // claiming the listing's address or price.
  const isListingTemplate =
    template === "listing-launch" ||
    template === "open-house" ||
    template === "price-reduction";

  const kpi = useMemo(() => studioKpis(campaignRows), [campaignRows]);
  const perf = useMemo(() => campaignPerformance(campaignRows), [campaignRows]);

  /* ── Template select: load it, reset any generated kit + send state ── */
  const selectTemplate = useCallback(
    (key: TemplateKey) => {
      setTemplate(key);
      setKit(null);
      setSentState("idle");
      // Snap the channel to one this template actually carries.
      const t = templateByKey(key);
      setChannel((prev) => (t.channels.includes(prev) ? prev : t.channels[0]));
      // R1: on phone, selecting a template jumps to the preview pane.
      pane.go("preview");
    },
    [pane],
  );

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

  /* ── Email composer → stream an on-brand draft body via Matin AI ── */
  async function composeEmailDraft(): Promise<{ body: string }> {
    setComposing(true);
    let full = "";
    try {
      await streamAi(
        {
          tool: "lead-responder",
          input: {
            ...STUDIO_LISTING,
            task: `Write a warm, on-brand home-value outreach email for the seller database about ${STUDIO_LISTING.address} in ${STUDIO_LISTING.cityShort}. Use the merge tokens {{first_name}}, {{address}}, {{community}}, {{agent_name}}, {{agent_phone}} naturally. Keep it under 120 words.`,
            channel: "Email",
            tone: controls.tones.join(", "),
          },
        },
        (_chunk, acc) => {
          full = acc;
        },
      );
    } finally {
      setComposing(false);
    }
    return { body: full };
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

  /* ── Full-campaign export text — every channel of the active template stitched
     into one paste-ready, downloadable document (uses the live streamed kit when
     generated, otherwise the approved seed copy). Keeps the generated campaign a
     real artifact the viewer can copy or save, never a dead-end preview. ── */
  const campaignText = useMemo(() => {
    const bodyFor = (ch: PreviewChannel): string => {
      if (kit !== null) {
        const parsed = sectionFromKit(kit, ch);
        return parsed || (generating ? "" : seedFor(template, ch));
      }
      return seedFor(template, ch);
    };
    const headerLines = [
      `${activeTemplate.label.toUpperCase()} — MULTI-CHANNEL CAMPAIGN`,
      isListingTemplate
        ? `${STUDIO_LISTING.address}, ${STUDIO_LISTING.city} · ${STUDIO_LISTING.price}`
        : activeTemplate.blurb,
      `Matin Real Estate · ${isGenerated ? "AI draft v1 (unsaved)" : "Approved kit v2"}`,
      `Audience: ${controls.audiences.join(", ") || "Seller database"} · Tone: ${controls.tones.join(", ")}`,
      "",
    ];
    const sections = activeTemplate.channels.map((ch) => {
      const b = bodyFor(ch).trim();
      return `## ${ch}\n${b || "(not included in this template)"}`;
    });
    return [
      ...headerLines,
      sections.join("\n\n"),
      "",
      "Equal Housing Opportunity · Matin Real Estate",
    ].join("\n");
  }, [
    activeTemplate,
    kit,
    generating,
    template,
    isGenerated,
    isListingTemplate,
    controls.audiences,
    controls.tones,
  ]);
  const campaignFilename = `matin-${template}-campaign.txt`;

  /* ── AI producer proposed actions (stream INLINE into the cards) ── */
  const producerActions: AIAction[] = useMemo(
    () => [
      {
        id: "shorten-subject",
        title: `Tighten the ${channel} subject line`,
        riskTag: "Ready",
        evidence: `This campaign's emails are opening below our usual rate, and a long subject line is the likely cause — shorter subjects tend to do better.`,
        confidence: "High",
      },
      {
        id: "ab-variants",
        title: "Draft two subject lines to test",
        riskTag: "Approval required",
        evidence:
          "The low open rate points to the subject line, not the audience. Two subject options let us see which one works before sending to everyone.",
        confidence: "Medium",
      },
    ],
    [channel],
  );

  const runProducerAction = useCallback(
    async (action: AIAction) => {
      const id = action.id ?? action.title;
      const filename =
        id === "ab-variants"
          ? "matin-subject-variants.txt"
          : "matin-subject-line.txt";
      setActionState((prev) => ({ ...prev, [id]: { running: true, result: undefined } }));
      const tool = id === "ab-variants" ? "marketing-kit" : "lead-responder";
      // Track the streamed text so the final (copyable) result keeps the full draft.
      let acc = "";
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
          (_chunk, full) => {
            acc = full;
            setActionState((prev) => ({
              ...prev,
              [id]: { running: true, result: <AiDraftResult text={acc} running filename={filename} /> },
            }));
          },
        );
      } finally {
        setActionState((prev) => ({
          ...prev,
          [id]: {
            running: false,
            result: acc ? <AiDraftResult text={acc} running={false} filename={filename} /> : undefined,
          },
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
      cardHidden: true,
      render: (c) => (
        <span className="tabular-nums text-ink">
          {c.replyRate ? `${c.replyRate.toFixed(1)}%` : "—"}
        </span>
      ),
    },
    {
      // R3: the single most important column — pinned top-right on mobile cards
      // so attributed $ is always visible without horizontal scroll.
      key: "attributedPipeline",
      header: "Attributed $",
      align: "right",
      sortable: true,
      primary: true,
      render: (c) => (
        <span className="tabular-nums font-semibold text-success">
          {c.attributedPipeline ? compactUsd(c.attributedPipeline) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5 px-4 py-5 md:px-6 lg:py-6">
      {/* Shared "+ Create" deep link: /hub/marketing?create=campaign auto-opens
          the create-campaign drawer once on mount, then strips the param. */}
      <Suspense fallback={null}>
        <CreateParamWatcher value="campaign" onMatch={openCreate} />
      </Suspense>

      {/* Subtitle (no page-level h1 — TopCommandBar owns the title) */}
      <p className="text-[0.82rem] leading-snug text-slate">
        Brand-controlled templates generate email, web, print, social, ad, and
        seller-update assets.
      </p>

      <section className="surface-ai relative overflow-hidden rounded-2xl p-4 shadow-[0_18px_54px_rgba(0,0,0,.24)] sm:p-5">
        <img
          src={STUDIO_LISTING.photo}
          alt=""
          className="absolute inset-y-0 right-0 hidden h-full w-[38%] object-cover opacity-32 saturate-[.85] md:block"
        />
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,rgba(8,18,13,.98)_0%,rgba(8,18,13,.9)_54%,rgba(8,18,13,.34)_100%)]" />
        <span aria-hidden className="ai-bloom -right-16 -top-16" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success text-cloud shadow-[0_0_24px_rgba(31,107,74,.5)]">
                <MatinMark theme="white" className="h-4 w-4" />
              </span>
              <div>
                <p className="eyebrow text-[0.66rem] text-[#a8e6c2]">AI asset studio</p>
                <p className="mt-0.5 text-[0.72rem] text-slate-300">
                  {STUDIO_LISTING.address} · {STUDIO_LISTING.cityShort}
                </p>
              </div>
            </div>
            <h2 className="mt-3 max-w-3xl font-display text-[1.25rem] font-normal leading-tight text-cloud sm:text-[1.55rem]">
              Generate a full Matin-branded launch kit, then approve every channel before it publishes.
            </h2>
            <div className="mt-3 flex flex-wrap gap-2 text-[0.72rem] text-slate-300">
              {["Email", "Instagram", "Facebook", "Google retargeting", "Print flyer"].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#1f6b4a,#2f8a60_70%,#c9a24b_150%)] px-4 text-[0.82rem] font-semibold text-cloud shadow-[0_10px_26px_rgba(31,107,74,.42)] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-75"
          >
            {generating ? "Generating kit..." : "Generate launch kit"}
          </button>
        </div>
      </section>

      {/* KPI strip — every tile drills into the campaigns table or a record.
          R4: scroll-snap rail on phone so 6 tiles never orphan. */}
      <KpiStrip cols={6}>
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
          hint="Tracked back to the CRM and Reports"
          onDrill={drillToTopAttributed}
        />
        <KpiCard
          label="New campaign"
          value={<Plus className="h-6 w-6" aria-hidden />}
          hint="Start from an approved template"
          onDrill={() => setCreateOpen(true)}
        />
      </KpiStrip>

      {/* Pane switcher (R1) — Templates · Preview · Controls. Shows below XL
          (the os switcher bakes in `lg:hidden`, so we re-show it at lg with
          `lg:flex` and hide it only at xl); the full 3-pane grid takes over at
          xl+ where the workspace is wide enough to not crush the preview. */}
      <PaneSwitcher
        {...pane.switcherProps}
        ariaLabel="Marketing studio panes"
        className="lg:flex xl:hidden"
      />

      {/* Three panes — split at XL (R1/R-lg-band). Each pane keeps state via the
          local xl pane-class so the form + preview persist when switching. */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Pane 1 — template library */}
        <div className={paneClassXl(pane.is("templates"), "min-w-0 xl:col-span-3")}>
          <TemplateLibrary active={template} onSelect={selectTemplate} />
        </div>

        {/* Pane 2 — asset previews (channel tabs over one canvas). Visibility on
            the outer div; flex column on an inner wrapper so it applies whenever
            the pane is shown (block vs flex would otherwise collide). */}
        <div className={paneClassXl(pane.is("preview"), "min-w-0 xl:col-span-5")}>
         <div className="flex flex-col gap-5">
          <AssetPreview
            headline={activeTemplate.headline}
            subhead={
              isListingTemplate
                ? `${activeTemplate.label} · ${STUDIO_LISTING.address}, ${STUDIO_LISTING.city}`
                : `${activeTemplate.label} · ${activeTemplate.blurb}`
            }
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
            isListing={isListingTemplate}
            campaignText={campaignText}
            campaignFilename={campaignFilename}
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
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-ink-800 px-3.5 py-3 ring-1 ring-inset ring-ink-700">
              <p className="min-w-0 flex-1 text-[0.82rem] leading-relaxed text-slate-300">
                Every channel carries Matin&apos;s logo, colors, and the required
                Oregon fair-housing line. Nothing goes out until both the broker
                and the listing agent sign off.
              </p>
              <button
                type="button"
                onClick={() => openAi(`Working on: ${studioContext}`)}
                className="btn-accent inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.76rem] font-semibold"
              >
                <MatinMark theme="white" className="h-3.5 w-3.5" />
                <span>Ask Matin</span>
              </button>
            </div>
          </AiPanel>
         </div>
        </div>

        {/* Pane 3 — generation controls + real audience composition */}
        <div className={paneClassXl(pane.is("controls"), "min-w-0 xl:col-span-4")}>
          <div className="flex flex-col gap-5">
            <GenerationControls
              state={controls}
              onToggle={toggle}
              approvers={approvers}
              onToggleApprover={toggleApprover}
              generating={generating}
              onGenerate={handleGenerate}
            />
            <AudiencePanel />
          </div>
        </div>
      </div>

      {/* Campaign performance — recharts bar chart with decomposing tooltip */}
      <CampaignChart data={perf} />

      {/* Branded deliverables — flyer (BrandedDocument) + email composer */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3 px-1">
            <h2 className="min-w-0 font-display text-[1.05rem] font-normal leading-tight text-ink">
              Print flyer
            </h2>
            <span className="hidden shrink-0 text-[0.72rem] text-slate sm:inline">
              {STUDIO_LISTING.address} · Matin-branded · print-ready
            </span>
          </div>
          <CampaignFlyer />
        </div>
        <EmailComposer onGenerate={composeEmailDraft} generating={composing} />
      </div>

      {/* Sequence / automation builder — node + connector flow */}
      <SequenceBuilder />

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
              Opens, clicks, and leads flow back into the CRM and Reports.
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
          responsive
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
        onAskAi={(c) => openAi(`Working on: Marketing Studio / Campaign · ${c.name}`)}
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

/* ──────────────────────────────────────────────────────────────────────────
   AiDraftResult — the streamed AI producer draft (subject-line / A/B variants)
   rendered INSIDE the dark AIActionCard, with Copy + Save .txt so the generated
   draft is a real, exportable artifact (never a look-only dead end). While the
   stream is running it shows a caret; once done the export controls appear.
   ────────────────────────────────────────────────────────────────────────── */
function AiDraftResult({
  text,
  running,
  filename,
}: {
  text: string;
  running: boolean;
  filename: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      /* clipboard blocked — still confirm so the affordance never feels broken */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  const btn =
    "inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-900/60 px-2.5 text-[0.74rem] font-semibold text-cloud transition-colors hover:bg-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40";
  return (
    <div>
      <span className="break-words">
        {text}
        {running ? <span className="animate-pulse">▍</span> : null}
      </span>
      {!running && text ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={copy} className={btn}>
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden />
                Copy
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile(filename, text)}
            className={btn}
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            Save .txt
          </button>
        </div>
      ) : null}
    </div>
  );
}
