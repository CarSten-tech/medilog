
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { NextResponse } from 'next/server'

// --- CONFIGURATION ---
const LOW_STOCK_DAYS = 10
const CRITICAL_STOCK_DAYS = 5
const EXPIRY_WARNING_DAYS = 30
const SILENCE_PERIOD_DAYS = 1

const CHECKUP_LEAD_TIME_DAYS = 30
const CHECKUP_SILENCE_DAYS = 25

export async function GET(request: Request) {
    // Optional: Verify Vercel Cron Secret (if needed, but simple GET is fine for "Zero Config")
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

    // 1. Init Supabase (Service Role essential for fetching all users)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json({ error: "Missing Env Vars (SUPABASE_SERVICE_ROLE_KEY)" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // 2. Init WebPush
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@medilog.app'

    if (vapidPublicKey && vapidPrivateKey) {
        webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
    }

    try {
        const debugLogs: string[] = []
        const alertsToSend: any[] = []

        // --- FETCH DATA ---
        const { data: medications, error: medError } = await supabase
            .from('medications')
            .select(`
                id, name, current_stock, daily_dosage, expiry_date, updated_at, user_id,
                profiles (full_name)
            `)
        
        if (medError) throw medError

        const { data: checkups, error: checkupError } = await supabase
            .from('recurring_checkups')
            .select(`
                id, title, next_due_date, last_notified_at, user_id, 
                patient_id, 
                profiles:patient_id (full_name) 
            `)
            .not('next_due_date', 'is', null)
        
        if (checkupError) console.error("Error checkups:", checkupError)

        // --- PROCESS MEDICATIONS ---
        for (const med of medications || []) {
             let stockAlert = null
             let expiryAlert = null

             // Expiry
             if (med.expiry_date) {
                const expiry = new Date(med.expiry_date)
                const now = new Date()
                const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                if (daysToExpiry <= EXPIRY_WARNING_DAYS) {
                    expiryAlert = daysToExpiry < 0 ? `ABGELAUFEN` : `läuft bald ab`
                }
             }

             // Stock
             if (med.daily_dosage > 0) {
                 const daysLeft = Math.floor(med.current_stock / med.daily_dosage)
                 
                 if (daysLeft <= CRITICAL_STOCK_DAYS) {
                     stockAlert = `DRINGEND: ${daysLeft} Tage`
                 } else if (daysLeft < LOW_STOCK_DAYS) {
                     // Silence check logic omitted for brevity in port, assumed similar or simpler
                     // Actually let's include simple silence check
                     const lastUpdate = new Date(med.updated_at)
                     const now = new Date()
                     const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
                     if (daysSinceUpdate > SILENCE_PERIOD_DAYS) {
                         stockAlert = `Niedrig: ${daysLeft} Tage`
                     }
                 }
             }

             if (stockAlert || expiryAlert) {
                 const reasons = [stockAlert, expiryAlert].filter(Boolean).join(' ')
                 alertsToSend.push({
                     userId: med.user_id,
                     // @ts-ignore
                     patientName: med.profiles?.full_name || 'Patient',
                     body: `${med.name}: ${reasons}`
                 })
             }
        }

        // --- PROCESS CHECKUPS ---
        if (checkups) {
            for (const checkup of checkups) {
                 const dueDate = new Date(checkup.next_due_date)
                 const now = new Date()
                 const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                 
                 let shouldNotify = false

                 if (daysUntilDue <= CHECKUP_LEAD_TIME_DAYS) {
                     shouldNotify = true
                     if (checkup.last_notified_at) {
                         const lastNotified = new Date(checkup.last_notified_at)
                         const daysSinceNotify = (now.getTime() - lastNotified.getTime()) / (1000 * 60 * 60 * 24)
                         if (daysSinceNotify < CHECKUP_SILENCE_DAYS) {
                             shouldNotify = false
                             debugLogs.push(`Checkup '${checkup.title}' SKIPPED (Silenced)`)
                         }
                     }
                 } else {
                     debugLogs.push(`Checkup '${checkup.title}' SKIPPED (Future: ${daysUntilDue} days)`)
                 }

                 if (shouldNotify) {
                     debugLogs.push(`Checkup '${checkup.title}' ALERT QUEUED`)
                     const timeMsg = daysUntilDue < 0 
                        ? `WAR FÄLLIG am ${dueDate.toLocaleDateString('de-DE')}`
                        : `fällig am ${dueDate.toLocaleDateString('de-DE')} (in ${daysUntilDue} Tagen)`

                     alertsToSend.push({
                         userId: checkup.user_id,
                         // @ts-ignore
                         patientName: checkup.profiles?.full_name || 'Dir',
                         body: `Vorsorge "${checkup.title}" ${timeMsg}!`
                     })
                     
                     // Update DB
                     await supabase.from('recurring_checkups').update({ last_notified_at: new Date().toISOString() }).eq('id', checkup.id)
                 }
            }
        }

        // --- SEND ALERTS ---
        const debugResults = []
        
        // Group by user
        const groupedByUser: Record<string, string[]> = {}
        for (const item of alertsToSend) {
            if (!groupedByUser[item.userId]) groupedByUser[item.userId] = []
            groupedByUser[item.userId].push(item.body)
        }

        for (const [userId, messages] of Object.entries(groupedByUser)) {
            const body = messages.join('\n')
            
            // Get Subscriptions
            const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId)
            
            if (subs) {
                for (const sub of subs) {
                    try {
                        await webpush.sendNotification({
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth }
                        }, JSON.stringify({ title: "MediLog Update", body, icon: '/icon.png' }), {
                            vapidDetails: { subject: vapidSubject, publicKey: vapidPublicKey!, privateKey: vapidPrivateKey! }
                        })
                        debugResults.push({ user: userId, status: 'Sent' })
                    } catch (e) {
                        debugResults.push({ user: userId, status: 'Error', error: e })
                    }
                }
            }
        }

        return NextResponse.json({ success: true, sent: debugResults.length, logs: debugLogs })
        
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
