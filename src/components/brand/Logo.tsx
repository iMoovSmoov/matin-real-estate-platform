import Image from "next/image";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Matin Real Estate brand marks

   Real assets on disk (verified):
     • logo-favicon-32x32.png  — the real Matin "M" mark (dark M on transparent)
     • logo-3586_logo_logo-white-20211102123653.png — the real white Matin
       "MATIN / REAL ESTATE" wordmark lockup (for dark backgrounds)

   ASSET BUG FIXED: the previous "dark-on-light wordmark" mapped to
   /matin/brand/logo-268-20240626125130.jpg, which is a **Willamette Valley MLS**
   logo (blue, "Multiple Listing Service") — NOT Matin. There is no real
   dark Matin wordmark on disk, so light-background contexts now render the real
   white Matin wordmark inside a small ink chip (never the MLS jpg). Both
   `theme="light"` and `theme="dark"` paths show only genuine Matin marks.
   ────────────────────────────────────────────────────────────────────────── */

const WHITE_WORDMARK = "/matin/brand/logo-3586_logo_logo-white-20211102123653.png";
const M_MARK = "/matin/brand/logo-favicon-32x32.png";

/** Matin "M" favicon mark — rendered from the real brand PNG.
 *  theme="white" → mark shown white (for dark backgrounds, inverted).
 *  theme="dark"  → mark shown dark/ink (native; for light backgrounds). */
export function MatinMark({
  className,
  theme = "white",
}: {
  className?: string;
  theme?: "white" | "dark";
}) {
  return (
    <Image
      src={M_MARK}
      alt="Matin Real Estate"
      width={32}
      height={32}
      className={cn("h-7 w-auto", className)}
      // The source PNG is a dark "M". Invert to pure white on dark surfaces.
      style={theme === "white" ? { filter: "brightness(0) invert(1)" } : undefined}
    />
  );
}

type LogoProps = {
  variant?: "full" | "mark";
  className?: string;
  theme?: "white" | "dark";
};

/**
 * Matin full logo / mark.
 *
 * - variant="mark"  → the "M" mark (theme-aware).
 * - variant="full":
 *     theme="white" (dark background) → real white Matin wordmark PNG, plain.
 *     theme="dark"  (light background) → real white Matin wordmark on a small
 *       ink chip — there is NO real dark Matin wordmark on disk, and the only
 *       dark-on-light asset we have is the Willamette Valley MLS jpg, which we
 *       must never render. The ink chip keeps the genuine Matin lockup legible
 *       on paper without inventing a fake mark.
 */
export function Logo({ variant = "full", className, theme = "white" }: LogoProps) {
  if (variant === "mark") return <MatinMark className={className} theme={theme} />;

  const img = (
    <Image
      src={WHITE_WORDMARK}
      alt="Matin Real Estate"
      width={200}
      height={50}
      className={cn("h-8 w-auto object-contain", className)}
      priority
    />
  );

  // Dark background: the white wordmark reads directly.
  if (theme === "white") return img;

  // Light background: the only true Matin wordmark is white, so seat it on a
  // small ink chip rather than showing the MLS jpg.
  return (
    <span className="inline-flex items-center rounded-md bg-ink px-3 py-1.5 align-middle">
      {img}
    </span>
  );
}
