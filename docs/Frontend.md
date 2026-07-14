# Frontend Document
## KraftPlan — AI-Powered Gym Workout Planner & Tracker

> **Status:** Draft v1.0
> **Last Updated:** 2026-07-13
> **Reference UI:** https://fitonist-app.webflow.io/

---

## 1. Overview

The frontend is a **Next.js (App Router)** application written in **TypeScript**, styled with **Tailwind CSS**, with **React Server Components (RSC)** for data-fetching pages and **Client Components** for interactive surfaces (workout player, timers, charts). It is mobile-first, dark-mode-by-default, and installable as a **PWA** for gym-floor use.

---

## 2. Tech Stack (Frontend)

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 14+ (App Router) | RSC, file-based routing, BFF route handlers, SSR/ISR |
| Language | TypeScript (strict) | Type safety end-to-end |
| Styling | Tailwind CSS + CSS variables | Design-token theming, rapid UI |
| Components | Radix UI primitives + custom | Accessible, unstyled primitives we theme |
| State (client) | Zustand (player/session) + TanStack Query (server cache) | Lightweight, deterministic |
| Forms | React Hook Form + Zod | Schema validation shared with backend |
| Charts | Recharts | React-native, themeable |
| Animation | Framer Motion | Page transitions, PR celebrations |
| Icons | Lucide React | Consistent stroke set |
| Video | native `<video>` + custom controls | Autoplay-muted tutorials, captions |
| Offline | IndexedDB (via `idb`), Service Worker (next-pwa) | Queue logs offline |
| Auth | Auth.js (NextAuth) | OAuth + credentials, JWT session |
| Testing | Vitest + Testing Library + Playwright | Unit + e2e |

---

## 3. Project Structure

```
apps/web/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (auth)/register/page.tsx
│   ├── (app)/layout.tsx          # authenticated shell (nav)
│   ├── (app)/dashboard/page.tsx
│   ├── (app)/plans/page.tsx      # catalog
│   ├── (app)/plans/[id]/page.tsx # plan detail
│   ├── (app)/workout/[sessionId]/page.tsx  # player
│   ├── (app)/progress/page.tsx
│   ├── (app)/library/page.tsx
│   ├── (app)/library/[exerciseId]/page.tsx
│   ├── (app)/settings/page.tsx
│   ├── onboarding/page.tsx
│   ├── api/                       # BFF route handlers
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── dashboard/route.ts
│   │   ├── workouts/route.ts
│   │   └── workouts/[sessionId]/sets/route.ts
│   └── layout.tsx                 # root (providers, fonts)
├── components/
│   ├── ui/                        # primitives: Button, Card, Input...
│   ├── player/                    # SetLogger, RestTimer, VideoPlayer
│   ├── dashboard/                 # StatTile, PRCard, ProgramProgress
│   ├── plans/                     # PlanCard, FilterChips
│   └── charts/                    # LineChart, BarChart, Heatmap
├── lib/
│   ├── api/                       # typed API clients (BFF + services)
│   ├── auth/                      # session helpers
│   ├── offline/                   # IndexedDB outbox + sync worker
│   ├── hooks/                     # useWorkoutSession, useRestTimer...
│   └── utils/                     # format, units conversion
├── stores/                        # Zustand stores
├── styles/                        # globals.css, tokens.css
├── public/                        # manifest, icons, sw
└── tests/
```

---

## 4. Routing & Rendering Strategy

| Route | Render | Data source |
|---|---|---|
| `/dashboard` | RSC + client widgets | BFF `/api/dashboard` → services |
| `/plans` | RSC (ISR 1h) | Plan Service catalog (cached) |
| `/plans/[id]` | RSC | Plan Service detail |
| `/workout/[sessionId]` | Client (interactive) | hydrate from BFF, then live API |
| `/progress` | RSC + client charts | Progress Service |
| `/library` | RSC (ISR 6h) | Library Service |
| `/onboarding` | Client (multi-step form) | writes via BFF |

