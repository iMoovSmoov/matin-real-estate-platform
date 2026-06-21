# MatinOS Master Full Build Package

Generated package date: 2026-06-21

This is the consolidated build package for a Matin Real Estate AI/automation brokerage operating system.

It includes:

- public competitor/reference images
- custom wireframes
- generated architecture blueprints
- section-by-section product specs
- frontend design system
- backend schema and route contracts
- AI agent specs
- workflow recipes
- seed data
- feature backlog
- roadmap
- demo script
- original prior package files



---


# Matin job post → MatinOS product map

| Job-post need | Product section that proves it | Demo moment |
|---|---|---|
| Replace spreadsheets and Google Forms | Listing Launch, Forms & Docs, Admin Templates | Show a listing intake creating structured checklist/tasks/docs instead of spreadsheet rows. |
| Structured databases and automated workflows | Backend schema, activity events, workflow runs | Open Systems Health and show actual automation run receipts. |
| Centralized company dashboard | Today + Reports | Start with the Today Command Center and leadership KPI dashboard. |
| Real-time reporting | Reports | Filter by source/agent/team and drill into records. |
| Integrate AI into CRM and daily operations | CRM Lead 360 + AI sidecar | Select a lead and show AI summary, score explanation, draft message, next action. |
| Automate repetitive admin and sales tasks | Workflow recipes + work queue | New lead → score → route → draft → task; listing won → checklist → marketing kit. |
| AI coaching and scenario training | Coaching | Run a seller objection roleplay and show rubric score. |
| Automated listing and buyer agreement workflows | Listing Launch + Buyer Agreement Builder | Convert seller to listing; build buyer agreement packet from guided intake. |
| Connect CRM, transaction, lead generation, marketing, reporting | Full lifecycle storyboard | Show one record moving across CRM, listing, marketing, transaction, reports. |
| Zapier/Make/n8n/API integration | Systems Health + Integration Adapter spec | Show connected systems, field maps, webhook logs, failed workflow retry. |


---


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


---


# Module specs


---

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


---

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


---

# 03. Seller / Cash Offer Opportunity Desk

**Navigation label:** Seller / Cash Offers  
**Primary roles:** Agent, ISA, broker, leadership, marketing

## Purpose

Mine the database and website activity for likely sellers, then manage seller/cash-offer opportunities from signal to listing won.

## Frontend layout

- Top: seller pipeline KPIs, high-equity signals, home-value requests, cash-offer requests, appointments set, listings won.
- Center: kanban pipeline from Signal Detected to Listing Won/Lost.
- Right: opportunity drawer with property estimate, signal explanation, owner profile, outreach history, AI recommended next action.
- Filter bar by source, ZIP, price band, signal type, agent, age, score.

## Frontend component build

Use these reusable components and compose them inside the global app shell:

- `SellerPipelineKanban`
- `OpportunityCard`
- `SellerSignalBadge`
- `PropertyValuePanel`
- `EquityEstimatePanel`
- `SignalExplanation`
- `OutreachHistory`
- `AISellerActionCard`
- `AppointmentScheduler`

## User actions

- Assign opportunity
- Create appointment
- Draft seller outreach
- Send market report
- Create listing launch record
- Mark lost/nurture
- Add property note
- Request CMA

## AI functionality

- Explain seller score
- Draft seller call script
- Draft cash-offer response
- Suggest next nurture campaign
- Generate seller report summary
- Detect stale high-intent seller

## Automation workflows

- Home value request → seller opportunity + score + assignment + task + AI draft
- Cash offer request → high-priority alert + appointment task
- Past client owns home 5+ years and opens report → seller signal created

## Backend data objects

- `seller_opportunities`
- `cash_offer_requests`
- `seller_signals`
- `contacts`
- `properties`
- `valuations`
- `appointments`
- `campaign_enrollments`
- `tasks`
- `lead_events`
- `ai_actions`

## API contracts to implement

