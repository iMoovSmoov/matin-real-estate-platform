import { cn } from "@/lib/utils";

/** Matin Real Estate "M" monogram — recreated as a geometric SVG mark. */
export function MatinMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" fill="none" className={cn("h-8 w-auto", className)} aria-hidden>
      <path
        d="M12 92 V14 L60 66 L108 14 V92"
        stroke="currentColor"
        strokeWidth="13"
        strokeLinejoin="miter"
        strokeLinecap="butt"
      />
      <path d="M60 66 L60 40" stroke="currentColor" strokeWidth="13" strokeLinecap="butt" />
    </svg>
  );
}

type LogoProps = {
  variant?: "full" | "stacked" | "mark";
  className?: string;
  markClassName?: string;
};

export function Logo({ variant = "full", className, markClassName }: LogoProps) {
  if (variant === "mark") return <MatinMark className={cn("h-9", markClassName)} />;

  if (variant === "stacked") {
    return (
      <div className={cn("flex flex-col items-center gap-2 leading-none text-current", className)}>
        <MatinMark className={cn("h-10", markClassName)} />
        <div className="text-center">
          <div className="font-sans text-2xl font-semibold tracking-[0.22em]">MATIN</div>
          <div className="mt-1 font-sans text-[0.6rem] font-medium tracking-[0.42em] opacity-70">
            REAL ESTATE
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 leading-none text-current", className)}>
      <MatinMark className={cn("h-9", markClassName)} />
      <div className="flex flex-col">
        <span className="font-sans text-[1.35rem] font-semibold tracking-[0.2em]">MATIN</span>
        <span className="font-sans text-[0.55rem] font-medium tracking-[0.4em] opacity-70 -mt-0.5">
          REAL ESTATE
        </span>
      </div>
    </div>
  );
}
