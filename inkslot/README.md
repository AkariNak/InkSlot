# Inkslot

Booking and client management for tattoo artists and small studios.

## Stack
React (Vite) + Node/Express + PostgreSQL + Stripe.

## What's scaffolded so far
- `backend/db/schema.sql` — full v1 data model: studios, artists, clients, appointments, consent_forms
- `backend/src/index.js` — Express server
- `backend/src/routes/auth.js` — studio signup/login (JWT)
- `backend/src/routes/appointments.js` — artist dashboard list, status updates, public booking request endpoint
- `backend/src/middleware/requireAuth.js` — JWT auth guard

Not yet built: Stripe deposit flow, consent form routes + PDF generation, frontend.

## Local setup (Codespaces or local)
1. `cd backend && npm install`
2. Create a Postgres database, then run `psql $DATABASE_URL -f db/schema.sql`
3. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`
4. `npm run dev` — server starts on port 4000
5. Test it: `curl http://localhost:4000/api/health`

## Build order (matches the plan)
1. Auth and studio setup — done, scaffolded
2. Artist calendar (CRUD for artists, availability) — next
3. Public booking page (frontend) + booking request endpoint — backend endpoint done
4. Stripe deposit — pending, needs Stripe Connect if you want studios to receive funds directly, or a simpler single-account model if Inkslot collects and pays out
5. Consent form — pending, needs a signature capture UI + PDF generation (e.g. `pdfkit` or `puppeteer`)
6. Client records — mostly falls out of the clients table already in schema, needs a dashboard view

## Decision needed before Stripe work starts
Does Inkslot take a cut of deposits, or just pass them through? This determines whether you need Stripe Connect (multi-account, more setup) or a single Stripe account (simpler, but you're the merchant of record for every studio). Worth deciding before building the payment routes since it changes the schema (`stripe_account_id` on studios assumes Connect).
