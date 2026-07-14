# Backend Document
## KraftPlan — AI-Powered Gym Workout Planner & Tracker

> **Status:** Draft v1.0
> **Last Updated:** 2026-07-13

---

## 1. Overview

The backend is a set of **Node.js (TypeScript)** services exposing a **REST** API (with an optional tRPC/GraphQL layer later). It uses **PostgreSQL** as the primary datastore (with **TimescaleDB** hypertables for metrics), **Redis** for cache/queue/events, and **object storage** for media. The API is stateless, horizontally scalable, and secured with JWT.

---

## 2. Tech Stack (Backend)

| Concern | Choice | Why |
|---|---|---|
| Runtime | Node.js 20+ (TypeScript) | Shared language with frontend, fast I/O |
| HTTP framework | Fastify | Fast, schema-based validation, plugins |
| ORM | Drizzle ORM | Type-safe SQL, lightweight, good migrations |
| Validation | Zod | Shared schemas with frontend (`packages/shared`) |
| DB | PostgreSQL 16 + TimescaleDB | Relational + time-series in one engine |
| Cache/queue | Redis 7 | Cache, rate limit, Streams, pub/sub |
| Auth | Auth.js server adapters / jose | JWT issue + verify; OAuth |
| Password | argon2 | Modern hashing |
| Storage SDK | AWS S3 SDK (R2-compatible) | Media uploads/signed URLs |
| Testing | Vitest + Testcontainers | Unit + integration with real PG/Redis |
| Observability | pino, OpenTelemetry, Sentry | Logs, traces, errors |

---

## 3. Service Boundaries

```
packages/shared/         # zod schemas, types, constants (shared with web)
services/
├── auth/                # register, login, refresh, OAuth, profile
├── plans/               # plan catalog, assignment, day resolution
├── workouts/            # session lifecycle + set logging
├── progress/            # PR computation, aggregates, dashboard reads
└── library/             # exercise search + media URL signing
```

Each service owns its DB tables (no cross-service direct table access); cross-service reads happen via internal HTTP or the BFF fan-out.

---

## 4. API Surface (REST)

Base URL: `https://api.kraftplan.app/v1`

### 4.1 Auth
| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | email + password → user |
| POST | `/auth/login` | credentials → access + refresh |
| POST | `/auth/refresh` | cookie refresh → new access |
| POST | `/auth/logout` | revoke refresh |
| GET | `/auth/me` | current user profile |
| PATCH | `/auth/me` | update profile (units, level, bodyweight) |

### 4.2 Onboarding & Plans
| Method | Path | Purpose |
|---|---|---|
| POST | `/onboarding` | submit goal/level/equipment/schedule → plan recs |
| GET | `/plans` | catalog (filters: category, weeks, days, equipment, difficulty) |
| GET | `/plans/:id` | plan detail with weeks/days/blocks |
| POST | `/users/me/plan` | assign active plan |
| GET | `/plans/today` | resolve today's session for user |
| GET | `/users/me/plan/progress` | current week, % complete |

### 4.3 Workouts
| Method | Path | Purpose |
|---|---|---|
| POST | `/workouts` | start session `{ planDayId, date }` → sessionId |
| GET | `/workouts/:sessionId` | session state + sets |
| POST | `/workouts/:sessionId/sets` | log/update a set (idempotent) |
| POST | `/workouts/:sessionId/complete` | finish session → summary |
| POST | `/workouts/:sessionId/swap` | swap an exercise mid-session |

### 4.4 Progress
| Method | Path | Purpose |
|---|---|---|
| GET | `/progress/prs` | current PRs (optional `?exerciseId=`) |
| GET | `/progress/prs/:exerciseId/history` | PR/e1RM trend |
| GET | `/progress/volume` | volume over time (`?range=30d\|90d\|1y`) |
| GET | `/progress/adherence` | session calendar + weekly counts |
| GET | `/progress/endurance` | pace/distance trends |
| GET | `/dashboard` | aggregated dashboard payload (BFF fan-out) |

### 4.5 Library
| Method | Path | Purpose |
|---|---|---|
| GET | `/exercises` | search/filter |
| GET | `/exercises/:id` | detail + alternatives |
| GET | `/exercises/:id/media-url` | signed tutorial URL (short TTL) |

---

## 5. Database Schema

Managed by Drizzle migrations. Core tables:

### users
```sql
id            uuid pk
email         text unique not null
password_hash text null          -- null if OAuth-only
name          text
avatar_url    text
units         text default 'metric'   -- metric | imperial
experience    text default 'beginner' -- beginner | intermediate | advanced
bodyweight_kg numeric null
role          text default 'user'     -- user | admin
created_at    timestamptz default now()
```

