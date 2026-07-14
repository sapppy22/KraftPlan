# ForgeFit — AI-Powered Gym Workout Planner & Tracker

ForgeFit is a full-stack web application for discovering, customizing, and executing structured gym workout plans across multiple training disciplines. It provides an interactive workout player with set-by-set logging, rest timers, tutorial content, and a progress dashboard that tracks personal records and trends.

**Front-end reference:** [fitonist-app.webflow.io](https://fitonist-app.webflow.io/)

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Client (Next.js)                          │
│  React Server Components + Client Components                      │
│  Workout Player · Dashboard · Plans · Library · Progress          │
└─────────────┬─────────────────────────────────┬──────────────────┘
              │ HTTPS (REST)                     │
              ▼                                  ▼
┌────────────────────────────┐     ┌──────────────────────────────┐
│    Next.js BFF (Route      │     │    Fastify Services (5)       │
│    Handlers + Server       │────▶│  auth | plans | workouts      │
│    Actions)                │     │  progress | library           │
└────────────────────────────┘     └──────────┬───────────────────┘
                                               │
                    ┌──────────────────────────┴──────────────┐
                    ▼                                         ▼
        ┌────────────────────┐                  ┌────────────────────┐
        │   PostgreSQL (Neon) │                  │       Redis        │
        │   + TimescaleDB     │                  │  cache + streams   │
        │   (optionally)      │                  │                    │
        └────────────────────┘                  └────────────────────┘
```

### Frontend
- **Next.js 14 (App Router)** — Server Components for fast loads, Client Components for interactive workout player
- **Tailwind CSS** — Dark-mode-first design tokens inspired by Fitonist
- **TanStack Query** — Server state with optimistic updates for set logging
- **Zustand** — Client state for the workout player (persisted to IndexedDB)
- **Recharts** — Progress charts (volume, adherence, PR trends)
- **Radix UI** — Accessible primitives (Dialog, Tabs, Progress)

### Backend Services
| Service | Port | Responsibility |
|---|---|---|
| **Auth** | 4001 | Register, login (argon2 + JWT), profile management |
| **Plans** | 4002 | Plan catalog, assignment, day-resolution for sessions |
| **Workouts** | 4003 | Session lifecycle, idempotent set logging |
| **Progress** | 4004 | PR computation, volume/adherence aggregates, dashboard |
| **Library** | 4005 | Exercise search (full-text + filter), media URLs |

### Database
- **PostgreSQL 16** via Neon (serverless)
- **Drizzle ORM** — Type-safe SQL with migrations
- Tables: `users`, `plans`, `plan_weeks`, `plan_days`, `plan_blocks`, `block_exercises`, `exercises`, `exercise_alternatives`, `user_plan_assignments`, `workout_sessions`, `workout_sets`, `personal_records`, `event_outbox`
- `workout_sets` uses idempotency keys to prevent duplicate logs on retry

### Cache & Events
- **Redis** — Plan catalog cache, rate limiting, pub/sub for cache invalidation, Streams for `workout.completed` events
- Outbox pattern: events written in same DB transaction as state change, then published to Redis Streams

---

## Setup & Running

### Prerequisites
- Node.js >= 20
- pnpm 9+ (`npm install -g pnpm@9`)
- Docker Desktop (for local Postgres + Redis + MinIO)

### Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start infrastructure (Postgres, Redis, MinIO)
docker compose -f docker/docker-compose.yml up -d

# 3. Push schema to database
pnpm --filter @forgefit/db push

# 4. Seed with 300+ exercises and 9 plans
pnpm --filter @forgefit/db seed

# 5. Start all services and frontend
pnpm dev
```

### Using a remote database (Neon / Supabase)
Set your connection string in `packages/db/.env`:
```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

Then run steps 3-5 above. Docker is only needed for Redis — the app degrades gracefully without it.

---

## Project Structure

```
D:\Gym ai project\
├── apps/web/                    # Next.js frontend
│   ├── src/app/
│   │   ├── (auth)/login, register    # Auth pages
│   │   ├── onboarding/               # 5-step wizard
│   │   └── (app)/
│   │       ├── dashboard/            # Today's session, stats, PRs
│   │       ├── plans/                # Catalog + detail with weeks
│   │       ├── workout/[sessionId]/  # Interactive workout player
│   │       ├── progress/             # PRs, volume, adherence charts
│   │       ├── library/              # Exercise search + filter
│   │       └── settings/
│   ├── components/ui/           # Button, Card (design-token based)
│   ├── components/player/       # RestTimer, SetLogger
│   ├── stores/playerStore.ts    # Zustand workout player state
│   └── lib/api/client.ts        # Typed API client
├── packages/
│   ├── shared/src/              # Zod schemas, constants, formulas
│   │   ├── schemas/             # user, plan, exercise, workout, progress
│   │   └── constants.ts         # Epley 1RM, unit conversion
│   └── db/src/
│       ├── schema/index.ts      # 14 Drizzle table definitions
│       └── seed.ts              # 300+ exercises, 9 plans seeding
├── services/
│   ├── auth/                    # Fastify — JWT, argon2
│   ├── plans/                   # Catalog, assignments, day resolution
│   ├── workouts/                # Session lifecycle, set logging
│   ├── progress/                # PR computation, dashboard aggregation
│   └── library/                 # Full-text search, exercise detail
├── docker/                      # Docker Compose + Dockerfiles
├── docs/                        # PRD, Design, Architecture docs
└── scripts/
```

---

## Key Features

### 9 Training Modalities
Mobility, Strength, Hypertrophy, Powerlifting, Hyrox, Endurance, Athletic Performance, Conditioning, Weight Loss

### Interactive Workout Player
- Sequential exercise-by-exercise UI with set logging
- Per-set inputs: weight (kg/lb), reps, RPE, time, distance
- SVG countdown rest timer with skip/+15s
- PR detection with celebration
- Offline-tolerant (IndexedDB queue, idempotent sync)

### Progress Dashboard
- Today's session card with one-tap start
- Streak tracking, weekly adherence, 30-day volume
- Program progress (week X of Y with % bar)
- PR highlights with delta from previous
- Volume over time chart
- Session calendar heatmap

### Exercise Library
- 81 curated exercises, 300+ planned
- Full-text search by name and muscle
- Filters by category, muscle, equipment, difficulty
- Detail view with instructions, coaching cues, common mistakes
- Exercise alternatives system

---

## Tech Stack

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + design tokens |
| State | TanStack Query + Zustand |
| Charts | Recharts |
| Backend | Fastify + TypeScript |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 (Neon) |
| Cache | Redis 7 |
| Auth | JWT (jose) + argon2 |
| Infrastructure | Docker Compose |
| CI/CD | GitHub Actions |

---

## Design

Dark-mode-first UI inspired by the Fitonist reference. Design tokens control all colors, typography, and spacing — consistent across light/dark themes.

**Colors:** Dark base (`#0B0E14`), surface (`#141925`), with electric blue (`#3D8BFF`) → violet (`#8E6FFF`) gradient accents.
**Typography:** Inter (UI) + Space Grotesk (display headings).
**Patterns:** Mobile-first with bottom nav, desktop left sidebar, card-based layouts.

---

## License

MIT
