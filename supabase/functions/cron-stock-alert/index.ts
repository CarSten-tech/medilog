import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push'

console.log("🚀 Cron Job started: Smart Check (Privacy Optimized)")

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
    // 1. MEDIKAMENTE PRÜFEN (Via Database RPC)
    // ---------------------------------------------------------
    // Hinweis: RPC ist sicher, da Logik in der DB läuft
    const { data: criticalMeds, error: rpcError } = await supabase
      .rpc('get_critical_medications', { 
          stock_threshold: LOW_STOCK_DAYS, 
          expiry_days: EXPIRY_WARNING_DAYS 
      })

    if (rpcError) throw rpcError

    // LOGGING: Nur Anzahl loggen, keine Namen (DSGVO)
    console.log(`✅ RPC fertig: ${criticalMeds?.length || 0} kritische Einträge verarbeitet.`)

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
                // Wir bauen die Nachricht hier zusammen, aber loggen sie NICHT.
                alertsToSend.push({
                    userId: med.user_id,
                    patientName: med.user_full_name || 'Patient',
                    body: `${med.name}: ${reasons.join(' ')}`
                })
            }
        }
    }

    // ---------------------------------------------------------
    // 2. VORSORGE (CHECKUPS) PRÜFEN
    // ---------------------------------------------------------
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

    // Wir zählen nur Erfolge/Fehler für die Statistik, speichern aber keine IDs
    let sentCount = 0;
    let errorCount = 0;

    for (const [patientId, data] of Object.entries(groupedByPatient)) {
        const messageBody = data.items.join('\n')
        const title = `MediLog Status: ${data.patientName}`

        // 1. An den Patienten selbst
        const resPatient = await sendPushToUser(patientId, title, messageBody)
        resPatient.forEach(r => r.status === 'Success' ? sentCount++ : errorCount++)

        // 2. An die Betreuer (Caregivers)
        const { data: caregivers } = await supabase
            .from('care_relationships')
            .select('caregiver_id')
            .eq('patient_id', patientId)
            .eq('status', 'accepted')
        
        if (caregivers) {
            for (const cg of caregivers) {
                const resCG = await sendPushToUser(cg.caregiver_id, title, `Bei ${data.patientName}:\n${messageBody}`)
                resCG.forEach(r => r.status === 'Success' ? sentCount++ : errorCount++)
            }
        }
    }

    console.log(`✅ Job beendet. Gesendet: ${sentCount}, Fehler: ${errorCount}`)

    // SECURITY: Wir geben keine Details (IDs/Namen) im Response-Body zurück!
    // Logs von Supabase/Vercel speichern den Body oft, daher hier clean bleiben.
    return new Response(JSON.stringify({ 
        success: true, 
        processed_meds: criticalMeds?.length || 0,
        alerts_generated: alertsToSend.length,
        push_stats: { sent: sentCount, errors: errorCount }
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    // SECURITY: Fehler nicht im Detail nach außen geben, wenn möglich
    console.error("Cron Job Failed:", err)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })
  }
})

// --- HILFSFUNKTION: PUSH SENDEN (PARALLELISIERT & SILENT) ---
async function sendPushToUser(userId: string, title: string, body: string) {
    const vapidPublicKey = Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@medilog.app'

    const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)

    if (!subs || subs.length === 0) return [{ status: 'No Devices' }]

    // Payload erstellen
    const payload = JSON.stringify({
        title,
        body,
        icon: '/icon.png',
        url: '/dashboard'
    })

    const options = {
        TTL: 86400,
        urgency: 'high',
        vapidDetails: {
            subject: vapidSubject!,
            publicKey: vapidPublicKey!,
            privateKey: vapidPrivateKey!
        }
    }

    const pushPromises = subs.map(async (sub) => {
        try {
            await webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth }
            }, payload, options)
            
            return { id: sub.id, status: 'Success' }
        } catch (e: any) {
            if (e.statusCode === 410 || e.statusCode === 404) {
                await supabase.from('push_subscriptions').delete().eq('id', sub.id)
                return { id: sub.id, status: 'Deleted (Invalid)' }
            }
            // Log nur generische Fehlercodes, keine User-IDs
            console.error(`Push Error (Status ${e.statusCode})`)
            return { id: sub.id, status: `Error ${e.statusCode}` }
        }
    })

    const results = await Promise.allSettled(pushPromises)

    return results.map(res => 
        res.status === 'fulfilled' ? res.value : { status: 'System Error' }
    )
}