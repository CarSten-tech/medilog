'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { savePushSubscription } from '@/app/actions/push'
import { toast } from 'sonner' // Assuming sonner is installed or use standard toast

// Base64 to Uint8Array helper
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      registerServiceWorker()
    } else {
        setLoading(false)
    }
  }, [])

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
      
      const sub = await registration.pushManager.getSubscription()
      setSubscription(sub)
    } catch (error) {
      console.error('Service Worker Registration failed', error)
    } finally {
        setLoading(false)
    }
  }

  async function subscribeToPush() {
    try {
        setLoading(true)
        const registration = await navigator.serviceWorker.ready
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

        if (!vapidPublicKey) {
            toast.error("VAPID Key missing on client")
            return
        }

        const sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        })

        // Save to Server
        const res = await savePushSubscription(JSON.parse(JSON.stringify(sub)))
        if (res.error) {
            toast.error("Fehler beim Speichern des Abos")
        } else {
            setSubscription(sub)
            toast.success("Benachrichtigungen aktiviert!")
        }
    } catch (error) {
        console.error("Subscription failed", error)
        toast.error("Konnte Benachrichtigungen nicht aktivieren")
    } finally {
        setLoading(false)
    }
  }

  if (!isSupported) {
    return null // Hidden on iOS if PWA not installed or unsupported
  }

  if (loading) {
      return <Button variant="ghost" disabled><Loader2 className="w-4 h-4 animate-spin" /></Button>
  }

  if (subscription) {
      return (
          <Button variant="outline" className="gap-2 text-green-600 border-green-200 bg-green-50 pointer-events-none">
              <Bell className="w-4 h-4" />
              Aktiv
          </Button>
      )
  }

  return (
    <Button onClick={subscribeToPush} variant="outline" className="gap-2">
      <BellOff className="w-4 h-4" />
      Benachrichtigungen aktivieren
    </Button>
  )
}
