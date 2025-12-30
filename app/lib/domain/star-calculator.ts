import { Kid, Gig } from '@/types'

/**
 * Calculate stars earned for a gig based on inspection result
 */
export function calculateStarsForGig(gig: Gig, inspectionPassed: boolean): number {
  return inspectionPassed ? gig.stars : 0
}

/**
 * Add stars to a kid's total and calculate milestone progress
 */
export interface StarResult {
  newBalance: number
  milestoneReached: boolean
  newMilestones: number
  oldMilestones: number
}

export function addStarsToKid(kid: Kid, starsToAdd: number): StarResult {
  const oldBalance = kid.total_stars
  const newBalance = oldBalance + starsToAdd

  const oldMilestones = Math.floor(oldBalance / 200)
  const newMilestones = Math.floor(newBalance / 200)

  return {
    newBalance,
    milestoneReached: newMilestones > oldMilestones,
    newMilestones,
    oldMilestones,
  }
}

/**
 * Calculate progress toward next $100 milestone
 */
export interface ProgressResult {
  currentMilestone: number
  progress: number // 0-100 percentage
  starsToNext: number
  starsInCurrentMilestone: number
}

export function calculateProgress(totalStars: number): ProgressResult {
  const milestone = Math.floor(totalStars / 200)
  const starsInCurrentMilestone = totalStars % 200
  const starsToNext = 200 - starsInCurrentMilestone

  return {
    currentMilestone: milestone,
    progress: (starsInCurrentMilestone / 200) * 100,
    starsToNext,
    starsInCurrentMilestone,
  }
}

/**
 * Format stars as money (200 stars = $100)
 */
export function starsToMoney(stars: number): number {
  return (stars / 2) * 1 // 2 stars = $1
}

/**
 * Format money as stars
 */
export function moneyToStars(money: number): number {
  return money * 2 // $1 = 2 stars
}

/**
 * Get milestone payout for a given milestone number
 */
export function getMilestonePayout(milestoneNumber: number): number {
  return milestoneNumber * 100 // 1st milestone = $100, 2nd = $200, etc.
}

/**
 * Check if a kid reached a new milestone
 */
export function reachedNewMilestone(
  oldTotalStars: number,
  newTotalStars: number
): boolean {
  const oldMilestones = Math.floor(oldTotalStars / 200)
  const newMilestones = Math.floor(newTotalStars / 200)
  return newMilestones > oldMilestones
}
