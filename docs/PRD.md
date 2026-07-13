# Product Requirements Document (PRD)
## Project: ForgeFit — AI-Powered Gym Workout Planner & Tracker

> **Status:** Draft v1.0
> **Owner:** Product Team
> **Last Updated:** 2026-07-13

---

## 1. Overview

ForgeFit is a web application that lets users discover, customize, and execute structured gym workout plans across multiple training disciplines — from mobility and endurance to powerlifting, lean-muscle gain, Hyrox, and athletic performance. Each plan breaks down into day-by-day sessions with follow-through exercise tutorials. As users complete sessions, they log interactive metrics: time taken, weights used, reps achieved, miles run, perceived effort, and more. A personal dashboard surfaces progress against previous personal records (PRs) and program milestones.

**Front-end reference:** https://fitonist-app.webflow.io/ (clean, mobile-first, goal-driven, dark UI with vibrant accent gradients, large hero imagery, card-based plan selection).

---

## 2. Goals & Non-Goals

### Goals
- Let users pick a training goal and receive a structured multi-week plan with day-by-day sessions.
- Provide follow-through tutorials (video + step text + cues) for every exercise in a session.
- Let users log performance metrics interactively during/after each session.
- Track PRs per exercise and surface them on a progress dashboard.
- Support at least 8 distinct training modalities at launch.

### Non-Goals (v1)
- Social feed / following other users.
- In-app marketplace or paid personal-trainer consultations.
- Native mobile apps (web-first; PWA later).
- Nutrition / meal planning (future phase).
- Real-time GPS run tracking (users log distance manually; future phase may add device sync).

---

## 3. Target Users

| Persona | Primary Need |
|---|---|
| Beginner lifter | Guided mobility & foundational strength plans with video cues |
| Hypertrophy-focused gymgoer | Lean-muscle split plans with progressive overload tracking |
| Powerlifter | Peaking blocks, SBD (squat/bench/deadlift) percentage work, 1RM tracking |
| Hybrid athlete (Hyrox) | Combined run + functional fitness sessions, split-time logging |
| Endurance runner/cyclist | Distance, pace, time logging; progressive mileage plans |
| Field athlete | Speed, agility, plyometric, and power development plans |

---

## 4. User Stories

### Onboarding & Plan Selection
- As a new user, I want to select my primary goal (mobility, lean muscle, powerlifting, Hyrox, endurance, athletic, strength, general fitness) so I get relevant plans.
- As a user, I want to input my experience level, available equipment, days/week, and session length so the plan fits my life.
- As a user, I want to browse a catalog of plans filtered by goal/duration/equipment so I can choose one.
- As a user, I want to preview a plan's weekly structure before committing.

### Workout Execution
- As a user, I want to open today's session and see an ordered list of exercises with sets/reps/rest.
- As a user, I want to watch a tutorial video and read setup/form cues for each exercise.
- As a user, I want a guided "workout player" that walks me set-by-set with a rest timer.
- As a user, I want to log weight, reps, time, distance, pace, and RPE for each set/block.
- As a user, I want to mark a set/exercise/session as complete and have my progress saved.
- As a user, I want to swap an exercise for an alternative without losing the plan structure.

### Progress & Dashboard
- As a user, I want a dashboard showing: sessions completed this week, total volume, streak, upcoming session, and PR highlights.
- As a user, I want to see my PR history per exercise (e.g., squat 1RM trend).
- As a user, I want charts showing volume, frequency, and estimated 1RM over time.
- As a user, I want to see how far along I am in the active program (week X of Y).

### Account & Settings
- As a user, I want to create an account and log in (email + OAuth).
- As a user, I want to change my active plan or start a new one.
- As a user, I want to edit my profile (units kg/lb, experience level).

---

## 5. Functional Requirements

### 5.1 Training Modalities (Plan Categories)
At launch, the system must support plans in these categories:

1. **Mobility & Recovery** — joint mobility, foam rolling, dynamic warm-ups, stretching flows.
2. **General Strength** — full-body strength foundations.
3. **Lean Muscle / Hypertrophy** — push/pull/legs, upper/lower, bro splits.
4. **Powerlifting** — squat/bench/deadlift focus, peaking, accessory work, percentage-based programming.
5. **Hyrox / Hybrid Fitness** — running intervals + functional fitness (wall balls, sled push, burpee broad jumps, etc.).
5. **Endurance (Run/Bike/Row)** — progressive mileage, interval sessions, tempo runs.
6. **Athletic Performance** — speed, agility, plyometrics, change of direction, power.
7. **Cross-Training / Conditioning** — metcons, AMRAPs, EMOMs.
8. **Weight Loss / Fat Loss** — circuit training + cardio templates.

