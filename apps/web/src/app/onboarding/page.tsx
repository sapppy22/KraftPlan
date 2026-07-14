'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, ChevronRight, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api/client';
import { PLAN_CATEGORIES, DIFFICULTY_LEVELS, EQUIPMENT_TYPES } from '@forgefit/shared';

type Step = 'goal' | 'experience' | 'equipment' | 'schedule' | 'plan';

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

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('goal');
  const [goal, setGoal] = useState('');
  const [experience, setExperience] = useState('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [sessionLength, setSessionLength] = useState(45);
  const [loading, setLoading] = useState(false);

  function toggleEquipment(item: string) {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item],
    );
  }

  async function completeOnboarding() {
    setLoading(true);
    // For demo, just assign a plan and go to dashboard
    try {
      const plans = await api.getPlans({ category: goal });
      if (plans.length > 0) {
        await api.assignPlan({
          planId: plans[0].id,
          startDate: new Date().toISOString().split('T')[0],
        });
      }
      router.push('/dashboard');
    } catch {
      router.push('/dashboard');
    }
  }

  function getStepLabel(): string {
    const labels: Record<Step, string> = {
      goal: 'What\'s your goal?',
      experience: 'Your experience level',
      equipment: 'Available equipment',
      schedule: 'Your schedule',
      plan: 'Ready to start!',
    };
    return labels[step];
  }

  const stepsOrder: Step[] = ['goal', 'experience', 'equipment', 'schedule', 'plan'];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {stepsOrder.map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  stepsOrder.indexOf(step) >= i
                    ? 'gradient-bg text-white'
                    : 'bg-bg-surface text-text-secondary'
                }`}
              >
                {stepsOrder.indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < stepsOrder.length - 1 && (
                <div
                  className={`flex-1 h-0.5 transition-all ${
                    stepsOrder.indexOf(step) > i ? 'bg-accent-blue' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <h2 className="font-display text-3xl font-bold mb-2">{getStepLabel()}</h2>

        {step === 'goal' && (
          <div className="grid grid-cols-2 gap-3 mt-6">
            {PLAN_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setGoal(cat);
                  setStep('experience');
                }}
                className={`p-4 rounded-xl border text-left transition-all ${
                  goal === cat
                    ? 'border-accent-blue bg-accent-blue/10'
                    : 'border-white/10 bg-bg-surface hover:border-white/20'
                }`}
              >
                <span className="text-sm font-medium">{goalLabels[cat]}</span>
              </button>
            ))}
          </div>
        )}

        {step === 'experience' && (
          <div className="grid gap-3 mt-6">
            {DIFFICULTY_LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => {
                  setExperience(level);
                  setStep('equipment');
                }}
                className={`p-4 rounded-xl border text-left capitalize transition-all ${
                  experience === level
                    ? 'border-accent-blue bg-accent-blue/10'
                    : 'border-white/10 bg-bg-surface hover:border-white/20'
                }`}
              >
                <span className="font-medium">{level}</span>
              </button>
            ))}
          </div>
        )}

        {step === 'equipment' && (
          <>
            <p className="text-text-secondary mt-2">Select all equipment you have access to</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {EQUIPMENT_TYPES.map((eq) => (
                <button
                  key={eq}
                  onClick={() => toggleEquipment(eq)}
                  className={`px-4 py-2 rounded-pill text-sm border transition-all capitalize ${
                    equipment.includes(eq)
                      ? 'border-accent-blue bg-accent-blue/10 text-accent-blue'
                      : 'border-white/10 bg-bg-surface text-text-secondary hover:border-white/20'
                  }`}
                >
                  {eq.replace(/-/g, ' ')}
                </button>
              ))}
            </div>
            <Button className="mt-8 w-full" onClick={() => setStep('schedule')}>
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </>
        )}

        {step === 'schedule' && (
          <div className="space-y-6 mt-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Days per week: <span className="text-accent-blue">{daysPerWeek}</span>
              </label>
              <input
                type="range"
                min={2}
                max={7}
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
                className="w-full accent-accent-blue"
              />
              <div className="flex justify-between text-xs text-text-secondary mt-1">
                <span>2 days</span>
                <span>7 days</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Session length (min): <span className="text-accent-blue">{sessionLength}min</span>
              </label>
              <input
                type="range"
                min={15}
                max={90}
                step={5}
                value={sessionLength}
                onChange={(e) => setSessionLength(parseInt(e.target.value))}
                className="w-full accent-accent-blue"
              />
            </div>
            <Button className="w-full" onClick={() => setStep('plan')}>
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 'plan' && (
          <div className="mt-6 space-y-6">
            <div className="p-6 card-surface rounded-2xl text-center">
              <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">All set!</h3>
              <p className="text-text-secondary mt-2">
                We&apos;ll match you with the perfect {goalLabels[goal]?.toLowerCase()} plan based on your profile.
              </p>
            </div>
            <Button className="w-full" onClick={completeOnboarding} disabled={loading}>
              {loading ? 'Creating your plan...' : 'Start your journey'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