- `GET /api/seller-opportunities`
- `POST /api/seller-opportunities/:id/stage`
- `POST /api/seller-opportunities/:id/appointment`
- `POST /api/seller-opportunities/:id/convert-listing`
- `POST /api/seller-opportunities/:id/ai/draft-outreach`

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

- Each seller score has visible reasons
- Pipeline cards show next action and blocker
- Creating listing preserves contact/property relationship
- Lost reasons are reportable
- Cash-offer requests bypass normal priority


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


---

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


---

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


---

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


---

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


---

# 08. Marketing Studio

**Navigation label:** Marketing Studio  
**Primary roles:** Marketing, agent, listing coordinator, leadership

## Purpose

Turn listing/client/campaign records into branded Matin marketing assets and track campaign performance back into CRM and reports.

## Frontend layout

- Top: campaign/listing selector and brand kit state.
- Tabs: Email, Social, Ads, Flyer, Video Script, Open House Kit, Seller Report.
- Center: editable asset preview.
- Right: AI producer, approval workflow, schedule state, performance snapshot.

## Frontend component build

Use these reusable components and compose them inside the global app shell:

- `CampaignSelector`
- `AssetTypeTabs`
- `AssetEditor`
- `VisualPreviewCard`
- `AIProducerPanel`
- `BrandVoiceSelector`
- `ApprovalQueue`
- `SchedulePanel`
- `PerformanceMiniChart`
- `AssetVersionHistory`

## User actions

- Generate launch kit
- Edit copy
- Approve asset
- Schedule campaign
- Duplicate version
- Export/download
- Send seller update
- View performance

## AI functionality

- Generate listing description
- Generate email blast
- Generate social captions
- Generate ad copy
- Generate flyer headline
- Generate video script
- Generate open house talking points
- Generate neighborhood blurb

## Automation workflows

- Listing ready → create marketing kit draft
- Asset approved → schedule or export
- Campaign events → sync opens/clicks/leads to CRM and reports
- Low performance → AI suggests copy/test changes

## Backend data objects

- `marketing_templates`
- `marketing_assets`
- `campaigns`
- `campaign_channels`
- `campaign_events`
- `brand_kits`
- `listings`
- `properties`
- `contacts`
- `audiences`
- `approval_requests`
- `ai_actions`
- `activity_events`

## API contracts to implement

- `GET /api/campaigns`
- `POST /api/campaigns`
- `POST /api/campaigns/:id/generate-assets`
- `POST /api/marketing-assets/:id/approve`
- `POST /api/campaigns/:id/schedule`

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

- One listing can generate 10+ asset drafts
- Assets show approval and version state
- Brand kit is applied to every output
- Performance metrics connect to source ROI
- Seller-facing messages require approval


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


---

# 09. AI Coaching & Scenario Training

**Navigation label:** Coaching  
**Primary roles:** Agent, broker, team lead, trainer, leadership

## Purpose

Use AI roleplay and scorecards to train agents on real estate conversations and tie coaching assignments to CRM performance gaps.

## Frontend layout

- Left: scenario library and assigned training.
- Center: chat/voice roleplay transcript.
- Right: scorecard, feedback, suggested phrasing, manager notes, next coaching tasks.
- Top: agent performance context and coaching goal.

## Frontend component build

Use these reusable components and compose them inside the global app shell:

- `ScenarioLibrary`
- `RoleplayChat`
- `VoiceTranscriptPanel`
- `Scorecard`
- `RubricBreakdown`
- `SuggestedPhrasing`
- `ManagerReviewPanel`
- `TrainingAssignmentList`
- `PerformanceGapCard`

## User actions

- Start roleplay
- Choose scenario
- Submit response
- Review score
- Assign coaching
- Manager comments
- Create follow-up training task
- Compare attempts

## AI functionality

- Play buyer/seller persona
- Escalate objections
- Score response
- Suggest stronger phrasing
- Generate coaching plan
- Connect training to CRM weakness

## Automation workflows

- Low appointment conversion → recommend appointment-closing scenario
- Manager assigns training → agent sees task in Today
- Completed scenario → score stored and reported

## Backend data objects

