"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { addMonths, addYears, format } from "date-fns"
import { Database } from "@/types/supabase"

export type Checkup = Database['public']['Tables']['recurring_checkups']['Row']

// Update CheckupForm to include notes
export type CheckupForm = {
    title: string
    frequency_value: number
    frequency_unit: 'months' | 'years'
    last_visit_date?: Date | null
    patient_id?: string | null
    notes?: string
}

function calculateNextDue(lastVisit: Date, value: number, unit: 'months' | 'years'): Date {
    if (unit === 'months') return addMonths(lastVisit, value)
    return addYears(lastVisit, value)
}

export async function getCheckups(patientId?: string | null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    let query = supabase
        .from('recurring_checkups')
        .select('*')
        .order('next_due_date', { ascending: true }) // Urgent first

    // Logic: 
    // If patientId is provided AND it is DIFFERENT from my own ID, filter by that patient ID.
    // If patientId is NOT provided OR it matches my own ID, filter by patient_id IS NULL (Self).
    
    if (patientId && patientId !== user.id) {
        query = query.eq('patient_id', patientId)
    } else {
        query = query.is('patient_id', null)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching checkups:', error)
        return []
    }

    return data as Checkup[]
}

export async function createCheckup(form: CheckupForm) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error("Unauthorized")

    let next_due_date: Date | null = null
    
    // Logic: If last visit is known, next due is Last + Freq.
    // If NOT known, it's due NOW (or null depending on requirement). 
    // Usually "I need to go to Dentist" -> Due ASAP.
    // Let's set it to today if unknown, or calculated if known.
    if (form.last_visit_date) {
        next_due_date = calculateNextDue(form.last_visit_date, form.frequency_value, form.frequency_unit)
    } else {
        // No history -> Due immediately
        next_due_date = new Date() 
    }

    const { error } = await supabase.from('recurring_checkups').insert({
        user_id: user.id,
        patient_id: form.patient_id || null,
        title: form.title,
        frequency_value: form.frequency_value,
        frequency_unit: form.frequency_unit,
        last_visit_date: form.last_visit_date ? format(form.last_visit_date, 'yyyy-MM-dd') : null,
        next_due_date: format(next_due_date, 'yyyy-MM-dd'),
        notes: form.notes
    })

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/care')
    revalidatePath('/dashboard/checkups')
    return { success: true }
}

export async function completeCheckup(id: string, actualDate: Date) {
    const supabase = await createClient()
    
    // Fetch the checkup to get frequency
    const { data: checkup } = await supabase
        .from('recurring_checkups')
        .select('frequency_value, frequency_unit')
        .eq('id', id)
        .single()

    if (!checkup) throw new Error("Checkup not found")

    // Recalculate next due
    const nextDue = calculateNextDue(actualDate, checkup.frequency_value, checkup.frequency_unit as 'months' | 'years')

    const { error } = await supabase.from('recurring_checkups').update({
        last_visit_date: format(actualDate, 'yyyy-MM-dd'),
        next_due_date: format(nextDue, 'yyyy-MM-dd')
    }).eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/care')
    revalidatePath('/dashboard/checkups')
    return { success: true }
}

export async function deleteCheckup(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('recurring_checkups').delete().eq('id', id)
    if (error) throw new Error(error.message)
    
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/checkups')
    return { success: true }
}
