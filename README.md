# Fullstack Setup (Node backend + Next frontend)

## Structure
- `backend` => Node.js + Express + PostgreSQL
- `frontend` => Next.js + MUI

## Prerequisites
- Node.js 18+ and npm
- PostgreSQL running locally

## Database (UUID)

Application tables use **UUID** primary keys (`gen_random_uuid()`), not auto-increment integers. This reduces predictable ID enumeration on public URLs and APIs.

Migrations live in `backend/sql/`. On a fresh or existing dev database, from the `backend` folder:

```bash
npm run migrate
```

Migration order:
1. Legacy bootstrap / incremental SQL (if not yet applied)
2. `2026-05-21_migrate_to_uuid_schema.sql` — rebuilds app tables with UUID columns (**drops existing app data**)
3. `2026-05-21_seed_users_and_catalog.sql` — dev users, categories, and sample salon

**Warning:** The UUID migration is destructive for app tables. Back up production data before running it.

See also [backend/SEED_USERS.md](backend/SEED_USERS.md) for seed accounts (IDs are auto-generated).

## Dev seed users

All seed accounts share password: **`Password123!`**

| Role | Email |
|------|--------|
| Professional | `pro@mollure.dev` |
| Client (individual) | `client@mollure.dev` |
| Company | `company@mollure.dev` |

Sample listing: **Ryan Harris Salon** (professional seed). Shop id is auto-generated — use the client listing API or DB query on `business_setups` after migrate.

After migrating, restart the backend and sign in again (old JWTs may reference outdated ids).

**Already seeded with old fixed UUIDs?** Run `npm run seed:reset` in `backend` to delete dev users and re-seed with new auto-generated ids (same emails/password).

## Run Backend
```bash
cd backend
cp .env.example .env
# Set DATABASE_URL (or DB_URL) to your Postgres connection string
npm install
npm run migrate   # apply schema + seeds
npm run dev
```

API health endpoint: `GET http://localhost:5000/api/health`

## Run Frontend
```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:3000`.

Ensure the frontend API base URL (e.g. `frontend/.env` / `.env.development`) points at the backend (`http://localhost:5000` by default).

## Deploy backend on Railway

The backend pre-deploy step runs database migrations. That step **requires** a Postgres connection string on the service:

1. In the Railway project, create a **PostgreSQL** database (or use an existing one).
2. On the **backend** service, open **Variables** and ensure **`DATABASE_URL`** (or **`DB_URL`**) is set. The usual approach is to add a **variable reference** from the Postgres plugin so `DATABASE_URL` is injected automatically when the database is linked to the service.

Without that, migrations fail with “DB_URL or DATABASE_URL is required.” If you must deploy once without a database (not recommended for production), set **`SKIP_DB_MIGRATIONS=1`** on the service so the migrate step exits successfully; add a real `DATABASE_URL` before relying on the API.

On first deploy to a new database, migrations will create the UUID schema. Only run the UUID rebuild migration (`migrate_to_uuid_schema`) when you intend to reset app data; seed SQL is safe to re-run (`ON CONFLICT`).
