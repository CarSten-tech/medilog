import { createClient } from '@/utils/supabase/server'
import { SortableMedicationGrid } from "@/components/dashboard/sortable-medication-grid"
import type { MedicationStatus } from "@/components/dashboard/medication-card"
import { WeeklyRefillButton } from "@/components/dashboard/weekly-refill-button"

export default async function DashboardPage() {
  const supabase = await createClient()
  const today = new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })

  // Fetch medications ordered by display_order
  const { data: medications, error } = await supabase
    .from('medications')
    .select('*')
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
    if (daysLeft < 7) {
      status = 'critical';
    } else if (daysLeft < 20) {
      status = 'warning';
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
      refill_threshold: med.refill_threshold,
    };
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900">Meine Medikamente</h1>
           <p className="text-slate-500 font-medium">{today}</p>
        </div>
        <WeeklyRefillButton />
      </div>

      <SortableMedicationGrid medications={processedMedications} />
    </div>
  )
}

