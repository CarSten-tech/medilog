import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push'

console.log("🚀 Cron Job started: Smart Check (RPC)")

// --- CONFIGURATION ---
const LOW_STOCK_DAYS = 10       
const EXPIRY_WARNING_DAYS = 30  
const CHECKUP_LEAD_TIME_DAYS = 30
const CHECKUP_SILENCE_DAYS = 25 

// Init Supabase
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Configure WebPush
const vapidPublicKey = Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY')
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@medilog.app'

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

interface PatientGroup {
    patientName: string;
    items: string[];
}

Deno.serve(async (req: Request) => {
  try {
    const alertsToSend: Array<{userId: string, patientName: string, body: string}> = []

    // ---------------------------------------------------------
    // 1. MEDIKAMENTE PRÜFEN (Via Database RPC - High Performance)
    // ---------------------------------------------------------
    console.log("🔍 Rufe Database RPC auf (Medikamente)...")
    
    // Wir fragen die DB: "Gib uns alles was < 10 Tage reicht ODER in < 30 Tagen abläuft"
    const { data: criticalMeds, error: rpcError } = await supabase
      .rpc('get_critical_medications', { 
          stock_threshold: LOW_STOCK_DAYS, 
          expiry_days: EXPIRY_WARNING_DAYS 
      })

    if (rpcError) throw rpcError

    console.log(`✅ RPC fertig: ${criticalMeds?.length || 0} kritische Medikamente gefunden.`)

    if (criticalMeds) {
        for (const med of criticalMeds) {
            const reasons: string[] = []

            // Logik: Bestand
            if (med.issue_type === 'stock' || med.issue_type === 'both') {
                if (med.days_left_stock <= 5) {
                    reasons.push(`DRINGEND: Reicht nur noch ${med.days_left_stock} Tage!`)
                } else {
                    reasons.push(`Bestand niedrig: Reicht noch ${med.days_left_stock} Tage.`)
                }
            }

            // Logik: Ablaufdatum
            if (med.issue_type === 'expiry' || med.issue_type === 'both') {
                const dateStr = new Date(med.expiry_date).toLocaleDateString('de-DE')
                if (med.days_until_expiry < 0) {
                    reasons.push(`ABGELAUFEN am ${dateStr}!`)
                } else {
                    reasons.push(`läuft bald ab (${dateStr})`)
                }
            }

            if (reasons.length > 0) {
                alertsToSend.push({
                    userId: med.user_id,
                    patientName: med.user_full_name || 'Patient',
                    body: `${med.name}: ${reasons.join(' ')}`
                })
            }
        }
    }

    // ---------------------------------------------------------
    // 2. VORSORGE (CHECKUPS) PRÜFEN (Standard Query)
    // ---------------------------------------------------------
    // Das machen wir klassisch, da es meist wenige sind
    const { data: checkups, error: checkupError } = await supabase
      .from('recurring_checkups')
      .select(`
        id, title, next_due_date, last_notified_at, user_id, 
        patient_id, 
        profiles:patient_id (full_name) 
      `)
      .not('next_due_date', 'is', null)

    if (checkupError) console.error("Error checkups:", checkupError)

    if (checkups) {
        for (const checkup of checkups) {
             const dueDate = new Date(checkup.next_due_date)
             const now = new Date()
             const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
             
             if (daysUntilDue <= CHECKUP_LEAD_TIME_DAYS) {
                 // Spam Schutz
                 let shouldNotify = true
                 if (checkup.last_notified_at) {
                     const lastNotified = new Date(checkup.last_notified_at)
                     const daysSinceNotify = (now.getTime() - lastNotified.getTime()) / (1000 * 60 * 60 * 24)
                     if (daysSinceNotify < CHECKUP_SILENCE_DAYS) shouldNotify = false
                 }

                 if (shouldNotify) {
                     const timeMsg = daysUntilDue < 0 
                        ? `WAR FÄLLIG am ${dueDate.toLocaleDateString('de-DE')}`
                        : `fällig am ${dueDate.toLocaleDateString('de-DE')}`

                     const patientName = checkup.profiles?.full_name || 'Dir' 
                     
                     alertsToSend.push({
                         userId: checkup.user_id,
                         patientName: checkup.patient_id ? checkup.profiles?.full_name || 'Patient' : 'Selbst',
                         body: `Vorsorge "${checkup.title}" ${timeMsg}. Termin vereinbaren!`
                     })

                     // Update last_notified_at
                     await supabase.from('recurring_checkups')
                        .update({ last_notified_at: new Date().toISOString() })
                        .eq('id', checkup.id)
                 }
             }
        }
    }

    // ---------------------------------------------------------
    // 3. SENDEN & GRUPPIEREN
    // ---------------------------------------------------------
    const groupedByPatient: Record<string, PatientGroup> = {}
    for (const alert of alertsToSend) {
        if (!groupedByPatient[alert.userId]) {
            groupedByPatient[alert.userId] = { patientName: alert.patientName, items: [] }
        }
        groupedByPatient[alert.userId].items.push(alert.body)
    }

    const debugResults = []

    for (const [patientId, data] of Object.entries(groupedByPatient)) {
        const messageBody = data.items.join('\n')
        const title = `MediLog Status: ${data.patientName}`

        // 1. An den Patienten selbst
        const resPatient = await sendPushToUser(patientId, title, messageBody)
        debugResults.push({ type: 'Patient', id: patientId, results: resPatient })

        // 2. An die Betreuer (Caregivers)
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

    return new Response(JSON.stringify({ 
        success: true, 
        processed_meds: criticalMeds?.length || 0,
        alerts_generated: alertsToSend.length,
        debug: debugResults 
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(String(err), { status: 500 })
  }
})

// --- HELPER FUNCTION ---
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
                TTL: 86400, urgency: 'high',
                vapidDetails: { subject: vapidSubject!, publicKey: vapidPublicKey!, privateKey: vapidPrivateKey! }
            })
            statuses.push({ id: sub.id, status: 'Success' })
        } catch (e: any) {
             if (e.statusCode === 410 || e.statusCode === 404) {
                 await supabase.from('push_subscriptions').delete().eq('id', sub.id)
                 statuses.push({ id: sub.id, status: 'Deleted (Invalid)' })
             } else {
                 statuses.push({ id: sub.id, status: 'Error' })
             }
        }
    }
    return statuses
}