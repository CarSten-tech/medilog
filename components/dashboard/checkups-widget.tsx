"use client"

import { useState } from "react"
import { Checkup, completeCheckup, deleteCheckup } from "@/app/actions/checkups"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Trash2, Calendar as CalendarIcon, AlertTriangle } from "lucide-react"
import { format, differenceInDays, isPast, isToday } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { CreateCheckupDialog } from "@/components/checkups/create-checkup-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"

function CheckupItem({ checkup }: { checkup: Checkup }) {
    const [isPending, setIsPending] = useState(false)
    const [doneDate, setDoneDate] = useState<Date>(new Date())
    const [popoverOpen, setPopoverOpen] = useState(false)

    const nextDue = checkup.next_due_date ? new Date(checkup.next_due_date) : new Date()
    const daysLeft = differenceInDays(nextDue, new Date())
    const isOverdue = daysLeft < 0
    const isDueSoon = daysLeft >= 0 && daysLeft <= 30

    async function handleMarkDone() {
        setIsPending(true)
        try {
            await completeCheckup(checkup.id, doneDate)
            toast.success("Erledigt markiert!")
            setPopoverOpen(false)
        } catch (e) {
            toast.error("Fehler")
        } finally {
            setIsPending(false)
        }
    }

    async function handleDelete() {
        if (!confirm("Wirklich löschen?")) return
        setIsPending(true)
        try {
            await deleteCheckup(checkup.id)
            toast.success("Gelöscht")
        } catch(e) {
            toast.error("Fehler")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-card/50">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <span className="font-medium">{checkup.title}</span>
                    {isOverdue && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold"><AlertTriangle className="w-3 h-3"/> Überfällig</span>}
                    {isDueSoon && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold">Bald fällig</span>}
                </div>
                <div className="text-sm text-muted-foreground flex gap-3">
                    <span title="Nächste Fälligkeit">
                        🗓️ {checkup.next_due_date ? format(new Date(checkup.next_due_date), "dd.MMM yyyy", { locale: de }) : "Sofort"}
                    </span>
                    <span title="Intervall">
                        🔄 {checkup.frequency_value} {checkup.frequency_unit === 'months' ? 'Monate' : 'Jahre'}
                    </span>
                </div>
            </div>
            
            <div className="flex items-center gap-1">
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button size="icon" variant="outline" className={cn("h-8 w-8", isOverdue ? "border-red-500 text-red-500 hover:bg-red-50" : "text-green-600 hover:text-green-700")}>
                            <Check className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" align="end">
                        <div className="flex flex-col gap-3">
                            <h4 className="font-medium leading-none">Wann erledigt?</h4>
                            <p className="text-sm text-muted-foreground">Datum des Arztbesuchs:</p>
                            <Calendar
                                mode="single"
                                selected={doneDate}
                                onSelect={(d) => d && setDoneDate(d)}
                                disabled={(d) => d > new Date()}
                                initialFocus
                            />
                            <Button size="sm" onClick={handleMarkDone} disabled={isPending}>
                                Bestätigen
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

export function CheckupsWidget({ checkups }: { checkups: Checkup[] }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">Vorsorge & Termine</CardTitle>
                <CreateCheckupDialog />
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                {checkups.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        Keine Vorsorge-Erinnerungen aktiv.
                    </div>
                ) : (
                    checkups.map(checkup => (
                        <CheckupItem key={checkup.id} checkup={checkup} />
                    ))
                )}
            </CardContent>
        </Card>
    )
}
