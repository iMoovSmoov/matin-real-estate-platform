import Link from "next/link";
import Image from "next/image";
import { BedDouble, Bath, Maximize, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { usd, num } from "@/lib/utils";
import type { Listing } from "@/lib/types";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block rounded-2xl overflow-hidden border border-ink/[0.08] bg-white hover:shadow-lift transition-shadow"
    >
      {/* Image */}
      <div className="relative overflow-hidden rounded-t-2xl aspect-[4/3]">
        <Image
          src={listing.photos[0]}
          alt={listing.address}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <StatusBadge status={listing.status} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="font-display font-bold text-xl text-ink">{usd(listing.price)}</div>
        <div className="mt-1 text-sm font-medium text-ink truncate">{listing.address}</div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-slate truncate">
          <MapPin className="h-3 w-3 shrink-0" />
          {listing.city}, {listing.state}
        </div>
        <div className="mt-3 flex items-center gap-3 border-t border-ink/[0.07] pt-3 text-xs text-slate flex-wrap">
          <span className="flex items-center gap-1.5">
            <BedDouble className="h-4 w-4 text-azure" /> {listing.beds} bd
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="h-4 w-4 text-azure" /> {listing.baths} ba
          </span>
          <span className="flex items-center gap-1.5">
            <Maximize className="h-4 w-4 text-azure" /> {num(listing.sqft)} sf
          </span>
        </div>
      </div>
    </Link>
  );
}
