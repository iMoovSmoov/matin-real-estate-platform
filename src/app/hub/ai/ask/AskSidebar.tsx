"use client";

import type { ReactNode } from "react";
import { SectionLabel, LiveDot } from "@/components/command/ui";
import { cn } from "@/lib/utils";
import { FileText, MapPin, Mail, Users } from "lucide-react";

const TOPIC_GROUPS: { group: string; items: { label: string; text: string }[] }[] = [
  {
    group: "Policy",
    items: [
      { label: "Commission split policy", text: "What's our commission split policy for new agents?" },
      { label: "Buyer agency agreement", text: "Walk me through our standard buyer agency agreement terms." },
      { label: "Referral fee rules", text: "What are our inbound and outbound referral fee policies?" },
    ],
  },
  {
    group: "Market Intel",
    items: [
      { label: "West Linn summary", text: "Summarize the West Linn market for a seller consult this afternoon." },
      { label: "Lake Oswego trends", text: "What are the current price trends in Lake Oswego?" },
      { label: "Camas buyer referral", text: "Who on the team should I refer a Camas buyer to?" },
    ],
  },
  {
    group: "Email Drafts",
    items: [
      { label: "Price-drop email", text: "Draft a friendly price-drop email to a seller whose home has been on the market 30 days with no offers." },
      { label: "Buyer follow-up", text: "Draft a follow-up email to a buyer we showed 3 homes to last weekend." },
    ],
  },
];

const QUICK_ACTIONS: { label: string; icon: ReactNode; fill: string }[] = [
  {
    label: "Draft an email",
    icon: <Mail className="h-3.5 w-3.5" />,
    fill: "Draft a professional email to ",
  },
  {
    label: "Market summary",
    icon: <MapPin className="h-3.5 w-3.5" />,
    fill: "Summarize the current market for ",
  },
  {
    label: "Policy lookup",
    icon: <FileText className="h-3.5 w-3.5" />,
    fill: "What's our policy on ",
  },
  {
    label: "Agent roster",
    icon: <Users className="h-3.5 w-3.5" />,
    fill: "Who on the Matin team specializes in ",
  },
];

export function AskSidebar({
  onSuggest,
}: {
  onSuggest: (text: string) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Suggested Topics */}
      <div>
        <SectionLabel>Suggested Topics</SectionLabel>
        <div className="mt-3 space-y-4">
          {TOPIC_GROUPS.map((group) => (
            <div key={group.group}>
              <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-slate/40">
                {group.group}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => onSuggest(item.text)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left text-[0.8rem] text-slate transition-colors",
                      "border border-transparent hover:border-ink/[0.08] hover:bg-ink/[0.03] hover:text-ink",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <SectionLabel>Quick Actions</SectionLabel>
        <div className="mt-3 space-y-1.5">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => onSuggest(action.fill)}
              className={cn(
                "inline-flex w-full items-center gap-2.5 rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-left text-[0.8rem] font-medium text-slate",
                "transition-colors hover:border-ink/20 hover:text-ink",
              )}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink/[0.05] text-ink/60">
                {action.icon}
              </span>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* About */}
      <div>
        <SectionLabel>About</SectionLabel>
        <div className="mt-3 rounded-xl border border-ink/[0.07] bg-white px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5">
            <LiveDot tone="success" />
            <span className="text-[0.75rem] font-medium text-ink">Online</span>
          </div>
          <p className="text-[0.78rem] leading-relaxed text-slate">
            Grounded in Matin policy, team roster, and market data. For internal brokerage use only.
          </p>
        </div>
      </div>
    </div>
  );
}
