'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Leaf, Plus } from 'lucide-react';
import type { Recipe } from '@/lib/recipes';
import { cn } from '@/lib/utils';

interface Props {
  recipe: Recipe;
  /** Calories still to eat today — used to show how much of the gap this fills. */
  remaining?: number | null;
  adding?: boolean;
  onAdd: (recipe: Recipe) => void;
}

export function RecipeCard({ recipe, remaining, adding, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const fills = remaining && remaining > 0 ? Math.min(100, Math.round((recipe.calories / remaining) * 100)) : null;

  return (
    <div className="rounded-2xl border border-hairline bg-bg-surface overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-semibold leading-tight">{recipe.name}</h4>
            <p className="text-xs text-text-secondary mt-1 flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {recipe.minutes} min
              </span>
              {recipe.vegetarian && (
                <span className="inline-flex items-center gap-1 text-success">
                  <Leaf className="w-3.5 h-3.5" />
                  Veg
                </span>
              )}
            </p>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-pill bg-brand-green/10 text-brand-green text-xs font-bold">
            {recipe.calories} kcal
          </span>
        </div>

        <div className="flex gap-2 text-[11px] font-medium">
          <span className="px-2 py-1 rounded-lg bg-bg-elevated text-text-secondary">P {recipe.proteinG}g</span>
          <span className="px-2 py-1 rounded-lg bg-bg-elevated text-text-secondary">C {recipe.carbsG}g</span>
          <span className="px-2 py-1 rounded-lg bg-bg-elevated text-text-secondary">F {recipe.fatG}g</span>
        </div>

        {fills != null && (
          <p className="text-xs text-text-secondary">
            Covers <span className="text-text-primary font-semibold">{fills}%</span> of what&apos;s left today
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onAdd(recipe)}
            disabled={adding}
            className="flex-1 py-2.5 gradient-bg rounded-pill text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            Add to log
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="px-3 py-2.5 rounded-pill border border-hairline text-text-secondary hover:text-text-primary"
            aria-label={open ? 'Hide recipe' : 'Show recipe'}
          >
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className={cn('px-4 pb-4 space-y-3 text-sm border-t border-hairline pt-3')}>
          <div>
            <p className="text-text-secondary font-medium mb-1.5 text-xs uppercase tracking-wide">Ingredients</p>
            <ul className="space-y-1">
              {recipe.ingredients.map((i) => (
                <li key={i} className="flex gap-2 text-text-secondary">
                  <span className="text-brand-green">·</span>
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-text-secondary font-medium mb-1.5 text-xs uppercase tracking-wide">Method</p>
            <ol className="space-y-1.5">
              {recipe.steps.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-text-secondary">
                  <span className="w-5 h-5 rounded-full gradient-bg text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
