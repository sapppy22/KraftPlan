'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Loader2, Dumbbell, LogOut, Check, SunMoon } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.getProfile(),
  });

  const [name, setName] = useState('');
  const [units, setUnits] = useState('metric');
  const [experience, setExperience] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setUnits(profile.units || 'metric');
      setExperience(profile.experience || '');
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async (data: any) => api.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });

  function handleSave() {
    updateProfile.mutate({ name, units, ...(experience ? { experience } : {}) });
  }

  function handleLogout() {
    localStorage.removeItem('accessToken');
    router.push('/login');
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
