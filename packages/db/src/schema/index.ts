import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';

// ══════════════════════════════════════
// USERS
// ══════════════════════════════════════
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash'),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  units: text('units').default('metric').notNull(),
  experience: text('experience').default('beginner').notNull(),
  bodyweightKg: numeric('bodyweight_kg'),
  heightCm: numeric('height_cm'),
  goal: text('goal'),
  role: text('role').default('user').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ══════════════════════════════════════
// EXERCISES (defined before block_exercises references it)
// ══════════════════════════════════════
export const exercises = pgTable(
  'exercises',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    primaryMuscles: text('primary_muscles').array().notNull().default(sql`'{}'`),
    secondaryMuscles: text('secondary_muscles').array().notNull().default(sql`'{}'`),
    equipment: text('equipment').array().notNull().default(sql`'{}'`),
    difficulty: text('difficulty').notNull(),
    tutorialUrl: text('tutorial_url'),
    thumbnailUrl: text('thumbnail_url'),
    instructions: jsonb('instructions').notNull().default(sql`'[]'`),
    cues: text('cues').array().notNull().default(sql`'{}'`),
    mistakes: text('mistakes').array().notNull().default(sql`'{}'`),
  },
  (table) => ({
    searchIdx: index('idx_exercises_search').on(table.name),
  }),
);

// ══════════════════════════════════════
// EXERCISE ALTERNATIVES
// ══════════════════════════════════════
export const exerciseAlternatives = pgTable('exercise_alternatives', {
  id: uuid('id').primaryKey().defaultRandom(),
  exerciseId: uuid('exercise_id')
    .notNull()
    .references(() => exercises.id, { onDelete: 'cascade' }),
  alternativeId: uuid('alternative_id')
    .notNull()
    .references(() => exercises.id, { onDelete: 'cascade' }),
});

// ══════════════════════════════════════
// PLANS
// ══════════════════════════════════════
export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  category: text('category').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  durationWeeks: integer('duration_weeks').notNull(),
  daysPerWeek: integer('days_per_week').notNull(),
  difficulty: text('difficulty').notNull(),
  equipment: text('equipment').array().notNull().default(sql`'{}'`),
  coverImage: text('cover_image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ══════════════════════════════════════
// PLAN WEEKS / DAYS / BLOCKS
// ══════════════════════════════════════
export const planWeeks = pgTable('plan_weeks', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'cascade' }),
  weekNumber: integer('week_number').notNull(),
});

export const planDays = pgTable('plan_days', {
  id: uuid('id').primaryKey().defaultRandom(),
  weekId: uuid('week_id')
    .notNull()
    .references(() => planWeeks.id, { onDelete: 'cascade' }),
  dayNumber: integer('day_number').notNull(),
  title: text('title'),
  isRestDay: boolean('is_rest_day').default(false).notNull(),
});

export const planBlocks = pgTable('plan_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  dayId: uuid('day_id')
    .notNull()
    .references(() => planDays.id, { onDelete: 'cascade' }),
  blockType: text('block_type').notNull(),
  sortOrder: integer('sort_order').notNull(),
});

export const blockExercises = pgTable('block_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  blockId: uuid('block_id')
    .notNull()
    .references(() => planBlocks.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id')
    .notNull()
    .references(() => exercises.id),
  sortOrder: integer('sort_order').notNull(),
  sets: integer('sets').notNull(),
  repsScheme: text('reps_scheme').notNull(),
  loadScheme: text('load_scheme').notNull(),
  targetLoad: text('target_load'),
  restSec: integer('rest_sec').default(60).notNull(),
  tempo: text('tempo'),
  notes: text('notes'),
});

// ══════════════════════════════════════
// USER PLAN ASSIGNMENTS
// ══════════════════════════════════════
export const userPlanAssignments = pgTable(
  'user_plan_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id),
    startDate: text('start_date').notNull(),
    currentWeek: integer('current_week').default(1).notNull(),
    status: text('status').default('active').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    activePlanUnique: uniqueIndex('idx_active_plan').on(table.userId).where(sql`status = 'active'`),
  }),
);

// ══════════════════════════════════════
// WORKOUT SESSIONS
// ══════════════════════════════════════
export const workoutSessions = pgTable(
  'workout_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    planDayId: uuid('plan_day_id')
      .notNull()
      .references(() => planDays.id),
    status: text('status').default('active').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    totalVolumeKg: numeric('total_volume_kg'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userDateIdx: index('idx_sessions_user_date').on(table.userId, table.createdAt),
  }),
);

// ══════════════════════════════════════
// WORKOUT SETS (TimescaleDB hypertable)
// ══════════════════════════════════════
export const workoutSets = pgTable(
  'workout_sets',
  {
    sessionId: uuid('session_id')
      .notNull()
      .references(() => workoutSessions.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id),
    setIndex: integer('set_index').notNull(),
    weightKg: numeric('weight_kg'),
    reps: integer('reps'),
    timeSec: numeric('time_sec'),
    distanceM: numeric('distance_m'),
    rpe: numeric('rpe'),
    status: text('status').default('completed').notNull(),
    idempotencyKey: uuid('idempotency_key').notNull(),
    loggedAt: timestamp('logged_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.sessionId, table.exerciseId, table.setIndex] }),
    loggedAtIdx: index('idx_sets_logged_at').on(table.loggedAt),
    idempotencyUnique: uniqueIndex('idx_sets_idempotency').on(
      table.sessionId,
      table.exerciseId,
      table.setIndex,
      table.idempotencyKey,
    ),
  }),
);

// ══════════════════════════════════════
// PERSONAL RECORDS
// ══════════════════════════════════════
export const personalRecords = pgTable(
  'personal_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id),
    metric: text('metric').notNull(),
    value: numeric('value').notNull(),
    achievedAt: timestamp('achieved_at', { withTimezone: true }).notNull(),
    setId: uuid('set_id').references(() => workoutSessions.id),
  },
  (table) => ({
    userExerciseMetric: uniqueIndex('idx_pr_user_exercise_metric').on(
      table.userId,
      table.exerciseId,
      table.metric,
    ),
  }),
);

// ══════════════════════════════════════
// EVENT OUTBOX (for outbox pattern)
// ══════════════════════════════════════
export const eventOutbox = pgTable('event_outbox', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  status: text('status').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
