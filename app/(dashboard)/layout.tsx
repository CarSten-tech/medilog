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

  // Fetch my patients (where I am caregiver)
  const { data: relations } = await supabase
    .from('care_relationships')
    .select('patient_id')
    .eq('caregiver_id', user.id)
    .eq('status', 'accepted')

  let patients: any[] = []
  
  if (relations && relations.length > 0) {
      const patientIds = relations.map(r => r.patient_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', patientIds)
      
      patients = profiles || []
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} patients={patients} />
      <main>
        {children}
      </main>
    </div>
  )
}
