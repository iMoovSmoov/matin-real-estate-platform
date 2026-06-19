import type { Metadata } from "next";
import { Shell } from "@/components/command/Shell";

export const metadata: Metadata = {
  title: "Matin Hub",
  description:
    "Matin Real Estate's internal AI & operations platform — CRM, automation, live reporting, and AI wired into every workflow.",
};

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[#f4f4f3] text-ink antialiased">
      {/* subtle warm-white depth so white cards read crisply */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-10%,rgba(0,0,0,0.025),transparent_60%)]" />
      <div className="relative">
        <Shell>{children}</Shell>
      </div>
    </div>
  );
}
