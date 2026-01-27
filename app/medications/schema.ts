import { z } from 'zod'

export const MedicationFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name muss mindestens 2 Zeichen lang sein.",
  }),
  current_stock: z.number().min(0, {
    message: "Vorrat darf nicht negativ sein.",
  }),
  daily_dosage: z.number().min(0.1, {
    message: "Tagesdosis muss mindestens 0.1 sein.",
  }),
  package_size: z.number().min(1, {
    message: "Packungsgröße muss mindestens 1 sein.",
  }).optional().nullable(),
  refill_threshold: z.number().min(1, {
    message: "Warnschwelle muss mindestens 1 sein.",
  }),
  frequency_note: z.string().optional(),
  expiry_date: z.date().optional().nullable(),
})

export type MedicationFormData = z.infer<typeof MedicationFormSchema>
