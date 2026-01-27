// @ts-nocheck
import { createClient } from 'jsr:@supabase/supabase-js@2'

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

    // 1. Fetch ALL active medications for this user
    const { data: medications, error: fetchError } = await supabase
      .from('medications')
      .select('id, name, current_stock, daily_dosage')
      .eq('user_id', user_id)
      // Removed .gt('current_stock', 0) to allow filling even if stock is technically 0/negative in DB
      // assuming user has physical access to meds.

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

    // 2. Process each medication
    for (const med of medications) {
        // Calculate weekly amount
        // daily_dosage is per day. Weekly need = daily * 7.
        const weeklyAmount = Number(med.daily_dosage) * 7
        
        // Skip if dosage is 0
        if (weeklyAmount <= 0) continue;

        const newStock = Number(med.current_stock) - weeklyAmount

        // Update Stock
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
            const { error: logError } = await supabase.from('intake_logs').insert({
                medication_id: med.id,
                taken_at: new Date().toISOString(),
                status: 'taken'
            })
            
            if (logError) console.error("Log error", logError)
        }
    }

    // 3. Return Summary (Text only for Siri)
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
