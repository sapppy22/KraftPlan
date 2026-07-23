'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, ChevronRight, UserCircle2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import Button from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
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
    <div className="min-h-screen flex flex-col justify-between px-4 py-8 bg-bg-base relative transition-colors duration-300">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-4xl mx-auto w-full">
        <Link href="/" aria-label="KraftPlan Home">
          <Logo size={36} wordmarkClassName="text-lg" />
        </Link>
        <ThemeToggle variant="compact" />
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-md space-y-6 bg-bg-surface p-6 sm:p-8 rounded-3xl border border-hairline shadow-xl">
          <div className="text-center">
            <Logo size={56} showWordmark={false} className="mx-auto mb-3" />
            <h1 className="font-display text-3xl font-bold">
              {step === 'account' ? 'Create account' : 'Your body stats'}
            </h1>
            <p className="text-text-secondary text-sm mt-1.5">
              {step === 'account' ? 'Join KraftPlan today' : 'Help us personalise your plan'}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <div className={`flex-1 h-1.5 rounded-full transition-all ${step === 'account' ? 'bg-brand-orange' : 'bg-brand-orange'}`} />
            <div className={`flex-1 h-1.5 rounded-full transition-all ${step === 'body' ? 'bg-brand-orange' : 'bg-surface-2'}`} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 'account' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-elevated border border-hairline rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange text-sm"
                    placeholder="Alex Johnson"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-elevated border border-hairline rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange text-sm"
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
                      className="w-full px-4 py-3 pr-12 bg-bg-elevated border border-hairline rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange text-sm"
                      placeholder="At least 8 characters"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                    >
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
                      className="w-full px-4 py-3 bg-bg-elevated border border-hairline rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange text-sm"
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
                      className="w-full px-4 py-3 bg-bg-elevated border border-hairline rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange text-sm"
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
                        className={`py-2.5 rounded-xl border text-xs font-semibold capitalize transition-all ${
                          experience === lvl
                            ? 'border-brand-orange bg-brand-orange/15 text-brand-orange shadow-sm'
                            : 'border-hairline bg-surface-1 text-text-secondary hover:bg-surface-2'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goal */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Primary goal <span className="text-text-secondary font-normal">(optional)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {PLAN_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setGoal(goal === cat ? '' : cat)}
                        className={`px-3 py-2 rounded-xl border text-left text-xs font-medium transition-all ${
                          goal === cat
                            ? 'border-brand-orange bg-brand-orange/15 text-brand-orange shadow-sm font-semibold'
                            : 'border-hairline bg-surface-1 text-text-secondary hover:bg-surface-2'
                        }`}
                      >
                        {goalLabels[cat]}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs">{error}</div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('account')}
                    className="px-4 py-3 bg-surface-1 border border-hairline rounded-xl text-text-secondary text-sm font-medium hover:bg-surface-2"
                  >
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
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-bg-surface text-text-secondary font-medium">OR</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full gap-2 text-sm"
            onClick={continueAsGuest}
          >
            <UserCircle2 className="w-5 h-5 text-brand-orange" />
            Continue as Guest
          </Button>

          <p className="text-center text-xs text-text-secondary pt-2">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-orange hover:underline font-bold">
              Log in
            </Link>
          </p>
        </div>
      </main>

      <footer className="text-center text-xs text-text-secondary max-w-4xl mx-auto w-full">
        &copy; {new Date().getFullYear()} KraftPlan. All rights reserved.
      </footer>
    </div>
  );
}
