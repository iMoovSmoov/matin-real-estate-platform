import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  MapPin, TrendingUp, Clock, GraduationCap, Footprints, Home, DollarSign, ArrowRight, ChevronRight,
} from "lucide-react";
import { Container, Section } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ListingCard } from "@/components/site/ListingCard";
import { communities, getCommunity, listingsInCommunity } from "@/lib/data";
import { usd, num, cn } from "@/lib/utils";

export function generateStaticParams() {
  return communities.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const community = getCommunity(slug);
  if (!community) return { title: "Community not found — Matin Real Estate" };
  return {
    title: `${community.fullName} Real Estate — Homes & Market | Matin Real Estate`,
    description: community.blurb,
  };
}

export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const community = getCommunity(slug);
  if (!community) notFound();

  const homes = listingsInCommunity(community.slug);

  const stats: { icon: typeof Home; value: string; label: string }[] = [
    { icon: DollarSign, value: usd(community.medianPrice), label: "Median price" },
    { icon: TrendingUp, value: `$${num(community.medianPpsf)}`, label: "Median $/sqft" },
    { icon: Clock, value: `${community.avgDaysOnMarket} days`, label: "Avg. on market" },
    { icon: GraduationCap, value: `${community.schoolRating}/10`, label: "School rating" },
    { icon: Footprints, value: `${community.walkScore}`, label: "Walk score" },
    { icon: TrendingUp, value: `${community.yoyAppreciation > 0 ? "+" : ""}${community.yoyAppreciation}%`, label: "YoY appreciation" },
    { icon: Home, value: `${num(community.activeListings)}`, label: "Active listings" },
  ];

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="relative flex min-h-[58vh] items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={community.hero}
            alt={community.fullName}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/30" />
        </div>
        <Container className="relative z-10 pb-12 pt-20 sm:pt-28">
          <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-[0.82rem] text-white/70">
            <Link href="/communities" className="hover:text-white">Communities</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white/90">{community.name}</span>
          </nav>
          <span className="flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-azure-bright">
            <MapPin className="h-4 w-4" /> {community.county} County · {community.state}
          </span>
          <h1 className="display-1 mt-4 font-display text-white text-balance">{community.name}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/85 text-pretty">{community.blurb}</p>
          {community.vibe.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {community.vibe.map((v) => (
                <span key={v} className="rounded-full bg-white/10 px-3.5 py-1.5 text-[0.8rem] font-medium text-white ring-1 ring-white/20 backdrop-blur-sm">
                  {v}
                </span>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* ---------- STATS ROW ---------- */}
      <div className="border-b border-ink/[0.07] bg-cloud">
        <Container>
          <dl className="grid grid-cols-2 gap-y-6 py-10 sm:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={cn(
                  "px-2 text-center",
                  // 7th item: span both columns on mobile so it's centered rather than left-orphaned
                  i === 6 && "col-span-2 sm:col-span-1",
                )}
              >
                <s.icon className="mx-auto h-5 w-5 text-azure" />
                <dt className="mt-2 font-display text-2xl text-ink md:text-[1.7rem]">{s.value}</dt>
                <dd className="mt-0.5 text-[0.76rem] leading-tight text-slate">{s.label}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </div>

      {/* ---------- LISTINGS ---------- */}
      <Section className="py-14 md:py-16">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow">For sale</span>
              <h2 className="display-3 mt-3 font-display text-ink">Homes in {community.name}</h2>
            </div>
            {homes.length > 0 && (
              <Badge tone="azure">{homes.length} {homes.length === 1 ? "listing" : "listings"}</Badge>
            )}
          </div>

          {homes.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {homes.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          ) : (
            <div className="mt-10 flex flex-col items-center justify-center rounded-2xl bg-cloud px-6 py-16 text-center shadow-soft ring-1 ring-ink/[0.06]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-azure/10 text-azure">
                <Home className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-display text-2xl text-ink">No active listings in {community.name} right now</h3>
              <p className="mt-2 max-w-md text-[0.95rem] text-slate">
                This is a fast-moving market — new homes come on often. Set up an alert or browse nearby communities.
              </p>
              <ButtonLink href="/property-search" variant="primary" size="md" className="mt-6">
                Browse all listings <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          )}
        </Container>
      </Section>

      {/* ---------- CTA ---------- */}
      <Section className="pb-24 pt-0">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-azure-deep via-azure to-azure-bright px-6 py-12 text-center text-white shadow-glow sm:px-8 sm:py-14 md:px-16">
            <div className="absolute inset-0 grid-tech opacity-20" />
            <div className="relative">
              <h2 className="display-3 font-display text-white text-balance">Thinking about {community.name}?</h2>
              <p className="mx-auto mt-4 max-w-xl text-[1.05rem] text-white/90">
                Our brokers live and work in {community.name}. Get an honest read on the market, schools, and what your
                budget really buys here.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
                <ButtonLink href="/agents" variant="white" size="lg">Talk to a local broker</ButtonLink>
                <ButtonLink href="/communities" variant="outline-light" size="lg">Explore more communities</ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
