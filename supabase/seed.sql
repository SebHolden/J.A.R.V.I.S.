-- AgencyPilot demo seed: Publitrust
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fixed IDs for reproducible references
-- Agency: a0000000-0000-4000-8000-000000000001
-- Chiara:  b0000000-0000-4000-8000-000000000001
-- SYNLAB:  c0000000-0000-4000-8000-000000000001

INSERT INTO agencies (id, name, settings) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Publitrust', '{"timezone": "Europe/Rome", "language": "it"}'::jsonb);

-- Demo auth user: chiara@publitrust.it / demo1234
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change
) VALUES (
  'b0000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'chiara@publitrust.it',
  crypt('demo1234', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Chiara"}'::jsonb, NOW(), NOW(), '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  'b0000000-0000-4000-8000-000000000002',
  'b0000000-0000-4000-8000-000000000001',
  '{"sub":"b0000000-0000-4000-8000-000000000001","email":"chiara@publitrust.it"}'::jsonb,
  'email', 'b0000000-0000-4000-8000-000000000001', NOW(), NOW(), NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO users (id, agency_id, name, email, role) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Chiara', 'chiara@publitrust.it', 'account');

-- Clients
INSERT INTO clients (id, agency_id, name, sector, description, brand_guidelines) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'SYNLAB', 'healthcare', 'Laboratorio diagnostico — campagne prevenzione e materiali sedi',
   '{"logo":"SYNLAB rosso su bianco","colors":{"primary":"#E30613","secondary":"#003366"},"fonts":{"heading":"SYNLAB Sans","body":"Arial"},"tone":"professionale, empatico, chiaro","notes":"Confermare sempre dimensioni vetrofanie per sede"}'::jsonb),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'ARX', 'insurance', 'Assicurazioni e servizi finanziari', '{"tone":"istituzionale, affidabile"}'::jsonb),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'PED', 'education', 'Formazione professionale', '{}'::jsonb),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Tecno Stuk', 'industrial', 'Componentistica industriale', '{}'::jsonb),
  ('c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'Le Querce', 'hospitality', 'Struttura ricettiva', '{}'::jsonb);

-- Contacts
INSERT INTO contacts (id, client_id, name, email, role, notes, preferences) VALUES
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Laura Bianchi', 'laura.bianchi@synlab.it', 'Marketing Manager',
   'Approva materiali vetrofanie e flyer', '{"reply_style":"breve e diretto","prefers_dimensions_confirmed":true}'::jsonb),
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'Marco Rossi', 'marco.rossi@synlab.it', 'Facility Manager',
   'Referente sedi Lombardia', '{}'::jsonb);

-- Projects
INSERT INTO projects (id, client_id, title, status, deadline, description) VALUES
  ('e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Vetrofanie sedi SYNLAB Lombardia', 'active', '2026-07-15',
   'Adattamento vetrofanie approvate per nuove sedi: Bergamo, Legnano, Brescia'),
  ('e0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'Campagna prevenzione cuore 2024-2026', 'active', '2026-06-30',
   'Flyer e materiali per campagna prevenzione cardiovascolare'),
  ('e0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000002', 'Brochure istituzionale ARX', 'active', '2026-08-01', 'Brochure corporate aggiornata');

-- Materials: SYNLAB vetrofania Bergamo
INSERT INTO materials (id, agency_id, client_id, project_id, title, file_type, storage_path, created_by) VALUES
  ('f0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
   'e0000000-0000-4000-8000-000000000001', 'Vetrofania SYNLAB Bergamo', 'vetrofania', 'materials/synlab/vetrofania-bergamo', 'b0000000-0000-4000-8000-000000000001'),
  ('f0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
   'e0000000-0000-4000-8000-000000000002', 'Flyer prevenzione cuore aprile 2024', 'flyer', 'materials/synlab/flyer-prevenzione', 'b0000000-0000-4000-8000-000000000001'),
  ('f0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002',
   'e0000000-0000-4000-8000-000000000003', 'Brochure istituzionale ARX', 'brochure', 'materials/arx/brochure', 'b0000000-0000-4000-8000-000000000001'),
  ('f0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
   'e0000000-0000-4000-8000-000000000001', 'Vetrofania SYNLAB Legnano (riferimento)', 'vetrofania', 'materials/synlab/vetrofania-legnano', 'b0000000-0000-4000-8000-000000000001');

