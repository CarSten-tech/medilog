'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { deletePushSubscription, savePushSubscription } from '@/app/actions/push'
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

  async function togglePush() {
    setLoading(true)
    try {
        if (subscription) {
            // Unsubscribe
            await subscription.unsubscribe()
            await deletePushSubscription(subscription.endpoint)
            setSubscription(null)
            toast.success("Benachrichtigungen deaktiviert")
        } else {
            // Subscribe
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

            // Serialize robustly
            const subJson = sub.toJSON()
            
            // Save to Server
            const res = await savePushSubscription(subJson)
            if (res.error) {
                toast.error(res.error)
                // Rollback if server fails
                await sub.unsubscribe()
            } else {
                setSubscription(sub)
                toast.success("Benachrichtigungen aktiviert!")
            }
        }
    } catch (error) {
        console.error("Subscription toggle failed", error)
        toast.error("Vorgang fehlgeschlagen")
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

  return (
    <Button 
        onClick={togglePush} 
        variant={subscription ? "outline" : "default"} 
        className={subscription ? "gap-2 text-green-600 border-green-200 bg-green-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200" : "gap-2"}
    >
      {subscription ? (
          <>
            <Bell className="w-4 h-4" />
            <span>Aktiv (Klicken zum Deaktivieren) v2</span>
          </>
      ) : (
          <>
            <BellOff className="w-4 h-4" />
            <span>Aktivieren</span>
          </>
      )}
    </Button>
  )
}
