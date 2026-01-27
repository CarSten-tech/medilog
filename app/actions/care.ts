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
