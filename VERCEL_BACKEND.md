# Backend on Vercel — required environment variables

`GET /` returns `ok` **without** a database. Login, register, and all `/api/*` routes need PostgreSQL.

If `DATABASE_URL` is missing on Vercel, the API returns **500** with:

```json
{
  "message": "Failed to login.",
  "data": { "error": "Database URL missing: set DATABASE_URL or DB_URL, ..." }
}
```

## Fix (Vercel Dashboard)

Open the **backend** project (`mollure-frontend-backend`) → **Settings** → **Environment Variables**.

Add at least:

| Variable | Example / notes |
|----------|-----------------|
| `DATABASE_URL` or `DB_URL` | Supabase pooler URL, e.g. `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres` |
| `DB_SSL` | `true` for Supabase |
| `JWT_SECRET` | long random string |
| `JWT_REFRESH_SECRET` | long random string |
| `APP_BASE_URL` | `https://mollure-frontend-backend-sw9l.vercel.app` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | for register / forgot-password emails |

Copy values from your local `backend/.env` (same Supabase project as local dev).

Then **Redeploy** the backend.

## Verify

```text
GET https://mollure-frontend-backend-sw9l.vercel.app/api/health
```

Should return `{ "status": "ok", "database": "connected" }`.

## Dev login (after DB + migrate)

| Email | Password |
|-------|----------|
| `pro@mollure.dev` | `Password123!` |
| `client@mollure.dev` | `Password123!` |

Run migrations on production DB once: `npm run migrate` (from CI or locally against production `DATABASE_URL`).
