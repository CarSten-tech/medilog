import { getCaregivers } from '@/app/actions/care'
import { CaregiverManager } from '@/components/CaregiverManager'
import { Navbar } from '@/components/layout/navbar'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function CarePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { myCaregivers, myPatients } = await getCaregivers()

  return (
    <div className="min-h-screen bg-slate-50">
        <Navbar user={user} />
        <main className="max-w-4xl mx-auto p-8">
            <h1 className="text-2xl font-bold mb-6">Care Management</h1>
            <CaregiverManager caregivers={myCaregivers} patients={myPatients} />
        </main>
    </div>
  )
}
