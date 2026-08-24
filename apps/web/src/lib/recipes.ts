import type { DietGoal, MealType } from '@kraftplan/shared';

export interface Recipe {
  id: string;
  name: string;
  meals: MealType[];
  /** Per serving. */
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  minutes: number;
  vegetarian: boolean;
  ingredients: string[];
  steps: string[];
}

/**
 * A small, hand-checked catalogue — enough to fill a day at any calorie target
 * without a third-party food API (and without a paid tier). Macros are typical
 * values per serving; the log stores whatever the user actually adds.
 */
export const RECIPES: Recipe[] = [
  {
    id: 'greek-yogurt-berry-bowl',
    name: 'Greek yogurt & berry bowl',
    meals: ['breakfast', 'snack'],
    calories: 320, proteinG: 30, carbsG: 38, fatG: 6, minutes: 5, vegetarian: true,
    ingredients: ['200g Greek yogurt (0%)', '100g mixed berries', '20g honey', '15g granola'],
    steps: ['Spoon the yogurt into a bowl.', 'Top with berries and granola.', 'Drizzle honey over the top.'],
  },
  {
    id: 'veggie-omelette',
    name: 'Three-egg veggie omelette',
    meals: ['breakfast'],
    calories: 380, proteinG: 28, carbsG: 8, fatG: 27, minutes: 10, vegetarian: true,
    ingredients: ['3 eggs', '50g spinach', '1/2 bell pepper', '20g cheese', '1 tsp olive oil'],
    steps: ['Beat the eggs with salt and pepper.', 'Soften the peppers and spinach in the oil.', 'Pour in the eggs, add cheese, fold once set.'],
  },
  {
    id: 'overnight-oats-pb',
    name: 'Peanut butter overnight oats',
    meals: ['breakfast', 'snack'],
    calories: 520, proteinG: 22, carbsG: 62, fatG: 20, minutes: 5, vegetarian: true,
    ingredients: ['60g rolled oats', '200ml milk', '20g peanut butter', '1 banana', '1 tbsp chia seeds'],
    steps: ['Stir oats, milk, chia and peanut butter together.', 'Refrigerate overnight.', 'Top with sliced banana before eating.'],
  },
  {
    id: 'protein-pancakes',
    name: 'Protein banana pancakes',
    meals: ['breakfast'],
    calories: 450, proteinG: 32, carbsG: 55, fatG: 12, minutes: 15, vegetarian: true,
    ingredients: ['1 banana', '2 eggs', '40g oat flour', '1 scoop whey', '1 tsp baking powder'],
    steps: ['Blend everything into a batter.', 'Cook small pancakes over medium heat, 2 min a side.', 'Serve with yogurt or berries.'],
  },
  {
    id: 'egg-white-avocado-toast',
    name: 'Egg-white scramble & avocado toast',
    meals: ['breakfast'],
    calories: 390, proteinG: 26, carbsG: 34, fatG: 16, minutes: 10, vegetarian: true,
    ingredients: ['200ml egg whites', '2 slices wholegrain bread', '1/2 avocado', 'Chilli flakes'],
    steps: ['Scramble the egg whites over low heat.', 'Toast the bread and mash the avocado on top.', 'Pile on the eggs and finish with chilli flakes.'],
  },
  {
    id: 'chicken-rice-bowl',
    name: 'Chicken & rice power bowl',
    meals: ['lunch', 'dinner'],
    calories: 620, proteinG: 48, carbsG: 72, fatG: 14, minutes: 25, vegetarian: false,
    ingredients: ['180g chicken breast', '150g cooked rice', '100g broccoli', '1 tbsp olive oil', 'Soy sauce & garlic'],
    steps: ['Sear the chicken in the oil until cooked through.', 'Steam the broccoli.', 'Build the bowl over rice, finish with soy and garlic.'],
  },
  {
    id: 'salmon-quinoa',
    name: 'Grilled salmon, quinoa & greens',
    meals: ['lunch', 'dinner'],
    calories: 610, proteinG: 42, carbsG: 48, fatG: 26, minutes: 25, vegetarian: false,
    ingredients: ['150g salmon fillet', '120g cooked quinoa', '100g green beans', 'Lemon', '1 tsp olive oil'],
    steps: ['Grill the salmon skin-side down, 4 min a side.', 'Toss the quinoa with the beans and lemon.', 'Plate together and season.'],
  },
  {
    id: 'turkey-chilli',
    name: 'Turkey chilli with beans',
    meals: ['lunch', 'dinner'],
    calories: 540, proteinG: 45, carbsG: 50, fatG: 16, minutes: 35, vegetarian: false,
    ingredients: ['200g turkey mince', '150g kidney beans', '200g chopped tomatoes', 'Onion, garlic, cumin, paprika'],
    steps: ['Brown the mince with the onion and garlic.', 'Add the spices, tomatoes and beans.', 'Simmer 20 minutes until thick.'],
  },
  {
    id: 'paneer-chickpea-curry',
    name: 'Paneer & chickpea curry with rice',
    meals: ['lunch', 'dinner'],
    calories: 680, proteinG: 32, carbsG: 86, fatG: 22, minutes: 30, vegetarian: true,
    ingredients: ['120g paneer', '150g chickpeas', '150g cooked rice', '200g tomato passata', 'Onion, ginger, garam masala'],
    steps: ['Fry the onion, ginger and spices.', 'Add passata and chickpeas, simmer 15 minutes.', 'Fold in the paneer and serve over rice.'],
  },
  {
    id: 'lentil-dal-roti',
    name: 'Lentil dal with roti',
    meals: ['lunch', 'dinner'],
    calories: 520, proteinG: 24, carbsG: 74, fatG: 14, minutes: 35, vegetarian: true,
    ingredients: ['150g red lentils', '2 rotis', 'Onion, tomato, garlic', '1 tbsp ghee', 'Turmeric & cumin'],
    steps: ['Simmer the lentils with turmeric until soft.', 'Temper cumin and garlic in ghee, stir through.', 'Serve with warm rotis.'],
  },
  {
    id: 'tuna-egg-wrap',
    name: 'Tuna & egg salad wrap',
    meals: ['lunch', 'snack'],
    calories: 480, proteinG: 38, carbsG: 40, fatG: 18, minutes: 10, vegetarian: false,
    ingredients: ['1 tin tuna in water', '2 boiled eggs', '1 large tortilla', '1 tbsp light mayo', 'Lettuce & cucumber'],
    steps: ['Mash the tuna and eggs with the mayo.', 'Spread over the tortilla with the salad.', 'Roll tightly and slice in half.'],
  },
  {
    id: 'beef-noodle-stirfry',
    name: 'Beef stir-fry with noodles',
    meals: ['dinner'],
    calories: 720, proteinG: 45, carbsG: 78, fatG: 24, minutes: 20, vegetarian: false,
    ingredients: ['180g lean beef strips', '120g egg noodles', 'Mixed stir-fry veg', 'Soy sauce, ginger, sesame oil'],
    steps: ['Boil the noodles and drain.', 'Sear the beef hot and fast, then add the veg.', 'Toss everything with soy, ginger and sesame oil.'],
  },
  {
    id: 'tofu-poke',
    name: 'Tofu poke bowl',
    meals: ['lunch', 'dinner'],
    calories: 560, proteinG: 30, carbsG: 70, fatG: 18, minutes: 20, vegetarian: true,
    ingredients: ['200g firm tofu', '150g sushi rice', 'Edamame, cucumber, carrot', 'Soy, sesame, rice vinegar'],
    steps: ['Press and cube the tofu, then bake or pan-fry until golden.', 'Dress the rice with vinegar.', 'Arrange toppings and finish with soy and sesame.'],
  },
  {
    id: 'chicken-shawarma-bowl',
    name: 'Chicken shawarma bowl',
    meals: ['lunch', 'dinner'],
    calories: 640, proteinG: 46, carbsG: 62, fatG: 22, minutes: 30, vegetarian: false,
    ingredients: ['180g chicken thigh', '150g couscous', 'Cucumber & tomato salad', 'Garlic yogurt sauce', 'Shawarma spice'],
    steps: ['Marinate and roast the chicken with the spice mix.', 'Fluff the couscous.', 'Layer chicken, salad and yogurt sauce over the couscous.'],
  },
  {
    id: 'prawn-fried-rice',
    name: 'Prawn fried rice',
    meals: ['lunch', 'dinner'],
    calories: 550, proteinG: 38, carbsG: 68, fatG: 12, minutes: 15, vegetarian: false,
    ingredients: ['180g prawns', '150g cold cooked rice', '2 eggs', 'Peas, spring onion', 'Soy sauce'],
    steps: ['Scramble the eggs and set aside.', 'Fry the prawns, then the rice and peas over high heat.', 'Return the eggs, season with soy, finish with spring onion.'],
  },
  {
    id: 'cottage-cheese-toast',
    name: 'Cottage cheese toast',
    meals: ['snack', 'breakfast'],
    calories: 280, proteinG: 24, carbsG: 28, fatG: 8, minutes: 5, vegetarian: true,
    ingredients: ['150g cottage cheese', '2 slices rye bread', 'Tomato & black pepper'],
    steps: ['Toast the bread.', 'Spread the cottage cheese thickly.', 'Top with tomato and plenty of pepper.'],
  },
  {
    id: 'whey-oat-shake',
    name: 'Whey, banana & oat shake',
    meals: ['snack'],
    calories: 420, proteinG: 35, carbsG: 52, fatG: 7, minutes: 3, vegetarian: true,
    ingredients: ['1 scoop whey', '40g oats', '1 banana', '300ml milk'],
    steps: ['Blend everything until smooth.', 'Drink within 20 minutes of training for convenience.'],
  },
  {
    id: 'mass-gainer-smoothie',
    name: 'Mass-gainer smoothie',
    meals: ['snack', 'breakfast'],
    calories: 780, proteinG: 45, carbsG: 88, fatG: 26, minutes: 5, vegetarian: true,
    ingredients: ['1.5 scoops whey', '60g oats', '30g peanut butter', '1 banana', '400ml whole milk'],
    steps: ['Blend to a thick shake.', 'Split into two servings if it sits heavy before training.'],
  },
  {
    id: 'pbj-sandwich',
    name: 'Peanut butter & jam sandwich',
    meals: ['snack'],
    calories: 400, proteinG: 16, carbsG: 48, fatG: 17, minutes: 3, vegetarian: true,
    ingredients: ['2 slices wholegrain bread', '25g peanut butter', '15g jam'],
    steps: ['Spread and assemble. That is the whole recipe.'],
  },
  {
    id: 'apple-almonds',
    name: 'Apple & almonds',
    meals: ['snack'],
    calories: 240, proteinG: 7, carbsG: 26, fatG: 14, minutes: 1, vegetarian: true,
    ingredients: ['1 apple', '25g almonds'],
    steps: ['Slice the apple and eat with the almonds.'],
  },
];

