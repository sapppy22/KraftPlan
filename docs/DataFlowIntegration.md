# Data Flow & Integration Document
## KraftPlan — AI-Powered Gym Workout Planner & Tracker

> **Status:** Draft v1.0
> **Last Updated:** 2026-07-13

---

## 1. Purpose

This document describes how data moves through KraftPlan: between client and services, between services internally, with external integrations, and into/out of the datastores. It complements the System Architecture doc (which covers *what* the components are) by focusing on *how data flows and integrates*.

---

## 2. Data Flow Domains

1. **Auth flow** — registration, login, token refresh.
2. **Onboarding & plan selection flow** — user picks goal → plan assigned.
3. **Plan delivery flow** — fetching today's session / week structure.
4. **Workout execution flow** — starting a session, logging sets, completing.
5. **Progress computation flow** — PR recalculation and dashboard aggregation.
6. **Exercise library flow** — search, retrieve tutorial media.
7. **Offline sync flow** — queued logs → reconciliation.
8. **Admin authoring flow** — plan/exercise CRUD (future).
9. **External integrations** — OAuth provider, media CDN, (future) wearables.

---

## 3. Authentication Flow

```
Client ──(1) credentials/OAuth──▶ Auth Service
                                  │
                                  ├─ verify password (argon2) / exchange OAuth code
                                  ├─ issue access JWT (15m) + refresh token (30d)
                                  │
Client ◀──(2) access JWT (body) + refresh (httpOnly cookie)── Auth Service
                                  │
Client ──(3) JWT in Authorization header──▶ API Gateway → Services
                                  │
                                  └─ services verify JWT signature (JWKS), extract userId, scope query
                                  │
(4) On 401: client calls /auth/refresh with cookie → new access JWT (rotated refresh)
```

**Tokens:**
- Access token: HS256/RS256 JWT, `sub=userId`, `role`, exp 15m. Kept in memory (not localStorage).
- Refresh token: opaque random token stored server-side in Redis (hashed); cookie is httpOnly, Secure, SameSite=Strict.

**Data persisted:** `users` row on register; `refresh_tokens` keyed by userId in Redis with TTL.

---

## 4. Onboarding → Plan Selection Flow

```
1. Client POST /onboarding { goal, level, equipment[], daysPerWeek, sessionLength }
2. Plan Service → query matching plans (filters) → returns ranked list
3. Client previews plan structure: GET /plans/:id → weeks/days/blocks tree
4. Client POST /user/plan-assignment { planId, startDate }
5. Plan Service:
   - upsert UserPlanAssignment { userId, planId, startDate, currentWeek=1, status=active }
   - invalidate dashboard cache for user
6. Client navigates to Dashboard → GET /dashboard/today resolves scheduled day
```

**Data written:** `user_plan_assignments`. **Cache invalidated:** `dashboard:{userId}`.

---

## 5. Plan Delivery Flow (Today's Session)

```
Client GET /plans/today?date=YYYY-MM-DD
  │
  ▼
Plan Service
  ├─ read UserPlanAssignment (active plan, currentWeek)
  ├─ compute dayIndex = daysSinceStart mapping to plan day
  ├─ load PlanWeek → PlanDay → Blocks → Exercises
  ├─ hydrate each Exercise with tutorialUrl (signed CDN URL)
  └─ return SessionManifest { dayId, title, blocks[], exercises[] }
```

**Caching:** `plan:{planId}` cached in Redis (catalog static); per-user day resolution computed live but cheap.

**SessionManifest shape (example):**
```json
{
  "dayId": "d_1203",
  "title": "Push A — Bench Focus",
  "estimatedMinutes": 65,
  "blocks": [
    {
      "id": "b_warmup",
      "type": "warmup",
      "exercises": [
        { "id": "ex_1", "name": "Shoulder circles", "sets": 2, "reps": "15", "restSec": 30,
          "tutorialUrl": "https://cdn.../shoulder-circles.mp4",
          "cues": ["Slow controlled circles", "Full range"] }
      ]
    },
    {
      "id": "b_main",
      "type": "main",
      "exercises": [
        { "id": "ex_22", "name": "Barbell bench press", "sets": 5, "reps": "5",
          "loadScheme": "percentage", "targetLoad": "80% 1RM", "restSec": 180,
          "tutorialUrl": "...", "cues": [...] }
      ]
    }
  ]
}
```

---

## 6. Workout Execution Flow

### 6.1 Start session
```
Client POST /workouts { planDayId, date }
  │
  ▼
Workout Service
  ├─ create WorkoutSession { id, userId, planDayId, status=active, startedAt=now }
  ├─ seed set templates from SessionManifest (prescribed sets per exercise)
  └─ return sessionId
Client enters player; starts elapsed timer
```

