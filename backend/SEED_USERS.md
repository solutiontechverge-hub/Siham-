# Dev seed users (UUID database)

All accounts use password: **Password123!**

Primary keys are **auto-generated** (`gen_random_uuid()`). Look up ids by email or business name after each reset.

| Role | Email |
|------|--------|
| Professional | `pro@mollure.dev` |
| Client (individual) | `client@mollure.dev` |
| Company | `company@mollure.dev` |

Sample salon: **Ryan Harris Salon** (professional account). Shop id = `business_setups.id` for that row (from listings API or DB).

Services under **Hair**: **Haircut**, **Color**.

## Pehle se add hua purana seed (fixed UUID) — nayi random ids ke liye

Purane users ki **same email** rehti hai lekin **nayi UUID** ban jati hai. Ye command chalao:

```bash
cd backend
npm run seed:reset
```

Phir backend restart karo aur dubara login karo (purana JWT invalid ho sakta hai).

### Manual (agar script na chalao)

PostgreSQL par:

```sql
DELETE FROM schema_migrations WHERE filename = '2026-05-21_seed_users_and_catalog.sql';
```

Phir seed users delete (cascade profiles / business):

```sql
DELETE FROM users
WHERE email IN ('pro@mollure.dev', 'client@mollure.dev', 'company@mollure.dev');
```

Phir:

```bash
cd backend
npm run migrate
```

## Pehli dafa ya poora DB reset

```bash
cd backend
npm run migrate
```

(UUID schema migration pehle se chal chuki ho to sirf `seed:reset` kaafi hai.)

See also [README.md](./README.md) and the [project README](../README.md).
