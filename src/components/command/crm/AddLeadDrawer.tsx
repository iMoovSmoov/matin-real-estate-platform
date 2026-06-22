"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Lead, LeadStage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { agents } from "@/lib/data";
import { LEAD_STAGES } from "@/components/command/crm/leadStyles";

const SOURCES = ["Zillow", "Realtor.com", "Referral", "Organic", "Other"] as const;
// Canonical intent vocabulary — must match leadView's type/seller-intent logic
// (Buying / Selling / Buying & Selling / Investing) so a new lead is labeled
// correctly downstream instead of always falling back to "Buyer".
const INTENTS = ["Buying", "Selling", "Buying & Selling", "Investing"] as const;
// Real, assignable agents (a chosen slug resolves to a real headshot + owner).
const ASSIGNABLE_AGENTS = agents.filter((a) => !a.slug.startsWith("system-"));
const DEFAULT_OWNER = "jordan-matin";

export function AddLeadDrawer({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (lead: Lead) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState<string>("Organic");
  const [stage, setStage] = useState<LeadStage>("New");
  const [intent, setIntent] = useState<string>("Buying");
  const [community, setCommunity] = useState("");
  const [budgetMin, setBudgetMin] = useState<string>("");
  const [budgetMax, setBudgetMax] = useState<string>("");
  const [assignedAgent, setAssignedAgent] = useState(DEFAULT_OWNER);
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setSource("Organic");
    setStage("New");
    setIntent("Buying");
    setCommunity("");
    setBudgetMin("");
    setBudgetMax("");
    setAssignedAgent(DEFAULT_OWNER);
    setNameError(false);
    setEmailError(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSave() {
    const nameValid = name.trim().length > 0;
    const emailValid = email.trim().length > 0;
    setNameError(!nameValid);
    setEmailError(!emailValid);
    if (!nameValid || !emailValid) return;

    const firstName = name.trim().split(/\s+/)[0];
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: name.trim(),
      firstName,
      email: email.trim(),
      phone: phone.trim() || "—",
      source,
      stage,
      score: 50,
      intent,
      budgetMin: budgetMin ? parseInt(budgetMin, 10) : 0,
      budgetMax: budgetMax ? parseInt(budgetMax, 10) : 0,
      communitySlug: community.trim().toLowerCase().replace(/\s+/g, "-"),
      community: community.trim() || "—",
      assignedAgent,
      createdDaysAgo: 0,
      lastContactDaysAgo: 0,
      tags: [],
      aiSummary: "New lead — no activity yet.",
      unread: 0,
    };

    onSave(newLead);
    resetForm();
  }

  const inputClass =
    "h-10 w-full rounded-xl border border-ink/[0.08] bg-white px-3.5 text-[0.85rem] text-ink focus:border-ink/20 focus:outline-none";
  const errorInputClass =
    "h-10 w-full rounded-xl border border-danger/40 bg-white px-3.5 text-[0.85rem] text-ink focus:border-danger/60 focus:outline-none";
  const selectClass =
    "h-10 w-full appearance-none rounded-xl border border-ink/[0.08] bg-white px-3.5 text-[0.85rem] text-ink focus:border-ink/20 focus:outline-none";
  const labelClass =
    "mb-1 block text-[0.72rem] font-semibold uppercase tracking-wider text-slate/60";

  return (
    <>
      {/* Scrim */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={handleClose}
        aria-hidden
      />

      {/* Slide-over */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-ink/[0.08] bg-white shadow-2xl transition-transform duration-300 ease-out sm:max-w-[480px]",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="relative shrink-0 border-b border-ink/[0.08] bg-gradient-to-br from-paper to-white px-4 pb-4 pt-4">
          <button
            onClick={handleClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg text-slate transition-colors hover:bg-ink/[0.06] hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
          <h2 className="font-display text-xl text-ink">Add new lead</h2>
          <p className="mt-0.5 text-[0.78rem] text-slate/55">Fill in the details to add a new lead.</p>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {/* Name */}
          <div>
            <label className={labelClass}>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(false); }}
              placeholder="Full name"
              className={nameError ? errorInputClass : inputClass}
            />
            {nameError && (
              <p className="mt-1 text-[0.74rem] font-medium text-danger">Name is required.</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(false); }}
              placeholder="email@example.com"
              className={emailError ? errorInputClass : inputClass}
            />
            {emailError && (
              <p className="mt-1 text-[0.74rem] font-medium text-danger">Email is required.</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 000-0000"
              className={inputClass}
            />
          </div>

          {/* Source */}
          <div>
            <label className={labelClass}>Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className={selectClass}
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Stage */}
          <div>
            <label className={labelClass}>Stage</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as LeadStage)}
              className={selectClass}
            >
              {LEAD_STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Intent */}
          <div>
            <label className={labelClass}>Intent</label>
            <select
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              className={selectClass}
            >
              {INTENTS.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          {/* Community / Area */}
          <div>
            <label className={labelClass}>Community / Area</label>
            <input
              type="text"
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
              placeholder="e.g. Lake Oswego"
              className={inputClass}
            />
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Budget Min</label>
              <input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="450000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Budget Max</label>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="550000"
                className={inputClass}
              />
            </div>
          </div>

          {/* Assign Agent — real roster so the new lead resolves to a real owner */}
          <div>
            <label className={labelClass}>Assign agent</label>
            <select
              value={assignedAgent}
              onChange={(e) => setAssignedAgent(e.target.value)}
              className={selectClass}
            >
              {ASSIGNABLE_AGENTS.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-ink/[0.08] px-4 py-3 flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-ink py-2.5 text-[0.85rem] font-semibold text-white transition-colors hover:bg-ink/90"
          >
            Save lead
          </button>
          <button
            onClick={handleClose}
            className="rounded-xl border border-ink/[0.08] bg-white px-4 py-2.5 text-[0.85rem] font-semibold text-ink transition-colors hover:bg-paper"
          >
            Cancel
          </button>
        </div>
      </aside>
    </>
  );
}