export interface SuggestOptions {
  /** Calories still to eat today. */
  remaining: number;
  /** Protein still to eat today, when a target exists. */
  remainingProteinG?: number | null;
  goal?: DietGoal;
  meal?: MealType | 'all';
  vegetarianOnly?: boolean;
  limit?: number;
}

/**
 * Rank recipes by how well they fill the calories left in the day. Anything
 * that would blow the remaining budget by more than 15% is dropped, then ties
 * are broken by protein density — the macro that's hardest to hit on a cut and
 * still matters on a bulk.
 */
export function suggestRecipes(opts: SuggestOptions): Recipe[] {
  const { remaining, remainingProteinG, goal = 'maintain', meal = 'all', vegetarianOnly = false, limit = 6 } = opts;
  const budget = Math.max(0, remaining);

  const pool = RECIPES.filter((r) => {
    if (vegetarianOnly && !r.vegetarian) return false;
    if (meal !== 'all' && !r.meals.includes(meal)) return false;
    return true;
  });

  // Nothing left to eat (or no target yet) — show the goal-appropriate staples.
  if (budget < 150) {
    return [...pool]
      .sort((a, b) => (goal === 'bulk' ? b.calories - a.calories : a.calories - b.calories))
      .slice(0, limit);
  }

  const proteinNeed = remainingProteinG ?? 0;

  return pool
    .filter((r) => r.calories <= budget * 1.15)
    .map((r) => {
      // 0 = fills the remaining budget exactly, 1 = way off.
      const fit = Math.abs(budget - r.calories) / budget;
      const proteinDensity = r.proteinG / (r.calories / 100);
      const proteinBonus = proteinNeed > 0 ? Math.min(1, r.proteinG / proteinNeed) : 0;
      const score = fit - proteinDensity * 0.06 - proteinBonus * 0.25;
      return { r, score };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((x) => x.r);
}
