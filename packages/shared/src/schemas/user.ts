import { z } from 'zod';
import { EXPERIENCE_LEVELS, PLAN_CATEGORIES, UNITS, USER_ROLES } from '../constants.js';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
  units: z.enum(UNITS).default('metric'),
  experience: z.enum(EXPERIENCE_LEVELS).default('beginner'),
  bodyweightKg: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  goal: z.enum(PLAN_CATEGORIES).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  units: z.enum(UNITS).optional(),
  experience: z.enum(EXPERIENCE_LEVELS).optional(),
  bodyweightKg: z.number().positive().optional().nullable(),
  heightCm: z.number().positive().optional().nullable(),
  goal: z.enum(PLAN_CATEGORIES).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  units: z.enum(UNITS),
  experience: z.enum(EXPERIENCE_LEVELS),
  bodyweightKg: z.number().nullable(),
  heightCm: z.number().nullable(),
  goal: z.string().nullable(),
  role: z.enum(USER_ROLES),
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof userSchema>;

export const authResponseSchema = z.object({
  accessToken: z.string(),
  user: userSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;
