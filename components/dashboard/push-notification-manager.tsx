'use client'

import { Button } from "@/components/ui/button"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { Bell, Loader2 } from "lucide-react"

export function PushNotificationManager() {
  const { isSupported, subscription, subscribeToPush, loading } = usePushNotifications()

  if (loading) return null
  if (!isSupported) return null

  if (subscription) {
    return (
      <Button variant="outline" className="w-full justify-start text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100 cursor-default">
        <Bell className="mr-2 h-4 w-4 fill-teal-700" />
        Benachrichtigungen aktiv
      </Button>
    )
  }

  return (
    <Button 
        onClick={subscribeToPush} 
        variant="outline" 
        className="w-full justify-start text-slate-600 hover:text-teal-700 hover:bg-teal-50 cursor-pointer"
    >
      <Bell className="mr-2 h-4 w-4" />
      Benachrichtigungen aktivieren
    </Button>
  )
}
