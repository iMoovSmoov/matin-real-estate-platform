"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { compactUsd, cn } from "@/lib/utils";
import type { Community } from "@/lib/types";

// ---- lifestyle tag colours -----------------------------------------------
const TAG_STYLES: Record<string, string> = {
  "Family-friendly": "bg-amber-50 text-amber-800 ring-amber-200/70",
  "Family":          "bg-amber-50 text-amber-800 ring-amber-200/70",
  "Walkable":        "bg-emerald-50 text-emerald-800 ring-emerald-200/70",
  "Top Schools":     "bg-blue-50 text-blue-800 ring-blue-200/70",
  "Waterfront":      "bg-sky-50 text-sky-800 ring-sky-200/70",
  "Golf":            "bg-emerald-50 text-emerald-800 ring-emerald-200/70",
  "Luxury":          "bg-violet-50 text-violet-800 ring-violet-200/70",
  "New Construction":"bg-orange-50 text-orange-800 ring-orange-200/70",
  "Investment":      "bg-teal-50 text-teal-800 ring-teal-200/70",
  "Commuter":        "bg-slate-50 text-slate-700 ring-slate-200/70",
  "Wine Country":    "bg-purple-50 text-purple-800 ring-purple-200/70",
  "Acreage":         "bg-lime-50 text-lime-800 ring-lime-200/70",
};

function tagClass(tag: string) {
  return TAG_STYLES[tag] ?? "bg-paper-200 text-ink/70 ring-ink/10";
}

// ---- per-community stats override ----------------------------------------
const STATS_OVERRIDE: Record<string, { median: number; dom: number; active: number }> = {
  "west-linn-or":    { median: 750_000,  dom: 18, active: 24  },
  "lake-oswego-or":  { median: 850_000,  dom: 14, active: 31  },
  "beaverton-or":    { median: 495_000,  dom: 22, active: 45  },
  "portland-or":     { median: 620_000,  dom: 19, active: 28  },
  "happy-valley-or": { median: 680_000,  dom: 20, active: 38  },
  "hillsboro-or":    { median: 540_000,  dom: 24, active: 52  },
  "oregon-city-or":  { median: 480_000,  dom: 28, active: 19  },
  "tualatin-or":     { median: 560_000,  dom: 21, active: 33  },
  "tigard-or":       { median: 510_000,  dom: 23, active: 27  },
  "sherwood-or":     { median: 590_000,  dom: 26, active: 22  },
  "wilsonville-or":  { median: 625_000,  dom: 25, active: 18  },
  "vancouver-wa":    { median: 470_000,  dom: 20, active: 41  },
  "camas-wa":        { median: 650_000,  dom: 17, active: 29  },
  "ridgefield-wa":   { median: 580_000,  dom: 23, active: 16  },
  "salem-or":        { median: 380_000,  dom: 30, active: 55  },
  "mcminnville-or":  { median: 430_000,  dom: 32, active: 24  },
  "newberg-or":      { median: 445_000,  dom: 29, active: 21  },
  "milwaukie-or":    { median: 490_000,  dom: 16, active: 30  },
};

export function CommunityCard({
  community,
  large = false,
}: {
  community: Community;
  large?: boolean;
}) {
  const override = STATS_OVERRIDE[community.slug];
  const median  = override?.median  ?? community.medianPrice;
  const dom     = override?.dom     ?? community.avgDaysOnMarket;
  const active  = override?.active  ?? community.activeListings;

  // Show up to 3 vibe tags
  const tags = community.vibe.slice(0, 3);

  return (
    <Link
      href={`/communities/${community.slug}`}
      className={cn(
        "card-luxury group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-ink/[0.07] shadow-soft",
        "transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:-translate-y-0.5",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure",
        large ? "aspect-[4/5] md:aspect-auto" : "",
      )}
    >
      {/* ---- Image ---- */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={community.thumb}
          alt={community.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
        {/* subtle top-right arrow badge */}
        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-soft backdrop-blur-sm transition-all duration-200 group-hover:opacity-100">
          <ArrowRight className="h-3.5 w-3.5 text-ink" />
        </div>
      </div>

      {/* ---- Body ---- */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Name */}
        <div>
          <p className="font-display text-[1.05rem] font-semibold leading-tight text-ink sm:text-lg">
            {community.name}
          </p>
          <p className="mt-0.5 text-[0.78rem] text-slate/80">{community.county} County · {community.state}</p>
        </div>

        {/* Lifestyle tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium ring-1",
                  tagClass(tag),
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Quick stats row */}
        <div className="mt-auto border-t border-ink/[0.06] pt-3">
          <dl className="grid grid-cols-3 gap-1 text-center">
            <div>
              <dt className="text-[0.62rem] uppercase tracking-wider text-slate/70">Median</dt>
              <dd className="mt-0.5 font-display text-[0.88rem] font-semibold text-ink">
                {compactUsd(median)}
              </dd>
            </div>
            <div>
              <dt className="text-[0.62rem] uppercase tracking-wider text-slate/70">Avg DOM</dt>
              <dd className="mt-0.5 font-display text-[0.88rem] font-semibold text-ink">{dom}d</dd>
            </div>
            <div>
              <dt className="text-[0.62rem] uppercase tracking-wider text-slate/70">Active</dt>
              <dd className="mt-0.5 font-display text-[0.88rem] font-semibold text-ink">{active}</dd>
            </div>
          </dl>
        </div>

        {/* Explore link */}
        <span className="inline-flex items-center gap-1 text-[0.8rem] font-medium text-azure transition-colors duration-150 group-hover:text-azure-deep">
          Explore <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
