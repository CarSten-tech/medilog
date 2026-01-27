import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" /> {/* Title: "Hallo, Max..." */}
                    <Skeleton className="h-4 w-48" /> {/* Subtitle: Date */}
                </div>
                <Skeleton className="h-10 w-32" /> {/* Button: Add Medication */}
            </div>

            {/* KPI Cards Skeleton */}
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-12 mb-1" />
                            <Skeleton className="h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>

             {/* Main Grid Header Skeleton */}
             <div className="flex justify-between items-center">
                 <Skeleton className="h-6 w-40" />
                 <Skeleton className="h-9 w-24" /> {/* View Toggle / Sort */}
             </div>

            {/* Application Grid Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="overflow-hidden">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <Skeleton className="h-6 w-16 rounded-full" />
                            </div>
                            <div className="space-y-1">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                            <div className="pt-2">
                                <Skeleton className="h-2 w-full rounded-full" />
                                <div className="flex justify-between mt-1">
                                     <Skeleton className="h-3 w-8" />
                                     <Skeleton className="h-3 w-8" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    </main>
  )
}
