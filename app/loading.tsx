'use client'

import PillLoader from "@/components/ui/PillLoader"

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-white z-50">
      <PillLoader />
    </div>
  )
}