### 6.2 Log a set (the core interactive loop)
```
For each set:
  Client collects inputs → weight, reps, time, distance, rpe, completed
  POST /workouts/:sessionId/sets { exerciseId, setIndex, weight, reps, time, distance, rpe }
    │ (idempotency-Key header)
    ▼
  Workout Service
    ├─ validate against prescribed scheme + units
    ├─ upsert WorkoutSet (idempotent by idempotencyKey)
    ├─ return { saved, prCandidate: bool, previousPr }
    │
    ▼
  Client
    ├─ optimistically marks set complete
    ├─ if prCandidate → show PRBadge, queue PR confirmation on session finish
    └─ start RestTimer (restSec from exercise)
```

### 6.3 Complete session
```
Client POST /workouts/:sessionId/complete { totalElapsedSec, notes }
  │
  ▼
Workout Service
  ├─ set status=completed, endedAt=now
  ├─ compute session aggregates (totalVolume, setsCompleted, prsHit[])
  ├─ PUBLISH event workout.completed { userId, sessionId, exerciseIds[] }
  │     │
  │     ▼ (Redis Stream)
  │   Progress Service consumes:
  │     ├─ for each exerciseId → recompute PR (max weight×reps / best pace / longest distance)
  │     ├─ upsert PersonalRecord if beaten
  │     ├─ update weekly volume + adherence aggregates
  │     └─ invalidate dashboard:{userId} cache
  └─ return SessionSummary { totalVolume, setsCompleted, prs[], durationSec }
```

### 6.4 End-to-end sequence (one set + completion)
```
Client                API GW            Workout Svc        Progress Svc        Redis
  │── POST /workouts ─▶│                    │                   │                 │
  │◀─ sessionId ───────│◀──────────────────│                   │                 │
  │── POST /sets ─────▶│──▶ upsert set ───▶│                   │                 │
  │◀─ {prCandidate} ───│◀──────────────────│                   │                 │
  │  (rest timer runs) │                    │                   │                 │
  │── POST /complete ─▶│──▶ mark done ────▶│── PUBLISH event ───────────────────▶│
  │◀─ summary ─────────│◀──────────────────│                   │◀─ consume ──────│
  │                    │                    │                   │── recompute PRs│
  │                    │                    │                   │── invalidate   │
  │── GET /dashboard ─▶│ (fresh, cache miss)│                   │                 │
  │◀─ updated PRs ─────│                    │                   │                 │
```

---

## 7. Progress & Dashboard Read Flow

```
Client GET /dashboard
  │
  ▼
BFF (Next.js Route Handler)
  ├─ check Redis cache dashboard:{userId}
  │    hit? → return
  │    miss → fan-out:
  │       ├─ Progress Svc: GET /progress/prs?top=5
  │       ├─ Progress Svc: GET /progress/volume?range=30d
  │       ├─ Progress Svc: GET /progress/adherence?range=1y
  │       └─ Plan Svc: GET /plans/today
  ├─ assemble DashboardPayload
  ├─ cache 60s
  └─ return
```

**Read model sources:**
- `personal_records` table (current PRs) — Progress Svc owned.
- `weekly_volume_mv` materialized view (refreshed on `workout.completed`).
- `session_adherence_mv` (calendar aggregates).
- TimescaleDB hypertable `set_metrics` for chart queries (e.g., 1RM trend = `SELECT time_bucket('1 week', ts) ...`).

---

## 8. Exercise Library Flow

```
Client GET /exercises?q=bench&muscle=chest&equipment=barbell
  │
  ▼
Library Service
  ├─ Redis cache check (keyed by query hash, TTL 6h)
  ├─ Postgres full-text search (tsvector on name+muscles) + trigram fuzzy
  └─ return ExerciseSummary[] { id, name, thumbUrl, primaryMuscle }

Client GET /exercises/:id
  ├─ full detail: instructions[], cues[], mistakes[], alternatives[], tutorialUrl (signed)
  └─ tutorialUrl = object storage path signed with CDN token (short-lived)
```

**Media integration:** videos live in S3/R2; Library Service mints a signed URL or relies on CDN token auth; client plays via `VideoPlayer`.

---

## 9. Offline Sync Flow

```
During workout (offline):
  Client logs set → save to IndexedDB (outbox) → optimistic UI
  
When connectivity restored:
  Sync Worker drains outbox:
    for each queued op (POST /sets, POST /complete):
      ├─ retry with exponential backoff + jitter
      ├─ use Idempotency-Key from client UUID (prevents dupes)
      └─ on 200: remove from outbox; on 4xx: mark dead-letter for review

Conflict handling:
  - Sets are idempotent → no real conflict; last-writer-wins per (sessionId, exerciseId, setIndex)
  - If session already completed server-side, 409 → client reconciles by refetching session
```

