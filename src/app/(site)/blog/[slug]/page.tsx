import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { allPosts, getPost, getRelatedPosts } from "@/lib/blog-data";
import { getAgent } from "@/lib/data";
import { cn } from "@/lib/utils";

/* ---- static params ---- */
export function generateStaticParams() {
  return allPosts.map((p) => ({ slug: p.slug }));
}

/* ---- metadata ---- */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Article not found — Matin Real Estate" };
  return {
    title: `${post.title} | Matin Real Estate`,
    description: post.excerpt,
  };
}

/* ---- page ---- */
export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const author = getAgent(post.authorSlug);
  const related = getRelatedPosts(slug);

  return (
    <>
      {/* ---- HERO ---- */}
      <div className="relative overflow-hidden bg-ink pt-20 pb-0 md:pt-28">
        <div className="absolute inset-0 grid-tech opacity-40" />
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-white/[0.04] blur-3xl" />
        <Container className="relative pb-10 md:pb-14">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All guides
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge tone="neutral" className="border border-white/20 bg-white/10 text-white/80">
              {post.category}
            </Badge>
            <span className="flex items-center gap-1.5 text-[0.8rem] text-white/50">
              <Clock className="h-3.5 w-3.5" /> {post.readTime}
            </span>
          </div>
          <h1 className="display-2 mt-5 max-w-3xl font-display text-white text-balance">
            {post.title}
          </h1>
          <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-white/70 text-pretty">
            {post.excerpt}
          </p>
        </Container>
        {/* Hero image bleed */}
        <div className="relative mt-8 aspect-[21/9] w-full overflow-hidden md:mt-10">
          <Image
            src={post.image}
            alt={post.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-paper via-transparent to-transparent" />
        </div>
      </div>

      {/* ---- BODY ---- */}
      <div className="bg-paper py-14 md:py-20">
        <Container>
          <div className="flex gap-12 lg:gap-16">

            {/* ---- MAIN COLUMN ---- */}
            <div className="min-w-0 flex-1 max-w-2xl">
              {/* Article body */}
              <div
                className="article-body text-[1.05rem]"
                dangerouslySetInnerHTML={{ __html: post.body }}
              />

              {/* ---- AUTHOR CARD ---- */}
              {author && (
                <div className="mt-12 border-t border-ink/[0.08] pt-10">
                  <div className="flex items-start gap-5 rounded-2xl bg-cloud p-6 shadow-soft ring-1 ring-ink/[0.06]">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-ink/[0.08]">
                      <Image
                        src={author.photo}
                        alt={author.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-semibold text-ink">{author.name}</p>
                      <p className="mt-0.5 text-[0.85rem] text-slate">{author.title}</p>
                      <p className="mt-2 line-clamp-3 text-[0.9rem] leading-relaxed text-slate">
                        {author.bio}
                      </p>
                      <Link
                        href="/contact"
                        className="mt-3 inline-flex items-center gap-1.5 text-[0.85rem] font-medium text-ink hover:underline"
                      >
                        Ask {author.firstName} a question{" "}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* ---- RELATED POSTS ---- */}
              {related.length > 0 && (
                <div className="mt-14">
                  <h2 className="font-display text-2xl font-semibold text-ink">
                    More from our blog
                  </h2>
                  <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                    {related.map((r) => (
                      <Link
                        key={r.slug}
                        href={`/blog/${r.slug}`}
                        className="group flex flex-col overflow-hidden rounded-2xl bg-cloud shadow-soft ring-1 ring-ink/[0.06] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
                      >
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <Image
                            src={r.image}
                            alt={r.title}
                            fill
                            sizes="(max-width: 640px) 100vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute left-3 top-3">
                            <Badge tone="azure">{r.category}</Badge>
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                          <p className="line-clamp-2 font-display text-[0.95rem] font-semibold leading-snug text-ink">
                            {r.title}
                          </p>
                          <span className="mt-3 flex items-center gap-1.5 text-[0.78rem] text-slate">
                            <Clock className="h-3 w-3 text-ink/40" /> {r.readTime}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* ---- CTA ---- */}
              <div className="mt-14 overflow-hidden rounded-3xl bg-ink px-8 py-10 text-center text-white shadow-glow ring-1 ring-white/[0.06]">
                <div className="relative z-10">
                  <p className="font-display text-xl font-semibold text-white">
                    Ready to make your move?
                  </p>
                  <p className="mx-auto mt-2 max-w-sm text-[0.95rem] text-white/75">
                    Talk to a Matin broker — free, no pressure, just answers.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <ButtonLink href="/contact" variant="white" size="md">
                      Contact a broker <ArrowRight className="h-4 w-4" />
                    </ButtonLink>
                    <ButtonLink href="/blog" variant="outline-light" size="md">
                      Browse all guides
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </div>

            {/* ---- TOC SIDEBAR (desktop only) ---- */}
            {post.toc.length > 0 && (
              <aside className="hidden lg:block w-56 xl:w-64 shrink-0">
                <div className="sticky top-24 rounded-2xl bg-cloud p-6 shadow-soft ring-1 ring-ink/[0.06]">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-slate">
                    In this article
                  </p>
                  <nav className="mt-4 flex flex-col gap-1">
                    {post.toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={cn(
                          "block rounded-lg py-1.5 text-sm text-slate transition-colors hover:text-ink",
                          item.level === 3 && "pl-3 text-[0.82rem]",
                          item.level === 2 && "pl-0 font-medium",
                        )}
                      >
                        {item.label}
                      </a>
                    ))}
                  </nav>
                  <div className="mt-6 border-t border-ink/[0.08] pt-5">
                    <p className="text-[0.78rem] text-slate">Have a question?</p>
                    <Link
                      href="/contact"
                      className="mt-2 inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-ink hover:underline"
                    >
                      Ask a broker <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </aside>
            )}

          </div>
        </Container>
      </div>
    </>
  );
}
