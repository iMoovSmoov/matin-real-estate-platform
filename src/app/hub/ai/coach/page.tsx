import Link from "next/link";
import { ChevronLeft, GraduationCap } from "lucide-react";
import { AiChat } from "@/components/command/AiChat";

export default function CoachPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-6 md:py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-[0.78rem] text-slate/60">
        <Link href="/hub/ai" className="inline-flex items-center gap-1 hover:text-ink transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" />
          AI Studio
        </Link>
        <span>/</span>
        <span className="text-ink/70">Agent Coach</span>
      </nav>

      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/[0.06]">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">Agent Coach</h1>
          <p className="mt-1 max-w-2xl text-[0.92rem] leading-relaxed text-slate">
            A tireless sales trainer. Run realistic role-plays and get crisp, tactical feedback — pick a scenario
            below or describe your own. Coach stays in character until you earn it.
          </p>
        </div>
      </div>
      <AiChat
        tool="coach"
        title="Coach"
        subtitle="AI sales trainer · stays in character"
        userLabel="Agent"
        placeholder="Describe a scenario, or type your line in the role-play…"
        greeting="I'm Coach — your AI sales trainer. Pick a scenario below, or tell me what you want to drill. I'll role-play the client and then break down exactly what worked and what to tighten. Ready when you are."
        chips={[
          { label: "Price-reduction objection", text: "Role-play a seller who refuses a price reduction even though we're 30 days in with no offers. Be tough, then coach me." },
          { label: "FSBO listing presentation", text: "Let's role-play a FSBO listing presentation. You're a for-sale-by-owner who thinks they can save the commission. Make me earn the listing." },
          { label: "Buyer cold feet at offer", text: "Role-play a buyer getting cold feet right before submitting an offer on a home they love. Coach me through reassuring them." },
          { label: "“We'll wait for spring”", text: "Role-play a seller who wants to wait for spring to list. Help me overcome the objection with data." },
        ]}
      />
    </div>
  );
}
