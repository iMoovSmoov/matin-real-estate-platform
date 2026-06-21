"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — RecordDrawer   (ref §1.9)

   Right-side LIGHT record drawer (Follow Up Boss "Lead Details" pattern):
     - dark header bar with title/subtitle + ✕
     - optional internal tab strip (Info/Comms/Notes/Tasks…)
     - scrolling body (caller supplies the activity timeline / content)
     - bottom action bar (compact buttons)
     - backdrop; row-click opens it, never navigate away for routine inspection

   Slides over the right ~36% of the workspace (fixed, w-[440px]). Closes on
   Esc and backdrop click. Body scroll is locked while open. Client.
   ────────────────────────────────────────────────────────────────────────── */

export type DrawerTab = { key: string; label: ReactNode };

export function RecordDrawer({
  open,
  onClose,
  title,
  subtitle,
  tabs,
  activeTab,
  onTab,
  children,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  tabs?: DrawerTab[];
  activeTab?: string;
  onTab?: (key: string) => void;
  children: ReactNode;
  actions?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : "Record details"}>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close drawer"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40"
      />

      {/* Panel */}
      <div className="absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-cloud shadow-lift">
        {/* Dark header bar */}
        <div className="flex items-start justify-between gap-3 bg-ink-900 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate font-display text-[1.15rem] font-normal leading-tight text-cloud">
              {title}
            </h2>
            {subtitle != null ? (
              <p className="mt-0.5 truncate text-[0.78rem] text-slate-300">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1.5 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Internal tab strip */}
        {tabs && tabs.length > 0 ? (
          <div
            role="tablist"
            className="flex shrink-0 items-center gap-1 border-b border-mist bg-cloud px-3"
          >
            {tabs.map((t) => {
              const isActive = t.key === activeTab;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onTab?.(t.key)}
                  className={cn(
                    "relative px-3 py-2.5 text-[0.8rem] font-medium transition-colors",
                    isActive ? "text-ink" : "text-slate hover:text-ink",
                  )}
                >
                  {t.label}
                  {isActive ? (
                    <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-ink" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Scrolling body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {/* Bottom action bar */}
        {actions != null ? (
          <div className="flex shrink-0 items-center gap-2 border-t border-mist bg-cloud px-5 py-3">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
