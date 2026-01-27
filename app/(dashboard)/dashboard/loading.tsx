'use client'

import PillLoader from "@/components/ui/PillLoader"

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] w-full bg-white z-50">
      <PillLoader />
    </div>
  )
}
