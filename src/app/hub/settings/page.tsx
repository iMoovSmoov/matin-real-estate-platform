"use client";

import { useState, useEffect, useRef } from "react";
import {
  Settings,
  User,
  Bell,
  Palette,
  Puzzle,
  Check,
  FileImage,
  RefreshCw,
  Link2,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────────────────────── */

type Tab = "profile" | "notifications" | "appearance" | "integrations";
type Channel = "email" | "push" | "sms";

/* ── Toggle component ───────────────────────────────────────────────────────── */

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
        checked ? "bg-ink" : "bg-ink/20",
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-1",
        )}
      />
    </button>
  );
}

/* ── Notification row ───────────────────────────────────────────────────────── */

type NotifRow = {
  key: string;
  label: string;
  desc: string;
  channels: Channel[];
};

const NOTIF_ROWS: NotifRow[] = [
  {
    key: "new-lead",
    label: "New lead assigned",
    desc: "Notify when a new lead is routed to you",
    channels: ["email", "push"],
  },
  {
    key: "stale-lead",
    label: "Lead uncontacted >24h",
    desc: "Remind you when a lead hasn't been reached",
    channels: ["email", "push"],
  },
  {
    key: "contract-deadline",
    label: "Contract deadline <48h",
    desc: "Alert before critical transaction deadlines",
    channels: ["email", "push", "sms"],
  },
  {
    key: "buyer-agreement",
    label: "Buyer agreement unsigned >3 days",
    desc: "Remind you of unsigned buyer agreements",
    channels: ["email"],
  },
  {
    key: "weekly-report",
    label: "Weekly report",
    desc: "Your weekly metrics digest, sent every Monday",
    channels: ["email"],
  },
];

type NotifState = Record<string, Record<Channel, boolean>>;

function buildDefaultNotifs(): NotifState {
  const defaults: NotifState = {};
  NOTIF_ROWS.forEach((row) => {
    defaults[row.key] = {} as Record<Channel, boolean>;
    row.channels.forEach((ch) => {
      defaults[row.key][ch] = true;
    });
  });
  return defaults;
}

/* ── Integration row type ───────────────────────────────────────────────────── */

type Integration = {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  colorClass: string;
  initials: string;
};

const INTEGRATIONS: Integration[] = [
  {
    id: "rmls",
    name: "RMLS",
    description: "Regional Multiple Listing Service — Oregon & SW Washington",
    connected: true,
    colorClass: "bg-ink/[0.07] text-ink",
    initials: "MLS",
  },
  {
    id: "docusign",
    name: "DocuSign",
    description: "eSignature for contracts, agreements, and disclosures",
    connected: false,
    colorClass: "bg-amber-100 text-amber-700",
    initials: "DS",
  },
  {
    id: "gcal",
    name: "Google Calendar",
    description: "Sync showings, deadlines, and appointments",
    connected: false,
    colorClass: "bg-emerald-100 text-emerald-700",
    initials: "GC",
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Automate workflows across your brokerage stack",
    connected: false,
    colorClass: "bg-orange-100 text-orange-700",
    initials: "ZP",
  },
  {
    id: "zillow",
    name: "Zillow",
    description: "Lead import and listing syndication",
    connected: false,
    colorClass: "bg-blue-100 text-blue-700",
    initials: "ZI",
  },
];

/* ── Toast ──────────────────────────────────────────────────────────────────── */

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-ink/[0.08] bg-white px-4 py-3 shadow-[0_8px_24px_rgb(0,0,0,0.12)]">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Check className="h-3 w-3" />
      </span>
      <span className="text-[0.84rem] font-medium text-ink">{message}</span>
    </div>
  );
}

/* ── Profile Tab ────────────────────────────────────────────────────────────── */

