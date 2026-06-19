"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, X, Send, Sparkles, Phone } from "lucide-react";
import { MatinMark } from "@/components/brand/Logo";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING =
  "Hi! I'm Matin — your AI concierge. I can help you buy or sell, explore neighborhoods like West Linn or Lake Oswego, or connect you with the right broker. What are you working on?";

const QUICK = [
  { label: "Buy a home", text: "I'm thinking about buying a home." },
  { label: "Sell my home", text: "I want to know what my home is worth." },
  { label: "Neighborhoods", text: "Tell me about the best neighborhoods near Portland." },
  { label: "Talk to an agent", text: "Can I talk to an agent?" },
];

export function AskMatin() {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setPulse(false);
    const next: Msg[] = [...messages, { role: "user", content: text.trim() }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      await streamAi({ tool: "ask-matin", messages: next }, (_chunk, full) => {
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

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open Matin concierge"
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-azure text-white shadow-[0_10px_40px_rgba(46,144,224,.5)] transition-all duration-300 hover:scale-105",
          open && "rotate-90 scale-95",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        {pulse && !open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-azure-bright opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-azure-bright ring-2 ring-white" />
          </span>
        )}
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-24 right-5 z-50 flex w-[min(400px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink text-white shadow-[0_30px_80px_rgba(10,14,20,.5)] transition-all duration-300 origin-bottom-right",
          open ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-4 scale-95 opacity-0",
        )}
        style={{ height: "min(580px, calc(100vh - 8rem))" }}
      >
        {/* Header */}
        <div className="relative flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-azure-deep to-azure px-4 py-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
            <MatinMark className="h-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5 font-semibold">
              Ask Matin <Sparkles className="h-3.5 w-3.5 text-azure-300" />
            </div>
            <div className="flex items-center gap-1.5 text-[0.72rem] text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> AI concierge · replies instantly
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[0.86rem] leading-relaxed",
                  m.role === "user"
                    ? "rounded-br-sm bg-azure text-white"
                    : "rounded-bl-sm bg-white/8 text-white/90 ring-1 ring-white/10",
                )}
              >
                {m.content || <TypingDots />}
              </div>
            </div>
          ))}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {QUICK.map((q) => (
                <button
                  key={q.label}
                  onClick={() => send(q.text)}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[0.78rem] text-white/85 transition hover:border-azure/60 hover:bg-azure/15"
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-white/10 bg-ink-900 px-3 py-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 rounded-full border border-white/12 bg-white/5 pl-4 pr-1.5 py-1.5 focus-within:border-azure/60"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about buying, selling, neighborhoods…"
              className="flex-1 bg-transparent text-[0.86rem] text-white placeholder:text-white/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-azure text-white transition hover:bg-azure-bright disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <a
            href="tel:+15036229624"
            className="mt-2 flex items-center justify-center gap-1.5 text-[0.72rem] text-white/55 transition hover:text-white/80"
          >
            <Phone className="h-3 w-3" /> Prefer to talk? (503) 622-9624
          </a>
        </div>
      </div>
    </>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}
