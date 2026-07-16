'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { api } from '@/lib/api/client';
import { PLAN_CATEGORIES, DIFFICULTY_LEVELS, EQUIPMENT_TYPES } from '@kraftplan/shared';

type Step = 'body' | 'goal' | 'experience' | 'equipment' | 'schedule' | 'done';

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

const stepLabels: Record<Step, string> = {
  body: 'Your body stats',
  goal: "What's your goal?",
  experience: 'Your experience level',
  equipment: 'Available equipment',
  schedule: 'Your schedule',
  done: 'Ready to start!',
};

const stepsOrder: Step[] = ['body', 'goal', 'experience', 'equipment', 'schedule', 'done'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('body');

  // Body stats
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');

  // Plan prefs
  const [goal, setGoal] = useState('');
  const [experience, setExperience] = useState('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [sessionLength, setSessionLength] = useState(45);
  const [loading, setLoading] = useState(false);

  function toggleEquipment(item: string) {
    setEquipment((prev) => prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]);
  }

  function next() {
    const idx = stepsOrder.indexOf(step);
    if (idx < stepsOrder.length - 1) setStep(stepsOrder[idx + 1]);
  }

  async function completeOnboarding() {
    setLoading(true);
    try {
      // Save body stats + goal to profile
      await api.updateProfile({
        bodyweightKg: weightKg ? parseFloat(weightKg) : undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        goal: goal || undefined,
        experience: experience || undefined,
      }).catch(() => {});

      // Assign best matching plan
      const plans = await api.getPlans({ category: goal || undefined, difficulty: experience || undefined });
      if (plans.length > 0) {
        await api.assignPlan({ planId: plans[0].id, startDate: new Date().toISOString().split('T')[0] });
      }
      router.push('/dashboard');
    } catch {
      router.push('/dashboard');
    }
  }

  const currentIdx = stepsOrder.indexOf(step);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="flex items-center gap-1.5 mb-8">
          {stepsOrder.map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                currentIdx > i ? 'gradient-bg text-white' :
                currentIdx === i ? 'border-2 border-brand-orange text-brand-orange' :
                'bg-bg-surface text-text-secondary'
              }`}>
                {currentIdx > i ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < stepsOrder.length - 1 && (
                <div className={`flex-1 h-0.5 transition-all ${currentIdx > i ? 'bg-brand-orange' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        <h2 className="font-display text-3xl font-bold mb-1">{stepLabels[step]}</h2>

        {/* BODY STATS */}
        {step === 'body' && (
          <div className="mt-6 space-y-5">
            <p className="text-text-secondary">This helps us personalise your plan and track your BMI & progress.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Weight (kg)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-surface border border-white/10 rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange"
                  placeholder="70"
                  min={20} max={300}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Height (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-surface border border-white/10 rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange"
                  placeholder="175"
                  min={100} max={250}
                />
              </div>
            </div>
            {weightKg && heightCm && (
              <div className="p-4 rounded-xl bg-bg-surface border border-white/10">
                <p className="text-sm text-text-secondary">BMI</p>
                <p className="text-2xl font-bold mt-0.5">
                  {(parseFloat(weightKg) / Math.pow(parseFloat(heightCm) / 100, 2)).toFixed(1)}
                </p>
              </div>
            )}
            <Button className="w-full" onClick={next}>
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <button onClick={next} className="w-full text-sm text-text-secondary hover:text-text-primary">
              Skip for now
            </button>
          </div>
        )}

        {/* GOAL */}
        {step === 'goal' && (
          <div className="grid grid-cols-2 gap-3 mt-6">
            {PLAN_CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => { setGoal(cat); next(); }}
                className={`p-4 rounded-xl border text-left transition-all ${
                  goal === cat ? 'border-brand-orange bg-brand-orange/10' : 'border-white/10 bg-bg-surface hover:border-white/20'
                }`}>
                <span className="text-sm font-medium">{goalLabels[cat]}</span>
              </button>
            ))}
          </div>
        )}

        {/* EXPERIENCE */}
        {step === 'experience' && (
          <div className="grid gap-3 mt-6">
            {DIFFICULTY_LEVELS.map((level) => (
              <button key={level} onClick={() => { setExperience(level); next(); }}
                className={`p-4 rounded-xl border text-left capitalize transition-all ${
                  experience === level ? 'border-brand-orange bg-brand-orange/10' : 'border-white/10 bg-bg-surface hover:border-white/20'
                }`}>
                <span className="font-medium">{level}</span>
                <p className="text-xs text-text-secondary mt-1">
                  {level === 'beginner' ? 'Less than 1 year of consistent training' :
                   level === 'intermediate' ? '1–3 years of consistent training' :
                   '3+ years, familiar with periodisation'}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* EQUIPMENT */}
        {step === 'equipment' && (
          <>
            <p className="text-text-secondary mt-2">Select all that you have access to</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {EQUIPMENT_TYPES.map((eq) => (
                <button key={eq} onClick={() => toggleEquipment(eq)}
                  className={`px-4 py-2 rounded-pill text-sm border transition-all capitalize ${
                    equipment.includes(eq) ? 'border-brand-orange bg-brand-orange/10 text-brand-orange' : 'border-white/10 bg-bg-surface text-text-secondary'
                  }`}>
                  {eq.replace(/-/g, ' ')}
                </button>
              ))}
            </div>
            <Button className="mt-8 w-full" onClick={next}>
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </>
        )}

        {/* SCHEDULE */}
        {step === 'schedule' && (
          <div className="space-y-6 mt-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Days per week: <span className="text-brand-orange font-bold">{daysPerWeek}</span>
              </label>
              <input type="range" min={2} max={7} value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
                className="w-full accent-brand-orange" />
              <div className="flex justify-between text-xs text-text-secondary mt-1"><span>2</span><span>7</span></div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Session length: <span className="text-brand-orange font-bold">{sessionLength} min</span>
              </label>
              <input type="range" min={15} max={90} step={5} value={sessionLength}
                onChange={(e) => setSessionLength(parseInt(e.target.value))}
                className="w-full accent-brand-orange" />
              <div className="flex justify-between text-xs text-text-secondary mt-1"><span>15 min</span><span>90 min</span></div>
            </div>
            <Button className="w-full" onClick={next}>
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* DONE */}
        {step === 'done' && (
          <div className="mt-6 space-y-6">
            <div className="p-6 card-surface rounded-2xl text-center">
              <Logo size={64} showWordmark={false} className="mx-auto mb-4" />
              <h3 className="text-xl font-bold">All set!</h3>
              <p className="text-text-secondary mt-2 text-sm">
                We'll match you with the best {goal ? goalLabels[goal]?.toLowerCase() : ''} plan for your profile.
              </p>
              {weightKg && heightCm && (
                <div className="grid grid-cols-2 gap-3 mt-4 text-left">
                  <div className="p-3 rounded-xl bg-bg-elevated">
                    <p className="text-xs text-text-secondary">Weight</p>
                    <p className="font-bold">{weightKg} kg</p>
                  </div>
                  <div className="p-3 rounded-xl bg-bg-elevated">
                    <p className="text-xs text-text-secondary">Height</p>
                    <p className="font-bold">{heightCm} cm</p>
                  </div>
                </div>
              )}
            </div>
            <Button className="w-full" onClick={completeOnboarding} disabled={loading}>
              {loading ? 'Setting up your plan...' : 'Start your journey'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
