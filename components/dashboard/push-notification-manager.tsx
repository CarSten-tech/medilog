'use client'

import { Button } from "@/components/ui/button"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { Bell, BellOff, Loader2 } from "lucide-react"

export function PushNotificationManager() {
  const { isSupported, subscription, subscribeToPush, loading } = usePushNotifications()

  if (loading) return <Button variant="ghost" size="sm" disabled><Loader2 className="h-4 w-4 animate-spin" /></Button>
  
  if (!isSupported) {
    return (
      <Button variant="ghost" size="sm" className="text-slate-400 cursor-not-allowed" title="Push nicht verfügbar">
        <BellOff className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline">Nicht verfügbar</span>
      </Button>
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
