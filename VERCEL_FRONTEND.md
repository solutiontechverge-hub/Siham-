# Deploy frontend on Vercel

Backend (working): https://mollure-frontend-backend.vercel.app

## Vercel project settings

Create or open the **frontend** Vercel project linked to `solutiontechverge-hub/MollureFrontend`.

| Setting | Value |
|--------|--------|
| **Root Directory** | `frontend` |
| **Framework** | Next.js |
| **Build Command** | *(leave empty — uses `frontend/vercel.json`)* |
| **Output Directory** | *(leave empty — Next.js uses `.next`)* |
| **Install Command** | *(leave empty — uses `frontend/vercel.json`)* |
| **Production Branch** | `main` or `frontend-umer` |

The URL `mollure-frontend-frontend.vercel.app` is normal when the project name is `mollure-frontend` and Root Directory is `frontend`.

## Environment variables (Vercel → Settings → Environment Variables)

Add for **Production** and **Preview**:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://mollure-frontend-backend.vercel.app` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | your Stripe publishable key |

Optional (for checkout API route):

| Name | Value |
|------|--------|
| `STRIPE_SECRET_KEY` | your Stripe secret key |

Then **Redeploy** the latest deployment (or push to `main`).

## `404 DEPLOYMENT_NOT_FOUND`

This means there is **no successful production deployment** yet (build failed or never ran). After fixing settings above, trigger **Deploy** from the Vercel dashboard and check **Build Logs**.

## `Deployment Blocked` (Hobby + private repo)

Vercel Hobby only deploys commits whose **Git author** is the **Vercel project owner** (GitHub account linked in Vercel → Account → Authentication).

If a teammate merges to `main` (e.g. PR #22), production stays blocked until the owner pushes again.

**Fix (pick one):**

1. **Owner** pushes any commit to `main` (we use an empty chore commit), or redeploys an older deployment from the owner in the Vercel UI.
2. **Upgrade** the Vercel team to Pro and add collaborators.
3. **Reconnect GitHub** at https://vercel.com/account/settings/authentication if the owner’s link broke.

**For teammates:** open PRs only; ask the owner to merge, or merge via GitHub using the owner account.

## Local production test

```powershell
cd C:\Users\MPC\Desktop\mollureFinal
npm install
npm run build:frontend
```
