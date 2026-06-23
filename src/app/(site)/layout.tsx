import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AskMatin } from "@/components/site/AskMatin";
import { MobileNav } from "@/components/site/MobileNav";

/*
  Public site shell.

  Header modes (handled inside <SiteHeader/> via the route — no per-page wiring):
    • Home ("/")  → transparent overlay, FIXED over the page's full-bleed hero
                    (white nav), solidifying into the translucent paper bar on
                    scroll. The Home hero must be the first, full-bleed element.
    • All others  → STICKY translucent paper bar (ink nav) that occupies normal
                    flow, so page content begins just below it (no top padding
                    needed).

  <main> carries no top padding by design: the sticky inner-page bar already
  reserves its own space, and Home wants its hero flush to the top.
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
