import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { compactUsd } from "@/lib/utils";
import type { Community } from "@/lib/types";

export function CommunityCard({ community, large = false }: { community: Community; large?: boolean }) {
  return (
    <Link
      href={`/communities/${community.slug}`}
      className={`group block overflow-hidden rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure ${large ? "aspect-[4/5] md:aspect-auto" : ""}`}
    >
      {/* Image with overlay */}
      <div className="relative overflow-hidden rounded-2xl aspect-[4/3] w-full sm:aspect-[3/2]">
        <Image
          src={community.thumb}
          alt={community.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {/* Gradient overlay + text */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent group-hover:from-ink/70 group-hover:via-ink/25 transition-all duration-300 p-3 sm:p-4">
          <div className="flex items-end justify-between gap-1">
            <div className="min-w-0">
              <div className="font-display text-white font-semibold text-[0.82rem] leading-tight sm:text-base">{community.name}</div>
              <div className="text-[0.65rem] uppercase tracking-wider text-white/60 sm:text-[0.72rem]">{community.state}</div>
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-white/0 -translate-y-0.5 transition-all duration-200 group-hover:translate-x-1 group-hover:translate-y-0 group-hover:text-white sm:h-5 sm:w-5" />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-white/65 text-[0.6rem] sm:text-[0.72rem]">
            <span>Median {compactUsd(community.medianPrice)}</span>
            <span className="h-1 w-1 rounded-full bg-white/35" />
            <span>{community.activeListings} active</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
