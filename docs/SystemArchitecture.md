# System Architecture Document
## KraftPlan — AI-Powered Gym Workout Planner & Tracker

> **Status:** Draft v1.0
> **Last Updated:** 2026-07-13

---

## 1. Overview

KraftPlan is a web application with a Next.js full-stack frontend, a Node.js service layer, a PostgreSQL primary datastore, a Redis cache/queue, an object store for media, and a time-series store for performance metrics. The architecture is designed to be horizontally scalable, stateless at the API layer, and tolerant of intermittent connectivity (gym Wi-Fi / mobile dead zones).

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Client (Browser / PWA)                      │
│  Next.js App (React Server Components + Client Components)        │
│  Workout Player · Dashboard · Plans · Library · Progress         │
└───────────────┬─────────────────────────────────┬───────────────┘
                │ HTTPS (REST + tRPC/GraphQL)      │ WebSocket (optional: live sync)
                ▼                                  ▼
┌──────────────────────────────────┐   ┌────────────────────────┐
│         API Gateway / LB          │   │   Realtime Gateway      │
│   (Rate limit · Auth · TLS)       │   │   (Socket.io / WS)      │
└───────────────┬──────────────────┘   └───────────┬────────────┘
                ▼                                  │
┌──────────────────────────────────────────────────┴────────────┐
│                    Application Services (Node.js)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Auth Svc │ │ Plan Svc │ │ Workout  │ │  Progress Svc     │  │
│  │          │ │          │ │  Svc     │ │  (PRs, charts)    │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘  │
│       │            │            │                │             │
│       └────────────┴────────────┴────────────────┘             │
│                          │                                      │
│            ┌─────────────┴──────────────┐                       │
│            ▼                            ▼                       │
│  ┌──────────────────┐          ┌──────────────────┐            │
│  │  PostgreSQL      │          │   Redis          │            │
│  │  (primary data)  │          │  (cache + queue) │            │
│  └──────────────────┘          └──────────────────┘            │
└────────────────────────────────────────────────────────────────┘
                │                                  │
                ▼                                  ▼
┌──────────────────────────┐        ┌──────────────────────────┐
│  Object Storage (S3 /    │        │   Time-Series Store       │
│  R2) — videos, images    │        │   (Postgres hypertables / │
└──────────────────────────┘        │    TimescaleDB) — metrics │
                                    └──────────────────────────┘
