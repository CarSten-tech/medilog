import { createClient } from '@/utils/supabase/server'
import { getCheckups } from '@/app/actions/checkups'
import { CheckupsWidget } from "@/components/dashboard/checkups-widget"
import { Calendar } from 'lucide-react'

export const metadata = {
  title: 'Vorsorge & Termine | MediLog',
  description: 'Verwalte deine wiederkehrenden Arzttermine.',
}

export default async function CheckupsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null 

  // Determine target user (Self or Patient)
  const patientId = typeof searchParams.patientId === 'string' ? searchParams.patientId : null
  const targetUserId = patientId || user.id
  
  // Fetch Data
  const checkups = await getCheckups(targetUserId)

  let title = "Vorsorge & Termine"
  if (patientId && patientId !== user.id) {
       const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', patientId)
        .single()
       const name = profile?.full_name || profile?.email || 'Patient'
       title = `Vorsorge: ${name}`
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
         <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-teal-600" />
            {title}
         </h1>
         <p className="text-slate-500 text-lg">
            Behalte den Überblick über wiederkehrende Untersuchungen.
         </p>
      </div>

      <CheckupsWidget checkups={checkups} patientId={targetUserId} />
    </div>
  )
}
