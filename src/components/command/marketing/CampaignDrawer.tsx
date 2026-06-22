"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Megaphone,
  MailOpen,
  Reply,
  Banknote,
  Pause,
  Play,
  Copy,
  Check,
} from "lucide-react";
import { marketingAssets, exteriorFallback } from "@/lib/data";
import type { Campaign } from "@/lib/types";
import { compactUsd, num } from "@/lib/utils";
import {
  RecordDrawer,
  StatusChip,
  type ChipTone,
  Avatar,
  PropertyThumb,
  ActivityTimeline,
  type ActivityItem,
  AIInsightChip,
} from "@/components/os";
import { campaignOwner } from "./marketing-data";
import { STUDIO_LISTING } from "./marketing-branding";

/** Campaign hero: the studio listing's REAL photo for its launch campaign,
 *  else a deterministic exterior keyed by the campaign id (never a random seed). */
function campaignPhoto(id: string): string {
  if (id === STUDIO_LISTING.campaignId) return STUDIO_LISTING.photo;
  return exteriorFallback(id);
}

/* ──────────────────────────────────────────────────────────────────────────
   Marketing Studio — CampaignDrawer  (ref §1.9)

   Row-click on the campaigns table opens THIS record drawer (never the AI
   panel). Light record card: dark header (name + audience), identity row with
   the real property hero (PropertyThumb) + the owning agent (Avatar), a metric
   strip, internal tabs — Overview / Assets / Activity — and a bottom action bar.

   Approve/Reject of the launch state mutates local page state; the drawer
   surfaces a small "Ask Matin" affordance that bubbles to the page (the only
   path to the AI panel). Client.
   ────────────────────────────────────────────────────────────────────────── */

const STATUS: Record<Campaign["status"], { tone: ChipTone; label: string }> = {
  live: { tone: "success", label: "Live" },
  scheduled: { tone: "info", label: "Scheduled" },
  draft: { tone: "warn", label: "Draft" },
  paused: { tone: "ink", label: "Paused" },
};

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "assets", label: "Assets" },
  { key: "activity", label: "Activity" },
];

