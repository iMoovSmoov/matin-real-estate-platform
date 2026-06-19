import { Container } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden bg-white py-20 text-center">
          {/* Decorative background number */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none font-display text-[clamp(14rem,40vw,26rem)] font-light leading-none text-ink/[0.04]"
          >
            404
          </span>

          <Container className="relative z-10 flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-3">
              <span className="eyebrow">Page not found</span>
              <div className="rule-accent mx-auto" />
            </div>

            <h1 className="display-2 max-w-lg text-balance text-ink">
              We couldn&apos;t find that page
            </h1>

            <p className="max-w-md text-base leading-relaxed text-slate sm:text-lg">
              The page you&apos;re looking for doesn&apos;t exist or may have
              been moved. Try searching for a property or head back home.
            </p>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="/" variant="primary" size="lg">
                Go home
              </ButtonLink>
              <ButtonLink href="/property-search" variant="outline" size="lg">
                Search listings
              </ButtonLink>
            </div>
          </Container>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
