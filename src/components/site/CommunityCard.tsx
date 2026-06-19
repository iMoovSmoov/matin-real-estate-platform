import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { compactUsd } from "@/lib/utils";
import type { Community } from "@/lib/types";

export function CommunityCard({ community, large = false }: { community: Community; large?: boolean }) {
  return (
    <Link
      href={`/communities/${community.slug}`}
      className={`group relative block overflow-hidden rounded-2xl ${large ? "aspect-[4/5] md:aspect-auto" : "aspect-[4/5]"}`}
    >
      <Image
        src={community.thumb}
        alt={community.name}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent opacity-90" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-display text-2xl leading-tight">{community.name}</div>
            <div className="text-[0.78rem] uppercase tracking-wider text-white/70">{community.state}</div>
          </div>
          <ArrowUpRight className="h-5 w-5 -translate-y-1 text-white/0 transition-all duration-300 group-hover:translate-y-0 group-hover:text-white" />
        </div>
        <div className="mt-2 flex items-center gap-3 text-[0.8rem] text-white/85">
          <span>Median {compactUsd(community.medianPrice)}</span>
          <span className="h-1 w-1 rounded-full bg-white/40" />
          <span>{community.activeListings} active</span>
        </div>
      </div>
    </Link>
  );
}
