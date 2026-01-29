'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * 1. GETTER: Einstellungen laden
 */
export async function getUserSettings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, settings_low_stock_days, settings_expiry_warning_days, settings_checkup_lead_days')
    .eq('id', user.id)
    .single()

  return profile
}

/**
 * 2. UPDATE: Profil-Daten (Name)
 */
export async function updateProfile(fullName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt' }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id)

  if (error) return { error: 'Fehler beim Speichern.' }
  
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * 3. UPDATE: Warn-Grenzwerte
 */
export async function updateThresholds(lowStock: number, expiry: number, checkup: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt' }

  const { error } = await supabase
    .from('profiles')
    .update({ 
        settings_low_stock_days: lowStock,
        settings_expiry_warning_days: expiry,
        settings_checkup_lead_days: checkup
    })
    .eq('id', user.id)

  if (error) return { error: 'Fehler beim Speichern.' }
  
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * 4. DELETE: Account löschen (DSGVO)
 * 🔥 ACHTUNG: Das löscht ALLES unwiderruflich.
 */
export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt' }

  // Wir brauchen Admin-Rechte, um den User aus auth.users zu löschen
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. User aus Auth-System löschen
  // (Dank "ON DELETE CASCADE" in der DB sollte das auch das Profil & Medikamente löschen)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)

  if (error) {
      console.error("Delete Error:", error)
      return { error: 'Konnte Account nicht löschen. Bitte Support kontaktieren.' }
  }

  // 2. Logout erzwingen
  await supabase.auth.signOut()
  
  return { success: true }
}