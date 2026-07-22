'use client';

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Search, ChevronLeft, Loader2, Dumbbell, Play, Wand2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import { getTutorialUrl } from '@/lib/exerciseData';
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

const EXERCISE_CATS = ['', 'resistance', 'cardio', 'bodyweight', 'plyo', 'mobility', 'time'];

export default function CustomPlanBuilderPage() {
  const router = useRouter();

  const [planName, setPlanName] = useState('');
  const [category, setCategory] = useState('strength');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [days, setDays] = useState<Day[]>([{ title: 'Day 1', exercises: [] }]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDayIndex, setPickerDayIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  // Separate "committed" values that the query uses — only updated when picker opens/changes
  const [querySearch, setQuerySearch] = useState('');
  const [queryFilterCat, setQueryFilterCat] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Always fetch when picker is open; use dedicated query key to avoid cache conflicts
  const { data: exerciseData, isLoading: exLoading, refetch } = useQuery({
    queryKey: ['picker-exercises', querySearch, queryFilterCat],
    queryFn: () =>
      api.getExercises({
        q: querySearch || undefined,
        category: queryFilterCat || undefined,
        limit: '50',
      }),
    enabled: pickerOpen,
    staleTime: 30_000,
  });

  // When search/filter changes inside picker, update query values with a tiny debounce
  useEffect(() => {
    if (!pickerOpen) return;
    const t = setTimeout(() => {
      setQuerySearch(search);
      setQueryFilterCat(filterCat);
    }, 300);
    return () => clearTimeout(t);
  }, [search, filterCat, pickerOpen]);

  function openPicker(dayIdx: number) {
    setPickerDayIndex(dayIdx);
    setSearch('');
    setFilterCat('');
    setQuerySearch('');
    setQueryFilterCat('');
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
                  tutorialUrl: getTutorialUrl(ex.name, ex.tutorialUrl) || null,
                  instructions: ex.instructions || [],
                  cues: ex.cues || [],
                  sets: 3,
                  repsScheme: ex.category === 'cardio' || ex.category === 'time' ? '10 min' : '8–12',
                  restSec: ex.category === 'cardio' ? 30 : 60,
                },
              ],
            }
          : day,
      ),
    );
    setPickerOpen(false);
  }

  function removeDay(idx: number) {
    setDays((d) => d.filter((_, i) => i !== idx));
  }

  function updateDayTitle(idx: number, title: string) {
    setDays((d) => d.map((day, i) => (i === idx ? { ...day, title } : day)));
  }

  function removeExercise(dayIdx: number, exIdx: number) {
    setDays((d) =>
      d.map((day, i) =>
        i === dayIdx ? { ...day, exercises: day.exercises.filter((_, j) => j !== exIdx) } : day,
      ),
    );
  }

  function updateExercise(dayIdx: number, exIdx: number, field: keyof SelectedExercise, value: any) {
    setDays((d) =>
      d.map((day, i) =>
        i === dayIdx
          ? { ...day, exercises: day.exercises.map((ex, j) => (j === exIdx ? { ...ex, [field]: value } : ex)) }
          : day,
      ),
    );
  }

  async function handleSave() {
    if (!planName.trim()) { setError('Give your plan a name first'); return; }
    if (!days.some((d) => d.exercises.length > 0)) { setError('Add at least one exercise to a day'); return; }
    setSaving(true);
    setError('');
    try {
      await api.createCustomPlan({
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
    <div className="space-y-6 pb-28 lg:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-text-primary p-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-brand-orange" /> Custom Plan Builder
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">Design your own training split</p>
        </div>
      </div>

      {/* Plan Info */}
      <Card className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Plan name <span className="text-danger">*</span></label>
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
              {PLAN_CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabels[c]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-4 py-3 bg-bg-elevated border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-brand-orange capitalize">
              {DIFFICULTY_LEVELS.map((d) => <option key={d} value={d}>{d}</option>)}
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
              className="flex-1 bg-transparent font-semibold text-lg focus:outline-none border-b border-transparent focus:border-brand-orange pb-0.5 transition-colors"
            />
            {days.length > 1 && (
              <button onClick={() => removeDay(dayIdx)} className="text-text-secondary hover:text-danger transition-colors p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {day.exercises.length > 0 && (
            <div className="space-y-3">
              {day.exercises.map((ex, exIdx) => (
                <div key={exIdx} className="p-3 rounded-xl bg-bg-elevated border border-white/5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{ex.name}</p>
                      <p className="text-xs text-text-secondary capitalize mt-0.5">
                        {ex.primaryMuscles?.slice(0, 2).join(', ')} · {ex.category}
                      </p>
                    </div>
                    <button onClick={() => removeExercise(dayIdx, exIdx)} className="text-text-secondary hover:text-danger transition-colors shrink-0 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Sets', field: 'sets' as const, type: 'number', value: ex.sets, min: 1, max: 20 },
                      { label: 'Reps / Time', field: 'repsScheme' as const, type: 'text', value: ex.repsScheme },
                      { label: 'Rest (sec)', field: 'restSec' as const, type: 'number', value: ex.restSec, min: 0, max: 600 },
                    ].map(({ label, field, type, value, min, max }) => (
                      <div key={field}>
                        <label className="block text-[10px] text-text-secondary mb-1">{label}</label>
                        <input
                          type={type}
                          value={value}
                          min={min}
                          max={max}
                          onChange={(e) =>
                            updateExercise(dayIdx, exIdx, field,
                              type === 'number' ? (parseInt(e.target.value) || (min ?? 0)) : e.target.value)
                          }
                          className="w-full px-2 py-2 bg-bg-surface border border-white/10 rounded-lg text-center text-sm focus:outline-none focus:border-brand-orange"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => openPicker(dayIdx)}
            className="w-full py-3 border-2 border-dashed border-white/15 rounded-xl text-text-secondary hover:border-brand-orange hover:text-brand-orange transition-all flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add exercise to {day.title}
          </button>
        </Card>
      ))}

      {/* Add Day */}
      <button
        onClick={() => setDays((d) => [...d, { title: `Day ${d.length + 1}`, exercises: [] }])}
        className="w-full py-3 border-2 border-dashed border-white/15 rounded-xl text-text-secondary hover:border-white/30 hover:text-text-primary transition-all flex items-center justify-center gap-2 font-medium text-sm"
      >
        <Plus className="w-4 h-4" />
        Add another training day
      </button>

      {error && (
        <p className="text-sm text-danger bg-danger/10 border border-danger/20 px-4 py-3 rounded-xl">{error}</p>
      )}

      {/* Save button — fixed on mobile */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-2 bg-gradient-to-t from-bg-base via-bg-base/90 to-transparent pt-4 lg:relative lg:bottom-auto lg:px-0 lg:bg-none lg:pt-0 lg:pb-0">
        <Button className="w-full" onClick={handleSave} disabled={saving || !planName.trim()}>
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <><Play className="w-4 h-4 mr-2" />Save &amp; Start Plan{totalExercises > 0 ? ` · ${totalExercises} exercises` : ''}</>
          )}
        </Button>
      </div>

      {/* ── Exercise Picker Modal ── */}
      {pickerOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-bg-base border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg flex flex-col"
            style={{ maxHeight: '90vh' }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 shrink-0">
              <h3 className="font-semibold">Add to &quot;{days[pickerDayIndex]?.title}&quot;</h3>
              <button
                onClick={() => setPickerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-surface text-text-secondary hover:text-text-primary transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* Search + filters */}
            <div className="px-4 py-3 space-y-3 shrink-0 border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or muscle..."
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-bg-surface border border-white/10 rounded-xl text-sm placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {EXERCISE_CATS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilterCat(c)}
                    className={`px-3 py-1.5 rounded-pill text-xs border capitalize whitespace-nowrap shrink-0 transition-all ${
                      filterCat === c
                        ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                        : 'border-white/10 text-text-secondary hover:border-white/20'
                    }`}
                  >
                    {c || 'All'}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise list */}
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {exLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
                  <p className="text-sm text-text-secondary">Loading exercises…</p>
                </div>
              ) : !exerciseData?.exercises?.length ? (
                <div className="text-center py-12">
                  <Dumbbell className="w-10 h-10 text-text-secondary mx-auto mb-3 opacity-30" />
                  <p className="text-text-secondary text-sm">No exercises found</p>
                  <p className="text-text-secondary text-xs mt-1">Try a different search term</p>
                </div>
              ) : (
                exerciseData.exercises.map((ex: any) => {
                  const alreadyAdded = days[pickerDayIndex]?.exercises.some((e) => e.exerciseId === ex.id);
                  return (
                    <button
                      key={ex.id}
                      disabled={alreadyAdded}
                      onClick={() => addExerciseToDayFromPicker(ex)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        alreadyAdded
                          ? 'opacity-40 cursor-not-allowed border-white/5 bg-bg-surface/50'
                          : 'border-white/10 bg-bg-surface hover:border-brand-orange/60 hover:bg-brand-orange/5 active:scale-[0.98]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center shrink-0">
                        <Dumbbell className="w-5 h-5 text-text-secondary opacity-60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{ex.name}</p>
                        <p className="text-xs text-text-secondary capitalize mt-0.5 truncate">
                          {ex.primaryMuscles?.slice(0, 2).join(', ')} · {ex.category} · {ex.difficulty}
                        </p>
                      </div>
                      {alreadyAdded ? (
                        <span className="text-xs text-text-secondary shrink-0 px-2 py-1 rounded-pill bg-bg-elevated">Added</span>
                      ) : (
                        <div className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center shrink-0">
                          <Plus className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
