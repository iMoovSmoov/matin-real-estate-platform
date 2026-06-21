import Image from "next/image";
import { cn } from "@/lib/utils";

/** Matin Real Estate "M" favicon mark — rendered from real brand PNG. */
export function MatinMark({ className, theme = "white" }: { className?: string; theme?: "white" | "dark" }) {
  return (
    <Image
      src="/matin/brand/logo-favicon-32x32.png"
      alt="Matin Real Estate"
      width={32}
      height={32}
      className={cn("h-7 w-auto", className)}
      style={theme === "white" ? { filter: "brightness(10)" } : undefined}
    />
  );
}

type LogoProps = {
  variant?: "full" | "mark";
  className?: string;
  theme?: "white" | "dark";
};

export function Logo({ variant = "full", className, theme = "white" }: LogoProps) {
  if (variant === "mark") return <MatinMark className={className} theme={theme} />;

  // Full wordmark — white PNG for dark backgrounds, dark JPG for light backgrounds
  return (
    <Image
      src={
        theme === "white"
          ? "/matin/brand/logo-3586_logo_logo-white-20211102123653.png"
          : "/matin/brand/logo-268-20240626125130.jpg"
      }
      alt="Matin Real Estate"
      width={200}
      height={50}
      className={cn("h-8 w-auto object-contain", className)}
      priority
    />
  );
}
