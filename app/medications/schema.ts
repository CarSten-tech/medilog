import { z } from 'zod'

export const MedicationFormSchema = z.object({
  // Basic
  name: z.string().min(1, 'Name is required'),
  current_stock: z.number().min(0, 'Stock cannot be negative'),
  daily_dosage: z.number().min(1, 'Daily dosage must be at least 1'),
  frequency_note: z.string().optional(),
  expiry_date: z.date().optional(),
  package_size: z.number().min(1, "Package size must be at least 1").optional(),
  // Hidden defaults
  refill_threshold: z.number(),
})

export type MedicationFormData = z.infer<typeof MedicationFormSchema>
