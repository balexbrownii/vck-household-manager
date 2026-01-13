/**
 * Domain logic for AI review rules
 * Helpers for working with gig, chore, and expectation rules
 */

import { createClient } from '@/lib/supabase/server'
import { ExpectationRule, ExpectationType, AIRules } from '@/types/database'

/**
 * Get all gigs with their AI rules
 */
export async function getGigsWithRules() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gigs')
    .select('id, title, description, tier, stars, checklist, active, scope_description, completion_criteria, ai_review_enabled')
    .eq('active', true)
    .order('tier', { ascending: true })

  if (error) {
    console.error('Failed to get gigs with rules:', error)
    return []
  }

  return data || []
}

/**
 * Get a single gig with its AI rules
 */
export async function getGigWithRules(gigId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gigs')
    .select('id, title, description, tier, stars, checklist, active, scope_description, completion_criteria, ai_review_enabled')
    .eq('id', gigId)
    .single()

  if (error) {
    console.error('Failed to get gig:', error)
    return null
  }

  return data
}

/**
 * Update AI rules for a gig
 */
export async function updateGigRules(
  gigId: string,
  rules: {
    scope_description?: string
    completion_criteria?: string
    ai_review_enabled?: boolean
  }
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gigs')
    .update({
      ...rules,
      updated_at: new Date().toISOString(),
    })
    .eq('id', gigId)
    .select()
    .single()

  if (error) {
    console.error('Failed to update gig rules:', error)
    return null
  }

  return data
}

/**
 * Get all chore rooms with their AI rules
 */
export async function getChoreRoomsWithRules() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('chore_rooms')
    .select('id, assignment, day_of_week, room_name, checklist, scope_description, completion_criteria, ai_review_enabled')
    .order('assignment', { ascending: true })
    .order('day_of_week', { ascending: true })

  if (error) {
    console.error('Failed to get chore rooms with rules:', error)
    return []
  }

  return data || []
}

/**
 * Get a single chore room with its AI rules
 */
export async function getChoreRoomWithRules(roomId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('chore_rooms')
    .select('id, assignment, day_of_week, room_name, checklist, scope_description, completion_criteria, ai_review_enabled')
    .eq('id', roomId)
    .single()

  if (error) {
    console.error('Failed to get chore room:', error)
    return null
  }

  return data
}

/**
 * Update AI rules for a chore room
 */
export async function updateChoreRoomRules(
  roomId: string,
  rules: {
    scope_description?: string
    completion_criteria?: string
    ai_review_enabled?: boolean
  }
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('chore_rooms')
    .update(rules)
    .eq('id', roomId)
    .select()
    .single()

  if (error) {
    console.error('Failed to update chore room rules:', error)
    return null
  }

  return data
}

/**
 * Get all expectation rules
 */
export async function getExpectationRules(): Promise<ExpectationRule[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('expectation_rules')
    .select('*')
    .order('expectation_type', { ascending: true })

  if (error) {
    console.error('Failed to get expectation rules:', error)
    return []
  }

  return data || []
}

/**
 * Get a single expectation rule by type
 */
export async function getExpectationRule(
  expectationType: ExpectationType
): Promise<ExpectationRule | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('expectation_rules')
    .select('*')
    .eq('expectation_type', expectationType)
    .single()

  if (error) {
    console.error('Failed to get expectation rule:', error)
    return null
  }

  return data
}

/**
 * Update an expectation rule
 */
export async function updateExpectationRule(
  expectationType: ExpectationType,
  rules: {
    scope_description?: string
    completion_criteria?: string
    ai_review_enabled?: boolean
  }
): Promise<ExpectationRule | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('expectation_rules')
    .update({
      ...rules,
      updated_at: new Date().toISOString(),
    })
    .eq('expectation_type', expectationType)
    .select()
    .single()

  if (error) {
    console.error('Failed to update expectation rule:', error)
    return null
  }

  return data
}

/**
 * Format expectation type for display
 */
export function formatExpectationType(type: ExpectationType): string {
  const labels: Record<ExpectationType, string> = {
    exercise: 'Exercise',
    reading: 'Reading',
    tidy_up: 'Tidy Up',
    daily_chore: 'Daily Chore',
  }
  return labels[type] || type
}

/**
 * Get day of week name
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek] || ''
}
