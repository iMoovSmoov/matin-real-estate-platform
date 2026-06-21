-- MatinOS enhanced Postgres schema skeleton
-- Designed as a practical starting point for Supabase/Postgres/Drizzle/Prisma.
-- Adjust enum/check constraints to match final brokerage terminology.

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- =========================================
-- Identity, teams, roles, permissions
-- =========================================
create table if not exists teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  market text,
  office_location text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text unique not null,
  phone text,
  role text not null default 'agent',
  team_id uuid references teams(id),
  status text not null default 'active',
  avatar_url text,
  timezone text default 'America/Los_Angeles',
  preferences jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists roles (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  description text,
  permissions jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- =========================================
-- CRM core
-- =========================================
create table if not exists lead_sources (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text,
  vendor text,
  monthly_spend numeric default 0,
  active boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  first_name text,
  last_name text,
  email text,
  phone text,
  lifecycle_stage text not null default 'lead',
  intent text default 'unknown',
  source_id uuid references lead_sources(id),
  assigned_user_id uuid references users(id),
  team_id uuid references teams(id),
  lead_score numeric not null default 0,
  seller_score numeric not null default 0,
  buyer_score numeric not null default 0,
  last_activity_at timestamptz,
  preferred_contact_method text,
  external_system text,
  external_id text,
  dedupe_key text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_email_idx on contacts (lower(email));
create index if not exists contacts_phone_idx on contacts (phone);
create index if not exists contacts_assigned_idx on contacts (assigned_user_id, lifecycle_stage);

create table if not exists properties (
  id uuid primary key default uuid_generate_v4(),
  address_line1 text not null,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  county text,
  latitude numeric,
  longitude numeric,
  property_type text,
  beds numeric,
  baths numeric,
  sqft numeric,
  lot_sqft numeric,
  year_built int,
  estimated_value numeric,
  last_sale_date date,
  last_sale_price numeric,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contact_properties (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid references contacts(id) on delete cascade,
  property_id uuid references properties(id) on delete cascade,
  relationship text not null default 'owner',
  confidence numeric default 0,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists lead_events (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid references contacts(id) on delete cascade,
  property_id uuid references properties(id),
  event_type text not null,
  source text,
  title text,
  description text,
  metadata jsonb not null default '{}',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid references contacts(id) on delete cascade,
  channel text not null,
  external_id text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations(id) on delete cascade,
  contact_id uuid references contacts(id),
  sender_type text not null,
  sender_user_id uuid references users(id),
  body text not null,
  direction text not null,
  status text not null default 'draft',
  external_id text,
  metadata jsonb not null default '{}',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  owner_user_id uuid references users(id),
  team_id uuid references teams(id),
  subject_type text,
  subject_id uuid,
  priority text not null default 'normal',
  status text not null default 'open',
  due_at timestamptz,
  completed_at timestamptz,
  source text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid references contacts(id),
  owner_user_id uuid references users(id),
  subject_type text,
  subject_id uuid,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  status text not null default 'scheduled',
  external_calendar_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- =========================================
-- Seller opportunities and cash offers
-- =========================================
create table if not exists seller_opportunities (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid references contacts(id),
  property_id uuid references properties(id),
  assigned_user_id uuid references users(id),
  stage text not null default 'signal_detected',
  score numeric not null default 0,
  signal_summary text,
  estimated_value numeric,
  estimated_equity numeric,
  lost_reason text,
  next_action text,
  next_action_due_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists seller_signals (
  id uuid primary key default uuid_generate_v4(),
  seller_opportunity_id uuid references seller_opportunities(id) on delete cascade,
  contact_id uuid references contacts(id),
  property_id uuid references properties(id),
  signal_type text not null,
  weight numeric default 1,
  evidence jsonb not null default '{}',
  occurred_at timestamptz not null default now()
);

create table if not exists cash_offer_requests (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid references contacts(id),
  property_id uuid references properties(id),
  requested_at timestamptz not null default now(),
  request_payload jsonb not null default '{}',
  status text not null default 'new',
  assigned_user_id uuid references users(id),
  created_at timestamptz not null default now()
);

-- =========================================
-- Listings and launch workflows
-- =========================================
create table if not exists listings (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id),
  seller_contact_id uuid references contacts(id),
  listing_agent_id uuid references users(id),
  coordinator_user_id uuid references users(id),
  status text not null default 'intake',
  list_price numeric,
  target_launch_date date,
  launch_date date,
  mls_number text,
  readiness_score numeric default 0,
  blocker_count int default 0,
  intake jsonb not null default '{}',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists checklist_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  module text not null,
  rules jsonb not null default '{}',
  template_items jsonb not null default '[]',
  version int not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists checklist_items (
  id uuid primary key default uuid_generate_v4(),
  subject_type text not null,
  subject_id uuid not null,
  group_name text,
  title text not null,
  description text,
  owner_user_id uuid references users(id),
  status text not null default 'open',
  priority text default 'normal',
  due_at timestamptz,
  dependency_item_id uuid,
  blocked_reason text,
  completed_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists listing_assets (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete cascade,
  asset_type text not null,
  file_url text,
  title text,
  tags jsonb not null default '[]',
  metadata jsonb not null default '{}',
  uploaded_by uuid references users(id),
  created_at timestamptz not null default now()
);

-- =========================================
-- Buyer agreements, documents, signatures
-- =========================================
create table if not exists buyer_agreements (
  id uuid primary key default uuid_generate_v4(),
  buyer_contact_id uuid references contacts(id),
  agent_user_id uuid references users(id),
  status text not null default 'draft',
  terms jsonb not null default '{}',
  start_date date,
  end_date date,
  broker_review_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists document_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  file_url text,
  field_schema jsonb not null default '{}',
  rules jsonb not null default '{}',
  version int not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists document_packets (
  id uuid primary key default uuid_generate_v4(),
  subject_type text not null,
  subject_id uuid not null,
  name text not null,
  status text not null default 'draft',
  created_by uuid references users(id),
  broker_review_status text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  packet_id uuid references document_packets(id) on delete cascade,
  template_id uuid references document_templates(id),
  name text not null,
  file_url text,
  status text not null default 'draft',
  extracted_fields jsonb not null default '{}',
  required_missing jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists signature_envelopes (
  id uuid primary key default uuid_generate_v4(),
  packet_id uuid references document_packets(id),
  vendor text,
  external_id text,
  status text not null default 'draft',
  signers jsonb not null default '[]',
  sent_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists signature_events (
  id uuid primary key default uuid_generate_v4(),
  envelope_id uuid references signature_envelopes(id) on delete cascade,
  event_type text not null,
  signer_email text,
  payload jsonb not null default '{}',
  occurred_at timestamptz not null default now()
);

-- =========================================
-- Transactions
-- =========================================
create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id),
  listing_id uuid references listings(id),
  buyer_contact_id uuid references contacts(id),
  seller_contact_id uuid references contacts(id),
  agent_user_id uuid references users(id),
  coordinator_user_id uuid references users(id),
  status text not null default 'opened',
  purchase_price numeric,
  accepted_at timestamptz,
  closing_date date,
  risk_level text not null default 'low',
  risk_score numeric default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists transaction_parties (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid references transactions(id) on delete cascade,
  role text not null,
  name text not null,
  email text,
  phone text,
  company text,
  metadata jsonb not null default '{}'
);

create table if not exists transaction_milestones (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid references transactions(id) on delete cascade,
  name text not null,
  status text not null default 'open',
  due_at timestamptz,
  owner_user_id uuid references users(id),
  risk_reason text,
  completed_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists ai_extractions (
  id uuid primary key default uuid_generate_v4(),
  subject_type text not null,
  subject_id uuid not null,
  source_document_id uuid references documents(id),
  extraction_type text not null,
  extracted_json jsonb not null default '{}',
  confidence numeric,
  status text not null default 'proposed',
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================================
-- Marketing, campaigns, coaching, reports
-- =========================================
create table if not exists brand_kits (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  colors jsonb not null default '{}',
  typography jsonb not null default '{}',
  voice jsonb not null default '{}',
  assets jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  campaign_type text not null,
  subject_type text,
  subject_id uuid,
  status text not null default 'draft',
  owner_user_id uuid references users(id),
  starts_at timestamptz,
  ends_at timestamptz,
  budget numeric,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketing_assets (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade,
  listing_id uuid references listings(id),
  asset_type text not null,
  title text,
  body text,
  file_url text,
  status text not null default 'draft',
  version int not null default 1,
  approved_by uuid references users(id),
  approved_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists campaign_events (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade,
  contact_id uuid references contacts(id),
  event_type text not null,
  value numeric,
  payload jsonb not null default '{}',
  occurred_at timestamptz not null default now()
);

create table if not exists coaching_scenarios (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  difficulty text default 'medium',
  prompt_config jsonb not null default '{}',
  rubric jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists coaching_sessions (
  id uuid primary key default uuid_generate_v4(),
  scenario_id uuid references coaching_scenarios(id),
  agent_user_id uuid references users(id),
  manager_user_id uuid references users(id),
  status text not null default 'active',
  score numeric,
  transcript jsonb not null default '[]',
  feedback jsonb not null default '{}',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists metrics_daily (
  id uuid primary key default uuid_generate_v4(),
  metric_date date not null,
  team_id uuid references teams(id),
  user_id uuid references users(id),
  source_id uuid references lead_sources(id),
  metric_name text not null,
  metric_value numeric not null default 0,
  dimensions jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(metric_date, team_id, user_id, source_id, metric_name)
);

-- =========================================
-- Integrations, automations, AI, audit
-- =========================================
create table if not exists integrations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  vendor text,
  status text not null default 'not_connected',
  last_sync_at timestamptz,
  token_expires_at timestamptz,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists integration_field_mappings (
  id uuid primary key default uuid_generate_v4(),
  integration_id uuid references integrations(id) on delete cascade,
  external_object text not null,
  internal_object text not null,
  mapping jsonb not null default '{}',
  active boolean not null default true,
  version int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists webhook_events (
  id uuid primary key default uuid_generate_v4(),
  integration_id uuid references integrations(id),
  external_id text,
  event_type text,
  signature_valid boolean,
  payload jsonb not null,
  processing_status text not null default 'received',
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists workflow_definitions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  trigger_type text not null,
  definition jsonb not null default '{}',
  active boolean not null default true,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workflow_runs (
  id uuid primary key default uuid_generate_v4(),
  workflow_definition_id uuid references workflow_definitions(id),
  trigger_event_id uuid,
  subject_type text,
  subject_id uuid,
  status text not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_message text,
  idempotency_key text,
  metadata jsonb not null default '{}'
);

create table if not exists workflow_steps (
  id uuid primary key default uuid_generate_v4(),
  workflow_run_id uuid references workflow_runs(id) on delete cascade,
  step_name text not null,
  status text not null default 'pending',
  started_at timestamptz,
  finished_at timestamptz,
  input jsonb not null default '{}',
  output jsonb not null default '{}',
  error_message text
);

create table if not exists ai_agents (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  purpose text,
  provider text,
  model text,
  prompt_version text,
  approval_policy jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists ai_actions (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid references ai_agents(id),
  subject_type text,
  subject_id uuid,
  action_type text not null,
  input_refs jsonb not null default '{}',
  output jsonb not null default '{}',
  confidence numeric,
  approval_status text not null default 'draft',
  approved_by uuid references users(id),
  approved_at timestamptz,
  provider text,
  model text,
  prompt_version text,
  cost_estimate numeric,
  created_at timestamptz not null default now()
);

create table if not exists activity_events (
  id uuid primary key default uuid_generate_v4(),
  subject_type text not null,
  subject_id uuid not null,
  actor_user_id uuid references users(id),
  event_type text not null,
  title text,
  body text,
  source text,
  metadata jsonb not null default '{}',
  occurred_at timestamptz not null default now()
);
create index if not exists activity_subject_idx on activity_events (subject_type, subject_id, occurred_at desc);

create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_user_id uuid references users(id),
  action text not null,
  subject_type text,
  subject_id uuid,
  before jsonb,
  after jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists data_quality_issues (
  id uuid primary key default uuid_generate_v4(),
  issue_type text not null,
  severity text not null default 'medium',
  subject_type text not null,
  subject_id uuid not null,
  status text not null default 'open',
  description text,
  suggested_fix jsonb not null default '{}',
  resolved_by uuid references users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
