"use client";

import {
  Rocket,
  DoorOpen,
  TrendingDown,
  BadgeCheck,
  Sprout,
  UserPlus,
  Star,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusChip } from "@/components/os";

/* ──────────────────────────────────────────────────────────────────────────
   Marketing Studio — TemplateLibrary  (pane 1, ref §2.8 / wireframe 11)

   Approved brokerage templates as a selectable list. Selected row = dark
   ink-filled (the "selected = dark-filled" rule). "Most popular" badge on the
   recommended Listing launch template. Each row carries its channel coverage
   so the library reads like a real asset catalog, not a menu. Client (onSelect).
   ────────────────────────────────────────────────────────────────────────── */

export type MarketingTemplate = {
  key: string;
  label: string;
  icon: typeof Rocket;
  blurb: string;
  channels: string;
  assetCount: number;
  popular?: boolean;
};

export const TEMPLATES: MarketingTemplate[] = [
  {
    key: "listing-launch",
    label: "Listing launch",
    icon: Rocket,
    blurb: "Coming-soon → live kit across every channel",
    channels: "Email · Social · Flyer · Ad · Web",
    assetCount: 11,
    popular: true,
  },
  {
    key: "open-house",
    label: "Open house",
    icon: DoorOpen,
    blurb: "Weekend invite + saved-search match blast",
    channels: "Email · Social · Flyer",
    assetCount: 6,
  },
  {
    key: "price-reduction",
    label: "Price reduction",
    icon: TrendingDown,
    blurb: "Re-engage saved searches on a price drop",
    channels: "Email · Social",
    assetCount: 4,
  },
  {
    key: "just-sold",
    label: "Just sold",
    icon: BadgeCheck,
    blurb: "Sphere proof + neighborhood valuation hook",
    channels: "Social · Flyer · Web",
    assetCount: 5,
  },
  {
    key: "seller-nurture",
    label: "Seller nurture",
    icon: Sprout,
    blurb: "Home-value drip for the likely-seller list",
    channels: "Email · Social",
    assetCount: 7,
  },
  {
    key: "recruiting",
    label: "Recruiting",
    icon: UserPlus,
    blurb: "Top-producer outreach + careers landing",
    channels: "Ad · Web · Email",
    assetCount: 4,
  },
  {
    key: "agent-spotlight",
    label: "Agent spotlight",
    icon: Star,
    blurb: "Production milestone + review highlight reel",
    channels: "Social · Web",
    assetCount: 3,
  },
  {
    key: "cash-offer",
    label: "Cash offer",
    icon: Banknote,
    blurb: "48-hour offer funnel + net-sheet explainer",
    channels: "Ad · Email · Web",
    assetCount: 5,
  },
];

export function TemplateLibrary({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-mist bg-cloud p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <h2 className="font-display text-[1.02rem] font-normal leading-tight text-ink">
          Template library
        </h2>
        <span className="text-[0.72rem] text-slate tabular-nums">
          {TEMPLATES.length} approved
        </span>
      </div>

      <p className="mb-3 px-1 text-[0.74rem] leading-snug text-slate">
        Brand-locked templates. Edits stay inside the approved kit — logo, colors,
        and disclosures can&apos;t be overridden.
      </p>

      <ul className="flex flex-col gap-1.5">
        {TEMPLATES.map((t) => {
          const selected = t.key === active;
          const Icon = t.icon;
          return (
            <li key={t.key}>
              <button
                type="button"
                onClick={() => onSelect(t.key)}
                aria-pressed={selected}
                className={cn(
                  "group flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
                  selected
                    ? "border-ink bg-ink text-cloud"
                    : "border-mist bg-cloud hover:border-ink/20 hover:bg-paper",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition-colors",
                    selected
                      ? "bg-ink-700 text-cloud ring-ink-600"
                      : "bg-paper-200 text-slate ring-mist",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "truncate text-[0.86rem] font-semibold leading-tight",
                        selected ? "text-cloud" : "text-ink",
                      )}
                    >
                      {t.label}
                    </span>
                    {t.popular ? (
                      <StatusChip tone="gold" variant="soft" className="shrink-0">
                        Most popular
                      </StatusChip>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block truncate text-[0.74rem] leading-tight",
                      selected ? "text-slate-300" : "text-slate",
                    )}
                  >
                    {t.blurb}
                  </span>
                  <span
                    className={cn(
                      "mt-1 flex items-center gap-1.5 text-[0.68rem] leading-none tabular-nums",
                      selected ? "text-slate-300/80" : "text-slate/80",
                    )}
                  >
                    <span>{t.channels}</span>
                    <span aria-hidden>·</span>
                    <span>{t.assetCount} assets</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
