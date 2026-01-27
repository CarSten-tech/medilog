'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EditMedicationForm } from "@/components/medications/edit-medication-form"

export type MedicationStatus = 'ok' | 'warning' | 'critical' | 'expired'

export interface MedicationCardProps {
  id: string
  name: string
  dosage: string
  stockLevel: number
  daysLeft: number
  status: MedicationStatus
  // For Edit Form
  current_stock: number
  daily_dosage: number
  frequency_note?: string | null
  expiry_date?: string | null
  package_size?: number | null
  refill_threshold: number
}

export function MedicationCard({ 
  id,
  name, 
  dosage, 
  stockLevel, 
  daysLeft, 
  status,
  current_stock,
  daily_dosage,
  frequency_note,
  expiry_date,
  package_size,
  refill_threshold
}: MedicationCardProps) {
  const [open, setOpen] = useState(false)

  let StatusIcon = CheckCircle
  let iconColor = "text-emerald-500"
  let iconBg = "bg-emerald-50"
  let progressColor = "bg-emerald-500"
  let daysLeftColor = "text-emerald-600 border-emerald-200 bg-emerald-50"
  
  // Default Text
  let statusText = `${daysLeft} Tage (${current_stock} Stk.)`

  // Logic based on User Request: < 8 Red, < 15 Yellow
  if (status === 'expired') {
    StatusIcon = AlertCircle
    iconColor = "text-red-700"
    iconBg = "bg-red-100"
    progressColor = "bg-red-700"
    daysLeftColor = "text-red-700 font-bold border-red-200 bg-red-50"
    statusText = "ABGELAUFEN"
  } else if (daysLeft < 8) {
    StatusIcon = AlertCircle
    iconColor = "text-rose-500"
    iconBg = "bg-rose-50"
    progressColor = "bg-rose-500"
    daysLeftColor = "text-rose-600 font-medium border-rose-200 bg-rose-50"
  } else if (daysLeft < 15) {
     StatusIcon = AlertTriangle
     iconColor = "text-amber-500"
     iconBg = "bg-amber-50"
     progressColor = "bg-amber-400"
     daysLeftColor = "text-amber-600 font-medium border-amber-200 bg-amber-50"
  }
   // Else Green (Default)

  return (
    <>
      <Card 
        className="border shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98] active:brightness-95"
        onClick={() => setOpen(true)}
      >
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg text-slate-900">{name}</h3>
              <p className="text-sm text-slate-500 mt-1">{dosage}</p>
            </div>
            <div className={cn("p-2 rounded-full", iconBg)}>
              <StatusIcon className={cn("w-5 h-5", iconColor)} />
            </div>
          </div>

          <div className="space-y-3 mt-6">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-slate-600">Vorrat</span>
              <span className={cn("px-2 py-0.5 rounded-md text-xs border", daysLeftColor)}>
                  {statusText}
              </span>
            </div>
            <Progress value={stockLevel} className="h-2" indicatorClassName={progressColor} />
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Medikament bearbeiten</DialogTitle>
          </DialogHeader>
          <EditMedicationForm 
            medicationId={id}
            initialData={{
              name,
              current_stock,
              daily_dosage,
              frequency_note,
              expiry_date,
              package_size,
              refill_threshold,
            }}
            onSuccess={() => setOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
