import { z } from 'zod'

// Meal plan entry schemas
export const addMealPlanSchema = z.object({
  recipeId: z.string().uuid('Invalid recipe ID'),
  plannedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'drink']),
  servingsPlanned: z.number().int().min(1).max(20).default(4),
  notes: z.string().optional(),
})

export type AddMealPlanInput = z.infer<typeof addMealPlanSchema>

export const updateMealPlanSchema = z.object({
  mealPlanEntryId: z.string().uuid('Invalid meal plan entry ID'),
  recipeId: z.string().uuid('Invalid recipe ID').optional(),
  servingsPlanned: z.number().int().min(1).max(20).optional(),
  notes: z.string().optional(),
})

export type UpdateMealPlanInput = z.infer<typeof updateMealPlanSchema>

export const deleteMealPlanSchema = z.object({
  mealPlanEntryId: z.string().uuid('Invalid meal plan entry ID'),
})

export type DeleteMealPlanInput = z.infer<typeof deleteMealPlanSchema>

// Meal completion schemas
export const completeMealSchema = z.object({
  mealPlanEntryId: z.string().uuid('Invalid meal plan entry ID'),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
})

export type CompleteMealInput = z.infer<typeof completeMealSchema>

// Meal prep gig schemas
export const claimMealPrepSchema = z.object({
  mealPlanEntryId: z.string().uuid('Invalid meal plan entry ID'),
  kidId: z.string().uuid('Invalid kid ID'),
  prepType: z.enum(['full_cook', 'sous_chef', 'setup', 'cleanup']),
})

export type ClaimMealPrepInput = z.infer<typeof claimMealPrepSchema>

export const completeMealPrepSchema = z.object({
  mealPrepGigId: z.string().uuid('Invalid meal prep gig ID'),
  notes: z.string().optional(),
})

export type CompleteMealPrepInput = z.infer<typeof completeMealPrepSchema>

// Shopping list schemas
export const generateShoppingListSchema = z.object({
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
})

export type GenerateShoppingListInput = z.infer<typeof generateShoppingListSchema>

export const toggleShoppingItemSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
  purchased: z.boolean(),
})

export type ToggleShoppingItemInput = z.infer<typeof toggleShoppingItemSchema>

// Query schemas
export const getMealPlanSchema = z.object({
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
})

export type GetMealPlanInput = z.infer<typeof getMealPlanSchema>

export const getRecipesSchema = z.object({
  category: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'drink']).optional(),
  search: z.string().optional(),
})

export type GetRecipesInput = z.infer<typeof getRecipesSchema>
