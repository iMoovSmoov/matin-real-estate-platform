# 11. Systems Health & Automation Admin

**Navigation label:** Systems Health  
**Primary roles:** Admin, systems builder, leadership, broker

## Purpose

Operational control center for integrations, workflows, webhooks, AI logs, field mapping, data quality, retries, and audit trails.

## Frontend layout

- Tabs: Integrations, Automations, Workflow Runs, Webhooks, AI Agents, Field Mapping, Data Quality, Audit Logs.
- Integration cards show connection status, last sync, token expiry, records synced, errors.
- Workflow detail shows trigger and step-by-step run log.
- Right drawer shows raw payloads, retry controls, mapping editor, AI log detail.

## Frontend component build

Use these reusable components and compose them inside the global app shell:

- `IntegrationStatusGrid`
- `WorkflowDefinitionTable`
- `WorkflowRunTimeline`
- `WebhookPayloadViewer`
- `FieldMappingEditor`
- `AIActionLogTable`
- `DataQualityQueue`
- `AuditLogTable`
- `RetryButton`
- `PauseWorkflowSwitch`

## User actions

- Connect integration
- Test connection
- Map fields
- View webhook payload
- Replay webhook
- Retry workflow
- Pause/resume workflow
- Inspect AI action
- Resolve data issue
- Export audit log

## AI functionality

- Explain failed workflow
- Suggest mapping fix
- Summarize integration health
- Classify data quality issues
- Generate admin troubleshooting steps

## Automation workflows

- Integration token expiring → admin alert
- Workflow failed → Today/System Health alert
- Webhook malformed → store payload and flag mapping
- Duplicate contacts → data quality issue

## Backend data objects

- `integrations`
- `integration_tokens`
- `integration_field_mappings`
- `workflow_definitions`
- `workflow_runs`
- `workflow_steps`
- `webhook_events`
- `ai_agents`
- `ai_run_logs`
- `ai_actions`
- `data_quality_issues`
- `audit_logs`
- `system_health_checks`

## API contracts to implement

- `GET /api/admin/integrations`
- `POST /api/admin/integrations/:id/test`
- `GET /api/admin/workflow-runs`
- `POST /api/admin/workflow-runs/:id/retry`
- `GET /api/admin/webhooks/:id`
- `POST /api/admin/field-mappings`

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

- Every automation run is inspectable
- Failed runs are retryable or explain why not
- Raw webhook payloads are preserved
- Admin actions create audit logs
- AI logs include model/provider/prompt version/cost


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
