"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, RotateCcw, Copy, Check, Lightbulb } from "lucide-react";
import { MatinMark } from "@/components/brand/Logo";
import { streamAi } from "@/lib/ai/client";
import { cn, initials } from "@/lib/utils";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { LiveDot } from "@/components/command/ui";

type Msg = { role: "user" | "assistant"; content: string };

// ── Copy button for individual messages ──────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy message"}
      className={cn(
        "absolute -top-2 right-1 flex h-6 w-6 items-center justify-center rounded-md border border-ink/[0.08] bg-white text-slate shadow-sm transition-all",
        "opacity-0 group-hover:opacity-100 focus:opacity-100",
        // Always show for touch — last message handling done at call site via className override
        copied && "opacity-100 text-green-600 border-green-200",
      )}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

// ── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/30"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}

// ── Main AiChat component ─────────────────────────────────────────────────────
export function AiChat({
  tool,
  title,
  subtitle,
  greeting,
  chips,
  placeholder = "Type a message…",
  userLabel = "You",
  externalInput,
  onExternalInputConsumed,
}: {
  tool: string;
  title: string;
  subtitle: string;
  greeting: string;
  chips: { label: string; text: string }[];
  placeholder?: string;
  userLabel?: string;
  externalInput?: string;
  onExternalInputConsumed?: () => void;
}) {
  const greetingMsg: Msg = { role: "assistant", content: greeting };

  // ── State ──────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Msg[]>(() => {
    // Restore session from sessionStorage on mount
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(`aichat-${tool}`);
        if (stored) {
          const parsed = JSON.parse(stored) as Msg[];
          if (Array.isArray(parsed) && parsed.length > 1) return parsed;
        }
      } catch {
        // ignore parse errors
      }
    }
    return [greetingMsg];
  });

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const [copiedHeader, setCopiedHeader] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const topicsRef = useRef<HTMLDivElement>(null);
  const topicsButtonRef = useRef<HTMLButtonElement>(null);

  // ── Persist to sessionStorage ──────────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 1) {
      try {
        sessionStorage.setItem(`aichat-${tool}`, JSON.stringify(messages));
      } catch {
        // quota exceeded or private mode — ignore
      }
    }
  }, [messages, tool]);

  // ── Auto-scroll (respects scroll-lock) ────────────────────────────────────
  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  // ── Sync external input from sidebar ──────────────────────────────────────
  useEffect(() => {
    if (externalInput !== undefined && externalInput !== "") {
      setInput(externalInput);
      onExternalInputConsumed?.();
    }
  }, [externalInput, onExternalInputConsumed]);

  // ── Close Topics popover on outside click ─────────────────────────────────
  useEffect(() => {
    if (!showTopics) return;
    function handleClick(e: MouseEvent) {
      if (
        topicsRef.current &&
        !topicsRef.current.contains(e.target as Node) &&
        topicsButtonRef.current &&
        !topicsButtonRef.current.contains(e.target as Node)
      ) {
        setShowTopics(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showTopics]);

  // ── Scroll tracker ─────────────────────────────────────────────────────────
  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  // ── Send ───────────────────────────────────────────────────────────────────
  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || busy) return;
      const history = messages.filter((m, i) => !(i === 0 && m.content === greeting));
      const next: Msg[] = [...history, { role: "user", content: text.trim() }];
      setMessages((m) => [...m, { role: "user", content: text.trim() }, { role: "assistant", content: "" }]);
      setInput("");
      setBusy(true);
      isNearBottomRef.current = true;
      try {
        await streamAi({ tool, messages: next }, (_chunk, full) => {
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", content: full };
            return copy;
          });
        });
      } catch {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "Sorry, I had trouble connecting. Please try again.",
          };
          return copy;
        });
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, greeting, tool],
  );

  // ── Reset ──────────────────────────────────────────────────────────────────
  function reset() {
    setMessages([greetingMsg]);
    setInput("");
    try {
      sessionStorage.removeItem(`aichat-${tool}`);
    } catch {
      // ignore
    }
  }

  // ── Copy last reply (header button) ───────────────────────────────────────
  function copyLastReply() {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || !last.content) return;
    navigator.clipboard.writeText(last.content).then(() => {
      setCopiedHeader(true);
      setTimeout(() => setCopiedHeader(false), 1600);
    });
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const fresh = messages.length <= 1;
  const lastIsAssistant =
    messages.length > 1 &&
    messages[messages.length - 1].role === "assistant" &&
    !!messages[messages.length - 1].content;
  const canCopyHeader = lastIsAssistant && !busy;

  return (
    <div className="flex h-[calc(100dvh-16rem)] min-h-[24rem] flex-col overflow-hidden rounded-2xl border border-ink/[0.08] bg-white sm:h-[calc(100dvh-12rem)] sm:min-h-[32rem] sm:max-h-[800px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-ink/[0.08] bg-gradient-to-r from-azure-deep/30 to-transparent px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink/[0.08] ring-1 ring-inset ring-ink/[0.08]">
            <MatinMark className="h-4" theme="dark" />
          </span>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5 font-semibold text-ink">{title}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[0.72rem] text-slate">
              <LiveDot tone="success" /> {subtitle}
            </div>
          </div>
        </div>

        {/* Header action buttons */}
        <div className="flex items-center gap-2">
          {canCopyHeader && (
            <button
              onClick={copyLastReply}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1.5 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
            >
              {copiedHeader ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy reply
                </>
              )}
            </button>
          )}
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1.5 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-6"
      >
        {messages.map((m, i) => {
          const isLastAssistant =
            m.role === "assistant" && i === messages.length - 1 && !!m.content && !busy;
          return (
            <div key={i} className={cn("group flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.62rem] font-bold",
                  m.role === "user"
                    ? "bg-ink text-white"
                    : "bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/[0.06]",
                )}
              >
                {m.role === "user" ? initials(userLabel) : <MatinMark className="h-3.5 w-auto" theme="dark" />}
              </span>
              <div className="relative max-w-[80%]">
                {/* Per-message copy button (assistant only) */}
                {m.role === "assistant" && m.content && !busy && (
                  <div className={cn(isLastAssistant && "sm:opacity-0 sm:group-hover:opacity-100")}>
                    <CopyButton text={m.content} />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-[0.88rem] leading-relaxed",
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
            </div>
          );
        })}

        {fresh && (
          <div className="flex flex-wrap gap-2 pt-1">
            {chips.map((c) => (
              <button
                key={c.label}
                onClick={() => send(c.text)}
                className="rounded-full border border-ink/10 bg-white px-3 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:border-ink/20 hover:bg-paper hover:text-ink"
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="relative border-t border-ink/[0.08] bg-white px-4 py-3.5 md:px-6">
        {/* Topics popover */}
        {showTopics && (
          <div
            ref={topicsRef}
            className="absolute bottom-full left-4 right-4 z-10 mb-2 rounded-xl border border-ink/[0.08] bg-white p-3 shadow-lg md:left-6 md:right-6"
          >
            <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-wide text-slate/50">
              Quick Topics
            </p>
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <button
                  key={c.label}
                  onClick={() => {
                    send(c.text);
                    setShowTopics(false);
                  }}
                  className="rounded-full border border-ink/10 bg-white px-3 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:border-ink/20 hover:bg-paper hover:text-ink"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 rounded-2xl border border-ink/10 bg-white py-2 pl-3 pr-2 focus-within:border-ink/20"
        >
          {/* Topics toggle button */}
          <button
            type="button"
            ref={topicsButtonRef}
            onClick={() => setShowTopics((v) => !v)}
            title="Quick topics"
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink/[0.08] text-slate transition-colors hover:border-ink/20 hover:text-ink mb-1",
              showTopics && "border-azure/30 bg-azure/5 text-azure",
            )}
          >
            <Lightbulb className="h-3.5 w-3.5" />
          </button>

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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-white transition-colors hover:bg-ink-700 disabled:opacity-40"
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
