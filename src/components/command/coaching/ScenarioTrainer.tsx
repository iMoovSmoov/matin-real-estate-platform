"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Drama,
  Send,
  RotateCcw,
  Bot,
  Award,
  Play,
  Swords,
  Flame,
  Presentation,
  ShieldAlert,
  Users,
  Handshake,
  TrendingDown,
  Home,
  Target,
  DollarSign,
  type LucideIcon,
} from "lucide-react";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { LiveDot, Pill } from "@/components/command/ui";
import {
  scenarios,
  type Scenario,
  type ScenarioCategory,
  type ScenarioDifficulty,
} from "@/components/command/coaching/scenarios";

/** Map category → lucide icon component */
const CATEGORY_ICONS: Record<ScenarioCategory, LucideIcon> = {
  "Listing Presentation": Presentation,
  "Objection Handling": ShieldAlert,
  "Buyer Consultation": Users,
  "Negotiation": Handshake,
  "Price Reduction": TrendingDown,
  "FSBO / Expired": Home,
  "Lead Conversion": Target,
  "Cash Offer": DollarSign,
};

type Msg = { role: "user" | "assistant"; content: string };

const CATEGORIES: ScenarioCategory[] = [
  "Listing Presentation",
  "Objection Handling",
  "Buyer Consultation",
  "Negotiation",
  "Price Reduction",
  "FSBO / Expired",
  "Lead Conversion",
  "Cash Offer",
];

const DIFF_TONE: Record<ScenarioDifficulty, "success" | "warn" | "danger"> = {
  Starter: "success",
  Pro: "warn",
  Elite: "danger",
  Beginner: "success",
  Intermediate: "warn",
  Advanced: "danger",
};

/** Build the framing message that seeds the AI client role-play. */
function seedPrompt(s: Scenario): string {
  return [
    `Run a sales-training role-play for a real estate broker at Matin Real Estate (Portland metro, Oregon).`,
    `You play: ${s.category} — scenario: "${s.summary}".`,
    `Open with exactly this line, in character as the client: "${s.opening}"`,
    `Stay fully in character as the client. After each of my responses, reply as the client (1–4 sentences),`,
    `then add ONE short line of coaching feedback in [square brackets] on what I did well or could tighten.`,
    `Keep the pressure realistic. Do not break character except for the bracketed coaching note.`,
  ].join(" ");
}

