'use client'

import { Plus } from "lucide-react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CreateMedicationForm } from "@/components/medications/create-medication-form"

export function AddCard() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="h-full min-h-[180px] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-teal-300 transition-all cursor-pointer flex flex-col items-center justify-center group active:scale-[0.98] active:border-teal-400 active:bg-slate-100">
            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all group-active:scale-110 group-active:shadow-md">
                <Plus className="w-6 h-6 text-slate-400 group-hover:text-teal-500 group-active:text-teal-500" />
            </div>
            <span className="mt-4 font-semibold text-slate-500 group-hover:text-teal-600 group-active:text-teal-600">Neues Medikament</span>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Neues Medikament anlegen</DialogTitle>
        </DialogHeader>
        <CreateMedicationForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
