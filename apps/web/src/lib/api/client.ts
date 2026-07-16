const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4001';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | undefined>;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) searchParams.set(key, value);
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...fetchOptions, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; name: string; bodyweightKg?: number; heightCm?: number; goal?: string; experience?: string }) =>
    apiFetch<{ accessToken: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiFetch<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: () => apiFetch<any>('/auth/me'),

  updateProfile: (data: any) =>
    apiFetch<any>('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),

  // Plans
  getPlans: (params?: Record<string, string | undefined>) =>
    apiFetch<any[]>('/plans', { params }),

  getPlanDetail: (id: string) => apiFetch<any>(`/plans/${id}`),

  createCustomPlan: (data: {
    title: string;
    category: string;
    difficulty: string;
    daysPerWeek: number;
    description?: string;
    days: Array<{
      title: string;
      exercises: Array<{
        exerciseId: string;
        name: string;
        sets: number;
        repsScheme: string;
        restSec: number;
        category?: string;
        primaryMuscles?: string[];
        tutorialUrl?: string | null;
        instructions?: string[];
        cues?: string[];
      }>;
    }>;
  }) =>
    apiFetch<any>('/plans/custom', { method: 'POST', body: JSON.stringify(data) }),

  assignPlan: (data: { planId: string; startDate: string }) =>
    apiFetch<any>('/users/me/plan', { method: 'POST', body: JSON.stringify(data) }),

  getTodaySession: (date?: string) =>
    apiFetch<any>(`/plans/today?date=${date || new Date().toISOString().split('T')[0]}`),

  getPlanProgress: () => apiFetch<any>('/users/me/plan/progress'),

  // Workouts
  startSession: (data: { planDayId: string; date: string }) =>
    apiFetch<any>('/workouts', { method: 'POST', body: JSON.stringify(data) }),

  startCustomSession: (data: { exercises: any[]; title?: string }) =>
    apiFetch<{ sessionId: string; manifest: any }>('/workouts/custom', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getSession: (sessionId: string) => apiFetch<any>(`/workouts/${sessionId}`),

  logSet: (sessionId: string, data: any) =>
    apiFetch<any>(`/workouts/${sessionId}/sets`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }),

  completeSession: (sessionId: string, data: { totalElapsedSec: number; notes?: string }) =>
    apiFetch<any>(`/workouts/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Progress
  getDashboard: () => apiFetch<any>('/dashboard'),
  getPRs: () => apiFetch<any[]>('/progress/prs'),
  getPRHistory: (exerciseId: string, range?: string) =>
    apiFetch<any[]>(`/progress/prs/${exerciseId}/history`, { params: { range } }),
  getVolume: (range?: string) =>
    apiFetch<any[]>('/progress/volume', { params: { range } }),
  getAdherence: (range?: string) =>
    apiFetch<any[]>('/progress/adherence', { params: { range } }),
  getEndurance: (range?: string) =>
    apiFetch<any[]>('/progress/endurance', { params: { range } }),

  // Exercises
  getExercises: (params?: Record<string, string | undefined>) =>
    apiFetch<{ exercises: any[]; total: number }>('/exercises', { params }),
  getExerciseDetail: (id: string) => apiFetch<any>(`/exercises/${id}`),
};
