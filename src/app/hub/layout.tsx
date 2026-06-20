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
    <div className="h-screen overflow-hidden bg-[#f4f4f3] text-ink antialiased">
      <Shell>{children}</Shell>
    </div>
  );
}
