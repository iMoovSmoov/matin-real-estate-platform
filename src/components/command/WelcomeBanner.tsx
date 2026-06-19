"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Users, FileText, Rocket, Dumbbell } from "lucide-react";

export function WelcomeBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem("matin_hub_welcomed")) setShow(true);
  }, []);
  const dismiss = () => { localStorage.setItem("matin_hub_welcomed", "1"); setShow(false); };
  if (!show) return null;
  return (
    <div className="mb-6 rounded-2xl bg-ink text-white p-6 relative">
      <button onClick={dismiss} className="absolute right-4 top-4 text-white/60 hover:text-white"><X className="h-4 w-4" /></button>
      <h2 className="font-display text-lg font-semibold mb-1">Welcome to Command Center</h2>
      <p className="text-white/70 text-sm mb-4">Here&apos;s how to get started with your new brokerage OS.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Add your first lead", href: "/hub/crm" },
          { icon: FileText, label: "Start a transaction", href: "/hub/transactions" },
          { icon: Rocket, label: "Launch a listing", href: "/hub/listing-launch" },
          { icon: Dumbbell, label: "Practice a scenario", href: "/hub/coaching" },
        ].map(({ icon: Icon, label, href }) => (
          <Link key={href} href={href} onClick={dismiss} className="flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-2.5 text-sm font-medium transition-colors">
            <Icon className="h-4 w-4 text-white/70 shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
