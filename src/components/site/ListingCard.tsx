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
      className="group block overflow-hidden rounded-2xl bg-cloud shadow-soft ring-1 ring-ink/[0.06] transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={listing.photos[0]}
          alt={listing.address}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
        <div className="absolute left-3 top-3">
          <StatusBadge status={listing.status} />
        </div>
        <div className="absolute bottom-3 left-3 text-white">
          <div className="font-display text-2xl drop-shadow">{usd(listing.price)}</div>
        </div>
      </div>
      <div className="p-4">
        <div className="font-medium text-ink">{listing.address}</div>
        <div className="mt-0.5 flex items-center gap-1 text-sm text-slate">
          <MapPin className="h-3.5 w-3.5" /> {listing.city}, {listing.state}
        </div>
        <div className="mt-3 flex items-center gap-4 border-t border-ink/[0.07] pt-3 text-sm text-ink/75">
          <span className="flex items-center gap-1.5">
            <BedDouble className="h-4 w-4 text-azure" /> {listing.beds}
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="h-4 w-4 text-azure" /> {listing.baths}
          </span>
          <span className="flex items-center gap-1.5">
            <Maximize className="h-4 w-4 text-azure" /> {num(listing.sqft)} sf
          </span>
        </div>
      </div>
    </Link>
  );
}
