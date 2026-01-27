'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Users, User, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Patient {
    id: string
    full_name: string | null
    email: string | null
}

interface PatientSwitcherProps {
    patients: Patient[]
    currentUser: { id: string, email?: string }
}

export function PatientSwitcher({ patients, currentUser }: PatientSwitcherProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentPatientId = searchParams.get('patientId')
  const isSelf = !currentPatientId || currentPatientId === currentUser.id

  let activeName = "Meine Medikamente"
  
  if (!isSelf) {
      const patient = patients.find(p => p.id === currentPatientId)
      if (patient) {
          activeName = patient.full_name || patient.email || "Patient"
      }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn("flex items-center gap-2", !isSelf && "text-teal-600 font-semibold")}>
            {isSelf ? <User className="h-4 w-4" /> : <Users className="h-4 w-4" />}
            <span className="inline-block max-w-[100px] sm:max-w-[150px] truncate">
                {activeName}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        <DropdownMenuLabel>Ansicht wechseln</DropdownMenuLabel>
        
        <DropdownMenuItem onClick={() => router.push('/dashboard')}>
            <User className="mr-2 h-4 w-4" />
            <span>Meine Medikamente</span>
            {isSelf && <span className="ml-auto text-xs text-teal-600">Aktiv</span>}
        </DropdownMenuItem>

        {patients.length > 0 && <DropdownMenuSeparator />}
        {patients.length > 0 && <DropdownMenuLabel>Meine Patienten</DropdownMenuLabel>}

        {patients.map(patient => (
            <DropdownMenuItem key={patient.id} onClick={() => router.push(`/dashboard?patientId=${patient.id}`)}>
                <Users className="mr-2 h-4 w-4 text-slate-500" />
                <span>{patient.full_name || patient.email}</span>
                {currentPatientId === patient.id && <span className="ml-auto text-xs text-teal-600">Aktiv</span>}
            </DropdownMenuItem>
        ))}
        
        {patients.length === 0 && (
             <div className="p-2 text-xs text-slate-400 text-center">
                 Du betreust niemanden.
             </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
