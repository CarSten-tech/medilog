import { getMyCaregivers, getPendingInvites } from '@/app/actions/care'
import CaregiverManager from '@/components/CaregiverManager'

// Diese Seite muss dynamisch sein, damit die Daten immer frisch sind
export const dynamic = 'force-dynamic';

export default async function CarePage() {
    // Beides parallel holen
    const [myCaregivers, pendingInvites] = await Promise.all([
        getMyCaregivers(),
        getPendingInvites()
    ]);

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                🤝 Care Team
            </h1>
            
            {/* Hier war der Fehler: Props müssen stimmen! */}
            <CaregiverManager 
                myCaregivers={myCaregivers} 
                pendingInvites={pendingInvites} 
            />
        </div>
    )
}