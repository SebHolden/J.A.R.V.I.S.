const SYNLAB = "c0000000-0000-4000-8000-000000000001";
const LAURA = "d0000000-0000-4000-8000-000000000001";
const VETROFANIE_PROJECT = "e0000000-0000-4000-8000-000000000001";
const BERGANO_MATERIAL = "f0000000-0000-4000-8000-000000000001";

export function isLegnanoTestMode(): boolean {
  return process.env.AGENCYPILOT_TEST_MODE === "legnano";
}

export function legnanoIntakeFixture(rawInput: string) {
  return {
    client_id: SYNLAB,
    contact_id: LAURA,
    project_id: VETROFANIE_PROJECT,
    intent: "Adattamento vetrofania sede Legnano per Bergamo con verifica logo",
    urgency: "medium" as const,
    deadline: null,
    missing_info: [] as string[],
    referenced_material_ids: [BERGANO_MATERIAL],
    risk_score: 25,
    intake_confidence: 92,
    raw_input: rawInput,
  };
}

export function legnanoAccountFixture() {
  return {
    reply_draft: `Buongiorno,

grazie per la richiesta. Procederemo con l'adattamento della vetrofania della sede di Legnano per la sede di Bergamo, utilizzando come base la grafica già approvata (vetrofania Bergamo v2, approvata da Laura — dimensioni 120x80 cm).

Per quanto riguarda il logo, verificheremo con voi che la versione SYNLAB rosso su bianco sia ancora quella corretta prima di andare in produzione.

A presto,
Chiara — Publitrust`,
    brief_draft: {
      client: "SYNLAB",
      project: "Vetrofanie sedi SYNLAB Lombardia",
      objective:
        "Adattare la vetrofania approvata della sede Legnano per la sede Bergamo, aggiornando i riferimenti della sede",
      target_audience: "Pazienti e visitatori sede SYNLAB Bergamo",
      deliverable: "Vetrofania adattata per sede Bergamo",
      format_dimensions: "120x80 cm (come v2 approvata)",
      materials_to_use: ["Vetrofania SYNLAB Legnano v1 (riferimento)", "Vetrofania SYNLAB Bergamo v2 (approvata)"],
      copy_needed: "Aggiornamento riferimenti sede Bergamo",
      references: ["Vetrofania Legnano v1", "Vetrofania Bergamo v2 approvata"],
      deadline: "2026-07-15",
      open_questions: ["Conferma versione logo aggiornata"],
      risks: ["Logo potrebbe richiedere aggiornamento"],
      designer_instructions: [
        "Usare Legnano come template grafico",
        "Destinazione finale: sede Bergamo",
        "Non usare v3 in bozza",
      ],
    },
    suggested_tasks: [
      {
        title: "Adattamento vetrofania Legnano → Bergamo",
        priority: "high" as const,
        due_date: "2026-07-01",
        reasoning: "Richiesta cliente attiva su progetto vetrofanie",
      },
    ],
    open_questions: ["Il logo SYNLAB è ancora la versione rosso su bianco approvata?"],
    account_confidence: 88,
  };
}
