import type { Metadata } from "next";
import { Shell } from "@/components/command/Shell";

export const metadata: Metadata = {
  title: "Command Center",
  description:
    "Matin Real Estate's internal AI & operations platform — CRM, automation, live reporting, and Claude wired into every workflow.",
};

export default function CommandCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid-tech min-h-screen bg-ink text-white antialiased">
      <Shell>{children}</Shell>
    </div>
  );
}
