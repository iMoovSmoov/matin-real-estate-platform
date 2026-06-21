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
