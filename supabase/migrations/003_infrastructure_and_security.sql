-- Infrastructure tables + security hardening

-- Events (event bus persistence)
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  source text NOT NULL DEFAULT 'system',
  processed bool NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- AI cost tracking
CREATE TABLE ai_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  model text NOT NULL,
  tokens_in int NOT NULL DEFAULT 0,
  tokens_out int NOT NULL DEFAULT 0,
  estimated_cost_usd numeric(12, 6) NOT NULL DEFAULT 0,
  pipeline_run_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Feature flags
CREATE TABLE feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  key text NOT NULL,
  enabled bool NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}',
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agency_id, key)
);

-- Human feedback scores
CREATE TABLE human_feedback_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  inbox_item_id uuid REFERENCES approval_inbox_items(id) ON DELETE CASCADE,
  score int NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_agency_created ON events (agency_id, created_at DESC);
CREATE INDEX idx_ai_costs_agency_created ON ai_costs (agency_id, created_at DESC);
CREATE INDEX idx_feature_flags_agency_key ON feature_flags (agency_id, key);
DROP INDEX IF EXISTS idx_learning_records_client;
CREATE INDEX idx_learning_records_client ON learning_records (agency_id, client_id, created_at DESC);
CREATE INDEX idx_learning_patterns_client ON learning_patterns (agency_id, client_id, pattern_type);
CREATE INDEX idx_material_versions_material_status ON material_versions (material_id, status);
CREATE INDEX idx_approval_inbox_client ON approval_inbox_items (client_id);

CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
  match_agency_id uuid,
  match_client_id uuid DEFAULT NULL,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  source_type text,
  source_id uuid,
  client_id uuid,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    kc.id,
    kc.content,
    kc.source_type,
    kc.source_id,
    kc.client_id,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE kc.agency_id = match_agency_id
    AND kc.embedding IS NOT NULL
    AND (match_client_id IS NULL OR kc.client_id = match_client_id)
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- RLS for new tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_feedback_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY events_all ON events FOR ALL
  USING (agency_id = public.get_user_agency_id())
  WITH CHECK (agency_id = public.get_user_agency_id());

CREATE POLICY ai_costs_all ON ai_costs FOR ALL
  USING (agency_id = public.get_user_agency_id())
  WITH CHECK (agency_id = public.get_user_agency_id());

CREATE POLICY feature_flags_all ON feature_flags FOR ALL
  USING (agency_id = public.get_user_agency_id())
  WITH CHECK (agency_id = public.get_user_agency_id());

CREATE POLICY human_feedback_scores_all ON human_feedback_scores FOR ALL
  USING (agency_id = public.get_user_agency_id())
  WITH CHECK (agency_id = public.get_user_agency_id());

-- Materials: ensure client_id belongs to same agency
DROP POLICY IF EXISTS materials_all ON materials;
CREATE POLICY materials_all ON materials FOR ALL
  USING (agency_id = public.get_user_agency_id())
  WITH CHECK (
    agency_id = public.get_user_agency_id()
    AND EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = materials.client_id
      AND c.agency_id = public.get_user_agency_id()
    )
  );

-- Storage: scope by agency folder prefix
DROP POLICY IF EXISTS materials_storage_select ON storage.objects;
DROP POLICY IF EXISTS materials_storage_insert ON storage.objects;

CREATE POLICY materials_storage_select ON storage.objects FOR SELECT
  USING (
    bucket_id = 'materials'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
  );

CREATE POLICY materials_storage_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'materials'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = public.get_user_agency_id()::text
  );
