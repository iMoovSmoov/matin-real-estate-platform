"use client";

import type { ReactNode } from "react";
import { MatinMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Systems Health — VendorMark (ref §2.11 ticket 1)

   Replaces the 2-letter gray tokens in the integration grid with REAL,
   recognizable vendor marks rendered as compact inline SVG inside a WHITE chip
   (FUB / Lofty / Sierra / RMLS-NWMLS / SkySlope / Dotloop / DocuSign / Meta /
   Google / SendGrid / OpenAI / Anthropic / Gemini / Make / n8n / Zapier /
   Supabase / Airtable / Twilio / QuickBooks). The owned "MatinRealEstate.com
   IDX" connector uses the real Matin mark.

   Each mark is a brand-colored glyph (no external image fetch, print/SSR-safe).
   The white chip + brand color is what makes the grid read as a real
   integrations marketplace (FUB pattern: "logos supply the color").
   ────────────────────────────────────────────────────────────────────────── */

type MarkRender = (size: number) => ReactNode;

/* Brand glyphs — simplified, recognizable, single-color where a wordmark would
   be noisy. Colors are each vendor's real brand hue. */
const MARKS: Record<string, { color: string; render: MarkRender }> = {
  "follow up boss": {
    color: "#0B5CD5",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#0B5CD5" />
        <path d="M8 7h8v2.4H10.4V12H15v2.4h-4.6V18H8V7Z" fill="#fff" />
      </svg>
    ),
  },
  lofty: {
    color: "#5A33E6",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#5A33E6" />
        <path d="M8 6.5h2.6v8.6H16V18H8V6.5Z" fill="#fff" />
      </svg>
    ),
  },
  "sierra interactive": {
    color: "#16A34A",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#0F7A36" />
        <path d="m6 16 4-8 3 5 2-3 3 6H6Z" fill="#7BE0A0" />
      </svg>
    ),
  },
  "rmls + nwmls": {
    color: "#B91C1C",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#B91C1C" />
        <path d="M5 17V7l3.5 5L12 7v10" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" fill="none" />
        <path d="M15 7v10h4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  skyslope: {
    color: "#0EA5E9",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#0C4A6E" />
        <path d="m5 17 7-10 7 10H5Z" fill="#38BDF8" />
        <circle cx="12" cy="9" r="1.6" fill="#fff" />
      </svg>
    ),
  },
  dotloop: {
    color: "#1AAE9F",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#0E8C80" />
        <path d="M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 3.2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6Z" fill="#fff" />
      </svg>
    ),
  },
  docusign: {
    color: "#D8B500",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#FFCB00" />
        <path d="M7 9h7M7 12h10M7 15c2-2 4 2 6 0s3-1 4 0" stroke="#1B1B1B" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  meta: {
    color: "#0866FF",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#0866FF" />
        <path d="M6 15c0-3.6 1.6-6 3.4-6 2.4 0 3 4.2 5.2 4.2 1.2 0 1.8-1 1.8-2.2 0-1.4-.8-2.2-1.7-2.2-1.9 0-3 3.3-4.9 3.3" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  google: {
    color: "#4285F4",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#fff" stroke="#E5E7EB" strokeWidth="1" />
        <path d="M12 10.6v2.9h4.1c-.2 1-1.5 2.9-4.1 2.9a4.4 4.4 0 1 1 0-8.8c1.3 0 2.2.5 2.7 1l2-1.9A7.3 7.3 0 1 0 12 19.3c4.2 0 7-2.9 7-7a7 7 0 0 0-.1-1.7H12Z" fill="#4285F4" />
      </svg>
    ),
  },
  sendgrid: {
    color: "#1A82E2",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#fff" stroke="#E5E7EB" />
        <rect x="6" y="6" width="6" height="6" fill="#99E1F4" />
        <rect x="12" y="6" width="6" height="6" fill="#1A82E2" />
        <rect x="6" y="12" width="6" height="6" fill="#1A82E2" />
        <rect x="12" y="12" width="6" height="6" fill="#00B3E3" />
      </svg>
    ),
  },
  openai: {
    color: "#0F0F0F",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#0D0D0D" />
        <path d="M12 6.5a3 3 0 0 1 5.1 1.6 3 3 0 0 1-.4 4.6 3 3 0 0 1-5 1.7 3 3 0 0 1-5.1-1.6 3 3 0 0 1 .4-4.6A3 3 0 0 1 12 6.5Z" stroke="#fff" strokeWidth="1.3" fill="none" />
      </svg>
    ),
  },
  anthropic: {
    color: "#D97757",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#141413" />
        <path d="M9.5 7 6 17h2.2l.8-2.3h3.2L13 17h2.2L11.7 7H9.5Zm-.1 6 1.1-3.1L11.6 13H9.4Z" fill="#D97757" />
        <path d="M14.4 7 18 17h-2.2L14.4 7Z" fill="#D97757" opacity="0.55" />
      </svg>
    ),
  },
  gemini: {
    color: "#1C7DFF",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#fff" stroke="#E5E7EB" />
        <path d="M12 5c.4 3.6 3.4 6.6 7 7-3.6.4-6.6 3.4-7 7-.4-3.6-3.4-6.6-7-7 3.6-.4 6.6-3.4 7-7Z" fill="#1C7DFF" />
      </svg>
    ),
  },
  make: {
    color: "#6D00CC",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#2B0A52" />
        <path d="M6 17V7h1.8l2 5 2-5h1.8v10h-1.7v-5.6L10 16h-.4l-1.9-4.6V17H6Z" fill="#A865FF" />
        <rect x="15" y="7" width="1.8" height="10" rx="0.9" fill="#A865FF" />
      </svg>
    ),
  },
  n8n: {
    color: "#EA4B71",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#1A1A1A" />
        <circle cx="7" cy="12" r="2" fill="#EA4B71" />
        <circle cx="12" cy="8.5" r="1.6" fill="#EA4B71" />
        <circle cx="12" cy="15.5" r="1.6" fill="#EA4B71" />
        <circle cx="17" cy="12" r="2" fill="#EA4B71" />
        <path d="M9 12h6M9 12l1.5-3M9 12l1.5 3M15 12l-1.5-3M15 12l-1.5 3" stroke="#EA4B71" strokeWidth="1" />
      </svg>
    ),
  },
  zapier: {
    color: "#FF4F00",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#FF4F00" />
        <path d="M12 6v3.2m0 5.6V18m6-6h-3.2M9.2 12H6m4.2-4.2 2.3 2.3m1.3 5.8 2.3 2.3M7.7 16.3l2.3-2.3m5.8-1.3 2.3-2.3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2.2" fill="#fff" />
      </svg>
    ),
  },
  "supabase postgres": {
    color: "#3ECF8E",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#1C1C1C" />
        <path d="M13 5 7 13h4v6l6-8h-4V5Z" fill="#3ECF8E" />
      </svg>
    ),
  },
  airtable: {
    color: "#FCB400",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#fff" stroke="#E5E7EB" />
        <path d="m12 6 6 2.4-6 2.4-6-2.4L12 6Z" fill="#FCB400" />
        <path d="M6 10.2 11.4 12.4V18L6 15.6v-5.4Z" fill="#18BFFF" />
        <path d="M18 10.2 12.6 12.4V18L18 15.6v-5.4Z" fill="#F82B60" />
      </svg>
    ),
  },
  twilio: {
    color: "#F22F46",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#fff" stroke="#E5E7EB" />
        <circle cx="12" cy="12" r="6.4" fill="#F22F46" opacity="0.12" />
        <circle cx="9.6" cy="9.6" r="1.7" fill="#F22F46" />
        <circle cx="14.4" cy="9.6" r="1.7" fill="#F22F46" />
        <circle cx="9.6" cy="14.4" r="1.7" fill="#F22F46" />
        <circle cx="14.4" cy="14.4" r="1.7" fill="#F22F46" />
      </svg>
    ),
  },
  quickbooks: {
    color: "#2CA01C",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#2CA01C" />
        <circle cx="12" cy="12" r="6.2" stroke="#fff" strokeWidth="1.8" fill="none" />
        <path d="M11 8.5v7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M13 8.5v7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
};

