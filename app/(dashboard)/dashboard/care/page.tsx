import { getMyCaregivers, getPendingInvites, getMyPatients } from '@/app/actions/care'
import CaregiverManager from '@/components/CaregiverManager'

// Diese Seite muss dynamisch sein, damit die Daten immer frisch sind
export const dynamic = 'force-dynamic';

export default async function CarePage() {
    // Alle 3 Datenquellen parallel laden
    const [myCaregivers, pendingInvites, myPatients] = await Promise.all([
        getMyCaregivers(),
        getPendingInvites(),
        getMyPatients()
    ]);

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                🤝 Care Team
            </h1>
            
            <CaregiverManager 
                myCaregivers={myCaregivers} 
                pendingInvites={pendingInvites}
                myPatients={myPatients} 
            />
        </div>
    )
}