import { WeekType, ChoreAssignmentType, ChoreAssignment, ChoreRoom } from '@/types'

/**
 * Get the next week in the A→B→C→A rotation
 */
export function getNextWeek(current: WeekType): WeekType {
  switch (current) {
    case 'A':
      return 'B'
    case 'B':
      return 'C'
    case 'C':
      return 'A'
  }
}

/**
 * Get the previous week in the C→B→A→C rotation
 */
export function getPreviousWeek(current: WeekType): WeekType {
  switch (current) {
    case 'A':
      return 'C'
    case 'B':
      return 'A'
    case 'C':
      return 'B'
  }
}

/**
 * Check if rotation should happen based on dates
 */
export function shouldRotateThisWeek(
  lastRotationDate: Date | null,
  currentDate: Date = new Date()
): boolean {
  if (!lastRotationDate) return true

  // Get the Monday of the last rotation week
  const lastRotationDay = new Date(lastRotationDate)
  const lastRotationMonday = new Date(lastRotationDay)
  const dayOfWeek = lastRotationMonday.getDay()
  const diff = lastRotationMonday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  lastRotationMonday.setDate(diff)

  // Get the Monday of the current week
  const currentMonday = new Date(currentDate)
  const currentDayOfWeek = currentMonday.getDay()
  const currentDiff = currentMonday.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1)
  currentMonday.setDate(currentDiff)

  // If current Monday is after last rotation Monday, we should rotate
  return currentMonday > lastRotationMonday
}

/**
 * Get the room assignment for a given assignment type and day of week
 */
export function getTodaysRoom(
  assignment: ChoreAssignmentType,
  dayOfWeek: number,
  rooms: ChoreRoom[]
): ChoreRoom | null {
  return (
    rooms.find((room) => room.assignment === assignment && room.day_of_week === dayOfWeek) ||
    null
  )
}

/**
 * Get all assignments for a given week
 */
export function getAssignmentsForWeek(
  week: WeekType,
  assignments: ChoreAssignment[]
): Map<string, ChoreAssignmentType> {
  const map = new Map<string, ChoreAssignmentType>()

  assignments.forEach((assignment) => {
    if (assignment.week === week) {
      map.set(assignment.kid_id, assignment.assignment as ChoreAssignmentType)
    }
  })

  return map
}

/**
 * Get a kid's assignment for a given week
 */
export function getKidAssignment(
  kidId: string,
  week: WeekType,
  assignments: ChoreAssignment[]
): ChoreAssignmentType | null {
  const assignment = assignments.find((a) => a.kid_id === kidId && a.week === week)
  return (assignment?.assignment as ChoreAssignmentType) || null
}

/**
 * Get day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 */
export function getDayOfWeek(date: Date = new Date()): number {
  return date.getDay()
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayAsString(): string {
  return new Date().toISOString().split('T')[0] || ''
}
