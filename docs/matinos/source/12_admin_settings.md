# 12. Admin Settings & Templates

**Navigation label:** Admin Settings  
**Primary roles:** Admin, broker, leadership, systems builder

## Purpose

Configure users, teams, roles, routing rules, templates, brand kit, AI policies, notification rules, territories, imports, and compliance defaults.

## Frontend layout

- Settings sidebar by category.
- Main area with forms/tables for the selected category.
- Right rail with change impact preview, audit history, and help text.
- Dangerous changes require confirm dialog and audit note.

## Frontend component build

Use these reusable components and compose them inside the global app shell:

- `SettingsSidebar`
- `UserRoleTable`
- `TeamEditor`
- `RoutingRuleBuilder`
- `ChecklistTemplateBuilder`
- `DocumentTemplateManager`
- `BrandKitEditor`
- `AIPolicyEditor`
- `NotificationRuleBuilder`
- `ImportWizard`
- `AuditPreview`

## User actions

- Invite user
- Assign role
- Create team
- Edit routing rule
- Build checklist template
- Upload document template
- Edit brand kit
- Set AI approval policy
- Import CSV
- Deactivate user

## AI functionality

- Suggest routing rule conflicts
- Generate checklist template from description
- Map CSV columns
- Summarize settings changes
- Warn about risky AI policy

## Automation workflows

- User invited → onboarding checklist
- Template updated → version bump and audit log
- CSV imported → dedupe + data quality queue
- Routing rule changed → test simulated leads

## Backend data objects

- `users`
- `roles`
- `permissions`
- `teams`
- `markets`
- `territories`
- `routing_rules`
- `checklist_templates`
- `document_templates`
- `brand_kits`
- `ai_policies`
- `notification_rules`
- `imports`
- `audit_logs`

## API contracts to implement

- `GET /api/admin/users`
- `POST /api/admin/users`
- `GET /api/admin/routing-rules`
- `POST /api/admin/routing-rules/test`
- `POST /api/admin/templates/checklists`
- `POST /api/admin/imports`

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

- Settings changes are audited
- Templates are versioned
- Routing rule tester shows expected assignment
- AI policy controls approval requirements
- CSV import produces reviewable data quality results


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
