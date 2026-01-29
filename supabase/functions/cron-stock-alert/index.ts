import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push'

console.log("🚀 Cron Job: Smart Stock Alert started")

// --- KONFIGURATION ---
const DAYS_THRESHOLD = 5; // Alarm schlagen, wenn Vorrat < 5 Tage

// Init Supabase (Mit Service Role Key für vollen Zugriff)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Init WebPush
const vapidPublicKey = Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY')
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@medilog.app'

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

Deno.serve(async (req: Request) => {
  try {
    // 1. SMART SCAN: Wir lassen die Datenbank die Arbeit machen (RPC Call)
    console.log("🔍 Rufe Database RPC auf...")
    
    const { data: criticalMeds, error } = await supabase
      .rpc('get_low_stock_medications', { days_threshold: DAYS_THRESHOLD })

    if (error) {
        console.error("❌ Datenbank-Fehler:", error)
        throw error
    }

    console.log(`✅ Gefunden: ${criticalMeds.length} kritische Medikamente.`)

    // Wenn nichts gefunden wurde, brechen wir hier ab
    if (!criticalMeds || criticalMeds.length === 0) {
        return new Response(JSON.stringify({ success: true, processed: 0, message: "Alles ok, keine Warnungen." }), {
            headers: { 'Content-Type': 'application/json' },
        })
    }

    // 2. NACHRICHTEN VERSENDEN
    const alertsSent = []

    for (const med of criticalMeds) {
        // Text generieren
        const title = `Achtung: ${med.name} wird knapp`
        const body = `Dein Vorrat reicht nur noch für ${med.days_left} Tage (${med.current_stock} Stück). Bitte nachbestellen!`
        
        // Senden an den betroffenen User
        // Hinweis: Wir rufen hier die Hilfsfunktion auf
        const result = await sendPushToUser(med.user_id, title, body)
        alertsSent.push({ med: med.name, user: med.user_full_name, result })
    }

    return new Response(JSON.stringify({ success: true, processed: alertsSent.length, details: alertsSent }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(String(err), { status: 500 })
  }
})

// --- HILFSFUNKTION: PUSH SENDEN ---
async function sendPushToUser(userId: string, title: string, body: string) {
    const vapidPublicKey = Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@medilog.app'

    // 1. Abos des Users holen
    const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)

    if (!subs || subs.length === 0) return 'No Subscriptions'

    const payload = JSON.stringify({
        title,
        body,
        icon: '/icon.png',
        url: '/' // Klick öffnet Dashboard
    })

    // 2. An alle Geräte senden
    let successCount = 0;
    for (const sub of subs) {
        try {
            await webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth }
            }, payload, {
                TTL: 86400, // 24h gültig
                urgency: 'high',
                vapidDetails: {
                    subject: vapidSubject!,
                    publicKey: vapidPublicKey!,
                    privateKey: vapidPrivateKey!
                }
            })
            successCount++;
        } catch (e: any) {
             console.error(`Push fehlgeschlagen für ${userId}:`, e.statusCode)
             // Wenn Abo abgelaufen (410) oder nicht gefunden (404), löschen wir es
             if (e.statusCode === 410 || e.statusCode === 404) {
                 await supabase.from('push_subscriptions').delete().eq('id', sub.id)
             }
        }
    }
    return `Sent to ${successCount} devices`
}