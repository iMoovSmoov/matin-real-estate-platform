"use client";

import { useState } from "react";
import { AiChat } from "@/components/command/AiChat";
import { AskSidebar } from "./AskSidebar";

const USER_LABEL = "Jordan Matin";

export default function AskPage() {
  const [externalInput, setExternalInput] = useState<string>("");

  function handleSuggest(text: string) {
    setExternalInput(text);
  }

  function handleExternalInputConsumed() {
    setExternalInput("");
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      {/* Page header */}
      <div className="mb-5">
        <span className="inline-block rounded-full bg-azure/[0.09] px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-azure mb-1.5">
          Team Assistant
        </span>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Ask Matin</h1>
        <p className="mt-1 max-w-2xl text-[0.92rem] leading-relaxed text-slate">
          The internal company copilot for brokers and staff — policies, market knowledge, referrals, and quick
          drafts, grounded in Matin&apos;s knowledge base, listings, and agent roster.
        </p>
      </div>

      {/* Two-column layout: sidebar (lg only) + chat */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar — desktop only */}
        <aside className="hidden lg:block">
          <AskSidebar onSuggest={handleSuggest} />
        </aside>

        {/* Chat panel */}
        <AiChat
          tool="ask-matin"
          title="Ask Matin"
          subtitle="Internal company copilot"
          userLabel={USER_LABEL}
          placeholder="Ask about policy, a neighborhood, a referral, or draft something…"
          greeting="Hi! I'm the Matin copilot. Ask me about company policy, a neighborhood, who to refer a client to, or have me draft an email — I know our playbook, listings, and team. What do you need?"
          chips={[
            { label: "Commission split policy", text: "What's our commission split policy for new agents?" },
            { label: "Draft a price-drop email", text: "Draft a friendly price-drop email to a seller whose home has been on the market 30 days with no offers." },
            { label: "West Linn market summary", text: "Summarize the West Linn market for a seller consult this afternoon." },
            { label: "Camas buyer referral", text: "Who on the team should I refer a Camas buyer to?" },
          ]}
          externalInput={externalInput}
          onExternalInputConsumed={handleExternalInputConsumed}
        />
      </div>
    </div>
  );
}
