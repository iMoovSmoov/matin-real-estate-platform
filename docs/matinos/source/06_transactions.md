# 06. Transaction Operations Cockpit

**Navigation label:** Transactions  
**Primary roles:** Transaction coordinator, agent, broker, leadership, admin

## Purpose

Contract-to-close workspace with AI deadline extraction, milestone timelines, document state, parties, risk scoring, and leadership visibility.

## Frontend layout

- Top: transaction summary with address, client, agent, closing date, stage, risk level, parties.
- Center: milestone timeline + checklist table.
- Right: selected milestone/task/document drawer with risk explanation and actions.
- Tabs: Overview, Timeline, Docs, Parties, Email, Commission, Activity.

## Frontend component build

Use these reusable components and compose them inside the global app shell:

- `TransactionHeader`
- `RiskScoreBadge`
- `MilestoneTimeline`
- `TransactionChecklist`
- `PartyPanel`
- `DocumentStatePanel`
- `DeadlineExtractorReview`
- `RiskExplanationCard`
- `EmailMatchPanel`
- `CommissionEstimateCard`

## User actions

- Upload contract
- Review extracted deadlines
- Assign checklist owners
- Send reminder
- Upload document
- Request signature
- Escalate to broker
- Mark milestone complete
- Close transaction

## AI functionality

- Extract dates/parties/contingencies
- Generate checklist draft
- Explain risk
- Summarize transaction status
- Match inbound email to transaction
- Draft deadline reminder

## Automation workflows

- Contract upload → AI extraction → TC review → live checklist + reminders
- Deadline inside 48h and incomplete → risk alert
- Signature webhook → document state updated → checklist item completed

## Backend data objects

- `transactions`
- `transaction_parties`
- `transaction_milestones`
- `transaction_checklists`
- `documents`
- `document_packets`
- `signature_envelopes`
- `broker_reviews`
- `commission_estimates`
- `emails`
- `ai_extractions`
- `activity_events`
- `tasks`

## API contracts to implement

- `GET /api/transactions`
- `POST /api/transactions`
- `POST /api/transactions/:id/upload-contract`
- `POST /api/transactions/:id/extractions/:id/approve`
- `POST /api/transactions/:id/milestones/:id/complete`

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

- AI extraction is reviewable before write
- Risk score has visible cause list
- Checklist status rolls up to transaction status
- Transaction appears in leadership at-risk reports
- All document/signature state changes are audited


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
