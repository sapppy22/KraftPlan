'use client';

export const runtime = 'edge';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Search, ChevronLeft, Loader2, Dumbbell, Play } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PLAN_CATEGORIES, DIFFICULTY_LEVELS } from '@kraftplan/shared';

interface SelectedExercise {
  exerciseId: string;
  name: string;
  category: string;
  primaryMuscles: string[];
  tutorialUrl: string | null;
  instructions: string[];
  cues: string[];
  sets: number;
  repsScheme: string;
  restSec: number;
}

interface Day {
  title: string;
  exercises: SelectedExercise[];
}

const categoryLabels: Record<string, string> = {
  mobility: 'Mobility', strength: 'Strength', hypertrophy: 'Hypertrophy',
  powerlifting: 'Powerlifting', hyrox: 'Hyrox', endurance: 'Endurance',
  athletic: 'Athletic', conditioning: 'Conditioning', weightloss: 'Weight Loss',
};

export default function CustomPlanBuilderPage() {
  const router = useRouter();

  // Plan metadata
  const [planName, setPlanName] = useState('');
  const [category, setCategory] = useState('strength');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [days, setDays] = useState<Day[]>([{ title: 'Day 1', exercises: [] }]);

  // Exercise picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDayIndex, setPickerDayIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: exerciseData, isLoading: exLoading } = useQuery({
    queryKey: ['exercises', search, filterCat],
    queryFn: () => api.getExercises({ q: search || undefined, category: filterCat || undefined, limit: '40' }),
    enabled: pickerOpen,
  });

  function addDay() {
    setDays((d) => [...d, { title: `Day ${d.length + 1}`, exercises: [] }]);
  }

  function removeDay(idx: number) {
    setDays((d) => d.filter((_, i) => i !== idx));
  }

  function updateDayTitle(idx: number, title: string) {
    setDays((d) => d.map((day, i) => i === idx ? { ...day, title } : day));
  }

  function openPicker(dayIdx: number) {
    setPickerDayIndex(dayIdx);
    setSearch('');
    setFilterCat('');
    setPickerOpen(true);
  }

  function addExerciseToDayFromPicker(ex: any) {
    setDays((d) =>
      d.map((day, i) =>
        i === pickerDayIndex
          ? {
              ...day,
              exercises: [
                ...day.exercises,
                {
                  exerciseId: ex.id,
                  name: ex.name,
                  category: ex.category,
                  primaryMuscles: ex.primaryMuscles || [],
                  tutorialUrl: ex.tutorialUrl || null,
                  instructions: ex.instructions || [],
                  cues: ex.cues || [],
                  sets: 3,
                  repsScheme: ex.category === 'cardio' ? '10 min' : '8–12',
                  restSec: ex.category === 'cardio' ? 30 : 60,
                },
              ],
            }
          : day
      )
    );
    setPickerOpen(false);
  }

  function removeExercise(dayIdx: number, exIdx: number) {
    setDays((d) =>
      d.map((day, i) =>
        i === dayIdx ? { ...day, exercises: day.exercises.filter((_, j) => j !== exIdx) } : day
      )
    );
  }

  function updateExercise(dayIdx: number, exIdx: number, field: keyof SelectedExercise, value: any) {
    setDays((d) =>
      d.map((day, i) =>
        i === dayIdx
          ? {
              ...day,
              exercises: day.exercises.map((ex, j) =>
                j === exIdx ? { ...ex, [field]: value } : ex
              ),
            }
          : day
      )
    );
  }

  async function handleSave() {
    if (!planName.trim()) { setError('Give your plan a name first'); return; }
    const hasSomeExercise = days.some((d) => d.exercises.length > 0);
    if (!hasSomeExercise) { setError('Add at least one exercise to a day'); return; }

    setSaving(true);
    setError('');
    try {
      const result = await api.createCustomPlan({
        title: planName,
        category,
        difficulty,
        daysPerWeek: days.length,
        description: `Custom plan: ${planName}`,
        days: days.map((d) => ({
          title: d.title,
          exercises: d.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            name: ex.name,
            sets: ex.sets,
            repsScheme: ex.repsScheme,
            restSec: ex.restSec,
            category: ex.category,
            primaryMuscles: ex.primaryMuscles,
            tutorialUrl: ex.tutorialUrl,
            instructions: ex.instructions,
            cues: ex.cues,
          })),
        })),
      });
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  }

  const totalExercises = days.reduce((s, d) => s + d.exercises.length, 0);

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-text-primary">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold">Custom Plan Builder</h1>
          <p className="text-text-secondary text-sm mt-0.5">Build your own training plan</p>
        </div>
      </div>

      {/* Plan Info */}
      <Card className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Plan name</label>
          <input
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="e.g. My Push Pull Legs"
            className="w-full px-4 py-3 bg-bg-elevated border border-white/10 rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-bg-elevated border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-brand-orange">
              {PLAN_CATEGORIES.map((c) => (
                <option key={c} value={c}>{categoryLabels[c] || c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-4 py-3 bg-bg-elevated border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-brand-orange capitalize">
              {DIFFICULTY_LEVELS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Days */}
      {days.map((day, dayIdx) => (
        <Card key={dayIdx} className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={day.title}
              onChange={(e) => updateDayTitle(dayIdx, e.target.value)}
              className="flex-1 bg-transparent font-semibold text-lg focus:outline-none border-b border-transparent focus:border-brand-orange pb-0.5"
            />
            {days.length > 1 && (
              <button onClick={() => removeDay(dayIdx)} className="text-text-secondary hover:text-danger transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Exercises */}
          {day.exercises.length > 0 && (
            <div className="space-y-3">
              {day.exercises.map((ex, exIdx) => (
                <div key={exIdx} className="p-3 rounded-xl bg-bg-elevated space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{ex.name}</p>
                      <p className="text-xs text-text-secondary capitalize mt-0.5">
                        {ex.primaryMuscles?.slice(0, 2).join(', ')} · {ex.category}
                      </p>
                    </div>
                    <button onClick={() => removeExercise(dayIdx, exIdx)} className="text-text-secondary hover:text-danger">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-text-secondary mb-1">Sets</label>
                      <input type="number" min={1} max={20} value={ex.sets}
                        onChange={(e) => updateExercise(dayIdx, exIdx, 'sets', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1.5 bg-bg-surface border border-white/10 rounded-lg text-center text-sm focus:outline-none focus:border-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-secondary mb-1">Reps / Time</label>
                      <input type="text" value={ex.repsScheme}
                        onChange={(e) => updateExercise(dayIdx, exIdx, 'repsScheme', e.target.value)}
                        className="w-full px-2 py-1.5 bg-bg-surface border border-white/10 rounded-lg text-center text-sm focus:outline-none focus:border-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-secondary mb-1">Rest (sec)</label>
                      <input type="number" min={0} max={600} value={ex.restSec}
                        onChange={(e) => updateExercise(dayIdx, exIdx, 'restSec', parseInt(e.target.value) || 60)}
                        className="w-full px-2 py-1.5 bg-bg-surface border border-white/10 rounded-lg text-center text-sm focus:outline-none focus:border-brand-orange" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => openPicker(dayIdx)}
            className="w-full py-3 border border-dashed border-white/20 rounded-xl text-text-secondary hover:border-brand-orange hover:text-brand-orange transition-all flex items-center justify-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Add exercise
          </button>
        </Card>
      ))}

      {/* Add Day */}
      <button onClick={addDay}
        className="w-full py-3 border border-dashed border-white/20 rounded-xl text-text-secondary hover:border-brand-orange hover:text-brand-orange transition-all flex items-center justify-center gap-2 font-medium">
        <Plus className="w-4 h-4" />
        Add another day
      </button>

      {/* Error */}
      {error && <p className="text-sm text-danger bg-danger/10 border border-danger/20 px-4 py-3 rounded-xl">{error}</p>}

      {/* Save */}
      <div className="fixed bottom-20 left-0 right-0 px-4 lg:relative lg:bottom-auto lg:px-0">
        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <><Play className="w-4 h-4 mr-2" />Save & Start Plan ({totalExercises} exercises)</>
          )}
        </Button>
      </div>

      {/* Exercise Picker Modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center">
          <div className="bg-bg-base border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-semibold">Add to {days[pickerDayIndex]?.title}</h3>
              <button onClick={() => setPickerOpen(false)} className="text-text-secondary hover:text-text-primary text-xl leading-none">×</button>
            </div>

            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search exercises..."
                  className="w-full pl-10 pr-4 py-2.5 bg-bg-surface border border-white/10 rounded-xl text-sm placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange" />
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setFilterCat('')}
                  className={`px-3 py-1 rounded-pill text-xs border transition-all ${!filterCat ? 'border-brand-orange bg-brand-orange/10 text-brand-orange' : 'border-white/10 text-text-secondary'}`}>
                  All
                </button>
                {['resistance','cardio','bodyweight','plyo','mobility','time'].map((c) => (
                  <button key={c} onClick={() => setFilterCat(filterCat === c ? '' : c)}
                    className={`px-3 py-1 rounded-pill text-xs border capitalize transition-all ${filterCat === c ? 'border-brand-orange bg-brand-orange/10 text-brand-orange' : 'border-white/10 text-text-secondary'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-4 pb-4 space-y-2">
              {exLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-brand-orange" /></div>
              ) : exerciseData?.exercises?.map((ex: any) => {
                const alreadyAdded = days[pickerDayIndex]?.exercises.some((e) => e.exerciseId === ex.id);
                return (
                  <button key={ex.id} disabled={alreadyAdded}
                    onClick={() => addExerciseToDayFromPicker(ex)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      alreadyAdded ? 'opacity-40 cursor-not-allowed border-white/5 bg-bg-surface' :
                      'border-white/10 bg-bg-surface hover:border-brand-orange/50'
                    }`}>
                    <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center shrink-0">
                      <Dumbbell className="w-5 h-5 text-text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{ex.name}</p>
                      <p className="text-xs text-text-secondary capitalize mt-0.5">
                        {ex.primaryMuscles?.slice(0, 2).join(', ')} · {ex.category}
                      </p>
                    </div>
                    {alreadyAdded ? (
                      <span className="text-xs text-text-secondary shrink-0">Added</span>
                    ) : (
                      <Plus className="w-4 h-4 text-brand-orange shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
