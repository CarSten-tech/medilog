'use client'

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { updateMedication, deleteMedication } from "@/app/medications/actions"
import { MedicationFormSchema, type MedicationFormData } from "@/app/medications/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Trash2, Pencil } from "lucide-react"
import { useState } from "react"

export interface EditMedicationFormProps {
  medicationId: string
  initialData: {
    name: string
    current_stock: number
    daily_dosage: number
    frequency_note?: string | null
    expiry_date?: string | null
    package_size?: number | null
    refill_threshold: number
  }
  onSuccess: () => void
}

export function EditMedicationForm({ medicationId, initialData, onSuccess }: EditMedicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)

  const form = useForm<MedicationFormData>({
    resolver: zodResolver(MedicationFormSchema),
    defaultValues: {
      name: initialData.name,
      current_stock: initialData.current_stock,
      daily_dosage: initialData.daily_dosage ?? 1,
      frequency_note: initialData.frequency_note ?? '',
      expiry_date: initialData.expiry_date ? new Date(initialData.expiry_date) : undefined,
      package_size: initialData.package_size ?? undefined,
      refill_threshold: initialData.refill_threshold ?? 10,
    }
  })

  const onSubmit = async (data: MedicationFormData) => {
    setIsSubmitting(true)
    try {
      await updateMedication(medicationId, data)
      onSuccess()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Medikament wirklich löschen?')) return
    
    setIsDeleting(true)
    try {
      await deleteMedication(medicationId)
      onSuccess()
    } catch (error) {
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        {/* Name */}
        {/* Name (Locked by default) */}
        <div className="space-y-2">
            <Label htmlFor="name">Name des Medikaments</Label>
            {!isEditingName ? (
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-md">
                    <span className="font-semibold text-slate-700">{form.getValues('name')}</span>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsEditingName(true)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-teal-600 hover:bg-teal-50 cursor-pointer"
                    >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Bearbeiten</span>
                    </Button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <Input 
                        id="name" 
                        placeholder="z.B. Ibuprofen 600" 
                        {...form.register('name')} 
                        className="h-11"
                        autoFocus
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsEditingName(false)}
                        className="h-11 px-3"
                    >
                        Abbrechen
                    </Button>
                </div>
            )}
            {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Current Stock */}
            <div className="space-y-2">
                <Label htmlFor="stock">Aktueller Vorrat (Stück)</Label>
                <div className="flex gap-2">
                    <Input 
                        id="stock" 
                        type="number" 
                        {...form.register('current_stock', { valueAsNumber: true })} 
                        className="h-11"
                    />
                    {form.watch('package_size') && form.watch('package_size')! > 0 && (
                        <Button 
                            type="button" 
                            variant="outline" 
                            className="h-11 px-3 border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 cursor-pointer"
                            onClick={() => {
                                const current = form.getValues('current_stock') || 0
                                const size = form.getValues('package_size')!
                                form.setValue('current_stock', current + size)
                            }}
                        >
                            +{form.watch('package_size')}
                        </Button>
                    )}
                </div>
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

        <div className="flex justify-between pt-4 border-t">
            <Button 
                type="button"
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 cursor-pointer"
                disabled={isDeleting}
            >
                {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                )}
                Löschen
            </Button>
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