- `coaching_scenarios`
- `coaching_sessions`
- `roleplay_messages`
- `scorecards`
- `scorecard_rubrics`
- `coaching_tasks`
- `manager_reviews`
- `agent_goals`
- `crm_performance_metrics`

## API contracts to implement

- `GET /api/coaching/scenarios`
- `POST /api/coaching/sessions`
- `POST /api/coaching/sessions/:id/messages`
- `POST /api/coaching/sessions/:id/score`
- `POST /api/coaching/tasks`

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

- AI roleplay follows selected persona and objection style
- Scorecard is rubric-based
- Manager can review attempts
- Coaching tasks appear in Today
- Reports show coaching completion/performance trend


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


---

# 10. Leadership Reports

**Navigation label:** Reports  
**Primary roles:** Leadership, broker, team lead, marketing, admin

## Purpose

Real-time executive reporting for lead funnel, source ROI, agent accountability, listing pipeline, transaction risk, marketing performance, and automation impact.

## Frontend layout

- Top: executive KPI strip and date/team/source filters.
- Sections: Lead Funnel, Source ROI, Agent Accountability, Listings, Transactions, Marketing, Coaching, Automation Impact.
- Right: AI reporting analyst with insight cards and recommended actions.
- Drilldown tables under each chart.

## Frontend component build

Use these reusable components and compose them inside the global app shell:

- `ExecutiveKpiStrip`
- `DateRangeFilter`
- `SourceRoiChart`
- `FunnelChart`
- `AgentLeaderboard`
- `ListingPipelineChart`
- `TransactionRiskTable`
- `MarketingPerformanceTable`
- `AutomationImpactPanel`
- `AIInsightCard`

## User actions

- Filter reports
- Drill into metric
- Export CSV
- Save report snapshot
- Ask AI why metric changed
- Create action item from insight
- Compare sources/agents

## AI functionality

- Explain performance changes
- Find source ROI anomalies
- Suggest budget shifts
- Summarize agent accountability
- Identify bottlenecks
- Generate weekly leadership memo

## Automation workflows

- Nightly metric snapshots
- Weekly AI leadership summary
- Source underperformance alert
- Agent stale leads alert
- Transaction risk rollup

## Backend data objects

- `report_snapshots`
- `metrics_daily`
- `lead_sources`
- `lead_events`
- `appointments`
- `listings`
- `transactions`
- `campaign_events`
- `agent_activity`
- `workflow_runs`
- `ai_actions`
- `coaching_sessions`

## API contracts to implement

- `GET /api/reports/executive`
- `GET /api/reports/source-roi`
- `GET /api/reports/agents`
- `GET /api/reports/automation-impact`
- `POST /api/reports/insights/generate`

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

- Metrics are defined and reproducible
- KPI cards drill into source records
- AI insights cite underlying data points
- CSV export works for major tables
- Leadership can compare date ranges and teams


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


---

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


---

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


---


# Backend architecture


---

# Backend architecture — complete build guide

## Architecture target

```txt
Next.js App Router frontend + API routes
        ↓
Server actions / route handlers with auth + validation
        ↓
Postgres database for structured records
        ↓
Workflow engine for long-running automations
        ↓
Integration adapters for CRM/IDX/e-sign/calendar/email/ads/transaction systems
        ↓
AI adapter layer for GPT/Claude/Gemini outputs
        ↓
Object storage for PDFs/photos/assets/contracts
```

## Layers

### 1. UI layer

- Server-render initial pages where possible.
- Client components for tables, drawers, editors, kanban drag/drop, AI sidecar, and live previews.
- Use URL state for filters/tabs so demos can be deep-linked.

### 2. API/application layer

Every mutation should:

1. Validate session and role.
2. Validate request body.
3. Load subject record.
4. Enforce permission policy.
5. Execute transaction.
6. Create activity event.
7. Create audit log when status/admin/client-facing actions happen.
8. Trigger workflow if needed.
9. Return updated record + UI receipt.

### 3. Workflow layer

Use workflows for anything multi-step, external, retryable, or slow:

