import { getUserSettings } from '@/app/actions/settings'
import SettingsManager from '@/components/SettingsManager'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const settings = await getUserSettings()

    if (!settings) {
        redirect('/login')
    }

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-8">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                ⚙️ Einstellungen
            </h1>
            
            <SettingsManager initialSettings={settings} />
        </div>
    )
}