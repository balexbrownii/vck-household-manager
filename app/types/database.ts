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
