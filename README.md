# Fullstack Setup (Node backend + Next frontend)

## Structure
- `backend` => Node.js + Express + PostgreSQL
- `frontend` => Next.js + MUI

## Prerequisites
- Node.js 18+ and npm
- PostgreSQL running locally

## Run Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

## Run Frontend
```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Deploy backend on Railway

The backend pre-deploy step runs database migrations. That step **requires** a Postgres connection string on the service:

1. In the Railway project, create a **PostgreSQL** database (or use an existing one).
2. On the **backend** service, open **Variables** and ensure **`DATABASE_URL`** (or **`DB_URL`**) is set. The usual approach is to add a **variable reference** from the Postgres plugin so `DATABASE_URL` is injected automatically when the database is linked to the service.

Without that, migrations fail with “DB_URL or DATABASE_URL is required.” If you must deploy once without a database (not recommended for production), set **`SKIP_DB_MIGRATIONS=1`** on the service so the migrate step exits successfully; add a real `DATABASE_URL` before relying on the API.
