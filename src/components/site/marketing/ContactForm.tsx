"use client";

import { useState } from "react";
import { Send, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Intent = "Buying" | "Selling" | "Both";

const INTENTS: Intent[] = ["Buying", "Selling", "Both"];

const field =
  "h-11 w-full rounded-xl border border-ink/15 bg-cloud px-3.5 text-[0.92rem] text-ink placeholder:text-slate/70 transition focus:border-azure focus:outline-none focus:ring-2 focus:ring-azure/25";
const label = "mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-wide text-slate";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [intent, setIntent] = useState<Intent>("Buying");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    // No backend — simulate a network round-trip for a believable UX.
    await new Promise((r) => setTimeout(r, 900));
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="flex flex-col items-center rounded-3xl bg-cloud p-9 text-center shadow-lift ring-1 ring-ink/[0.06] md:p-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/12 text-success">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h3 className="mt-6 font-display text-2xl text-ink">
          Thanks, {name.split(" ")[0] || "there"} — we&apos;re on it.
        </h3>
        <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-slate">
          A Matin broker will reach out within one business day. Looking to move fast? Call us now at{" "}
          <a href="tel:+15036229624" className="link-underline font-medium text-azure-deep">
            (503) 622-9624
          </a>{" "}
          or ask our AI concierge anything in the meantime.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/property-search" variant="primary">
            Browse listings <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <Button
            variant="outline"
            onClick={() => {
              setName("");
              setEmail("");
              setPhone("");
              setMessage("");
              setIntent("Buying");
              setStatus("idle");
            }}
          >
            Send another message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl bg-cloud p-7 shadow-lift ring-1 ring-ink/[0.06] md:p-9"
    >
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="cf-name">
              Full name
            </label>
            <input
              id="cf-name"
              className={field}
              placeholder="Jamie Rivera"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={label} htmlFor="cf-phone">
              Phone
            </label>
            <input
              id="cf-phone"
              type="tel"
              className={field}
              placeholder="(503) 555-0142"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={label} htmlFor="cf-email">
            Email
          </label>
          <input
            id="cf-email"
            type="email"
            className={field}
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <span className={label}>I&apos;m interested in</span>
          <div className="grid grid-cols-3 gap-2">
            {INTENTS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setIntent(opt)}
                aria-pressed={intent === opt}
                className={cn(
                  "h-11 rounded-xl text-[0.9rem] font-medium transition",
                  intent === opt
                    ? "bg-azure text-white shadow-[0_8px_24px_rgba(46,144,224,.28)]"
                    : "bg-paper text-ink/75 ring-1 ring-ink/10 hover:ring-ink/25",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={label} htmlFor="cf-message">
            How can we help?
          </label>
          <textarea
            id="cf-message"
            className={cn(field, "h-32 resize-none py-3")}
            placeholder="Tell us about your timeline, neighborhoods you love, or anything on your mind…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={status === "sending"}>
          {status === "sending" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Send message
            </>
          )}
        </Button>
        <p className="text-[0.8rem] text-slate">
          We typically reply within one business day.
        </p>
      </div>
    </form>
  );
}
