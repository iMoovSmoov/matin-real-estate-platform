"use client";

import { useMemo, useState } from "react";
import {
  Mail,
  Camera,
  FileText,
  Megaphone,
  Globe,
  Send,
  Loader2,
  CircleCheck,
  Plus,
  Copy,
  Check,
  Download,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusChip, AIInsightChip, PropertyThumb } from "@/components/os";
import { MatinMark } from "@/components/brand/Logo";
import { company } from "@/lib/data";
import { downloadTextFile } from "@/lib/download";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { PREVIEW_CHANNELS, CHANNEL_META, type PreviewChannel } from "./marketing-data";
import { STUDIO_LISTING } from "./marketing-branding";

/** Copy `text` to the clipboard and flash an inline confirmation via `mark`.
 *  Stays graceful (still flashes) when the clipboard API is blocked so the demo
 *  affordance never feels broken. */
async function copyText(text: string, mark: (v: boolean) => void) {
  try {
    await navigator.clipboard?.writeText(text);
  } catch {
    /* clipboard unavailable in this context — still confirm for the demo */
  }
  mark(true);
  setTimeout(() => mark(false), 1800);
}

/** A URL/file-safe slug from the studio listing address (for download names). */
function addressSlug() {
  return STUDIO_LISTING.address
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const OFFICE_LINE = `${company.address.street}, ${company.address.city} ${company.address.state} ${company.address.zip} · ${company.phone}`;

/* ──────────────────────────────────────────────────────────────────────────
   Marketing Studio — AssetPreview  (pane 2, ref §2.8 / wireframe 11)

   Channel tabs [Email · Social · Flyer · Ad · Web page] over ONE preview canvas
   — "use tabs, not separate pages." The canvas renders a realistic per-channel
   deliverable: a real hero PHOTO (PropertyThumb, not a gray box), channel-shaped
   chrome (email From-bar + subject, social square post, print flyer frame, paid
   ad "Sponsored" chip, web property header), the streamed/seed body rendered as
   markdown, and a real "Send test" with an inline confirmation.

   `body` is the per-channel copy — pre-seeded from real assets, then live-
   overwritten by streamAi('marketing-kit'). While streaming, the active channel
   shows the streamed text growing in place with a caret. When a channel isn't
   part of the selected template, the canvas shows an ACTIONABLE empty state.
   Client.
   ────────────────────────────────────────────────────────────────────────── */

const CHANNEL_ICON: Record<PreviewChannel, LucideIcon> = {
  Email: Mail,
  Social: Camera,
  Flyer: FileText,
  Ad: Megaphone,
  "Web page": Globe,
};

function MatinFromBar({ metaLine, kicker }: { metaLine: string; kicker: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 border-b border-mist pb-3">
      <div className="flex items-center gap-2">
        {/* Real Matin mark on an ink chip — never a hand-rolled "M" box */}
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink">
          <MatinMark theme="white" className="h-4" />
        </span>
        <div className="leading-tight">
          <p className="text-[0.78rem] font-semibold text-ink">Matin Real Estate</p>
          <p className="text-[0.7rem] text-slate">{metaLine}</p>
        </div>
      </div>
      <span className="text-[0.66rem] uppercase tracking-[0.18em] text-slate">
        {kicker}
      </span>
    </div>
  );
}

/** Per-asset email telemetry — delivered / opened / clicked counters plus an
 *  "Email has not been opened — View" tile (S8 ticket 9). Numbers model a
 *  representative send so the panel reads like a real deliverability report. */
function AssetTelemetry({ channel }: { channel: PreviewChannel }) {
  const [resent, setResent] = useState(false);
  if (channel !== "Email" && channel !== "Ad" && channel !== "Web page") return null;
  const delivered = 1286;
  const opened = 494; // ~38.4% — the Spring Seller Nurture benchmark
  const clicked = 188;
  const unopened = delivered - opened;
  const cell =
    "flex flex-col gap-0.5 rounded-lg border border-mist bg-paper px-3 py-2";
  return (
    <div className="mt-4 space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div className={cell}>
          <span className="text-[0.66rem] uppercase tracking-[0.08em] text-slate">Delivered</span>
          <span className="text-[0.92rem] font-bold tabular-nums text-ink">
            {delivered.toLocaleString("en-US")}
          </span>
        </div>
        <div className={cell}>
          <span className="text-[0.66rem] uppercase tracking-[0.08em] text-slate">Opened</span>
          <span className="text-[0.92rem] font-bold tabular-nums text-success">
            {opened.toLocaleString("en-US")}
          </span>
        </div>
        <div className={cell}>
          <span className="text-[0.66rem] uppercase tracking-[0.08em] text-slate">Clicked</span>
          <span className="text-[0.92rem] font-bold tabular-nums text-ink">
            {clicked.toLocaleString("en-US")}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-mist bg-cloud px-3 py-2">
        <span className="text-[0.74rem] text-slate">
          {resent ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-success">
              <CircleCheck className="h-3.5 w-3.5" aria-hidden />
              Re-send queued to {unopened.toLocaleString("en-US")} non-openers — routes to approval first.
            </span>
          ) : (
            <>
              <span className="font-semibold text-ink tabular-nums">
                {unopened.toLocaleString("en-US")}
              </span>{" "}
              recipients have not opened this {channel.toLowerCase()} yet
            </>
          )}
        </span>
        <button
          type="button"
          onClick={() => setResent((v) => !v)}
          aria-pressed={resent}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-mist bg-paper px-3 text-[0.74rem] font-semibold text-ink transition-colors hover:border-ink/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
        >
          {resent ? "Undo re-send" : "View · resend"}
        </button>
      </div>
    </div>
  );
}

