# 04. Listing Launch Workspace

**Navigation label:** Listing Launch  
**Primary roles:** Agent, listing coordinator, marketing, broker, leadership

## Purpose

Replace listing Google Forms and spreadsheets with structured intake, checklist automation, asset management, broker approval, and AI-generated launch materials.

## Frontend layout

- Top: listing header with address, agent, coordinator, target launch date, readiness score, blocker count, status.
- Center: grouped launch checklist with owner, due date, status, dependencies, blocked flags.
- Right: selected task/document/asset drawer plus AI launch assistant.
- Tabs: Intake, Checklist, Assets, MLS Draft, Marketing Kit, Seller Updates, Approvals, Activity.

## Frontend component build

Use these reusable components and compose them inside the global app shell:

- `ListingHeader`
- `ReadinessMeter`
- `ChecklistGroup`
- `ChecklistItemRow`
- `DependencyBadge`
- `AssetGallery`
- `MLSDraftEditor`
- `MarketingPreviewCards`
- `SellerUpdateComposer`
- `ApprovalRail`
- `AIListingAssistant`

## User actions

- Create listing from seller opportunity
- Edit intake
- Upload assets
- Generate checklist
- Assign task owner
- Draft MLS remarks
- Approve marketing copy
- Send seller update
- Mark launch live

## AI functionality

- Generate MLS remarks
- Generate seller kickoff/update
- Generate social captions
- Generate flyer copy
- Detect missing listing inputs
- Summarize launch readiness
- Rewrite copy in Matin brand voice

## Automation workflows

- Listing won → create listing record + checklist + kickoff email + marketing kit shell
- Photos uploaded → tag assets + draft MLS/social/email/flyer copy
- Checklist blocker → Today alert + owner notification

## Backend data objects

- `listings`
- `listing_checklist_templates`
- `listing_checklist_items`
- `listing_assets`
- `properties`
- `contacts`
- `marketing_assets`
- `document_packets`
- `broker_reviews`
- `approval_requests`
- `activity_events`
- `ai_actions`

## API contracts to implement

- `GET /api/listings`
- `GET /api/listings/:id`
- `POST /api/listings`
- `POST /api/listings/:id/checklist/generate`
- `POST /api/listings/:id/assets`
- `POST /api/listings/:id/ai/generate-marketing-kit`

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

- Readiness score updates from checklist/doc/asset state
- Every checklist item has owner and due date
- AI-generated copy is saved as draft version
- Seller update logs to activity timeline
- Launch cannot be marked ready while required blockers remain


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
