'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inviteCaregiverByEmail, removeCaregiver } from '@/app/actions/care'
import { toast } from 'sonner'
import { Loader2, Trash2, UserPlus, Users } from 'lucide-react'

// Props: caregivers list passed from server component
interface CaregiverManagerProps {
    caregivers: any[]
}

export default function CaregiverManager({ caregivers }: CaregiverManagerProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleInvite(e: React.FormEvent) {
      e.preventDefault()
      if (!email) return
      setLoading(true)

      const res = await inviteCaregiverByEmail(email)
      
      setLoading(false)
      if (res.error) {
          toast.error(res.error)
      } else {
          toast.success('Einladung gesendet!')
          setEmail('')
      }
  }

  async function handleRemove(id: string) {
      if (!confirm("Sicher entfernen?")) return
      
      const res = await removeCaregiver(id)
      if (res.error) {
          toast.error(res.error)
      } else {
          toast.success("Entfernt.")
      }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Mein Pflege-Team
        </CardTitle>
        <CardDescription>
            Laden Sie Angehörige oder Pfleger ein, um Ihren Vorrat zu verwalten.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Invite Form */}
        <form onSubmit={handleInvite} className="flex gap-2 items-end">
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="email">E-Mail Adresse des Pflegers</Label>
                <Input 
                    type="email" 
                    id="email" 
                    placeholder="pfleger@example.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
            </div>
            <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span className="sr-only">Einladen</span>
            </Button>
        </form>

        {/* List */}
        <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Aktuelle Zugriffe:</h4>
            {caregivers.length === 0 && (
                <p className="text-sm text-gray-500 italic">Noch keine Pfleger eingeladen.</p>
            )}
            {caregivers.map((cg) => (
                <div key={cg.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-900">
                    <div>
                        <p className="font-medium text-sm">{cg.full_name || 'Unbekannt'}</p>
                        <p className="text-xs text-muted-foreground">{cg.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded ${
                            cg.status === 'accepted' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                            {cg.status === 'accepted' ? 'Aktiv' : 'Ausstehend'}
                        </span>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemove(cg.id)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>

      </CardContent>
    </Card>
  )
}
