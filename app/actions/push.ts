'use server'

import webpush from 'web-push'
import { createClient } from '@/utils/supabase/server'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@medilog.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

interface SubscriptionKeys {
  p256dh: string
  auth: string
}

interface PushSubscriptionData {
  endpoint: string
  keys: SubscriptionKeys
}

export async function subscribeUser(sub: PushSubscriptionData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
  }, { onConflict: 'endpoint' })

  if (error) {
    console.error('Error saving subscription:', error)
    throw error
  }
  
  return { success: true }
}

export async function sendTestNotification(userId: string, message: string) {
    const supabase = await createClient()
    
    const { data: subs, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)

    if (error || !subs || subs.length === 0) {
        console.log("No subs found for", userId)
        return { success: false, error: 'No subscriptions found' }
    }

    const results = await Promise.all(subs.map(async (sub) => {
        try {
            await webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                },
                JSON.stringify({
                    title: 'MediLog',
                    body: message,
                })
            )
            return { success: true }
        } catch (error) {
            console.error('Push error', error)
            return { success: false, error }
        }
    }))
    
    return { results }
}