/** Resolve the mark key from a provider/connector name (case-insensitive). */
function resolveKey(provider: string): string | null {
  const p = provider.trim().toLowerCase();
  if (MARKS[p]) return p;
  // Loose contains-match for compound provider strings.
  for (const key of Object.keys(MARKS)) {
    const head = key.split(/[ /+(]/)[0];
    if (p.includes(head)) return key;
  }
  return null;
}

export function VendorMark({
  provider,
  name,
  size = 26,
  className,
}: {
  /** The connector's provider field (e.g. "Follow Up Boss", "Make"). */
  provider: string;
  /** The connector display name — used to detect the owned IDX connector. */
  name?: string;
  size?: number;
  className?: string;
}) {
  const isMatin = (name ?? "").toLowerCase().includes("matinrealestate") || provider.toLowerCase().includes("matin");
  const key = isMatin ? null : resolveKey(provider);
  const inner = size - 8;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-cloud ring-1 ring-inset ring-mist shadow-soft",
        className,
      )}
      style={{ width: size + 8, height: size + 8 }}
    >
      {isMatin ? (
        <MatinMark theme="dark" className="!h-[18px] w-auto" />
      ) : key ? (
        MARKS[key].render(inner)
      ) : (
        <span
          className="font-bold uppercase leading-none text-slate"
          style={{ fontSize: inner * 0.42 }}
        >
          {provider.slice(0, 2)}
        </span>
      )}
    </span>
  );
}
