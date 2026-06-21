# API route contracts

Use this as the practical route checklist for a Next.js App Router build.

## Auth/session

```txt
GET  /api/me
POST /api/auth/logout
GET  /api/permissions
```

## Today and work queue

```txt
GET  /api/dashboard/today?teamId=&userId=&date=
GET  /api/work-queue?scope=my|team|high-risk|ai-drafts|failures
POST /api/tasks
PATCH /api/tasks/:id
POST /api/tasks/:id/complete
POST /api/tasks/:id/snooze
```

## CRM and leads

```txt
GET  /api/leads?filter=&source=&stage=&owner=&q=
POST /api/leads
GET  /api/leads/:id
PATCH /api/leads/:id
POST /api/leads/:id/assign
POST /api/leads/:id/merge
GET  /api/leads/:id/timeline
GET  /api/leads/:id/messages
POST /api/leads/:id/messages/draft
POST /api/leads/:id/messages/send
POST /api/leads/:id/appointments
POST /api/leads/:id/convert-seller
```

## Seller/cash offers

```txt
GET  /api/seller-opportunities
POST /api/seller-opportunities
GET  /api/seller-opportunities/:id
PATCH /api/seller-opportunities/:id
POST /api/seller-opportunities/:id/stage
POST /api/seller-opportunities/:id/appointment
POST /api/seller-opportunities/:id/convert-listing
POST /api/cash-offer-requests
```

## Listings

```txt
GET  /api/listings
POST /api/listings
GET  /api/listings/:id
PATCH /api/listings/:id
POST /api/listings/:id/checklist/generate
POST /api/listings/:id/assets
POST /api/listings/:id/mls-draft
POST /api/listings/:id/marketing-kit
POST /api/listings/:id/seller-update
POST /api/listings/:id/mark-live
```

## Buyer agreements and documents

```txt
GET  /api/buyer-agreements
POST /api/buyer-agreements
GET  /api/buyer-agreements/:id
PATCH /api/buyer-agreements/:id
POST /api/buyer-agreements/:id/validate
POST /api/buyer-agreements/:id/generate-packet
POST /api/buyer-agreements/:id/send-signature

GET  /api/document-packets
POST /api/document-packets
GET  /api/document-packets/:id
POST /api/document-packets/:id/validate
POST /api/document-packets/:id/send-signature
POST /api/document-packets/:id/request-broker-review
```

## Transactions

```txt
GET  /api/transactions
POST /api/transactions
GET  /api/transactions/:id
PATCH /api/transactions/:id
POST /api/transactions/:id/upload-contract
POST /api/transactions/:id/extractions/:extractionId/approve
POST /api/transactions/:id/milestones/:milestoneId/complete
POST /api/transactions/:id/risk/recalculate
```

## Marketing

```txt
GET  /api/campaigns
POST /api/campaigns
GET  /api/campaigns/:id
POST /api/campaigns/:id/generate-assets
POST /api/marketing-assets/:id/approve
POST /api/campaigns/:id/schedule
GET  /api/campaigns/:id/performance
```

## Coaching

```txt
GET  /api/coaching/scenarios
POST /api/coaching/scenarios
POST /api/coaching/sessions
GET  /api/coaching/sessions/:id
POST /api/coaching/sessions/:id/messages
POST /api/coaching/sessions/:id/score
POST /api/coaching/tasks
```

## Reports

```txt
GET  /api/reports/executive
GET  /api/reports/lead-funnel
GET  /api/reports/source-roi
GET  /api/reports/agents
GET  /api/reports/listings
GET  /api/reports/transactions-risk
GET  /api/reports/automation-impact
POST /api/reports/insights/generate
```

## Systems/admin

```txt
GET  /api/admin/integrations
POST /api/admin/integrations/:id/test
POST /api/admin/integrations/:id/connect
GET  /api/admin/workflows
PATCH /api/admin/workflows/:id
GET  /api/admin/workflow-runs
GET  /api/admin/workflow-runs/:id
POST /api/admin/workflow-runs/:id/retry
GET  /api/admin/webhooks
GET  /api/admin/webhooks/:id
POST /api/admin/webhooks/:id/replay
GET  /api/admin/field-mappings
POST /api/admin/field-mappings
GET  /api/admin/audit-logs
```
