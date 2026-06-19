import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

export type ProcessStep = {
  title: string;
  body: string;
};

/**
 * A numbered, editorial process timeline used on the Buy and Sell pages.
 * Renders a connecting rule on large screens and a clean stacked list on mobile.
 */
export function ProcessSteps({
  steps,
  accentLabel = "Step",
  className,
}: {
  steps: ProcessStep[];
  accentLabel?: string;
  className?: string;
}) {
  return (
    <ol className={cn("grid gap-6 md:grid-cols-2 lg:grid-cols-4", className)}>
      {steps.map((step, i) => (
        <Reveal key={step.title} delay={(i % 4) * 0.08}>
          <li className="group relative flex h-full flex-col rounded-2xl bg-cloud p-7 shadow-soft ring-1 ring-ink/[0.06] transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-azure/10 font-display text-xl text-azure-deep transition-colors duration-500 group-hover:bg-azure group-hover:text-white">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="eyebrow text-azure">
                {accentLabel} {i + 1}
              </span>
            </div>
            <h3 className="mt-5 font-display text-xl text-ink">{step.title}</h3>
            <p className="mt-2 flex-1 text-[0.92rem] leading-relaxed text-slate">{step.body}</p>
          </li>
        </Reveal>
      ))}
    </ol>
  );
}
