"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, ListFilter } from "lucide-react";
import { cn, initials as toInitials } from "@/lib/utils";
import { SavedViewTabs, type SavedView } from "./SavedViewTabs";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — DataTable<T>   (ref §1.5)

   The workhorse list surface (CRM, Forms, Reports, Admin, offer lists).
   - utility row above header: "Showing N" + filter funnel (left) /
     bulk-action slots (right, shown only when rows selected)
   - optional saved-view pill tabs
   - sortable header carets in .eyebrow style, hairline divider beneath
   - row-click opens a drawer (onRowClick), NOT a full-page nav
   - no zebra striping, no vertical gridlines — hairline rows only
   - helpers: TwoLineCell (bold title + muted sub) and InitialsToken (JL/AG)

   Sorting is client-side and uncontrolled (local useState) — pass a custom
   render but ensure column.key holds a sortable raw value on the row for the
   default comparator, or wire sorting upstream by omitting `sortable`.
   ────────────────────────────────────────────────────────────────────────── */

export type Align = "left" | "center" | "right";

export type Column<T> = {
  key: string;
  header: ReactNode;
  align?: Align;
  width?: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  /**
   * Card-mode (responsive, R3) hints — all optional & backward-compatible:
   * - `primary`: marks the single most important column (score / next-best-
   *   action / attributed $). It is pinned top-right of each mobile card so it
   *   is ALWAYS visible without horizontal scroll. Mark exactly one column.
   * - `cardHidden`: omit this column from the mobile card body (e.g. a
   *   redundant checkbox or a column already shown in the card title).
   * - `cardLabel`: the small label shown beside the value in the card body;
   *   defaults to the column `header`.
   */
  primary?: boolean;
  cardHidden?: boolean;
  cardLabel?: ReactNode;
};

type SortState = { key: string; dir: "asc" | "desc" } | null;

const ALIGN: Record<Align, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

/** Two-line primary cell: bold name + muted sub-line (the canonical CRM cell). */
export function TwoLineCell({
  title,
  sub,
  className,
}: {
  title: ReactNode;
  sub?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="truncate text-[0.86rem] font-semibold leading-tight text-ink">
        {title}
      </div>
      {sub != null ? (
        <div className="truncate text-[0.76rem] leading-tight text-slate">{sub}</div>
      ) : null}
    </div>
  );
}

/** Circular initials token (JL/AG) for dense owner cells — not a full avatar. */
export function InitialsToken({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper-200 text-[0.66rem] font-semibold uppercase leading-none text-slate ring-1 ring-inset ring-mist",
        className,
      )}
      title={name}
      aria-label={name}
    >
      {toInitials(name)}
    </span>
  );
}

function getSortValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