### 5.2 Plan Structure
- A **Plan** belongs to a category and has: goal, duration (weeks), days/week, difficulty, equipment required, description, cover image.
- A Plan contains **Weeks**, each containing **Days (Sessions)**.
- A Session contains **Blocks** (warm-up / main / accessory / finisher / cool-down).
- A Block contains **Exercises** with prescribed sets, reps, rest, tempo, and load scheme (%1RM, RPE, or fixed).
- Each **Exercise** has: name, category, primary/secondary muscles, equipment, tutorial video URL, step-by-step instructions, coaching cues, common mistakes, alternative exercises.

### 5.3 Workout Player (Interactive Execution)
- Sequential, one-exercise-at-a-time UI with set logging.
- Per-set inputs depending on exercise type:
  - Resistance: weight (kg/lb), reps, RPE.
  - Time-based: duration, distance (miles/km), pace.
  - Bodyweight/plyo: reps, height, distance.
- Rest timer between sets with auto-advance option.
- "Complete set", "complete exercise", "complete session" actions.
- Mark set as failed/skipped.
- Live session elapsed timer.
- Offline-tolerant: queue logs and sync when back online (PWA).

### 5.4 Progress Dashboard
- **Today widget:** today's scheduled session (or rest day), start button.
- **Streak & adherence:** current streak, sessions completed vs. scheduled this week/month.
- **PRs:** list of current PRs per exercise with date achieved and delta vs previous.
- **Charts:** estimated 1RM trend, total volume per muscle group, session frequency calendar (GitHub-style heatmap), distance/pace trends for endurance.
- **Program progress:** week X of Y, % complete, next deload week marker.

### 5.5 Exercise Library
- Searchable/filterable catalog (by muscle, equipment, type, difficulty).
- Detail view with tutorial video, instructions, cues, alternatives.
- Curated library at launch (~300+ exercises), expandable by admin.

### 5.6 Authentication & Profile
- Email/password + Google OAuth.
- Profile: name, avatar, units (metric/imperial), experience level, bodyweight (optional, for relative strength).

---

## 6. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance | First contentful paint < 2s on 4G; API p95 < 300ms |
| Scalability | Support 10k concurrent users at launch; horizontally scalable API |
| Availability | 99.9% uptime |
| Security | OWASP Top 10 hardening; JWT auth; encrypted secrets; rate limiting |
| Accessibility | WCAG 2.1 AA; keyboard-navigable player; captions on tutorials |
| Responsiveness | Mobile-first; works 360px–4K; PWA installable |
| Data | GDPR/CCPA compliant; export/delete account data |
| Browser support | Latest 2 versions of Chrome, Safari, Firefox, Edge |

---

## 7. Metrics & Success Criteria

- **Activation:** % new users who complete onboarding and start a plan > 70%.
- **Engagement:** median sessions completed per active user per week ≥ 2.
- **Retention:** W4 retention ≥ 35%.
- **Logging fidelity:** % of started sessions that get at least one metric logged > 60%.
- **Performance:** dashboard load < 1.5s.

---

## 8. Release Phases

### Phase 1 — MVP (this build)
- Onboarding + plan selection from 8 categories.
- Curated plan catalog (≥2 plans per category).
- Workout player with interactive set logging + rest timer.
- Progress dashboard with PRs + basic charts.
- Auth + profile.

### Phase 2
- PWA offline mode.
- Apple Watch / wearable sync.
- Admin CMS for plan/exercise authoring.
- Plan customization (swap exercises, edit sets/reps).

### Phase 3
- AI-assisted plan generation.
- Nutrition tracking.
- Social/challenges.
- Native apps.

---

## 9. Open Questions
- Should we offer a free tier with limited plans and a paid tier for full catalog? (Leaning yes, mirroring Fitonist's free-trial + monthly/annual model.)
- Do we need coach-reviewed content at launch or community/AI-generated?
- Exact exercise video source: licensed library vs. self-produced?

---

## 10. Glossary
- **PR** — Personal Record (best single-set performance for an exercise).
- **RPE** — Rate of Perceived Exertion (1–10).
- **1RM** — One Rep Max (estimated from weight × reps).
- **AMRAP** — As Many Rounds As Possible.
- **EMOM** — Every Minute On the Minute.
- **Hyrox** — Fitness race format: 8 × 1km run + 8 functional workouts.
- **Metcon** — Metabolic conditioning workout.
