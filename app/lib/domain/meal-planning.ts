import { Recipe, MealPlanEntryWithRecipe, RecipeIngredient, ShoppingListItem } from '@/types'
import { NUTRIENT_TARGETS, MEAL_PREP_STARS, PrepType } from '@/types'

/**
 * Daily nutrient totals for a set of meals
 */
export interface DailyNutrients {
  calories: number
  protein_g: number
  potassium_mg: number
  folate_mcg: number
  b12_mcg: number
  vitamin_c_mg: number
  magnesium_mg: number
}

/**
 * Calculate nutrient totals from a list of meal plan entries with recipes
 */
export function calculateDailyNutrients(
  meals: MealPlanEntryWithRecipe[]
): DailyNutrients {
  return meals.reduce(
    (totals, meal) => {
      const recipe = meal.recipes
      const servingMultiplier = meal.servings_planned / recipe.servings

      return {
        calories: totals.calories + (recipe.calories || 0) * servingMultiplier,
        protein_g: totals.protein_g + (recipe.protein_g || 0) * servingMultiplier,
        potassium_mg: totals.potassium_mg + (recipe.potassium_mg || 0) * servingMultiplier,
        folate_mcg: totals.folate_mcg + (recipe.folate_mcg || 0) * servingMultiplier,
        b12_mcg: totals.b12_mcg + (recipe.b12_mcg || 0) * servingMultiplier,
        vitamin_c_mg: totals.vitamin_c_mg + (recipe.vitamin_c_mg || 0) * servingMultiplier,
        magnesium_mg: totals.magnesium_mg + (recipe.magnesium_mg || 0) * servingMultiplier,
      }
    },
    {
      calories: 0,
      protein_g: 0,
      potassium_mg: 0,
      folate_mcg: 0,
      b12_mcg: 0,
      vitamin_c_mg: 0,
      magnesium_mg: 0,
    }
  )
}

/**
 * Result of checking nutrient targets
 */
export interface NutrientCheckResult {
  met: boolean
  percentages: {
    potassium: number
    folate: number
    b12: number
    protein: number
    vitamin_c: number
  }
  gaps: string[]
}

/**
 * Check if daily nutrients meet family targets
 */
export function checkNutrientTargets(nutrients: DailyNutrients): NutrientCheckResult {
  const percentages = {
    potassium: Math.round((nutrients.potassium_mg / NUTRIENT_TARGETS.potassium_mg) * 100),
    folate: Math.round((nutrients.folate_mcg / NUTRIENT_TARGETS.folate_mcg) * 100),
    b12: Math.round((nutrients.b12_mcg / NUTRIENT_TARGETS.b12_mcg) * 100),
    protein: Math.round((nutrients.protein_g / NUTRIENT_TARGETS.protein_g) * 100),
    vitamin_c: Math.round((nutrients.vitamin_c_mg / NUTRIENT_TARGETS.vitamin_c_mg) * 100),
  }

  const gaps: string[] = []

  if (percentages.potassium < 100) {
    gaps.push(`Potassium: ${nutrients.potassium_mg}/${NUTRIENT_TARGETS.potassium_mg}mg (${percentages.potassium}%)`)
  }
  if (percentages.folate < 100) {
    gaps.push(`Folate: ${nutrients.folate_mcg}/${NUTRIENT_TARGETS.folate_mcg}mcg (${percentages.folate}%)`)
  }
  if (percentages.b12 < 100) {
    gaps.push(`B12: ${nutrients.b12_mcg}/${NUTRIENT_TARGETS.b12_mcg}mcg (${percentages.b12}%)`)
  }
  if (percentages.protein < 100) {
    gaps.push(`Protein: ${nutrients.protein_g}/${NUTRIENT_TARGETS.protein_g}g (${percentages.protein}%)`)
  }

  return {
    met: gaps.length === 0,
    percentages,
    gaps,
  }
}

/**
 * Aggregated ingredient for shopping list
 */
export interface AggregatedIngredient {
  name: string
  totalQuantity: number
  unit: string
  recipeIds: string[]
  category: string
}

/**
 * Categorize an ingredient for shopping list organization
 */
