export type UrgencyLevel = "low" | "medium" | "high" | "critical";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type QualityResult = "pass" | "warning" | "block";

export interface MaterialVersionRef {
  id: string;
  material_id: string;
  title: string;
  version_number: number;
  status: string;
  file_path: string | null;
  notes: string | null;
}

export interface DecisionRef {
  id: string;
  type: string;
  description: string;
  date: string;
}

export interface ProjectRef {
  id: string;
  title: string;
  status: string;
  deadline: string | null;
}

export interface SuggestedTask {
  title: string;
  priority: "critical" | "high" | "medium" | "low";
  due_date: string | null;
  reasoning: string;
}

export interface BriefDraft {
  client: string;
  project: string;
  objective: string;
  target_audience: string;
  deliverable: string;
  format_dimensions: string;
  materials_to_use: string[];
  copy_needed: string;
  references: string[];
  deadline: string | null;
  open_questions: string[];
  risks: string[];
  designer_instructions: string[];
}

export interface QualityCheckItem {
  check: string;
  passed: boolean;
  detail: string;
}

export interface SourceRef {
  type: "material_version" | "brief" | "approval" | "learning_record" | "contact" | "project";
  id: string;
  label: string;
}

export interface LearningRecordRef {
  id: string;
  event_type: string;
  outcome: string | null;
  human_edit_diff: string | null;
}

export interface PipelineContext {
  request_id: string;
  agency_id: string;
  user_id: string | null;
  client_id: string | null;
  contact_id: string | null;
  project_id: string | null;
  raw_input: string;
  intent: string;
  urgency: UrgencyLevel;
  deadline: string | null;
  missing_info: string[];
  referenced_material_ids: string[];
  risk_score: number;
  intake_confidence: number;

  memory_package: {
    brand_guidelines: Record<string, unknown>;
    approved_materials: MaterialVersionRef[];
    past_decisions: DecisionRef[];
    contact_preferences: Record<string, unknown>;
    recent_projects: ProjectRef[];
    warnings: string[];
  };

  similar_past_cases: LearningRecordRef[];
  predicted_edit_probability: number;
  recommended_tone_adjustments: string[];

  reply_draft: string;
  brief_draft: BriefDraft;
  suggested_tasks: SuggestedTask[];
  open_questions: string[];
  account_confidence: number;

  quality_result: QualityResult;
  quality_checks: QualityCheckItem[];
  blocked_reason: string | null;

  inbox_item_ids: string[];
  requires_human: boolean;
  autonomous_eligible: boolean;
  sources: SourceRef[];
}

export interface BrainSource {
  chunk_id: string;
  source_type: "material" | "brief" | "approval" | "email";
  source_id: string;
  source_label: string;
  link: string;
  relevance_score: number;
  snippet: string;
}

export interface BrainAnswer {
  answer: string;
  confidence: number;
  sources: BrainSource[];
  selection_reasoning: string;
  alternatives_considered: BrainSource[];
  client_scope: string | "all";
}

export type AgentStep =
  | "intake"
  | "memory"
  | "learning"
  | "account"
  | "quality"
  | "executive";

export const AGENT_STEPS: { id: AgentStep; label: string }[] = [
  { id: "intake", label: "Intake Agent" },
  { id: "memory", label: "Memory Agent" },
  { id: "learning", label: "Learning Agent" },
  { id: "account", label: "Account Agent" },
  { id: "quality", label: "Quality Agent" },
  { id: "executive", label: "Executive Agent" },
];

export function createEmptyContext(
  requestId: string,
  agencyId: string,
  userId: string | null,
  rawInput: string
): PipelineContext {
  return {
    request_id: requestId,
    agency_id: agencyId,
    user_id: userId,
    client_id: null,
    contact_id: null,
    project_id: null,
    raw_input: rawInput,
    intent: "",
    urgency: "medium",
    deadline: null,
    missing_info: [],
    referenced_material_ids: [],
    risk_score: 0,
    intake_confidence: 0,
    memory_package: {
      brand_guidelines: {},
      approved_materials: [],
      past_decisions: [],
      contact_preferences: {},
      recent_projects: [],
      warnings: [],
    },
    similar_past_cases: [],
    predicted_edit_probability: 0,
    recommended_tone_adjustments: [],
    reply_draft: "",
    brief_draft: {
      client: "",
      project: "",
      objective: "",
      target_audience: "",
      deliverable: "",
      format_dimensions: "",
      materials_to_use: [],
      copy_needed: "",
      references: [],
      deadline: null,
      open_questions: [],
      risks: [],
      designer_instructions: [],
    },
    suggested_tasks: [],
    open_questions: [],
    account_confidence: 0,
    quality_result: "pass",
    quality_checks: [],
    blocked_reason: null,
    inbox_item_ids: [],
    requires_human: true,
    autonomous_eligible: false,
    sources: [],
  };
}
