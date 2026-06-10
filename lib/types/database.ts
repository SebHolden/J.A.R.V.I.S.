export interface Agency {
  id: string;
  name: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface User {
  id: string;
  agency_id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Client {
  id: string;
  agency_id: string;
  name: string;
  sector: string | null;
  description: string | null;
  status: string;
  brand_guidelines: Record<string, unknown>;
  created_at: string;
}

export interface Contact {
  id: string;
  client_id: string;
  name: string;
  email: string | null;
  role: string | null;
  notes: string | null;
  preferences: Record<string, unknown>;
  created_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  title: string;
  status: string;
  deadline: string | null;
  description: string | null;
  created_at: string;
}

export interface Material {
  id: string;
  agency_id: string;
  client_id: string;
  project_id: string | null;
  title: string;
  file_type: string;
  storage_path: string | null;
  created_by: string | null;
  created_at: string;
}

export interface MaterialVersion {
  id: string;
  material_id: string;
  version_number: number;
  file_path: string | null;
  status: string;
  uploaded_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface ApprovalInboxItem {
  id: string;
  agency_id: string;
  request_id: string | null;
  client_id: string | null;
  project_id: string | null;
  type: string;
  status: string;
  title: string;
  summary: string | null;
  reply_draft: string | null;
  brief_json: Record<string, unknown>;
  suggested_tasks: unknown[];
  open_questions: unknown[];
  confidence_score: number;
  risk_level: string;
  sources: unknown[];
  quality_result: string | null;
  quality_checks: unknown[];
  blocked_reason: string | null;
  priority: number;
  pipeline_context: Record<string, unknown>;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  clients?: { name: string } | null;
  projects?: { title: string } | null;
}
