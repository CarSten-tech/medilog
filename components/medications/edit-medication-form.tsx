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
import { CalendarIcon, Loader2, Trash2, Pencil, XIcon } from "lucide-react"
import { useState } from "react"
import { checkMedicationName } from "@/app/medications/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  
  // Dialog States
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [pendingData, setPendingData] = useState<MedicationFormData | null>(null)

  // Frequency State (Parse initial string or default to 0)
  // Format: "M: 1, M: 0, A: 1"
  const parseFrequency = (note: string = '') => {
    const parts = note.match(/Morgens: ([\d.]+), Mittags: ([\d.]+), Abends: ([\d.]+)/)
    if (parts) {
      return {
        morning: parts[1],
        noon: parts[2],
        evening: parts[3]
      }
    }
    return { morning: '', noon: '', evening: '' }
  }

  const [frequency, setFrequency] = useState(parseFrequency(initialData.frequency_note || ''))

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

  // Update hidden frequency_note field when inputs change
  const updateFrequencyNote = (newFreq: typeof frequency) => {
    const note = `Morgens: ${newFreq.morning || 0}, Mittags: ${newFreq.noon || 0}, Abends: ${newFreq.evening || 0}`
    form.setValue('frequency_note', note)
    setFrequency(newFreq)
  }

  const handlePreSubmit = async (data: MedicationFormData) => {
    setIsSubmitting(true)
    try {
      // Check for duplicates only if name changed
      if (data.name !== initialData.name) {
        const exists = await checkMedicationName(data.name, medicationId)
        if (exists) {
          setPendingData(data)
          setShowDuplicateDialog(true)
          setIsSubmitting(false)
          return
        }
      }
      await performUpdate(data)
    } catch (error) {
      console.error(error)
      setIsSubmitting(false)
    }
  }

  const performUpdate = async (data: MedicationFormData) => {
    try {
      await updateMedication(medicationId, data)
      onSuccess()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
      setShowDuplicateDialog(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteMedication(medicationId)
      onSuccess()
    } catch (error) {
      console.error(error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // Safe check for package size to avoid rendering "NaN"
  const packageSize = form.watch('package_size')
  const hasValidPackageSize = typeof packageSize === 'number' && !isNaN(packageSize) && packageSize > 0

  return (
    <>
      <form onSubmit={form.handleSubmit(handlePreSubmit)} className="space-y-6">
        
        {/* Header Section with Name Lock */}
        <div className="flex items-center justify-between pb-4 border-b mb-6">
          {!isEditingName ? (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{form.watch('name')}</h2>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon"
                onClick={() => setIsEditingName(true)}
                className="h-8 w-8 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full"
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Name bearbeiten</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
               <Input 
                  id="name" 
                  placeholder="Name" 
                  {...form.register('name')} 
                  className="h-10 text-lg font-semibold"
                  autoFocus
              />
              <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditingName(false)}
                  className="h-10 w-10 text-slate-500"
              >
                  <XIcon className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Current Stock */}
            <div className="flex flex-col gap-2 sm:h-full">
                <Label htmlFor="stock">Aktueller Vorrat</Label>
                <div className="flex gap-2 mt-auto">
                    <Input 
                        id="stock" 
                        type="number" 
                        {...form.register('current_stock', { valueAsNumber: true })} 
                        className="h-11"
                    />
                    {/* NaN Fix: Only show button if package_size is a valid number > 0 */}
                    {hasValidPackageSize && (
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
                            +{packageSize}
                        </Button>
                    )}
                </div>
                {form.formState.errors.current_stock && <p className="text-sm text-red-500">{form.formState.errors.current_stock.message}</p>}
            </div>

            {/* Daily Dosage */}
            <div className="flex flex-col gap-2 sm:h-full">
                <Label htmlFor="dosage">Tagesdosis (Gesamt)</Label>
                <Input 
                id="dosage" 
                type="number"
                step="0.5" 
                {...form.register('daily_dosage', { valueAsNumber: true })} 
                className="h-11 mt-auto"
                />
                {form.formState.errors.daily_dosage && <p className="text-sm text-red-500">{form.formState.errors.daily_dosage.message}</p>}
            </div>

            {/* Package Size */}
            <div className="flex flex-col gap-2 sm:h-full">
                <Label htmlFor="package_size">Packungsgröße</Label>
                <Input 
                id="package_size" 
                type="number" 
                placeholder="z.B. 20"
                {...form.register('package_size', { valueAsNumber: true })} 
                className="h-11 mt-auto"
                />
                {form.formState.errors.package_size && <p className="text-sm text-red-500">{form.formState.errors.package_size.message}</p>}
            </div>
        </div>

        {/* Frequency 3-Slot Input (Morgens, Mittags, Abends) */}
        <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <Label className="text-base font-semibold text-slate-700">Wann wird eingenommen?</Label>
            <div className="grid grid-cols-3 gap-2">
              {['Morgens', 'Mittags', 'Abends'].map((time) => (
                 <div key={time} className="space-y-1">
                    <Label className="text-xs text-slate-500 font-medium uppercase tracking-wider">{time}</Label>
                    <Input 
                      type="number" 
                      step="0.5" 
                      placeholder="0"
                      className="h-10 text-center bg-white"
                      value={frequency[time === 'Morgens' ? 'morning' : time === 'Mittags' ? 'noon' : 'evening'] as string}
                      onChange={(e) => {
                         const val = e.target.value
                         const field = time === 'Morgens' ? 'morning' : time === 'Mittags' ? 'noon' : 'evening'
                         updateFrequencyNote({ ...frequency, [field]: val })
                      }}
                    />
                 </div>
              ))}
            </div>
            <input type="hidden" {...form.register('frequency_note')} />
        </div>

        {/* Expiry Date */}
        <div className="space-y-2 flex flex-col">
            <Label>Ablaufdatum</Label>
            <Popover>
            <PopoverTrigger asChild>
                <Button
                variant={"outline"}
                className={cn(
                    "h-11 pl-3 text-left font-normal border-slate-200 cursor-pointer w-full",
                    !form.watch('expiry_date') && "text-muted-foreground"
                )}
                >
                {form.watch('expiry_date') ? (
                    format(form.watch('expiry_date')!, "dd.MM.yyyy")
                ) : (
                    <span>Kein Datum gewählt</span>
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

        <div className="flex justify-between pt-6 border-t mt-8">
            <Button 
                type="button"
                variant="ghost"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
                Medikament löschen
            </Button>
            <Button 
                type="submit" 
                className="bg-teal-600 hover:bg-teal-700 text-white min-w-[140px]"
                disabled={isSubmitting}
            >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
            </Button>
        </div>
      </form>

      {/* Delete Alert Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Medikament wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Das Medikament "{initialData.name}" wird unwiderruflich entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Löschen bestätigen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Warning Dialog */}
      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Doppelter Name erkannt</AlertDialogTitle>
            <AlertDialogDescription>
              Ein Medikament mit dem Namen "{pendingData?.name}" existiert bereits. Möchtest du es trotzdem speichern?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsSubmitting(false)}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingData && performUpdate(pendingData)} className="bg-teal-600 hover:bg-teal-700">
              Trotzdem speichern
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
