'use client'

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createMedication } from "@/app/medications/actions"
import { MedicationFormSchema, type MedicationFormData } from "@/app/medications/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useState } from "react"

interface CreateMedicationFormProps {
  onSuccess: () => void
}

export function CreateMedicationForm({ onSuccess }: CreateMedicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<MedicationFormData>({
    resolver: zodResolver(MedicationFormSchema),
    defaultValues: {
      daily_dosage: 1,
      current_stock: 0,
      refill_threshold: 10,
    }
  })

  const onSubmit = async (data: MedicationFormData) => {
    setIsSubmitting(true)
    try {
      const result = await createMedication(data)
      // If we assume success or check result.success
      onSuccess()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        {/* Name */}
        <div className="space-y-2">
            <Label htmlFor="name">Name des Medikaments</Label>
            <Input 
            id="name" 
            placeholder="z.B. Ibuprofen 600" 
            {...form.register('name')} 
            className="h-11"
            />
            {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Current Stock */}
            <div className="space-y-2">
                <Label htmlFor="stock">Aktueller Vorrat (Stück)</Label>
                <Input 
                id="stock" 
                type="number" 
                {...form.register('current_stock', { valueAsNumber: true })} 
                className="h-11"
                />
                {form.formState.errors.current_stock && <p className="text-sm text-red-500">{form.formState.errors.current_stock.message}</p>}
            </div>

            {/* Daily Dosage */}
            <div className="space-y-2">
                <Label htmlFor="dosage">Tagesdosis (Gesamt)</Label>
                <Input 
                id="dosage" 
                type="number"
                step="0.5" 
                {...form.register('daily_dosage', { valueAsNumber: true })} 
                className="h-11"
                />
                {form.formState.errors.daily_dosage && <p className="text-sm text-red-500">{form.formState.errors.daily_dosage.message}</p>}
            </div>

            {/* Package Size */}
            <div className="space-y-2">
                <Label htmlFor="package_size">Packungsgröße (Optional)</Label>
                <Input 
                id="package_size" 
                type="number" 
                placeholder="z.B. 20 (ganze Packung)"
                {...form.register('package_size', { valueAsNumber: true })} 
                className="h-11"
                />
                {form.formState.errors.package_size && <p className="text-sm text-red-500">{form.formState.errors.package_size.message}</p>}
            </div>
        </div>

        {/* Frequency Note */}
        <div className="space-y-2">
            <Label htmlFor="frequency">Wie oft / Wann? (Optional)</Label>
            <Input 
            id="frequency" 
            placeholder="z.B. Morgens 1, Abends 1/2" 
            {...form.register('frequency_note')} 
            className="h-11"
            />
        </div>

        {/* Expiry Date */}
        <div className="space-y-2 flex flex-col">
            <Label>Ablaufdatum (Optional)</Label>
            <Popover>
            <PopoverTrigger asChild>
                <Button
                variant={"outline"}
                className={cn(
                    "h-11 pl-3 text-left font-normal border-slate-200 cursor-pointer",
                    !form.watch('expiry_date') && "text-muted-foreground"
                )}
                >
                {form.watch('expiry_date') ? (
                    format(form.watch('expiry_date')!, "dd.MM.yyyy")
                ) : (
                    <span>Wähle ein Datum</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                mode="single"
                selected={form.watch('expiry_date') || undefined}
                onSelect={(date) => form.setValue('expiry_date', date as Date)}
                disabled={(date) => date < new Date("1900-01-01")}
                initialFocus
                />
            </PopoverContent>
            </Popover>
        </div>

        <div className="flex justify-end pt-4 border-t">
            <Button 
                type="submit" 
                className="bg-teal-600 hover:bg-teal-700 text-white min-w-[120px] cursor-pointer"
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Speichern</>
                ) : 'Speichern'}
            </Button>
        </div>
    </form>
  )
}
