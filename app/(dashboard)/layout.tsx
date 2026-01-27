import { Navbar } from '@/components/layout/navbar'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch care network
  const { getCareNetwork } = await import('@/app/actions/caregiver')
  const { myPatients = [] } = await getCareNetwork()

  // Map to simpler structure if needed, or pass as is.
  // PatientSwitcher expects: { id: string, first_name: string | null, last_name: string | null, email: string | null }
  // The query returns { patient: { ... } }. Need to flatten.
  const patients = (myPatients || []).map(rel => ({
      // @ts-ignore
      id: rel.patient?.id,
      // @ts-ignore
      first_name: rel.patient?.first_name,
      // @ts-ignore
      last_name: rel.patient?.last_name,
      // @ts-ignore
      email: rel.patient?.email
  }))

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} patients={patients} />
      <main>
        {children}
      </main>
    </div>
  )
}
