// @ts-nocheck
import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from "npm:web-push@3.6.7"

console.log("Job scheduled-sunday-check started")

Deno.serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get all users with subscriptions
    // Using a raw query or distinct select if possible, or just fetch all and group in JS (MVP style)
    const { data: subs, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')

    if (subError) throw subError

    if (!subs || subs.length === 0) {
        return new Response("No subscriptions found", { status: 200 })
    }

    // Group subscriptions by user_id
    const userSubs = {};
    for (const sub of subs) {
        if (!userSubs[sub.user_id]) userSubs[sub.user_id] = [];
        userSubs[sub.user_id].push(sub);
    }

    // 2. Iterate users
    for (const userId of Object.keys(userSubs)) {
        // Fetch Medications
        const { data: medications } = await supabase
            .from('medications')
            .select('name, current_stock, daily_dosage')
            .eq('user_id', userId)

        if (!medications || medications.length === 0) continue;

        const inventoryReport: string[] = [];
        
        for (const med of medications) {
            if (med.daily_dosage > 0) {
                const daysLeft = Math.floor(med.current_stock / med.daily_dosage);
                inventoryReport.push(`${med.name}: ${med.current_stock} Stk (${daysLeft} Tage)`);
            }
        }

        if (inventoryReport.length > 0) {
            const pushMessage = `Sonntags-Check 📋\n\nHier ist dein aktueller Vorrat:\n\n${inventoryReport.join('\n')}`;

            // Send to all endpoints for this user
            const userEndpoints = userSubs[userId];
            
            webpush.setVapidDetails(
                Deno.env.get('VAPID_SUBJECT')!,
                Deno.env.get('VAPID_PUBLIC_KEY')!,
                Deno.env.get('VAPID_PRIVATE_KEY')!
            );

            for (const sub of userEndpoints) {
                try {
                    await webpush.sendNotification(
                        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                        JSON.stringify({ title: 'MediLog Inventur', body: pushMessage })
                    );
                } catch (e) {
                    console.error("Push failed for owner", userId, e);
                    // Optional: remove dead subscriptions here
                }
            }
        }
    }

    return new Response("Sunday checks completed", { status: 200 })

  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
