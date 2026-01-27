import { z } from 'zod'

export const MedicationFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name muss mindestens 2 Zeichen lang sein.",
  }),
  current_stock: z.number()
    .min(0, { message: "Vorrat darf nicht negativ sein." })
    .refine((n) => !Number.isNaN(n), { message: "Bitte geben Sie eine gültige Zahl ein" }),
  daily_dosage: z.number()
    .min(0.001, { message: "Dosis muss größer als 0 sein." })
    .refine((n) => !Number.isNaN(n), { message: "Bitte geben Sie eine gültige Zahl ein" }),
  package_size: z.number()
    .min(1, { message: "Packungsgröße muss mindestens 1 sein." })
    .optional()
    .nullable()
    // Handle refined check if number is provided? 
    // Usually optional() handles undefined. If number provided, it must be valid.
    // If input creates NaN, optional() might not catch it if type is number?
    // z.number().optional() allows undefined. NaN is a number. 
    // So if NaN is passed, it passes optional().
    // I need to refine BEFORE optional? No, refine on the number schema.
    .refine((n) => n === null || n === undefined || !Number.isNaN(n), { message: "Bitte geben Sie eine gültige Zahl ein" }),
  refill_threshold: z.number()
    .min(1, { message: "Warnschwelle muss mindestens 1 sein." })
    .refine((n) => !Number.isNaN(n), { message: "Bitte geben Sie eine gültige Zahl ein" }),
  frequency: z.enum(['daily', 'weekly']).default('daily'),
  frequency_note: z.string().optional(),
  expiry_date: z.date().optional().nullable(),
})

export type MedicationFormData = z.infer<typeof MedicationFormSchema>
