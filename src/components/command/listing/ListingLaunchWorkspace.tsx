"use client";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Listing Launch Workspace   (build-reference §2.4 / wireframe 07)

   Coordinator workbench for the automated listing workflow:
     intake → docs → photos → MLS → marketing → seller updates.

   Layout (composed from "@/components/os" primitives only):
     • Optional left selector list of listingPipeline records (default = Maple).
     • LEFT ~50% "Listing record" card — address header + meta + a multi-track
       color-coded checklist as labeled ProgressTrack bars (each its own hue) +
       an auto-generated, forwardable seller-update note.
     • RIGHT TOP "Output previews" — 3×2 grid of mini asset cards
       (title + StatusChip + dark "View").
     • RIGHT BOTTOM context-sensitive "Action drawer" — AI explanation of the
       selected blocker + ink primary + light secondaries; "Generate marketing
       kit" wires to streamAi('marketing-kit').

   This page composes the shared kit; it does not re-implement tables, drawers,
   AI cards, KPI tiles, progress bars, or document previews.
   ────────────────────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react";
import {
  Rocket,
  AlertTriangle,
  Camera,
  FileText,
  Megaphone,
  ShieldCheck,
  ClipboardCheck,
  Forward,
  Send,
  UserPlus,
  FileSearch,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  CalendarClock,
} from "lucide-react";
import {
  KpiStrip,
  KpiCard,
  StatusChip,
  ProgressTrack,
  DocumentPreview,
  AIInsightChip,
  RecordDrawer,
  useAiSidecar,
  type ChipTone,
  type TrackTone,
} from "@/components/os";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import type { ListingPipeline } from "@/lib/types";

/* ── track model ─────────────────────────────────────────────────────────── */

type TrackKey =
  | "intake"
  | "disclosures"
  | "photos"
  | "mls"
  | "marketing"
  | "broker";