- New lead processing.
- Lead reassignment SLA.
- Seller signal creation.
- Listing checklist creation.
- Marketing kit generation.
- Document packet generation.
- E-sign envelope sync.
- Contract deadline extraction.
- Daily report snapshots.
- Data quality cleanup.

### 4. Integration layer

Create one adapter per external system. Do not let raw vendor payloads leak into the UI.

```ts
interface IntegrationAdapter {
  testConnection(): Promise<HealthResult>
  normalizeWebhook(payload: unknown): Promise<NormalizedEvent>
  syncSince(cursor: string): Promise<SyncResult>
  pushUpdate(record: InternalRecord): Promise<PushResult>
}
```

### 5. AI layer

```ts
interface AIAgentRunInput {
  agentName: string
  subjectType: string
  subjectId: string
  task: string
  context: Record<string, unknown>
  requiredOutputSchema: unknown
  approvalPolicy: 'draft_only' | 'human_approval' | 'auto_internal'
}
```

Store every AI run. Never rely on invisible chat history for business-critical operations.

## Event model

Use `activity_events` as the universal timeline:

```txt
subject_type: contact | listing | transaction | document_packet | campaign | workflow_run
subject_id: uuid
actor_user_id: optional
source: human | workflow | ai | integration
metadata: structured payload
```

## Security and permissions

- Agents only see owned/team-authorized records unless leadership/admin.
- Broker/compliance sees agreements, docs, transaction risk, audit logs.
- Marketing sees listing/campaign assets, not private financial/internal admin by default.
- Admin sees integrations/workflows/settings.
- Client-facing sends and legal document actions require explicit permission.

## Deployment

Recommended deploy target:

- Vercel for Next.js app.
- Supabase/Neon Postgres for DB.
- Vercel Blob/S3/R2/Supabase Storage for documents/assets.
- Trigger.dev/Inngest/n8n/Make for workflows.
- Sentry/Logtail/Axiom or similar for logs.

## Environment variables

```txt
DATABASE_URL=
NEXTAUTH_SECRET=
APP_URL=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
BLOB_READ_WRITE_TOKEN=
CRM_API_KEY=
CRM_WEBHOOK_SECRET=
ESIGN_CLIENT_ID=
ESIGN_CLIENT_SECRET=
EMAIL_API_KEY=
SMS_API_KEY=
CALENDAR_CLIENT_ID=
CALENDAR_CLIENT_SECRET=
WORKFLOW_SIGNING_SECRET=
```


---


# AI agents and prompt library


---

# AI agent specs and prompt library

## Core rule

Do not build one generic chatbot. Build named AI agents that each operate inside a specific workflow and write logs to `ai_actions`.

## Agent list

| Agent | Where it lives | What it does | Approval policy |
|---|---|---|---|
| Lead Concierge | CRM & Leads | Summarizes lead, scores intent, drafts text/email, recommends next step | Human approval before send |
| Seller Opportunity Miner | Seller Desk | Explains seller signal, suggests outreach, creates opportunity draft | Human approval before outreach |
| Listing Launch Assistant | Listing Launch | Drafts checklist, MLS remarks, seller updates, launch copy | Human approval before external use |
| Buyer Agreement Builder | Buyer Agreements | Prefills packet, validates missing fields, explains terms | Human approval before e-sign |
| Transaction Coordinator AI | Transactions | Extracts deadlines, parties, contingencies, risk | TC approval before committing extracted deadlines |
| Marketing Producer | Marketing Studio | Creates branded content assets | Marketing/agent approval |
| Broker Compliance QA | Docs/Transactions | Flags missing fields, initials, unusual terms | Broker review for risky output |
| Coaching Roleplay Agent | Coaching | Plays client persona, scores agent response | Internal auto-save allowed |
| Reporting Analyst | Reports | Explains metrics, anomalies, source ROI, bottlenecks | Internal auto-save allowed |
| Data Hygiene Agent | Systems Health | Finds duplicates, bad emails, missing phones, mapping issues | Human approval before merge/delete |

