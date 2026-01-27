'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { deductWeeklyRation } from '@/app/medications/actions'
import { Pill, Loader2, Check } from 'lucide-react'
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

export function WeeklyRefillButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDeduct = async () => {
    setIsLoading(true)
    try {
      await deductWeeklyRation()
      setIsDone(true)
      setTimeout(() => setIsDone(false), 3000)
    } catch (error) {
      console.error(error)
      // Ideally show a toast here, but keeping it simple as requested
    } finally {
      setIsLoading(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <Button 
        onClick={() => setShowConfirm(true)} 
        variant="outline" 
        className="gap-2 bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 hover:text-teal-800 cursor-pointer transition-colors"
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

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wochenration stellen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du wirklich für ALLE Medikamente eine Wochenration (7 Tage) vom Vorrat abziehen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeduct} className="bg-teal-600 hover:bg-teal-700">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Bestätigen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
