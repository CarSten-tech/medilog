'use client'

import { useState } from 'react'
import { respondToInvite } from '@/app/actions/care'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { UserCheck, X, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Invite {
    id: string
    patientName: string
    patientEmail?: string
}

interface InviteAlertProps {
    invites: Invite[]
}

export function InviteAlert({ invites: initialInvites }: InviteAlertProps) {
    const [invites, setInvites] = useState(initialInvites)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const router = useRouter()

    if (invites.length === 0) return null

    const handleRespond = async (id: string, accept: boolean) => {
        setLoadingId(id)
        const result = await respondToInvite(id, accept)
        setLoadingId(null)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(accept ? 'Einladung angenommen!' : 'Einladung abgelehnt.')
            setInvites(prev => prev.filter(i => i.id !== id))
            router.refresh()
        }
    }

    return (
        <div className="space-y-4 mb-6">
            {invites.map(invite => (
                <Alert key={invite.id} className="bg-teal-50 border-teal-200">
                    <UserCheck className="h-5 w-5 text-teal-600" />
                    <AlertTitle className="text-teal-900 font-semibold flex items-center gap-2">
                        Betreuungs-Anfrage
                    </AlertTitle>
                    <AlertDescription className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="text-teal-800">
                            <strong>{invite.patientName}</strong> möchte, dass du seine Medikamente verwaltest.
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="bg-white hover:bg-red-50 hover:text-red-600 border-teal-200"
                                onClick={() => handleRespond(invite.id, false)}
                                disabled={loadingId === invite.id}
                            >
                                {loadingId === invite.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                                Ablehnen
                            </Button>
                            <Button 
                                size="sm" 
                                className="bg-teal-600 hover:bg-teal-700 text-white border-0"
                                onClick={() => handleRespond(invite.id, true)}
                                disabled={loadingId === invite.id}
                            >
                                {loadingId === invite.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                                Annehmen
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            ))}
        </div>
    )
}
