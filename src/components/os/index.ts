/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — primitives barrel

   Single import surface for the operator workspace. Pages compose from
   "@/components/os" and must NOT re-implement the shell, tables, drawers,
   kanban, or AI cards (build-reference PART 3 / build-order rule).

   Everything below is re-exported by name from the files in this folder.
   ────────────────────────────────────────────────────────────────────────── */

// App shell ----------------------------------------------------------------
export { AppShell } from "./AppShell";
export { SidebarNav, NAV_ITEMS, BOTTOM_TABS } from "./SidebarNav";
export type { NavItem } from "./SidebarNav";
export { TopCommandBar } from "./TopCommandBar";
export { AISidecar, useAiSidecar, AiSidecarProvider } from "./AISidecar";

// Real-asset primitives ----------------------------------------------------
export { Avatar } from "./Avatar";
export { PropertyThumb } from "./PropertyThumb";

// KPIs ---------------------------------------------------------------------
export { KpiCard, KpiStrip, SegmentedKpis } from "./KpiCard";
export type { DeltaTone, ValueTone, SegmentItem } from "./KpiCard";

// Status / chips -----------------------------------------------------------
export { StatusChip, Dot, ScoreChip, PriorityBadge } from "./StatusChip";
export type { ChipTone, PriorityLevel } from "./StatusChip";

// Score visualisations -----------------------------------------------------
export { ScoreRing } from "./ScoreRing";

// Saved-view tabs ----------------------------------------------------------
export { SavedViewTabs } from "./SavedViewTabs";
export type { SavedView } from "./SavedViewTabs";

// Tables -------------------------------------------------------------------
export { DataTable, TwoLineCell, InitialsToken } from "./DataTable";
export type { Column, Align } from "./DataTable";

// Mobile primitives — pane switcher (R1) ------------------------------------
export { PaneSwitcher, usePaneSwitcher } from "./PaneSwitcher";
export type { Pane, PaneSwitcherController } from "./PaneSwitcher";

// Territory map (G-C) ------------------------------------------------------
export { TerritoryMap, MATIN_OFFICES, PORTLAND_METRO_CENTER } from "./TerritoryMap";
export type {
  TerritoryMapProps,
  TerritoryOffice,
  TerritoryListing,
  TerritoryCommunity,
} from "./TerritoryMap";

// Kanban -------------------------------------------------------------------
export { KanbanBoard } from "./KanbanBoard";
export type { KanbanColumn, BackendColumn } from "./KanbanBoard";

// Progress / pacing --------------------------------------------------------
export { ProgressTrack, PaceBar } from "./ProgressTrack";
export type { TrackTone } from "./ProgressTrack";

// Record drawer ------------------------------------------------------------
export { RecordDrawer } from "./RecordDrawer";
export type { DrawerTab } from "./RecordDrawer";

// Empty / loading ----------------------------------------------------------
export { EmptyState, Skeleton } from "./EmptyState";

// AI surfaces — action card / docked panel / callout / insight chip ---------
export { AIActionCard } from "./AIActionCard";
export type { AIAction, RiskTag, Confidence } from "./AIActionCard";
export { AiPanel } from "./AiPanel";
export type { AiMessage } from "./AiPanel";
export { CalloutCard } from "./CalloutCard";
export type { CalloutTone } from "./CalloutCard";
export { AIInsightChip } from "./AIInsightChip";

// Timelines ----------------------------------------------------------------
export { ActivityTimeline } from "./ActivityTimeline";
export type { ActivityItem, ActivityChannel, ActivityTagTone } from "./ActivityTimeline";
export { MilestoneTimeline } from "./MilestoneTimeline";
export type { Milestone, MilestoneTone } from "./MilestoneTimeline";

// Checklist ----------------------------------------------------------------
export { ChecklistPanel, ChecklistRow } from "./ChecklistPanel";
export type { ChecklistItem, ChecklistGroup, ChecklistStatus } from "./ChecklistPanel";

// Document preview ---------------------------------------------------------
export { DocumentPreview } from "./DocumentPreview";

// Branded document system (G-B — built by Agent B in parallel) --------------
export { BrandedDocument } from "./BrandedDocument";
