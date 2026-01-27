'use client'

import { Button } from "@/components/ui/button"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { Bell, BellOff, Loader2, HelpCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function PushNotificationManager() {
  if (subscription) {
    return (
      <Button variant="outline" size="sm" className="text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100 cursor-default">
        <Bell className="h-4 w-4 fill-teal-700 md:mr-2" />
        <span className="hidden md:inline">Aktiv</span>
      </Button>
    )
  }

  return (
    <Button 
        onClick={subscribeToPush} 
        variant="outline"
        size="sm"
        className="text-slate-600 hover:text-teal-700 hover:bg-teal-50 cursor-pointer"
    >
      <Bell className="h-4 w-4 md:mr-2" />
      <span className="hidden md:inline">Aktivieren</span>
    </Button>
  )
}
