# 05. Buyer Agreement Builder

**Navigation label:** Buyer Agreements  
**Primary roles:** Agent, broker, transaction coordinator, admin

## Purpose

Guided intake and packet builder for buyer agreements with prefill, validation, broker rules, preview, e-sign, and CRM timeline updates.

## Frontend layout

- Left: step-by-step guided intake wizard.
- Center: live packet/document preview.
- Right: missing fields, compliance/rule check, AI explanation, send-for-signature controls.
- Bottom/side: activity log and signature state.

## Frontend component build

Use these reusable components and compose them inside the global app shell:

- `AgreementWizard`
- `BuyerSelector`
- `TermInputGroup`
- `DocumentPreview`
- `MissingFieldList`
- `BrokerRuleCheckPanel`
- `SignatureEnvelopePanel`
- `AIPlainEnglishExplainer`
- `ApprovalBanner`

## User actions

- Select buyer
- Prefill from CRM
- Choose terms
- Preview packet
- Resolve missing fields
- Request broker review
- Send for e-sign
- Download packet
- Save to client timeline

## AI functionality

- Summarize intake
- Explain agreement terms in plain English
- Flag unusual terms
- Draft buyer email
- Suggest missing fields
- Classify broker review requirement

## Automation workflows

- Agreement started → prefill contact data → validate required fields → generate packet draft
- Packet sent → listen for e-sign webhooks → update status → notify agent
- Broker rule trigger → create approval task

## Backend data objects

- `buyer_agreements`
- `agreement_templates`
- `agreement_answers`
- `document_packets`
- `documents`
- `document_fields`
- `signature_envelopes`
- `contacts`
- `broker_reviews`
- `approval_requests`
- `activity_events`
- `ai_actions`

## API contracts to implement

- `POST /api/buyer-agreements`
- `GET /api/buyer-agreements/:id`
- `POST /api/buyer-agreements/:id/validate`
- `POST /api/buyer-agreements/:id/generate-packet`
- `POST /api/buyer-agreements/:id/send-signature`

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

- Packet preview updates after wizard edits
- Cannot send with required missing fields
- Broker review triggers are visible and explainable
- Signature status syncs from webhook
- Final packet links back to CRM contact


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
