# AgencyPilot

AI Account Manager for marketing agencies. The AI prepares everything — the human approves.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Supabase** (Auth, PostgreSQL, Storage, RLS)
- **OpenAI GPT-4o** (multi-agent pipeline)
- **pgvector** (semantic search foundation)

## Quick start

### 1. Supabase setup

```bash
# Install Supabase CLI, then from this directory:
supabase start
supabase db reset   # runs migrations + seed
```

Copy keys from `supabase status` into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
OPENAI_API_KEY=sk-...
```

### 2. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo login

- **Email:** chiara@publitrust.it
- **Password:** demo1234

## Core flow

1. **Inbox AI** — paste a client request (demo chips included)
2. Agents run: Intake → Memory → Learning → Account → Quality → Executive
3. **Approval Inbox** — review reply, brief, tasks, quality checklist
4. **Approve / Edit / Reject** — human decision, learning system records outcome

## Demo data

- Agency: **Publitrust**
- Account manager: **Chiara**
- Clients: SYNLAB, ARX, PED, Tecno Stuk, Le Querce
- SYNLAB materials: vetrofania Bergamo v1 (archived), v2 (approved), v3 (draft); flyer prevenzione (approved)

## Project structure

```
app/           # Next.js routes (dashboard, API)
components/    # UI components
lib/agents/    # Multi-agent pipeline
lib/supabase/  # Auth clients
supabase/      # Migrations + seed
```

## Out of scope (Sprint 1)

Gmail, Drive, ClickUp, autonomous sending, visual drafts, billing, mobile app.
