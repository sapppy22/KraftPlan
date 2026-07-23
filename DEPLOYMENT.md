# KraftPlan — Deployment Guide (free tier, no credit card)

Everything deploys with **`wrangler` + a Cloudflare API token** — no dashboard
"connect a Git repo" step (works even if you're only a repo collaborator).

| Layer | Host | Free tier | Cold starts |
|---|---|---|---|
| Web app (`apps/web`) | **Cloudflare Pages** | unlimited requests, global CDN | none (static) |
| API (`apps/worker`) | **Cloudflare Workers** | 100k requests/day | **none — always on** |
| Database (`packages/db`) | **Neon** (Postgres over HTTP) | 0.5 GB, autoscaling | none |

```
Browser ─▶ Cloudflare Pages (Next.js)  ─▶  Cloudflare Worker (Hono API)  ─▶  Neon (HTTP driver)
           always-on, global edge          always-on, zero cold start        serverless Postgres
```

The API is a single Cloudflare Worker (`apps/worker`, Hono + `drizzle-orm/neon-http`)
— **zero cold starts**, unlike a sleeping Node host.

---

## 0. Prerequisites

- A **Cloudflare account** (free, no card) → create an **API token** with the
  *Edit Cloudflare Workers* template: dash.cloudflare.com → My Profile → API Tokens.
- Your **Cloudflare Account ID** (Workers & Pages → right sidebar).
- The **Neon** database — already provisioned & seeded (81 exercises, 9 plans).

Export the token for the CLI:
```bash
export CLOUDFLARE_API_TOKEN=xxxxxxxx
export CLOUDFLARE_ACCOUNT_ID=xxxxxxxx
```

## 1. Deploy the API → Cloudflare Workers

```bash
cd apps/worker
npx wrangler secret put DATABASE_URL   # paste the Neon POOLED connection string
npx wrangler secret put JWT_SECRET     # paste a long random string
pnpm deploy                            # wrangler deploy
# → https://kraftplan-api.<your-subdomain>.workers.dev
```
Verify: `curl https://kraftplan-api.<subdomain>.workers.dev/health` → `{"status":"ok"}`.

Set the allowed web origin (after step 2) with:
`npx wrangler deploy --var CORS_ORIGIN:https://kraftplan.pages.dev`
(or edit `[vars]` in `apps/worker/wrangler.toml`).

## 2. Deploy the web app → Cloudflare Pages (direct upload)

```bash
cd apps/web
# point the frontend at your Worker URL:
#   edit NEXT_PUBLIC_API_BASE in apps/web/wrangler.toml, OR export it for the build:
export NEXT_PUBLIC_API_BASE=https://kraftplan-api.<your-subdomain>.workers.dev
pnpm pages:build                       # @cloudflare/next-on-pages
npx wrangler pages deploy .vercel/output/static --project-name kraftplan
# → https://kraftplan.pages.dev
```
No repo connection required — this uploads the built assets directly with your token.

## 3. Wire them together

- Worker `CORS_ORIGIN` → your Pages URL (`https://kraftplan.pages.dev`).
- Web `NEXT_PUBLIC_API_BASE` → your Worker URL. Rebuild + redeploy the web after changing it.

---

## Database — already provisioned ✅

To re-run against a fresh Neon project, put the connection strings in `.env` and:
```bash
pnpm db:push    # create tables (uses DATABASE_URL_UNPOOLED)
pnpm db:seed    # load exercises + plans
```
Use the **pooled** URL (`...-pooler...`) for `DATABASE_URL`.

## Uptime & scale

- **Zero cold starts.** Both Pages and Workers are always-on at the edge — no
  sleeping, no keep-alive needed.
- **Neon** autoscales and its **pooled** endpoint multiplexes many connections;
  the Worker uses the HTTP driver (one stateless fetch per query), which scales
  cleanly with Workers' concurrency.
- Free limits: Workers 100k req/day, Pages unlimited static requests, Neon 0.5 GB.

## Optional CI/CD (GitHub Actions)

The workflows in [`deploy/workflows/`](./deploy/workflows/) build + deploy the web app
and (optionally) the Worker on push. Copy them into `.github/workflows/` via the GitHub
web UI (a token without the `workflow` scope can't push them). Add repo secrets
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.



## Local development

```bash
cp .env.example .env         # fill in DATABASE_URL (Neon) + JWT_SECRET
pnpm install
pnpm db:push && pnpm db:seed # first time only
pnpm --filter @kraftplan/worker dev   # Worker API on :4001 (reads apps/worker/.dev.vars)
pnpm dev:web                          # web app on :3000
```
