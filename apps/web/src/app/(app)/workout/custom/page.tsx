'use client';

export const runtime = 'edge';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Search, ChevronLeft, Loader2, Dumbbell, Play } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { usePlayerStore } from '@/stores/playerStore';

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

export default function CustomWorkoutPage() {
  const router = useRouter();
  const playerStore = usePlayerStore();

  const [exercises, setExercises] = useState<SelectedExercise[]>([]);
  const [workoutTitle, setWorkoutTitle] = useState('Custom Workout');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const { data: exerciseData, isLoading: exLoading } = useQuery({
    queryKey: ['exercises-picker', search, filterCat],
    queryFn: () => api.getExercises({ q: search || undefined, category: filterCat || undefined, limit: '40' }),
    enabled: pickerOpen,
  });

  function addExercise(ex: any) {
    if (exercises.some((e) => e.exerciseId === ex.id)) return;
    setExercises((prev) => [
      ...prev,
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
    ]);
    setPickerOpen(false);
  }

  function removeExercise(idx: number) {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateExercise(idx: number, field: keyof SelectedExercise, value: any) {
    setExercises((prev) => prev.map((ex, i) => i === idx ? { ...ex, [field]: value } : ex));
  }

  async function startWorkout() {
    if (exercises.length === 0) { setError('Add at least one exercise'); return; }
    setStarting(true);
    setError('');
    try {
      const result = await api.startCustomSession({ exercises, title: workoutTitle });
      playerStore.initSession(result.sessionId, result.manifest);
      router.push(`/workout/${result.sessionId}`);
    } catch (e: any) {
      setError(e.message || 'Failed to start workout');
      setStarting(false);
    }
  }

  return (
    <div className="space-y-6 pb-32 lg:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-text-primary">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <input
            type="text"
            value={workoutTitle}
            onChange={(e) => setWorkoutTitle(e.target.value)}
            className="font-display text-2xl font-bold bg-transparent focus:outline-none w-full"
          />
          <p className="text-text-secondary text-sm mt-0.5">Ad-hoc workout — no plan needed</p>
        </div>
      </div>

      {/* Selected exercises */}
      {exercises.length > 0 && (
        <div className="space-y-3">
          {exercises.map((ex, idx) => (
            <Card key={ex.exerciseId} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{ex.name}</p>
                  <p className="text-xs text-text-secondary capitalize mt-0.5">
                    {ex.primaryMuscles?.slice(0, 2).join(', ')} · {ex.category}
                  </p>
                </div>
                <button onClick={() => removeExercise(idx)} className="text-text-secondary hover:text-danger">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-text-secondary mb-1">Sets</label>
                  <input type="number" min={1} max={20} value={ex.sets}
                    onChange={(e) => updateExercise(idx, 'sets', parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-1.5 bg-bg-surface border border-white/10 rounded-lg text-center text-sm focus:outline-none focus:border-brand-orange" />
                </div>
                <div>
                  <label className="block text-[10px] text-text-secondary mb-1">Reps / Time</label>
                  <input type="text" value={ex.repsScheme}
                    onChange={(e) => updateExercise(idx, 'repsScheme', e.target.value)}
                    className="w-full px-2 py-1.5 bg-bg-surface border border-white/10 rounded-lg text-center text-sm focus:outline-none focus:border-brand-orange" />
                </div>
                <div>
                  <label className="block text-[10px] text-text-secondary mb-1">Rest (sec)</label>
                  <input type="number" min={0} max={600} value={ex.restSec}
                    onChange={(e) => updateExercise(idx, 'restSec', parseInt(e.target.value) || 60)}
                    className="w-full px-2 py-1.5 bg-bg-surface border border-white/10 rounded-lg text-center text-sm focus:outline-none focus:border-brand-orange" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add exercise button */}
      <button onClick={() => { setSearch(''); setFilterCat(''); setPickerOpen(true); }}
        className="w-full py-4 border-2 border-dashed border-white/20 rounded-2xl text-text-secondary hover:border-brand-orange hover:text-brand-orange transition-all flex items-center justify-center gap-2 font-medium">
        <Plus className="w-5 h-5" />
        {exercises.length === 0 ? 'Add your first exercise' : 'Add another exercise'}
      </button>

      {error && <p className="text-sm text-danger bg-danger/10 border border-danger/20 px-4 py-3 rounded-xl">{error}</p>}

      {/* Start button */}
      <div className="fixed bottom-20 left-0 right-0 px-4 lg:relative lg:bottom-auto lg:px-0">
        <Button className="w-full" onClick={startWorkout} disabled={starting || exercises.length === 0}>
          {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <><Play className="w-4 h-4 mr-2 fill-white" />Start Workout ({exercises.length} exercises)</>
          )}
        </Button>
      </div>

      {/* Exercise Picker Modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center">
          <div className="bg-bg-base border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-semibold">Add Exercise</h3>
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
                {['', 'resistance', 'cardio', 'bodyweight', 'plyo', 'mobility'].map((c) => (
                  <button key={c} onClick={() => setFilterCat(c)}
                    className={`px-3 py-1 rounded-pill text-xs border capitalize transition-all ${filterCat === c ? 'border-brand-orange bg-brand-orange/10 text-brand-orange' : 'border-white/10 text-text-secondary'}`}>
                    {c || 'All'}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-4 pb-4 space-y-2">
              {exLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-brand-orange" /></div>
              ) : exerciseData?.exercises?.map((ex: any) => {
                const added = exercises.some((e) => e.exerciseId === ex.id);
                return (
                  <button key={ex.id} disabled={added} onClick={() => addExercise(ex)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      added ? 'opacity-40 cursor-not-allowed border-white/5' : 'border-white/10 bg-bg-surface hover:border-brand-orange/50'
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
                    {added ? <span className="text-xs text-text-secondary shrink-0">Added</span> : <Plus className="w-4 h-4 text-brand-orange shrink-0" />}
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
