"use client";

import { useMemo, useState } from "react";
import { Layers, CircleCheck } from "lucide-react";
import { RecordDrawer } from "@/components/os";
import { cn } from "@/lib/utils";
import type { Packet, PacketDoc, DocStatus } from "./packets";

/* ──────────────────────────────────────────────────────────────────────────
   NewPacketDrawer — "+ New packet" form drawer.

   A real create flow: choose a template type, name the subject + owner, and
   pick which standard documents to seed. Submit builds a Packet and hands it
   back to the workspace, which appends it to local state and selects it — it
   shows immediately. No navigation, no AI sidecar.
   ────────────────────────────────────────────────────────────────────────── */

type OwnerOption = { name: string; slug: string; initials: string };

const OWNERS: OwnerOption[] = [
  { name: "Jordan Matin", slug: "jordan-matin", initials: "JM" },
  { name: "Amanda Conlon", slug: "amanda-conlon", initials: "AC" },
];

type Template = {
  id: string;
  name: string;
  source: string;
  /** Catalog of documents the template can seed, pre-selected by default. */
  docs: { code: string; title: string; status: DocStatus; pages: number; signatureField: boolean; lines: number }[];
};

const TEMPLATES: Template[] = [
  {
    id: "listing",
    name: "Listing packet",
    source: "listings > document_packets > document_fields + document_signers",
    docs: [
      { code: "OREF-015", title: "Residential Listing Agreement — Exclusive", status: "draft", pages: 6, signatureField: true, lines: 7 },
      { code: "C-530", title: "Initial Agency Disclosure Pamphlet", status: "draft", pages: 2, signatureField: false, lines: 6 },
      { code: "SPDS", title: "Seller's Property Disclosure Statement", status: "required", pages: 5, signatureField: true, lines: 8 },
      { code: "OREF-040", title: "Disclosed Limited Agency — Sellers", status: "required", pages: 1, signatureField: true, lines: 6 },
    ],
  },
  {
    id: "buyer",
    name: "Buyer agreement",
    source: "contacts > document_packets > saved_searches + agreements",
    docs: [
      { code: "C-565", title: "Buyer Representation Agreement — Exclusive", status: "required", pages: 5, signatureField: true, lines: 7 },
      { code: "C-530", title: "Initial Agency Disclosure Pamphlet", status: "draft", pages: 2, signatureField: false, lines: 6 },
      { code: "OREF-040", title: "Disclosed Limited Agency — Buyers", status: "draft", pages: 1, signatureField: true, lines: 5 },
    ],
  },
  {
    id: "offer",
    name: "Offer packet",
    source: "transactions > document_packets > listings + cash_offer_requests",
    docs: [
      { code: "OREF-001", title: "Residential Real Estate Sale Agreement", status: "required", pages: 12, signatureField: true, lines: 9 },
      { code: "EMR", title: "Earnest Money Receipt", status: "required", pages: 1, signatureField: false, lines: 4 },
      { code: "LBP", title: "Lead-Based Paint Disclosure", status: "draft", pages: 2, signatureField: true, lines: 5 },
    ],
  },
  {
    id: "disclosure",
    name: "Seller disclosure",
    source: "seller_leads > document_packets > properties + valuations",
    docs: [
      { code: "SPDS", title: "Seller's Property Disclosure Statement", status: "required", pages: 5, signatureField: true, lines: 8 },
      { code: "LBP", title: "Lead-Based Paint Disclosure", status: "draft", pages: 2, signatureField: true, lines: 5 },
      { code: "C-530", title: "Initial Agency Disclosure Pamphlet", status: "draft", pages: 2, signatureField: false, lines: 6 },
    ],
  },
];

const PHOTO_SEEDS = [3, 8, 12, 17, 5, 20, 1, 9, 14, 7];

