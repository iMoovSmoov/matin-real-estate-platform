"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Drama, Send, RotateCcw, Bot, Award, Play, Swords, Flame } from "lucide-react";
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

type Msg = { role: "user" | "assistant"; content: string };

const CATEGORIES: ScenarioCategory[] = [
  "Listing Presentation",
  "Objection Handling",
  "Buyer Consultation",
  "Negotiation",
  "Price Reduction",
  "FSBO / Expired",
];

const DIFF_TONE: Record<ScenarioDifficulty, "success" | "warn" | "danger"> = {
  Starter: "success",
  Pro: "warn",
  Elite: "danger",
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

  async function start(s: Scenario) {
    if (busy) return;
    setActive(s);
    setScored(false);
    setInput("");
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
  }

  /* ── Library view ─────────────────────────────────────────────────────── */
  if (!active) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.045]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-azure/12 text-azure-bright ring-1 ring-inset ring-azure/20">
              <Drama className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-sans text-[0.95rem] font-semibold tracking-tight text-white">
                Scenario Trainer
              </h3>
              <p className="mt-0.5 text-[0.78rem] text-slate-300">
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
                    ? "border-azure/50 bg-azure/15 text-white"
                    : "border-white/12 bg-white/[0.03] text-slate-300 hover:border-azure/40 hover:text-white",
                )}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Scenario grid */}
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => start(s)}
              className="group relative flex flex-col gap-2 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left transition-all hover:border-azure/40 hover:bg-azure/[0.06]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Pill tone="azure">{s.category}</Pill>
                  <Pill tone={DIFF_TONE[s.difficulty]}>{s.difficulty}</Pill>
                </div>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-azure-bright ring-1 ring-inset ring-white/10 transition-colors group-hover:bg-azure/15">
                  <Play className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="text-[0.92rem] font-semibold text-white">{s.title}</p>
              <p className="text-[0.78rem] leading-relaxed text-slate-300/85">{s.summary}</p>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-[0.72rem] font-semibold text-azure-bright opacity-80 transition-opacity group-hover:opacity-100">
                Start role-play <Play className="h-3 w-3" />
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── Active role-play view ────────────────────────────────────────────── */
  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[34rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-azure-deep/30 to-transparent px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-azure/15 ring-1 ring-inset ring-azure/25">
            <Drama className="h-4 w-4 text-white" />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-2 truncate font-semibold text-white">
              <span className="truncate">{active.title}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[0.72rem] text-slate-300">
              <LiveDot tone="success" />
              <span className="truncate">
                {active.category} · {active.difficulty}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={reset}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[0.74rem] font-medium text-slate-300 transition-colors hover:border-azure/40 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" /> New scenario
        </button>
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-6">
        {messages.length === 0 && (
          <div className="flex items-center gap-2 text-[0.8rem] text-slate-300/70">
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
                  ? "bg-gradient-to-br from-azure to-azure-deep text-white"
                  : "bg-azure/12 text-azure-bright ring-1 ring-inset ring-azure/20",
              )}
            >
              {m.role === "user" ? "YOU" : <Bot className="h-4 w-4" />}
            </span>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-[0.88rem] leading-relaxed",
                m.role === "user"
                  ? "rounded-tr-sm bg-azure text-white"
                  : "rounded-tl-sm bg-white/[0.05] text-slate-300 ring-1 ring-inset ring-white/10",
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
      <div className="border-t border-white/10 bg-ink-900 px-4 py-3.5 md:px-6">
        {!scored && messages.length >= 2 && (
          <div className="mb-2.5 flex justify-center">
            <button
              onClick={getScore}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-azure/30 bg-azure/10 px-3.5 py-1.5 text-[0.76rem] font-semibold text-azure-bright transition-colors hover:border-azure/50 hover:bg-azure/15 disabled:opacity-40"
            >
              <Award className="h-3.5 w-3.5" /> Get my score &amp; feedback
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 rounded-2xl border border-white/12 bg-white/[0.04] py-2 pl-4 pr-2 focus-within:border-azure/50"
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
            className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-[0.88rem] text-white placeholder:text-slate-300/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-azure text-white transition-colors hover:bg-azure-bright disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[0.68rem] text-slate-300/45">
          <Flame className="h-3 w-3 text-azure-300/60" /> Coaching notes appear in [brackets] after each
          reply · stay sharp
        </p>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-azure-bright/70"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}
