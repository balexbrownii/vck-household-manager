export interface ViolationRule {
  type: string
  minutes: number
  description: string
  category: 'communication' | 'responsibility' | 'safety' | 'respect'
}

/**
 * All violation rules mapped by type
 */
export const VIOLATION_RULES: Record<string, ViolationRule> = {
  disrespect: {
    type: 'disrespect',
    minutes: 10,
    description: 'Disrespectful tone or attitude',
    category: 'respect',
  },
  defiance: {
    type: 'defiance',
    minutes: 15,
    description: 'Refusing to follow instruction',
    category: 'responsibility',
  },
  talking_back: {
    type: 'talking_back',
    minutes: 10,
    description: 'Arguing or talking back',
    category: 'respect',
  },
  sibling_conflict: {
    type: 'sibling_conflict',
    minutes: 10,
    description: 'Fighting or arguing with sibling',
    category: 'respect',
  },
  lying: {
    type: 'lying',
    minutes: 20,
    description: 'Being dishonest',
    category: 'responsibility',
  },
  damage: {
    type: 'damage',
    minutes: 30,
    description: 'Intentional damage to property',
    category: 'safety',
  },
  unsafe_behavior: {
    type: 'unsafe_behavior',
    minutes: 30,
    description: 'Unsafe or dangerous behavior',
    category: 'safety',
  },
  screen_time_violation: {
    type: 'screen_time_violation',
    minutes: 15,
    description: 'Using screen without permission',
    category: 'responsibility',
  },
  incomplete_chore: {
    type: 'incomplete_chore',
    minutes: 5,
    description: 'Rushed or incomplete chore work',
    category: 'responsibility',
  },
  not_listening: {
    type: 'not_listening',
    minutes: 5,
    description: 'Not listening to instruction',
    category: 'communication',
  },
}

/**
 * Get timeout duration for a violation type
 */
export function getTimeoutDuration(violationType: string): number {
  return VIOLATION_RULES[violationType]?.minutes ?? 10
}

/**
 * Get violation rule by type
 */
export function getViolationRule(violationType: string): ViolationRule | null {
  return VIOLATION_RULES[violationType] ?? null
}

/**
 * Get all violation types
 */
export function getAllViolationTypes(): string[] {
  return Object.keys(VIOLATION_RULES)
}

/**
 * Get violation types by category
 */
export function getViolationsByCategory(
  category: 'communication' | 'responsibility' | 'safety' | 'respect'
): ViolationRule[] {
  return Object.values(VIOLATION_RULES).filter((rule) => rule.category === category)
}

/**
 * Check if timeout should be doubled for refusal
 */
export function shouldDoubleTimeout(
  refusedToGo: boolean,
  countdownExpired: boolean
): boolean {
  return refusedToGo && countdownExpired
}

/**
 * Calculate actual timeout duration including resets and doubling
 */
export function calculateActualTimeoutDuration(
  baseMinutes: number,
  resetCount: number,
  doubled: boolean
): number {
  // Each reset adds the full timeout duration again
  const totalAfterResets = baseMinutes * (resetCount + 1)

  // If doubled (for refusal), double the result
  return doubled ? totalAfterResets * 2 : totalAfterResets
}

/**
 * Calculate timeout end time
 */
export function calculateTimeoutEnd(
  startTime: Date,
  baseMinutes: number,
  resetCount: number,
  doubled: boolean
): Date {
  const actualMinutes = calculateActualTimeoutDuration(baseMinutes, resetCount, doubled)
  return new Date(startTime.getTime() + actualMinutes * 60000)
}

/**
 * Calculate time remaining in timeout
 */
export function getTimeoutRemaining(
  startTime: Date,
  baseMinutes: number,
  resetCount: number,
  doubled: boolean,
  currentTime: Date = new Date()
): number {
  const endTime = calculateTimeoutEnd(startTime, baseMinutes, resetCount, doubled)
  const diffMs = endTime.getTime() - currentTime.getTime()

  if (diffMs <= 0) return 0

  return Math.ceil(diffMs / 60000) // Return minutes, rounded up
}

/**
 * Format timeout duration for display
 */
export function formatTimeoutDuration(minutes: number): string {
  if (minutes < 1) return '<1 min'
  if (minutes === 1) return '1 min'
  return `${minutes} min`
}
