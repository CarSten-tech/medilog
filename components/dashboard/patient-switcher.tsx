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
  
  // Find current patient name
  let activeName = "Mein Profil"
  if (!isSelf) {
      const patient = patients.find(p => p.id === currentPatientId)
      if (patient) {
          activeName = patient.full_name || patient.email || "Patient"
      }
  }

  if (patients.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2 gap-2 border-dashed">
          {isSelf ? <User className="h-4 w-4" /> : <Users className="h-4 w-4 text-teal-600" />}
          <span className={cn("hidden md:inline", !isSelf && "text-teal-700 font-medium")}>
            {activeName}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Ansicht wechseln</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => router.push('/dashboard')}>
            <User className="mr-2 h-4 w-4" />
            <span>Mein Profil (Ich)</span>
            {isSelf && <span className="ml-auto text-xs text-slate-500">Aktiv</span>}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {patients.map(patient => (
            <DropdownMenuItem key={patient.id} onClick={() => router.push(`/dashboard?patientId=${patient.id}`)}>
                <Users className="mr-2 h-4 w-4 text-slate-500" />
                <span>{patient.full_name || patient.email}</span>
                {currentPatientId === patient.id && <span className="ml-auto text-xs text-teal-600">Aktiv</span>}
            </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
