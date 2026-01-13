export * from './database'

// Domain types
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type ChoreAssignmentType = 'Kitchen' | 'Living Spaces' | 'Bathrooms & Entry' | 'Garden'
export type WeekType = 'A' | 'B' | 'C'
export type GigTier = 1 | 2 | 3 | 4 | 5

// Meal Planning types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'drink'
export type PrepType = 'full_cook' | 'sous_chef' | 'setup' | 'cleanup'
export type MealPrepStatus = 'available' | 'claimed' | 'completed' | 'cancelled'

// Nutrient targets for the Brown family
export const NUTRIENT_TARGETS = {
  potassium_mg: 4700,
  folate_mcg: 400,
  b12_mcg: 2.4,
  protein_g: 60,
  vitamin_c_mg: 75, // Note: Alex needs 500+ for CBS recovery
} as const

// Stars awarded for meal prep participation
export const MEAL_PREP_STARS = {
  full_cook: 40, // Tier 4 equivalent
  sous_chef: 20, // Tier 2 equivalent
  setup: 10,     // Tier 1 equivalent
  cleanup: 10,   // Tier 1 equivalent
} as const
