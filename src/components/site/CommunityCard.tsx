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
      <div className="relative overflow-hidden rounded-2xl aspect-[3/2] w-full">
        <Image
          src={community.thumb}
          alt={community.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Gradient overlay + text */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="font-display text-white font-semibold text-lg leading-tight">{community.name}</div>
              <div className="text-[0.72rem] uppercase tracking-wider text-white/70">{community.state}</div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-white/0 -translate-y-1 transition-all duration-300 group-hover:translate-y-0 group-hover:text-white" />
          </div>
          <div className="mt-2 flex items-center gap-3 text-white/80 text-xs">
            <span>Median {compactUsd(community.medianPrice)}</span>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span>{community.activeListings} active</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
