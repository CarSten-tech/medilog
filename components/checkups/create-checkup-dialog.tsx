"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, Plus } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createCheckup } from "@/app/actions/checkups"

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Titel muss mindestens 2 Zeichen lang sein.",
  }),
  frequency_value: z.number().min(1, {
      message: "Muss mindestens 1 sein."
  }),
  frequency_unit: z.enum(["months", "years"]),
  last_visit_date: z.date().optional(),
  notes: z.string().optional(),
})

export function CreateCheckupDialog({ patientId }: { patientId?: string | null }) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      notes: "",
      frequency_value: 6,
      frequency_unit: "months",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true)
    try {
      await createCheckup({
        ...values,
        patient_id: patientId
      })
      toast.success("Vorsorge-Eintrag erstellt")
      setOpen(false)
      form.reset()
    } catch (error) {
      toast.error("Fehler beim Erstellen")
      console.error(error)
    } finally {
        setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
           <Plus className="h-4 w-4" />
           Vorsorge hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Neue Vorsorge</DialogTitle>
          <DialogDescription>
            Erstelle eine Erinnerung für wiederkehrende Arzttermine (z.B. Zahnarzt).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel</FormLabel>
                  <FormControl>
                    <Input placeholder="Zahnarzt Kontrolle" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex gap-4">
                <FormField
                control={form.control}
                name="frequency_value"
                render={({ field }) => (
                    <FormItem className="flex-1">
                    <FormLabel>Intervall</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="frequency_unit"
                render={({ field }) => (
                    <FormItem className="flex-1">
                    <FormLabel>Einheit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Wähle Einheit" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="months">Monate</SelectItem>
                        <SelectItem value="years">Jahre</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="last_visit_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Letzter Besuch (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Datum wählen (wenn bekannt)</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notizen (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Nur bei Dr. Müller" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending}>Erstellen</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
