'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// --- Update Profile (Full Name) ---
export async function updateProfile(fullName: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Nicht authentifiziert" };

    const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

    if (error) {
        console.error("Update Profile Error:", error);
        return { error: "Fehler beim Aktualisieren des Profils." };
    }

    revalidatePath('/dashboard');
    return { success: true };
}

// --- Update Thresholds ---
export async function updateThresholds(lowStock: number, expiry: number, checkup: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Nicht authentifiziert" };

    const { error } = await supabase
        .from('profiles')
        .update({
            settings_low_stock_days: lowStock,
            settings_expiry_warning_days: expiry,
            settings_checkup_lead_days: checkup
        })
        .eq('id', user.id);

    if (error) {
        console.error("Update Thresholds Error:", error);
        return { error: "Fehler beim Speichern der Einstellungen." };
    }

    revalidatePath('/dashboard');
    return { success: true };
}

// --- Delete Account ---
export async function deleteAccount() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Nicht authentifiziert" };

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (error) {
        console.error("Delete Account Error:", error);
        return { error: "Konnte Account nicht löschen. Bitte Support kontaktieren." };
    }

    return { success: true };
}