/** Brand-kit footer applied to every channel deliverable (logo + EHO + office). */
function BrandKitFooter() {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-mist pt-3">
      <div className="flex items-center gap-2">
        <MatinMark theme="dark" className="h-4" />
        <span className="text-[0.66rem] font-medium text-slate">
          Equal Housing Opportunity
        </span>
      </div>
      <span className="text-[0.64rem] text-slate">{OFFICE_LINE}</span>
    </div>
  );
}

/** The body block: streamed markdown, seed markdown, or an actionable empty. */
function BodyBlock({
  body,
  streaming,
  channel,
  onGenerate,
}: {
  body: string;
  streaming: boolean;
  channel: PreviewChannel;
  onGenerate: () => void;
}) {
  if (streaming) {
    return (
      <div className="min-h-[120px]">
        {body ? (
          <div className="text-[0.84rem] leading-relaxed">
            <AiMarkdown text={body} />
          </div>
        ) : null}
        <span className="mt-1 inline-flex items-center gap-2 text-[0.74rem] text-slate">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" aria-hidden />
          Matin AI is drafting this channel…
        </span>
      </div>
    );
  }
  if (body) {
    return (
      <div className="min-h-[120px] text-[0.84rem] leading-relaxed">
        <AiMarkdown text={body} />
      </div>
    );
  }
  // Channel not part of this template — actionable empty state.
  return (
    <div className="flex min-h-[120px] flex-col items-center justify-center rounded-lg border border-dashed border-mist bg-paper px-4 py-6 text-center">
      <p className="text-[0.82rem] font-medium text-ink">
        No {channel} asset in this template yet
      </p>
      <p className="mt-1 max-w-[34ch] text-[0.74rem] leading-snug text-slate">
        This template doesn&apos;t include a {channel.toLowerCase()} deliverable.
        Generate the full campaign and Matin AI will draft one on-brand.
      </p>
      <button
        type="button"
        onClick={onGenerate}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[0.78rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        Generate {channel} asset
      </button>
    </div>
  );
}

export function AssetPreview({
  subhead,
  headline,
  channel,
  onChannel,
  body,
  status,
  versionLabel,
  streaming,
  onSendTest,
  onGenerate,
  metaLine,
  sentState,
  isListing,
  campaignText,
  campaignFilename,
}: {
  subhead: string;
  headline: string;
  channel: PreviewChannel;
  onChannel: (c: PreviewChannel) => void;
  body: string;
  status: { label: string; tone: "success" | "warn" | "info" };
  versionLabel: string;
  streaming: boolean;
  onSendTest: () => void;
  onGenerate: () => void;
  metaLine: string;
  /** Drives the Send-test button: idle → sending → sent (inline confirmation). */
  sentState: "idle" | "sending" | "sent";
  /** Assembled multi-channel campaign text (all channels of this template) so a
   *  viewer can copy or download the WHOLE generated campaign, not just one
   *  channel — every generated asset is a real, exportable artifact. */
  campaignText: string;
  /** Suggested file name for the full-campaign .txt download. */
  campaignFilename: string;
  /** True only for templates that market THIS studio listing (listing-launch /
   *  open-house / price-reduction). When false the canvas drops the specific
   *  listing chrome (price badge, beds/baths subject, single-property header,
   *  "Listing photo" caption) so a Recruiting/Cash-offer/Just-sold asset never
   *  falsely claims the studio listing's address or price. */
  isListing: boolean;
}) {
  const meta = CHANNEL_META[channel];
  const isSocial = channel === "Social";
  const heroRatio = isSocial ? "square" : "video";

  const [copiedChannel, setCopiedChannel] = useState(false);
  const [copiedCampaign, setCopiedCampaign] = useState(false);

  // The plain-text asset for the ACTIVE channel: brand header + subject/headline
  // + the copy itself + CTA + the Equal-Housing office line — a self-contained,
  // paste-ready deliverable (not just the raw body fragment).
  const channelFileText = useMemo(() => {
    const subjectLine =
      channel === "Email"
        ? `Subject: ${headline}${isListing ? ` — ${STUDIO_LISTING.beds}BD/${STUDIO_LISTING.baths}BA at ${STUDIO_LISTING.price}` : ""}`
        : headline;
    const parts = [`Matin Real Estate — ${meta.kicker}`, subjectLine];
    if (channel !== "Email" && subhead) parts.push(subhead);
    parts.push("", body.trim(), "", `CTA: ${meta.cta}`, `Equal Housing Opportunity · ${OFFICE_LINE}`);
    return parts.join("\n");
  }, [channel, headline, subhead, body, meta, isListing]);

  const channelFilename = `matin-${channel.toLowerCase().replace(/\s+/g, "-")}-${addressSlug()}.txt`;
  // Channels carried by this campaign (for the export strip label).
  const channelCount = (campaignText.match(/^## /gm) ?? []).length;
  const hasBody = Boolean(body && body.trim());

  return (
    <div className="flex flex-col rounded-2xl border border-mist bg-cloud shadow-soft">
      {/* Header + channel tabs */}
      <div className="border-b border-mist px-5 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-[1.02rem] font-normal leading-tight text-ink">
            Asset previews
          </h2>
          <div className="flex items-center gap-2">
            <StatusChip tone={status.tone} variant="soft">
              {status.label}
            </StatusChip>
            <span className="tabular-nums text-[0.72rem] text-slate">
              {versionLabel}
            </span>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Asset channel"
          className="mt-3 flex flex-wrap gap-1"
        >
          {PREVIEW_CHANNELS.map((key) => {
            const Icon = CHANNEL_ICON[key];
            const isActive = key === channel;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChannel(key)}
                className={cn(
                  "-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[0.8rem] font-medium leading-none transition-colors",
                  isActive
                    ? "border-ink text-ink"
                    : "border-transparent text-slate hover:text-ink",
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {key}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview canvas */}
      <div className="bg-paper px-5 py-5">
        {/* Full-campaign export strip — copy or download EVERY channel asset at
            once (the generated campaign is a real, exportable artifact). */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-mist bg-cloud px-3 py-2">
          <span className="min-w-0 text-[0.72rem] text-slate">
            <span className="font-semibold text-ink">Full campaign</span> · {channelCount}{" "}
            {channelCount === 1 ? "channel" : "channels"}
            {status.label === "AI draft" ? " · AI draft" : ""}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {copiedCampaign ? (
              <span className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-success">
                <Check className="h-3.5 w-3.5" aria-hidden />
                Copied
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => copyText(campaignText, setCopiedCampaign)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-mist bg-paper px-3 text-[0.74rem] font-semibold text-ink transition-colors hover:border-ink/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden />
              Copy all
            </button>
            <button
              type="button"
              onClick={() => downloadTextFile(campaignFilename, campaignText)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-mist bg-paper px-3 text-[0.74rem] font-semibold text-ink transition-colors hover:border-ink/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              Download .txt
            </button>
          </div>
        </div>
        <div
          className={cn(
            "mx-auto rounded-xl border border-mist bg-cloud p-6 shadow-soft",
            isSocial ? "max-w-[420px]" : "max-w-[640px]",
          )}
        >
          {/* Channel chrome */}
          {channel === "Email" ? (
            <>
              <MatinFromBar metaLine={metaLine} kicker={meta.kicker} />
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-slate">
                Subject
              </p>
              <p className="mb-3 text-[0.92rem] font-semibold text-ink">
                {headline}
                {isListing
                  ? ` — ${STUDIO_LISTING.beds}BD/${STUDIO_LISTING.baths}BA at ${STUDIO_LISTING.price}`
                  : ""}
              </p>
            </>
          ) : channel === "Web page" ? (
            <MatinFromBar
              metaLine={
                isListing
                  ? `${STUDIO_LISTING.address} · single-property page`
                  : "matinrealestate.com · landing page"
              }
              kicker={meta.kicker}
            />
          ) : isSocial ? (
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink">
                <MatinMark theme="white" className="h-4" />
              </span>
              <div className="leading-tight">
                <p className="text-[0.78rem] font-semibold text-ink">matinrealestate</p>
                <p className="text-[0.7rem] text-slate">{STUDIO_LISTING.cityShort}, OR</p>
              </div>
            </div>
          ) : channel === "Ad" ? (
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink">
                  <MatinMark theme="white" className="h-4" />
                </span>
                <div className="leading-tight">
                  <p className="text-[0.78rem] font-semibold text-ink">Matin Real Estate</p>
                  <p className="text-[0.7rem] text-slate">Sponsored · {STUDIO_LISTING.cityShort}</p>
                </div>
              </div>
              <span className="rounded-full bg-paper-200 px-2 py-0.5 text-[0.66rem] font-medium text-slate ring-1 ring-inset ring-mist">
                Paid social
              </span>
            </div>
          ) : (
            // Flyer
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-mist pb-3">
              <span className="font-display text-[1rem] text-ink">Open House</span>
              <span className="text-[0.66rem] uppercase tracking-[0.18em] text-slate">
                {meta.kicker}
              </span>
            </div>
          )}

          {/* Headline (email puts it in subject; others show it here) */}
          {channel !== "Email" ? (
            <>
              <h3 className="font-display text-[1.4rem] font-normal leading-tight text-ink">
                {headline}
              </h3>
              <p className="mt-1 text-[0.82rem] text-slate">{subhead}</p>
            </>
          ) : null}

          {/* Hero PHOTO — the REAL listing hero (listingPhoto), with the brand
              frame + logo lockup actually overlaid (not just claimed). */}
          <div className="mt-4">
            <div className="relative overflow-hidden rounded-xl ring-1 ring-inset ring-ink/10">
              <PropertyThumb
                src={STUDIO_LISTING.photo}
                ratio={heroRatio}
                alt={STUDIO_LISTING.address}
                className="w-full"
                rounded={false}
              />
              {/* Brand frame + logo lockup overlay (makes the caption TRUE) */}
              <span className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-inset ring-cloud/70" />
              <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-md bg-ink/85 px-2 py-1">
                <MatinMark theme="white" className="h-3.5" />
                <span className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-cloud">
                  Matin Real Estate
                </span>
              </span>
              {isListing ? (
                <span className="absolute bottom-2.5 right-2.5 rounded-md bg-cloud/90 px-2 py-0.5 text-[0.72rem] font-bold tabular-nums text-ink">
                  {STUDIO_LISTING.price}
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-[0.66rem] text-slate">
              {isListing
                ? `Listing photo · ${STUDIO_LISTING.address}, ${STUDIO_LISTING.cityShort} · Matin frame and logo added`
                : "Matin-branded creative · logo and brand kit applied"}
            </p>
          </div>

          {/* Body copy — streamed markdown, seed, or actionable empty */}
          <div className="mt-4">
            <BodyBlock
              body={body}
              streaming={streaming}
              channel={channel}
              onGenerate={onGenerate}
            />
          </div>

          {/* CTA chip row — what the deliverable ends with */}
          {body || streaming ? (
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-mist pt-4">
              <AIInsightChip>Brand kit applied</AIInsightChip>
              <span className="rounded-full bg-paper-200 px-2.5 py-1 text-[0.72rem] font-medium text-slate ring-1 ring-inset ring-mist">
                CTA: {meta.cta}
              </span>
              <span className="rounded-full bg-paper-200 px-2.5 py-1 text-[0.72rem] font-medium text-slate ring-1 ring-inset ring-mist">
                Merge fields: {meta.mergeFields}
              </span>
            </div>
          ) : null}

          {/* Brand-kit footer — real Matin mark + EHO + West Linn office line */}
          {body || streaming ? <BrandKitFooter /> : null}
        </div>

        {/* Per-asset email telemetry (delivered / opened / clicked + unopened) */}
        {!streaming && body ? <AssetTelemetry channel={channel} /> : null}
      </div>

      {/* Action bar — copy / download THIS channel + a real "Send test" */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mist px-5 py-3.5">
        <p className="min-w-0 text-[0.72rem] text-slate">
          {sentState === "sent" ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-success">
              <CircleCheck className="h-3.5 w-3.5" aria-hidden />
              Test {channel.toLowerCase()} sent to your inbox — check your email.
            </span>
          ) : (
            "Test sends to your inbox only — nothing reaches the audience without approval."
          )}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {copiedChannel ? (
            <span className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-success">
              <Check className="h-3.5 w-3.5" aria-hidden />
              Copied
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => copyText(channelFileText, setCopiedChannel)}
            disabled={!hasBody}
            title={`Copy the ${channel} copy`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-mist bg-paper px-3 text-[0.78rem] font-semibold text-ink transition-colors hover:border-ink/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 disabled:opacity-40"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden />
            Copy
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile(channelFilename, channelFileText)}
            disabled={!hasBody}
            title={`Download the ${channel} copy as .txt`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-mist bg-paper px-3 text-[0.78rem] font-semibold text-ink transition-colors hover:border-ink/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            Save .txt
          </button>
          <button
            type="button"
            onClick={onSendTest}
            disabled={sentState === "sending" || (!body && !streaming)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-ink px-3.5 text-[0.8rem] font-semibold text-cloud transition-colors hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:opacity-50"
          >
            {sentState === "sending" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Sending…
              </>
            ) : sentState === "sent" ? (
              <>
                <CircleCheck className="h-3.5 w-3.5" aria-hidden />
                Sent
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" aria-hidden />
                Send test {channel === "Email" ? "email" : channel.toLowerCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export type { PreviewChannel } from "./marketing-data";
