import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AskMatin } from "@/components/site/AskMatin";
import { MobileNav } from "@/components/site/MobileNav";

/*
  Public site shell.

  Header modes (handled inside <SiteHeader/> via the route — no per-page wiring;
  see OVERLAY_ROUTES there):
    • Full-bleed-hero pages — Home ("/"), Sell, Communities, Agents → transparent
                    overlay, FIXED over the page's full-bleed dark hero (white
                    nav), solidifying into the translucent paper bar on scroll.
                    These pages MUST lead with that full-bleed hero element.
    • All others  → STICKY translucent paper bar (ink nav) that occupies normal
                    flow, so page content begins just below it (no top padding
                    needed) — matching the design's inner-page navs.

  <main> carries no top padding by design: the sticky inner-page bar already
  reserves its own space, and the overlay pages want their hero flush to the top.
*/
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 pb-16 outline-none sm:pb-0">
        {children}
      </main>
      <SiteFooter />
      <AskMatin />
      <MobileNav />
    </>
  );
}