interface LaunchTrack {
  key: TrackKey;
  label: string;
  value: number;
  tone: TrackTone;
  /** Plain-English status the action drawer narrates when this track is selected. */
  blockerTitle: string;
  aiExplanation: string;
  insight: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Each listing carries a 6-track launch model. The canonical demo record
 * (7428 SW Maple Ave) is pinned to the wireframe's exact hues + percentages
 * so the storyline reads correctly; other records derive plausibly from their
 * checklist completion so the selector list stays live.
 */
function tracksFor(listing: ListingPipeline): LaunchTrack[] {
  if (listing.address === "7428 SW Maple Ave") {
    return [
      {
        key: "intake",
        label: "Intake complete",
        value: 100,
        tone: "success",
        blockerTitle: "Intake — complete",
        aiExplanation:
          "All seller intake fields captured and validated. Listing agreement on file, property facts reconciled against county records. No action required.",
        insight: "Intake validated · 0 missing fields",
        icon: ClipboardCheck,
      },
      {
        key: "disclosures",
        label: "Seller disclosures",
        value: 45,
        tone: "warn",
        blockerTitle: "Selected blocker: seller disclosures",
        aiExplanation:
          "AI found missing initials on page 4 and a name/title mismatch (form lists \"Sarah Mitchell\" but signature block reads \"S. Mitchell, Trustee\"). Drafted a correction request for the seller.",
        insight: "Needs initials · page 4 · name/title mismatch",
        icon: ShieldCheck,
      },
      {
        key: "photos",
        label: "Photo / video scheduled",
        value: 80,
        tone: "gold",
        blockerTitle: "Photo / video — exterior twilight pending",
        aiExplanation:
          "Interior gallery and drone delivered. Exterior twilight set is scheduled for tomorrow 8:15 PM; until it lands the hero image and social carousel hold at draft.",
        insight: "1 of 2 shoots delivered · twilight set tomorrow",
        icon: Camera,
      },
      {
        key: "mls",
        label: "MLS draft",
        value: 62,
        tone: "info",
        blockerTitle: "MLS draft — input form incomplete",
        aiExplanation:
          "AI generated the RMLS remarks (draft ready for agent approval). The structured input form is 62% complete — room dimensions and HOA section remain before it can publish.",
        insight: "Remarks drafted · input form 62%",
        icon: FileText,
      },
      {
        key: "marketing",
        label: "Marketing kit",
        value: 30,
        tone: "gold",
        blockerTitle: "Marketing kit — not yet generated",
        aiExplanation:
          "Open-house flyer is generated. Social carousel is queued and the email + YouTube script are draft. Run the marketing kit generator to produce the full brand-voice set for agent approval.",
        insight: "Flyer ready · carousel queued · email + script draft",
        icon: Megaphone,
      },
      {
        key: "broker",
        label: "Broker approval",
        value: 20,
        tone: "danger",
        blockerTitle: "Broker approval — required before MLS publish",
        aiExplanation:
          "Broker Jordan Matin has not yet signed off. Launch cannot be marked ready while broker MLS approval is outstanding. Disclosures + MLS input must clear first to unblock the review.",
        insight: "Awaiting Jordan Matin · blocks MLS publish",
        icon: ShieldCheck,
      },
    ];
  }

  // Derive from checklist completion for the rest of the pipeline.
  const pct = (items: { done: boolean }[]) =>
    items.length === 0
      ? 0
      : Math.round((items.filter((i) => i.done).length / items.length) * 100);
  const prep = pct(listing.checklist.prep);
  const photos = pct(listing.checklist.photos);
  const mls = pct(listing.checklist.mls);
  const marketing = pct(listing.checklist.marketing);
  const broker = listing.brokerApproved ? 100 : listing.stage === "Broker Review" ? 40 : 15;
  const disclosures =
    listing.checklist.prep.find((i) => i.label.includes("disclosure"))?.done ? 100 : 45;

  const toneFor = (v: number, partial: TrackTone): TrackTone =>
    v >= 100 ? "success" : v <= 25 ? "danger" : partial;

  return [
    {
      key: "intake",
      label: "Intake complete",
      value: prep,
      tone: toneFor(prep, "warn"),
      blockerTitle: prep >= 100 ? "Intake — complete" : "Intake — in progress",
      aiExplanation:
        prep >= 100
          ? "All seller intake fields captured and validated. No action required."
          : "Seller intake still has open items in the prep checklist — repairs, staging or disclosure signature outstanding.",
      insight: `Prep checklist ${prep}% complete`,
      icon: ClipboardCheck,
    },
    {
      key: "disclosures",
      label: "Seller disclosures",
      value: disclosures,
      tone: toneFor(disclosures, "warn"),
      blockerTitle:
        disclosures >= 100 ? "Seller disclosures — signed" : "Selected blocker: seller disclosures",
      aiExplanation:
        disclosures >= 100
          ? "Seller property disclosure (OREF-016) signed and on file."
          : "Seller property disclosure is not yet fully executed — AI is monitoring for missing initials and signature mismatches.",
      insight: disclosures >= 100 ? "Disclosure executed" : "Disclosure not yet executed",
      icon: ShieldCheck,
    },
    {
      key: "photos",
      label: "Photo / video scheduled",
      value: photos,
      tone: toneFor(photos, "gold"),
      blockerTitle: photos >= 100 ? "Photo / video — delivered" : "Photo / video — pending",
      aiExplanation:
        photos >= 100
          ? "Full media package delivered: interior gallery, drone, virtual tour."
          : "Media package is still in production — photographer scheduling or delivery outstanding.",
      insight: `Media ${photos}% delivered`,
      icon: Camera,
    },
    {
      key: "mls",
      label: "MLS draft",
      value: mls,
      tone: toneFor(mls, "info"),
      blockerTitle: mls >= 100 ? "MLS — live" : "MLS draft — in progress",
      aiExplanation:
        mls >= 100
          ? "Listing is live on RMLS with remarks and input form complete."
          : "MLS remarks drafted; structured input form and publish step remain.",
      insight: `MLS workflow ${mls}%`,
      icon: FileText,
    },
    {
      key: "marketing",
      label: "Marketing kit",
      value: marketing,
      tone: toneFor(marketing, "gold"),
      blockerTitle: marketing >= 100 ? "Marketing kit — published" : "Marketing kit — in progress",
      aiExplanation:
        marketing >= 100
          ? "Full marketing kit published across social, email, flyer and open house."
          : "Marketing assets partly generated — run the kit generator to complete the brand-voice set.",
      insight: `Marketing ${marketing}% published`,
      icon: Megaphone,
    },
    {
      key: "broker",
      label: "Broker approval",
      value: broker,
      tone: toneFor(broker, "warn"),
      blockerTitle: broker >= 100 ? "Broker approval — granted" : "Broker approval — required",
      aiExplanation:
        broker >= 100
          ? "Broker has reviewed and approved this listing for MLS publish."
          : "Broker sign-off is outstanding. Launch cannot be marked ready until broker MLS approval clears.",
      insight: broker >= 100 ? "Broker approved" : "Awaiting broker sign-off",
      icon: ShieldCheck,
    },
  ];
}

/* ── output preview model ────────────────────────────────────────────────── */

type AssetKey =
  | "mls-remarks"
  | "checklist"
  | "seller-email"
  | "flyer"
  | "carousel"
  | "youtube";

interface OutputAsset {
  key: AssetKey;
  title: string;
  status: string;
  tone: ChipTone;
  icon: React.ComponentType<{ className?: string }>;
  /** Drawer preview content. */
  previewTitle: string;
  previewStatus: string;
  previewStatusTone: ChipTone;
  lines: number;
  signatureField?: boolean;
  missing?: string[];
  body: string;
}

function outputsFor(listing: ListingPipeline, marketingKit: string | null): OutputAsset[] {
  const done = (n: number, total: number) => `${n}/${total} complete`;
  const checklistDone = (
    Object.values(listing.checklist).flat() as { done: boolean }[]
  ).filter((i) => i.done).length;
  const checklistTotal = (Object.values(listing.checklist).flat() as unknown[]).length;

  return [
    {
      key: "mls-remarks",
      title: "MLS remarks",
      status: "Draft ready",
      tone: "info",
      icon: FileText,
      previewTitle: "RMLS Public Remarks — draft",
      previewStatus: "Draft · awaiting agent approval",
      previewStatusTone: "info",
      lines: 8,
      body:
        `Refined ${listing.beds}-bed, ${listing.baths}-bath retreat in ${listing.city}. ` +
        `${listing.features.slice(0, 3).join(", ")} anchor a ${listing.sqft.toLocaleString()} sqft floor plan built in ${listing.yearBuilt}. AI-drafted in Matin brand voice; saved as draft version v2.`,
    },
    {
      key: "checklist",
      title: "Listing checklist",
      status: done(checklistDone, checklistTotal),
      tone: checklistDone === checklistTotal ? "success" : "warn",
      icon: ClipboardCheck,
      previewTitle: "Launch checklist export",
      previewStatus: `${checklistDone} of ${checklistTotal} items complete`,
      previewStatusTone: checklistDone === checklistTotal ? "success" : "warn",
      lines: 11,
      body:
        "Grouped launch checklist (Intake · Disclosures · Photos · MLS · Marketing · Launch). Every item carries an owner and due date; export reconciles to the readiness score.",
    },
    {
      key: "seller-email",
      title: "Seller email",
      status: "Needs approve",
      tone: "warn",
      icon: Send,
      previewTitle: "Seller launch update — Sarah Mitchell",
      previewStatus: "Draft · needs agent approval",
      previewStatusTone: "warn",
      lines: 7,
      missing: ["Approval required before client send"],
      body:
        "Hi Sarah — here's where your launch stands. We're 58% through prep. Remaining: your initials on disclosure page 4, the exterior twilight photo set (tomorrow), and broker MLS approval. We'll go live within 5 days.",
    },
    {
      key: "flyer",
      title: "Open house flyer",
      status: "Generated",
      tone: "success",
      icon: Megaphone,
      previewTitle: "Open house flyer — 8.5×11",
      previewStatus: "Generated · brand-approved",
      previewStatusTone: "success",
      lines: 6,
      body:
        `Open House this Saturday 11–2. ${listing.address}, ${listing.city}. Offered at $${listing.price.toLocaleString()}. Hero image, QR to listing page, and agent contact block laid into the Matin flyer template.`,
    },
    {
      key: "carousel",
      title: "Social carousel",
      status: "Queued",
      tone: "info",
      icon: Camera,
      previewTitle: "Instagram carousel — 6 frames",
      previewStatus: "Queued · holds on twilight photo",
      previewStatusTone: "info",
      lines: 6,
      missing: ["Hero frame waiting on exterior twilight set"],
      body:
        "Six-frame carousel: hero, kitchen, primary suite, deck, neighborhood, call-to-action. Captions drafted in brand voice; publishes once the twilight hero lands.",
    },
    {
      key: "youtube",
      title: "YouTube script",
      status: marketingKit ? "Generated" : "Draft",
      tone: marketingKit ? "success" : "info",
      icon: FileText,
      previewTitle: "Listing tour — YouTube script",
      previewStatus: marketingKit ? "Generated by Matin AI" : "Draft outline",
      previewStatusTone: marketingKit ? "success" : "info",
      lines: 9,
      body:
        marketingKit ??
        `Walkthrough VO script: cold open on the ${listing.features[0]?.toLowerCase() ?? "great room"}, three feature beats, neighborhood close, and CTA to book a private showing. Outline ready; run the kit to expand.`,
    },
  ];
}

/* ── selector list ───────────────────────────────────────────────────────── */

function stageTone(listing: ListingPipeline): ChipTone {
  switch (listing.stage) {
    case "Intake":
      return "info";
    case "Photos Scheduled":
      return "warn";
    case "MLS Draft":
      return "info";
    case "Broker Review":
      return "warn";
    case "Active":
      return "success";
    case "Under Offer":
      return "ink";
    default:
      return "info";
  }
}

function readinessOf(listing: ListingPipeline): number {
  if (typeof listing.readiness === "number") return listing.readiness;
  const all = Object.values(listing.checklist).flat() as { done: boolean }[];
  return all.length === 0
    ? 0
    : Math.round((all.filter((i) => i.done).length / all.length) * 100);
}

function ListingSelector({
  listings,
  selectedId,
  onSelect,
}: {
  listings: ListingPipeline[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="eyebrow px-1 pb-1">Active launches ({listings.length})</p>
      <div className="flex flex-col gap-1.5">
        {listings.map((l) => {
          const active = l.id === selectedId;
          const r = readinessOf(l);
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => onSelect(l.id)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors",
                active
                  ? "border-ink bg-ink text-cloud"
                  : "border-mist bg-cloud text-ink hover:border-ink/20",
              )}
            >
              <div className="min-w-0">
                <p
                  className={cn(
                    "truncate text-[0.82rem] font-semibold leading-tight",
                    active ? "text-cloud" : "text-ink",
                  )}
                >
                  {l.address}
                </p>
                <p
                  className={cn(
                    "mt-0.5 truncate text-[0.72rem]",
                    active ? "text-slate-300" : "text-slate",
                  )}
                >
                  {l.city} · ${(l.price / 1000).toFixed(0)}K · {l.stage}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-[0.78rem] font-semibold tabular-nums",
                  active ? "text-gold-bright" : r >= 80 ? "text-success" : r <= 40 ? "text-danger" : "text-warn",
                )}
              >
                {r}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── main workspace ──────────────────────────────────────────────────────── */

export function ListingLaunchWorkspace({ listings }: { listings: ListingPipeline[] }) {
  const { openAi } = useAiSidecar();

  // Default selected = 7428 SW Maple Ave (canonical demo record).
  const maple = listings.find((l) => l.address === "7428 SW Maple Ave");
  const [selectedId, setSelectedId] = useState<string>(maple?.id ?? listings[0]?.id ?? "");
  const selected = listings.find((l) => l.id === selectedId) ?? listings[0];

  const tracks = useMemo(() => tracksFor(selected), [selected]);

  // The selected blocker drives the action drawer. Default to disclosures
  // (the canonical first blocker), else the lowest-progress track.
  const [activeTrackKey, setActiveTrackKey] = useState<TrackKey>("disclosures");
  const activeTrack =
    tracks.find((t) => t.key === activeTrackKey) ??
    [...tracks].sort((a, b) => a.value - b.value)[0];

  // Marketing kit live-generation state.
  const [kitOutput, setKitOutput] = useState<string | null>(null);
  const [kitLoading, setKitLoading] = useState(false);

  const outputs = useMemo(() => outputsFor(selected, kitOutput), [selected, kitOutput]);

  // Asset drawer.
  const [openAssetKey, setOpenAssetKey] = useState<AssetKey | null>(null);
  const openAsset = outputs.find((o) => o.key === openAssetKey) ?? null;

  // Overall launch progress = mean of tracks (drives KPI + seller note).
  const overall = Math.round(tracks.reduce((s, t) => s + t.value, 0) / tracks.length);

  const contextLine = `Context: Listing Launch / ${selected.address}`;

  async function handleGenerateKit() {
    setKitLoading(true);
    setKitOutput("");
    try {
      await streamAi(
        {
          tool: "marketing-kit",
          input: {
            address: selected.address,
            city: selected.city,
            price: selected.price,
            beds: selected.beds,
            baths: selected.baths,
            sqft: selected.sqft,
            yearBuilt: selected.yearBuilt,
            features: selected.features,
          },
        },
        (_chunk, full) => setKitOutput(full),
      );
    } finally {
      setKitLoading(false);
    }
  }

  /* ── KPI strip (section header) ──────────────────────────────────────── */
  const activeLaunches = listings.filter(
    (l) => l.stage !== "Active" && l.stage !== "Under Offer",
  ).length;
  const blocked = listings.filter((l) => (l.blockers?.length ?? 0) > 0).length;
  const photosPending = listings.filter((l) =>
    l.checklist.photos.some((i) => !i.done),
  ).length;
  const mlsDrafts = listings.filter((l) => l.stage === "MLS Draft").length;
  const launchingThisWeek = listings.filter(
    (l) => l.stage === "MLS Draft" || l.stage === "Broker Review",
  ).length;
  const awaitingBroker = listings.filter(
    (l) => !l.brokerApproved && (l.stage === "Broker Review" || l.stage === "MLS Draft"),
  ).length;

  return (
    <div className="space-y-5">
      {/* Subtitle / eyebrow */}
      <p className="text-[13px] text-slate">
        Automated listing workflow: intake → docs → photos → MLS → marketing → seller updates.
      </p>

      {/* KPI strip */}
      <KpiStrip>
        <KpiCard
          label="Active launches"
          value={activeLaunches}
          icon={<Rocket className="h-4 w-4" />}
          hint="In prep before MLS live"
          onDrill={() => openAi("Context: Listing Launch / Active launches")}
        />
        <KpiCard
          label="Blocked"
          value={blocked}
          valueTone="danger"
          icon={<AlertTriangle className="h-4 w-4" />}
          hint="One or more open blockers"
          onDrill={() => openAi("Context: Listing Launch / Blocked launches")}
        />
        <KpiCard
          label="Photos pending"
          value={photosPending}
          icon={<Camera className="h-4 w-4" />}
          hint="Media not yet delivered"
        />
        <KpiCard
          label="MLS drafts"
          value={mlsDrafts}
          icon={<FileText className="h-4 w-4" />}
          hint="Remarks awaiting approval"
        />
        <KpiCard
          label="Awaiting broker"
          value={awaitingBroker}
          valueTone="danger"
          icon={<ShieldCheck className="h-4 w-4" />}
          hint="Sign-off blocks publish"
        />
        <KpiCard
          label="Launching this week"
          value={launchingThisWeek}
          icon={<CalendarClock className="h-4 w-4" />}
          hint="Targeted to go live ≤ 7 days"
        />
      </KpiStrip>

      {/* Body: selector + record (left) | outputs + action drawer (right) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Selector */}
        <div className="lg:col-span-2">
          <ListingSelector
            listings={listings}
            selectedId={selected.id}
            onSelect={(id) => {
              setSelectedId(id);
              setActiveTrackKey("disclosures");
              setKitOutput(null);
            }}
          />
        </div>

        {/* LEFT ~50% — Listing record */}
        <div className="lg:col-span-5">
          <ListingRecordCard
            listing={selected}
            tracks={tracks}
            activeTrackKey={activeTrack.key}
            overall={overall}
            onSelectTrack={setActiveTrackKey}
            onOpenAi={() => openAi(contextLine)}
          />
        </div>

        {/* RIGHT — outputs (top) + action drawer (bottom) */}
        <div className="space-y-5 lg:col-span-5">
          <OutputPreviews outputs={outputs} onView={(k) => setOpenAssetKey(k)} />
          <ActionDrawerCard
            track={activeTrack}
            kitLoading={kitLoading}
            kitOutput={kitOutput}
            onGenerateKit={handleGenerateKit}
            onOpenDoc={() => setOpenAssetKey("seller-email")}
          />
        </div>
      </div>

      {/* Asset preview drawer */}
      <RecordDrawer
        open={!!openAsset}
        onClose={() => setOpenAssetKey(null)}
        title={openAsset?.previewTitle ?? ""}
        subtitle={`${selected.address} · ${selected.city}`}
        actions={
          openAsset ? (
            <div className="flex w-full items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setOpenAssetKey(null)}
                className="rounded-lg px-3 py-2 text-[0.82rem] font-medium text-slate transition-colors hover:bg-paper-200"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-mist px-3 py-2 text-[0.82rem] font-medium text-ink transition-colors hover:bg-paper-200"
                >
                  Download PDF
                </button>
                {openAsset.previewStatusTone === "warn" ? (
                  <button
                    type="button"
                    className="rounded-lg bg-ink px-3 py-2 text-[0.82rem] font-medium text-cloud transition-colors hover:bg-ink-800"
                  >
                    Approve &amp; send
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-lg bg-ink px-3 py-2 text-[0.82rem] font-medium text-cloud transition-colors hover:bg-ink-800"
                  >
                    Send for signature
                  </button>
                )}
              </div>
            </div>
          ) : null
        }
      >
        {openAsset ? (
          <div className="space-y-4">
            <AIInsightChip>Generated by Matin AI · saved as draft version</AIInsightChip>
            <p className="text-[0.86rem] leading-relaxed text-ink">{openAsset.body}</p>
            <DocumentPreview
              title={openAsset.previewTitle}
              status={openAsset.previewStatus}
              statusTone={openAsset.previewStatusTone}
              lines={openAsset.lines}
              signatureField={openAsset.signatureField}
              missing={openAsset.missing}
              page={1}
              pages={openAsset.key === "checklist" ? 2 : 1}
            />
          </div>
        ) : null}
      </RecordDrawer>
    </div>
  );
}

/* ── left record card ────────────────────────────────────────────────────── */

function ListingRecordCard({
  listing,
  tracks,
  activeTrackKey,
  overall,
  onSelectTrack,
  onOpenAi,
}: {
  listing: ListingPipeline;
  tracks: LaunchTrack[];
  activeTrackKey: TrackKey;
  overall: number;
  onSelectTrack: (key: TrackKey) => void;
  onOpenAi: () => void;
}) {
  const launchDays =
    listing.address === "7428 SW Maple Ave"
      ? 5
      : Math.max(2, 14 - listing.daysInStage);

  return (
    <div className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-mist px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-display text-[1.2rem] font-normal leading-tight text-ink">
            {listing.address}
          </h2>
          <p className="mt-1 text-[0.8rem] text-slate">
            {listing.city} · ${listing.price.toLocaleString()} target · Launch in {launchDays} days
          </p>
          <p className="mt-1.5 text-[0.74rem] text-slate">
            Listing agent {listing.agentName} · Broker Jordan Matin · {listing.beds}bd / {listing.baths}ba ·{" "}
            {listing.sqft.toLocaleString()} sqft
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusChip tone={stageTone(listing)}>{listing.stage}</StatusChip>
          <span className="text-[0.72rem] text-slate tabular-nums">{listing.daysInStage}d in stage</span>
        </div>
      </div>

      {/* Multi-track checklist as labeled ProgressTrack bars */}
      <div className="space-y-4 px-5 py-5">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Launch tracks</p>
          <span className="text-[0.74rem] font-semibold text-ink tabular-nums">{overall}% overall</span>
        </div>
        <div className="space-y-3.5">
          {tracks.map((t) => {
            const Icon = t.icon;
            const isActive = t.key === activeTrackKey;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onSelectTrack(t.key)}
                className={cn(
                  "block w-full rounded-lg px-2 py-1.5 text-left transition-colors",
                  isActive ? "bg-paper-200 ring-1 ring-inset ring-ink/10" : "hover:bg-paper-200/60",
                )}
              >
                <ProgressTrack
                  label={
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 text-slate" />
                      {t.label}
                    </span>
                  }
                  value={t.value}
                  tone={t.tone}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Auto-generated seller update note */}
      <div className="border-t border-mist px-5 py-4">
        <div className="rounded-xl border border-mist bg-paper px-4 py-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              <p className="text-[0.74rem] font-semibold uppercase tracking-[0.12em] text-slate">
                Auto-generated seller update
              </p>
            </div>
            <StatusChip tone="info">Draft</StatusChip>
          </div>
          <p className="mt-2.5 text-[0.86rem] leading-relaxed text-ink">
            We are {overall}% through launch prep. Remaining items: initials on disclosure page 4,
            exterior twilight photo, and broker MLS approval.
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onOpenAi}
              className="inline-flex items-center gap-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:text-ink"
            >
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              Refine with AI
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.8rem] font-semibold text-ink transition-colors hover:bg-paper-200"
            >
              <Forward className="h-3.5 w-3.5" />
              Forward to seller
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── right top — output previews ─────────────────────────────────────────── */

function OutputPreviews({
  outputs,
  onView,
}: {
  outputs: OutputAsset[];
  onView: (key: AssetKey) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
      <div className="flex items-center justify-between border-b border-mist px-5 py-3.5">
        <h3 className="font-display text-[1.02rem] font-normal text-ink">Output previews</h3>
        <span className="text-[0.74rem] text-slate">{outputs.length} assets</span>
      </div>
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {outputs.map((o) => {
          const Icon = o.icon;
          return (
            <div
              key={o.key}
              className="flex flex-col justify-between gap-3 rounded-xl border border-mist bg-paper px-3.5 py-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-paper-200 text-slate ring-1 ring-inset ring-mist">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-[0.82rem] font-semibold leading-tight text-ink">{o.title}</p>
                </div>
                <div className="mt-2.5">
                  <StatusChip tone={o.tone}>{o.status}</StatusChip>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onView(o.key)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[0.78rem] font-medium text-cloud transition-colors hover:bg-ink-800"
              >
                <FileSearch className="h-3.5 w-3.5" />
                View
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── right bottom — context-sensitive action drawer ──────────────────────── */

function ActionDrawerCard({
  track,
  kitLoading,
  kitOutput,
  onGenerateKit,
  onOpenDoc,
}: {
  track: LaunchTrack;
  kitLoading: boolean;
  kitOutput: string | null;
  onGenerateKit: () => void;
  onOpenDoc: () => void;
}) {
  const isMarketing = track.key === "marketing";
  const kitGenerated = !!kitOutput && !kitLoading;
  const hasStream = kitOutput != null && kitOutput.length > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-800 text-slate-300 shadow-soft">
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-ink-700 px-5 py-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold ring-1 ring-inset ring-gold/30">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-300/70">
            Action drawer
          </p>
          <h3 className="mt-0.5 font-display text-[1.05rem] font-normal leading-tight text-cloud">
            {track.blockerTitle}
          </h3>
        </div>
      </div>

      {/* AI explanation */}
      <div className="space-y-3 px-5 py-4">
        <p className="text-[0.84rem] leading-relaxed text-slate-300">
          <span className="font-semibold text-slate-300/80">AI: </span>
          {track.aiExplanation}
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-2.5 py-1 text-[0.74rem] font-medium leading-none text-gold-ink ring-1 ring-inset ring-gold/25">
          <Sparkles className="h-3.5 w-3.5" />
          {track.insight}
        </span>

        {/* Buttons */}
        <div className="mt-1 flex flex-wrap items-center gap-2 pt-1">
          {isMarketing ? (
            <button
              type="button"
              onClick={onGenerateKit}
              disabled={kitLoading}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-[0.8rem] font-semibold text-ink transition-colors",
                kitLoading
                  ? "cursor-not-allowed opacity-60"
                  : "hover:bg-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {kitLoading
                ? "Generating marketing kit…"
                : kitGenerated
                  ? "Regenerate marketing kit"
                  : "Generate marketing kit"}
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-cloud px-3.5 py-2 text-[0.8rem] font-semibold text-ink transition-colors hover:bg-paper-200"
            >
              <Send className="h-3.5 w-3.5" />
              Send correction request
            </button>
          )}

          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2 text-[0.8rem] font-medium text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Assign TC follow-up
          </button>
          <button
            type="button"
            onClick={onOpenDoc}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2 text-[0.8rem] font-medium text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud"
          >
            <FileSearch className="h-3.5 w-3.5" />
            Open document preview
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2 text-[0.8rem] font-medium text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark exception approved
          </button>
        </div>

        {/* Streaming kit output */}
        {(kitLoading || kitGenerated) && isMarketing ? (
          <div className="mt-3 rounded-xl border border-ink-700 bg-ink-900 px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate-300/70">
                Marketing kit · live draft
              </p>
              <span className="inline-flex items-center gap-1 text-[0.7rem] text-gold">
                <Sparkles className="h-3 w-3" />
                {kitLoading ? "Streaming" : "Draft ready"}
              </span>
            </div>
            <p className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-[0.8rem] leading-relaxed text-slate-300">
              {hasStream
                ? kitOutput
                : "Generating brand-voice MLS, social, email and flyer copy…"}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-[0.72rem] text-slate-300/70">
              <ChevronRight className="h-3 w-3" />
              Saved as draft version · requires agent approval before any send.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
