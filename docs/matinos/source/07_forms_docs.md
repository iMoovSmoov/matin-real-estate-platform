# 07. Forms & Docs Packet Center

**Navigation label:** Forms & Docs  
**Primary roles:** Agent, coordinator, broker, admin

## Purpose

Central document packet system for templates, variable mapping, missing fields, e-sign state, broker review, and auditability.

## Frontend layout

- Left: packet folders and template library.
- Center: document/PDF preview with field highlights.
- Right: missing fields, signers, review state, send/download actions.
- Bottom: packet activity timeline.

## Frontend component build

Use these reusable components and compose them inside the global app shell:

- `PacketList`
- `TemplateLibrary`
- `DocumentPreview`
- `FieldHighlightLayer`
- `SignerStatusList`
- `MissingFieldPanel`
- `BrokerReviewPanel`
- `EnvelopeEventTimeline`
- `PacketActionBar`

## User actions

- Create packet
- Choose template
- Map variables
- Preview PDF
- Resolve missing fields
- Send for e-sign
- Request broker review
- Archive packet

## AI functionality

- Detect blank required fields
- Detect missing initials/signatures
- Summarize packet
- Flag unusual clauses/terms
- Prepare broker review summary

## Automation workflows

- Packet generated from agreement/listing/transaction → validate fields → create review/send state
- E-sign viewed/signed/declined → update envelope + activity timeline
- Broker approves → unlock send action

## Backend data objects

- `document_packets`
- `documents`
- `document_templates`
- `document_fields`
- `document_signers`
- `signature_envelopes`
- `signature_events`
- `broker_reviews`
- `contacts`
- `transactions`
- `listings`
- `activity_events`

## API contracts to implement

- `GET /api/document-packets`
- `POST /api/document-packets`
- `POST /api/document-packets/:id/validate`
- `POST /api/document-packets/:id/send-signature`
- `POST /api/document-packets/:id/archive`

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

- Required fields are surfaced before send
- Signer state is visible per signer
- Envelope events update without manual refresh
- All generated docs link to source record
- Archived packets remain searchable


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
