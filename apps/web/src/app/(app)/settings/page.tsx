'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Loader2, Dumbbell, LogOut } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function SettingsPage() {
  const router = useRouter();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.getProfile(),
  });

  const [name, setName] = useState('');
  const [units, setUnits] = useState('metric');
  const [experience, setExperience] = useState('');

  function handleLogout() {
    localStorage.removeItem('accessToken');
    router.push('/login');
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0 max-w-lg">
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-text-secondary mt-1">Manage your profile and preferences</p>
      </div>

      {/* Profile */}
      <Card className="p-6 space-y-5">
        <h2 className="font-semibold text-lg">Profile</h2>

        <div>
          <label className="block text-sm font-medium mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-bg-elevated border border-white/10 rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-blue"
            placeholder={profile?.name || 'Your name'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Units</label>
          <select
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            className="w-full px-4 py-3 bg-bg-elevated border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent-blue"
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
            className="w-full px-4 py-3 bg-bg-elevated border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-accent-blue"
          >
            <option value="">Select...</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
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
