// @ts-nocheck
import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from "npm:web-push@3.6.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id } = await req.json()

    if (!user_id) {
        throw new Error('Missing user_id')
    }

    // 1. Fetch Medications
    const { data: medications, error: fetchError } = await supabase
      .from('medications')
      .select('id, name, current_stock, daily_dosage')
      .eq('user_id', user_id)

    if (fetchError) throw fetchError

    if (!medications || medications.length === 0) {
      return new Response(
        JSON.stringify({ message: "Keine Medikamente gefunden." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let updatedCount = 0;
    const errors: string[] = [];
    const updatedNames: string[] = [];
    const inventoryReport: string[] = [];

    // 2. Process each medication
    for (const med of medications) {
        const weeklyAmount = Number(med.daily_dosage) * 7
        if (weeklyAmount <= 0) continue;

        const newStock = Number(med.current_stock) - weeklyAmount

        const { error: updateError } = await supabase
            .from('medications')
            .update({ current_stock: newStock })
            .eq('id', med.id)

        if (updateError) {
            console.error(`Error updating ${med.name}:`, updateError)
            errors.push(med.name)
        } else {
            updatedCount++
            updatedNames.push(med.name)
            
            // Log Intake
            await supabase.from('intake_logs').insert({
                medication_id: med.id,
                taken_at: new Date().toISOString(),
                status: 'taken'
            })

            // Inventory Calc
            if (med.daily_dosage > 0) {
                const daysLeft = Math.floor(newStock / med.daily_dosage);
                inventoryReport.push(`${med.name}: ${newStock} Stk (${daysLeft} Tage)`);
            }
        }
    }

    // 3. Send Push Notification
    if (updatedCount > 0) {
        const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', user_id)

        if (subs && subs.length > 0) {
            webpush.setVapidDetails(
                Deno.env.get('VAPID_SUBJECT')!,
                Deno.env.get('VAPID_PUBLIC_KEY')!,
                Deno.env.get('VAPID_PRIVATE_KEY')!
            );

            const pushMessage = `Wochenration gestellt!\n\n${inventoryReport.join('\n')}`;

            for (const sub of subs) {
                try {
                    await webpush.sendNotification(
                        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                        JSON.stringify({ title: 'MediLog Status', body: pushMessage })
                    );
                } catch (e) {
                    console.error("Push failed", e);
                }
            }
        }
    }

    // 4. Return Summary (Text only for Siri)
    const nameList = updatedNames.join(', ');
    return new Response(
      `Erledigt. Wochenration für ${updatedCount} Medikamente gestellt: ${nameList}.`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
