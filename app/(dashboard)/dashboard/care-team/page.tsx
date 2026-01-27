import { createClient } from '@/utils/supabase/server'
import { getCareNetwork, inviteCaregiver, removeCaregiver, acceptCareInvitation } from '@/app/actions/caregiver'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Check, UserPlus } from 'lucide-react'
import { revalidatePath } from 'next/cache'

export default async function CareTeamPage() {
  const { myCaregivers = [], myPatients = [] } = await getCareNetwork()
  const supabase = await createClient()
  const runInvite = async (formData: FormData) => {
    'use server'
    const email = formData.get('email') as string
    if (email) await inviteCaregiver(email)
  }
  
  // Separate handlers for buttons requiring closure/bind, or inline server action
  const runAccept = async (id: string) => {
      'use server'
      await acceptCareInvitation(id)
  }
  
  const runRemove = async (id: string) => {
      'use server'
      await removeCaregiver(id)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mein Care-Team</h1>
        <p className="text-slate-500">Verwalte hier, wer Zugriff auf deine Medikation hat.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* SECTION 1: People who help ME */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-teal-600" />
                    Meine Betreuer
                </CardTitle>
                <CardDescription>
                    Personen, die deine Medikamente verwalten dürfen.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form action={runInvite} className="flex gap-2">
                    <Input name="email" placeholder="E-Mail des Betreuers" type="email" required />
                    <Button type="submit" size="icon"><Plus className="h-4 w-4" /></Button>
                </form>

                <div className="space-y-2">
                    {myCaregivers.length === 0 && <p className="text-sm text-slate-400 italic">Keine Betreuer eingeladen.</p>}
                    {myCaregivers.map((rel: any) => (
                        <div key={rel.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border">
                            <div>
                                <p className="font-medium text-sm">{rel.caregiver?.email}</p>
                                <p className="text-xs text-slate-500 capitalize">{rel.status === 'pending' ? 'Wartet auf Annahme...' : 'Aktiv'}</p>
                            </div>
                            <form action={runRemove.bind(null, rel.id)}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        {/* SECTION 2: People I help */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-indigo-600" />
                    Meine Patienten
                </CardTitle>
                <CardDescription>
                    Personen, deren Medikamente du verwaltest.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {myPatients.length === 0 && <p className="text-sm text-slate-400 italic">Du betreust niemanden.</p>}
                    {myPatients.map((rel: any) => (
                        <div key={rel.id} className="flex justify-between items-center p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                            <div>
                                <p className="font-medium text-sm">{rel.patient?.email}</p>
                                {rel.status === 'pending' && (
                                    <p className="text-xs text-amber-600 font-medium">Einladung erhalten!</p>
                                )}
                            </div>
                            <div className="flex gap-1">
                                {rel.status === 'pending' && (
                                    <form action={runAccept.bind(null, rel.id)}>
                                        <Button size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700">Annehmen</Button>
                                    </form>
                                )}
                                <form action={runRemove.bind(null, rel.id)}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
