import type { Metadata } from "next";
import { AppShell } from "@/components/os";

export const metadata: Metadata = {
  title: "Matin Brokerage OS",
  description:
    "Matin Real Estate's internal AI & operations platform — CRM, automation, live reporting, and AI wired into every workflow.",
};

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden bg-paper text-ink antialiased">
      <AppShell>{children}</AppShell>
    </div>
  );
}
