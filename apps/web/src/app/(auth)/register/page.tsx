'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, ChevronRight, UserCircle2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import Button from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { PLAN_CATEGORIES, EXPERIENCE_LEVELS } from '@kraftplan/shared';
import { useAuth } from '@/lib/AuthContext';

const goalLabels: Record<string, string> = {
  mobility: 'Mobility & Recovery',
  strength: 'General Strength',
  hypertrophy: 'Lean Muscle / Hypertrophy',
  powerlifting: 'Powerlifting',
  hyrox: 'Hyrox / Hybrid Fitness',
  endurance: 'Endurance',
  athletic: 'Athletic Performance',
  conditioning: 'Cross-Training',
  weightloss: 'Weight Loss',
};

type Step = 'account' | 'body';

export default function RegisterPage() {
  const router = useRouter();
  const { login: setAuth, continueAsGuest } = useAuth();
  const [step, setStep] = useState<Step>('account');

  // Account
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Body stats
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [experience, setExperience] = useState('beginner');
  const [goal, setGoal] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 'account') {
      setStep('body');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.register({
        email,
        password,
        name,
        experience: experience as any,
        bodyweightKg: weightKg ? parseFloat(weightKg) : undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        goal: goal || undefined,
      });
      setAuth(res.accessToken, res.user);
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Logo size={56} showWordmark={false} className="mx-auto mb-4" />
          <h1 className="font-display text-3xl font-bold">
            {step === 'account' ? 'Create account' : 'Your body stats'}
          </h1>
          <p className="text-text-secondary mt-2">
            {step === 'account' ? 'Join KraftPlan today' : 'Help us personalise your plan'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <div className={`flex-1 h-1 rounded-full transition-all ${step === 'account' ? 'bg-brand-orange' : 'bg-brand-orange'}`} />
          <div className={`flex-1 h-1 rounded-full transition-all ${step === 'body' ? 'bg-brand-orange' : 'bg-surface-2'}`} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'account' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1.5">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-surface border border-hairline rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange"
                  placeholder="Alex"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-surface border border-hairline rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-bg-surface border border-hairline rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange"
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full">
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          )}

          {step === 'body' && (
            <>
              {/* Weight & Height */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Weight (kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-surface border border-hairline rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange"
                    placeholder="70"
                    min={20}
                    max={300}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Height (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-surface border border-hairline rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange"
                    placeholder="175"
                    min={100}
                    max={250}
                  />
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium mb-2">Experience level</label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExperience(lvl)}
                      className={`py-2.5 rounded-xl border text-sm font-medium capitalize transition-all ${
                        experience === lvl
                          ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                          : 'border-hairline bg-bg-surface text-text-secondary'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal */}
              <div>
                <label className="block text-sm font-medium mb-2">Primary goal <span className="text-text-secondary font-normal">(optional)</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {PLAN_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setGoal(goal === cat ? '' : cat)}
                      className={`px-3 py-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                        goal === cat
                          ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                          : 'border-hairline bg-bg-surface text-text-secondary'
                      }`}
                    >
                      {goalLabels[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">{error}</div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep('account')}
                  className="px-4 py-3 bg-bg-surface border border-hairline rounded-xl text-text-secondary text-sm">
                  Back
                </button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create account'}
                </Button>
              </div>
            </>
          )}
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-hairline"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-bg-base text-text-secondary">or</span>
          </div>
        </div>

        <Button 
          type="button" 
          variant="secondary" 
          className="w-full gap-2" 
          onClick={continueAsGuest}
        >
          <UserCircle2 className="w-5 h-5" />
          Continue as Guest
        </Button>

        <p className="text-center text-sm text-text-secondary pt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-orange hover:underline font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