## Standard AI action output schema

```json
{
  "summary": "plain English result",
  "evidence": ["specific source event or field used"],
  "recommended_action": "what the human should do next",
  "draft_output": "message/copy/checklist/etc if applicable",
  "confidence": 0.0,
  "requires_approval": true,
  "risk_flags": [],
  "source_record_refs": []
}
```

## Prompt template: Lead Concierge summary

```txt
You are MatinOS Lead Concierge. Summarize the selected lead for a real estate agent.
Use only the provided CRM, website activity, message, task, and property context.
Return JSON with summary, buyer_intent_score, seller_intent_score, evidence, recommended_next_action, and draft_text_message.
Do not claim anything not in the provided context.
Make the message concise and human, not robotic.
```

## Prompt template: Seller Opportunity Miner

```txt
You are MatinOS Seller Opportunity Miner. Evaluate whether this contact is likely to become a seller.
Consider home value requests, cash-offer clicks, property ownership, age of ownership, equity estimate, seller page visits, market report opens, and past-client status.
Return JSON with score, signal_explanation, urgency, best_next_action, call_script, and follow_up_message.
```

## Prompt template: Listing Launch Assistant

```txt
You are MatinOS Listing Launch Assistant. Build launch-ready listing materials from structured property/listing data.
Return MLS remarks, short listing summary, seller update, social captions, email blast copy, open house script, missing asset list, and compliance flags.
Use a premium Oregon/Washington brokerage tone.
Do not invent property features that are not in the data.
```

## Prompt template: Transaction Coordinator AI

```txt
You are MatinOS Transaction Coordinator AI. Extract deadlines, parties, contingencies, and required tasks from contract context.
Return proposed milestones only. Mark low-confidence fields clearly.
Never finalize deadlines without human TC approval.
```

## Prompt template: Reporting Analyst

```txt
You are MatinOS Reporting Analyst. Explain what changed in brokerage metrics and what should be done next.
Use the provided report data only. Return concise executive bullets, anomalies, likely causes, recommended actions, and drilldown record IDs.
```


---


# Workflow runbook


---

# Workflow implementation runbook

## Workflow engine expectations

Every workflow should support:

- Trigger event.
- Subject record type and ID.
- Idempotency key.
- Step logs.
- Retry policy.
- Human approval state.
- Systems Health detail view.
- Activity events on affected records.

## Workflow run status values

```txt
queued
running
waiting_for_approval
succeeded
failed
cancelled
skipped
partially_succeeded
```

## Step status values

```txt
pending
running
succeeded
failed
skipped
waiting_for_human
```

## Retry policy

- External API timeout: retry 3 times with exponential backoff.
- Validation failure: do not retry; create data quality issue.
- Missing field mapping: do not retry until mapping fixed.
- AI output schema invalid: retry once with repair prompt, then create AI review issue.
- Permission/approval blocked: mark waiting_for_approval.

## Example workflow receipt shown in UI

```txt
Workflow: New IDX Lead Intake
Subject: Sarah Mitchell
Trigger: Website lead created
Status: Waiting for human approval

Step 1 Verify webhook: success
Step 2 Normalize payload: success
Step 3 Dedupe contact: matched existing by email
Step 4 Score lead: buyer 82, seller 43
Step 5 Route: assigned to Jordan Matin by territory rule
Step 6 Draft intro text: success, waiting approval
```


---


# Implementation roadmap


---

# MVP-to-full implementation roadmap

## Phase 0 — demo foundation

Goal: make the product feel real immediately.

Build:

- App shell and navigation.
- Shared mock/seed data store.
- Today Command Center.
- CRM lead table and Lead 360 drawer.
- AI sidecar with deterministic demo outputs.
- Systems Health mock workflow receipts.

## Phase 1 — operational MVP

Build:

- Real Postgres schema.
- Auth/roles.
- Contacts/leads CRUD.
- Tasks and activity events.
- Lead routing rules.
- Seller opportunity pipeline.
- Listing launch checklist.
- Basic workflow runner.
- AI action logging.