INSERT INTO material_versions (id, material_id, version_number, file_path, status, notes) VALUES
  ('10000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 1, 'materials/synlab/vetrofania-bergamo/v1.pdf', 'archived', 'Versione iniziale — sostituita'),
  ('10000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 2, 'materials/synlab/vetrofania-bergamo/v2.pdf', 'approved', 'Approvata da Laura — dimensioni 120x80cm'),
  ('10000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000001', 3, 'materials/synlab/vetrofania-bergamo/v3.pdf', 'draft', 'Bozza in lavorazione — NON usare per produzione'),
  ('10000000-0000-4000-8000-000000000004', 'f0000000-0000-4000-8000-000000000002', 1, 'materials/synlab/flyer-prevenzione/v1.pdf', 'approved', 'Flyer campagna prevenzione cuore — date aprile 2024'),
  ('10000000-0000-4000-8000-000000000005', 'f0000000-0000-4000-8000-000000000003', 1, 'materials/arx/brochure/v1.pdf', 'client_review', 'In attesa approvazione cliente'),
  ('10000000-0000-4000-8000-000000000006', 'f0000000-0000-4000-8000-000000000004', 1, 'materials/synlab/vetrofania-legnano/v1.pdf', 'approved', 'Vetrofania Legnano — riferimento per adattamenti');

INSERT INTO approvals (material_version_id, approved_by, notes, channel) VALUES
  ('10000000-0000-4000-8000-000000000002', 'Laura Bianchi', 'Approvata per stampa sede Bergamo', 'email'),
  ('10000000-0000-4000-8000-000000000004', 'Laura Bianchi', 'Flyer prevenzione cuore approvato', 'email'),
  ('10000000-0000-4000-8000-000000000006', 'Laura Bianchi', 'Vetrofania Legnano approvata', 'email');

-- Learning records (past corrections for SYNLAB)
INSERT INTO learning_records (agency_id, client_id, event_type, input_snapshot, output_snapshot, human_edit_diff, outcome) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'reply_edited',
   '{"intent":"vetrofania_adaptation","location":"Bergamo"}'::jsonb,
   '{"tone":"formal"}'::jsonb,
   'Rimosso saluto lungo. Aggiunta conferma dimensioni 120x80cm e riferimento a v2 approvata.',
   'edited'),
  ('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'reply_edited',
   '{"intent":"flyer_update","campaign":"prevenzione"}'::jsonb,
   '{"tone":"formal"}'::jsonb,
   'Specificare date aggiornate nel corpo email. Menzionare approvazione Laura necessaria.',
   'edited'),
  ('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'reply_approved',
   '{"intent":"vetrofania_adaptation"}'::jsonb,
   '{"tone":"concise"}'::jsonb, NULL, 'approved');

INSERT INTO learning_patterns (agency_id, client_id, pattern_type, pattern_data, strength, sample_count) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'tone_adjustment',
   '{"adjustments":["Usa saluti brevi (Buongiorno, non Gentilissimi)","Conferma sempre dimensioni vetrofania","Cita versione approvata esplicitamente","Menziona Laura per approvazioni materiali"]}'::jsonb,
   0.75, 3);

-- Feature flags
INSERT INTO feature_flags (agency_id, key, enabled) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'agency_brain', true),
  ('a0000000-0000-4000-8000-000000000001', 'gmail_integration', false),
  ('a0000000-0000-4000-8000-000000000001', 'google_drive_sync', false),
  ('a0000000-0000-4000-8000-000000000001', 'clickup_integration', false),
  ('a0000000-0000-4000-8000-000000000001', 'ai_cost_dashboard', false),
  ('a0000000-0000-4000-8000-000000000001', 'autonomous_execution', false);

-- Autonomy policies (all disabled)
INSERT INTO autonomy_policies (agency_id, action_type, policy, enabled) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'send_email', 'require_approval', false),
  ('a0000000-0000-4000-8000-000000000001', 'create_task', 'require_approval', false),
  ('a0000000-0000-4000-8000-000000000001', 'request_materials', 'require_approval', false),
  ('a0000000-0000-4000-8000-000000000001', 'notify_designer', 'require_approval', false);

-- Knowledge chunks (placeholder embeddings — zero vector; re-embed via script in production)
INSERT INTO knowledge_chunks (agency_id, client_id, source_type, source_id, content, embedding) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'material_version', '10000000-0000-4000-8000-000000000002',
   'Vetrofania SYNLAB Bergamo v2 approvata da Laura Bianchi. Dimensioni 120x80cm. Logo SYNLAB rosso su sfondo bianco. Stato: approved. File: materials/synlab/vetrofania-bergamo/v2.pdf',
   array_fill(0, ARRAY[1536])::vector),
  ('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'material_version', '10000000-0000-4000-8000-000000000004',
   'Flyer campagna prevenzione cuore SYNLAB aprile 2024. Approvato da Laura. Contiene date eventi screening cardiologico. Stato: approved.',
   array_fill(0, ARRAY[1536])::vector),
  ('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'material_version', '10000000-0000-4000-8000-000000000006',
   'Vetrofania SYNLAB Legnano v1 approvata. Riferimento per adattamenti ad altre sedi Lombardia. Dimensioni standard sede Legnano.',
   array_fill(0, ARRAY[1536])::vector);
