'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { acceptInviteLink } from '@/app/actions/care'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, X, Loader2, ShieldQuestion } from 'lucide-react'

interface InviteProps {
    token: string
    inviterName: string
    inviterEmail: string
}

export default function InviteConfirmation({ token, inviterName, inviterEmail }: InviteProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleAccept = async () => {
        setLoading(true)
        try {
            const res = await acceptInviteLink(token)
            if (res.success) {
                toast.success('Einladung angenommen! Du bist jetzt verbunden.')
                router.push('/dashboard/care') // Weiterleitung nach Erfolg
            } else {
                toast.error(res.error || 'Fehler beim Annehmen.')
                setLoading(false)
            }
        } catch (e) {
            toast.error('Es ist ein Fehler aufgetreten.')
            setLoading(false)
        }
    }

    const handleDecline = () => {
        toast.info('Einladung abgelehnt.')
        router.push('/dashboard')
    }

    return (
        <Card className="max-w-md w-full shadow-xl border-slate-200 animate-in zoom-in duration-300">
            <div className="h-2 bg-emerald-500 w-full" />
            <CardHeader className="text-center pb-2">
                <div className="mx-auto bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
                    <ShieldQuestion className="w-8 h-8 text-emerald-600" />
                </div>
                <CardTitle className="text-xl">Einladung erhalten</CardTitle>
                <CardDescription>
                    Möchtest du dem Betreuungs-Team beitreten?
                </CardDescription>
            </CardHeader>

            <CardContent className="text-center space-y-6 pt-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Einladung von</p>
                    <div className="flex items-center justify-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                                {inviterName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                            <p className="font-bold text-slate-900">{inviterName}</p>
                            <p className="text-xs text-slate-500">{inviterEmail}</p>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-slate-600 px-4">
                    Wenn du annimmst, kannst du den Medikamenten-Status dieser Person einsehen und wirst bei Knappheit benachrichtigt.
                </div>
            </CardContent>

            <CardFooter className="flex gap-3 bg-slate-50/50 p-6">
                <Button 
                    variant="outline" 
                    className="flex-1 border-slate-200 hover:bg-white hover:text-red-600 hover:border-red-200" 
                    onClick={handleDecline}
                    disabled={loading}
                >
                    <X className="w-4 h-4 mr-2" /> Ablehnen
                </Button>
                <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md" 
                    onClick={handleAccept}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                    Annehmen
                </Button>
            </CardFooter>
        </Card>
    )
}