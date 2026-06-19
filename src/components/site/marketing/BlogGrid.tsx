"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

export type Post = {
  title: string;
  category: string;
  excerpt: string;
  readTime: string;
  image: string;
};

export function BlogGrid({ posts, categories }: { posts: Post[]; categories: string[] }) {
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? posts : posts.filter((p) => p.category === active);
  const chips = ["All", ...categories];

  return (
    <div>
      {/* category chips */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0">
        {chips.map((c) => {
          const on = active === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setActive(c)}
              aria-pressed={on}
              className={cn(
                "rounded-full px-4 py-2 text-[0.85rem] font-medium transition",
                on
                  ? "bg-azure text-white shadow-soft"
                  : "bg-cloud text-ink/70 ring-1 ring-ink/10 hover:ring-ink/30",
              )}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* grid */}
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p, i) => (
          <Reveal key={p.title} delay={(i % 3) * 0.07}>
            <a
              href="#"
              className="group flex h-full flex-col overflow-hidden rounded-2xl bg-cloud shadow-soft ring-1 ring-ink/[0.06] transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute left-3 top-3">
                  <Badge tone="azure">{p.category}</Badge>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="line-clamp-2 font-display text-lg leading-snug text-ink">{p.title}</h3>
                <p className="mt-2 flex-1 line-clamp-3 text-[0.9rem] leading-relaxed text-slate">{p.excerpt}</p>
                <div className="mt-5 flex items-center justify-between border-t border-ink/[0.07] pt-4">
                  <span className="flex items-center gap-1.5 text-[0.8rem] text-slate">
                    <Clock className="h-3.5 w-3.5 text-azure" /> {p.readTime}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[0.85rem] font-medium text-azure-deep">
                    Read
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