export function DataTable<T>({
  columns,
  rows,
  onRowClick,
  getRowId,
  selectable = false,
  utilityLeft,
  utilityRight,
  savedViews,
  className,
  emptyState,
  responsive = false,
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  getRowId: (row: T) => string;
  selectable?: boolean;
  utilityLeft?: ReactNode;
  utilityRight?: ReactNode;
  savedViews?: {
    views: SavedView[];
    active: string;
    onChange: (key: string) => void;
  };
  className?: string;
  emptyState?: ReactNode;
  /**
   * R3 — when true, render rows as stacked full-width cards below `lg` and keep
   * the dense table at `lg+`. Default OFF (fully backward-compatible). Use a
   * column's `primary`/`cardHidden`/`cardLabel` hints to control the card; the
   * `primary` column pins top-right so the most important value never needs a
   * horizontal scroll.
   */
  responsive?: boolean;
}) {
  const [sort, setSort] = useState<SortState>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortable) return rows;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = getSortValue(a, sort.key);
      const bv = getSortValue(b, sort.key);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, sort, columns]);

  function toggleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  const allIds = useMemo(() => rows.map(getRowId), [rows, getRowId]);
  const allSelected = selected.size > 0 && selected.size === allIds.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const colCount = columns.length + (selectable ? 1 : 0);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {savedViews ? (
        <SavedViewTabs
          views={savedViews.views}
          active={savedViews.active}
          onChange={savedViews.onChange}
        />
      ) : null}

      {/* Utility row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {selectable && selected.size > 0 ? (
            <span className="text-[0.78rem] font-medium text-ink tabular-nums">
              {selected.size} selected
            </span>
          ) : (
            <span className="text-[0.78rem] text-slate tabular-nums">
              Showing {rows.length}
            </span>
          )}
          {utilityLeft ?? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-mist bg-cloud px-2.5 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:text-ink"
            >
              <ListFilter className="h-3.5 w-3.5" />
              Filter
            </button>
          )}
        </div>
        {/* Bulk actions appear only when rows are selected */}
        <div className="flex items-center gap-2">
          {selectable && selected.size > 0 ? utilityRight : utilityRight}
        </div>
      </div>

      {/* Mobile card list (R3) — only when responsive; dense table hides < lg */}
      {responsive ? (
        <ul className="flex flex-col gap-2.5 lg:hidden">
          {sortedRows.length === 0 ? (
            <li className="rounded-2xl border border-mist bg-cloud px-4 py-10 shadow-soft">
              {emptyState ?? (
                <p className="text-center text-[0.82rem] text-slate">No records.</p>
              )}
            </li>
          ) : (
            sortedRows.map((row) => {
              const id = getRowId(row);
              const isSelected = selected.has(id);
              const clickable = typeof onRowClick === "function";
              const primaryCol = columns.find((c) => c.primary);
              const titleKey = columns[0]?.key;
              // Body = everything except the title column, the pinned primary
              // column, and any card-hidden columns.
              const bodyCols = columns.filter(
                (c) => !c.cardHidden && !c.primary && c.key !== titleKey,
              );
              const renderCell = (col: Column<T>): ReactNode =>
                col.render
                  ? col.render(row)
                  : ((getSortValue(row, col.key) as ReactNode) ?? "—");
              return (
                <li key={id}>
                  <div
                    role={clickable ? "button" : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    onClick={clickable ? () => onRowClick!(row) : undefined}
                    onKeyDown={
                      clickable
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onRowClick!(row);
                            }
                          }
                        : undefined
                    }
                    className={cn(
                      "rounded-2xl border bg-cloud p-4 shadow-soft transition-colors",
                      isSelected ? "border-ink/30 bg-paper" : "border-mist",
                      clickable &&
                        "cursor-pointer hover:border-ink/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
                    )}
                  >
                    {/* Top line: first column (identity) + pinned primary value */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        {selectable ? (
                          <input
                            type="checkbox"
                            aria-label={`Select row ${id}`}
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => toggleOne(id)}
                            className="h-4 w-4 shrink-0 cursor-pointer accent-ink"
                          />
                        ) : null}
                        <div className="min-w-0">
                          {columns[0] ? renderCell(columns[0]) : null}
                        </div>
                      </div>
                      {primaryCol && primaryCol.key !== titleKey ? (
                        <div className="shrink-0 text-right tabular-nums">
                          {renderCell(primaryCol)}
                        </div>
                      ) : null}
                    </div>

                    {/* Body: remaining columns as label / value rows */}
                    {bodyCols.length > 0 ? (
                      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-mist/70 pt-3">
                        {bodyCols.map((col) => (
                          <div key={col.key} className="min-w-0">
                            <dt className="eyebrow text-[0.6rem] text-slate">
                              {col.cardLabel ?? col.header}
                            </dt>
                            <dd className="mt-0.5 truncate text-[0.82rem] text-ink">
                              {renderCell(col)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      ) : null}

      {/* Table */}
      <div
        className={cn(
          "overflow-x-auto rounded-2xl border border-mist bg-cloud shadow-soft",
          responsive && "hidden lg:block",
        )}
      >
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-mist">
              {selectable ? (
                <th scope="col" className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    className="h-3.5 w-3.5 cursor-pointer accent-ink"
                  />
                </th>
              ) : null}
              {columns.map((col) => {
                const isSorted = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={col.width ? { width: col.width } : undefined}
                    className={cn("px-4 py-2.5", ALIGN[col.align ?? "left"])}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={cn(
                          "eyebrow inline-flex items-center gap-1 text-[0.66rem] transition-colors hover:text-ink",
                          col.align === "right" && "flex-row-reverse",
                        )}
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sort!.dir === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      <span className="eyebrow text-[0.66rem]">{col.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-10">
                  {emptyState ?? (
                    <p className="text-center text-[0.82rem] text-slate">No records.</p>
                  )}
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => {
                const id = getRowId(row);
                const isSelected = selected.has(id);
                const clickable = typeof onRowClick === "function";
                return (
                  <tr
                    key={id}
                    onClick={clickable ? () => onRowClick!(row) : undefined}
                    className={cn(
                      "border-b border-mist/70 last:border-b-0 transition-colors",
                      clickable && "cursor-pointer hover:bg-paper",
                      isSelected && "bg-paper",
                    )}
                  >
                    {selectable ? (
                      <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Select row ${id}`}
                          checked={isSelected}
                          onChange={() => toggleOne(id)}
                          className="h-3.5 w-3.5 cursor-pointer accent-ink"
                        />
                      </td>
                    ) : null}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={col.width ? { width: col.width } : undefined}
                        className={cn(
                          "px-4 py-3 text-[0.84rem] text-ink align-middle",
                          ALIGN[col.align ?? "left"],
                          col.align === "right" && "tabular-nums",
                        )}
                      >
                        {col.render
                          ? col.render(row)
                          : ((getSortValue(row, col.key) as ReactNode) ?? "—")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
