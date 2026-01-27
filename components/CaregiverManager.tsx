'use client'

import { useState } from 'react'
import { inviteCaregiver, removeCaregiver } from '@/app/actions/care'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge' // Assuming you have a Badge component, or use standar span
import { Loader2, Trash2, UserPlus, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner' // Or your toast provider

interface Caregiver {
    id: string
    caregiver_id: string
    email: string
    status: 'pending' | 'accepted'
}

interface CaregiverManagerProps {
    caregivers: Caregiver[]
}

export function CaregiverManager({ caregivers }: CaregiverManagerProps) {
    const [email, setEmail] = useState('')
    const [isInviting, setIsInviting] = useState(false)
    const [isRemoving, setIsRemoving] = useState<string | null>(null)

    const handleInvite = async () => {
        if (!email.trim() || !email.includes('@')) {
            toast.error('Bitte eine gültige E-Mail eingeben.')
            return
        }

        setIsInviting(true)
        try {
            const result = await inviteCaregiver(email)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Einladung gesendet!')
                setEmail('')
            }
        } catch (e) {
            toast.error('Ein unerwarteter Fehler ist aufgetreten.')
        } finally {
            setIsInviting(false)
        }
    }

    const handleRemove = async (id: string) => {
        setIsRemoving(id)
        const result = await removeCaregiver(id)
        setIsRemoving(null)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Zugriff entzogen.')
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-teal-600" />
                    Betreuer Zugriff
                </CardTitle>
                <CardDescription>
                    Erlaube anderen Personen (z.B. Pflegern oder Angehörigen), deine Medikamente zu verwalten.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {/* Invite Section */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Input 
                        placeholder="E-Mail des Betreuers" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1"
                    />
                    <Button 
                        onClick={handleInvite} 
                        disabled={isInviting || !email}
                        className="bg-teal-600 hover:bg-teal-700 text-white min-w-[120px]"
                    >
                        {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Einladen'}
                    </Button>
                </div>

                <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wider">
                        Berechtigte Personen
                    </h3>
                    
                    <div className="space-y-3">
                        {caregivers.length === 0 && (
                            <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-lg border border-dashed">
                                <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Niemand hat aktuell Zugriff.</p>
                            </div>
                        )}

                        {caregivers.map((c) => (
                            <div key={c.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-slate-900">{c.email}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant={c.status === 'accepted' ? 'default' : 'secondary'} 
                                               className={c.status === 'accepted' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'}>
                                            {c.status === 'accepted' ? 'Aktiv' : 'Wartet auf Annahme'}
                                        </Badge>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleRemove(c.id)}
                                    disabled={!!isRemoving}
                                    title="Zugriff entziehen"
                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                >
                                    {isRemoving === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
