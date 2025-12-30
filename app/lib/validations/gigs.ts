import { z } from 'zod'

export const claimGigSchema = z.object({
  kidId: z.string().uuid('Invalid kid ID'),
  gigId: z.string().uuid('Invalid gig ID'),
})

export type ClaimGigInput = z.infer<typeof claimGigSchema>

export const approveGigSchema = z.object({
  claimedGigId: z.string().uuid('Invalid claimed gig ID'),
  notes: z.string().optional(),
})

export type ApproveGigInput = z.infer<typeof approveGigSchema>

export const rejectGigSchema = z.object({
  claimedGigId: z.string().uuid('Invalid claimed gig ID'),
  reason: z.string().optional(),
})

export type RejectGigInput = z.infer<typeof rejectGigSchema>