export function ScenarioTrainer() {
  const [active, setActive] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [scored, setScored] = useState(false);
  const [catFilter, setCatFilter] = useState<ScenarioCategory | "All">("All");
  const [coachGrade, setCoachGrade] = useState<string>("");
  const [gradeLoading, setGradeLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const filtered = useMemo(
    () => (catFilter === "All" ? scenarios : scenarios.filter((s) => s.category === catFilter)),
    [catFilter],
  );

  /** Stream a turn: append the seed/user msg + an empty assistant msg, fill it in. */
  async function runTurn(history: Msg[], display: Msg[]) {
    setMessages([...display, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      await streamAi({ tool: "coach", messages: history }, (_chunk, full) => {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: full };
          return copy;
        });
      });
    } finally {
      setBusy(false);
    }
  }

  /** Find the most recent user message in the visible transcript. */
  function lastUserMessage(): string {
    const userMsgs = messages.filter((m) => m.role === "user");
    return userMsgs[userMsgs.length - 1]?.content ?? "";
  }

  async function getCoachGrade() {
    if (gradeLoading || busy || !active) return;
    const agentResponse = lastUserMessage();
    if (!agentResponse) return;
    setCoachGrade("");
    setGradeLoading(true);
    try {
      await streamAi(
        {
          tool: "coach",
          input: {},
          messages: [
            {
              role: "user",
              content:
                `Scenario: ${active.title}. User's response: ${agentResponse}\n\n` +
                `Grade this response on Tone (1-10), Clarity (1-10), Objection handled (yes/no). ` +
                `Provide one improvement suggestion and a better phrasing example.\n` +
                `Format the first line exactly as: Tone: X/10 | Clarity: X/10 | Objection handled: yes/no\n` +
                `Then provide the improvement suggestion and example phrasing.`,
            },
          ],
        },
        (_chunk, full) => setCoachGrade(full),
      );
    } finally {
      setGradeLoading(false);
    }
  }

  async function start(s: Scenario) {
    if (busy) return;
    setActive(s);
    setScored(false);
    setInput("");
    setCoachGrade("");
    setGradeLoading(false);
    const seed: Msg = { role: "user", content: seedPrompt(s) };
    // History sent to the model includes the hidden seed; display hides it.
    await runTurn([seed], []);
  }

  async function send(text: string) {
    if (!text.trim() || busy || !active) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const seed: Msg = { role: "user", content: seedPrompt(active) };
    const history: Msg[] = [seed, ...messages, userMsg];
    const display: Msg[] = [...messages, userMsg];
    setInput("");
    await runTurn(history, display);
  }

  async function getScore() {
    if (busy || !active || messages.length === 0) return;
    setScored(true);
    const seed: Msg = { role: "user", content: seedPrompt(active) };
    const grade: Msg = {
      role: "user",
      content:
        "End the role-play now. Step out of character and grade my performance in this conversation. " +
        "Respond in markdown with: a `## Score` heading showing **X / 10**, a one-line verdict, " +
        "then `### What worked` and `### Sharpen these` with the top 3 specific, tactical tips. Be direct and useful.",
    };
    const history: Msg[] = [seed, ...messages, grade];
    const display: Msg[] = [...messages, { role: "user", content: "📊 Get my score & feedback" }];
    await runTurn(history, display);
  }

  function reset() {
    setActive(null);
    setMessages([]);
    setInput("");
    setBusy(false);
    setScored(false);
    setCoachGrade("");
    setGradeLoading(false);
  }

  /* ── Library view ─────────────────────────────────────────────────────── */
  if (!active) {
    return (
      <div className="rounded-2xl border border-ink/[0.08] bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-ink/[0.08] px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/[0.06]">
              <Drama className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-sans text-[0.95rem] font-semibold tracking-tight text-ink">
                Scenario Trainer
              </h3>
              <p className="mt-0.5 text-[0.78rem] text-slate">
                Pick a scenario — the AI plays the client, you run the conversation live.
              </p>
            </div>
          </div>
          <Pill tone="azure">
            <Swords className="h-3 w-3" /> {scenarios.length} drills
          </Pill>
        </div>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-2 px-5 pb-1 pt-4">
          {(["All", ...CATEGORIES] as const).map((c) => {
            const on = catFilter === c;
            return (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[0.74rem] font-medium transition-colors",
                  on
                    ? "border-ink/20 bg-ink/[0.08] text-ink"
                    : "border-ink/10 bg-white text-slate hover:border-ink/20 hover:text-ink",
                )}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Scenario grid */}
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => {
            const CatIcon = CATEGORY_ICONS[s.category] ?? Drama;
            return (
              <button
                key={s.id}
                onClick={() => start(s)}
                className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-ink/[0.08] bg-white p-5 text-left transition-all hover:border-azure/40 hover:shadow-soft"
              >
                {/* Icon + difficulty badge */}
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/[0.05] text-ink ring-1 ring-inset ring-ink/[0.06] transition-colors group-hover:bg-ink/[0.08]">
                    <CatIcon className="h-[18px] w-[18px]" />
                  </span>
                  <Pill tone={DIFF_TONE[s.difficulty]}>{s.difficulty}</Pill>
                </div>

                {/* Title + summary */}
                <div>
                  <p className="text-[0.92rem] font-semibold leading-snug text-ink">{s.title}</p>
                  <p className="mt-1 text-[0.78rem] leading-relaxed text-slate/80">{s.summary}</p>
                </div>

                {/* Category label + CTA */}
                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate/50">
                    {s.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1 text-[0.73rem] font-semibold text-ink transition-colors group-hover:border-azure/30 group-hover:bg-azure/[0.06] group-hover:text-azure">
                    Practice <Play className="h-3 w-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Active role-play view ────────────────────────────────────────────── */
  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[34rem] flex-col overflow-hidden rounded-2xl border border-ink/[0.08] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-ink/[0.08] bg-gradient-to-r from-azure-deep/30 to-transparent px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/[0.08] ring-1 ring-inset ring-ink/[0.08]">
            <Drama className="h-4 w-4 text-ink" />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-2 truncate font-semibold text-ink">
              <span className="truncate">{active.title}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[0.72rem] text-slate">
              <LiveDot tone="success" />
              <span className="truncate">
                {active.category} · {active.difficulty}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={reset}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1.5 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
        >
          <RotateCcw className="h-3.5 w-3.5" /> New scenario
        </button>
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-6">
        {messages.length === 0 && (
          <div className="flex items-center gap-2 text-[0.8rem] text-slate/70">
            <LiveDot tone="azure" /> Putting the client in character…
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.62rem] font-bold",
                m.role === "user"
                  ? "bg-ink text-ink"
                  : "bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/[0.06]",
              )}
            >
              {m.role === "user" ? "YOU" : <Bot className="h-4 w-4" />}
            </span>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-[0.88rem] leading-relaxed",
                m.role === "user"
                  ? "rounded-tr-sm bg-ink text-white"
                  : "rounded-tl-sm bg-white text-slate ring-1 ring-inset ring-ink/[0.06]",
              )}
            >
              {m.role === "assistant" ? (
                m.content ? (
                  <AiMarkdown text={m.content} />
                ) : (
                  <TypingDots />
                )
              ) : (
                <span className="whitespace-pre-wrap">{m.content}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Composer + score */}
      <div className="border-t border-ink/[0.08] bg-white px-4 py-3.5 md:px-6">
        {messages.length >= 2 && (
          <div className="mb-2.5 flex flex-wrap justify-center gap-2">
            {!scored && (
              <button
                onClick={getScore}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-paper px-3.5 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:border-ink/20 hover:bg-ink/[0.08] disabled:opacity-40"
              >
                <Award className="h-3.5 w-3.5" /> Get my score &amp; feedback
              </button>
            )}
            <button
              onClick={getCoachGrade}
              disabled={gradeLoading || busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/[0.08] bg-white px-3.5 py-1.5 text-[0.76rem] font-medium text-ink transition-colors hover:border-ink/20 hover:bg-ink/[0.04] disabled:opacity-40"
            >
              <Bot className="h-3.5 w-3.5" />
              {gradeLoading ? "Grading…" : "Get AI Coaching"}
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 rounded-2xl border border-ink/10 bg-white py-2 pl-4 pr-2 focus-within:border-ink/20"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Type your line to the client…"
            className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-[0.88rem] text-ink placeholder:text-slate/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-white transition-colors hover:bg-ink-700 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[0.68rem] text-slate/45">
          <Flame className="h-3 w-3 text-ink/80/60" /> Coaching notes appear in [brackets] after each
          reply · stay sharp
        </p>
        {coachGrade && (
          <div className="mt-3 rounded-xl border border-azure/20 bg-azure/[0.03] p-3.5">
            <div className="mb-2.5 flex items-center gap-1.5 text-[0.72rem] font-semibold text-azure">
              <Bot className="h-3.5 w-3.5" /> AI Grade
            </div>
            <CoachGradePanel text={coachGrade} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Parse the AI grade output and render score chips + the full markdown body. */
function CoachGradePanel({ text }: { text: string }) {
  // Parse numeric scores: "Tone: 8/10", "Clarity: 7/10"
  const scoreChips: { label: string; value: string; variant: string }[] = [];

  const toneMatch = text.match(/Tone:\s*(\d+)\/(\d+)/i);
  const clarityMatch = text.match(/Clarity:\s*(\d+)\/(\d+)/i);
  const handledMatch = text.match(/Objection\s+handled?:\s*(yes|no)/i);

  if (toneMatch) {
    const pct = parseInt(toneMatch[1], 10) / parseInt(toneMatch[2], 10);
    scoreChips.push({
      label: "Tone",
      value: `${toneMatch[1]}/${toneMatch[2]}`,
      variant:
        pct >= 0.8
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : pct >= 0.6
            ? "bg-amber-50 border-amber-200 text-amber-700"
            : "bg-red-50 border-red-200 text-red-700",
    });
  }

  if (clarityMatch) {
    const pct = parseInt(clarityMatch[1], 10) / parseInt(clarityMatch[2], 10);
    scoreChips.push({
      label: "Clarity",
      value: `${clarityMatch[1]}/${clarityMatch[2]}`,
      variant:
        pct >= 0.8
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : pct >= 0.6
            ? "bg-amber-50 border-amber-200 text-amber-700"
            : "bg-red-50 border-red-200 text-red-700",
    });
  }

  if (handledMatch) {
    const handled = handledMatch[1].toLowerCase() === "yes";
    scoreChips.push({
      label: "Handled",
      value: handled ? "Yes" : "No",
      variant: handled
        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
        : "bg-red-50 border-red-200 text-red-700",
    });
  }

  // If parsing failed entirely, show raw markdown
  if (scoreChips.length === 0) {
    return <AiMarkdown text={text} />;
  }

  return (
    <div className="mt-1 space-y-3">
      <div className="flex flex-wrap gap-2">
        {scoreChips.map((c) => (
          <span
            key={c.label}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              c.variant,
            )}
          >
            {c.label}: {c.value}
          </span>
        ))}
      </div>
      <AiMarkdown text={text} />
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/70"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}
