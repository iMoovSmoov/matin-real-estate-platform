import Image from "next/image";
import { Container } from "@/components/ui/section";
import { cn } from "@/lib/utils";

type Stat = {
  value: string;
  label: string;
};

export function EditorialHero({
  eyebrow,
  title,
  intro,
  image,
  imageAlt,
  stats = [],
  children,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  image: string;
  imageAlt: string;
  stats?: Stat[];
  children?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <section className={cn("relative isolate flex min-h-[58vh] items-end overflow-hidden bg-ink", className)}>
      <Image
        src={image}
        alt={imageAlt}
        fill
        priority
        sizes="100vw"
        className="ken-burns -z-10 object-cover"
      />
      <div className="-z-10 absolute inset-0 bg-gradient-to-t from-ink/86 via-ink/42 to-ink/22" />
      <div className="-z-10 absolute inset-0 bg-gradient-to-r from-ink/78 via-ink/34 to-transparent" />
      <div className="-z-10 absolute inset-0 opacity-[0.18] grid-tech" />

      <Container className={cn("relative z-10 pb-12 pt-28 sm:pb-16 sm:pt-32", align === "center" && "text-center")}>
        <div className={cn("max-w-3xl", align === "center" && "mx-auto")}>
          <span className="eyebrow eyebrow-light">{eyebrow}</span>
          <h1 className="hero-text-shadow mt-5 font-display text-[clamp(2.55rem,5.2vw,4.7rem)] font-normal leading-[1.01] text-white text-balance">
            {title}
          </h1>
          {intro ? (
            <p className={cn("mt-5 max-w-2xl text-base leading-relaxed text-white/82 text-pretty sm:text-lg", align === "center" && "mx-auto")}>
              {intro}
            </p>
          ) : null}
          {children ? <div className="mt-7">{children}</div> : null}
          {stats.length ? (
            <div className={cn("mt-8 flex flex-wrap gap-x-9 gap-y-4 border-t border-white/18 pt-6", align === "center" && "justify-center")}>
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="font-display text-3xl leading-none text-white tabular-nums">{s.value}</div>
                  <div className="mt-1 text-[0.78rem] text-white/62">{s.label}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