## Phase 2 — documents and transactions

Build:

- Buyer agreement guided intake.
- Document packet model.
- Template/variable mapping.
- E-sign integration adapter.
- Transaction upload and deadline extraction.
- Milestone timeline and reminders.
- Broker review state.

## Phase 3 — marketing and reports

Build:

- Marketing Studio asset generation.
- Brand kit/templates.
- Campaign scheduling placeholders/integrations.
- Executive reports.
- Source ROI calculation.
- Agent accountability views.
- Daily report snapshots.

## Phase 4 — automation/system maturity

Build:

- Integration connectors.
- Webhook replay.
- Field mapping editor.
- Workflow retry/pause/resume.
- Data quality queue.
- Admin template builders.
- AI prompt/version management.
- Production monitoring.

## Phase 5 — advanced brokerage OS

Build:

- Mobile agent inbox.
- Voice roleplay coaching.
- Database seller mining at scale.
- Predictive lead routing.
- Recruiting workspace.
- Commission/back-office integration.
- Advanced BI and forecasting.


---


# Demo script


---

# MatinOS demo script for Matin Real Estate

## Opening line

"I built this as a connected brokerage operating system, not an IT dashboard. The goal is to replace scattered spreadsheets, forms, manual reminders, and disconnected tools with one operating layer for leads, listings, agreements, transactions, marketing, reporting, and automation health."

## 1. Start at Today

Show:

- Overnight AI summary.
- New hot leads.
- Seller signals.
- Listings blocked.
- Transactions at risk.
- AI drafts waiting approval.
- Workflow errors.

Say:

"This is the daily command center. Each role sees the work that needs human attention. Automations handle repetitive steps, but anything risky or client-facing comes here for approval."

## 2. Open CRM lead

Open Daniel Cho.

Show:

- Lead score.
- Website activity.
- AI summary.
- Draft intro text.
- First-call task.

Say:

"A new website lead is normalized, deduped, scored, routed, and turned into a concrete task. The agent does not have to dig around."

## 3. Open seller opportunity

Open Sarah Mitchell.

Show:

- Seller score evidence.
- Home value request.
- Market report opens.
- Cash-offer click.
- AI recommended call script.

Say:

"This is where the system turns the database and website behavior into listing opportunities."

## 4. Convert to Listing Launch

Show:

- Listing record created.
- Checklist generated.
- Readiness score.
- Blockers.
- Marketing kit shell.

Say:

"Instead of Google Forms and spreadsheets, the listing is a structured workflow with owners, due dates, dependencies, and launch readiness."

## 5. Marketing Studio

Show:

- MLS remarks.
- Email blast.
- Social captions.
- Flyer copy.
- Open-house script.

Say:

"One listing can generate an entire branded launch kit, with approval before anything goes out."

## 6. Buyer Agreement Builder

Show:

- Guided intake.
- Live packet preview.
- Missing fields.
- Broker rule check.
- E-sign draft.

Say:

"This automates agreement creation while keeping compliance and broker approval in the loop."

## 7. Transactions

Show:

- Contract upload/extraction concept.
- Deadline timeline.
- Risk score and explanation.
- Deadline reminder draft.

Say:

"This is transaction coordination. The system extracts deadlines, proposes milestones, and flags risk before it becomes a fire drill."

## 8. Reports

Show:

- Source ROI.
- Agent accountability.
- Listing pipeline.
- Transaction risk.
- Automation impact.

Say:

"Leadership gets real-time visibility into growth, spend, conversion, bottlenecks, and automation results."

## 9. Systems Health

Show:

- Integrations.
- Workflow run timeline.
- Failed workflow retry.
- Webhook payload.
- AI logs.
- Field mappings.

Say:

"This is the part most demos miss. If the company depends on automation, you need visibility when something fails, why it failed, and how to retry or fix it."

## Close

"The demo data is mocked, but the architecture is real: structured database, workflow engine, AI action logs, integrations, approvals, and audit trail. Connected to your CRM and transaction tools, this becomes an operating system for the brokerage."
