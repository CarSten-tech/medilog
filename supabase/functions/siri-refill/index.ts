
import { createClient } from 'jsr:@supabase/supabase-js@2'

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

    const { user_id } = await req.json()

    if (!user_id) {
        throw new Error('Missing user_id')
    }

    // 1. Find medication with lowest stock > 0
    // Using service role is fine here as user_id is passed explicitly for this automation context
    const { data: medications, error: fetchError } = await supabase
      .from('medications')
      .select('id, name, current_stock, daily_dosage')
      .eq('user_id', user_id)
      .gt('current_stock', 0)
      .order('current_stock', { ascending: true })
      .limit(1)

    if (fetchError) throw fetchError

    if (!medications || medications.length === 0) {
      return new Response(
        JSON.stringify({ message: "Keine Medikamente mit verbleibendem Vorrat gefunden." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const med = medications[0]
    
    // 2. Decrement stock
    // Calculate decrement amount. Assuming 1 pill intake or daily dosage?
    // User request: "Decrement its current_stock by 1" specifically.
    // However, if daily_dosage is 0.5, removing 1 might be "2 doses".
    // But request said "Decrement ... by 1". I will stick to exact request for "siri-refill" 
    // which sounds like "I just took a pill".
    
    const newStock = med.current_stock - 1

    const { error: updateError } = await supabase
      .from('medications')
      .update({ current_stock: newStock })
      .eq('id', med.id)

    if (updateError) throw updateError

    // 3. Optional: Insert intake log via RPC or direct insert if RLS allows or using service role
    // Service role allows everything so we are good.
    await supabase.from('intake_logs').insert({
        medication_id: med.id,
        taken_at: new Date().toISOString(),
        status: 'taken'
    })

    // 4. Return Siri Message
    return new Response(
      JSON.stringify({ 
        message: `Erledigt. ${med.name} wurde eingetragen. Noch ${newStock} Stück übrig.` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
