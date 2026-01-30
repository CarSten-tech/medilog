import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import SettingsManager from '@/components/SettingsManager';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch Profile & Settings
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  // Combine auth email with profile data
  const initialSettings = {
      ...profile,
      email: user.email 
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Einstellungen</h1>
        <p className="text-slate-500 mt-2">
           Verwalte dein Profil und deine App-Präferenzen.
        </p>
      </div>

      <SettingsManager initialSettings={initialSettings} />
    </div>
  );
}