### plans
```sql
id            uuid pk
category      text not null          -- mobility | strength | hypertrophy | powerlifting | hyrox | endurance | athletic | conditioning | weightloss
title         text not null
description   text
duration_weeks int not null
days_per_week int not null
difficulty    text not null          -- beginner | intermediate | advanced
equipment     text[] not null default '{}'
cover_image   text
created_at    timestamptz default now()
```

### plan_weeks / plan_days / plan_blocks
```sql
plan_weeks  (id, plan_id, week_number)
plan_days   (id, week_id, day_number, title, is_rest_day)
plan_blocks (id, day_id, block_type, sort_order)
  -- block_type: warmup | main | accessory | finisher | cooldown
```

### block_exercises
```sql
id              uuid pk
block_id        uuid fk
exercise_id     uuid fk
sort_order      int
sets            int
reps_scheme     text       -- "5", "8-12", "AMRAP", "40s"
load_scheme     text       -- percentage | rpe | fixed | bodyweight
target_load     text       -- "80% 1RM", "RPE 8", "60kg"
rest_sec        int
tempo           text       -- "3010"
notes           text
```

### exercises
```sql
id              uuid pk
name            text not null
category        text        -- resistance | time | bodyweight | plyo | mobility
primary_muscles text[]
secondary_muscles text[]
equipment       text[]
difficulty      text
tutorial_url    text        -- object storage key
instructions    jsonb       -- ordered steps
cues            text[]
mistakes        text[]
search_vector   tsvector    -- generated from name + muscles
```
Full-text index on `search_vector`; trigram index on `name` for fuzzy search.

### user_plan_assignments
```sql
id          uuid pk
user_id     uuid fk
plan_id     uuid fk
start_date  date not null
current_week int default 1
status      text default 'active'   -- active | completed | abandoned
created_at  timestamptz default now()
unique (user_id) where status = 'active'   -- one active plan per user
```

### workout_sessions
```sql
id            uuid pk
user_id       uuid fk
plan_day_id   uuid fk
status        text default 'active'  -- active | completed | abandoned
started_at    timestamptz not null
ended_at      timestamptz
total_volume_kg numeric
notes         text
created_at    timestamptz default now()
```

### workout_sets (TimescaleDB hypertable, partitioned by time)
```sql
session_id     uuid fk
exercise_id    uuid fk
set_index      int
weight_kg      numeric null
reps           int null
time_sec       numeric null
distance_m     numeric null
rpe            numeric null
status         text default 'completed'  -- completed | failed | skipped
idempotency_key uuid not null
logged_at      timestamptz default now()
PRIMARY KEY (session_id, exercise_id, set_index)
-- hypertable on logged_at
```
Unique on `(session_id, exercise_id, set_index, idempotency_key)` for idempotency.

### personal_records (derived, Progress service-owned)
```sql
id            uuid pk
user_id       uuid fk
exercise_id   uuid fk
metric        text       -- e1rm | max_weight | best_pace | longest_distance
value         numeric
achieved_at   timestamptz
set_id        uuid       -- backref to source set
unique (user_id, exercise_id, metric)
```

### weekly_volume_mv (materialized view)
Aggregates total volume per user per week; refreshed on `workout.completed`.

---

## 6. Domain Logic

### 6.1 Day resolution
Given user + date:
1. Load active `user_plan_assignments`.
2. `daysSinceStart = date - start_date`.
3. Map to plan day via the plan's schedule (e.g., 4 days/week pattern). Rest days return `is_rest_day = true`.

### 6.2 Set logging & validation
- Validate units consistency (convert lb→kg at boundary if profile is imperial).
- Validate reps/weight within sane bounds (reject negatives, caps at e.g. 1000kg).
- Idempotency: unique constraint on `(session_id, exercise_id, set_index, idempotency_key)`; upsert on conflict.
- On insert, compute `prCandidate` by comparing to current `personal_records`.

### 6.3 PR computation (Progress service)
On `workout.completed`:
- For each exercise in the session, query `workout_sets` for best-ever performance:
  - Resistance: `e1rm = weight * (1 + reps/30)` (Epley); track max `e1rm` and max `weight×reps`.
  - Endurance: best pace (min/mi) and longest distance.
- Compare to existing PR row; if beaten, update + emit `pr.broken` event.
- PR table is a derived cache; a rebuild job can recompute from `workout_sets` source-of-truth.

### 6.4 Estimated 1RM
Epley formula: `e1rm = w * (1 + r/30)`. Used for trend charts when no true 1RM set exists.