- Authenticated pages use middleware to redirect unauthenticated users to `/login`.
- Player page forces client rendering (no SSR of dynamic timer state); data prefetched via server action for instant hydration.

---

## 5. State Management

### 5.1 Server state — TanStack Query
- `useDashboard()`, `useTodaySession()`, `useExercise(id)`, `useProgressCharts()`.
- Stale-while-revalidate; optimistic updates for set logging.
- Query invalidation on `workout.completed`.

### 5.2 Client state — Zustand (player only)
```ts
interface PlayerStore {
  session: SessionManifest;
  currentExerciseIndex: number;
  currentSetIndex: number;
  sets: Record<setKey, SetLogInput>;   // per-set form state
  elapsedSec: number;
  status: 'active' | 'paused' | 'completed';
  // actions
  logSet: (input) => void;
  advanceSet: () => void;
  startRest: (sec) => void;
}
```
- Persisted to IndexedDB so a refresh mid-workout resumes state.

### 5.3 Form state — React Hook Form + Zod
- Onboarding, profile, set-logger inputs.
- Zod schemas shared with backend via a `packages/shared` package.

---

## 6. The Workout Player (Core Feature)

The player is the most complex UI surface. Structure:

```
┌──────────────────────────────────────┐
│ ✕  Push A · Bench Focus   ⏱ 12:34   │  sticky header (elapsed timer)
├──────────────────────────────────────┤
│ ● ● ● ◐ ○ ○                          │  progress dots (exercises)
├──────────────────────────────────────┤
│  ┌──────────────────────────────┐    │
│  │  [tutorial video 16:9]       │    │  autoplay muted; tap for sound
│  └──────────────────────────────┘    │
│  Barbell Bench Press                 │
│  Chest · Triceps · Front delts       │
│  ▾ Instructions & cues               │  collapsible
├──────────────────────────────────────┤
│  Set │ Target   │ Weight │ Reps │RPE │✓│
│   1  │ 5 @ 80%  │ [100 ] │ [5 ] │[8] │✓│  SetLogger rows
│   2  │ 5 @ 80%  │ [    ] │ [  ] │[ ] │○│
│   3  │ 5 @ 80%  │ [    ] │ [  ] │[ ] │○│
├──────────────────────────────────────┤
│  [ Swap exercise ]  [ Add note ]     │
├──────────────────────────────────────┤
│  When set ✓ tapped → RestTimer overlay│
│  ◯ 2:45   [Skip] [+15s]              │
└──────────────────────────────────────┘
```

### Interaction loop
1. Tap a set row → number-pad `BottomSheet` opens (weight, reps, RPE).
2. Tap ✓ → `POST /api/workouts/:sessionId/sets` (optimistic).
3. On 200 → mark set filled, start `RestTimer` with `exercise.restSec`.
4. Timer ends → auto-advance to next set; if last set → next exercise.
5. On `prCandidate === true` → show `PRBadge` + optional confetti.
6. Final set → "Finish session" → `POST /complete` → summary screen.

### SetLogger variants (by exercise type)
- **Resistance:** weight + reps + RPE.
- **Time-based (run/row):** duration (mm:ss) + distance (mi/km) + pace (derived).
- **Bodyweight/plyo:** reps + (optional) height/distance.
- **AMRAP:** reps only (rounds tracked at block level).
- Inputs are unit-aware (kg/lb, mi/km) from profile setting.

---

## 7. Dashboard

Composed of independent widgets (each a Client Component with its own query):

- **TodayCard** — gradient hero with session title + "Start" CTA (or rest-day variant).
- **StatGrid** — 2×2 tiles: streak, this-week adherence, 30d volume, top PR delta.
- **ProgramProgress** — stepper Week 1→N with % bar and deload marker.
- **PRHighlights** — horizontal scroll of `PRCard`s.
- **RecentSessions** — list of last 3 sessions.
- **MiniChart** — weekly volume sparkline.

All widgets read from a single `/api/dashboard` BFF call (fan-out to services) cached 60s.

---

## 8. Progress Page

