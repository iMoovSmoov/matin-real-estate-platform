import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Agent } from "@/lib/types";

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-cloud shadow-soft ring-1 ring-ink/[0.06] transition-all duration-500 hover:-translate-y-1 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure"
    >
      {/* Photo — portrait (4:5) at all sizes */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-paper-200">
        <Image
          src={agent.photo}
          alt={agent.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
        />
        {/* Persistent gradient at bottom for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
        {/* Leadership badge pinned to top-right */}
        {agent.leadership && (
          <div className="absolute left-3 top-3">
            <Badge tone="azure">Leadership</Badge>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1">
          <div className="font-semibold text-[0.95rem] leading-snug text-ink">{agent.name}</div>
          <div className="mt-0.5 text-[0.8rem] text-slate">{agent.title}</div>
          {agent.specialties.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {agent.specialties.slice(0, 2).map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-paper px-2.5 py-0.5 text-[0.7rem] font-medium text-slate ring-1 ring-ink/[0.08]"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-ink/[0.07] pt-3 text-[0.78rem] text-ink/70">
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-azure text-azure" /> {agent.rating}
          </span>
          <span className="text-slate">{agent.licenses.join(" · ")}</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[0.78rem] font-semibold tracking-wide text-ink/60 transition-all duration-300 group-hover:text-ink group-hover:translate-x-0.5">
          <span className="link-underline">View profile</span>
          <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
        </div>
      </div>
    </Link>
  );
}
