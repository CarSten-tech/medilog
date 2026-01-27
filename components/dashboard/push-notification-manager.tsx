'use client'

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
  const { isSupported, subscription, subscribeToPush, loading } = usePushNotifications()

  if (loading) return <Button variant="ghost" size="sm" disabled><Loader2 className="h-4 w-4 animate-spin" /></Button>
  
  if (!isSupported) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 cursor-help">
            <BellOff className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Nicht verfügbar</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Push-Nachrichten nicht verfügbar</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Auf dem iPhone funktionieren Benachrichtigungen nur, wenn:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Du mindestens <strong>iOS 16.4</strong> hast.</li>
                <li>Du diese Webseite über <strong>"Teilen" &rarr; "Zum Home-Bildschirm"</strong> installiert hast.</li>
                <li>Du die App <strong>vom Home-Screen</strong> (nicht im Browser) startest.</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-teal-600">Verstanden</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

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
