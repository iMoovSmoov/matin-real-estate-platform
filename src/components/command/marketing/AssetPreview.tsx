"use client";

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
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusChip, AIInsightChip, PropertyThumb } from "@/components/os";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import {
  PREVIEW_CHANNELS,
  CHANNEL_META,
  STUDIO_LISTING,
  type PreviewChannel,
} from "./marketing-data";

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
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-[0.7rem] font-bold text-cloud">
          M
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
}) {
  const meta = CHANNEL_META[channel];
  const isSocial = channel === "Social";
  const heroRatio = isSocial ? "square" : "video";

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
                {headline} — {STUDIO_LISTING.beds}BD/{STUDIO_LISTING.baths}BA at{" "}
                {STUDIO_LISTING.price}
              </p>
            </>
          ) : channel === "Web page" ? (
            <MatinFromBar metaLine={`${STUDIO_LISTING.address} · single-property page`} kicker={meta.kicker} />
          ) : isSocial ? (
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[0.7rem] font-bold text-cloud">
                M
              </span>
              <div className="leading-tight">
                <p className="text-[0.78rem] font-semibold text-ink">matinrealestate</p>
                <p className="text-[0.7rem] text-slate">{STUDIO_LISTING.cityShort}, OR</p>
              </div>
            </div>
          ) : channel === "Ad" ? (
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[0.7rem] font-bold text-cloud">
                  M
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

          {/* Hero PHOTO — real listing photography, not a gray box */}
          <div className="mt-4">
            <PropertyThumb
              seedIndex={STUDIO_LISTING.seedIndex}
              ratio={heroRatio}
              alt={STUDIO_LISTING.address}
              className="w-full"
            />
            <p className="mt-1.5 text-[0.66rem] text-slate">
              Hero photo · {STUDIO_LISTING.address} · brand frame + logo lockup
              applied
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
        </div>
      </div>

      {/* Action bar — real "Send test" with inline confirmation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mist px-5 py-3.5">
        <p className="text-[0.72rem] text-slate">
          {sentState === "sent" ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-success">
              <CircleCheck className="h-3.5 w-3.5" aria-hidden />
              Test {channel.toLowerCase()} sent to your inbox — check your email.
            </span>
          ) : (
            "Test sends to your inbox only — nothing reaches the audience without approval."
          )}
        </p>
        <button
          type="button"
          onClick={onSendTest}
          disabled={sentState === "sending" || (!body && !streaming)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[0.8rem] font-semibold text-cloud transition-colors hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:opacity-50"
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
  );
}

export type { PreviewChannel } from "./marketing-data";