- **Tabs:** Strength | Endurance | Adherence.
- **Strength:** table of exercises → current e1RM/PR, previous, delta; tap row → line chart (e1RM over time).
- **Endurance:** pace line chart + weekly mileage bar chart.
- **Adherence:** year heatmap (GitHub-style) + weekly sessions bar chart.
- Charts themable via CSS variables; skeleton loaders while fetching.

---

## 9. Exercise Library

- Search bar + `FilterChips` (muscle, equipment, type, difficulty).
- Debounced query → `/api/exercises?q=...`.
- Grid of `ExerciseCard`s (thumbnail + name + primary muscle).
- Detail page: full-bleed `VideoPlayer`, instructions, cues, mistakes, alternatives carousel.

---

## 10. Offline & PWA

- `next-pwa` generates the service worker; precaches app shell.
- **Outbox** in IndexedDB (`idb` store): queued set logs with `Idempotency-Key`.
- **Sync worker** (background) drains outbox on connectivity; exponential backoff.
- Active session snapshot persisted → resume after refresh/crash.
- UI indicator: cloud icon (online) / cloud-off (queued N items).

---

## 11. Theming & Design Tokens

`styles/tokens.css` defines CSS variables consumed by Tailwind config:

```css
:root[data-theme="dark"] {
  --bg-base: #0B0E14;
  --bg-surface: #141925;
  --accent-blue: #3D8BFF;
  --accent-violet: #8E6FFF;
  --gradient-brand: linear-gradient(135deg, #3D8BFF, #7C5CFF);
  /* ...see Design doc */
}
```
- `data-theme` attribute on `<html>` toggled by `next-themes`.
- Tailwind `colors` mapped to `var(--token)` so components stay theme-agnostic.

---

## 12. Accessibility

- All interactive components built on Radix (focus management, ARIA).
- Player controls keyboard-navigable: Tab between sets, Enter to log, Space to start/skip rest.
- Number inputs announce units via `aria-label`.
- Charts ship a visually-hidden text summary.
- Captions (WebVTT) on tutorial videos.
- `prefers-reduced-motion` disables confetti/parallax.

---

## 13. Performance Budget

| Metric | Target |
|---|---|
| LCP (dashboard) | < 2.0s on 4G |
| TBT | < 200ms |
| Player TTI | < 2.5s |
| Bundle (initial) | < 200KB gzipped |
| Media | Lazy-loaded; poster image first |

Techniques: RSC for static pages, route segment config for ISR, `next/dynamic` for charts/player, image optimization via `next/image`, font subsetting via `next/font`.

---

## 14. Testing Strategy

- **Unit:** Vitest for hooks, stores, utils (units conversion, PR calc).
- **Component:** Testing Library for SetLogger, RestTimer, Dashboard widgets.
- **E2E:** Playwright — full workout flow: login → start session → log 2 sets → finish → see PR on dashboard.
- **Visual regression:** Storybook + Chromatic for UI primitives.
- **A11y:** axe-core in component tests + Playwright runs.
- **Coverage gate:** 70% lines on `lib/`, `components/player/`.

---

## 15. Environment Variables (client-safe)

```
NEXT_PUBLIC_API_BASE=https://api.kraftplan.app
NEXT_PUBLIC_CDN_BASE=https://cdn.kraftplan.app
NEXT_PUBLIC_AUTH_GOOGLE_ID=...
NEXTAUTH_URL=https://app.kraftplan.app
NEXTAUTH_SECRET=...            # server only
```

---

## 16. Build & Run

```bash
pnpm install
pnpm --filter web dev          # http://localhost:3000
pnpm --filter web build
pnpm --filter web test
pnpm --filter web e2e
```

---

## 17. Frontend Acceptance Criteria

- [ ] Dashboard loads < 2s with cached data.
- [ ] Workout player logs a set in < 100ms perceived (optimistic).
- [ ] Offline: complete a session with no network; syncs on reconnect with no dupes.
- [ ] PR is surfaced within 2s of session completion on dashboard.
- [ ] Lighthouse Performance ≥ 90 on dashboard (mobile).
- [ ] Keyboard-only user can complete a full session.
