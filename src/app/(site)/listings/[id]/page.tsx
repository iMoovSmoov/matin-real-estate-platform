import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  BedDouble, Bath, Maximize, Ruler, CalendarDays, Home, Landmark, Car,
  TrendingUp, Clock, Hash, Check, MapPin, Phone, Mail, ArrowRight, ChevronRight,
  Star, CalendarCheck,
} from "lucide-react";
import { Container, Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ListingCard } from "@/components/site/ListingCard";
import { Gallery } from "@/components/site/property/Gallery";
import { getListing, getAgent, getCommunity, listings, listingsInCommunity } from "@/lib/data";
import { usd, num } from "@/lib/utils";

export function generateStaticParams() {
  return listings.map((l) => ({ id: l.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = getListing(id);
  if (!listing) return { title: "Listing not found — Matin Real Estate" };
  return {
    title: `${listing.address}, ${listing.city} — ${usd(listing.price)} | Matin Real Estate`,
    description: listing.description,
  };
}

function monthlyPayment(price: number) {
  const down = price * 0.2;
  const principal = price - down;
  const r = 0.068 / 12;
  const n = 30 * 12;
  const m = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(m);
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = getListing(id);
  if (!listing) notFound();

  const agent = getAgent(listing.agentSlug);
  const community = getCommunity(listing.communitySlug);
  const more = listingsInCommunity(listing.communitySlug).filter((l) => l.id !== listing.id).slice(0, 3);
  const monthly = monthlyPayment(listing.price);

  const facts: { icon: typeof BedDouble; label: string; value: string }[] = [
    { icon: BedDouble, label: "Bedrooms", value: `${listing.beds}` },
    { icon: Bath, label: "Bathrooms", value: `${listing.baths}` },
    { icon: Maximize, label: "Square feet", value: num(listing.sqft) },
    { icon: Ruler, label: "Lot size", value: listing.lotSize },
    { icon: CalendarDays, label: "Year built", value: `${listing.yearBuilt}` },
    { icon: Home, label: "Type", value: listing.type },
    { icon: Car, label: "Garage", value: listing.garage ? `${listing.garage}-car` : "None" },
    { icon: Landmark, label: "HOA", value: listing.hoa ? `${usd(listing.hoa)}/mo` : "None" },
    { icon: TrendingUp, label: "Price / sqft", value: `$${num(listing.pricePerSqft)}` },
    { icon: Clock, label: "Days on market", value: listing.daysOnMarket === 0 ? "New" : `${listing.daysOnMarket}` },
    { icon: Hash, label: "MLS #", value: listing.mlsId },
  ];

  return (
    <>
      {/* ---------- BREADCRUMB ---------- */}
      <div className="border-b border-ink/[0.06] bg-paper pt-24 pb-4">
        <Container>
          <nav className="flex flex-wrap items-center gap-1.5 text-[0.82rem] text-slate">
            <Link href="/property-search" className="hover:text-ink">Property search</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            {community ? (
              <Link href={`/communities/${community.slug}`} className="hover:text-ink">{community.name}</Link>
            ) : (
              <span>{listing.city}</span>
            )}
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink/80">{listing.address}</span>
          </nav>
        </Container>
      </div>

      {/* ---------- GALLERY ---------- */}
      <div className="w-full overflow-hidden px-0 sm:px-6 lg:px-8 pt-8">
        <div className="mx-auto max-w-screen-xl">
          <Gallery photos={listing.photos} alt={`${listing.address}, ${listing.city}`} />
        </div>
      </div>

      <Section className="pt-8 md:pt-12 lg:pt-14">
        <Container>
          <div className="grid gap-8 lg:gap-12 lg:grid-cols-[1fr_360px]">
            {/* ===== MAIN COLUMN ===== */}
            <div>
              {/* Header */}
              <div className="border-b border-ink/[0.08] pb-8">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status={listing.status} />
                  {listing.daysOnMarket === 0 && (
                    <span className="rounded-full bg-azure/10 px-2.5 py-0.5 text-[0.72rem] font-semibold uppercase tracking-wide text-azure">
                      Just listed
                    </span>
                  )}
                </div>
                <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl md:text-4xl lg:text-5xl leading-none tracking-tight">
                  {usd(listing.price)}
                </h1>
                {listing.pricePerSqft > 0 && (
                  <p className="mt-1 font-display text-base text-slate sm:text-lg">
                    <span className="text-ink/50">${num(listing.pricePerSqft)}/sqft</span>
                  </p>
                )}
                <p className="mt-3 flex items-center gap-1.5 text-base sm:text-lg text-ink/80">
                  <MapPin className="h-4 w-4 shrink-0 text-azure" /> {listing.address}
                </p>
                <p className="mt-0.5 text-slate">{listing.city}, {listing.state} {listing.zip}</p>

                {/* Quick stats row */}
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <StatPill icon={BedDouble} value={listing.beds} label="beds" />
                  <StatPill icon={Bath} value={listing.baths} label="baths" />
                  <StatPill icon={Maximize} value={num(listing.sqft)} label="sqft" />
                  {listing.garage > 0 && <StatPill icon={Car} value={listing.garage} label="garage" />}
                </div>
              </div>

              {/* Key facts grid */}
              <div className="mt-8 sm:mt-10">
                <h2 className="font-display text-xl sm:text-2xl text-ink">Property details</h2>
                <dl className="mt-5 sm:mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-ink/[0.06] ring-1 ring-ink/[0.06] sm:grid-cols-3">
                  {facts.map((f) => (
                    <div key={f.label} className="bg-cloud p-4 sm:p-5">
                      <dt className="flex items-center gap-2 text-[0.78rem] uppercase tracking-wide text-slate">
                        <f.icon className="h-4 w-4 shrink-0 text-azure" /> {f.label}
                      </dt>
                      <dd className="mt-2 font-display text-lg sm:text-xl text-ink">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Description */}
              <div className="mt-8 sm:mt-12">
                <h2 className="font-display text-xl sm:text-2xl text-ink">About this home</h2>
                <p className="mt-4 sm:mt-5 max-w-prose text-base leading-relaxed text-ink/85 text-pretty">{listing.description}</p>
              </div>

              {/* Features */}
              {listing.features.length > 0 && (
                <div className="mt-8 sm:mt-12">
                  <h2 className="font-display text-xl sm:text-2xl text-ink">Features &amp; highlights</h2>
                  <ul className="mt-5 sm:mt-6 grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2">
                    {listing.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-3 text-[0.94rem] sm:text-[0.95rem] text-ink/85 py-1">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-azure/10 text-azure">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Payment estimate */}
              <div className="mt-8 sm:mt-12 rounded-2xl bg-gradient-to-br from-ink to-ink-700 p-6 sm:p-8 text-white shadow-lift">
                <span className="eyebrow-light">Payment estimate</span>
                <div className="mt-4 flex flex-wrap items-end gap-2 sm:gap-3">
                  <span className="font-display text-3xl sm:text-4xl lg:text-5xl text-white">{usd(monthly)}</span>
                  <span className="pb-1 sm:pb-1.5 text-white/70">/ month</span>
                </div>
                <p className="mt-4 max-w-md text-[0.88rem] sm:text-[0.9rem] leading-relaxed text-slate-300">
                  Estimated principal &amp; interest with 20% down ({usd(Math.round(listing.price * 0.2))}) on a 30-year
                  fixed at ~6.8%. Taxes, insurance and HOA not included. For illustration only.
                </p>
                <div className="mt-5 sm:mt-6 flex flex-wrap gap-4 sm:gap-6 border-t border-white/10 pt-4 sm:pt-5 text-sm">
                  <div>
                    <div className="text-white/60">Down payment</div>
                    <div className="mt-0.5 font-display text-base sm:text-lg text-white">{usd(Math.round(listing.price * 0.2))}</div>
                  </div>
                  <div>
                    <div className="text-white/60">Loan amount</div>
                    <div className="mt-0.5 font-display text-base sm:text-lg text-white">{usd(Math.round(listing.price * 0.8))}</div>
                  </div>
                  <div>
                    <div className="text-white/60">Rate / term</div>
                    <div className="mt-0.5 font-display text-base sm:text-lg text-white">6.8% · 30yr</div>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="mt-8 sm:mt-12">
                <h2 className="font-display text-xl sm:text-2xl text-ink">Location</h2>
                <div className="mt-5 sm:mt-6 overflow-hidden rounded-2xl shadow-soft ring-1 ring-ink/[0.06]">
                  <iframe
                    title={`Map of ${listing.address}`}
                    src={`https://www.google.com/maps?q=${listing.lat},${listing.lng}&z=14&output=embed`}
                    className="h-48 sm:h-64 md:h-[400px] w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>

            {/* ===== AGENT SIDEBAR ===== */}
            <aside className="mt-8 lg:mt-0 lg:sticky lg:top-28 lg:self-start">
              {agent ? (
                <div className="overflow-hidden rounded-2xl bg-cloud shadow-lift ring-1 ring-ink/[0.06]">
                  {/* Agent photo + info strip */}
                  <div className="flex items-center gap-4 border-b border-ink/[0.07] p-5">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-azure/20">
                      <Image
                        src={agent.photo}
                        alt={agent.name}
                        fill
                        sizes="64px"
                        className="object-cover object-top"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-azure">
                        Listing agent
                      </div>
                      <h3 className="mt-0.5 font-display text-xl text-ink leading-tight">{agent.name}</h3>
                      <p className="text-[0.82rem] text-slate truncate">{agent.title}</p>
                      {agent.rating > 0 && (
                        <div className="mt-1 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-[0.75rem] font-medium text-ink/70">{agent.rating.toFixed(1)}</span>
                          {agent.reviews > 0 && (
                            <span className="text-[0.72rem] text-slate">({agent.reviews})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact links */}
                  <div className="space-y-2 px-5 py-4 border-b border-ink/[0.07]">
                    <a href={`tel:${agent.phone}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.88rem] text-ink/85 transition hover:bg-azure/5 hover:text-azure">
                      <Phone className="h-4 w-4 text-azure shrink-0" /> {agent.phone}
                    </a>
                    <a href={`mailto:${agent.email}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.88rem] text-ink/85 transition hover:bg-azure/5 hover:text-azure break-all">
                      <Mail className="h-4 w-4 text-azure shrink-0" /> {agent.email}
                    </a>
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-col gap-2.5 p-5">
                    <ButtonLink href={`/agents/${agent.slug}`} variant="primary" className="w-full">
                      <CalendarCheck className="h-4 w-4" /> Schedule a Showing
                    </ButtonLink>
                    <ButtonLink href={`/agents/${agent.slug}`} variant="outline" className="w-full">
                      View agent profile <ArrowRight className="h-4 w-4" />
                    </ButtonLink>
                  </div>

                  {/* Agent stats */}
                  {(agent.homesSold > 0 || agent.yearsExperience > 0) && (
                    <div className="grid grid-cols-2 divide-x divide-ink/[0.07] border-t border-ink/[0.07]">
                      <div className="px-5 py-3 text-center">
                        <div className="font-display text-xl text-ink">{agent.homesSold}</div>
                        <div className="text-[0.68rem] uppercase tracking-wide text-slate">Homes sold</div>
                      </div>
                      <div className="px-5 py-3 text-center">
                        <div className="font-display text-xl text-ink">{agent.yearsExperience}yr</div>
                        <div className="text-[0.68rem] uppercase tracking-wide text-slate">Experience</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl bg-cloud p-6 shadow-soft ring-1 ring-ink/[0.06]">
                  <h3 className="font-display text-xl text-ink">Interested in this home?</h3>
                  <p className="mt-2 text-[0.9rem] text-slate">Connect with a Matin broker to schedule a private showing.</p>
                  <ButtonLink href="/agents" variant="primary" className="mt-5 w-full">
                    <CalendarCheck className="h-4 w-4" /> Schedule a Showing
                  </ButtonLink>
                </div>
              )}

              {community && (
                <Link
                  href={`/communities/${community.slug}`}
                  className="group mt-4 block overflow-hidden rounded-2xl shadow-soft ring-1 ring-ink/[0.06]"
                >
                  <div className="relative aspect-[16/9]">
                    <Image src={community.thumb} alt={community.name} fill sizes="360px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="text-[0.72rem] uppercase tracking-wider text-white/70">Explore the area</div>
                      <div className="font-display text-2xl">{community.name}</div>
                    </div>
                  </div>
                </Link>
              )}
            </aside>
          </div>
        </Container>
      </Section>

      {/* ---------- SIMILAR LISTINGS ---------- */}
      {more.length > 0 && (
        <Section className="bg-paper-200/60 pt-0">
          <Container>
            <div className="flex items-end justify-between gap-6 border-t border-ink/[0.07] pt-10 sm:pt-16">
              <div>
                <span className="eyebrow">Similar homes</span>
                <h2 className="mt-3 font-display text-2xl sm:text-3xl text-ink">
                  You may also like
                </h2>
                <p className="mt-1.5 text-[0.9rem] text-slate">
                  More homes in {community ? community.name : listing.city}
                </p>
              </div>
              {community && (
                <ButtonLink href={`/communities/${community.slug}`} variant="outline" className="hidden shrink-0 sm:inline-flex">
                  View community <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              )}
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
            {community && (
              <div className="mt-8 text-center sm:hidden">
                <ButtonLink href={`/communities/${community.slug}`} variant="outline">
                  View all in {community.name} <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
            )}
          </Container>
        </Section>
      )}
    </>
  );
}

function StatPill({ icon: Icon, value, label }: { icon: typeof BedDouble; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-cloud px-4 py-2 shadow-soft ring-1 ring-ink/[0.07]">
      <Icon className="h-4 w-4 text-azure shrink-0" />
      <span className="font-display text-base text-ink">{value}</span>
      <span className="text-[0.78rem] text-slate">{label}</span>
    </div>
  );
}
