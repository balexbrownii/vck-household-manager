import { z } from 'zod'

export const startTimeoutSchema = z.object({
  kidId: z.string().uuid('Invalid kid ID'),
  violationType: z.string().min(1, 'Violation type required'),
  notes: z.string().optional().nullable(),
})

export type StartTimeoutInput = z.infer<typeof startTimeoutSchema>

export const resetTimeoutSchema = z.object({
  timeoutId: z.string().uuid('Invalid timeout ID'),
})

export type ResetTimeoutInput = z.infer<typeof resetTimeoutSchema>

export const completeTimeoutSchema = z.object({
  timeoutId: z.string().uuid('Invalid timeout ID'),
})

export type CompleteTimeoutInput = z.infer<typeof completeTimeoutSchema>
