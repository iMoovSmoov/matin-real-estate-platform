"use client";

import Link from "next/link";
import { ArrowRight, BedDouble, Bath, Ruler } from "lucide-react";
import { Avatar, PropertyThumb, StatusChip, type ChipTone } from "@/components/os";
import { featuredListings, listingPhoto, getAgent } from "@/lib/data";
import { usd, num } from "@/lib/utils";
import type { Listing } from "@/lib/types";

/* ──────────────────────────────────────────────────────────────────────────
   Today — Featured listings carousel (§4 · §1)

   Image-led, data-bound: every hero is the listing's REAL photo (listingPhoto
   resolves photos[0]), and the whole card links to that listing's record at
   /listings/<id>. Status is carried by color (Active=success, Pending=warn,
   Sold=ink terminal, Coming Soon/New=info). 3-up grid on desktop; a 1.1-card
   horizontal snap-scroll rail on phone.
   ────────────────────────────────────────────────────────────────────────── */

const STATUS_TONE: Record<string, ChipTone> = {
  Active: "success",
  Pending: "warn",
  Sold: "ink",
  "Coming Soon": "info",
  New: "info",
};

function domLabel(l: Listing): string {
  if (l.status === "Sold") return "Sold";
  if (l.daysOnMarket <= 0) return "Just listed";
  return `${l.daysOnMarket} ${l.daysOnMarket === 1 ? "day" : "days"} on market`;
}

export function FeaturedListings() {
  return (
    <section className="card-elevated p-5">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[1.2rem] font-normal leading-tight text-ink">
            Featured listings
          </h2>
          <p className="mt-0.5 text-[0.78rem] text-slate tabular-nums">
            {featuredListings.length} active across the brokerage
          </p>
        </div>
        <Link
          href="/hub/listing-launch"
          className="inline-flex shrink-0 items-center gap-1 text-[0.76rem] font-semibold text-slate transition-colors hover:text-ink"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {/* Phone: snap rail (≈1.1 cards visible). sm+: equal grid (3-up at lg). */}
      <div className="mt-4 -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden [&>*]:min-w-[82%] [&>*]:snap-start sm:[&>*]:min-w-0">
        {featuredListings.map((l) => {
          const agent = getAgent(l.agentSlug);
          return (
            <Link
              key={l.id}
              href={`/listings/${l.id}`}
              className="card-elevated group flex min-w-0 flex-col overflow-hidden"
            >
              <div className="relative">
                <PropertyThumb
                  src={listingPhoto(l)}
                  ratio="video"
                  rounded={false}
                  alt={l.address}
                  className="transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <span className="absolute left-3 top-3">
                  <StatusChip tone={STATUS_TONE[l.status] ?? "info"} variant="solid">
                    {l.status}
                  </StatusChip>
                </span>
              </div>

              <div className="flex min-w-0 flex-1 flex-col p-4">
                <p className="font-sans text-[1.15rem] font-bold leading-none text-ink tabular-nums">
                  {usd(l.price)}
                </p>
                <p className="mt-1.5 truncate text-[0.84rem] font-medium text-ink">{l.address}</p>
                <p className="truncate text-[0.74rem] text-slate">
                  {l.city}, {l.state}
                </p>

                <div className="mt-3 flex items-center gap-3 text-[0.74rem] text-slate tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <BedDouble className="h-3.5 w-3.5" aria-hidden /> {l.beds}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Bath className="h-3.5 w-3.5" aria-hidden /> {l.baths}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Ruler className="h-3.5 w-3.5" aria-hidden /> {num(l.sqft)} sqft
                  </span>
                </div>

                <div className="mt-auto flex items-center gap-2 pt-3.5">
                  <Avatar name={agent?.name ?? l.agentSlug} slug={l.agentSlug} size={24} ring />
                  <span className="min-w-0 flex-1 truncate text-[0.72rem] text-slate">
                    {agent ? `Listed by ${agent.firstName}` : "Matin Real Estate"}
                  </span>
                  <span className="shrink-0 text-[0.72rem] font-medium text-slate tabular-nums">
                    {domLabel(l)}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
