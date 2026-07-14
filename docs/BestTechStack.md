# Best Tech Stack Document
## KraftPlan — AI-Powered Gym Workout Planner & Tracker

> **Status:** Draft v1.0
> **Last Updated:** 2026-07-13
> **Purpose:** Record the recommended stack and the rationale/trade-offs, so AI agents and contributors build consistently.

---

## 1. Recommendation Summary

| Layer | Choice | Alternatives considered |
|---|---|---|
| Monorepo | **pnpm workspaces + Turborepo** | Nx, plain npm workspaces |
| Frontend | **Next.js 14 (App Router) + TypeScript** | Remix, Vite SPA |
| Styling | **Tailwind CSS + Radix UI** | shadcn/ui (built on same), MUI |
| Server state | **TanStack Query** | SWR, RTK Query |
| Client state | **Zustand** (player only) | Redux, Jotai |
| Forms | **React Hook Form + Zod** | Formik, TanStack Form |
| Charts | **Recharts** | Visx, Chart.js, ECharts |
| Animation | **Framer Motion** | GSAP, Motion One |
| Backend framework | **Fastify** | Express, NestJS, Hono |
| ORM | **Drizzle ORM** | Prisma, Kysely |
| Validation | **Zod** (shared) | Yup, Valibot |
| DB | **PostgreSQL 16 + TimescaleDB** | MySQL, DynamoDB |
| Cache/queue | **Redis 7** | KeyDB, Memcached + SQS |
| Auth | **Auth.js (NextAuth v5) + JWT** | Lucia, Supabase Auth, Clerk |
| Object storage | **Cloudflare R2 (S3-compatible)** | AWS S3, Supabase Storage |
| CDN | **Cloudflare** | CloudFront, Fastly |
| Observability | **OpenTelemetry + Sentry + pino** | Datadog, New Relic |
| Deployment | **Fly.io (MVP) → AWS ECS/K8s (scale)** | Vercel, Render, Railway |
| CI/CD | **GitHub Actions** | CircleCI, GitLab CI |
| Testing | **Vitest + Playwright + Testcontainers** | Jest, Cypress |
| PWA | **next-pwa** | Workbox directly |

---

## 2. Why This Stack

### 2.1 One language end-to-end (TypeScript)
Sharing types and Zod schemas between web and services (via `packages/shared`) eliminates an entire class of contract bugs. AI agents can edit one schema and see both sides update.

### 2.2 Next.js App Router
- RSC keeps the dashboard and catalog fast (server fetch, minimal JS).
- Route handlers double as a BFF, so the client never calls downstream services directly.
- File-based routing and middleware make auth gating simple.
- Trade-off: App Router is still maturing; we mitigate by keeping client components small and well-bounded.

### 2.3 Fastify + Drizzle
- Fastify is faster than Express and has first-class Zod/TypeBox schema validation.
- Drizzle gives type-safe SQL without Prisma's heavier runtime/migration model; migrations are plain SQL (reviewable, AI-agent-friendly).
- Trade-off: Drizzle's ecosystem is newer than Prisma's, but its SQL-first approach fits our relational model and TimescaleDB hypertables better.

### 2.4 PostgreSQL + TimescaleDB
- One engine covers relational data (users, plans, sessions) and time-series (set metrics) without a separate DB.
- Hypertables scale set-metric writes and chart queries naturally.
- Trade-off: more operational weight than a managed NoSQL, but the relational integrity (plans → weeks → days → blocks → exercises) is worth it.

### 2.5 Redis for cache + queue + events
- Single infra component covers three needs (cache, rate-limit, Streams events), reducing moving parts.
- Trade-off: Redis is not durable storage; we use the DB outbox pattern so events are never lost.

### 2.6 Cloudflare R2 + CDN
- R2 is S3-compatible with zero egress fees — major cost win for media-heavy tutorial videos.
- Cloudflare CDN in front gives global edge caching.
- Trade-off: less ecosystem than S3, but SDK compatibility means we can switch backends with minimal code change.

### 2.7 Auth.js + JWT
- NextAuth v5 handles OAuth (Google) + credentials with minimal boilerplate.
- JWT (stateless) lets any service instance verify tokens via JWKS without a session DB lookup.
- Trade-off: token revocation is harder; mitigated by short access-token TTL + revocable refresh tokens in Redis.

