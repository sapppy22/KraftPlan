# Design Document
## KraftPlan — AI-Powered Gym Workout Planner & Tracker

> **Status:** Draft v1.0
> **Last Updated:** 2026-07-13
> **Front-end reference:** https://fitonist-app.webflow.io/

---

## 1. Design Principles

1. **Mobile-first, gym-ready.** The app is used mid-workout on a phone propped on a rack. Large tap targets, one-hand reachability, high contrast.
2. **Calm but energetic.** Dark base with vibrant gradient accents (electric blue → violet). Avoid clutter; let imagery and motion do the heavy lifting.
3. **Progressive disclosure.** Show the next action only. During a workout, one exercise + one set at a time.
4. **Data with context.** Every metric ties back to a previous PR or plan target — never a bare number.
5. **Accessible by default.** WCAG 2.1 AA, keyboard nav, captions, reduced-motion support.

---

## 2. Visual Language

### 2.1 Color System
Inspired by Fitonist's dark UI with blue/circular accent elements.

| Token | Light | Dark (default) | Usage |
|---|---|---|---|
| `--bg-base` | `#F6F7FB` | `#0B0E14` | App background |
| `--bg-surface` | `#FFFFFF` | `#141925` | Cards, sheets |
| `--bg-elevated` | `#FFFFFF` | `#1C2333` | Modals, player |
| `--text-primary` | `#0F1320` | `#F5F7FA` | Headings, body |
| `--text-secondary` | `#5A6378` | `#9AA4B8` | Captions, meta |
| `--accent-blue` | `#2E7BFF` | `#3D8BFF` | Primary actions, links |
| `--accent-violet` | `#7C5CFF` | `#8E6FFF` | Secondary accent, gradients |
| `--accent-cyan` | `#22D3EE` | `#22D3EE` | Highlights, data viz |
| `--success` | `#22C55E` | `#34D399` | PRs, completed sets |
| `--warning` | `#F59E0B` | `#FBBF24` | Deload, attention |
| `--danger` | `#EF4444` | `#F87171` | Failed sets, delete |
| `--gradient-brand` | — | `linear-gradient(135deg, #3D8BFF, #7C5CFF)` | Hero, primary CTA |

### 2.2 Typography
- **Family:** Inter (UI) + Space Grotesk (display headings) — both variable, loaded via `next/font`.
- **Scale (mobile / desktop):**
  - Display: 40 / 56
  - H1: 30 / 40
  - H2: 24 / 32
  - H3: 20 / 24
  - Body: 16 / 16
  - Small: 14 / 14
  - Caption: 12 / 12
- **Weight:** 400 body, 600 semibold (buttons/labels), 700 display.
- **Line height:** 1.5 body, 1.2 headings.

### 2.3 Spacing & Layout
- 4px base grid. Spacing scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.
- Mobile container padding: 16px. Desktop max content width: 1200px.
- Card radius: 16px. Buttons/chips: 999px (pill). Inputs: 12px.
- Elevation: surface cards use subtle 1px border (`rgba(255,255,255,0.06)`) + soft shadow; dark theme avoids heavy shadows.

