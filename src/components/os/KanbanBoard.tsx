import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — KanbanBoard   (ref §1.6)

   Stage columns flowing left→right with `Stage (count)` headers. Cards are
   rendered by the caller (renderCard) so the board stays generic. Columns
   visually separate AI-automated stages from human stages.

   Optional dark "Backend logic" column (--color-ink-800, light text) lists
   scoring inputs + a mono list of DB tables — makes the system feel
   transparent (wireframe 06 / §1.8 dark = AI/system). Server-safe.
   ────────────────────────────────────────────────────────────────────────── */

export type KanbanColumn<C> = {
  key: string;
  title: ReactNode;
  count: number;
  cards: C[];
  /** Tints the column header rule when this stage is AI-automated. */
  ai?: boolean;
};

export type BackendColumn = {
  title?: ReactNode;
  /** Plain-English scoring inputs / signals. */
  inputs?: ReactNode[];
  /** DB tables shown as a mono list. */
  tables?: string[];
};

export function KanbanBoard<C>({
  columns,
  renderCard,
  backendColumn,
  className,
}: {
  columns: KanbanColumn<C>[];
  renderCard: (card: C, column: KanbanColumn<C>) => ReactNode;
  backendColumn?: BackendColumn;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-4 overflow-x-auto pb-2", className)}>
      {columns.map((col) => (
        <section
          key={col.key}
          className="flex w-72 shrink-0 flex-col rounded-2xl border border-mist bg-paper-200/60"
          aria-label={typeof col.title === "string" ? col.title : col.key}
        >
          <header
            className={cn(
              "flex items-center justify-between gap-2 rounded-t-2xl border-b px-4 py-3",
              col.ai ? "border-gold/40 bg-gold-soft/40" : "border-mist bg-cloud",
            )}
          >
            <h3 className="flex items-center gap-1.5 font-sans text-[0.82rem] font-semibold text-ink">
              {col.ai ? (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
              ) : null}
              {col.title}
            </h3>
            <span className="rounded-full bg-paper-200 px-2 py-0.5 text-[0.72rem] font-semibold text-slate tabular-nums ring-1 ring-inset ring-mist">
              {col.count}
            </span>
          </header>
          <div className="flex flex-col gap-2.5 p-2.5">
            {col.cards.length === 0 ? (
              <p className="px-1 py-6 text-center text-[0.76rem] text-slate">No cards.</p>
            ) : (
              col.cards.map((card, i) => (
                <div key={i}>{renderCard(card, col)}</div>
              ))
            )}
          </div>
        </section>
      ))}

      {backendColumn ? (
        <section className="flex w-72 shrink-0 flex-col rounded-2xl border border-ink-700 bg-ink-800 text-slate-300">
          <header className="rounded-t-2xl border-b border-ink-700 px-4 py-3">
            <h3 className="font-sans text-[0.82rem] font-semibold text-cloud">
              {backendColumn.title ?? "Backend logic"}
            </h3>
          </header>
          <div className="flex flex-col gap-4 p-4">
            {backendColumn.inputs && backendColumn.inputs.length > 0 ? (
              <div>
                <p className="mb-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-slate-300/70">
                  Scoring inputs
                </p>
                <ul className="space-y-1">
                  {backendColumn.inputs.map((inp, i) => (
                    <li key={i} className="flex gap-1.5 text-[0.76rem] leading-snug text-slate-300">
                      <span className="text-gold" aria-hidden>
                        ·
                      </span>
                      <span>{inp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {backendColumn.tables && backendColumn.tables.length > 0 ? (
              <div>
                <p className="mb-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-slate-300/70">
                  Record joins
                </p>
                <ul className="space-y-0.5 font-mono text-[0.72rem] leading-snug text-slate-300">
                  {backendColumn.tables.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
