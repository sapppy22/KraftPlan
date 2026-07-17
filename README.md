# KraftPlan

An AI-Powered Gym Workout Planner & Tracker engineered for peak performance.

### 🔗 Live Demo: **[kraftplan.pages.dev](https://kraftplan.pages.dev)**

KraftPlan is a full-stack, mobile-first web application designed to help athletes discover, customize, and execute structured gym workout plans. It features an interactive workout player, real-time PR tracking, dynamic analytics, and role-based administration.

## Core Features
- **Interactive Workout Player:** Sequential logging of sets, reps, weight, RPE, and time. Features an integrated rest timer and inline YouTube tutorial videos.
- **Progress & Analytics:** Deep insights into 30-day volume, adherence heatmaps, estimated 1RM trends, and program completion progress.
- **Adaptive Planning:** Choose from 9 training modalities (Strength, Hypertrophy, Hyrox, Endurance, etc.) or create custom throwaway sessions.
- **Exercise Library:** 81 curated exercises with search, filtering, alternatives, and detailed coaching cues.
- **Flagship UI/UX:** A minimal, dark-mode-first aesthetic utilizing glassmorphism, fluid micro-animations, and responsive design tailored for mobile, tablet, and desktop.

## Tech Stack
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, TanStack Query, Zustand, Recharts.
- **Backend API:** Cloudflare Workers (Hono), zero-cold-start edge execution.
- **Database:** PostgreSQL (Neon serverless) using Drizzle ORM (via `neon-http`).
- **Auth:** Stateless JWT authentication with WebCrypto PBKDF2 password hashing.

## Deployment Architecture
KraftPlan operates on a 100% free-tier, always-on infrastructure:
1. **Web App:** Hosted on Cloudflare Pages.
2. **API:** Hosted on Cloudflare Workers.
3. **Database:** Hosted on Neon Postgres.

Auto-deployment is configured via GitHub Actions. Pushing to `main` seamlessly deploys the Cloudflare Pages front-end and the Workers back-end.

## Local Setup
Ensure you have Node.js 20+ and `pnpm` installed.

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment variables (Neon DB URL, JWT Secret)
cp .env.example .env

# 3. Push schema and seed the database
pnpm db:push
pnpm db:seed

# 4. Start development servers
pnpm dev:api   # Runs backend on :4001
pnpm dev:web   # Runs frontend on :3000
```

## Admin Portal
KraftPlan includes a built-in admin dashboard for user management, app statistics, and feedback review.
- Register an account with the username or email **`admin_redacted`** to automatically receive the `admin` role.
- Access the portal at `/admin`.

## License
MIT
