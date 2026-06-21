# MatinOS UI Design System and Frontend Build Guide

This is the design/build guide for a polished brokerage operating system. The goal is not a generic admin dashboard. It should feel like a command center built for a high-volume real estate brokerage.

## App shell

```txt
┌─────────────────────────────────────────────────────────────────────┐
│ Top Command Bar: page title, filters, search, create, Ask AI, alerts │
├───────────────┬───────────────────────────────────────┬─────────────┤
│ Sidebar Nav   │ Main Workspace                         │ Right Drawer│
│               │ KPI strip                              │ Record/AI   │
│ Today         │ filters/tabs                           │ timeline    │
│ CRM & Leads   │ table / kanban / checklist / timeline  │ actions     │
│ Seller Desk   │                                       │             │
└───────────────┴───────────────────────────────────────┴─────────────┘
```

## Navigation structure

```txt
Core Work
- Today
- CRM & Leads
- Seller / Cash Offers
- Listing Launch
- Buyer Agreements
- Transactions
- Forms & Docs

Growth
- Marketing Studio
- Coaching
- Reports

System
- Systems Health
- Admin Settings
```

## Visual design direction

- Premium internal SaaS feel: dark charcoal background, bright white content, restrained gold accents, subtle borders.
- Use high-density layouts but preserve hierarchy with spacing, grouping, and sticky headers.
- Cards should be functional, not decorative. Each card needs an action or drilldown.
- Tables should have saved filters, status chips, owner avatars, next-action column, and right-drawer selection.
- AI cards should look like operational recommendations with evidence, confidence, and approve/edit buttons.

## Core reusable components

| Component | Purpose | Props/data needed |
|---|---|---|
| `AppShell` | Global layout | activeNav, user, notifications, children |
| `SidebarNav` | Primary navigation | nav groups, permissions, active route |
| `TopCommandBar` | Filters/search/actions | title, filters, create menu, askAI handler |
| `KpiCard` | Metric summary | label, value, change, status, drilldown |
| `SmartFilterChips` | Saved filters | filters, active filter, counts |
| `DataTable` | CRM/report/admin lists | columns, rows, sorting, selection, row actions |
| `KanbanBoard` | Seller/listing pipelines | stages, cards, drag/drop permissions |
| `RecordDrawer` | Selected record context | record type, sections, actions |
| `ActivityTimeline` | Universal event view | activity_events ordered by time |
| `AISidecar` | Contextual AI actions | subject record, actions, approvals |
| `AIActionCard` | Single AI output | title, evidence, output, approve/edit/reject |
| `WorkflowRunTimeline` | Debug workflow | trigger, steps, logs, retry state |
| `DocumentPreview` | Forms/packet viewer | file, fields, signer states |
| `ChecklistPanel` | Operational work | groups, items, owners, due dates, blockers |

## Frontend route map

```txt
app/(app)/layout.tsx
app/(app)/today/page.tsx
app/(app)/leads/page.tsx
app/(app)/seller-opportunities/page.tsx
app/(app)/listings/page.tsx
app/(app)/buyer-agreements/page.tsx
app/(app)/transactions/page.tsx
app/(app)/documents/page.tsx
app/(app)/marketing/page.tsx
app/(app)/coaching/page.tsx
app/(app)/reports/page.tsx
app/(app)/systems-health/page.tsx
app/(app)/admin/page.tsx
```

## Suggested component file tree

```txt
components/
  shell/
    AppShell.tsx
    SidebarNav.tsx
    TopCommandBar.tsx
    GlobalSearch.tsx
  common/
    KpiCard.tsx
    StatusChip.tsx
    PriorityBadge.tsx
    SmartFilterChips.tsx
    DataTable.tsx
    KanbanBoard.tsx
    RecordDrawer.tsx
    ActivityTimeline.tsx
  ai/
    AISidecar.tsx
    AIActionCard.tsx
    AIApprovalBanner.tsx
    AIEvidenceList.tsx
  leads/
    LeadTable.tsx
    Lead360Drawer.tsx
    LeadScoreBadge.tsx
  listings/
    ListingReadinessMeter.tsx
    ListingChecklist.tsx
    MarketingKitPreview.tsx
  transactions/
    MilestoneTimeline.tsx
    RiskExplanationCard.tsx
  documents/
    DocumentPreview.tsx
    MissingFieldPanel.tsx
  systems/
    IntegrationStatusGrid.tsx
    WorkflowRunTimeline.tsx
    FieldMappingEditor.tsx
```

## Interaction standards

- Row click opens drawer, not a full page unless detail mode is needed.
- Bulk actions live above tables and require confirmation for message/document actions.
- All destructive actions require confirmation and create audit logs.
- Drag/drop pipeline movement should open a confirmation drawer when it triggers automations.
- AI outputs should never silently overwrite human-written content. Save as drafts or versions.
- Workflow failures should never be hidden. They should surface in Today and Systems Health.

## Mobile view

The mobile app does not need every admin feature. Build the agent mobile experience around:

- Inbox / new lead alerts
- Lead 360 summary
- Call/text/email quick actions
- Today tasks
- Appointment schedule
- AI suggested reply
- Listing/transaction risk alerts