---

## 7. Caching

| Key | TTL | Invalidation |
|---|---|---|
| `plan:{planId}` | 1h | admin edit |
| `plans:catalog:{hash}` | 1h | admin edit |
| `exercises:search:{hash}` | 6h | library edit |
| `dashboard:{userId}` | 60s | `workout.completed` event |
| `progress:prs:{userId}` | 60s | `pr.broken` event |

Cache invalidation via Redis pub/sub `cache.invalidate` channel; all instances subscribe.

---

## 8. Events (Redis Streams)

| Stream | Producer | Consumer | On failure |
|---|---|---|---|
| `workout.completed` | Workout Svc | Progress Svc | Dead-letter after 5 retries; alert |
| `pr.broken` | Progress Svc | (future) Notification | best-effort |

Outbox pattern: event row written in the same DB transaction as the state change; a background publisher drains the outbox table and publishes to the stream. Guarantees at-least-once delivery.

---

## 9. Security

- **AuthN:** JWT (RS256) verified via JWKS; access token 15m, refresh 30d in httpOnly cookie.
- **AuthZ:** every query scoped by `userId` from token; admin role required for catalog CRUD.
- **Input validation:** Zod at every route boundary; reject unknown fields.
- **SQL injection:** Drizzle parameterized queries only; no raw string concatenation.
- **Rate limiting:** Redis token bucket — auth 5/min, workouts 60/min, general 300/min per user.
- **Secrets:** Doppler/AWS Secrets Manager; rotated; never committed.
- **Headers:** Helmet-style strict CSP, HSTS, `X-Content-Type-Options`, referrer-policy.
- **PII:** email encrypted at rest (pgcrypto); DB encrypted at rest (cloud-managed); logs scrubbed of PII.
- **Audit:** admin mutations logged to an audit table.

---

## 10. Observability

- **Logs:** pino JSON logs with `traceId`, `userId`, `latencyMs`, `route`. Shipped to Loki/CloudWatch.
- **Metrics:** Prometheus RED (Rate, Errors, Duration) per route; business metrics (`sets_logged_total`, `prs_broken_total`, `workout_completed_lag_seconds`).
- **Tracing:** OpenTelemetry auto-instrumentation across HTTP → DB → Redis; traces to Tempo/Jaeger.
- **Errors:** Sentry with release tagging; source maps uploaded on deploy.
- **Healthchecks:** `/health` (liveness) and `/ready` (DB + Redis connectivity) for orchestrator.

---

## 11. Testing

- **Unit:** Vitest — domain logic (day resolution, PR calc, e1rm, unit conversion).
- **Integration:** Testcontainers spinning real Postgres + Redis; test full set-log → PR flow.
- **Contract:** Pact or schemathesis against OpenAPI for service-to-service calls.
- **Load:** k6 script simulating 1k concurrent set-logs; assert p95 < 300ms.
- **Coverage gate:** 80% lines on `services/`.

---

## 12. Migrations

- Drizzle migration files in `services/*/drizzle/`; forward-only.
- CI runs `drizzle-kit migrate` against a throwaway DB to validate.
- Expand-then-contract: additive changes first, deploy, then cleanup in a follow-up migration.

---

## 13. Deployment

- Dockerized services; deploy to Fly.io / AWS ECS / Kubernetes.
- DB: managed Postgres (Supabase / RDS) with TimescaleDB extension; read replicas for progress reads.
- Redis: managed (Upstash / ElastiCache).
- CDN in front of object storage for media.
- CI: GitHub Actions — lint, typecheck, test, build image, push, deploy to staging; manual promote to prod.
- Backups: Postgres PITR + daily snapshots; restore drills quarterly.

---

## 14. Environment Variables (server)

```
DATABASE_URL=postgres://...
REDIS_URL=redis://...
JWT_PRIVATE_KEY=...
JWT_PUBLIC_KEY_JWKS_URL=...
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
S3_ENDPOINT=...
S3_BUCKET=kraftplan-media
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
SENTRY_DSN=...
OTEL_EXPORTER_OTLP_ENDPOINT=...
```

---

## 15. Backend Acceptance Criteria

- [ ] Set-log endpoint is idempotent (duplicate idempotency key → same result, no dupes).
- [ ] `workout.completed` → PR recomputed within 30s (p95).
- [ ] Dashboard endpoint p95 < 300ms under 1k concurrent users.
- [ ] Offline-queued logs sync with zero duplicates.
- [ ] Admin cannot access another user's data (row-level scoping verified by tests).
- [ ] All endpoints reject invalid input with 400 + zod error details.
