# KraftPlan — Deployment Guide (free tier, no credit card)

KraftPlan runs on three free services. **None require a credit card.**

| Layer | Host | Free tier | Notes |
|---|---|---|---|
| Web app (`apps/web`) | **Cloudflare Pages** | Unlimited requests, global CDN | Always-on, instant worldwide |
| Unified API (`apps/api`) | **Render** (Node) | 750 hrs/mo | Sleeps after ~15 min idle → keep-alive included |
| Database (`packages/db`) | **Neon** (Postgres) | 0.5 GB, autoscaling | Pooled connection handles many users |

```
Browser ──► Cloudflare Pages (Next.js web)  ──►  Render (Fastify API)  ──►  Neon (Postgres)
            always-on, global edge               apps/api, all services      pooled, serverless
```

The 5 original microservices are combined into **one deployable** (`apps/api`) so the
whole backend runs in a single free process. See `apps/api/src/index.ts`.

---

## 0. Database — already provisioned ✅

The Neon database is live and seeded (81 exercises, 9 plans). To re-run against a
fresh Neon project, put the connection strings in `.env` and:

```bash
pnpm db:push    # create tables (uses DATABASE_URL_UNPOOLED)
pnpm db:seed    # load exercises + plans
```

Use the **pooled** URL (`...-pooler...`) for `DATABASE_URL` and the **direct** URL
(no `-pooler`) for `DATABASE_URL_UNPOOLED`.

---

## 1. Deploy the API → Render (free, no CC)

1. Sign up at [render.com](https://render.com) (GitHub login, no card).
2. **New +** → **Blueprint** → pick the `admin_redacted/KraftPlan` repo. Render reads
   [`render.yaml`](./render.yaml) and creates the `kraftplan-api` web service.
3. In the service's **Environment**, set:
   - `DATABASE_URL` = your Neon **pooled** connection string
   - `JWT_SECRET` = a long random string (see `.env`)
   - `CORS_ORIGIN` = your Pages URL, e.g. `https://kraftplan.pages.dev`
4. Deploy. Health check: `https://kraftplan-api.onrender.com/health` → `{"status":"ok"}`.

## 2. Deploy the web app → Cloudflare Pages (free, no CC)

Easiest is the **dashboard Git integration** (Cloudflare builds it for you):

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → `KraftPlan`.
2. Build settings:
   - **Framework preset:** Next.js
   - **Root directory:** `apps/web`
   - **Build command:** `npx @cloudflare/next-on-pages@1`
   - **Build output directory:** `.vercel/output/static`
3. **Environment variables** → add `NEXT_PUBLIC_API_BASE` = your Render API URL
   (e.g. `https://kraftplan-api.onrender.com`).
4. Save & Deploy → your site is live at `https://kraftplan.pages.dev`.

CLI alternative (from `apps/web`): `pnpm pages:build && pnpm pages:deploy`.

## 3. Wire the two together

- Cloudflare Pages env: `NEXT_PUBLIC_API_BASE` → Render API URL.
- Render env: `CORS_ORIGIN` → Pages URL.
- Redeploy web after setting the API URL.

## 4. Optional CI/CD (GitHub Actions)

The CI/CD workflows live in [`deploy/workflows/`](./deploy/workflows/). **To enable them,
copy both files into `.github/workflows/`** (GitHub blocks pushing workflow files with a
token that lacks the `workflow` scope — easiest is to add them via the GitHub web UI, or
push with a `workflow`-scoped token):

- `deploy.yml` — typechecks + builds the web app on every push and deploys it to Pages on
  `main`. Add repo secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, and a repo
  variable `NEXT_PUBLIC_API_BASE`.
- `keep-api-warm.yml` — pings the API `/health` every 10 min. Add repo variable
  `API_HEALTH_URL`.

(Render redeploys itself via `autoDeploy`.)

---

## Uptime: is Render a problem?

**The web app's uptime is not affected.** Cloudflare Pages is static + globally
cached, so pages always load instantly, everywhere — regardless of the API.

**Only the API sleeps.** On Render's free tier the API idles out after ~15 min, so
the *first* data request after a quiet period takes ~30-60s (cold start); everything
after is fast. Two ways to handle it:

1. **Keep-alive (included).** [`deploy/workflows/keep-api-warm.yml`](./deploy/workflows/keep-api-warm.yml)
   (copy to `.github/workflows/`) pings `/health` every 10 min to keep the service awake. Set repo variable
   `API_HEALTH_URL = https://kraftplan-api.onrender.com/health`. This keeps the API
   warm within the 750 hrs/month free budget.
2. **Move the API to Cloudflare Workers (best uptime).** Always-on, no cold starts,
   100k requests/day free. This is the most Cloudflare-native option but requires two
   code changes: swap `argon2` (native) for a WebCrypto password hash, and swap the
   `postgres-js` TCP driver for Neon's serverless HTTP driver
   (`@neondatabase/serverless` + `drizzle-orm/neon-http`). Ask and this can be done.

**Recommendation:** ship on Render + keep-alive now (good uptime, zero cost); port the
API to Workers later if you want zero cold starts.

---

## Scaling to many users on free tier

- **Neon** autoscales compute and the **pooled** endpoint (PgBouncer) multiplexes many
  client connections — the app uses the pooled URL, so hundreds of concurrent users are
  fine on the free tier.
- **Cloudflare Pages** serves the frontend from the edge with no practical request cap.
- **API** is the bottleneck on Render free (one small instance). If you outgrow it,
  bump the Render plan or move to Workers (scales automatically).

---

## Local development

```bash
cp .env.example .env         # fill in DATABASE_URL (Neon) + JWT_SECRET
pnpm install
pnpm db:push && pnpm db:seed # first time only
pnpm dev:api                 # unified API on :4001
pnpm dev:web                 # web app on :3000
```