export function NewPacketDrawer({
  open,
  onClose,
  onCreate,
  index,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (packet: Packet) => void;
  /** Number of existing packets — drives a stable photo seed + id suffix. */
  index: number;
}) {
  const [templateId, setTemplateId] = useState<string>(TEMPLATES[0].id);
  const [subject, setSubject] = useState("");
  const [ownerSlug, setOwnerSlug] = useState<string>(OWNERS[0].slug);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(
    () => new Set(TEMPLATES[0].docs.map((d) => d.code)),
  );

  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];

  // Reset the form to defaults each time the drawer (re)opens — render-time
  // "adjust state on prop change" (no effect, no cascading renders).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTemplateId(TEMPLATES[0].id);
      setSubject("");
      setOwnerSlug(OWNERS[0].slug);
      setSelectedDocs(new Set(TEMPLATES[0].docs.map((d) => d.code)));
    }
  }

  // Re-seed the doc selection whenever the chosen template changes (render-time).
  const [lastTemplateId, setLastTemplateId] = useState(templateId);
  if (templateId !== lastTemplateId) {
    setLastTemplateId(templateId);
    setSelectedDocs(new Set(template.docs.map((d) => d.code)));
  }

  const owner = OWNERS.find((o) => o.slug === ownerSlug) ?? OWNERS[0];
  const chosenCount = selectedDocs.size;
  const canCreate = subject.trim().length > 1 && chosenCount > 0;

  const previewCodes = useMemo(
    () => template.docs.filter((d) => selectedDocs.has(d.code)),
    [template, selectedDocs],
  );

  function toggleDoc(code: string) {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function submit() {
    if (!canCreate) return;
    const suffix = String(index + 1).padStart(3, "0");
    const docs: PacketDoc[] = previewCodes.map((d, i) => ({
      id: `DOC-NEW-${suffix}-${i + 1}`,
      code: d.code,
      title: d.title,
      status: d.status,
      page: 1,
      pages: d.pages,
      signatureField: d.signatureField,
      lines: d.lines,
      missing:
        d.status === "required"
          ? ["Required — not started", "Auto-fill from record pending"]
          : undefined,
    }));
    const packet: Packet = {
      id: `PKT-NEW-${suffix}`,
      name: template.name,
      subject: subject.trim(),
      owner: owner.initials,
      ownerName: owner.name,
      ownerSlug: owner.slug,
      photoSeed: PHOTO_SEEDS[index % PHOTO_SEEDS.length],
      source: template.source,
      lastUpdated: `Created just now by ${owner.name}`,
      docs,
    };
    onCreate(packet);
    onClose();
  }

  return (
    <RecordDrawer
      open={open}
      onClose={onClose}
      title="New packet"
      subtitle="Seed documents from a template and a source record"
      actions={
        <div className="flex w-full items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-mist bg-cloud px-4 py-2.5 text-[0.82rem] font-medium text-ink transition-colors hover:border-ink/20"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canCreate}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[0.84rem] font-semibold transition-colors",
              canCreate
                ? "bg-ink text-cloud hover:bg-ink-800"
                : "cursor-not-allowed bg-paper-200 text-slate",
            )}
          >
            <Layers className="h-4 w-4" />
            Create packet · {chosenCount} doc{chosenCount === 1 ? "" : "s"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Template type */}
        <Field label="Packet template">
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((t) => {
              const on = t.id === templateId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  aria-pressed={on}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left text-[0.82rem] font-medium transition-colors",
                    on
                      ? "border-ink bg-ink text-cloud"
                      : "border-mist bg-cloud text-ink hover:border-ink/20",
                  )}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Subject */}
        <Field
          label="Source record / subject"
          hint="The listing, contact, or deal this packet binds to."
        >
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. 1274 NW Everett St · Portland"
            className="w-full rounded-xl border border-mist bg-cloud px-3 py-2.5 text-[0.84rem] text-ink placeholder:text-slate/50 focus:border-ink/30 focus:outline-none"
          />
        </Field>

        {/* Owner */}
        <Field label="Coordinator / owner">
          <div className="flex gap-2">
            {OWNERS.map((o) => {
              const on = o.slug === ownerSlug;
              return (
                <button
                  key={o.slug}
                  type="button"
                  onClick={() => setOwnerSlug(o.slug)}
                  aria-pressed={on}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[0.82rem] font-medium transition-colors",
                    on
                      ? "border-ink bg-ink text-cloud"
                      : "border-mist bg-cloud text-ink hover:border-ink/20",
                  )}
                >
                  {o.name}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Documents to seed */}
        <Field label={`Documents (${chosenCount} of ${template.docs.length})`}>
          <ul className="space-y-1.5">
            {template.docs.map((d) => {
              const on = selectedDocs.has(d.code);
              return (
                <li key={d.code}>
                  <button
                    type="button"
                    onClick={() => toggleDoc(d.code)}
                    aria-pressed={on}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                      on
                        ? "border-ink/30 bg-paper-200"
                        : "border-mist bg-cloud hover:border-ink/20",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 ring-inset transition-colors",
                        on
                          ? "bg-ink text-cloud ring-ink"
                          : "bg-cloud text-transparent ring-mist",
                      )}
                    >
                      <CircleCheck className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.82rem] font-medium text-ink">
                        {d.title}
                      </span>
                      <span className="font-mono text-[0.7rem] text-slate">
                        {d.code} · {d.pages} pp
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Field>

        {/* Backend join note (transparency) */}
        <div className="rounded-xl border border-mist bg-paper px-3.5 py-3">
          <p className="eyebrow text-slate">Backend record joins</p>
          <p className="mt-1.5 font-mono text-[0.72rem] leading-relaxed text-slate">
            {template.source}
          </p>
        </div>
      </div>
    </RecordDrawer>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[0.78rem] font-semibold text-ink">{label}</label>
      {hint ? <p className="mt-0.5 text-[0.74rem] text-slate">{hint}</p> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}
