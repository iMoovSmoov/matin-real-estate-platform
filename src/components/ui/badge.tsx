import { cn } from "@/lib/utils";

type Tone = "azure" | "ink" | "success" | "danger" | "warn" | "neutral" | "outline";

const tones: Record<Tone, string> = {
  azure: "bg-azure/10 text-azure-deep ring-1 ring-inset ring-azure/20",
  ink: "bg-ink text-white",
  success: "bg-success/12 text-success ring-1 ring-inset ring-success/20",
  danger: "bg-danger/12 text-danger ring-1 ring-inset ring-danger/20",
  warn: "bg-warn/15 text-[#9a6b1e] ring-1 ring-inset ring-warn/25",
  neutral: "bg-ink/[0.06] text-slate ring-1 ring-inset ring-ink/10",
  outline: "border border-current/30 text-current",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Status badge mapped to listing status. */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, Tone> = {
    Active: "success", New: "azure", Pending: "warn",
    "Coming Soon": "ink", Sold: "neutral",
  };
  return <Badge tone={map[status] ?? "neutral"}>{status}</Badge>;
}
