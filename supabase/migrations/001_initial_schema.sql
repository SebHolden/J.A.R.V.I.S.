-- AgencyPilot v2.0 initial schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Enums
CREATE TYPE user_role AS ENUM (
  'admin', 'account', 'creative_director', 'designer', 'copywriter', 'project_manager'
);

CREATE TYPE project_status AS ENUM ('active', 'paused', 'completed', 'archived');

CREATE TYPE task_status AS ENUM (
  'pending', 'in_progress', 'blocked', 'waiting_approval', 'completed'
);

CREATE TYPE task_priority AS ENUM ('critical', 'high', 'medium', 'low');

CREATE TYPE material_version_status AS ENUM (
  'draft', 'internal_review', 'client_review', 'approved', 'production', 'archived'
);

CREATE TYPE brief_status AS ENUM ('draft', 'internal_review', 'approved', 'archived');

CREATE TYPE pipeline_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TYPE inbox_item_type AS ENUM (
  'email_reply', 'brief', 'delivery', 'risk', 'missing_material', 'deadline_risk'
);

CREATE TYPE inbox_item_status AS ENUM ('pending', 'approved', 'edited', 'rejected');

CREATE TYPE quality_result AS ENUM ('pass', 'warning', 'block');

CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE autonomy_policy_type AS ENUM (
  'require_approval', 'auto_if_confident', 'always_auto'
);

-- Agencies
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users (linked to auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'account',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sector TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  brand_guidelines JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT,
  notes TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status project_status NOT NULL DEFAULT 'active',
  deadline DATE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status task_status NOT NULL DEFAULT 'pending',
  priority task_priority NOT NULL DEFAULT 'medium',
  due_date DATE,
  source_request_id UUID,
  ai_reasoning TEXT,
  dependencies JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email threads
CREATE TABLE email_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  subject TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE email_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
  sender TEXT,
  body TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw JSONB DEFAULT '{}'::jsonb
);

-- Materials
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE material_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  file_path TEXT,
  status material_version_status NOT NULL DEFAULT 'draft',
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (material_id, version_number)
);

-- Approvals
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_version_id UUID NOT NULL REFERENCES material_versions(id) ON DELETE CASCADE,
  approved_by TEXT,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  channel TEXT
);

-- Briefs
CREATE TABLE briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  source_email_id UUID REFERENCES email_messages(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  status brief_status NOT NULL DEFAULT 'draft',
  created_by_ai BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI outputs
CREATE TABLE ai_outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  input TEXT,
  output TEXT,
  model TEXT,
  tokens_used INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quality checks
CREATE TABLE quality_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  material_version_id UUID REFERENCES material_versions(id) ON DELETE SET NULL,
  checks JSONB NOT NULL DEFAULT '[]'::jsonb,
  passed BOOLEAN NOT NULL DEFAULT false,
  blocked_reason TEXT,
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Knowledge chunks
CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id UUID,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Learning system
CREATE TABLE learning_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  input_snapshot JSONB DEFAULT '{}'::jsonb,
  output_snapshot JSONB DEFAULT '{}'::jsonb,
  human_edit_diff TEXT,
  outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE learning_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  strength FLOAT NOT NULL DEFAULT 0,
  sample_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Autonomous execution
CREATE TABLE autonomy_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  policy autonomy_policy_type NOT NULL DEFAULT 'require_approval',
  confidence_threshold FLOAT NOT NULL DEFAULT 95,
  risk_threshold risk_level NOT NULL DEFAULT 'low',
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agency_id, action_type)
);

CREATE TABLE autonomous_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_id UUID,
  policy_used JSONB,
  result JSONB,
  rolled_back BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Client requests (pipeline input)
CREATE TABLE client_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  raw_input TEXT NOT NULL,
  status pipeline_status NOT NULL DEFAULT 'pending',
  pipeline_context JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Approval inbox items
CREATE TABLE approval_inbox_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  request_id UUID REFERENCES client_requests(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  type inbox_item_type NOT NULL,
  status inbox_item_status NOT NULL DEFAULT 'pending',
  title TEXT NOT NULL,
  summary TEXT,
  reply_draft TEXT,
  brief_json JSONB DEFAULT '{}'::jsonb,
  suggested_tasks JSONB DEFAULT '[]'::jsonb,
  open_questions JSONB DEFAULT '[]'::jsonb,
  confidence_score INT NOT NULL DEFAULT 0,
  risk_level risk_level NOT NULL DEFAULT 'low',
  sources JSONB DEFAULT '[]'::jsonb,
  quality_result quality_result,
  quality_checks JSONB DEFAULT '[]'::jsonb,
  blocked_reason TEXT,
  priority INT NOT NULL DEFAULT 50,
  pipeline_context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_users_agency ON users(agency_id);
CREATE INDEX idx_clients_agency ON clients(agency_id);
CREATE INDEX idx_contacts_client ON contacts(client_id);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_materials_client ON materials(client_id);
CREATE INDEX idx_material_versions_material ON material_versions(material_id);
CREATE INDEX idx_knowledge_chunks_agency ON knowledge_chunks(agency_id);
CREATE INDEX idx_knowledge_chunks_client ON knowledge_chunks(client_id);
CREATE INDEX idx_learning_records_client ON learning_records(client_id);
CREATE INDEX idx_approval_inbox_agency ON approval_inbox_items(agency_id);
CREATE INDEX idx_approval_inbox_status ON approval_inbox_items(status);
CREATE INDEX idx_client_requests_agency ON client_requests(agency_id);
CREATE INDEX idx_audit_logs_agency ON audit_logs(agency_id);

-- Helper: get agency_id for current user
CREATE OR REPLACE FUNCTION public.get_user_agency_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_id FROM public.users WHERE id = auth.uid();
$$;
