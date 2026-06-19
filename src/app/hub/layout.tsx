import type { Metadata } from "next";
import { Shell } from "@/components/command/Shell";

export const metadata: Metadata = {
  title: "Matin Hub",
  description:
    "Matin Real Estate's internal AI & operations platform — CRM, automation, live reporting, and AI wired into every workflow.",
};

export default function CommandCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-ink text-white antialiased">
      {/* depth: faint grid + a soft top highlight so glass panels float */}
      <div className="pointer-events-none fixed inset-0 grid-tech opacity-50" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,255,255,0.07),transparent_60%)]" />
      <div className="relative">
        <Shell>{children}</Shell>
      </div>
    </div>
  );
}
