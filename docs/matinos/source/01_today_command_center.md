# 01. Today Command Center

**Navigation label:** Today  
**Primary roles:** Agent, broker, coordinator, marketing, leadership, admin

## Purpose

A single morning command screen that merges work from CRM, listing operations, transactions, documents, marketing, AI approvals, and system failures into one prioritized queue.

## Frontend layout

- Top KPI strip: new leads, hot seller signals, listings blocked, transactions at risk, AI drafts waiting, workflow errors.
- Center work queue with tabs for My Work, Team, High Risk, AI Drafts, Failed Automations.
- Right rail with today appointments, overnight AI summary, risk alerts, and quick create actions.
- Selected item opens a right drawer with record preview and action buttons.

## Frontend component build

Use these reusable components and compose them inside the global app shell:

- `AppShell`
- `KpiCard`
- `UnifiedWorkQueue`
- `PriorityBadge`
- `RecordPreviewDrawer`
- `AISummaryCard`
- `CalendarRail`
- `AutomationAlertCard`
- `QuickActionButton`
- `TeamFilterBar`

## User actions

- Open selected work item
- Assign/reassign
- Create task
- Approve AI draft
- Retry failed workflow
- Snooze alert
- Jump to source record
- Ask AI for summary

## AI functionality

- Generate overnight brokerage summary
- Prioritize work queue
- Explain why a task is urgent
- Draft response for selected lead/client
- Summarize team risks

## Automation workflows

- Every module publishes actionable items into Today queue
- Workflow failure creates Systems Health item and Today alert
- Deadline inside 48 hours creates transaction risk item
- Unapproved AI output creates approval item

## Backend data objects

- `activity_events`
- `tasks`
- `contacts`
- `listings`
- `transactions`
- `document_packets`
- `workflow_runs`
- `ai_actions`
- `appointments`
- `users`
- `teams`

## API contracts to implement

- `GET /api/dashboard/today`
- `GET /api/work-queue`
- `POST /api/tasks`
- `POST /api/ai-actions/:id/approve`
- `POST /api/workflow-runs/:id/retry`

## Required states

- Empty state: explain what this module does and provide the first action.
- Loading state: skeleton rows/cards that preserve layout stability.
- Error state: human-readable error, retry button, and Systems Health link when relevant.
- Permission state: explain access limitation without exposing restricted data.
- Audit state: every status-changing action writes an activity/audit event.

## Backend implementation notes

- Use server-side authorization on every endpoint, not just hidden UI buttons.
- Write module-specific activity events so the record timeline stays complete.
- Keep computed status fields reproducible from underlying records where possible.
- Store external IDs and raw integration references for future sync/debugging.
- Use optimistic UI only for reversible actions; wait for server confirmation for legal/compliance/send actions.

## Acceptance criteria

- User sees role-filtered work in under 2 seconds
- Every queue item links to an underlying source record
- AI summaries show source events used
- Workflow failures are retryable from the UI
- KPI cards match underlying report queries


## Shared UI rules

- Keep one global shell: fixed left sidebar, top command bar, content workspace, optional right drawer.
- Use the same table, kanban, timeline, drawer, AI card, and approval components everywhere.
- Every record should have a visible status, owner, next action, due date, last activity, and source.
- Avoid weak dashboard-only design. Each screen should let the user do work immediately.
- Put AI inside workflows, not as a random chatbot. AI should summarize, draft, validate, score, explain, and create proposed actions.
- Every AI output should have a source record, confidence/quality signal, approval state, and audit trail.
- Human approval is required for client-facing messages, legal documents, broker/compliance changes, and irreversible workflow changes.

## Shared backend rules

- Everything important is a record.
- Everything that happens becomes an `activity_event`.
- All automation runs write to `workflow_runs` and `workflow_steps`.
- All AI actions write to `ai_actions` with model, prompt version, input refs, output, approval status, and cost estimate.
- All admin/system changes write to `audit_logs`.
- External systems are hidden behind integration adapters so the frontend never depends directly on vendor payload shapes.
- Use idempotency keys for webhook-driven automations to avoid duplicate contacts/tasks/doc packets.
