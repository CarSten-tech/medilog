import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push'

console.log("🚀 Cron Job started: Stock & Expiry Check")

// Configuration
const LOW_STOCK_DAYS = 8
const CRITICAL_STOCK_DAYS = 3
const EXPIRY_WARNING_DAYS = 30
const SILENCE_PERIOD_DAYS = 3

// Initialize Supabase Client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Configure WebPush
const vapidPublicKey = Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY')
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@medilog.app'

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error("❌ Critical: VAPID keys missing in Edge Function Secrets")
} else {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

Deno.serve(async (req) => {
  try {
    // 1. Fetch Medications
    // We need to fetch ALL medications that might be relevant
    // Optimization: Filter in SQL would be better but for complex logic (daily_dosage calc), JS is easier for now unless dataset is huge.
    // Let's filter slightly in SQL: active medications (stock > 0 OR expiry close)
    const { data: medications, error: medError } = await supabase
      .from('medications')
      .select(`
        id, 
        name, 
        current_stock, 
        daily_dosage, 
        expiry_date, 
        updated_at,
        user_id,
        profiles (full_name, email)
      `)
    
    if (medError) throw medError
    
    console.log(`🔍 Analying ${medications.length} medications...`)

    const alertsToSend = [] // { userId, title, body, reason }

    for (const med of medications) {
        // --- LOGIC 1: Expiry ---
        let expiryAlert = null
        if (med.expiry_date) {
            const expiry = new Date(med.expiry_date)
            const now = new Date()
            const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            
            if (daysToExpiry <= EXPIRY_WARNING_DAYS) {
                if (daysToExpiry < 0) {
                    expiryAlert = `ABGELAUFEN am ${expiry.toLocaleDateString('de-DE')}`
                } else {
                    expiryAlert = `läuft bald ab (${expiry.toLocaleDateString('de-DE')})`
                }
            }
        }

        // --- LOGIC 2: Stock ---
        let stockAlert = null
        let isCritical = false
        if (med.daily_dosage > 0) {
            const daysLeft = Math.floor(med.current_stock / med.daily_dosage)
            
            if (daysLeft < LOW_STOCK_DAYS) {
                if (daysLeft <= CRITICAL_STOCK_DAYS) {
                    isCritical = true
                    stockAlert = `Kritisch: Nur noch für ${daysLeft} Tage!`
                } else {
                    // "Silence Phase" Check
                    // If updated recently (e.g. today), we might assume the user *knows* (they just edited it).
                    // Logic: If updated > SILENCE_PERIOD_DAYS ago, warn.
                    // OR if update was recent but stock is still low? 
                    // User Request: "If CRITICAL (<3 days), ignore silence phase. If Warning (4-8), respect silence."
                    
                    const lastUpdate = new Date(med.updated_at)
                    const now = new Date()
                    const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)

                    if (daysSinceUpdate > SILENCE_PERIOD_DAYS) {
                         stockAlert = `Neige: Reicht für ${daysLeft} Tage.`
                    } else {
                        console.log(`Skipping Stock Alert for ${med.name}: Updated recently (${daysSinceUpdate.toFixed(1)} days ago) and not critical.`)
                    }
                }
            }
        }

        // Combine Alerts
        if (expiryAlert || stockAlert) {
            const reasons = []
            if (stockAlert) reasons.push(stockAlert)
            if (expiryAlert) reasons.push(expiryAlert)
            
            alertsToSend.push({
                medId: med.id,
                userId: med.user_id,
                medName: med.name,
                patientName: med.profiles?.full_name || 'Patient',
                body: `${med.name}: ${reasons.join(' ')}`
            })
        }
    }

    console.log(`📢 Found ${alertsToSend.length} alerts to dispatch.`)
    
    // 2. Dispatch
    // Group by User to batch notifications? 
    // For V1, simplest is per-medication trigger, but that might spam. 
    // Let's grouping by USER would be better UX.
    
    // Grouping by PatientId (The owner of the meds)
    const groupedByPatient = {}
    for (const alert of alertsToSend) {
        if (!groupedByPatient[alert.userId]) groupedByPatient[alert.userId] = { patientName: alert.patientName, items: [] }
        groupedByPatient[alert.userId].items.push(alert.body)
    }

    // Process each Patient Group
    for (const [patientId, data] of Object.entries(groupedByPatient)) {
        const messageBody = data.items.join('\n')
        const title = `MediLog Alarm: ${data.patientName}`

        // A) Notify Patient
        await sendPushToUser(patientId, title, messageBody)

        // B) Notify Caregivers
        const { data: caregivers } = await supabase
            .from('care_relationships')
            .select('caregiver_id')
            .eq('patient_id', patientId)
            .eq('status', 'accepted')
        
        if (caregivers && caregivers.length > 0) {
            console.log(`   fan-out to ${caregivers.length} caregivers for ${data.patientName}`)
            for (const cg of caregivers) {
                await sendPushToUser(cg.caregiver_id, title, `Bei ${data.patientName}:\n${messageBody}`)
            }
        }
    }

    return new Response(JSON.stringify({ success: true, alerts: alertsToSend.length }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error("🔥 Job Failed:", err)
    return new Response(String(err), { status: 500 })
  }
})

// Helper: Send Push
async function sendPushToUser(userId: string, title: string, body: string) {
    // Fetch stored subscriptions
    const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
    
    if (!subs || subs.length === 0) {
        console.log(`   No devices for user ${userId.substring(0,5)}...`)
        return
    }

    const payload = JSON.stringify({
        title,
        body,
        icon: '/icon.png',
        url: '/dashboard'
    })

    for (const sub of subs) {
        try {
            await webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth }
            }, payload)
            console.log(`   ✅ Sent to device ${sub.id.substring(0,5)}`)
        } catch (e) {
             if (e.statusCode === 410 || e.statusCode === 404) {
                 console.log(`   🗑 Auto-cleaning dead subscription ${sub.id}`)
                 await supabase.from('push_subscriptions').delete().eq('id', sub.id)
             } else {
                 console.error(`   ❌ Send failed:`, e.statusCode)
             }
        }
    }
}