---

## 3. Trade-offs & Mitigations

| Decision | Risk | Mitigation |
|---|---|---|
| App Router (new-ish) | API churn, edge cases | Pin minor version; isolate RSC logic; use stable patterns only |
| Drizzle (younger ORM) | Fewer docs/answers | Keep SQL explicit; maintain a `db/queries` layer; add integration tests |
| TimescaleDB on managed PG | Not all hosts support it | Use Supabase/RDS configs that support it; fallback: partition manually |
| JWT stateless auth | Revocation lag | Short access TTL (15m) + Redis refresh revocation list |
| Redis Streams (not Kafka) | Lower throughput, less replay tooling | Fine for our volume; outbox ensures durability; can migrate to Kafka later |
| R2 for media | Vendor lock-in-ish | S3-compatible API; abstraction layer over storage SDK |
| Monorepo | Slower CI if unmanaged | Turborepo remote cache + affected-only builds |

---

## 4. Cost Considerations (MVP)

| Component | Expected cost at MVP scale |
|---|---|
| Fly.io (web + services) | ~$25–75/mo (autoscale) |
| Managed Postgres (Supabase/RDS) | Free tier → ~$20/mo |
| Redis (Upstash) | Pay-per-request, ~$0–10/mo early |
| R2 storage | $0.015/GB/mo + zero egress |
| Cloudflare CDN | Free tier covers most |
| Sentry | Free dev tier |
| **Total at low traffic** | **~$30–100/mo** |

---

## 5. Scalability Path

1. **MVP:** single Fly.io region, one instance per service, managed PG + Upstash Redis.
2. **Growth:** multi-instance services behind LB; PG read replica for progress/dashboard reads; Redis cluster.
3. **Scale:** multi-region with read replicas + edge caching; split Progress service to dedicated analytics; consider Kafka for events; dedicated time-series DB if Timescale saturates.

The architecture is stateless and horizontally scalable by design, so each step is additive — no rewrites.

---

## 6. AI-Agent Notes (Conventions)

- **Shared schemas first:** define a Zod schema in `packages/shared` before implementing either side.
- **SQL-first:** prefer explicit Drizzle queries over magic; put complex queries in a `queries.ts` with a test.
- **One aggregate per service:** don't write to another service's tables; use events/HTTP.
- **Idempotency everywhere:** any mutating endpoint accepts `Idempotency-Key`.
- **Tests required** for domain logic (day resolution, PR calc, unit conversion) — these are the highest-bug-risk areas.
- **No raw SQL strings** — always Drizzle's query builder to keep parameterization.

---

## 7. What We Explicitly Avoid (for v1)

- **GraphQL** — REST + BFF fan-out is simpler for our read patterns; revisit if client needs grow.
- **Microservices from day one** — modular monolith with clear service boundaries; split later only if needed.
- **Prisma** — runtime weight and migration opacity; Drizzle fits better.
- **Redux** — overkill for our client state surface; Zustand covers the player.
- **Firebase/Supabase-as-backend** — we want service boundaries and TimescaleDB; using Supabase only as managed Postgres is fine.
- **Native mobile (React Native)** — web + PWA first; revisit in Phase 3.

---

## 8. Tooling Summary

| Tool | Use |
|---|---|
| pnpm | Package manager (fast, strict) |
| Turborepo | Monorepo build orchestration + remote cache |
| TypeScript | Language (strict mode) |
| ESLint + Prettier | Lint/format (shared config in root) |
| Husky + lint-staged | Pre-commit hooks |
| Vitest | Unit/integration testing |
| Playwright | E2E testing |
| Testcontainers | Real PG/Redis in integration tests |
| Drizzle Kit | Migrations + schema pull |
| GitHub Actions | CI/CD |
| Sentry | Error tracking |
| OpenTelemetry | Tracing/metrics |

---

## 9. Final Verdict

This stack optimizes for: **type safety end-to-end, operational simplicity at MVP, a clear scaling path, and low media egress cost.** It avoids trendy-but-immature choices where a proven alternative exists, while picking modern tooling (Drizzle, Fastify, RSC) that fits the product's interactive, data-heavy shape. It's well within what a small team or a capable AI agent can build and operate confidently.
