import { z } from 'zod'

export const createHolidaySchema = z.object({
  name: z.string().min(2, 'Holiday name must be at least 2 characters').max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
})

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>