```

---

## 3. Architectural Style & Patterns

- **Monorepo with modular services.** A single repo with clear service boundaries; services can be split into separate deployables later without major rewrites.
- **Backend-for-Frontend (BFF).** Next.js Route Handlers / Server Actions act as BFF for client pages, aggregating downstream service calls.
- **Stateless API services.** Session state lives in JWT + Redis; any service instance can serve any request.
- **Repository pattern** for data access (one repository per aggregate root).
- **Event-driven side effects.** Workout completion emits a `workout.completed` event (Redis Streams) consumed by the Progress service for PR recalculation.
- **CQRS-lite for reads.** Dashboard/progress reads hit denormalized read models (materialized views / Redis caches) to keep queries fast.

---

## 4. Component Responsibilities

### 4.1 Client (Next.js)
- Server Components render authenticated pages and fetch via BFF.
- Client Components handle interactive workout player, timers, optimistic logging.
- IndexedDB (via local persistence lib) queues logs when offline; sync worker drains queue.
- PWA manifest + service worker for installability and asset caching.

### 4.2 API Gateway / Load Balancer
- Terminates TLS.
- Rate limiting (per user + per IP).
- Injects auth context (verifies JWT) and forwards to services.
- Routes: `/auth/*`, `/plans/*`, `/workouts/*`, `/progress/*`, `/exercises/*`.

### 4.3 Auth Service
- Register/login (email + Google OAuth via NextAuth/Auth.js).
- Issues JWT access tokens (short-lived) + refresh tokens (httpOnly cookie).
- Password hashing (argon2).
- Profile management.

### 4.4 Plan Service
- CRUD for plans, weeks, days, blocks, exercises (admin-authored catalog).
- User plan assignment + active-plan tracking.
- Reads heavily cached (Redis) since the catalog is mostly static.
- Day resolution: given a user + date, returns the scheduled session (or rest day).

### 4.5 Workout Service
- Session lifecycle: create, start, log sets, complete.
- Per-set metric ingestion (weight, reps, time, distance, RPE).
- Validates inputs against the prescribed scheme.
- Emits `workout.completed` event on session finish.

### 4.6 Progress Service
- Consumes `workout.completed` events.
- Recomputes PRs per exercise (max weight × reps, best pace, longest distance).
- Maintains read models: PR ledger, weekly volume aggregates, adherence calendar.
- Powers dashboard & progress charts.

### 4.7 Exercise Library Service
- Search/filter over exercise catalog (Postgres full-text + trigram).
- Returns tutorial media URLs (signed/CDN URLs to object storage).
- Alternatives graph (exercise ↔ alternative mappings).

### 4.8 Datastores
- **PostgreSQL** — users, plans, sessions, sets, PRs, exercises.
- **TimescaleDB extension** (or Postgres hypertables) — per-set metric time series for fast chart queries.
- **Redis** — cache (plan catalog, dashboard widgets), rate-limit buckets, pub/sub + Streams for events, session/refresh store.
- **Object storage (S3 / Cloudflare R2)** — tutorial videos, images, avatar uploads. Served via CDN.

---

## 5. Data Model Summary

(Detailed schema lives in the Backend doc; this is the aggregate map.)

| Aggregate | Owned by | Key fields |
|---|---|---|
| User | Auth | id, email, name, units, experienceLevel |
| Plan | Plan | id, category, weeks, daysPerWeek, difficulty, equipment[] |
| PlanWeek/Day/Block | Plan | structured program definition |
| Exercise | Library | id, name, muscles, equipment, tutorialUrl, cues[] |
| UserPlanAssignment | Plan | userId, planId, startDate, currentWeek |
| WorkoutSession | Workout | userId, planDayId, status, startedAt, endedAt |
| WorkoutSet | Workout | sessionId, exerciseId, setIndex, weight, reps, time, distance, rpe |
| PersonalRecord | Progress | userId, exerciseId, metric, value, achievedAt |

---

## 6. Cross-Cutting Concerns

### 6.1 Authentication & Authorization
- JWT access token (15 min) in memory; refresh token (30 days) in httpOnly, Secure, SameSite=Strict cookie.
- Role-based access: `user` (own data), `admin` (catalog CRUD), `system` (service-to-service).
- Row-level scoping: every query filters by `userId` from token; no client-supplied userId trusted.

### 6.2 Caching Strategy
- **Plan catalog:** cached 1h in Redis; invalidated on admin edit.
- **Dashboard widgets:** cached 60s per user; invalidated on `workout.completed`.
- **Exercise library:** cached 6h (static-ish).
- **HTTP caching:** CDN edge cache for media; `Cache-Control: public, max-age=31536000, immutable` for versioned asset URLs.

### 6.3 Reliability & Resilience
- Idempotency keys on set-log requests to prevent duplicate writes on retry.
- Retry with exponential backoff + jitter on transient failures.
- Circuit breaker on downstream object-storage calls (media failures degrade gracefully — show poster image).
- Graceful degradation: if Progress service is down, workout can still be logged; PR calc backfills on recovery.

### 6.4 Observability
- Structured JSON logs (pino) with request id, userId, latency.
- Metrics: Prometheus (RED metrics per endpoint) → Grafana.
- Distributed tracing: OpenTelemetry SDK across client → BFF → services → DB.
- Error tracking: Sentry (frontend + backend).
- Synthetic checks on dashboard + player load.

### 6.5 Security
- OWASP Top 10 hardening: input validation (zod), parameterized queries (Prisma/Drizzle), CSRF protection on cookie-auth mutations, strict CSP, subresource integrity.
- Rate limiting: auth endpoints stricter (5/min); workout logging 60/min.
- Secrets in a managed secrets manager (AWS Secrets Manager / Doppler); never in repo.
- PII encryption at rest for email; full DB encryption at rest (cloud-managed).

---

## 7. Deployment & Environments

| Environment | Purpose | Data |
|---|---|---|
| local | Dev | Docker compose (Postgres + Redis + MinIO) |
| dev | Integration | Shared cloud dev DB; seeded sample plans |
| staging | Pre-prod | Production-like, smoke tests |
| prod | Live | Multi-AZ, automated backups |

- **CI/CD:** GitHub Actions → build, test, typecheck → container build → push to registry → deploy.
- **Infra:** Container orchestration (Fly.io / AWS ECS / Kubernetes) behind a CDN.
- **DB migrations:** Versioned, reviewed, run via CI on deploy; forward-only with expand-then-contract.
- **Backups:** Postgres PITR + daily snapshots; object storage versioning.

---

## 8. Scalability Plan

- Stateless services scale horizontally behind LB; autoscale on CPU + request latency.
- Read replicas for dashboard/progress queries; writes hit primary.
- Connection pooling (PgBouncer / Supabase connection pooler).
- Redis cluster for cache + queue at scale.
- Media served exclusively via CDN; origin shield for object storage.
- Target: 10k concurrent users, p95 < 300ms API, < 2s FCP.

---

## 9. Failure Scenarios & Mitigations

| Scenario | Mitigation |
|---|---|
| User loses connection mid-workout | Logs queued in IndexedDB; sync worker retries with idempotency keys |
| Progress service down | Workout service still accepts logs; events buffered in Redis Streams; Progress backfills on recovery |
| DB primary failure | Failover to replica; app enters read-mostly mode; logging queued |
| Media CDN outage | Fallback poster image + retry; workout continues without video |
| Token refresh fails | Client redirects to login; in-flight workout data preserved locally |
| Redis unavailable | Cache miss → direct DB; rate limits degrade to per-instance local limits |

---

## 9. Future Evolution

- **Phase 2:** extract Progress service to dedicated realtime analytics; add wearable sync ingestion service; add admin CMS (headless CMS or custom).
- **Phase 3:** AI plan generation service (LLM + retrieval over exercise library); nutrition microservice; native apps sharing the same BFF.
- **Long-term:** event sourcing for workout sessions (full audit trail); dedicated time-series DB if Postgres/Timescale saturates.
