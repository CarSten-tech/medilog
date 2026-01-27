'use client'

import { useState } from 'react'
import { inviteCaregiver, acceptInvitation, removeRelationship } from '@/app/actions/care'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Check, Trash2, UserPlus, Users } from 'lucide-react'

interface CaregiverManagerProps {
  caregivers: any[]
  patients: any[]
}

export function CaregiverManager({ caregivers, patients }: CaregiverManagerProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleInvite = async () => {
    if (!email) return
    setLoading(true)
    const result = await inviteCaregiver(email)
    setLoading(false)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Einladung gesendet!')
      setEmail('')
    }
  }

  const handleAccept = async (id: string) => {
      const res = await acceptInvitation(id)
      if (res.error) toast.error(res.error)
      else toast.success('Angenommen!')
  }

  const handleRemove = async (id: string) => {
      const res = await removeRelationship(id)
      if (res.error) toast.error(res.error)
      else toast.success('Entfernt.')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
             <CardTitle className="flex items-center gap-2">
                 <UserPlus className="h-5 w-5 text-teal-600" />
                 Betreuer einladen
             </CardTitle>
             <CardDescription>
                 Gewähre Zugriff auf deine Medikamente.
             </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex gap-2">
                <Input 
                    placeholder="E-Mail Adresse" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                />
                <Button onClick={handleInvite} disabled={loading} className="cursor-pointer">
                    {loading ? '...' : 'Einladen'}
                </Button>
            </div>
            
            <div className="space-y-2">
                {caregivers.map((c: any) => (
                    <div key={c.id} className="flex justify-between items-center p-3 border rounded bg-slate-50">
                        <div>
                            <span className="font-medium">{c.email}</span>
                            <span className="ml-2 text-xs text-slate-500 uppercase">({c.status})</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemove(c.id)} className="text-red-500 hover:text-red-700 cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {caregivers.length === 0 && <p className="text-sm text-slate-400">Keine Betreuer.</p>}
            </div>
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Meine Patienten
              </CardTitle>
              <CardDescription>
                  Einladungen, die du erhalten hast.
              </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-2">
                {patients.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center p-3 border rounded bg-indigo-50/50 border-indigo-100">
                        <div>
                            <span className="font-medium">{p.email}</span>
                             {p.status === 'pending' && <span className="ml-2 text-xs text-amber-600 font-bold">NEU</span>}
                        </div>
                        <div className="flex gap-2">
                            {p.status === 'pending' && (
                                <Button size="sm" onClick={() => handleAccept(p.id)} className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
                                    <Check className="h-4 w-4 mr-1" />
                                    Annehmen
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleRemove(p.id)} className="text-slate-400 hover:text-red-500 cursor-pointer">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
                 {patients.length === 0 && <p className="text-sm text-slate-400">Du betreust niemanden.</p>}
             </div>
          </CardContent>
      </Card>
    </div>
  )
}
