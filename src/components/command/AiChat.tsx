"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, RotateCcw, Bot } from "lucide-react";
import { MatinMark } from "@/components/brand/Logo";
import { streamAi } from "@/lib/ai/client";
import { cn, initials } from "@/lib/utils";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { LiveDot } from "@/components/command/ui";

type Msg = { role: "user" | "assistant"; content: string };

export function AiChat({
  tool,
  title,
  subtitle,
  greeting,
  chips,
  placeholder = "Type a message…",
  userLabel = "You",
}: {
  tool: string;
  title: string;
  subtitle: string;
  greeting: string;
  chips: { label: string; text: string }[];
  placeholder?: string;
  userLabel?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: greeting }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    // The greeting is local UI only — don't send it to the model.
    const history = messages.filter((m, i) => !(i === 0 && m.content === greeting));
    const next: Msg[] = [...history, { role: "user", content: text.trim() }];
    setMessages((m) => [...m, { role: "user", content: text.trim() }, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      await streamAi({ tool, messages: next }, (_chunk, full) => {
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

  function reset() {
    setMessages([{ role: "assistant", content: greeting }]);
    setInput("");
  }

  const fresh = messages.length <= 1;

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[32rem] flex-col overflow-hidden rounded-2xl border border-ink/[0.08] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-ink/[0.08] bg-gradient-to-r from-azure-deep/30 to-transparent px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink/[0.08] ring-1 ring-inset ring-ink/[0.08]">
            <MatinMark className="h-4 text-ink" />
          </span>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5 font-semibold text-ink">
              {title} <Sparkles className="h-3.5 w-3.5 text-ink/80" />
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[0.72rem] text-slate">
              <LiveDot tone="success" /> {subtitle}
            </div>
          </div>
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1.5 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-6">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.62rem] font-bold",
                m.role === "user"
                  ? "bg-ink text-ink"
                  : "bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/[0.06]",
              )}
            >
              {m.role === "user" ? initials(userLabel) : <Bot className="h-4 w-4" />}
            </span>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-[0.88rem] leading-relaxed",
                m.role === "user"
                  ? "rounded-tr-sm bg-azure text-ink"
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

        {fresh && (
          <div className="flex flex-wrap gap-2 pt-1">
            {chips.map((c) => (
              <button
                key={c.label}
                onClick={() => send(c.text)}
                className="rounded-full border border-ink/10 bg-white px-3.5 py-2 text-[0.8rem] font-medium text-slate transition-colors hover:border-ink/20 hover:bg-paper hover:text-ink"
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-ink/[0.08] bg-ink-900 px-4 py-3.5 md:px-6">
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
            placeholder={placeholder}
            className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-[0.88rem] text-ink placeholder:text-slate/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-azure text-ink transition-colors hover:bg-ink-700 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-2 text-center text-[0.68rem] text-slate/45">
          AI · responses are AI-generated drafts for internal use
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
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/70"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}
