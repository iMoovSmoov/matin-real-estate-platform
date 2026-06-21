"use client";

import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — SavedViewTabs   (ref §1.5)

   FUB-style saved-view pill tabs above a list: `Label (count)`.
   Active = ink fill, ink text on inactive; counts in lighter gray.
   The primary list filter on every list surface. Client (onChange).
   ────────────────────────────────────────────────────────────────────────── */

export type SavedView = {
  key: string;
  label: string;
  count?: number;
};

export function SavedViewTabs({
  views,
  active,
  onChange,
  className,
}: {
  views: SavedView[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Saved views"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      {views.map((v) => {
        const isActive = v.key === active;
        return (
          <button
            key={v.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(v.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8rem] font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
              isActive
                ? "bg-ink text-cloud"
                : "text-slate hover:bg-paper-200 hover:text-ink",
            )}
          >
            <span>{v.label}</span>
            {typeof v.count === "number" ? (
              <span
                className={cn(
                  "tabular-nums text-[0.72rem] font-semibold",
                  isActive ? "text-cloud/70" : "text-slate/70",
                )}
              >
                {v.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
