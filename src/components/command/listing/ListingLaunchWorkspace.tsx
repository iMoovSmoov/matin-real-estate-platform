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

import { useMemo, useRef, useState } from "react";
import {
  Home,
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
  ChevronRight,
  CalendarClock,
  Database,
} from "lucide-react";
import { MatinMark } from "@/components/brand/Logo";
import {
  KpiStrip,
  KpiCard,
  StatusChip,
  ProgressTrack,
  DocumentPreview,
  BrandedDocument,
  AIInsightChip,
  RecordDrawer,
  ScoreRing,
  Avatar,
  PropertyThumb,
  PaneSwitcher,
  usePaneSwitcher,
  useAiSidecar,
  type ChipTone,
  type TrackTone,
} from "@/components/os";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import { getAgent, roles, defaultListingCoordinator, listingPhoto } from "@/lib/data";
import type { ListingPipeline } from "@/lib/types";
import { prefersReducedMotion } from "./motion";

/* Role-derived principal broker (no hardcoded "Broker Jordan Matin" — G-A #2). */
const BROKER = getAgent(roles.principalBroker);
const BROKER_NAME = BROKER?.name ?? "Jordan Matin";

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
          "Seller intake is complete and checked. The listing agreement is on file and the property details match county records. No action needed.",
        insight: "Intake complete · nothing missing",
        icon: ClipboardCheck,
      },
      {
        key: "disclosures",
        label: "Seller disclosures",
        value: 45,
        tone: "warn",
        blockerTitle: "Seller disclosures — needs corrections",
        aiExplanation:
          "Page 4 of the seller property disclosure is missing initials, and the name on the form doesn't match the signature block. A correction request is ready for the seller to e-sign.",
        insight: "Needs initials · page 4 · name doesn't match",
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
          "The RMLS remarks are drafted and ready for agent approval. The MLS input form is 62% complete — room dimensions and the HOA section still need filling in before it can publish.",
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
          `Principal broker ${BROKER_NAME} has not yet signed off. Launch cannot be marked ready while broker MLS approval is outstanding. Disclosures + MLS input must clear first to unblock the review.`,
        insight: `Awaiting ${BROKER_NAME} · blocks MLS publish`,
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
          ? "Seller intake is complete and checked. No action needed."
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
        disclosures >= 100 ? "Seller disclosures — signed" : "Seller disclosures — needs corrections",
      aiExplanation:
        disclosures >= 100
          ? "Seller property disclosure (OREF-016) signed and on file."
          : "Seller property disclosure isn't fully signed yet — we're watching for missing initials and signatures that don't match.",
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
          : "MLS remarks drafted; the MLS input form and publish step still remain.",
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

function outputsFor(
  listing: ListingPipeline,
  marketingKit: string | null,
  overall: number,
): OutputAsset[] {
  const done = (n: number, total: number) => `${n}/${total} complete`;
  const checklistDone = (
    Object.values(listing.checklist).flat() as { done: boolean }[]
  ).filter((i) => i.done).length;
  const checklistTotal = (Object.values(listing.checklist).flat() as unknown[]).length;

  // Wire each asset's status to its real checklist group (S4 ticket 4) — never
  // a "flyer Generated" on an Intake-stage record.
  const grp = (items: { done: boolean }[]) =>
    items.length > 0 && items.every((i) => i.done);
  const mlsLive = grp(listing.checklist.mls);
  const photosDone = grp(listing.checklist.photos);
  const flyerDone = listing.checklist.marketing.find((i) =>
    /flyer/i.test(i.label),
  )?.done;
  const socialDone = listing.checklist.marketing.find((i) =>
    /social/i.test(i.label),
  )?.done;

  return [
    {
      key: "mls-remarks",
      title: "MLS remarks",
      status: mlsLive ? "Published" : "Draft ready",
      tone: mlsLive ? "success" : "info",
      icon: FileText,
      previewTitle: "RMLS Public Remarks",
      previewStatus: mlsLive ? "Published to RMLS" : "Draft · awaiting agent approval",
      previewStatusTone: mlsLive ? "success" : "info",
      lines: 8,
      body:
        `Refined ${listing.beds}-bed, ${listing.baths}-bath retreat in ${listing.city}. ` +
        `${listing.features.slice(0, 3).join(", ")} anchor a ${listing.sqft.toLocaleString()} sqft floor plan built in ${listing.yearBuilt}. AI-drafted in Matin brand voice; saved as a draft.`,
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
        "Grouped launch checklist (Intake · Disclosures · Photos · MLS · Marketing · Launch). Every item has an owner and a due date, and the export matches the readiness score.",
    },
    {
      key: "seller-email",
      title: "Seller email",
      status: "Needs approve",
      tone: "warn",
      icon: Send,
      previewTitle: `Seller launch update — ${listing.address}`,
      previewStatus: "Draft · needs agent approval",
      previewStatusTone: "warn",
      lines: 7,
      missing: ["Approval required before client send"],
      body:
        `Here's where the ${listing.address} launch stands — we're ${overall}% through prep. ` +
        `What's still open: ${(listing.blockers ?? ["final checklist items"]).join("; ")}. ` +
        `We're aiming to go live on the MLS within the week.`,
    },
    {
      key: "flyer",
      title: "Open house flyer",
      status: flyerDone ? "Generated" : "Drafting",
      tone: flyerDone ? "success" : "warn",
      icon: Megaphone,
      previewTitle: "Open house flyer — 8.5×11",
      previewStatus: flyerDone ? "Generated · brand-approved" : "Drafting · hero photo + price block",
      previewStatusTone: flyerDone ? "success" : "warn",
      lines: 6,
      body:
        `Open House this Saturday 11–2. ${listing.address}, ${listing.city}. Offered at $${listing.price.toLocaleString()}. Hero image, QR to listing page, and agent contact block laid into the Matin flyer template.`,
    },
    {
      key: "carousel",
      title: "Social carousel",
      status: socialDone ? "Published" : "Queued",
      tone: socialDone ? "success" : "info",
      icon: Camera,
      previewTitle: "Instagram carousel — 6 frames",
      previewStatus: socialDone
        ? "Published to Instagram"
        : photosDone
          ? "Queued · ready to schedule"
          : "Queued · holds on photo delivery",
      previewStatusTone: socialDone ? "success" : "info",
      lines: 6,
      missing: socialDone || photosDone ? undefined : ["Hero frame waiting on photo delivery"],
      body:
        "Six-frame carousel: hero, kitchen, primary suite, deck, neighborhood, call-to-action. Captions drafted in brand voice; publishes once the hero photo lands.",
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

/** Active-launches selector — a horizontal scroll rail of compact cards that
 *  works at every breakpoint (R6: scrollable, never a broken wrap). Below lg it
 *  is the only selector; at lg+ it sits above the two-pane workspace. */
function ListingSelectorBar({
  listings,
  selectedId,
  onSelect,
}: {
  listings: ListingPipeline[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <p className="eyebrow px-1 pb-1.5">Active launches ({listings.length})</p>
      <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {listings.map((l) => {
          const active = l.id === selectedId;
          const r = readinessOf(l);
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => onSelect(l.id)}
              aria-pressed={active}
              className={cn(
                "flex min-h-11 w-56 shrink-0 snap-start items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors",
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

  // Overall launch progress = mean of tracks (drives KPI + seller note + outputs).
  const overall = Math.round(tracks.reduce((s, t) => s + t.value, 0) / tracks.length);

  const outputs = useMemo(
    () => outputsFor(selected, kitOutput, overall),
    [selected, kitOutput, overall],
  );

  // Asset drawer.
  const [openAssetKey, setOpenAssetKey] = useState<AssetKey | null>(null);
  const openAsset = outputs.find((o) => o.key === openAssetKey) ?? null;
  // Inline confirmation for the asset drawer's footer actions so no click is a
  // no-op (mandate: "MUTATE → inline confirmation"). Cleared when the open
  // asset changes.
  const [assetAction, setAssetAction] = useState<string | null>(null);
  function openAssetDrawer(k: AssetKey) {
    setAssetAction(null);
    setOpenAssetKey(k);
  }

  // lg+ action-drawer anchor — selecting a checklist track must scroll the
  // context-sensitive action drawer into view (mandate: "checklist-track click
  // updates the action drawer + scrolls to it"). On a tall left record card the
  // drawer can sit below the fold, so a silent state change is invisible.
  const actionRef = useRef<HTMLDivElement>(null);
  function selectTrackDesktop(k: TrackKey) {
    setActiveTrackKey(k);
    const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
    requestAnimationFrame(() =>
      actionRef.current?.scrollIntoView({ behavior, block: "nearest" }),
    );
  }

  // KPI drill — select the first listing matching the metric, focus the
  // relevant track, jump the mobile pane to the record, and scroll the
  // workspace into view so the tile click produces an immediate visible result.
  function drillToListing(match: (l: ListingPipeline) => boolean, track: TrackKey) {
    const target = listings.find(match) ?? selected;
    setSelectedId(target.id);
    setActiveTrackKey(track);
    pane.go("record");
    const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
    requestAnimationFrame(() =>
      document.getElementById("listing-workspace")?.scrollIntoView({ behavior, block: "start" }),
    );
  }

  // Mobile pane-switcher (R1): below lg show ONE pane at a time.
  const pane = usePaneSwitcher(
    [
      { key: "record", label: "Record" },
      { key: "outputs", label: "Assets", count: outputs.length },
      { key: "action", label: "Action" },
    ],
    "record",
  );

  // Real assigned-agent identity (Maple → chase-bright) for header + signatures.
  const agent = getAgent(selected.agentSlug);
  const agentLicense = agent?.licenseNumbers?.OR ?? agent?.licenses?.[0];
  const brandedAgent = {
    name: agent?.name ?? selected.agentName,
    title: agent?.title ?? "Real Estate Broker",
    license: agentLicense,
    phone: agent?.phone,
    email: agent?.email,
    slug: selected.agentSlug,
  };
  const heroPhoto = listingPhoto({ id: selected.id });

  const contextLine = `Working on: Listing Launch / ${selected.address}`;

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

      {/* KPI strip — 2-up phone, 3-up sm + lg (the 1024–1279 'lg band' would
          cram six tiles into ~120px each beside the 280px rail), 6-up only at
          xl where there's room. No tile orphans at any width (6 = 2·3 = 3·2). */}
      <KpiStrip cols={6} className="lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Active launches"
          value={activeLaunches}
          icon={<Home className="h-4 w-4" />}
          hint="In prep before MLS live"
          onDrill={() =>
            drillToListing(
              (l) => l.stage !== "Active" && l.stage !== "Under Offer",
              "intake",
            )
          }
        />
        <KpiCard
          label="Blocked"
          value={blocked}
          valueTone="danger"
          icon={<AlertTriangle className="h-4 w-4" />}
          hint="One or more open blockers"
          onDrill={() =>
            drillToListing((l) => (l.blockers?.length ?? 0) > 0, "disclosures")
          }
        />
        <KpiCard
          label="Photos pending"
          value={photosPending}
          icon={<Camera className="h-4 w-4" />}
          hint="Media not yet delivered"
          onDrill={() =>
            drillToListing((l) => l.checklist.photos.some((i) => !i.done), "photos")
          }
        />
        <KpiCard
          label="MLS drafts"
          value={mlsDrafts}
          icon={<FileText className="h-4 w-4" />}
          hint="Remarks awaiting approval"
          onDrill={() => drillToListing((l) => l.stage === "MLS Draft", "mls")}
        />
        <KpiCard
          label="Awaiting broker"
          value={awaitingBroker}
          valueTone="danger"
          icon={<ShieldCheck className="h-4 w-4" />}
          hint="Sign-off blocks publish"
          onDrill={() =>
            drillToListing(
              (l) => !l.brokerApproved && (l.stage === "Broker Review" || l.stage === "MLS Draft"),
              "broker",
            )
          }
        />
        <KpiCard
          label="Launching this week"
          value={launchingThisWeek}
          icon={<CalendarClock className="h-4 w-4" />}
          hint="Targeted to go live ≤ 7 days"
          onDrill={() =>
            drillToListing((l) => l.stage === "MLS Draft" || l.stage === "Broker Review", "mls")
          }
        />
      </KpiStrip>

      {/* Selector — horizontal scroll-snap rail at every width (R1/R6). The
          wrapper `id` is the scroll target for KPI drilldowns. */}
      <div id="listing-workspace" className="scroll-mt-20">
        <ListingSelectorBar
          listings={listings}
          selectedId={selected.id}
          onSelect={(id) => {
            setSelectedId(id);
            setActiveTrackKey("disclosures");
            setKitOutput(null);
            pane.go("record");
          }}
        />
      </div>

      {/* Mobile pane-switcher (R1): below lg, ONE pane at a time. */}
      <PaneSwitcher {...pane.switcherProps} ariaLabel="Listing launch panes" />

      {/* Below lg — single active pane. `key` on the active pane (+ record)
          remounts so each pane-switch / record-switch fades in (reduced-motion
          safe). Selecting a checklist track jumps straight to the Action pane
          so the tap produces an immediate visible result. */}
      <div key={`${selected.id}-${pane.active}`} className="space-y-5 motion-safe:animate-fade lg:hidden">
        {pane.is("record") ? (
          <ListingRecordCard
            listing={selected}
            tracks={tracks}
            activeTrackKey={activeTrack.key}
            overall={overall}
            agent={brandedAgent}
            heroPhoto={heroPhoto}
            onSelectTrack={(k) => {
              setActiveTrackKey(k);
              pane.go("action");
            }}
            onOpenAi={() => openAi(contextLine)}
          />
        ) : null}
        {pane.is("outputs") ? (
          <OutputPreviews
            outputs={outputs}
            heroPhoto={heroPhoto}
            onView={openAssetDrawer}
          />
        ) : null}
        {pane.is("action") ? (
          <ActionDrawerCard
            track={activeTrack}
            kitLoading={kitLoading}
            kitOutput={kitOutput}
            onGenerateKit={handleGenerateKit}
            onOpenDoc={() => openAssetDrawer("seller-email")}
          />
        ) : null}
      </div>

      {/* lg+ — record (left) | outputs + action drawer (right). Tablet (md)
          gets a 2-column intermediate via the selector bar being horizontal.
          `key={selected.id}` remounts the panes on a record switch so the whole
          record fades in — a tasteful, reduced-motion-safe transition that
          makes "the listing selector switches the whole record" visible. */}
      <div key={selected.id} className="hidden gap-5 motion-safe:animate-fade lg:grid lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-6 xl:col-span-5">
          <ListingRecordCard
            listing={selected}
            tracks={tracks}
            activeTrackKey={activeTrack.key}
            overall={overall}
            agent={brandedAgent}
            heroPhoto={heroPhoto}
            onSelectTrack={selectTrackDesktop}
            onOpenAi={() => openAi(contextLine)}
          />
        </div>
        <div className="min-w-0 space-y-5 lg:col-span-6 xl:col-span-7">
          <OutputPreviews
            outputs={outputs}
            heroPhoto={heroPhoto}
            onView={openAssetDrawer}
          />
          {/* Anchor the context-sensitive action drawer so a track click scrolls
              it into view + the active-track swap fades. */}
          <div ref={actionRef} key={activeTrack.key} className="motion-safe:animate-fade scroll-mt-20">
            <ActionDrawerCard
              track={activeTrack}
              kitLoading={kitLoading}
              kitOutput={kitOutput}
              onGenerateKit={handleGenerateKit}
              onOpenDoc={() => openAssetDrawer("seller-email")}
            />
          </div>
        </div>
      </div>

      {/* What this view pulls together — plain-language data sources */}
      <div className="rounded-xl border border-mist bg-paper-200/40 px-4 py-3">
        <p className="flex items-center gap-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-slate">
          <Database className="h-3.5 w-3.5" aria-hidden />
          What we look at
        </p>
        <p className="mt-1.5 text-[0.72rem] leading-relaxed text-slate">
          Listing details, the launch checklist, documents, marketing assets, and AI activity — all in one place.
        </p>
      </div>

      {/* Asset preview drawer */}
      <RecordDrawer
        open={!!openAsset}
        onClose={() => setOpenAssetKey(null)}
        title={openAsset?.previewTitle ?? ""}
        subtitle={`${selected.address} · ${selected.city}`}
        actions={
          openAsset ? (
            <div className="w-full">
              {/* Inline confirmation so the footer actions are never no-ops */}
              {assetAction ? (
                <p className="mb-2 inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-1.5 text-[0.76rem] font-medium text-success ring-1 ring-inset ring-success/25 motion-safe:animate-fade">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  {assetAction}
                </p>
              ) : null}
              <div className="flex w-full flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setOpenAssetKey(null)}
                  className="min-h-[44px] rounded-lg px-3 py-2 text-[0.82rem] font-medium text-slate transition-colors hover:bg-paper-200"
                >
                  Close
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setAssetAction(`${openAsset.previewTitle} downloaded as PDF`)
                    }
                    className="min-h-[44px] rounded-lg border border-mist px-3 py-2 text-[0.82rem] font-medium text-ink transition-colors hover:bg-paper-200"
                  >
                    Download PDF
                  </button>
                  {openAsset.previewStatusTone === "warn" ? (
                    <button
                      type="button"
                      onClick={() =>
                        setAssetAction("Approved — sent for agent review")
                      }
                      className="min-h-[44px] rounded-lg bg-ink px-3 py-2 text-[0.82rem] font-medium text-cloud transition-colors hover:bg-ink-800"
                    >
                      Approve &amp; send
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setAssetAction("Sent for signature — saved to the file; the checklist updates once it's signed")
                      }
                      className="min-h-[44px] rounded-lg bg-ink px-3 py-2 text-[0.82rem] font-medium text-cloud transition-colors hover:bg-ink-800"
                    >
                      Send for signature
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null
        }
      >
        {openAsset ? (
          <div key={openAsset.key} className="space-y-4 motion-safe:animate-fade">
            <AIInsightChip>Generated by Matin AI · saved as a draft</AIInsightChip>
            {/* Client-facing types render through BrandedDocument (G-B); the
                internal checklist export keeps the gray-ruled DocumentPreview. */}
            {openAsset.key === "seller-email" ? (
              <BrandedDocument
                variant="email"
                title={`${selected.address} launch update`}
                emailSubject={`Your launch update — ${selected.address}`}
                fromName={`Matin Real Estate · ${brandedAgent.name}`}
                recipient="Seller"
                agent={brandedAgent}
                mergeTokens={["{{first_name}}", "{{address}}"]}
                body={
                  <>
                    <p>Hi {"{{first_name}}"},</p>
                    <p>{openAsset.body}</p>
                    <p>
                      I&rsquo;ll keep you posted as each item clears. Reach me directly at{" "}
                      {brandedAgent.phone ?? "(503) 622-9624"} with any questions.
                    </p>
                    <p>
                      Warmly,
                      <br />
                      {brandedAgent.name}
                      {brandedAgent.title ? `, ${brandedAgent.title}` : ""}
                    </p>
                  </>
                }
              />
            ) : openAsset.key === "mls-remarks" ? (
              <BrandedDocument
                variant="letter"
                formId="RMLS Public Remarks"
                title="RMLS Public Remarks"
                recipient={`${selected.address}, ${selected.city}`}
                agent={brandedAgent}
                completion={openAsset.previewStatusTone === "success" ? 100 : 70}
                page={1}
                pages={1}
                fields={[
                  { label: "Listing", value: selected.address },
                  { label: "List price", value: `$${selected.price.toLocaleString()}` },
                  { label: "Beds / baths", value: `${selected.beds} / ${selected.baths}` },
                  { label: "Living area", value: `${selected.sqft.toLocaleString()} sqft` },
                ]}
                body={<p className="leading-relaxed text-ink/90">{openAsset.body}</p>}
              />
            ) : openAsset.key === "flyer" ? (
              <BrandedDocument
                variant="flyer"
                title={selected.address}
                agent={brandedAgent}
                listing={{
                  address: selected.address,
                  city: selected.city,
                  state: "OR",
                  price: `$${selected.price.toLocaleString()}`,
                  beds: selected.beds,
                  baths: selected.baths,
                  sqft: selected.sqft.toLocaleString(),
                  year: selected.yearBuilt,
                  heroPhoto,
                  headline: "Just Listed",
                  blurb: selected.features.slice(0, 3).join(" · "),
                }}
              />
            ) : (
              <>
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
              </>
            )}
          </div>
        ) : null}
      </RecordDrawer>
    </div>
  );
}

/* ── left record card ────────────────────────────────────────────────────── */

interface BrandedAgent {
  name: string;
  title?: string;
  license?: string;
  phone?: string;
  email?: string;
  slug?: string;
}

/** Map a track to its real checklist group (for per-track count) + owner role
 *  + a plausible due window. Owners come from real role slots (G-A #2). */
function trackMeta(
  listing: ListingPipeline,
  key: TrackKey,
  agent: BrandedAgent,
): { done: number; total: number; owner: string; ownerSlug?: string; due: string } {
  const c = listing.checklist;
  const count = (items: { done: boolean }[]) => ({
    done: items.filter((i) => i.done).length,
    total: items.length,
  });
  switch (key) {
    case "intake":
      return { ...count(c.prep), owner: defaultListingCoordinatorName(), ownerSlug: defaultListingCoordinator, due: "Today" };
    case "disclosures":
      return { ...count(c.prep.filter((i) => /disclosure|repair|inspection/i.test(i.label))), owner: agent.name, ownerSlug: agent.slug, due: "Tomorrow" };
    case "photos":
      return { ...count(c.photos), owner: defaultListingCoordinatorName(), ownerSlug: defaultListingCoordinator, due: "In 1 day" };
    case "mls":
      return { ...count(c.mls), owner: agent.name, ownerSlug: agent.slug, due: "In 2 days" };
    case "marketing":
      return { ...count(c.marketing), owner: defaultListingCoordinatorName(), ownerSlug: defaultListingCoordinator, due: "In 3 days" };
    case "broker":
      return { ...count(c.launch), owner: BROKER_NAME, ownerSlug: roles.principalBroker, due: "On clear" };
  }
}

function defaultListingCoordinatorName(): string {
  return getAgent(defaultListingCoordinator)?.name ?? "Listing Coordinator";
}

function ListingRecordCard({
  listing,
  tracks,
  activeTrackKey,
  overall,
  agent,
  heroPhoto,
  onSelectTrack,
  onOpenAi,
}: {
  listing: ListingPipeline;
  tracks: LaunchTrack[];
  activeTrackKey: TrackKey;
  overall: number;
  agent: BrandedAgent;
  heroPhoto: string;
  onSelectTrack: (key: TrackKey) => void;
  onOpenAi: () => void;
}) {
  const launchDays =
    listing.address === "7428 SW Maple Ave"
      ? 5
      : Math.max(2, 14 - listing.daysInStage);
  const ppsf = Math.round(listing.price / listing.sqft);
  const blockers = listing.blockers ?? [];
  // Inline confirmation for "Forward to seller" so the click isn't a no-op
  // (mandate: MUTATE → inline confirmation). Resets when the record changes.
  const [forwarded, setForwarded] = useState(false);

  const stats = [
    { k: "Beds", v: String(listing.beds) },
    { k: "Baths", v: String(listing.baths) },
    { k: "Sq Ft", v: listing.sqft.toLocaleString() },
    { k: "$/SqFt", v: `$${ppsf}` },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
      {/* 16:9 real hero photo (G-A #6 — deterministic by record id) */}
      <div className="relative">
        <PropertyThumb
          src={heroPhoto}
          ratio="video"
          rounded={false}
          alt={`${listing.address}, ${listing.city}`}
        />
        <span className="absolute right-3 top-3">
          <StatusChip tone={stageTone(listing)} variant="solid">
            {listing.stage}
          </StatusChip>
        </span>
      </div>

      {/* Header — address + real agent Avatar + role-derived broker + readiness ring */}
      <div className="flex items-start justify-between gap-3 border-b border-mist px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-display text-[1.2rem] font-normal leading-tight text-ink">
            {listing.address}
          </h2>
          <p className="mt-1 text-[0.8rem] text-slate">
            {listing.city} · ${listing.price.toLocaleString()} target · Launch in {launchDays} days
          </p>
          {/* Real assigned agent shown as an Avatar (no gray initials — §S4.2) */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5">
              <Avatar name={agent.name} slug={agent.slug} size={22} ring />
              <span className="text-[0.74rem] font-medium text-ink">{agent.name}</span>
              <span className="text-[0.7rem] text-slate">listing agent</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Avatar name={BROKER_NAME} slug={roles.principalBroker} size={22} ring />
              <span className="text-[0.74rem] font-medium text-ink">{BROKER_NAME}</span>
              <span className="text-[0.7rem] text-slate">broker</span>
            </span>
          </div>
        </div>
        {/* Launch-readiness ScoreRing (§S4.3) */}
        <div className="shrink-0">
          <ScoreRing value={overall} size={58} label="Ready" />
        </div>
      </div>

      {/* 4-cell PropertyStats strip (§S4.3) */}
      <div className="grid grid-cols-4 divide-x divide-mist border-b border-mist">
        {stats.map((s) => (
          <div key={s.k} className="px-3 py-3 text-center">
            <p className="text-[1.02rem] font-bold tabular-nums text-ink">{s.v}</p>
            <p className="eyebrow !text-[0.56rem] !tracking-[0.14em] text-slate">{s.k}</p>
          </div>
        ))}
      </div>

      {/* Multi-track checklist as labeled ProgressTrack bars — densified with
          count (done/total), owner avatar, due date, next action (§S4.7). */}
      <div className="space-y-4 px-5 py-5">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Launch tracks</p>
          <span className="text-[0.74rem] font-semibold text-ink tabular-nums">{overall}% overall</span>
        </div>
        <div className="space-y-2.5">
          {tracks.map((t) => {
            const Icon = t.icon;
            const isActive = t.key === activeTrackKey;
            const m = trackMeta(listing, t.key, agent);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onSelectTrack(t.key)}
                className={cn(
                  "block w-full rounded-lg px-2.5 py-2 text-left transition-colors",
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
                  valueRight={
                    <span className="tabular-nums">
                      {m.done}/{m.total}
                    </span>
                  }
                />
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-[0.7rem] text-slate">
                    <Avatar name={m.owner} slug={m.ownerSlug} size={16} ring />
                    <span className="truncate" title={m.owner}>{m.owner}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-[0.68rem] text-slate">
                    <CalendarClock className="h-3 w-3" aria-hidden />
                    {m.due}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Auto-generated seller update note — record-driven from real blockers */}
      <div className="border-t border-mist px-5 py-4">
        <div className="rounded-xl border border-mist bg-paper px-4 py-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5">
              <MatinMark theme="dark" className="h-3.5 w-3.5" />
              <p className="text-[0.74rem] font-semibold uppercase tracking-[0.12em] text-slate">
                Auto-generated seller update
              </p>
            </div>
            <StatusChip tone="info">Draft</StatusChip>
          </div>
          <p className="mt-2.5 text-[0.86rem] leading-relaxed text-ink">
            We are {overall}% through launch prep on {listing.address}.{" "}
            {blockers.length > 0
              ? `Remaining items: ${blockers.join("; ")}.`
              : "All launch tracks are clear — preparing to go live."}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={onOpenAi}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-gold/15 px-2.5 py-1.5 text-[0.78rem] font-semibold text-gold-ink ring-1 ring-inset ring-gold/30 transition-colors hover:bg-gold/25"
            >
              <MatinMark theme="dark" className="h-3.5 w-3.5" />
              Refine with Matin AI
            </button>
            {forwarded ? (
              <span className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-1.5 text-[0.78rem] font-semibold text-success ring-1 ring-inset ring-success/25 motion-safe:animate-fade">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                Forwarded to seller
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setForwarded(true)}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.8rem] font-semibold text-ink transition-colors hover:bg-paper-200"
              >
                <Forward className="h-3.5 w-3.5" />
                Forward to seller
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── right top — output previews ─────────────────────────────────────────── */

/** A tiny visual proxy per asset type (flyer hero-crop / carousel stacked-frame
 *  / MLS ruled-page / email letterhead / checklist) so the grid reads like real
 *  deliverables, not a row of identical black buttons (§S4.9). */
function AssetProxy({ asset, heroPhoto }: { asset: OutputAsset; heroPhoto: string }) {
  if (asset.key === "flyer") {
    return (
      <div className="relative h-20 overflow-hidden rounded-lg border border-mist">
        <PropertyThumb src={heroPhoto} ratio="video" rounded={false} alt="Flyer hero" className="h-full" />
        <span className="absolute inset-x-0 top-0 flex items-center gap-1 bg-ink/85 px-2 py-1">
          <MatinMark theme="white" className="h-2.5" />
          <span className="text-[0.56rem] font-medium text-paper">Just Listed</span>
        </span>
      </div>
    );
  }
  if (asset.key === "carousel") {
    return (
      <div className="relative h-20 rounded-lg">
        <span className="absolute left-2 top-2 h-16 w-[70%] -rotate-2 overflow-hidden rounded-md border border-mist bg-paper-200" />
        <span className="absolute left-3 top-1 h-16 w-[70%] rotate-1 overflow-hidden rounded-md border border-mist">
          <PropertyThumb src={heroPhoto} ratio="square" rounded={false} alt="Carousel frame" className="h-full" />
        </span>
      </div>
    );
  }
  if (asset.key === "seller-email") {
    return (
      <div className="h-20 overflow-hidden rounded-lg border border-mist bg-cloud">
        <span className="flex items-center gap-1 bg-ink px-2 py-1">
          <MatinMark theme="white" className="h-2.5" />
          <span className="text-[0.56rem] text-slate-300">Matin Real Estate</span>
        </span>
        <span className="block space-y-1 px-2 py-1.5">
          <span className="block h-1 w-[80%] rounded bg-mist" />
          <span className="block h-1 w-[92%] rounded bg-mist" />
          <span className="block h-1 w-[60%] rounded bg-mist" />
        </span>
      </div>
    );
  }
  // MLS ruled-page + checklist + youtube → ruled-page proxy
  return (
    <div className="h-20 space-y-1.5 overflow-hidden rounded-lg border border-mist bg-cloud px-2.5 py-2">
      <span className="block h-1.5 w-[55%] rounded bg-paper-200" />
      {[88, 96, 72, 90].map((w, i) => (
        <span key={i} className="block h-1 rounded bg-mist" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

function OutputPreviews({
  outputs,
  heroPhoto,
  onView,
}: {
  outputs: OutputAsset[];
  heroPhoto: string;
  onView: (key: AssetKey) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft">
      <div className="flex items-center justify-between border-b border-mist px-5 py-3.5">
        <h3 className="font-display text-[1.02rem] font-normal text-ink">Listing assets</h3>
        <span className="text-[0.74rem] text-slate">{outputs.length} ready</span>
      </div>
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {outputs.map((o) => {
          const Icon = o.icon;
          return (
            // Single card-level click target (§S4.9) — kills the row of identical
            // black buttons; the whole card opens the branded preview drawer.
            <button
              key={o.key}
              type="button"
              onClick={() => onView(o.key)}
              className="group flex min-w-0 flex-col gap-2.5 rounded-xl border border-mist bg-paper p-3 text-left transition-all hover:border-ink/20 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
            >
              <AssetProxy asset={o} heroPhoto={heroPhoto} />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[0.82rem] font-semibold leading-tight text-ink">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-slate" />
                    {o.title}
                  </p>
                  <div className="mt-1.5">
                    <StatusChip tone={o.tone}>{o.status}</StatusChip>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-[0.72rem] font-medium text-slate transition-colors group-hover:text-ink">
                  <FileSearch className="h-3.5 w-3.5" aria-hidden />
                  View
                </span>
              </div>
            </button>
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
  // Inline confirmation so the secondary actions are never dead no-op clicks
  // (mandate: MUTATE → inline confirmation). Resets with the component, which
  // remounts on track change via the `key={activeTrack.key}` wrappers.
  const [actionNote, setActionNote] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-800 text-slate-300 shadow-soft">
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-ink-700 px-5 py-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold ring-1 ring-inset ring-gold/30">
          <MatinMark theme="white" className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-slate-300/70">
            What to do next
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
          <MatinMark theme="dark" className="h-3.5 w-3.5" />
          {track.insight}
        </span>

        {/* Buttons */}
        <div className="mt-1 flex flex-col flex-wrap gap-2 pt-1 sm:flex-row sm:items-center">
          {isMarketing ? (
            <button
              type="button"
              onClick={onGenerateKit}
              disabled={kitLoading}
              className={cn(
                "inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-[0.8rem] font-semibold text-ink transition-colors sm:w-auto sm:justify-start",
                kitLoading
                  ? "cursor-not-allowed opacity-60"
                  : "hover:bg-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
              )}
            >
              <MatinMark theme="dark" className="h-3.5 w-3.5" />
              {kitLoading
                ? "Generating marketing kit…"
                : kitGenerated
                  ? "Regenerate marketing kit"
                  : "Generate marketing kit"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActionNote("Correction request sent to the seller to e-sign")}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-cloud px-3.5 py-2 text-[0.8rem] font-semibold text-ink transition-colors hover:bg-paper-200 sm:w-auto sm:justify-start"
            >
              <Send className="h-3.5 w-3.5" />
              Send correction request
            </button>
          )}

          <button
            type="button"
            onClick={() => setActionNote("Transaction coordinator follow-up assigned")}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2 text-[0.8rem] font-medium text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud sm:w-auto sm:justify-start"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Assign TC follow-up
          </button>
          <button
            type="button"
            onClick={onOpenDoc}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2 text-[0.8rem] font-medium text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud sm:w-auto sm:justify-start"
          >
            <FileSearch className="h-3.5 w-3.5" />
            Open document preview
          </button>
          <button
            type="button"
            onClick={() => setActionNote("Exception approved and logged to the file")}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2 text-[0.8rem] font-medium text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud sm:w-auto sm:justify-start"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark exception approved
          </button>
        </div>

        {/* Inline confirmation for the secondary actions */}
        {actionNote ? (
          <p className="inline-flex items-center gap-1.5 rounded-lg bg-success/15 px-2.5 py-1.5 text-[0.78rem] font-medium text-success ring-1 ring-inset ring-success/25 motion-safe:animate-fade">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            {actionNote}
          </p>
        ) : null}

        {/* Streaming kit output */}
        {(kitLoading || kitGenerated) && isMarketing ? (
          <div className="mt-3 rounded-xl border border-ink-700 bg-ink-900 px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate-300/70">
                Marketing kit · live draft
              </p>
              <span className="inline-flex items-center gap-1 text-[0.7rem] text-gold">
                <MatinMark theme="white" className="h-3 w-3" />
                {kitLoading ? "Writing…" : "Draft ready"}
              </span>
            </div>
            <p className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-[0.8rem] leading-relaxed text-slate-300">
              {hasStream
                ? kitOutput
                : "Generating brand-voice MLS, social, email and flyer copy…"}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-[0.72rem] text-slate-300/70">
              <ChevronRight className="h-3 w-3" />
              Saved as a draft · needs agent approval before it's sent.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
