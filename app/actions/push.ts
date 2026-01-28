'use server'

import { createClient } from '@/utils/supabase/server'
import webpush from 'web-push'

/**
 * Save a Web Push Subscription (VAPID)
 */
export async function savePushSubscription(subscription: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { endpoint, keys } = subscription

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
        user_id: user.id,
        endpoint: endpoint,
        keys: keys,
        updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, endpoint' })

  if (error) {
    console.error("Save Sub Error", error)
    return { error: 'Failed to save subscription' }
  }

  return { success: true }
}


/**
 * Helper: Send a single notification (Server-Side)
 * Useful for "Test Notification" button or immediate alerts.
 */
export async function sendNotificationToUser(userId: string, title: string, body: string) {
    const supabase = await createClient()
    
    // Fetch user subs
    const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
    
    if (!subs || subs.length === 0) return { error: 'User has no subscriptions' }

    // VAPID Setup
    const vapidEmail = 'mailto:admin@medilog.app'
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

    if (!vapidPrivateKey || !vapidPublicKey) return { error: 'Server VAPID config missing' }

    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)

    const payload = JSON.stringify({
        title,
        body,
        icon: '/icon.png'
    })

    const results = await Promise.allSettled(subs.map(sub => {
        // @ts-ignore
        return webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: sub.keys
        }, payload)
    }))

    // Cleanup invalid subs logic could go here
    return { success: true, results }
}
