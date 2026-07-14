# KraftPlan — AI-Powered Gym Workout Planner & Tracker

Kraftplan is a full-stack web application for discovering, customizing, and executing structured gym workout plans across multiple training disciplines. It provides an interactive workout player with set-by-set logging, rest timers, tutorial content, and a progress dashboard that tracks personal records and trends.

**Front-end reference:** [fitonist-app.webflow.io](https://fitonist-app.webflow.io/) — dark, energetic, mobile-first fitness UI.

**Brand & design system:** deep-charcoal UI with the KraftPlan gradient sampled from the logo — red `#EF4423` → orange `#F97316` → amber `#FBBF24`. Dark-mode-first, WCAG AA, one consistent palette across every page (design tokens in `apps/web/src/styles/tokens.css`).

---

## 🚀 Live site & deployment

KraftPlan runs on a **100% free, no-credit-card** stack:

| Layer | Host | URL |
|---|---|---|
| Web app | **Cloudflare Pages** | `https://kraftplan.pages.dev` _(set after first deploy)_ |
| Unified API | **Render** (free) | `https://kraftplan-api.onrender.com` |
| Database | **Neon** (serverless Postgres) | provisioned & seeded ✅ |

The 5 backend services are combined into a **single deployable** (`apps/api`) so the whole
backend runs in one free process. **Step-by-step guide → [DEPLOYMENT.md](./DEPLOYMENT.md)**
(includes Neon setup, Cloudflare Pages, Render, CI/CD, uptime/keep-alive, and scaling notes).

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
- A Postgres database — a free **[Neon](https://neon.tech)** project is recommended (no Docker needed)

### Quick Start (with Neon — no Docker)

```bash
# 1. Install dependencies
pnpm install

# 2. Configure env — put your Neon connection strings + a JWT secret in .env
cp .env.example .env    # then edit DATABASE_URL / DATABASE_URL_UNPOOLED / JWT_SECRET

# 3. Push schema and seed (81 exercises, 9 plans)
pnpm db:push
pnpm db:seed

# 4. Run the unified API (:4001) and the web app (:3000)
pnpm dev:api     # in one terminal
pnpm dev:web     # in another
```

Open http://localhost:3000. Redis is **not required** — it is unused at runtime and the
app runs fully on Postgres alone.

### Unified API

All backend routes are combined into a single deployable, **`apps/api`** (`@kraftplan/api`),
which mounts every service's routes in one Fastify process — ideal for free-tier hosting.
The individual `services/*` still exist and can be run separately if desired.

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
