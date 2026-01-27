'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Helper for admin operations (like finding user by email)
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function inviteCaregiver(email: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  // 1. Find the invitee by email
  // We need admin rights to look up user ID by email
  const adminSupabase = getAdminClient()
  
  // Note: listUsers is not always efficient for searching, but for this scale it's fine.
  // Better would be if Supabase exposed "getUserByEmail" in admin API.
  // Actually, there isn't a direct "getByEmail" in admin API without listing.
  // ALTERNATIVE: Just insert into table and let the other user "claim" it?
  // No, we need the ID for the relationship.
  // We will try listing users with filter.
  // Warning: `listUsers` usually requires high privilege and returning all users might be slow if many.
  // For small app, it's ok.
  
  // NOTE: If creating a production app, we should use an RPC function `get_user_by_email` with security definer
  // to avoid exposing the service role key here if possible, but Server Actions run on server so env is safe.
  
  // Actually, Supabase Admin `listUsers` is deprecated for search. 
  // Let's use specific `admin` methods if available. Or just invite via auth.
  
  // SIMPLER APPROACH:
  // We assume the other user gives their User ID or we rely on them entering an "Invite Code".
  // BUT User wants Email.
  
  // Let's try the direct approach:
  // The 'caregiver' must accept. So maybe we create an "Invitation Link" instead?
  // No, user said "Input Email".
  
  // Strategy:
  // 1. Check if user exists in `auth.users`. (Needs Admin)
  // 2. Insert row.
  
  // NOTE: Supabase `generateLink` or similar might help, but let's stick to DB.
  // We will assume for now we can select from a `profiles` table if we have emails there?
  // `public.profiles` usually has `email` if we synced it.
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()
    
  if (!profile) {
      return { error: 'Nutzer nicht gefunden. Bitte sicherstellen, dass er registriert ist.' }
  }

  // 2. Create Relationship
  const { error } = await supabase.from('care_relationships').insert({
      patient_id: user.id,
      caregiver_id: profile.id,
      status: 'pending'
  })

  if (error) {
      if (error.code === '23505') return { error: 'Einladung existiert bereits.' }
      console.error(error)
      return { error: 'Fehler beim Einladen.' }
  }

  revalidatePath('/dashboard/care-team')
  return { success: true }
}

export async function acceptCareInvitation(relationshipId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify it's for me
    const { error } = await supabase
        .from('care_relationships')
        .update({ status: 'active' })
        .eq('id', relationshipId)
        .eq('caregiver_id', user.id)

    if (error) return { error: 'Fehler beim Annehmen' }
    
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/care-team')
    return { success: true }
}

export async function removeCaregiver(relationshipId: string) {
    const supabase = await createClient()
    
    // Policy allows patient or caregiver to delete
    const { error } = await supabase
        .from('care_relationships')
        .delete()
        .eq('id', relationshipId)

    if (error) return { error: 'Fehler beim Entfernen' }
    
    revalidatePath('/dashboard/care-team')
    return { success: true }
}

export async function getCareNetwork() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { mine: [], others: [] }

    // 1. My Caregivers (People who help me)
    const { data: relsAsPatient } = await supabase
        .from('care_relationships')
        .select('*')
        .eq('patient_id', user.id)

    let myCaregivers: any[] = []
    if (relsAsPatient && relsAsPatient.length > 0) {
        const caregiverIds = relsAsPatient.map(r => r.caregiver_id)
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', caregiverIds)
        
        myCaregivers = relsAsPatient.map(r => {
            const profile = profiles?.find(p => p.id === r.caregiver_id)
            return {
                ...r,
                caregiver: profile || { email: 'Unbekannt' }
            }
        })
    }

    // 2. People I help (My patients)
    const { data: relsAsCaregiver } = await supabase
        .from('care_relationships')
        .select('*')
        .eq('caregiver_id', user.id)

    let myPatients: any[] = []
    if (relsAsCaregiver && relsAsCaregiver.length > 0) {
        const patientIds = relsAsCaregiver.map(r => r.patient_id)
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', patientIds)

        myPatients = relsAsCaregiver.map(r => {
            const profile = profiles?.find(p => p.id === r.patient_id)
            return {
                ...r,
                patient: profile || { email: 'Unbekannt' }
            }
        })
    }

    return {
        myCaregivers,
        myPatients
    }
}
