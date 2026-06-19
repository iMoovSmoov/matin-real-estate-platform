import Link from "next/link";
import Image from "next/image";
import { BedDouble, Bath, Maximize } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { usd, num } from "@/lib/utils";
import type { Listing } from "@/lib/types";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block rounded-xl overflow-hidden bg-cloud ring-1 ring-ink/[0.06] shadow-soft transition-shadow duration-200 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure"
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3] w-full">
        <Image
          src={listing.photos[0]}
          alt={listing.address}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover w-full transition-transform duration-700 group-hover:scale-[1.04]"
        />
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <StatusBadge status={listing.status} />
        </div>
        {/* Subtle vignette on hover */}
        <div className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/[0.04]" />
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5">
        <div className="font-display font-bold text-xl text-ink tracking-tight">{usd(listing.price)}</div>
        <div className="mt-1.5 text-sm font-medium text-ink/90 line-clamp-1">{listing.address}</div>
        <div className="mt-0.5 text-xs text-slate line-clamp-1">
          {listing.city}, {listing.state}
        </div>
        <div className="mt-3.5 flex items-center gap-3 border-t border-ink/[0.07] pt-3.5 text-sm text-slate">
          <span className="flex items-center gap-1.5">
            <BedDouble className="h-3.5 w-3.5" /> {listing.beds} bd
          </span>
          <span aria-hidden className="text-ink/20">·</span>
          <span className="flex items-center gap-1.5">
            <Bath className="h-3.5 w-3.5" /> {listing.baths} ba
          </span>
          <span aria-hidden className="text-ink/20">·</span>
          <span className="flex items-center gap-1.5">
            <Maximize className="h-3.5 w-3.5" /> {num(listing.sqft)} sf
          </span>
        </div>
      </div>
    </Link>
  );
}
