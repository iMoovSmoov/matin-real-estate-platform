import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { company, popularCommunities } from "@/lib/data";

function SocialIcon({ kind }: { kind: "facebook" | "instagram" | "linkedin" }) {
  const paths: Record<string, React.ReactNode> = {
    facebook: <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />,
    instagram: <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 3.68A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4zm6.41-10.4a1.44 1.44 0 1 1-1.44-1.44 1.44 1.44 0 0 1 1.44 1.44z" />,
    linkedin: <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.8 0 0 .78 0 1.73v20.53C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.74V1.73C24 .78 23.2 0 22.22 0z" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      {paths[kind]}
    </svg>
  );
}

const cols = [
  {
    title: "Explore",
    links: [
      ["Buy a home", "/buy"],
      ["Sell a home", "/sell"],
      ["Property search", "/property-search"],
      ["Communities", "/communities"],
      ["Our agents", "/agents"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About Matin", "/about"],
      ["Contact", "/contact"],
      ["Blog & resources", "/blog"],
      ["Cash offer", "/sell#cash-offer"],
      ["Matin Hub", "/command-center"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo className="h-10 text-white" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-300">
            {company.tagline} {company.stats.annualVolume} in annual sales and the largest locally owned real estate
            website in the Portland area.
          </p>
          <div className="mt-6 flex gap-3">
            {([
              ["facebook", company.social.facebook],
              ["instagram", company.social.instagram],
              ["linkedin", company.social.linkedin],
            ] as const).map(([kind, href]) => (
              <a
                key={kind}
                href={href}
                aria-label={kind}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-azure hover:text-white"
              >
                <SocialIcon kind={kind} />
              </a>
            ))}
          </div>
        </div>

        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="font-display text-lg">{c.title}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="transition hover:text-azure-bright">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="font-display text-lg">Visit us</h4>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-azure" />
              {company.address.street}, {company.address.city}, {company.address.state} {company.address.zip}
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-azure" />
              <a href="tel:+15036229624" className="hover:text-white">
                {company.phone}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-azure" />
              <a href={`mailto:${company.email}`} className="hover:text-white">
                {company.email}
              </a>
            </li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            {popularCommunities.slice(0, 4).map((c) => (
              <Link
                key={c.slug}
                href={`/communities/${c.slug}`}
                className="rounded-full border border-white/12 px-2.5 py-1 text-[0.72rem] text-slate-300 hover:border-azure/60 hover:text-white"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-[0.78rem] text-slate-300 md:flex-row">
          <p>
            © {company.founded}–2026 {company.name}. Equal Housing Opportunity. Licensed in OR & WA.
          </p>
          <p className="text-slate-300/70">
            {company.address.street}, {company.address.city}, {company.address.state} · {company.phone}
          </p>
        </div>
      </div>
    </footer>
  );
}
