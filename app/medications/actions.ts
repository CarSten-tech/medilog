'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { MedicationFormSchema, type MedicationFormData } from './schema'

export async function createMedication(data: MedicationFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // 1. Insert into medications table
  const { error: medError } = await supabase
    .from('medications')
    .insert({
      user_id: user.id,
      name: data.name,
      current_stock: data.current_stock,
      daily_dosage: data.daily_dosage,
      frequency_note: data.frequency_note,
      expiry_date: data.expiry_date ? data.expiry_date.toISOString() : null,
      refill_threshold: data.refill_threshold,
      // Defaults/Placeholders for constraints if any
      form_factor: 'tablet', // defaulting for now as we removed the field from UI
      strength: 'N/A' 
    })

  if (medError) {
    console.error('Error creating medication:', medError)
    return { error: 'Failed to create medication' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateMedication(id: string, data: MedicationFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('medications')
    .update({
      name: data.name,
      current_stock: data.current_stock,
      daily_dosage: data.daily_dosage,
      frequency_note: data.frequency_note,
      expiry_date: data.expiry_date ? data.expiry_date.toISOString() : null,
      package_size: data.package_size,
      refill_threshold: data.refill_threshold,
    })
    .eq('id', id)
    .eq('user_id', user.id) // Security: Ensure user owns this medication

  if (error) {
    console.error('Error updating medication:', error)
    return { error: 'Failed to update medication' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateMedicationOrder(orderedIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Bulk update display_order for each medication
  const updates = orderedIds.map((id, index) => 
    supabase
      .from('medications')
      .update({ display_order: index })
      .eq('id', id)
      .eq('user_id', user.id)
  )

  await Promise.all(updates)

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteMedication(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('medications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // Security: Ensure user owns this medication

  if (error) {
    console.error('Error deleting medication:', error)
    return { error: 'Failed to delete medication' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deductWeeklyRation() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: medications, error: fetchError } = await supabase
    .from('medications')
    .select('id, current_stock, daily_dosage')
    .eq('user_id', user.id)

  if (fetchError || !medications) {
    console.error('Error fetching medications:', fetchError)
    return { error: 'Failed to update medications' }
  }

  const updates = medications.map(med => {
    const weeklyDosage = (med.daily_dosage || 0) * 7
    const newStock = Math.max(0, med.current_stock - weeklyDosage)
    
    return supabase
      .from('medications')
      .update({ current_stock: newStock })
      .eq('id', med.id)
  })

  await Promise.all(updates)

  revalidatePath('/dashboard')
  return { success: true }
}
