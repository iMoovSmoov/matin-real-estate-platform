"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, Phone, ArrowRight } from "lucide-react";
import { MatinMark } from "@/components/brand/Logo";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING =
  "Hi, I'm the Matin concierge. I can help you find a home, understand a neighborhood, estimate what yours is worth, or connect you with the right broker. What are you working on?";

const QUICK = [
  { label: "Buy a home", text: "I'm thinking about buying a home." },
  { label: "Sell my home", text: "I want to know what my home is worth." },
  { label: "Neighborhoods", text: "Tell me about the best neighborhoods near Portland." },
  { label: "Talk to a broker", text: "Can I talk to an agent?" },
];

export function AskMatin() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
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
      {/* ── Launcher ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close concierge" : "Open Matin concierge"}
        className={cn(
          "fixed bottom-[calc(56px+1.25rem)] right-5 z-50 relative h-14 w-14 rounded-full sm:bottom-5 sm:right-7",
          "bg-ink text-white",
          "shadow-[0_4px_20px_rgba(6,6,6,.45),0_1px_4px_rgba(6,6,6,.25)]",
          "ring-[1.5px] ring-white/20",
          "transition-all duration-300 hover:scale-105 hover:ring-white/40",
          open && "scale-95 ring-white/30",
        )}
      >
        <span className={cn("absolute inset-0 flex items-center justify-center transition-all duration-300", open ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none")}>
          <X className="h-5 w-5" />
        </span>
        <span className={cn("absolute inset-0 flex items-center justify-center transition-all duration-300", open ? "opacity-0 scale-75 pointer-events-none" : "opacity-100 scale-100")}>
          <MatinMark className="h-[22px] w-auto text-white" />
        </span>
      </button>

      {/* ── Panel ── */}
      <div
        role="dialog"
        aria-label="Matin concierge chat"
        aria-modal={open}
        aria-hidden={!open}
        className={cn(
          "fixed bottom-24 right-5 z-50 flex flex-col overflow-hidden sm:right-7",
          "w-[min(400px,calc(100vw-2.5rem))]",
          "rounded-2xl",
          "bg-[#0d0d0e]",
          "border border-white/[0.07]",
          "shadow-[0_24px_80px_rgba(0,0,0,.75),0_2px_16px_rgba(0,0,0,.5),0_0_0_1px_rgba(255,255,255,.03)]",
          "transition-all duration-300 origin-bottom-right",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-4 scale-95 opacity-0",
        )}
        style={{ height: "min(580px, calc(100vh - 8rem))" }}
      >
        {/* Gold accent rule */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[rgba(210,160,80,0.45)] to-transparent" />

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-white/20">
            <MatinMark className="h-[18px] w-auto text-ink" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[0.95rem] font-semibold leading-none text-white">
              Ask Matin
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[0.7rem] text-white/50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              AI concierge · replies instantly
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close Matin concierge chat"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/30 transition hover:bg-white/8 hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-1"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-2.5", m.role === "user" ? "justify-end" : "justify-start items-end")}>
              {m.role === "assistant" && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 mb-0.5">
                  <MatinMark className="h-[10px] w-auto text-white" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[0.85rem] leading-relaxed",
                  m.role === "user"
                    ? "rounded-br-sm bg-white text-ink font-medium"
                    : "rounded-bl-sm bg-white/[0.07] text-white/90 ring-1 ring-white/[0.08]",
                )}
              >
                {m.content || <TypingDots />}
              </div>
            </div>
          ))}

          {/* Quick replies — show only on first message */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {QUICK.map((q) => (
                <button
                  key={q.label}
                  onClick={() => send(q.text)}
                  className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-[0.77rem] text-white/75 transition hover:border-white/30 hover:bg-white/[0.10] hover:text-white"
                >
                  {q.label}
                  <ArrowRight className="h-3 w-3 opacity-50" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-white/[0.07] px-3 py-3">
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            noValidate
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] pl-4 pr-1.5 py-1.5 transition focus-within:border-white/20 focus-within:bg-white/[0.07]"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 500))}
              placeholder="Ask anything…"
              aria-label="Message to Matin concierge"
              className="flex-1 bg-transparent text-[0.85rem] text-white placeholder:text-white/35 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send message"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-ink transition hover:bg-white/90 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure focus-visible:ring-offset-1"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </form>
          {input.length > 0 && (
            <p className={cn("mt-1 text-right text-[0.65rem] tabular-nums", input.length >= 500 ? "text-red-400" : "text-white/30")}>
              {input.length} / 500
            </p>
          )}
          <a
            href="tel:+15036229624"
            className="mt-2.5 flex items-center justify-center gap-1.5 text-[0.7rem] text-white/35 transition hover:text-white/65"
          >
            <Phone className="h-3 w-3" />
            Prefer to talk? (503) 622-9624
          </a>
        </div>
      </div>
    </>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50"
          style={{ animationDelay: `${i * 130}ms` }}
        />
      ))}
    </span>
  );
}
