'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// --- RATE LIMIT CONFIG ---
const RATE_LIMIT_WINDOW_MINUTES = 60;
const MAX_ATTEMPTS_PER_WINDOW = 5;

/**
 * 1. E-Mail Einladung (Sicher & Limitiert)
 */
export async function inviteCaregiverByEmail(email: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { error: 'Nicht authentifiziert' }
    if (email === user.email) return { error: 'Du kannst dich nicht selbst einladen.' }

    // --- SCHRITT A: RATE LIMIT CHECK (Die Bremse) ---
    const timeWindow = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    
    const { count, error: countError } = await supabase
        .from('invite_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', timeWindow);

    if (countError) return { error: 'Systemfehler beim Sicherheits-Check.' };
    
    if (count !== null && count >= MAX_ATTEMPTS_PER_WINDOW) {
        return { error: `Zu viele Versuche. Bitte warte eine Stunde.` };
    }

    // Versuch loggen
    await supabase.from('invite_attempts').insert({ user_id: user.id });

    // --- SCHRITT B: EIGENTLICHE LOGIK (Die Tarnkappe) ---
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: targetUserId } = await supabaseAdmin
        .rpc('get_user_id_by_email', { email_input: email })

    if (targetUserId) {
        // Prüfen ob schon verbunden
        const { data: existing } = await supabase
            .from('care_relationships')
            .select('id')
            .eq('patient_id', user.id)
            .eq('caregiver_id', targetUserId)
            .single()
        
        if (!existing) {
            await supabase
                .from('care_relationships')
                .insert({
                    patient_id: user.id,
                    caregiver_id: targetUserId,
                    status: 'pending' 
                })
        }
    } else {
        // Optional: Hier könnte man eine echte E-Mail senden ("Komm zu MediLog")
        // Wir machen silent fail für Privacy.
        console.log(`Invite an Unbekannt: ${email}`);
    }

    revalidatePath('/dashboard/care')
    return { success: true, message: "Falls der Nutzer existiert, wurde die Einladung gesendet." }
}

/**
 * 2. Magic Link Erstellen (Der Profi-Weg)
 */
export async function createInviteLink() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht eingeloggt' }

    // Token generieren (einfacher Random String)
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const { error } = await supabase
        .from('share_links')
        .insert({
            creator_id: user.id,
            token: token
        })

    if (error) return { error: 'Konnte Link nicht erstellen.' }

    // Den fertigen Link zurückgeben
    // HINWEIS: Wir bauen die URL im Frontend zusammen oder hier
    return { success: true, token: token }
}

/**
 * 3. Link Annehmen (Wenn der Freund klickt)
 */
export async function acceptInviteLink(token: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Wenn nicht eingeloggt -> Redirect zum Login (muss vom Client gehandhabt werden)
    if (!user) return { error: 'unauthorized' }

    // Token suchen (Admin Client nötig, da User fremde Links nicht lesen darf)
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: link, error } = await supabaseAdmin
        .from('share_links')
        .select('*')
        .eq('token', token)
        .eq('status', 'active')
        .single()

    if (error || !link) return { error: 'Dieser Link ist ungültig oder abgelaufen.' }

    if (link.creator_id === user.id) return { error: 'Du kannst dich nicht selbst einladen.' }
    if (new Date(link.expires_at) < new Date()) return { error: 'Der Link ist abgelaufen.' }

    // Beziehung herstellen (Patient = Creator, Caregiver = User der klickt)
    // Wir setzen es direkt auf "accepted", da der Creator den Link ja freiwillig geteilt hat.
    const { error: relError } = await supabaseAdmin
        .from('care_relationships')
        .insert({
            patient_id: link.creator_id,
            caregiver_id: user.id,
            status: 'accepted'
        })

    if (relError) {
        // Checken ob schon existiert
        if (relError.code === '23505') return { error: 'Ihr seid bereits verbunden!' }
        return { error: 'Fehler beim Verbinden.' }
    }

    // Link als "benutzt" markieren
    await supabaseAdmin
        .from('share_links')
        .update({ status: 'used', used_by: user.id })
        .eq('id', link.id)

    return { success: true }
}

// ... Restliche Funktionen (removeCaregiver, respondToInvite etc.) bleiben gleich wie vorher ...
// Kopiere hier deine alten Hilfsfunktionen rein (getMyCaregivers, removeCaregiver, etc.)
// Ich füge sie der Vollständigkeit halber kurz an:

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

export async function respondToInvite(relationshipId: string, accept: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht authentifiziert' }
  
    if (accept) {
        const { error } = await supabase
          .from('care_relationships')
          .update({ status: 'accepted' })
          .eq('id', relationshipId)
          .eq('caregiver_id', user.id)
        if (error) return { error: 'Fehler' }
    } else {
        const { error } = await supabase
          .from('care_relationships')
          .delete()
          .eq('id', relationshipId)
          .eq('caregiver_id', user.id)
        if (error) return { error: 'Fehler' }
    }
    revalidatePath('/dashboard/care')
    return { success: true }
}