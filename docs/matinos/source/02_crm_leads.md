# 02. CRM & Leads Workbench

**Navigation label:** CRM & Leads  
**Primary roles:** Agent, ISA, broker, team lead, admin

## Purpose

Daily lead conversion cockpit with smart lists, lead scoring, communication activity, routing, AI next actions, and Lead 360 context.

## Frontend layout

- Top: KPI cards for new leads, uncontacted, hot buyers, hot sellers, average first response time, appointments set.
- Left/center: smart-list tabs and data table with scoring, intent, source, recent activity, owner, stage, next task.
- Right: Lead 360 drawer with profile, timeline, communication thread, website behavior, property interests, AI summary.
- AI sidecar stays contextual to selected lead.

## Frontend component build

Use these reusable components and compose them inside the global app shell:

- `SmartListTabs`
- `LeadDataTable`
- `LeadScoreBadge`
- `IntentBadge`
- `Lead360Drawer`
- `ActivityTimeline`
- `MessageComposer`
- `CallLogPanel`
- `SavedSearchPanel`
- `AISidecar`
- `AssignmentPopover`

## User actions

- Call/text/email
- Assign agent
- Change stage
- Create appointment
- Create follow-up
- Merge duplicate
- Enroll in campaign
- Convert to seller opportunity
- Convert to buyer agreement

## AI functionality

- Summarize lead
- Draft first text
- Draft follow-up email
- Recommend next action
- Score buyer/seller intent
- Detect duplicate lead
- Explain score

## Automation workflows

- New IDX lead → normalize → dedupe → score → route → create first-call task → draft intro message
- Lead views 3+ homes in 24h → increase score → alert agent → draft property follow-up
- No response 7 days → reactivation campaign suggestion

## Backend data objects

- `contacts`
- `lead_sources`
- `lead_events`
- `lead_scores`
- `lead_assignments`
- `conversations`
- `messages`
- `appointments`
- `tasks`
- `properties`
- `saved_searches`
- `activity_events`
- `ai_actions`

## API contracts to implement

- `GET /api/leads`
- `GET /api/leads/:id`
- `POST /api/leads/:id/assign`
- `POST /api/leads/:id/messages/draft`
- `POST /api/leads/:id/convert-seller`
- `POST /api/leads/:id/appointments`

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

- Filters update table without page reload
- Lead 360 drawer opens without losing table state
- All messages/tasks write to activity timeline
- AI drafts require approval before sending
- Lead assignment generates an audit event


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
