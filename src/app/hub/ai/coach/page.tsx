import { AiChat } from "@/components/command/AiChat";

export default function CoachPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-6 md:py-8">
      <div className="mb-4">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/70">
          Coaching
        </p>
        <h1 className="mt-1 font-display text-3xl text-white">Agent Coach</h1>
        <p className="mt-1.5 max-w-2xl text-[0.9rem] leading-relaxed text-slate-300">
          A tireless sales trainer. Run realistic role-plays and get crisp, tactical feedback — pick a scenario
          below or describe your own. Coach stays in character until you earn it.
        </p>
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
