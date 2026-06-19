import Link from "next/link";
import Image from "next/image";
import { Star, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Agent } from "@/lib/types";

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="group block overflow-hidden rounded-2xl bg-cloud shadow-soft ring-1 ring-ink/[0.06] transition-all duration-500 hover:-translate-y-1 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-paper-200">
        <Image
          src={agent.photo}
          alt={agent.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute bottom-3 left-3 right-3 flex translate-y-2 items-center gap-2 text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <Phone className="h-3.5 w-3.5" />
          <span className="text-[0.78rem]">{agent.phone}</span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-medium text-ink">{agent.name}</div>
            <div className="text-[0.82rem] text-slate">{agent.title}</div>
          </div>
          {agent.leadership && <Badge tone="azure">Leadership</Badge>}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-ink/[0.07] pt-3 text-[0.8rem] text-ink/70">
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-azure text-azure" /> {agent.rating}
          </span>
          <span>{agent.licenses.join(" · ")}</span>
        </div>
      </div>
    </Link>
  );
}
