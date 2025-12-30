import { DailyExpectation, Kid } from '@/types'

/**
 * Check if all 4 daily expectations are complete
 */
export function canUnlockScreenTime(expectations: DailyExpectation): boolean {
  return expectations.all_complete === true
}

/**
 * Calculate screen time allowance for a kid on a given day
 */
export interface ScreenTimeAllowance {
  baseMinutes: number
  bonusMinutes: number
  total: number
  canExtendPastCutoff: boolean // If they have bonus time
}

export function calculateScreenTimeAllowance(
  kid: Kid,
  isWeekend: boolean,
  completedGigsToday: number
): ScreenTimeAllowance {
  // Base minutes based on age and day type
  const baseMinutes = isWeekend
    ? kid.screen_time_weekend_minutes
    : kid.screen_time_weekday_minutes

  // Bonus time: 15 minutes per completed gig, max 2 gigs per day
  const eligibleGigs = Math.min(completedGigsToday, 2)
  const bonusMinutes = eligibleGigs * 15

  return {
    baseMinutes,
    bonusMinutes,
    total: baseMinutes + bonusMinutes,
    canExtendPastCutoff: bonusMinutes > 0,
  }
}

/**
 * Check if current time is past the screen time cutoff
 */
export function isPastCutoff(
  kid: Kid,
  isWeekend: boolean,
  currentTime: Date = new Date()
): boolean {
  const cutoffTimeStr = isWeekend
    ? kid.screen_time_cutoff_weekend
    : kid.screen_time_cutoff_weekday

  // Parse cutoff time (HH:MM:SS format)
  const [hours, minutes] = cutoffTimeStr.split(':').map(Number)

  const cutoffTime = new Date(currentTime)
  cutoffTime.setHours(hours, minutes, 0, 0)

  return currentTime >= cutoffTime
}

/**
 * Calculate time remaining until cutoff
 */
export function getTimeUntilCutoff(
  kid: Kid,
  isWeekend: boolean,
  currentTime: Date = new Date()
): number {
  const cutoffTimeStr = isWeekend
    ? kid.screen_time_cutoff_weekend
    : kid.screen_time_cutoff_weekday

  // Parse cutoff time
  const [hours, minutes] = cutoffTimeStr.split(':').map(Number)

  const cutoffTime = new Date(currentTime)
  cutoffTime.setHours(hours, minutes, 0, 0)

  // If cutoff is in the past, calculate for next day
  if (cutoffTime <= currentTime) {
    cutoffTime.setDate(cutoffTime.getDate() + 1)
  }

  const diffMs = cutoffTime.getTime() - currentTime.getTime()
  return Math.floor(diffMs / (1000 * 60)) // Return minutes
}

/**
 * Check if it's a weekend
 */
export function isWeekend(date: Date = new Date()): boolean {
  const dayOfWeek = date.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6
}

/**
 * Get screen time cutoff time as Date object
 */
export function getCutoffAsTime(
  kid: Kid,
  isWeekend: boolean,
  date: Date = new Date()
): Date {
  const cutoffTimeStr = isWeekend
    ? kid.screen_time_cutoff_weekend
    : kid.screen_time_cutoff_weekday

  const [hours, minutes] = cutoffTimeStr.split(':').map(Number)

  const cutoffTime = new Date(date)
  cutoffTime.setHours(hours, minutes, 0, 0)

  return cutoffTime
}

/**
 * Format minutes as HH:MM
 */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}
