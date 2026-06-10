/**
 * User test playbook for Chiara — run before the live session.
 * Usage: node scripts/chiara-session-guide.mjs
 */

console.log(`
=== AgencyPilot — Sessione User Test con Chiara (~45 min) ===

Setup:
  1. supabase db reset && npm run dev
  2. Login: chiara@publitrust.it / demo1234

Task A — Pipeline (cronometra):
  - Inbox AI → incolla richiesta Legnano→Bergamo (o email reale)
  - Approval Inbox → review reply, brief, fonti, quality
  - Approva / modifica / rifiuta

Task B — Agency Brain:
  - Cerca qualcosa che oggi richiede tempo manuale
  - Esempio: "Trova l'ultima vetrofania approvata di Bergamo"

Task C — Learning:
  - Dopo approve con edit, ripeti richiesta simile
  - Verifica se il tono migliora

Metriche da annotare:
  - Correzioni a Jarvis prima di approvare: ___
  - Tempo Task A (incolla → approve): ___ min
  - Brain trova al primo tentativo? sì / no
  - Frase spontanea ("però io ogni giorno..."): ___

Dopo la sessione:
  - Aggiornare AgencyPilot_CursorPrompt con SOLO insight reali da Chiara
`);
