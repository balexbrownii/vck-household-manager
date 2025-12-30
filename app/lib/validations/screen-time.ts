import { z } from 'zod'

export const unlockScreenTimeSchema = z.object({
  kidId: z.string().uuid('Invalid kid ID'),
  date: z.string().date('Invalid date format YYYY-MM-DD'),
})

export type UnlockScreenTimeInput = z.infer<typeof unlockScreenTimeSchema>

export const trackScreenTimeSchema = z.object({
  kidId: z.string().uuid('Invalid kid ID'),
  sessionId: z.string().uuid('Invalid session ID'),
  minutesUsed: z.number().min(0).max(600),
})

export type TrackScreenTimeInput = z.infer<typeof trackScreenTimeSchema>
