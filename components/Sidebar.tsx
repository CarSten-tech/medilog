'use client'

import { cn } from '@/lib/utils'
import { LayoutDashboard, Pill, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/login/actions'
import { Button } from '@/components/ui/button'

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Medications',
    href: '/dashboard/medications',
    icon: Pill,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 border-r bg-white flex flex-col h-screen sticky top-0 left-0">
      <div className="h-16 flex items-center px-6 border-b">
        <Pill className="h-6 w-6 text-teal-600 mr-2" />
        <span className="font-bold text-lg tracking-tight">MedPlanner</span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-teal-50 text-teal-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-teal-600" : "text-slate-400")} />
            <span>{item.title}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        <form action={signOut}>
            <Button
                variant="ghost"
                className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
            >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
            </Button>
        </form>
      </div>
    </div>
  )
}