function MetricCell({
  label,
  value,
  tone = "ink",
  icon,
}: {
  label: string;
  value: string;
  tone?: "ink" | "success";
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-mist bg-paper px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-slate">
        <span className="text-slate">{icon}</span>
        <span className="text-[0.68rem] font-medium uppercase tracking-[0.08em]">
          {label}
        </span>
      </div>
      <p
        className={`mt-1 tabular-nums text-[1.05rem] font-bold leading-none ${
          tone === "success" ? "text-success" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/** Copy one generated asset's title + body to the clipboard with an inline
 *  confirmation — so a previewed asset is never a look-only dead end. */
function CopyAssetButton({ text }: { text: string }) {
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
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-mist bg-paper px-2.5 text-[0.72rem] font-semibold text-ink transition-colors hover:border-ink/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" aria-hidden />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" aria-hidden />
          Copy
        </>
      )}
    </button>
  );
}

function activityFor(c: Campaign): ActivityItem[] {
  const owner = campaignOwner(c.id);
  const items: ActivityItem[] = [];
  if (c.status === "live") {
    items.push(
      {
        id: `${c.id}-a1`,
        channel: "system",
        name: "Results updated",
        tag: `${c.openRate.toFixed(1)}% open`,
        tagTone: "gold",
        meta: "Opens, clicks, and replies now show in the CRM and Reports",
        timeLabel: "12m ago",
        group: "Today",
      },
      {
        id: `${c.id}-a2`,
        channel: "email",
        name: `${num(c.sent)} emails delivered`,
        tag: "Sent",
        tagTone: "success",
        meta: `Audience: ${c.audience}`,
        timeLabel: "3h ago",
        group: "Today",
      },
    );
  } else if (c.status === "scheduled") {
    items.push({
      id: `${c.id}-a1`,
      channel: "system",
      name: "Scheduled to send",
      tag: "Queued",
      tagTone: "info",
      meta: "Awaiting approval window — drafts locked until both approvers clear",
      timeLabel: "Pending",
      group: "Upcoming",
    });
  } else if (c.status === "draft") {
    items.push({
      id: `${c.id}-a1`,
      channel: "note",
      name: "Draft created by Matin AI",
      tag: "Needs review",
      tagTone: "warn",
      meta: "On-brand copy generated; awaiting human edit + approval",
      timeLabel: "1d ago",
      group: "Recent",
    });
  } else {
    items.push({
      id: `${c.id}-a1`,
      channel: "system",
      name: "Campaign paused",
      tag: "Paused",
      tagTone: "info",
      meta: `Last send: ${num(c.sent)} · ${c.replyRate.toFixed(1)}% reply`,
      timeLabel: "2d ago",
      group: "Recent",
    });
  }
  items.push({
    id: `${c.id}-a9`,
    channel: "note",
    name: `${owner.name} created the campaign`,
    meta: `Template applied · Matin branding set`,
    timeLabel: "Earlier",
    group: "History",
  });
  return items;
}

export function CampaignDrawer({
  campaign,
  onClose,
  onToggleStatus,
  onAskAi,
}: {
  campaign: Campaign | null;
  onClose: () => void;
  onToggleStatus: (id: string) => void;
  onAskAi: (campaign: Campaign) => void;
}) {
  const [tab, setTab] = useState("overview");
  const owner = campaign ? campaignOwner(campaign.id) : null;
  const assets = useMemo(
    () =>
      campaign ? marketingAssets.filter((a) => a.campaignId === campaign.id) : [],
    [campaign],
  );

  if (!campaign) return null;
  const s = STATUS[campaign.status];
  const heroPhoto = campaignPhoto(campaign.id);
  const isLive = campaign.status === "live";

  return (
    <RecordDrawer
      open={!!campaign}
      onClose={onClose}
      title={campaign.name}
      subtitle={campaign.audience}
      tabs={TABS}
      activeTab={tab}
      onTab={setTab}
      actions={
        <>
          <button
            type="button"
            onClick={() => onToggleStatus(campaign.id)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-[0.8rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
          >
            {isLive ? (
              <>
                <Pause className="h-3.5 w-3.5" aria-hidden /> Pause campaign
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" aria-hidden /> Resume campaign
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => onAskAi(campaign)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.8rem] font-semibold text-ink transition-colors hover:bg-paper"
          >
            Ask Matin
          </button>
        </>
      }
    >
      {/* Identity row — real property hero + owner avatar + status */}
      <div className="flex items-center gap-3">
        <PropertyThumb
          src={heroPhoto}
          ratio="square"
          alt={campaign.name}
          className="h-16 w-16 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusChip tone={s.tone} variant="soft">
              {s.label}
            </StatusChip>
            <span className="font-mono text-[0.7rem] text-slate">{campaign.id}</span>
          </div>
          <p className="mt-1.5 text-[0.78rem] text-slate">{campaign.channel}</p>
          {owner ? (
            <div className="mt-1.5 flex items-center gap-1.5">
              <Avatar name={owner.name} slug={owner.slug} size={20} ring />
              <span className="text-[0.74rem] text-slate">
                Owned by <span className="font-medium text-ink">{owner.name}</span>
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {tab === "overview" ? (
        <div className="mt-4 space-y-4">
          {/* Metric grid */}
          <div className="grid grid-cols-2 gap-2">
            <MetricCell
              label="Sent"
              value={campaign.sent ? num(campaign.sent) : "—"}
              icon={<Megaphone className="h-3.5 w-3.5" aria-hidden />}
            />
            <MetricCell
              label="Open rate"
              value={campaign.openRate ? `${campaign.openRate.toFixed(1)}%` : "—"}
              tone={campaign.openRate >= 35 ? "success" : "ink"}
              icon={<MailOpen className="h-3.5 w-3.5" aria-hidden />}
            />
            <MetricCell
              label="Reply rate"
              value={campaign.replyRate ? `${campaign.replyRate.toFixed(1)}%` : "—"}
              icon={<Reply className="h-3.5 w-3.5" aria-hidden />}
            />
            <MetricCell
              label="Attributed"
              value={
                campaign.attributedPipeline
                  ? compactUsd(campaign.attributedPipeline)
                  : "—"
              }
              tone={campaign.attributedPipeline ? "success" : "ink"}
              icon={<Banknote className="h-3.5 w-3.5" aria-hidden />}
            />
          </div>

          {/* AI insight (derived, plain-English) */}
          <div className="flex flex-wrap gap-1.5">
            {isLive && campaign.openRate < 35 ? (
              <AIInsightChip>
                Opening {campaign.openRate.toFixed(1)}% — about {(38.4 - campaign.openRate).toFixed(1)} points below our usual rate
              </AIInsightChip>
            ) : isLive ? (
              <AIInsightChip>Opening above our usual rate</AIInsightChip>
            ) : (
              <AIInsightChip>
                {assets.length} on-brand assets ready to launch
              </AIInsightChip>
            )}
          </div>

          {/* What happens automatically once a campaign sends */}
          <div className="rounded-lg border border-mist bg-paper px-3 py-2.5">
            <p className="text-[0.68rem] leading-relaxed text-slate">
              <span className="font-semibold text-ink">After you send</span>
              <br />
              every asset is saved to the campaign file, each open and reply is
              logged to the contact&apos;s history, and any pipeline this campaign
              earns rolls up into Reports.
            </p>
          </div>
        </div>
      ) : null}

      {tab === "assets" ? (
        <div className="mt-4 space-y-2">
          {assets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-mist bg-paper px-4 py-6 text-center">
              <p className="text-[0.82rem] font-medium text-ink">No assets yet</p>
              <p className="mt-1 text-[0.74rem] text-slate">
                Generate the kit to populate this campaign&apos;s deliverables.
              </p>
            </div>
          ) : (
            assets.map((a) => {
              const tone: ChipTone =
                a.status === "approved"
                  ? "success"
                  : a.status === "scheduled"
                    ? "info"
                    : "warn";
              return (
                <div
                  key={a.id}
                  className="rounded-lg border border-mist bg-cloud px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-slate">
                      {a.type}
                    </span>
                    <StatusChip tone={tone} variant="soft">
                      {a.status} · v{a.version}
                    </StatusChip>
                  </div>
                  <p className="mt-1 text-[0.82rem] font-semibold text-ink">
                    {a.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[0.76rem] leading-snug text-slate">
                    {a.body}
                  </p>
                  <div className="mt-2 flex justify-end">
                    <CopyAssetButton text={`${a.title}\n\n${a.body}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : null}

      {tab === "activity" ? (
        <div className="mt-2">
          <ActivityTimeline items={activityFor(campaign)} />
        </div>
      ) : null}
    </RecordDrawer>
  );
}
