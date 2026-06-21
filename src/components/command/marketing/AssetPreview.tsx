"use client";

import { type ReactNode } from "react";
import {
  Mail,
  Camera,
  FileText,
  Megaphone,
  Globe,
  ImageIcon,
  Send,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusChip, AIInsightChip } from "@/components/os";

/* ──────────────────────────────────────────────────────────────────────────
   Marketing Studio — AssetPreview  (pane 2, ref §2.8 / wireframe 11)

   Channel tabs [Email · Social · Flyer · Ad · Web page] over ONE preview
   canvas — "use tabs, not separate pages." The canvas renders a realistic
   deliverable: headline + hero-image placeholder box + body lines + a
   "Send test email" ink button (primary human action = ink, not gold).

   `copy` is the per-channel body — pre-seeded from marketing assets, then
   live-overwritten by streamAi('marketing-kit'). While streaming, the active
   channel shows the streamed text growing in place. Client.
   ────────────────────────────────────────────────────────────────────────── */

export type PreviewChannel = "Email" | "Social" | "Flyer" | "Ad" | "Web page";

export const PREVIEW_CHANNELS: { key: PreviewChannel; icon: typeof Mail }[] = [
  { key: "Email", icon: Mail },
  { key: "Social", icon: Camera },
  { key: "Flyer", icon: FileText },
  { key: "Ad", icon: Megaphone },
  { key: "Web page", icon: Globe },
];

function RuledLine({ w }: { w: string }) {
  return <span className="block h-2 rounded-full bg-mist" style={{ width: w }} />;
}

export function AssetPreview({
  headline,
  subhead,
  channel,
  onChannel,
  body,
  status,
  versionLabel,
  streaming,
  onSendTest,
  metaLine,
}: {
  headline: string;
  subhead: string;
  channel: PreviewChannel;
  onChannel: (c: PreviewChannel) => void;
  body: ReactNode;
  status: { label: string; tone: "success" | "warn" | "info" };
  versionLabel: string;
  streaming: boolean;
  onSendTest: () => void;
  metaLine: string;
}) {
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
            <span className="text-[0.72rem] text-slate tabular-nums">{versionLabel}</span>
          </div>
        </div>

        <div role="tablist" aria-label="Asset channel" className="mt-3 flex flex-wrap gap-1">
          {PREVIEW_CHANNELS.map(({ key, icon: Icon }) => {
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
        <div className="mx-auto max-w-[640px] rounded-xl border border-mist bg-cloud p-6 shadow-soft">
          {/* From / channel meta strip */}
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
              {channel}
            </span>
          </div>

          {/* Headline */}
          <h3 className="font-display text-[1.4rem] font-normal leading-tight text-ink">
            {headline}
          </h3>
          <p className="mt-1 text-[0.82rem] text-slate">{subhead}</p>

          {/* Hero image placeholder box */}
          <div className="mt-4 flex aspect-[16/9] w-full flex-col items-center justify-center rounded-lg border border-dashed border-mist bg-paper-200 text-slate">
            <ImageIcon className="h-7 w-7" aria-hidden />
            <p className="mt-2 text-[0.72rem] font-medium">Hero photo · 1248 NW Cedar Hills Dr</p>
            <p className="text-[0.66rem] text-slate/80">Brand frame + logo lockup applied</p>
          </div>

          {/* Body copy — streamed text or ruled placeholder lines */}
          <div className="mt-4 min-h-[120px]">
            {streaming ? (
              <p className="whitespace-pre-wrap text-[0.84rem] leading-relaxed text-ink">
                {body}
                <Loader2 className="ml-1 inline h-3.5 w-3.5 animate-spin text-gold align-middle" />
              </p>
            ) : body ? (
              <p className="whitespace-pre-wrap text-[0.84rem] leading-relaxed text-ink">
                {body}
              </p>
            ) : (
              <div className="flex flex-col gap-2.5 py-2">
                <RuledLine w="92%" />
                <RuledLine w="84%" />
                <RuledLine w="96%" />
                <RuledLine w="60%" />
              </div>
            )}
          </div>

          {/* CTA chip row — what the deliverable ends with */}
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-mist pt-4">
            <AIInsightChip>Brand kit applied</AIInsightChip>
            <span className="rounded-full bg-paper-200 px-2.5 py-1 text-[0.72rem] font-medium text-slate ring-1 ring-inset ring-mist">
              CTA: Book a private tour
            </span>
            <span className="rounded-full bg-paper-200 px-2.5 py-1 text-[0.72rem] font-medium text-slate ring-1 ring-inset ring-mist">
              Merge fields: 3
            </span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mist px-5 py-3.5">
        <p className="text-[0.72rem] text-slate">
          Test sends to your inbox only — nothing reaches the audience without approval.
        </p>
        <button
          type="button"
          onClick={onSendTest}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[0.8rem] font-semibold text-cloud transition-colors hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
        >
          <Send className="h-3.5 w-3.5" aria-hidden />
          Send test email
        </button>
      </div>
    </div>
  );
}
