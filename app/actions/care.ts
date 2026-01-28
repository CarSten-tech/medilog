'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Search for registered users to invite.
 */
export async function searchUsers(query: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    if (query.length < 2) return []

    const { data, error } = await supabase.rpc('search_profiles', { query_text: query })
    
    if (error) {
        console.error("Search failed:", error)
        return []
    }
    
    return data || []
}

/**
 * Invite a caregiver by ID (selected from list).
 */
export async function inviteCaregiverById(caregiverId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Nicht authentifiziert' }
  if (caregiverId === user.id) return { error: 'Selbst-Einladung nicht möglich.' }

  // Check existing
  const { data: existing } = await supabase
    .from('care_relationships')
    .select('id')
    .eq('patient_id', user.id)
    .eq('caregiver_id', caregiverId)
    .single()

  if (existing) {
    return { error: 'Nutzer bereits eingeladen.' }
  }

  // Insert
  const { error: insertError } = await supabase
    .from('care_relationships')
    .insert({
      patient_id: user.id,
      caregiver_id: caregiverId,
      status: 'pending'
    })

  if (insertError) {
    return { error: 'Fehler beim Speichern.' }
  }

  revalidatePath('/dashboard/care')
  return { success: true }
}

/**
 * Invite User by Email (Secure RPC)
 */
export async function inviteCaregiverByEmail(email: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authorized' }
    
    if (email === user.email) return { error: 'You cannot invite yourself.' }

    // 1. Resolve Info via RPC (Using Admin Client to prevent exposing RPC to users)
    // Note: We need a service role client here because we revoked user access to this RPC
    const supabaseAdmin = await createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: targetUserId, error: rpcError } = await supabaseAdmin
        .rpc('get_user_id_by_email', { email_input: email })

    if (rpcError || !targetUserId) {
        return { error: 'Nutzer nicht gefunden. Bitte prüfen Sie die E-Mail.' }
    }

    // 2. Check Existing
    const { data: existing } = await supabase
        .from('care_relationships')
        .select('id')
        .eq('patient_id', user.id)
        .eq('caregiver_id', targetUserId)
        .single()
    
    if (existing) return { error: 'Diesen Nutzer haben Sie bereits eingeladen.' }

    // 3. Insert
    const { error } = await supabase
        .from('care_relationships')
        .insert({
            patient_id: user.id,
            caregiver_id: targetUserId,
            status: 'pending' 
        })
    
    if (error) return { error: 'Fehler beim Einladen.' }

    revalidatePath('/dashboard/care')
    return { success: true }
}

export async function getMyCaregivers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

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

export async function removeCaregiver(relationshipId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Nicht authentifiziert' }

  const { error } = await supabase
    .from('care_relationships')
    .delete()
    .eq('id', relationshipId)
    .eq('patient_id', user.id)

  if (error) return { error: 'Löschen fehlgeschlagen.' }

  revalidatePath('/dashboard/care')
  return { success: true }
}

/**
 * NEW: Get invitations where I am the CAREGIVER (Status: Pending)
 */
export async function getPendingInvites() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: rels } = await supabase
    .from('care_relationships')
    .select('*')
    .eq('caregiver_id', user.id)
    .eq('status', 'pending')

  if (!rels || rels.length === 0) return []

  // Resolve Patient Names
  const patientIds = rels.map(r => r.patient_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', patientIds)

  return rels.map(r => {
      const p = profiles?.find(prof => prof.id === r.patient_id)
      return {
          id: r.id,
          patientName: p?.full_name || p?.email || 'Unbekannt',
          patientEmail: p?.email,
          createdAt: r.created_at
      }
  })
}

/**
 * NEW: Respond to an invite (Accept or Reject)
 */
export async function respondToInvite(relationshipId: string, accept: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht authentifiziert' }

  if (accept) {
      // Update to accepted
      const { error } = await supabase
        .from('care_relationships')
        .update({ status: 'accepted' })
        .eq('id', relationshipId)
        .eq('caregiver_id', user.id) // Security check
      
      if (error) return { error: 'Fehler beim Akzeptieren.' }
  } else {
      // Reject = Delete
      const { error } = await supabase
        .from('care_relationships')
        .delete()
        .eq('id', relationshipId)
        .eq('caregiver_id', user.id)
      
      if (error) return { error: 'Fehler beim Ablehnen.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/care')
  return { success: true }
}
