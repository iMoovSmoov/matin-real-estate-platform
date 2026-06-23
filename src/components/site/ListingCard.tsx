import Link from "next/link";
import Image from "next/image";
import { usd, num } from "@/lib/utils";
import { listingPhoto } from "@/lib/data";
import type { Listing } from "@/lib/types";

export function ListingCard({ listing }: { listing: Listing }) {
  // Use the shared resolver so a listing with no `photos` still shows a real,
  // deterministic exterior (prevents a broken/undefined <Image src> on the
  // ~26 photoless Active/Pending listings that appear in Property Search).
  const hero = listingPhoto(listing);
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-[14px] border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,20,22,.05),0_14px_36px_rgba(20,20,22,.08)] transition-shadow hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    >
      <div className="relative h-[218px] overflow-hidden">
        <Image
          src={hero}
          alt={listing.address}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink/55 px-2.5 py-1 text-[0.68rem] font-semibold text-white backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-[#56e0a0]" />
          {listing.status === "Active" ? "For Sale" : listing.status}
        </span>
      </div>

      <div className="p-[18px]">
        <div className="flex items-baseline justify-between gap-3">
          <div className="font-display text-[1.45rem] font-medium leading-none text-ink">{usd(listing.price)}</div>
          <div className="truncate text-[0.75rem] text-slate">{listing.city}, {listing.state}</div>
        </div>
        <div className="mt-2 truncate text-[0.9rem] font-medium text-ink/80">{listing.address}</div>
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-ink/[0.07] pt-4 text-[0.78rem] text-slate">
          <span className="flex items-center gap-1.5">
            <b className="font-semibold text-ink">{listing.beds}</b> bd
          </span>
          <span className="flex items-center gap-1.5">
            <b className="font-semibold text-ink">{listing.baths}</b> ba
          </span>
          <span className="flex items-center gap-1.5">
            <b className="font-semibold text-ink">{num(listing.sqft)}</b> sqft
          </span>
        </div>
      </div>
    </Link>
  );
}
