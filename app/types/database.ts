// Generated types from Supabase schema
export interface Kid {
  id: string
  name: string
  age: number
  screen_time_weekday_minutes: number
  screen_time_weekend_minutes: number
  screen_time_cutoff_weekday: string
  screen_time_cutoff_weekend: string
  max_gig_tier: number
  total_stars: number
  milestones_reached: number
  created_at: string
  updated_at: string
}

export interface DailyExpectation {
  id: string
  kid_id: string
  date: string
  exercise_complete: boolean
  reading_complete: boolean
  tidy_up_complete: boolean
  daily_chore_complete: boolean
  all_complete: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ChoreRotationState {
  id: string
  current_week: 'A' | 'B' | 'C'
  week_start_date: string
  next_rotation_date: string
  last_rotated_at: string | null
  created_at: string
  updated_at: string
}

export interface ChoreAssignment {
  id: string
  kid_id: string
  week: 'A' | 'B' | 'C'
  assignment: 'Kitchen' | 'Living Spaces' | 'Bathrooms & Entry' | 'Garden'
  created_at: string
  updated_at: string
}

export interface ChoreRoom {
  id: string
  assignment: 'Kitchen' | 'Living Spaces' | 'Bathrooms & Entry' | 'Garden'
  day_of_week: number
  room_name: string
  checklist: string[]
  // AI Review fields
  scope_description: string | null
  completion_criteria: string | null
  ai_review_enabled: boolean
  created_at: string
}

export interface ChoreCompletion {
  id: string
  kid_id: string
  date: string
  assignment: string
  room_name: string
  completed: boolean
  verified_by: string | null
  verified_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Gig {
  id: string
  title: string
  description: string
  tier: number
  stars: number
  estimated_minutes: number | null
  checklist: string[]
  active: boolean
  // AI Review fields
  scope_description: string | null
  completion_criteria: string | null
  ai_review_enabled: boolean
  created_at: string
  updated_at: string
}

export interface ClaimedGig {
  id: string
  gig_id: string
  kid_id: string
  claimed_at: string
  completed_at: string | null
  inspection_status: 'pending' | 'approved' | 'rejected' | null
  inspected_by: string | null
  inspected_at: string | null
  inspection_notes: string | null
  stars_awarded: number | null
  created_at: string
  updated_at: string
}

export interface StarHistory {
  id: string
  kid_id: string
  claimed_gig_id: string | null
  stars_earned: number
  reason: string
  balance_after: number
  created_at: string
}

export interface ScreenTimeSession {
  id: string
  kid_id: string
  date: string
  unlocked_at: string | null
  locked_at: string | null
  base_minutes_allowed: number
  bonus_minutes_allowed: number
  total_minutes_allowed: number
  minutes_used: number
  is_weekend: boolean
  created_at: string
  updated_at: string
}

export interface TimeoutViolation {
  id: string
  kid_id: string
  violation_type: string
  timeout_minutes: number
  started_at: string
  completed_at: string | null
  reset_count: number
  doubled: boolean
  notes: string | null
  logged_by: string
  created_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'parent' | 'admin'
  created_at: string
  updated_at: string
}

// ============================================
// MEAL PLANNING TYPES
// ============================================

export interface RecipeCategory {
  id: string
  name: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'drink'
  sort_order: number
  created_at: string
}

export interface RecipeIngredient {
  item: string
  amount: string
  unit: string
  potassium_mg?: number
  folate_mcg?: number
  b12_mcg?: number
  vitamin_c_mg?: number
  protein_g?: number
  magnesium_mg?: number
  note?: string
}

export interface Recipe {
  id: string
  title: string
  category_id: string
  description: string | null
  recipe_number: number | null

  // Nutrients per serving
  calories: number | null
  protein_g: number | null
  potassium_mg: number | null
  folate_mcg: number | null
  b12_mcg: number | null
  vitamin_c_mg: number | null
  magnesium_mg: number | null
  fiber_g: number | null

  // Prep info
  estimated_minutes: number | null
  servings: number

  // Content
  ingredients: RecipeIngredient[]
  instructions: string[]

  // Family notes
  alex_modifications: string | null
  alexander_notes: string | null
  victoria_notes: string | null

  active: boolean
  created_at: string
  updated_at: string
}

export interface MealPlanEntry {
  id: string
  recipe_id: string
  planned_date: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'drink'
  servings_planned: number
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface MealCompletion {
  id: string
  meal_plan_entry_id: string
  completed_at: string
  served_by: string | null
  notes: string | null
  rating: number | null
  created_at: string
}

export interface MealPrepGig {
  id: string
  meal_plan_entry_id: string
  kid_id: string | null
  prep_type: 'full_cook' | 'sous_chef' | 'setup' | 'cleanup'
  stars_offered: number
  status: 'available' | 'claimed' | 'completed' | 'cancelled'
  completed_at: string | null
  verified_by: string | null
  created_at: string
  updated_at: string
}

export interface ShoppingListItem {
  id: string
  week_start_date: string
  ingredient_name: string
  quantity: string | null
  unit: string | null
  category: string | null
  source_recipe_ids: string[]
  purchased: boolean
  purchased_at: string | null
  purchased_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// Joined types for API responses
export interface MealPlanEntryWithRecipe extends MealPlanEntry {
  recipes: Recipe
}

export interface RecipeWithCategory extends Recipe {
  recipe_categories: RecipeCategory
}

// ============================================
// AI REVIEW TYPES
// ============================================

export type ExpectationType = 'exercise' | 'reading' | 'tidy_up' | 'daily_chore'

export interface ExpectationRule {
  id: string
  expectation_type: ExpectationType
  scope_description: string
  completion_criteria: string
  ai_review_enabled: boolean
  created_at: string
  updated_at: string
}

export type PhotoStatus = 'ai_reviewing' | 'needs_revision' | 'pending_review' | 'approved' | 'rejected'
export type EntityType = 'gig' | 'chore' | 'expectation'

export interface CompletionPhoto {
  id: string
  entity_type: EntityType
  entity_id: string
  kid_id: string
  storage_path: string
  file_name: string | null
  file_size: number | null
  mime_type: string | null
  caption: string | null
  notes: string | null
  status: PhotoStatus
  uploaded_at: string
  // Parent review fields
  reviewed_at: string | null
  reviewed_by: string | null
  review_feedback: string | null
  // AI review fields
  ai_reviewed_at: string | null
  ai_passed: boolean | null
  ai_feedback: string | null
  ai_confidence: number | null
  submission_attempt: number
  escalated_to_parent: boolean
}

export interface AIReviewLog {
  id: string
  completion_photo_id: string
  entity_type: EntityType
  entity_id: string
  rules_used: {
    scope_description: string
    completion_criteria: string
    checklist?: string[]
  }
  ai_response: {
    passed: boolean
    feedback: string
    confidence: number
    checklist_assessment?: Array<{
      item: string
      passed: boolean
      note?: string
    }>
  }
  passed: boolean
  confidence: number | null
  processing_time_ms: number | null
  model_used: string
  created_at: string
}

// Type for AI evaluation result
export interface AIEvaluationResult {
  passed: boolean
  feedback: string
  confidence: number
  checklist_assessment?: Array<{
    item: string
    passed: boolean
    note?: string
  }>
}

// Type for rules used in evaluation
export interface AIRules {
  scope_description: string
  completion_criteria: string
  checklist?: string[]
  ai_review_enabled: boolean
}