function ProfileTab() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "Alicia Smith",
    title: "Lead Listing Specialist",
    phone: "",
    email: "",
    bio: "",
    license: "",
  });

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="rounded-2xl border border-ink/[0.08] bg-white p-6 shadow-[0_1px_4px_rgb(0,0,0,0.04)]">
        <h2 className="mb-4 font-display text-[1.05rem] font-semibold text-ink">Profile photo</h2>
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-ink/20 bg-paper transition-colors hover:border-azure/40 hover:bg-azure/[0.03] cursor-pointer">
            <div className="text-center">
              <FileImage className="mx-auto h-6 w-6 text-slate/40" />
              <span className="mt-1 block text-[0.6rem] font-medium text-slate/50">Upload</span>
            </div>
          </div>
          <div>
            <p className="text-[0.85rem] font-medium text-ink">Upload a profile photo</p>
            <p className="mt-0.5 text-[0.74rem] text-slate/60">
              JPG or PNG, max 5 MB. Displayed on your public agent profile.
            </p>
            <button className="mt-2 rounded-lg border border-ink/[0.1] bg-white px-3 py-1.5 text-[0.78rem] font-medium text-ink transition-colors hover:bg-paper">
              Choose file
            </button>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="rounded-2xl border border-ink/[0.08] bg-white p-6 shadow-[0_1px_4px_rgb(0,0,0,0.04)]">
        <h2 className="mb-4 font-display text-[1.05rem] font-semibold text-ink">Personal information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[0.76rem] font-semibold text-slate/70">Full name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-ink/[0.1] bg-paper px-3 py-2 text-[0.88rem] text-ink transition-colors focus:border-azure/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-azure/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[0.76rem] font-semibold text-slate/70">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-ink/[0.1] bg-paper px-3 py-2 text-[0.88rem] text-ink transition-colors focus:border-azure/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-azure/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[0.76rem] font-semibold text-slate/70">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border border-ink/[0.1] bg-paper px-3 py-2 text-[0.88rem] text-ink transition-colors focus:border-azure/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-azure/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[0.76rem] font-semibold text-slate/70">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border border-ink/[0.1] bg-paper px-3 py-2 text-[0.88rem] text-ink transition-colors focus:border-azure/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-azure/10"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[0.76rem] font-semibold text-slate/70">
              Bio{" "}
              <span className="font-normal text-slate/50">— shown on your public agent profile</span>
            </label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              className="w-full resize-none rounded-lg border border-ink/[0.1] bg-paper px-3 py-2 text-[0.88rem] text-ink transition-colors focus:border-azure/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-azure/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[0.76rem] font-semibold text-slate/70">License number</label>
            <input
              type="text"
              value={form.license}
              onChange={(e) => setForm((f) => ({ ...f, license: e.target.value }))}
              className="w-full rounded-lg border border-ink/[0.1] bg-paper px-3 py-2 text-[0.88rem] text-ink transition-colors focus:border-azure/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-azure/10"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handleSave}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[0.85rem] font-semibold transition-all",
              saved
                ? "bg-emerald-500 text-white"
                : "bg-ink text-white hover:bg-ink/85",
            )}
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Saved
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>

      {/* Brokerage info — read only */}
      <div className="rounded-2xl border border-ink/[0.06] bg-paper/60 px-5 py-4">
        <p className="text-[0.82rem] text-slate/70">
          <span className="font-semibold text-ink">Brokerage:</span> Matin Real Estate
          <span className="mx-2 text-ink/20">|</span>
          <span className="font-semibold text-ink">MLS:</span> RMLS
          <span className="mx-2 text-ink/20">|</span>
          <span className="font-semibold text-ink">License:</span> Oregon &amp; Washington
        </p>
      </div>
    </div>
  );
}

/* ── Notifications Tab ──────────────────────────────────────────────────────── */

