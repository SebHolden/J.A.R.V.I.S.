-- Row Level Security policies

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomy_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomous_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_inbox_items ENABLE ROW LEVEL SECURITY;

-- Agencies
CREATE POLICY agencies_select ON agencies FOR SELECT
  USING (id = public.get_user_agency_id());

-- Users
CREATE POLICY users_select ON users FOR SELECT
  USING (agency_id = public.get_user_agency_id());

CREATE POLICY users_update_self ON users FOR UPDATE
  USING (id = auth.uid());

-- Clients
CREATE POLICY clients_all ON clients FOR ALL
  USING (agency_id = public.get_user_agency_id())
  WITH CHECK (agency_id = public.get_user_agency_id());

-- Contacts (via client agency)
CREATE POLICY contacts_all ON contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = contacts.client_id
      AND c.agency_id = public.get_user_agency_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = contacts.client_id
      AND c.agency_id = public.get_user_agency_id()
    )
  );

-- Projects
CREATE POLICY projects_all ON projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = projects.client_id
      AND c.agency_id = public.get_user_agency_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = projects.client_id
      AND c.agency_id = public.get_user_agency_id()
    )
  );

-- Tasks
CREATE POLICY tasks_all ON tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE p.id = tasks.project_id
      AND c.agency_id = public.get_user_agency_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE p.id = tasks.project_id
      AND c.agency_id = public.get_user_agency_id()
    )
  );

-- Email threads
CREATE POLICY email_threads_all ON email_threads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = email_threads.client_id
      AND c.agency_id = public.get_user_agency_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = email_threads.client_id
      AND c.agency_id = public.get_user_agency_id()
    )
  );

-- Email messages
CREATE POLICY email_messages_all ON email_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM email_threads t
      JOIN clients c ON c.id = t.client_id
      WHERE t.id = email_messages.thread_id
      AND c.agency_id = public.get_user_agency_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_threads t
      JOIN clients c ON c.id = t.client_id
      WHERE t.id = email_messages.thread_id
      AND c.agency_id = public.get_user_agency_id()
    )
  );

-- Materials
CREATE POLICY materials_all ON materials FOR ALL
  USING (agency_id = public.get_user_agency_id())
  WITH CHECK (agency_id = public.get_user_agency_id());

-- Material versions
CREATE POLICY material_versions_all ON material_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM materials m
      WHERE m.id = material_versions.material_id
      AND m.agency_id = public.get_user_agency_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM materials m
      WHERE m.id = material_versions.material_id
      AND m.agency_id = public.get_user_agency_id()
    )
  );

-- Approvals
CREATE POLICY approvals_all ON approvals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM material_versions mv
      JOIN materials m ON m.id = mv.material_id
      WHERE mv.id = approvals.material_version_id
      AND m.agency_id = public.get_user_agency_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM material_versions mv
      JOIN materials m ON m.id = mv.material_id
      WHERE mv.id = approvals.material_version_id
      AND m.agency_id = public.get_user_agency_id()
    )
  );

-- Briefs
CREATE POLICY briefs_all ON briefs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = briefs.client_id
      AND c.agency_id = public.get_user_agency_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = briefs.client_id
      AND c.agency_id = public.get_user_agency_id()
    )
  );

-- AI outputs
CREATE POLICY ai_outputs_all ON ai_outputs FOR ALL
  USING (agency_id = public.get_user_agency_id())
  WITH CHECK (agency_id = public.get_user_agency_id());

-- Helper for quality checks RLS
CREATE OR REPLACE FUNCTION agency_id_via_task_or_material(t_id UUID, mv_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN t_id IS NOT NULL THEN EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      JOIN clients c ON c.id = p.client_id
      WHERE t.id = t_id AND c.agency_id = public.get_user_agency_id()
    )
    WHEN mv_id IS NOT NULL THEN EXISTS (
      SELECT 1 FROM material_versions mv
      JOIN materials m ON m.id = mv.material_id
      WHERE mv.id = mv_id AND m.agency_id = public.get_user_agency_id()
    )
    ELSE false
  END;
$$;

-- Quality checks
CREATE POLICY quality_checks_all ON quality_checks FOR ALL
  USING (agency_id_via_task_or_material(task_id, material_version_id))
  WITH CHECK (agency_id_via_task_or_material(task_id, material_version_id));

-- Knowledge chunks
CREATE POLICY knowledge_chunks_all ON knowledge_chunks FOR ALL
  USING (agency_id = public.get_user_agency_id())
  WITH CHECK (agency_id = public.get_user_agency_id());

-- Learning
CREATE POLICY learning_records_all ON learning_records FOR ALL
  USING (agency_id = public.get_user_agency_id())
  WITH CHECK (agency_id = public.get_user_agency_id());

CREATE POLICY learning_patterns_all ON learning_patterns FOR ALL
  USING (agency_id = public.get_user_agency_id())
  WITH CHECK (agency_id = public.get_user_agency_id());

-- Autonomy
CREATE POLICY autonomy_policies_all ON autonomy_policies FOR ALL
  USING (agency_id = public.get_user_agency_id())
  WITH CHECK (agency_id = public.get_user_agency_id());

CREATE POLICY autonomous_actions_all ON autonomous_actions FOR ALL
  USING (agency_id = public.get_user_agency_id())
  WITH CHECK (agency_id = public.get_user_agency_id());

-- Audit logs
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT
  USING (agency_id = public.get_user_agency_id());

CREATE POLICY audit_logs_insert ON audit_logs FOR INSERT
  WITH CHECK (agency_id = public.get_user_agency_id());

-- Client requests
CREATE POLICY client_requests_all ON client_requests FOR ALL
  USING (agency_id = public.get_user_agency_id())
  WITH CHECK (agency_id = public.get_user_agency_id());

-- Approval inbox
CREATE POLICY approval_inbox_all ON approval_inbox_items FOR ALL
  USING (agency_id = public.get_user_agency_id())
  WITH CHECK (agency_id = public.get_user_agency_id());

-- Storage bucket for materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY materials_storage_select ON storage.objects FOR SELECT
  USING (bucket_id = 'materials' AND auth.role() = 'authenticated');

CREATE POLICY materials_storage_insert ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'materials' AND auth.role() = 'authenticated');
