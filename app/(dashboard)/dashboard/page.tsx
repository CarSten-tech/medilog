import { createClient } from '@/utils/supabase/server'
import { SortableMedicationGrid } from "@/components/dashboard/sortable-medication-grid"
import type { MedicationStatus } from "@/components/dashboard/medication-card"
import { WeeklyRefillButton } from "@/components/dashboard/weekly-refill-button"
import { getPendingInvites } from '@/app/actions/care'
import { InviteAlert } from '@/components/dashboard/invite-alert'

export default async function DashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null 
  
  const invites = await getPendingInvites()

  // Determine target user (Self or Patient)
  const patientId = typeof searchParams.patientId === 'string' ? searchParams.patientId : null
  const targetUserId = patientId || user.id
  
  let dashboardTitle = "Meine Medikamente"

  // If viewing patient, fetch name
  if (patientId && patientId !== user.id) {
       const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', patientId)
        .single()
       
       const name = profile?.full_name || profile?.email || 'Patient'
       dashboardTitle = `${name}s Medikamente`
  }

  const today = new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })

  // Fetch medications
  const { data: medications, error } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', targetUserId)
    .order('display_order', { ascending: true })

  if (error) {
    console.error("Error fetching medications:", error)
  }

  // Calculate calculated fields for each medication
  const processedMedications = (medications || []).map((med) => {
    const dailyDosage = med.daily_dosage || 1;
    
    // Calculate Days Left
    let daysLeft = 0;
    if (dailyDosage > 0 && med.current_stock > 0) {
      daysLeft = Math.floor(med.current_stock / dailyDosage);
    }

    // Determine Status
    let status: MedicationStatus = 'ok';
    let isExpired = false;
    let isExpiringSoon = false;

    // Check expiry
    if (med.expiry_date) {
      const expiry = new Date(med.expiry_date);
      const now = new Date();
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(now.getDate() + 7);

      if (expiry < now) {
        status = 'expired';
        isExpired = true;
      } else if (expiry < oneWeekFromNow) {
        status = 'warning'; // Override warning for expiry
        isExpiringSoon = true;
      }
    }

    if (!isExpired && status !== 'warning') {
        if (daysLeft < 7) {
            status = 'critical';
        } else if (daysLeft < 20) {
            status = 'warning';
        }
    }

    // Calculate stock level as percentage (for progress bar, capped at 100)
    const stockPercentage = Math.min(100, (med.current_stock / (dailyDosage * 30)) * 100);

    return {
      id: med.id,
      name: med.name,
      dosage: med.frequency_note || `${dailyDosage}x täglich`,
      stockLevel: stockPercentage,
      daysLeft,
      status, 
      current_stock: med.current_stock,
      daily_dosage: med.daily_dosage,
      frequency_note: med.frequency_note,
      expiry_date: med.expiry_date,
      package_size: med.package_size,
      refill_threshold: med.refill_threshold,
    };
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <InviteAlert invites={invites} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900">{dashboardTitle}</h1>
           <p className="text-slate-500 font-medium">{today}</p>
        </div>
        <WeeklyRefillButton />
      </div>

      <SortableMedicationGrid medications={processedMedications} />
    </div>
  )
}

