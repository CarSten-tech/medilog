'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function inviteCaregiver(email: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  // 1. Get User ID by Email (RPC)
  const { data: inviteeId, error: rpcError } = await supabase
    .rpc('get_user_id_by_email', { email_input: email })

  if (rpcError || !inviteeId) {
    console.error("RPC Error:", rpcError)
    return { error: 'Nutzer nicht gefunden. Ist diese E-Mail registriert?' }
  }

  if (inviteeId === user.id) {
    return { error: 'Du kannst dich nicht selbst einladen.' }
  }

  // 2. Create Relationship
  const { error: insertError } = await supabase
    .from('care_relationships')
    .insert({
      patient_id: user.id,
      caregiver_id: inviteeId,
      status: 'pending'
    })

  if (insertError) {
    if (insertError.code === '23505') {
       return { error: 'Einladung bereits gesendet.' }
    }
    console.error("Insert Error:", insertError)
    return { error: 'Fehler beim Senden der Einladung.' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function acceptInvitation(relationshipId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('care_relationships')
    .update({ status: 'accepted' })
    .eq('id', relationshipId)
    .eq('caregiver_id', user.id) // Security check

  if (error) {
    return { error: 'Fehler beim Annehmen.' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function removeRelationship(relationshipId: string) {
    const supabase = await createClient()
    const { error } = await supabase
      .from('care_relationships')
      .delete()
      .eq('id', relationshipId)
    
    if (error) return { error: 'Fehler beim Löschen.' }
    revalidatePath('/dashboard')
    return { success: true }
}

export async function getCaregivers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { mine: [], others: [] }

  // My Caregivers (People taking care of me)
  const { data: myCaregivers } = await supabase
    .from('care_relationships')
    .select(`
      id, status, 
      caregiver_id
    `)
    .eq('patient_id', user.id)

  // My Patients (People I take care of)
  const { data: myPatients } = await supabase
    .from('care_relationships')
    .select(`
      id, status,
      patient_id
    `)
    .eq('caregiver_id', user.id)

  // Fetch Emails separately to be safe (avoiding join issues)
  // We can use the same RPC or just query profiles table if we trust it. 
  // Let's assume we use 'profiles' since we have it, it's cleaner for UI.
  // BUT user prompt didn't strictly say "use profiles", but we need email for UI.
  
  const allUserIds = [
      ...(myCaregivers?.map(c => c.caregiver_id) || []),
      ...(myPatients?.map(p => p.patient_id) || [])
  ]
  
  let profiles: any[] = []
  if (allUserIds.length > 0) {
      const { data } = await supabase.from('profiles').select('id, email').in('id', allUserIds)
      profiles = data || []
  }

  const mapEmail = (id: string) => profiles.find(p => p.id === id)?.email || 'Unknown'

  return {
    myCaregivers: myCaregivers?.map(c => ({...c, email: mapEmail(c.caregiver_id)})) || [],
    myPatients: myPatients?.map(p => ({...p, email: mapEmail(p.patient_id)})) || []
  }
}
