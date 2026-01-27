'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Invite a caregiver via email.
 * Uses a secure RPC function to resolve the email to a User ID.
 */
export async function inviteCaregiver(email: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
      return { error: 'Nicht authentifiziert' }
  }

  // 1. Resolve Info
  const { data: caregiverId, error: rpcError } = await supabase
    .rpc('get_user_id_by_email', { email_input: email })

  if (rpcError || !caregiverId) {
    console.error("RPC Lookup failed:", rpcError)
    // Security: Don't reveal if user exists or not specifically, but for this UX we need to say "User not found".
    return { error: 'Kein Nutzer mit dieser E-Mail gefunden.' }
  }

  // 2. Validation
  if (caregiverId === user.id) {
    return { error: 'Du kannst dich nicht selbst einladen.' }
  }

  // Check existing
  const { data: existing } = await supabase
    .from('care_relationships')
    .select('id')
    .eq('patient_id', user.id)
    .eq('caregiver_id', caregiverId)
    .single()

  if (existing) {
    return { error: 'Dieser Nutzer ist bereits eingeladen oder hinzugefügt.' }
  }

  // 3. Insert
  const { error: insertError } = await supabase
    .from('care_relationships')
    .insert({
      patient_id: user.id,
      caregiver_id: caregiverId,
      status: 'pending' // Default
    })

  if (insertError) {
    console.error("Insert failed:", insertError)
    return { error: 'Fehler beim Speichern der Einladung.' }
  }

  revalidatePath('/settings')
  return { success: true }
}

/**
 * Get list of people who care for me (My Caregivers).
 */
export async function getMyCaregivers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  // We need the EMAIL of the caregiver to display it.
  // Since we don't have a direct join setup in TypeGen immediately visible,
  // we will fetch relationships first, then resolve emails via 'profiles' or another query.
  // Ideally, use a join: .select('*, caregiver:profiles!caregiver_id(email)') if FK exists.
  // Fallback: Fetch IDs and then profiles.

  const { data: rels } = await supabase
    .from('care_relationships')
    .select('*')
    .eq('patient_id', user.id)
  
  if (!rels || rels.length === 0) return []

  const caregiverIds = rels.map(r => r.caregiver_id)
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', caregiverIds)
    
  // Combine data
  return rels.map(r => {
      const profile = profiles?.find(p => p.id === r.caregiver_id)
      return {
          id: r.id,
          caregiver_id: r.caregiver_id,
          status: r.status,
          email: profile?.email || 'Unbekannt',
          full_name: profile?.full_name
      }
  })
}

/**
 * Remove a caregiver (Revoke access).
 */
export async function removeCaregiver(relationshipId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Nicht authentifiziert' }

  const { error } = await supabase
    .from('care_relationships')
    .delete()
    .eq('id', relationshipId)
    .eq('patient_id', user.id) // Ensure I am the patient deleting my caregiver

  if (error) {
     return { error: 'Löschen fehlgeschlagen.' }
  }

  revalidatePath('/settings')
  return { success: true }
}
