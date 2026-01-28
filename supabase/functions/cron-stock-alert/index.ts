import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push'

console.log("🚀 Cron Job started: Stock & Expiry Check")

// --- CONFIGURATION ---
const LOW_STOCK_DAYS = 10       // Warning start (e.g. 10 days)
const CRITICAL_STOCK_DAYS = 5   // Critical: From here on, alert ALWAYS (for 2x daily checks)
const EXPIRY_WARNING_DAYS = 30  // Expiry warning
const SILENCE_PERIOD_DAYS = 1   // How often to annoy if stock is just "low" but not critical

// Initialize Supabase Client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Configure WebPush Keys
const vapidPublicKey = Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY')
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@medilog.app'

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

// Type Definition
interface PatientGroup {
    patientName: string;
    items: string[];
}

Deno.serve(async (req: Request) => {
  try {
    // 1. Fetch Medications
    const { data: medications, error: medError } = await supabase
      .from('medications')
      .select(`
        id, name, current_stock, daily_dosage, expiry_date, updated_at, user_id,
        profiles (full_name)
      `)
    
    if (medError) throw medError
    
    const alertsToSend = [] 

    for (const med of medications) {
        // --- LOGIC 1: Expiry ---
        let expiryAlert = null
        if (med.expiry_date) {
            const expiry = new Date(med.expiry_date)
            const now = new Date()
            const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            
            if (daysToExpiry <= EXPIRY_WARNING_DAYS) {
                expiryAlert = daysToExpiry < 0 
                    ? `ABGELAUFEN am ${expiry.toLocaleDateString('de-DE')}` 
                    : `läuft bald ab (${expiry.toLocaleDateString('de-DE')})`
            }
        }

        // --- LOGIC 2: Stock ---
        let stockAlert = null
        if (med.daily_dosage > 0) {
            const daysLeft = Math.floor(med.current_stock / med.daily_dosage)
            
            // CRITICAL: If under 5 days, ALWAYS alert (ignores silence period)
            // This ensures the morning/evening cron always delivers the message.
            if (daysLeft <= CRITICAL_STOCK_DAYS) {
                stockAlert = `DRINGEND: Reicht nur noch ${daysLeft} Tage!`
            } 
            // LOW: If just low, check silence period to avoid spamming
            else if (daysLeft < LOW_STOCK_DAYS) {
                const lastUpdate = new Date(med.updated_at)
                const now = new Date()
                const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)

                if (daysSinceUpdate > SILENCE_PERIOD_DAYS) {
                     stockAlert = `Bestand niedrig: Reicht noch ${daysLeft} Tage.`
                }
            }
        }

        // Combine Alerts
        if (expiryAlert || stockAlert) {
            const reasons: string[] = []
            if (stockAlert) reasons.push(stockAlert)
            if (expiryAlert) reasons.push(expiryAlert)
            
            alertsToSend.push({
                userId: med.user_id,
                // @ts-ignore
                patientName: med.profiles?.full_name || 'Patient',
                body: `${med.name}: ${reasons.join(' ')}`
            })
        }
    }

    // 2. Dispatch Grouping
    const groupedByPatient: Record<string, PatientGroup> = {}
    for (const alert of alertsToSend) {
        if (!groupedByPatient[alert.userId]) {
            groupedByPatient[alert.userId] = { patientName: alert.patientName, items: [] }
        }
        groupedByPatient[alert.userId].items.push(alert.body)
    }

    const debugResults = []

    // Send Notifications
    for (const [patientId, data] of Object.entries(groupedByPatient)) {
        const messageBody = data.items.join('\n')
        const title = `MediLog Status: ${data.patientName}`

        // Patient
        const resPatient = await sendPushToUser(patientId, title, messageBody)
        debugResults.push({ type: 'Patient', id: patientId, results: resPatient })

        // Caregivers
        const { data: caregivers } = await supabase
            .from('care_relationships')
            .select('caregiver_id')
            .eq('patient_id', patientId)
            .eq('status', 'accepted')
        
        if (caregivers) {
            for (const cg of caregivers) {
                const resCG = await sendPushToUser(cg.caregiver_id, title, `Bei ${data.patientName}:\n${messageBody}`)
                debugResults.push({ type: 'Caregiver', id: cg.caregiver_id, results: resCG })
            }
        }
    }

    return new Response(JSON.stringify({ success: true, count: alertsToSend.length, debug: debugResults }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(String(err), { status: 500 })
  }
})

// Helper
async function sendPushToUser(userId: string, title: string, body: string) {
    const vapidPublicKey = Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@medilog.app'

    const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId)
    if (!subs || subs.length === 0) return [{ status: 'No Devices' }]

    const payload = JSON.stringify({ title, body, icon: '/icon.png', url: '/dashboard' })
    const statuses = []

    for (const sub of subs) {
        try {
            await webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth }
            }, payload, {
                TTL: 86400, urgency: 'normal',
                vapidDetails: { subject: vapidSubject!, publicKey: vapidPublicKey!, privateKey: vapidPrivateKey! }
            })
            statuses.push({ id: sub.id, status: 'Success' })
        } catch (e: any) {
             if (e.statusCode === 410 || e.statusCode === 404) {
                 await supabase.from('push_subscriptions').delete().eq('id', sub.id) // Cleanup
                 statuses.push({ id: sub.id, status: 'Deleted' })
             } else {
                 statuses.push({ id: sub.id, status: 'Error' })
             }
        }
    }
    return statuses
}