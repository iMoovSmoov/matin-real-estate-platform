"use client";

import { useRef, useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scrollIntoViewSafe } from "@/components/site/useScrollReveal";

export function InquiryForm({ agentName }: { agentName: string }) {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const confirmRef = useRef<HTMLDivElement>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Portfolio demo — no backend. Acknowledge optimistically.
    setSent(true);
    // Surface the confirmation if the form was scrolled past on a small screen.
    scrollIntoViewSafe(confirmRef.current, { block: "center", onlyBelowLg: true });
  }

  if (sent) {
    return (
      <div
        ref={confirmRef}
        aria-live="polite"
        className="flex scroll-mt-24 flex-col items-center rounded-2xl bg-azure/[0.06] px-6 py-10 text-center ring-1 ring-azure/15"
      >
        <CheckCircle2 className="h-10 w-10 text-azure" />
        <h3 className="mt-4 font-display text-xl text-ink">Message sent</h3>
        <p className="mt-2 max-w-sm text-[0.9rem] text-slate">
          Thanks{form.name ? `, ${form.name.split(" ")[0]}` : ""}. {agentName.split(" ")[0]} will be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" value={form.name} onChange={(v) => update("name", v)} required />
        <Field label="Phone" type="tel" value={form.phone} onChange={(v) => update("phone", v)} />
      </div>
      <Field label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} required />
      <div>
        <label className="mb-1.5 block text-[0.78rem] font-medium text-slate">Message</label>
        <textarea
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          rows={4}
          placeholder={`Hi ${agentName.split(" ")[0]}, I'd love to learn more about…`}
          className="w-full resize-none rounded-xl bg-paper-200/60 px-4 py-3 text-[0.92rem] text-ink placeholder:text-slate ring-1 ring-ink/[0.1] focus:outline-none focus-visible:ring-azure/40"
        />
      </div>
      <Button type="submit" variant="primary" size="md" className="w-full">
        <Send className="h-4 w-4" /> Send message
      </Button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.78rem] font-medium text-slate">
        {label} {required && <span className="text-azure">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-paper-200/60 px-4 py-2.5 text-[0.92rem] text-ink ring-1 ring-ink/[0.1] focus:outline-none focus-visible:ring-azure/40"
      />
    </div>
  );
}