function categorizeIngredient(name: string): string {
  const lower = name.toLowerCase()

  // Produce
  if (['banana', 'spinach', 'strawberries', 'mango', 'pineapple', 'avocado', 'bell pepper', 'tomato', 'cucumber', 'lettuce', 'romaine', 'apple', 'orange', 'lemon', 'lime', 'berries', 'cherries', 'asparagus', 'carrots', 'celery', 'sweet potato', 'potato', 'cilantro', 'ginger'].some(p => lower.includes(p))) {
    return 'produce'
  }

  // Protein
  if (['chicken', 'salmon', 'beef', 'turkey', 'bacon', 'egg', 'fish'].some(p => lower.includes(p))) {
    return 'protein'
  }

  // Dairy & Alternatives
  if (['coconut milk', 'almond milk', 'yogurt', 'butter', 'cream', 'parmesan', 'cheese'].some(p => lower.includes(p))) {
    return 'dairy'
  }

  // Frozen
  if (lower.includes('frozen')) {
    return 'frozen'
  }

  // Pantry
  if (['almond butter', 'peanut butter', 'honey', 'maple syrup', 'olive oil', 'coconut oil', 'oats', 'rice', 'pasta', 'beans', 'lentils', 'chia', 'flax', 'collagen', 'cacao', 'chocolate', 'tortilla', 'bread', 'crackers', 'seeds', 'nuts', 'salt', 'pepper', 'spice', 'sauce', 'aminos', 'vinegar', 'broth'].some(p => lower.includes(p))) {
    return 'pantry'
  }

  return 'other'
}

/**
 * Aggregate ingredients from meal plan entries for shopping list
 */
export function aggregateIngredients(
  meals: MealPlanEntryWithRecipe[]
): AggregatedIngredient[] {
  const ingredientMap = new Map<string, AggregatedIngredient>()

  for (const meal of meals) {
    const recipe = meal.recipes
    const servingMultiplier = meal.servings_planned / recipe.servings

    for (const ing of recipe.ingredients) {
      const key = ing.item.toLowerCase()
      const existing = ingredientMap.get(key)
      const quantity = parseFloat(ing.amount) * servingMultiplier

      if (existing) {
        // Try to combine quantities if same unit
        if (existing.unit === ing.unit && !isNaN(quantity)) {
          existing.totalQuantity += quantity
        }
        if (!existing.recipeIds.includes(meal.recipe_id)) {
          existing.recipeIds.push(meal.recipe_id)
        }
      } else {
        ingredientMap.set(key, {
          name: ing.item,
          totalQuantity: isNaN(quantity) ? 1 : quantity,
          unit: ing.unit,
          recipeIds: [meal.recipe_id],
          category: categorizeIngredient(ing.item),
        })
      }
    }
  }

  // Sort by category, then name
  return Array.from(ingredientMap.values()).sort((a, b) => {
    if (a.category !== b.category) {
      const categoryOrder = ['produce', 'protein', 'dairy', 'frozen', 'pantry', 'other']
      return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
    }
    return a.name.localeCompare(b.name)
  })
}

/**
 * Calculate stars for a meal prep gig based on prep type
 */
export function calculateMealPrepStars(prepType: PrepType): number {
  return MEAL_PREP_STARS[prepType]
}

/**
 * Format a date to YYYY-MM-DD in local timezone
 */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse a YYYY-MM-DD string as local time (not UTC)
 */
export function parseDateLocal(dateStr: string): Date {
  // Adding T00:00:00 ensures the date is parsed as local time
  return new Date(dateStr + 'T00:00:00')
}

/**
 * Get the start of the week (Sunday) for a given date
 */
export function getWeekStartDate(date: Date): string {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  return formatDateLocal(d)
}

/**
 * Get all dates in a week starting from the given Sunday
 */
export function getWeekDates(weekStartDate: string): string[] {
  const dates: string[] = []
  const start = parseDateLocal(weekStartDate)

  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(formatDateLocal(d))
  }

  return dates
}

/**
 * Check if a recipe has special notes for a family member
 */
export function hasSpecialNotes(recipe: Recipe): {
  alex: boolean
  alexander: boolean
  victoria: boolean
} {
  return {
    alex: !!recipe.alex_modifications,
    alexander: !!recipe.alexander_notes,
    victoria: !!recipe.victoria_notes,
  }
}

/**
 * Format a quantity and unit for display
 */
export function formatQuantity(quantity: number, unit: string): string {
  // Handle whole numbers
  if (quantity === Math.floor(quantity)) {
    return `${quantity} ${unit}`
  }

  // Handle common fractions
  const fractions: Record<number, string> = {
    0.25: '1/4',
    0.33: '1/3',
    0.5: '1/2',
    0.67: '2/3',
    0.75: '3/4',
  }

  const decimal = quantity % 1
  const whole = Math.floor(quantity)
  const fractionStr = fractions[Math.round(decimal * 100) / 100]

  if (fractionStr) {
    return whole > 0 ? `${whole} ${fractionStr} ${unit}` : `${fractionStr} ${unit}`
  }

  // Default to decimal
  return `${quantity.toFixed(1)} ${unit}`
}