**Data on client:** outbox table in IndexedDB; active session snapshot for resume-after-refresh.

---

## 10. External Integrations

| Integration | Direction | Protocol | Purpose |
|---|---|---|---|
| Google OAuth | Outbound | OAuth 2.0 PKCE | Login |
| Object Storage (S3/R2) | Outbound | S3 API over HTTPS | Store/serve tutorial media |
| CDN (CloudFront/Cloudflare) | Inbound | HTTP | Deliver media + static assets |
| Email (SES/Postmark) | Outbound | SMTP/API | Welcome, password reset |
| (Phase 2) Apple Health / Google Fit | Inbound | REST/aggregate | Sync workouts from wearables |
| (Phase 3) LLM provider | Outbound | REST | AI plan generation |

**Integration pattern:** all external calls go through a dedicated adapter module with retry, timeout (5s default), circuit breaker, and structured logging. No external call is on the synchronous request path of the workout player except OAuth login.

---

## 11. Event Catalog (Internal)

| Event | Producer | Consumer(s) | Payload |
|---|---|---|---|
| `workout.completed` | Workout Svc | Progress Svc | `{ userId, sessionId, exerciseIds[], endedAt }` |
| `plan.assigned` | Plan Svc | (future) Notification | `{ userId, planId }` |
| `pr.broken` | Progress Svc | (future) Notification | `{ userId, exerciseId, metric, prev, next }` |
| `cache.invalidate` | any Svc | all instances (pub/sub) | `{ key }` |

Transport: Redis Streams for durable events; Redis pub/sub for ephemeral cache invalidation.

---

## 12. Data Contracts (Key API shapes)

### Set log request
```json
POST /workouts/:sessionId/sets
Headers: Idempotency-Key: <uuid>
{
  "exerciseId": "ex_22",
  "setIndex": 1,
  "weight": 100,       // kg, optional
  "reps": 5,           // optional
  "timeSec": null,     // for time-based
  "distanceM": null,   // for endurance
  "rpe": 8,
  "status": "completed" // completed | failed | skipped
}
→ 200 { "saved": true, "prCandidate": true, "previousPr": { "weight": 95, "reps": 5, "date": "2026-06-30" } }
```

### Dashboard payload
```json
{
  "today": { "dayId": "d_1203", "title": "Push A", "estimatedMinutes": 65, "isRestDay": false },
  "streak": 5,
  "thisWeek": { "completed": 3, "scheduled": 4 },
  "volume30d": 12400,
  "programProgress": { "currentWeek": 3, "totalWeeks": 8, "percent": 37.5 },
  "prs": [
    { "exerciseId": "ex_22", "name": "Bench Press", "metric": "e1rm", "value": 115, "deltaPct": 4.5, "achievedAt": "2026-07-11" }
  ],
  "recentSessions": [ { "id":"s_9", "title":"Pull B", "date":"2026-07-11", "durationSec": 3120 } ]
}
```

---

## 13. Consistency & Transaction Boundaries

- **Workout set log:** single Postgres transaction (insert set + update session aggregates). Idempotent via unique `(sessionId, exerciseId, setIndex, idempotencyKey)`.
- **Session completion:** transaction marks session done + inserts event into Redis Stream (outbox pattern: write event row in same DB tx, separate publisher drains and publishes — avoids lost events on crash).
- **PR update:** Progress Svc recomputes from `set_metrics` (source of truth) — PR table is a derived cache; safe to rebuild.
- **Read-after-write:** dashboard cache invalidated on `workout.completed`; client refetches fresh.

---

## 14. Error Handling Conventions

| HTTP | Meaning | Client action |
|---|---|---|
| 400 | Validation error | Show field error, keep data |
| 401 | Token expired | Call /auth/refresh, retry once |
| 409 | Conflict (e.g., session already complete) | Refetch session state |
| 409 | Duplicate idempotency key with different body | Surface "already logged" |
| 422 | Unprocessable (bad units / out of range) | Show inline error |
| 429 | Rate limited | Exponential backoff, then toast |
| 5xx | Server error | Retry set log via outbox; toast on session finish |

---

## 15. Observability of Data Flows

- Every request carries `traceId` (W3C traceparent) propagated client → BFF → service → DB.
- Workout logs emit a `set.logged` metric with tags (exerciseId, status) for funnel analysis.
- `workout.completed` events counted in dashboards; lag between event publish and PR recompute monitored (alert if > 30s).
- PII-free structured logs only; userId is a hash in analytics pipelines.
