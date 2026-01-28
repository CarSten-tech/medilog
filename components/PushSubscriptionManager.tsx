'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'

import { savePushSubscription, deletePushSubscription } from '@/app/actions/push'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushSubscriptionManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSupported, setIsSupported] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // 1. Feature Detection
    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
        setIsSupported(true)
        setPermission(Notification.permission)
        
        // Check IOS PWA status
        const isIOSCheck = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSCheck)
        const isStandaloneCheck = window.matchMedia('(display-mode: standalone)').matches;
        setIsStandalone(isStandaloneCheck)

        registerAndCheck()
    } else {
        setLoading(false)
    }
  }, [])

  async function registerAndCheck() {
      try {
          const reg = await navigator.serviceWorker.register('/sw.js')
          await reg.update() // Ensure latest SW
          const sub = await reg.pushManager.getSubscription()
          setSubscription(sub)
      } catch (e) {
          console.error("SW Register fail", e)
      } finally {
          setLoading(false)
      }
  }

  async function handleToggle() {
      setLoading(true)
      try {
          if (subscription) {
              // UNSUBSCRIBE
              await subscription.unsubscribe()
              await deletePushSubscription(subscription.endpoint)
              setSubscription(null)
              toast.success("Abgemeldet.")
          } else {
              // SUBSCRIBE
              // 1. Request Permission (Must be user triggered)
              const perm = await Notification.requestPermission()
              setPermission(perm)

              if (perm === 'granted') {
                  const reg = await navigator.serviceWorker.ready
                  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                  
                  if (!vapidKey) throw new Error("VAPID Public Key missing")

                  // 2. Subscribe via Browser
                  const sub = await reg.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: urlBase64ToUint8Array(vapidKey)
                  })

                  // 3. Serialize & Save
                  // Explicit JSON serialization to ensure keys are captured
                  const subJson = JSON.parse(JSON.stringify(sub))
                  
                  const res = await savePushSubscription(subJson, navigator.userAgent)
                  
                  if (res.error) {
                      // Rollback
                      await sub.unsubscribe()
                      toast.error("Server-Fehler: " + res.error)
                  } else {
                      setSubscription(sub)
                      toast.success("Push-Benachrichtigungen aktiviert! 🚀")
                  }
              } else {
                  toast.error("Berechtigung erforderlich")
              }
          }
      } catch (e) {
          console.error("Toggle Error", e)
          toast.error("Fehler beim Umschalten")
      } finally {
          setLoading(false)
      }
  }

  // --- RENDER STATES ---

  if (!isSupported) {
      return null // Or show "Not supported on this device"
  }

  // iOS Specific Warning: PWA must be installed
  if (isIOS && !isStandalone) {
      return (
          <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4 text-sm flex gap-3 text-amber-800">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div>
                      <strong>iOS Hinweis:</strong> Push-Benachrichtigungen funktionieren auf dem iPhone nur, wenn du diese App zum <strong>Home-Bildschirm hinzufügst</strong>.
                  </div>
              </CardContent>
          </Card>
      )
  }

  if (loading) {
      return <Button disabled variant="outline"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Laden...</Button>
  }

  if (permission === 'denied') {
       return (
          <Button variant="destructive" disabled className="opacity-80">
              <BellOff className="w-4 h-4 mr-2" />
              In Einstellungen blockiert
          </Button>
       )
  }

  return (
    <div className="flex flex-col gap-2">
        <Button 
            onClick={handleToggle}
            variant={subscription ? "outline" : "default"}
            className={subscription ? "bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200" : ""}
        >
            {subscription ? (
                <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Aktiviert (Tippen zum Stoppen)
                </>
            ) : (
                <>
                    <Bell className="w-4 h-4 mr-2" />
                    Benachrichtigungen Aktivieren
                </>
            )}
        </Button>
        {subscription && (
            <p className="text-xs text-muted-foreground text-center">
                Gerät registriert: {new Date().toLocaleTimeString()}
            </p>
        )}
    </div>
  )
}
