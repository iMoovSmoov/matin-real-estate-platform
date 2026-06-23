import Link from "next/link";
import Image from "next/image";
import { communities } from "@/lib/data";
import { compactUsd } from "@/lib/utils";
import type { Agent } from "@/lib/types";

const communityName = (slug: string) =>
  communities.find((c) => c.slug === slug)?.name ?? slug;

/* Faithful port of #w-agents grid tile: a 13px white card, a portrait photo
   header (object-top), then name / title, a hairline-divided stats row
   (volume · sold · brass star rating), and the served-area line. Links to the
   real /agents/[slug] profile. */
export function AgentCard({ agent }: { agent: Agent }) {
  const area = agent.communities.slice(0, 2).map(communityName).join(" · ");

  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-[13px] border border-ink/[0.08] bg-white transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2"
      style={{ boxShadow: "0 1px 2px rgba(20,20,22,.05), 0 10px 26px rgba(20,20,22,.06)" }}
    >
      {/* Photo — portrait, top-anchored */}
      <div className="relative h-[210px] w-full overflow-hidden bg-paper-200">
        <Image
          src={agent.photo}
          alt={agent.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
        <div className="truncate text-[15px] font-semibold leading-tight text-ink">{agent.name}</div>
        <div className="mt-0.5 truncate text-[12px] text-slate">{agent.title}</div>

        <div className="mt-3 flex items-center gap-3 border-t border-ink/[0.07] pt-3 text-[11.5px] tabular-nums text-slate">
          <span>
            <b className="font-semibold text-ink">{compactUsd(agent.volume)}</b> vol
          </span>
          <span>
            <b className="font-semibold text-ink">{agent.homesSold}</b> sold
          </span>
          <span className="ml-auto font-semibold text-[#c1934a]">&#9733; {agent.rating}</span>
        </div>

        {area && <div className="mt-2 truncate text-[11.5px] text-[#9a9aa0]">{area}</div>}
      </div>
    </Link>
  );
}
