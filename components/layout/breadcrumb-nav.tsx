'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Fragment } from 'react'

const ROUTE_LABELS: Record<string, string> = {
  'dashboard': 'Dashboard',
  'care': 'Care Team',
  'settings': 'Einstellungen',
  'medications': 'Medikamente',
  'schedule': 'Zeitplan',
  'add': 'Hinzufügen',
  'reports': 'Berichte'
}

export function BreadcrumbNav() {
  const pathname = usePathname()
  
  // Split path into segments, remove empty strings
  const segments = pathname.split('/').filter(Boolean)

  // If we are just at root or dashboard, maybe simplified view
  // But allow full path usually.
  
  if (segments.length === 0) return null

  return (
    <div className="px-4 md:px-8 py-2 md:py-4">
        <Breadcrumb>
        <BreadcrumbList>
            <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />

            {segments.map((segment, index) => {
                // Determine path for this segment
                const isLast = index === segments.length - 1
                const href = `/${segments.slice(0, index + 1).join('/')}`
                
                // Format label: look up in map, or capitalize, or show ID if likely UUID
                let label = ROUTE_LABELS[segment] || segment
                
                // Simple heuristic for UUIDs or numeric IDs -> "Details" or similar?
                // Or just show truncated ID?
                if (segment.length > 20 && !ROUTE_LABELS[segment]) {
                    label = "Details"
                } else if (!ROUTE_LABELS[segment]) {
                    // Capitalize first letter
                    label = segment.charAt(0).toUpperCase() + segment.slice(1)
                }

                return (
                    <Fragment key={href}>
                        <BreadcrumbItem>
                            {isLast ? (
                                <BreadcrumbPage>{label}</BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                        {!isLast && <BreadcrumbSeparator />}
                    </Fragment>
                )
            })}
        </BreadcrumbList>
        </Breadcrumb>
    </div>
  )
}
