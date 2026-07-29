'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Loader2, Dumbbell, LogOut, Check, SunMoon, Star, Target } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { PLAN_CATEGORIES } from '@kraftplan/shared';

const goalLabels: Record<string, string> = {
  mobility: 'Mobility & Recovery',
  strength: 'General Strength',
  hypertrophy: 'Lean Muscle',
  powerlifting: 'Powerlifting',
  hyrox: 'Hyrox / Hybrid',
  endurance: 'Endurance',
  athletic: 'Athletic Performance',
  conditioning: 'Cross-Training',
  weightloss: 'Weight Loss',
};

import { useAuth } from '@/lib/AuthContext';

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.getProfile(),
  });

  const [name, setName] = useState('');
  const [units, setUnits] = useState('metric');
  const [experience, setExperience] = useState('');
  // Ordered goals; index 0 is the primary goal.
  const [goals, setGoals] = useState<string[]>([]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setUnits(profile.units || 'metric');
      setExperience(profile.experience || '');
      const g: string[] = Array.isArray(profile.goals) && profile.goals.length
        ? profile.goals
        : profile.goal
          ? [profile.goal]
          : [];
      setGoals(g);
    }
  }, [profile]);

  const primaryGoal = goals[0] || '';
  function toggleGoal(cat: string) {
    setGoals((prev) => (prev.includes(cat) ? prev.filter((g) => g !== cat) : [...prev, cat]));
  }
  function makePrimary(cat: string) {
    setGoals((prev) => [cat, ...prev.filter((g) => g !== cat)]);
  }

  const updateProfile = useMutation({
    mutationFn: async (data: any) => api.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });

  function handleSave() {
    updateProfile.mutate({ name, units, ...(experience ? { experience } : {}), goals });
  }

  function handleLogout() {
    logout();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0 max-w-lg">
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-text-secondary mt-1">Manage your profile and preferences</p>
      </div>

      {/* Appearance */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SunMoon className="w-5 h-5 text-brand-green" />
            <h2 className="font-semibold text-lg">Appearance</h2>
          </div>
          <ThemeToggle variant="pill" />
        </div>
        <p className="text-xs text-text-secondary">
          Choose your preferred theme mode. Deep Forest dark mode provides a soothing, low-glare experience.
        </p>
        <ThemeToggle variant="segmented" className="mt-2" />
      </Card>

      {/* Profile */}
      <Card className="p-6 space-y-5">
        <h2 className="font-semibold text-lg">Profile</h2>

        <div>
          <label className="block text-sm font-medium mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-bg-elevated border border-hairline rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Units</label>
          <select
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            className="w-full px-4 py-3 bg-bg-elevated border border-hairline rounded-xl text-text-primary focus:outline-none focus:border-brand-orange"
          >
            <option value="metric">Metric (kg, km)</option>
            <option value="imperial">Imperial (lb, mi)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Experience Level</label>
          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full px-4 py-3 bg-bg-elevated border border-hairline rounded-xl text-text-primary focus:outline-none focus:border-brand-orange"
          >
            <option value="">Select...</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
            <Target className="w-4 h-4 text-brand-green" />
            Training goals
          </label>
          <p className="text-xs text-text-secondary mb-2.5">
            Choose one or more. Tap the star to set your <span className="text-brand-orange font-medium">primary</span> goal.
          </p>
          <div className="flex flex-wrap gap-2">
            {PLAN_CATEGORIES.map((cat) => {
              const selected = goals.includes(cat);
              const isPrimary = primaryGoal === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleGoal(cat)}
                  className={`group inline-flex items-center gap-1.5 px-3 py-2 rounded-pill text-xs border transition-all ${
                    selected
                      ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                      : 'border-hairline bg-bg-elevated text-text-secondary hover:border-hairline-strong'
                  }`}
                >
                  <span className="font-medium">{goalLabels[cat]}</span>
                  {selected && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); makePrimary(cat); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); makePrimary(cat); } }}
                      title={isPrimary ? 'Primary goal' : 'Set as primary'}
                    >
                      <Star className={`w-3.5 h-3.5 ${isPrimary ? 'fill-brand-orange text-brand-orange' : 'text-text-secondary/60 hover:text-brand-orange'}`} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Button onClick={handleSave} disabled={updateProfile.isPending} className="w-full">
          {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>

        {updateProfile.isSuccess && (
          <p className="text-sm text-green-500">Changes saved.</p>
        )}
        {updateProfile.isError && (
          <p className="text-sm text-red-500">{updateProfile.error.message}</p>
        )}
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-lg">Account</h2>
        <Button variant="danger" className="w-full" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </Button>
      </Card>
    </div>
  );
}
