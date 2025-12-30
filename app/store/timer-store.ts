import { create } from 'zustand'

export interface ScreenTimer {
  kidId: string
  minutesRemaining: number
  startedAt: number
  baseMinutes: number
  bonusMinutes: number
  isPastCutoff: boolean
}

interface TimerState {
  screenTimers: Record<string, ScreenTimer>
  startScreenTimer: (
    kidId: string,
    baseMinutes: number,
    bonusMinutes: number,
    isPastCutoff: boolean
  ) => void
  updateScreenTimer: (kidId: string, minutesRemaining: number) => void
  stopScreenTimer: (kidId: string) => void
  tickAllTimers: () => void
}

export const useTimerStore = create<TimerState>((set, get) => ({
  screenTimers: {},

  startScreenTimer: (kidId, baseMinutes, bonusMinutes, isPastCutoff) => {
    set((state) => ({
      screenTimers: {
        ...state.screenTimers,
        [kidId]: {
          kidId,
          minutesRemaining: baseMinutes + bonusMinutes,
          startedAt: Date.now(),
          baseMinutes,
          bonusMinutes,
          isPastCutoff,
        },
      },
    }))
  },

  updateScreenTimer: (kidId, minutesRemaining) => {
    set((state) => ({
      screenTimers: {
        ...state.screenTimers,
        [kidId]: {
          ...state.screenTimers[kidId],
          minutesRemaining,
        },
      },
    }))
  },

  stopScreenTimer: (kidId) => {
    set((state) => {
      const { [kidId]: _, ...rest } = state.screenTimers
      return { screenTimers: rest }
    })
  },

  tickAllTimers: () => {
    const now = Date.now()
    set((state) => {
      const updated = { ...state.screenTimers }

      Object.entries(updated).forEach(([kidId, timer]) => {
        const elapsedMs = now - timer.startedAt
        const elapsedMinutes = elapsedMs / (1000 * 60)
        const remaining = Math.max(0, timer.baseMinutes + timer.bonusMinutes - elapsedMinutes)

        updated[kidId] = {
          ...timer,
          minutesRemaining: remaining,
        }

        // Remove timer if expired
        if (remaining <= 0) {
          delete updated[kidId]
        }
      })

      return { screenTimers: updated }
    })
  },
}))
