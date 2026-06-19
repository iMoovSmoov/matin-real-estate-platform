import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Clock, BookOpen } from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { BlogGrid, type Post } from "@/components/site/marketing/BlogGrid";

export const metadata: Metadata = {
  title: "Resources & Guides | Matin Real Estate",
  description:
    "Expert real-estate guides for Oregon and SW Washington buyers and sellers — from closing costs and home inspections to selling fast and short sales.",
};

const B = "/matin/brand";

const featured: Post = {
  title: "Selling Your Home in Oregon: The 2026 Playbook",
  category: "Selling",
  excerpt:
    "Pricing, prep, marketing, and timing — the complete, no-nonsense guide to selling your Oregon home for top dollar, straight from the team that moves 305+ homes a year.",
  readTime: "9 min read",
  image: `${B}/14584-home-selling-oregon-preview.jpg`,
};

const posts: Post[] = [
  {
    title: "Closing Costs in Oregon: What You'll Actually Pay",
    category: "Buying",
    excerpt: "A clear, line-by-line breakdown of buyer and seller closing costs in Oregon — and which ones are negotiable.",
    readTime: "6 min read",
    image: `${B}/14838-closing-costs-oregon-preview.jpg`,
  },
  {
    title: "Home Inspections, Demystified",
    category: "Buying",
    excerpt: "What inspectors look for, which red flags actually matter, and how to use findings to negotiate.",
    readTime: "5 min read",
    image: `${B}/6737-home-inspections-preview.jpg`,
  },
  {
    title: "The Ultimate House-Hunting Checklist",
    category: "Buying",
    excerpt: "Stay organized and decisive on every tour with the checklist our buyer's agents swear by.",
    readTime: "4 min read",
    image: `${B}/17391-house-hunting-checklist-preview.jpg`,
  },
  {
    title: "Types of Mortgages: Which Loan Fits You?",
    category: "Financing",
    excerpt: "Conventional, FHA, VA, jumbo — a plain-English guide to the loan that matches your situation.",
    readTime: "7 min read",
    image: `${B}/6748-types-of-mortgages-preview.jpg`,
  },
  {
    title: "Short Sales Explained for Oregon Homeowners",
    category: "Selling",
    excerpt: "How short sales work, when they make sense, and what to expect from lenders and timelines.",
    readTime: "8 min read",
    image: `${B}/17945-short-sales-preview.jpg`,
  },
  {
    title: "Home Appraisals: How Value Gets Set",
    category: "Selling",
    excerpt: "What appraisers measure, why deals hinge on it, and how to prepare for a clean appraisal.",
    readTime: "5 min read",
    image: `${B}/18072-home-appraisals-preview.jpg`,
  },
  {
    title: "The Final Walkthrough: Your Last-Minute Checklist",
    category: "Buying",
    excerpt: "The 12 things to verify before you sign — so move-in day brings zero surprises.",
    readTime: "4 min read",
    image: `${B}/15964-final-walkthrough-preview.jpg`,
  },
  {
    title: "How to Sell Your House Fast (Without Leaving Money Behind)",
    category: "Selling",
    excerpt: "Speed and price aren't a trade-off when you do it right. Here's how to sell quickly and well.",
    readTime: "6 min read",
    image: `${B}/17930-how-to-sell-fast-preview.jpg`,
  },
];

const categories = ["Buying", "Selling", "Financing"];

export default function BlogPage() {
  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-ink pb-20 pt-24 text-white md:pb-24 md:pt-36">
        <div className="absolute inset-0 grid-tech opacity-50" />
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-azure/20 blur-3xl" />
        <Container className="relative">
          <div className="max-w-2xl">
            <Reveal>
              <span className="eyebrow eyebrow-light">Resources &amp; guides</span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="display-1 mt-5 font-display text-white text-balance">
                Know more, move{" "}
                <span className="italic text-azure-bright">smarter.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 text-base leading-relaxed text-slate-300 text-pretty sm:text-lg">
                Straight-talking guides for Oregon and SW Washington buyers and sellers — written by the team
                that closes hundreds of homes a year. No fluff, no jargon.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ---------- FEATURED POST ---------- */}
      <Section>
        <Container>
          <Reveal>
            <a
              href="#"
              className="group grid overflow-hidden rounded-3xl bg-cloud shadow-soft ring-1 ring-ink/[0.06] transition-all duration-500 hover:shadow-lift lg:grid-cols-2"
            >
              <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[24rem]">
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/30 to-transparent" />
              </div>
              <div className="flex flex-col justify-center p-8 md:p-12">
                <div className="flex items-center gap-2">
                  <Badge tone="azure">Featured</Badge>
                  <Badge tone="neutral">{featured.category}</Badge>
                </div>
                <h2 className="mt-5 font-display text-3xl leading-tight text-ink text-balance md:text-[2.2rem]">
                  {featured.title}
                </h2>
                <p className="mt-4 text-[1.02rem] leading-relaxed text-slate">{featured.excerpt}</p>
                <div className="mt-6 flex items-center gap-4">
                  <span className="inline-flex items-center gap-2 font-medium text-azure-deep">
                    Read the playbook
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                  <span className="flex items-center gap-1.5 text-[0.85rem] text-slate">
                    <Clock className="h-4 w-4 text-azure" /> {featured.readTime}
                  </span>
                </div>
              </div>
            </a>
          </Reveal>
        </Container>
      </Section>

      {/* ---------- GRID + FILTERS ---------- */}
      <Section className="bg-paper-200/60 pt-0">
        <Container>
          <div className="flex items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Latest guides"
              title="Everything you need to move with confidence"
            />
            <span className="hidden shrink-0 items-center gap-2 text-[0.85rem] text-slate sm:inline-flex">
              <BookOpen className="h-4 w-4 text-azure" /> {posts.length} guides &amp; counting
            </span>
          </div>
          <div className="mt-12">
            <BlogGrid posts={posts} categories={categories} />
          </div>
        </Container>
      </Section>

      {/* ---------- CTA ---------- */}
      <Section className="pb-28">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-ink px-8 py-16 text-center text-white shadow-glow ring-1 ring-white/[0.06] md:px-16">
            <div className="absolute inset-0 grid-tech opacity-20" />
            <div className="relative">
              <span className="eyebrow eyebrow-light">Still have questions?</span>
              <h2 className="display-2 mt-4 font-display text-white text-balance">
                Get answers from a real broker — or our AI
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
                Reading is a great start. When you&apos;re ready for advice tailored to your home and your
                timeline, we&apos;re here.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/contact" variant="white" size="lg">
                  Talk to a broker <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink href="/sell" variant="outline-light" size="lg">
                  <ArrowRight className="h-4 w-4" /> Get your home value
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
