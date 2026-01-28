'use server'

import { createClient } from '@/utils/supabase/server'
import webpush from 'web-push'
import { z } from 'zod'

// Configure VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@medilog.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const SubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
})

export async function savePushSubscription(subscription: any, userAgent?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // VALIDATION: Strict Schema Check
  const result = SubscriptionSchema.safeParse(subscription)
  if (!result.success) {
    console.error("Invalid Subscription Payload:", result.error)
    return { error: 'Invalid subscription data' }
  }

  const { endpoint, keys } = result.data

  // UPSERT: Idempotent save
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint: endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: userAgent || 'Unknown Client',
        last_used_at: new Date().toISOString()
      },
      { onConflict: 'user_id, endpoint' }
    )

  if (error) {
    console.error('Database Error saving subscription:', error)
    return { error: 'Failed to save subscription' }
  }

  return { success: true }
}

export async function sendNotificationToUser(userId: string, title: string, body: string, url: string = '/dashboard') {
  const supabase = await createClient()

  // 1. Fetch all devices for this user
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)

  if (error || !subscriptions || subscriptions.length === 0) {
    console.log(`No subscriptions found for user ${userId}`)
    return { error: 'User has no devices registered' }
  }

  // 2. Prepare Payload
  const payload = JSON.stringify({
    title,
    body,
    url, // Deep link support
    icon: '/icon.png',
  })

  // 3. Send in Parallel (Fan-out)
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
        return { success: true, id: sub.id }
      } catch (err: any) {
        // SELF-HEALING: If 410 Gone, delete independent of which device caused it
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Removing dead subscription: ${sub.id}`)
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
        throw err
      }
    })
  )

  // 4. Summarize Results
  const successCount = results.filter(r => r.status === 'fulfilled').length
  const failCount = results.filter(r => r.status === 'rejected').length
  
  return { 
      success: successCount > 0, 
      sent: successCount, 
      failed: failCount 
  }
}

export async function deletePushSubscription(endpoint: string) {
   const supabase = await createClient()
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) return { error: 'Unauthorized' }

   const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
    .eq('user_id', user.id)

    if (error) return { error: error.message }
    return { success: true }
}
