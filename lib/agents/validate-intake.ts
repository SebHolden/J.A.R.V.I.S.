interface ClientRow {
  id: string;
  name: string | null;
}

interface ContactRow {
  id: string;
  client_id: string;
}

interface ProjectRow {
  id: string;
  client_id: string;
}

interface MaterialRow {
  id: string;
  client_id: string;
}

export interface ValidatedIntakeIds {
  client_id: string | null;
  contact_id: string | null;
  project_id: string | null;
  referenced_material_ids: string[];
}

export function validateIntakeIds(
  raw: {
    client_id: string | null;
    contact_id: string | null;
    project_id: string | null;
    referenced_material_ids: string[];
  },
  clients: ClientRow[],
  contacts: ContactRow[],
  projects: ProjectRow[],
  materials: MaterialRow[]
): ValidatedIntakeIds {
  const clientIds = new Set(clients.map((c) => c.id));
  const contactById = new Map(contacts.map((c) => [c.id, c]));
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const materialById = new Map(materials.map((m) => [m.id, m]));

  let clientId =
    raw.client_id && clientIds.has(raw.client_id) ? raw.client_id : null;

  let contactId: string | null = null;
  if (raw.contact_id) {
    const contact = contactById.get(raw.contact_id);
    if (contact && (!clientId || contact.client_id === clientId)) {
      contactId = contact.id;
      if (!clientId) clientId = contact.client_id;
    }
  }

  let projectId: string | null = null;
  if (raw.project_id) {
    const project = projectById.get(raw.project_id);
    if (project && clientId && project.client_id === clientId) {
      projectId = project.id;
    } else if (project && !clientId && clientIds.has(project.client_id)) {
      clientId = project.client_id;
      projectId = project.id;
    }
  }

  const referencedMaterialIds = (raw.referenced_material_ids ?? []).filter((id) => {
    const material = materialById.get(id);
    return material && clientId && material.client_id === clientId;
  });

  return {
    client_id: clientId,
    contact_id: contactId,
    project_id: projectId,
    referenced_material_ids: referencedMaterialIds,
  };
}
