import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ink" | "outline" | "ghost" | "white" | "outline-light";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-azure text-white hover:bg-azure-deep shadow-[0_8px_24px_rgba(46,144,224,.32)]",
  ink: "bg-ink text-white hover:bg-ink-700",
  outline: "border border-ink/20 text-ink hover:border-ink/50 hover:bg-ink/[0.03]",
  "outline-light": "border border-white/30 text-white hover:border-white/70 hover:bg-white/10",
  ghost: "text-ink hover:bg-ink/[0.05]",
  white: "bg-white text-ink hover:bg-paper-200 shadow-soft",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[0.82rem]",
  md: "h-11 px-6 text-[0.9rem]",
  lg: "h-13 px-8 text-[0.95rem] md:h-14",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-azure/50 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { children, ...rest } = props;
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
  ...props
}: CommonProps & { href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  );
}