function NotificationsTab() {
  const [notifs, setNotifs] = useState<NotifState>(buildDefaultNotifs);
  const [saved, setSaved] = useState(false);

  function toggle(rowKey: string, channel: Channel) {
    setNotifs((prev) => ({
      ...prev,
      [rowKey]: {
        ...prev[rowKey],
        [channel]: !prev[rowKey][channel],
      },
    }));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const ALL_CHANNELS: Channel[] = ["email", "push", "sms"];
  const CHANNEL_LABELS: Record<Channel, string> = {
    email: "Email",
    push: "Push",
    sms: "SMS",
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-ink/[0.08] bg-white shadow-[0_1px_4px_rgb(0,0,0,0.04)]">
        {/* Header row */}
        <div className="flex items-center border-b border-ink/[0.07] px-5 py-3">
          <div className="flex-1">
            <p className="text-[0.72rem] font-bold uppercase tracking-widest text-slate/50">Notification</p>
          </div>
          <div className="flex gap-6 pr-1">
            {ALL_CHANNELS.map((ch) => (
              <p key={ch} className="w-10 text-center text-[0.72rem] font-bold uppercase tracking-widest text-slate/50">
                {CHANNEL_LABELS[ch]}
              </p>
            ))}
          </div>
        </div>

        {/* Rows */}
        {NOTIF_ROWS.map((row, i) => (
          <div
            key={row.key}
            className={cn(
              "flex items-center px-5 py-4",
              i < NOTIF_ROWS.length - 1 && "border-b border-ink/[0.05]",
            )}
          >
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-[0.88rem] font-medium text-ink">{row.label}</p>
              <p className="mt-0.5 text-[0.74rem] text-slate/60">{row.desc}</p>
            </div>
            <div className="flex gap-6 pr-1">
              {ALL_CHANNELS.map((ch) => (
                <div key={ch} className="flex w-10 items-center justify-center">
                  {row.channels.includes(ch) ? (
                    <Toggle
                      checked={notifs[row.key]?.[ch] ?? false}
                      onChange={() => toggle(row.key, ch)}
                      label={`${row.label} ${ch}`}
                    />
                  ) : (
                    <span className="h-6 w-10" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[0.85rem] font-semibold transition-all",
          saved
            ? "bg-emerald-500 text-white"
            : "bg-ink text-white hover:bg-ink/85",
        )}
      >
        {saved ? (
          <>
            <Check className="h-4 w-4" />
            Saved
          </>
        ) : (
          "Save preferences"
        )}
      </button>
    </div>
  );
}

/* ── Appearance Tab ─────────────────────────────────────────────────────────── */

function AppearanceTab() {
  const [landing, setLanding] = useState<"dashboard" | "workspace" | "crm">("dashboard");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-5">
      {/* Theme */}
      <div className="rounded-2xl border border-ink/[0.08] bg-white p-6 shadow-[0_1px_4px_rgb(0,0,0,0.04)]">
        <h2 className="mb-1 font-display text-[1.05rem] font-semibold text-ink">Theme</h2>
        <p className="mb-4 text-[0.76rem] text-slate/60">Choose how Matin Hub looks to you.</p>
        <div className="flex gap-3">
          {/* Light — selected */}
          <button
            className="relative flex w-32 flex-col items-start gap-2 rounded-xl border-2 border-ink bg-ink/[0.03] p-4 transition-all"
          >
            <div className="h-10 w-full rounded-lg border border-ink/[0.1] bg-white">
              <div className="m-1.5 h-1.5 w-8 rounded-full bg-ink/20" />
              <div className="mx-1.5 mt-1 h-1 w-5 rounded-full bg-ink/10" />
            </div>
            <span className="text-[0.82rem] font-medium text-ink">Light</span>
            <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-white">
              <Check className="h-2.5 w-2.5" />
            </span>
          </button>

          {/* Dark — locked */}
          <button
            disabled
            className="relative flex w-32 cursor-not-allowed flex-col items-start gap-2 rounded-xl border-2 border-ink/[0.1] bg-paper p-4 opacity-60 transition-all"
          >
            <div className="h-10 w-full rounded-lg border border-ink/20 bg-ink/80">
              <div className="m-1.5 h-1.5 w-8 rounded-full bg-white/20" />
              <div className="mx-1.5 mt-1 h-1 w-5 rounded-full bg-white/10" />
            </div>
            <span className="text-[0.82rem] font-medium text-ink">Dark</span>
            <span className="absolute right-2 top-2 rounded-full bg-slate/10 px-1.5 py-0.5 text-[0.56rem] font-semibold uppercase tracking-wide text-slate/60">
              Coming soon
            </span>
          </button>
        </div>
      </div>

      {/* Default page */}
      <div className="rounded-2xl border border-ink/[0.08] bg-white p-6 shadow-[0_1px_4px_rgb(0,0,0,0.04)]">
        <h2 className="mb-1 font-display text-[1.05rem] font-semibold text-ink">Default page</h2>
        <p className="mb-4 text-[0.76rem] text-slate/60">Which page opens when you enter Matin Hub.</p>
        <div className="flex flex-wrap gap-2.5">
          {(
            [
              { id: "dashboard" as const, label: "Dashboard" },
              { id: "workspace" as const, label: "My Workspace" },
              { id: "crm" as const, label: "CRM" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setLanding(opt.id)}
              className={cn(
                "rounded-lg border px-4 py-2.5 text-[0.88rem] font-medium transition-all",
                landing === opt.id
                  ? "border-ink bg-ink text-white shadow-sm"
                  : "border-ink/[0.1] bg-paper text-ink hover:border-ink/25 hover:bg-ink/[0.04]",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[0.85rem] font-semibold transition-all",
          saved
            ? "bg-emerald-500 text-white"
            : "bg-ink text-white hover:bg-ink/85",
        )}
      >
        {saved ? (
          <>
            <Check className="h-4 w-4" />
            Saved
          </>
        ) : (
          "Save preferences"
        )}
      </button>
    </div>
  );
}

/* ── Integrations Tab ───────────────────────────────────────────────────────── */

function IntegrationsTab() {
  const [toast, setToast] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  function handleConnect(name: string) {
    setToast(`Redirecting to ${name} authorization…`);
  }

  function handleSync() {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  }

  return (
    <>
      <div className="space-y-3">
        {INTEGRATIONS.map((integration) => (
          <div
            key={integration.id}
            className="flex items-center gap-4 rounded-2xl border border-ink/[0.08] bg-white px-5 py-4 shadow-[0_1px_4px_rgb(0,0,0,0.04)]"
          >
            {/* Logo placeholder */}
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[0.7rem] font-bold",
                integration.colorClass,
              )}
            >
              {integration.initials}
            </div>

            {/* Name + description */}
            <div className="min-w-0 flex-1">
              <p className="text-[0.9rem] font-semibold text-ink">{integration.name}</p>
              <p className="mt-0.5 text-[0.74rem] text-slate/60">{integration.description}</p>
            </div>

            {/* Status + action */}
            <div className="flex shrink-0 items-center gap-3">
              {integration.connected ? (
                <>
                  <span className="flex items-center gap-1.5 text-[0.78rem] font-medium text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Connected
                  </span>
                  <button
                    onClick={handleSync}
                    className="flex items-center gap-1.5 rounded-lg border border-ink/[0.1] bg-paper px-3 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:bg-white hover:text-ink"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
                    Sync now
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleConnect(integration.name)}
                  className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[0.78rem] font-semibold text-white transition-colors hover:bg-ink/85"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-ink/[0.06] bg-paper/60 px-5 py-4">
        <p className="flex items-center gap-2 text-[0.78rem] text-slate/60">
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          Need a different integration? Visit{" "}
          <a href="/hub/integrations" className="font-medium text-azure hover:underline">
            Integrations hub
          </a>{" "}
          to browse all available connectors.
        </p>
      </div>

      {toast && (
        <Toast message={toast} onDone={() => setToast(null)} />
      )}
    </>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────────── */

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "integrations", label: "Integrations", icon: Puzzle },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const tabsRef = useRef<HTMLDivElement>(null);

  // Allow deep-linking to a tab via URL hash (e.g., /hub/settings#profile)
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as Tab;
    if (TABS.some((t) => t.id === hash)) {
      setTab(hash);
    }
  }, []);

  return (
    <div className="mx-auto max-w-[900px] space-y-6 px-4 py-6 md:px-6 md:py-8">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink/[0.06] text-ink">
          <Settings className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>
          <p className="text-[0.78rem] text-slate/60">Manage your profile, preferences, and integrations.</p>
        </div>
      </div>

      {/* Tab bar */}
      <div ref={tabsRef} className="flex gap-0.5 border-b border-ink/[0.08]">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-[0.86rem] font-medium transition-colors",
              tab === id
                ? "border-b-2 border-ink -mb-px text-ink"
                : "text-slate/60 hover:text-ink",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === "profile" && <ProfileTab />}
        {tab === "notifications" && <NotificationsTab />}
        {tab === "appearance" && <AppearanceTab />}
        {tab === "integrations" && <IntegrationsTab />}
      </div>
    </div>
  );
}