### 2.4 Iconography & Imagery
- Icons: Lucide (stroke 2px, 24px default).
- Imagery: high-quality gym/athletic photography with subtle dark gradient overlay.
- Exercise thumbnails: 16:9; tutorial video fills the player area.
- Illustrations: abstract gradient orbs (echoing Fitonist's blue circle motif) for empty states.

### 2.5 Motion
- Page transitions: 200ms ease-out fade + 8px slide.
- Card/CTA hover: 150ms scale 1.02 + gradient shift.
- Rest timer ring: smooth countdown stroke animation.
- PR celebration: confetti burst (canvas) + haptic on mobile.
- Respect `prefers-reduced-motion`: disable confetti and parallax.

---

## 3. Information Architecture

```
KraftPlan
├── Auth
│   ├── Login
│   └── Register
├── Onboarding (goal → level → equipment → schedule → plan pick)
├── Dashboard (home)
│   ├── Today's session card
│   ├── Streak / adherence
│   ├── PR highlights
│   ├── Program progress
│   └── Quick charts
├── Plans
│   ├── Catalog (filter by goal/duration/equipment)
│   ├── Plan detail (weekly structure preview)
│   └── Active plan overview (week-by-week)
├── Workout Player
│   ├── Session overview
│   ├── Exercise player (tutorial + set logger + rest timer)
│   └── Session summary
├── Progress
│   ├── PRs table
│   ├── Volume / frequency charts
│   ├── Endurance trends
│   └── History log
├── Exercise Library
│   ├── Search / filter
│   └── Exercise detail (video, cues, alternatives)
└── Settings / Profile
```

---

## 4. Key Screens (Wireframe Descriptions)

### 4.1 Dashboard
- **Top bar:** logo, greeting ("Morning, Alex"), avatar.
- **Today card (hero):** gradient background, "Day 12 · Push A" title, estimated time, primary CTA "Start session".
- **Stat row (2×2 grid):** streak (🔥 5), this week (3/4), volume (12.4t), top PR (+5kg).
- **Program progress:** horizontal stepper Week 1→8 with current highlighted, % complete bar.
- **PR highlights:** horizontal scroll of cards — exercise icon, weight, delta arrow vs last PR.
- **Recent activity:** list of last 3 sessions with date, plan, duration.

### 4.2 Plan Catalog
- **Filter chips:** goal, weeks, days/week, equipment, difficulty.
- **Grid of plan cards:** cover image, category badge, title, "8 wks · 4 days/wk", difficulty dots, "Preview" button.
- **Detail view:** hero image, description, equipment list, week-by-week accordion, "Start plan" CTA.

### 5.3 Workout Player
- **Sticky header:** session title, elapsed timer, close (X) with confirm.
- **Progress dots:** one per exercise, current highlighted, completed filled.
- **Exercise card (swipeable):**
  - 16:9 tutorial video (autoplay muted, tap for sound).
  - Exercise name + target muscles.
  - Collapsible "Instructions & cues" (steps, coaching cues, mistakes).
  - Set table: set # | target (e.g. "5 @ 80%") | weight input | reps input | RPE | ✓.
  - "Swap exercise" / "Add note" actions.
- **Rest timer overlay:** circular ring countdown, "Skip rest" / "+15s".
- **Session summary:** total time, total volume, sets completed, PRs hit, notes field, "Finish" + "Save & exit".

### 4.4 Progress / PRs
- **Tabs:** Strength | Endurance | Adherence.
- **Strength tab:** table of exercises → current 1RM/PR, previous, delta, date. Tap row → line chart of 1RM over time.
- **Endurance tab:** line chart of pace (min/mi) over time; bar chart of weekly mileage.
- **Adherence tab:** GitHub-style heatmap of sessions over the year; weekly bar chart of sessions completed.

### 4.5 Exercise Library
- **Search bar + filters** (muscle, equipment, type).
- **Grid of exercise cards:** thumbnail, name, primary muscle.
- **Detail:** full-bleed video, instructions, cues, alternatives carousel.

---

## 5. Component Library

Built as React components in a shared `ui/` package. Naming follows the **design tokens** above.

| Component | Purpose | Key variants |
|---|---|---|
| `Button` | Primary actions | primary (gradient), secondary (surface), ghost, danger; sizes sm/md/lg |
| `Card` | Surface containers | default, interactive, hero |
| `PlanCard` | Catalog item | — |
| `ExerciseCard` | Library/player item | compact, full |
| `SetLogger` | Per-set input row | resistance, time-based, bodyweight |
| `RestTimer` | Countdown overlay | — |
| `StatTile` | Dashboard metric | delta-up/down/neutral |
| `PRBadge` | Personal record indicator | new, beat |
| `ProgressBar` / `StepProgress` | Program/session progress | linear, stepper |
| `Chart` | Data viz wrapper | line, bar, heatmap (via Recharts) |
| `FilterChips` | Catalog filters | single, multi |
| `BottomSheet` | Mobile actions | — |
| `Modal` / `Dialog` | Confirmations, swaps | — |
| `EmptyState` | No-data states | with CTA |
| `Avatar` | User identity | image, initials |
| `Tabs` | Section switching | underline, pill |
| `Timer` | Elapsed session timer | — |
| `VideoPlayer` | Tutorial playback | autoplay-muted, captions |

---

## 6. Interaction Patterns

- **Start session** from dashboard today-card or plan overview.
- **Set logging flow:** tap a set row → number pad sheet → enter weight & reps → tap ✓ → rest timer auto-starts → on completion, advance to next set/exercise.
- **PR detection:** on set save, backend compares to PR; if beaten, client shows `PRBadge` + optional confetti.
- **Swap exercise:** tap swap → bottom sheet of alternatives → select → set logger resets for new exercise.
- **Offline:** failed/saved sets queued in IndexedDB; sync indicator in header.
- **Empty-day / rest day:** dashboard shows recovery/mobility suggestion card instead of workout CTA.

---

## 7. Responsive Strategy

| Breakpoint | Width | Layout |
|---|---|---|
| `sm` | < 640px | Single column, bottom sheet actions, sticky player controls |
| `md` | 640–1024px | Two-column dashboard, side-by-side player + set logger |
| `lg` | > 1024px | Multi-column dashboard, persistent left nav, wide charts |

Mobile-first: design the 390px view first, then enhance upward. The workout player is always single-column for focus.

---

## 8. Accessibility

- Color contrast ≥ 4.5:1 text, 3:1 large text & UI components.
- All interactive elements reachable by keyboard; visible focus ring.
- Player controls have aria-labels; video player supports captions.
- Number inputs announce units (kg vs lb) via aria.
- Charts have text summaries (visually-hidden) for screen readers.
- Touch targets ≥ 44×44px.

---

## 8. Theming & Dark Mode

- **Dark mode is the default** (gym environment, battery-friendly).
- Light mode available via system preference + manual toggle in settings.
- Tokens implemented as CSS variables swapped on `data-theme` attribute.
- Brand gradient (`--gradient-brand`) consistent across themes.

---

## 9. Branding & Tone

- **Name:** KraftPlan.
- **Logo:** "F" monogram in a rounded square with brand gradient; wordmark in Space Grotesk Bold.
- **Tone:** encouraging, direct, coach-like. Copy is short and action-oriented ("Start session", "Log set", "New PR — nice work").
- Microcopy uses sentence case, avoids exclamation overload.

---

## 10. Design Deliverables Checklist

- [ ] Color token JSON (Figma + code).
- [ ] Type scale + component styles in Figma.
- [ ] Core component library (Button, Card, SetLogger, etc.).
- [ ] Key screens: Dashboard, Catalog, Player, Progress, Library.
- [ ] Icon set (Lucide subset).
- [ ] Motion specs (Lottie / CSS).
- [ ] Empty & error states for all key flows.
- [ ] Accessibility audit checklist.
