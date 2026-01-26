'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { deductWeeklyRation } from '@/app/medications/actions'
import { Pill, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner' // Assuming sonner or similar usage, but I'll use simple state for now if toast not setup

export function WeeklyRefillButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const handleDeduct = async () => {
    if (!confirm('Möchtest du wirklich für ALLE Medikamente eine Wochenration (7 Tage) vom Vorrat abziehen?')) {
      return
    }

    setIsLoading(true)
    try {
      await deductWeeklyRation()
      setIsDone(true)
      setTimeout(() => setIsDone(false), 3000)
    } catch (error) {
      console.error(error)
      alert('Fehler beim Abziehen der Ration')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleDeduct} 
      variant="outline" 
      className="gap-2 bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 hover:text-teal-800 cursor-pointer"
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isDone ? (
        <Check className="h-4 w-4" />
      ) : (
        <Pill className="h-4 w-4" />
      )}
      {isDone ? 'Erledigt' : 'Wochenration gestellt'}
    </Button>
  )
}
