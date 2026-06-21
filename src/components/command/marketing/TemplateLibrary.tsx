"use client";

import {
  Home,
  DoorOpen,
  TrendingDown,
  CircleCheck,
  Sprout,
  UserPlus,
  Award,
  Banknote,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusChip, PropertyThumb } from "@/components/os";
import {
  TEMPLATES,
  type TemplateKey,
  type MarketingTemplate,
} from "./marketing-data";

/* ──────────────────────────────────────────────────────────────────────────
   Marketing Studio — TemplateLibrary  (pane 1, ref §2.8 / wireframe 11)

   Approved brokerage templates as a selectable list. Selecting a row LOADS that
   template into the preview canvas (real state, owned by the page). Selected
   row = dark ink-filled (the "selected = dark-filled" rule). "Most popular"
   gold chip on the recommended Listing launch template (gold = AI/active only).

   Each row carries a small real property thumbnail + its channel coverage so
   the library reads like a real asset catalog, not a menu. Domain icons only
   (no Rocket/Star). Client (onSelect drives the page).
   ────────────────────────────────────────────────────────────────────────── */

const TEMPLATE_ICON: Record<TemplateKey, LucideIcon> = {
  "listing-launch": Home,
  "open-house": DoorOpen,
  "price-reduction": TrendingDown,
  "just-sold": CircleCheck,
  "seller-nurture": Sprout,
  recruiting: UserPlus,
  "agent-spotlight": Award,
  "cash-offer": Banknote,
};

function TemplateRow({
  t,
  selected,
  onSelect,
}: {
  t: MarketingTemplate;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = TEMPLATE_ICON[t.key];
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl border px-2.5 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
          selected
            ? "border-ink bg-ink text-cloud"
            : "border-mist bg-cloud hover:border-ink/20 hover:bg-paper",
        )}
      >
        {/* Real property thumbnail — stable per template */}
        <span className="relative shrink-0">
          <PropertyThumb
            seedIndex={t.seedIndex}
            ratio="square"
            alt={t.label}
            className="h-12 w-12 rounded-lg"
          />
          <span
            className={cn(
              "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-md ring-2 transition-colors",
              selected
                ? "bg-cloud text-ink ring-ink"
                : "bg-ink text-cloud ring-cloud",
            )}
          >
            <Icon className="h-3 w-3" aria-hidden />
          </span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
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
            <span className="truncate">{t.channels.join(" · ")}</span>
            <span aria-hidden>·</span>
            <span className="shrink-0">{t.assetCount} assets</span>
          </span>
        </span>
      </button>
    </li>
  );
}

export function TemplateLibrary({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (key: TemplateKey) => void;
}) {
  return (
    <div className="rounded-2xl border border-mist bg-cloud p-4 shadow-soft">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <h2 className="font-display text-[1.02rem] font-normal leading-tight text-ink">
          Template library
        </h2>
        <span className="tabular-nums text-[0.72rem] text-slate">
          {TEMPLATES.length} approved
        </span>
      </div>

      <p className="mb-3 px-1 text-[0.74rem] leading-snug text-slate">
        Brand-locked templates. Edits stay inside the approved kit — logo,
        colors, and disclosures can&apos;t be overridden.
      </p>

      <ul className="flex flex-col gap-1.5">
        {TEMPLATES.map((t) => (
          <TemplateRow
            key={t.key}
            t={t}
            selected={t.key === active}
            onSelect={() => onSelect(t.key)}
          />
        ))}
      </ul>
    </div>
  );
}
