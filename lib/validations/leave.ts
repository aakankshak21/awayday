import { z } from 'zod'

export const createLeaveSchema = z.object({
  leave_type: z.enum(['privileged', 'sick', 'casual', 'unpaid', 'other']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  reason: z.string().max(500).optional(),
}).refine(data => data.end_date >= data.start_date, {
  message: 'End date must be after start date',
  path: ['end_date'],
})

export const updateLeaveStatusSchema = z.object({
  status: z.enum(['approved', 'rejected', 'compensated']),
  manager_comment: z.string().max(500).optional(),
})

export type CreateLeaveInput = z.infer<typeof createLeaveSchema>
export type UpdateLeaveStatusInput = z.infer<typeof updateLeaveStatusSchema>
