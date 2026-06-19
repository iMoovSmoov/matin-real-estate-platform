"use client";

import { useState } from "react";
import { Send, CheckCircle2, Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Shared field styles (spec-compliant) ─────────────────────────────────────
const fieldCls =
  "w-full rounded-lg border border-ink/[0.15] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink/40 transition";
const fieldErrorCls =
  "w-full rounded-lg border border-red-400 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 transition";
const labelCls = "text-sm font-medium text-ink mb-1 block";
const errorMsgCls = "text-xs text-red-600 mt-1";

type Intent = "Buying" | "Selling" | "Both";
const INTENTS: Intent[] = ["Buying", "Selling", "Both"];

type Touched = { name: boolean; email: boolean; message: boolean };

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [intent, setIntent] = useState<Intent>("Buying");
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState<Touched>({ name: false, email: false, message: false });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const nameErr = touched.name && name.trim() === "" ? "Name is required." : "";
  const emailErr =
    touched.email && email.trim() === ""
      ? "Email is required."
      : touched.email && !validateEmail(email)
        ? "Enter a valid email address."
        : "";
  const messageErr = touched.message && message.trim() === "" ? "Message is required." : "";

  function blur(field: keyof Touched) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Mark all required fields as touched to reveal any errors
    setTouched({ name: true, email: true, message: true });
    if (!name.trim() || !validateEmail(email) || !message.trim()) return;
    if (status === "sending") return;

    setStatus("sending");
    // No backend — simulate a network round-trip for a believable UX.
    await new Promise((r) => setTimeout(r, 900));
    // Simulate occasional success (always succeeds in this demo)
    setStatus("done");
  }

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setIntent("Buying");
    setTouched({ name: false, email: false, message: false });
    setStatus("idle");
  }

  // Success state — form replaced by confirmation
  if (status === "done") {
    return (
      <div className="flex flex-col items-center rounded-3xl bg-cloud p-9 text-center shadow-lift ring-1 ring-ink/[0.06] md:p-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-600">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h3 className="mt-6 font-display text-2xl text-ink">
          Sent! We&apos;ll be in touch.
        </h3>
        <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-slate">
          Thanks, {name.split(" ")[0] || "there"} — a Matin broker will reach out within one
          business day. Need to move faster? Call us at{" "}
          <a href="tel:+15036229624" className="link-underline font-medium text-azure-deep">
            (503) 622-9624
          </a>
          .
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/property-search" variant="primary">
            Browse listings <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <Button variant="outline" onClick={resetForm}>
            Send another message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-3xl bg-cloud p-7 shadow-lift ring-1 ring-ink/[0.06] md:p-9"
    >
      <div className="space-y-5">
        {/* Name + Phone row */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="cf-name">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="cf-name"
              className={nameErr ? fieldErrorCls : fieldCls}
              placeholder="Jamie Rivera"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => blur("name")}
              aria-invalid={!!nameErr}
              aria-describedby={nameErr ? "cf-name-err" : undefined}
            />
            {nameErr && (
              <p id="cf-name-err" className={errorMsgCls} role="alert">
                {nameErr}
              </p>
            )}
          </div>
          <div>
            <label className={labelCls} htmlFor="cf-phone">
              Phone <span className="font-normal text-slate/60">(optional)</span>
            </label>
            <input
              id="cf-phone"
              type="tel"
              className={fieldCls}
              placeholder="(503) 555-0142"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className={labelCls} htmlFor="cf-email">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="cf-email"
            type="email"
            className={emailErr ? fieldErrorCls : fieldCls}
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => blur("email")}
            aria-invalid={!!emailErr}
            aria-describedby={emailErr ? "cf-email-err" : undefined}
          />
          {emailErr && (
            <p id="cf-email-err" className={errorMsgCls} role="alert">
              {emailErr}
            </p>
          )}
        </div>

        {/* Intent toggle */}
        <div>
          <span className="text-sm font-medium text-ink mb-1 block">
            I&apos;m interested in
          </span>
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

        {/* Message */}
        <div>
          <label className={labelCls} htmlFor="cf-message">
            How can we help? <span className="text-red-500">*</span>
          </label>
          <textarea
            id="cf-message"
            className={cn(
              messageErr ? fieldErrorCls : fieldCls,
              "h-32 resize-none py-3",
            )}
            placeholder="Tell us about your timeline, neighborhoods you love, or anything on your mind…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onBlur={() => blur("message")}
            aria-invalid={!!messageErr}
            aria-describedby={messageErr ? "cf-message-err" : undefined}
          />
          {messageErr && (
            <p id="cf-message-err" className={errorMsgCls} role="alert">
              {messageErr}
            </p>
          )}
        </div>
      </div>

      {/* Submit row */}
      <div className="mt-7 flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={status === "sending"}>
          {status === "sending" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending&hellip;
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Send message
            </>
          )}
        </Button>
        <p className="text-[0.8rem] text-slate">We typically reply within one business day.</p>
      </div>

      {/* Error state */}
      {status === "error" && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-[0.88rem] text-red-700">
            Something went wrong. Please try again or call us at{" "}
            <a href="tel:+15036229624" className="font-medium underline">
              (503) 622-9624
            </a>
            .
          </p>
        </div>
      )}
    </form>
  );
}
