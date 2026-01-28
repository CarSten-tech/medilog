// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Identify Candidates (Low Stock < 8 days)
    // We fetch ALL meds that are low. 
    // Optimization: Filter in DB if possible, but calculating days_left in SQL is easy.
    const { data: meds, error: medError } = await supabase
      .from('medications')
      .select(`
        id, 
        name, 
        current_stock, 
        daily_dosage, 
        updated_at, 
        user_id,
        low_stock_threshold
      `)
      .gt('daily_dosage', 0) // Avoid accidental division by zero
    
    if (medError) throw medError

    const notificationsToSend = []

    const now = new Date()

    for (const med of meds) {
      if (med.daily_dosage <= 0) continue

      const daysLeft = med.current_stock / med.daily_dosage
      const threshold = med.low_stock_threshold || 8

      if (daysLeft < threshold) {
        // 2. Calculate Urgency
        const updatedAt = new Date(med.updated_at)
        const diffMs = now.getTime() - updatedAt.getTime()
        const daysSinceLastUpdate = diffMs / (1000 * 60 * 60 * 24)

        let phase = 'silent'
        
        if (daysSinceLastUpdate >= 6) phase = 'panic'
        else if (daysSinceLastUpdate >= 4) phase = 'warning'
        else phase = 'silent'

        if (phase === 'silent') continue

        // 3. Fan-Out Preparation
        const recipients = new Set<string>() // Set of User IDs
        recipients.add(med.user_id) // Patient always gets it

        if (phase === 'panic') {
          // Fetch Caregivers
          const { data: caregivers } = await supabase
            .from('care_relationships')
            .select('caregiver_id')
            .eq('patient_id', med.user_id)
            .eq('status', 'accepted')
          
          if (caregivers) {
            caregivers.forEach(c => recipients.add(c.caregiver_id))
          }
        }

        // Fetch Subscriptions for ALL recipients
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('*')
          .in('user_id', Array.from(recipients))

        if (subs && subs.length > 0) {
            const message = phase === 'panic' 
                ? `🚨 ESKALATION: ${med.name} ist fast leer! (${Math.floor(daysLeft)} Tage). Bitte SOFORT kümmern!`
                : `⚠️ Erinnerung: ${med.name} geht zur Neige (${Math.floor(daysLeft)} Tage).`

            for (const sub of subs) {
                notificationsToSend.push({
                    subscription: sub.keys ? {
                        endpoint: sub.endpoint,
                        keys: sub.keys
                    } : null,
                    payload: JSON.stringify({
                        title: 'MediLog Apotheken-Alarm',
                        body: message,
                        icon: '/icon.png'
                    })
                })
            }
        }
      }
    }

    // 4. Send Implementation
    // VAPID Details
    const vapidEmail = 'mailto:admin@medilog.app'
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')

    if (vapidPrivateKey && vapidPublicKey) {
        webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)
        
        const promises = notificationsToSend.map(n => {
            if (!n.subscription) return Promise.resolve()
             // @ts-ignore
            return webpush.sendNotification(n.subscription, n.payload)
                .catch((err) => {
                    if (err.statusCode === 410) {
                        // TODO: Delete invalid subscription
                        console.log("Subscription expired/invalid")
                    } else {
                        console.error("Push Error", err)
                    }
                })
        })

        await Promise.all(promises)
    }

    return new Response(JSON.stringify({ success: true, count: notificationsToSend.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
