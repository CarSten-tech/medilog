'use client'

import { Pill, LogOut, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/login/actions"
import type { User } from "@supabase/supabase-js"
import { PushNotificationManager } from "@/components/dashboard/push-notification-manager"

interface Patient {
    id: string
    full_name: string | null
    email: string | null
}

interface NavbarProps {
  user: User
  patients?: Patient[]
}

export function Navbar({ user, patients = [] }: NavbarProps) {
  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/dashboard" className="flex-shrink-0 flex items-center">
              <Pill className="h-8 w-8 text-teal-600 mr-2" />
              <span className="font-bold text-xl tracking-tight text-slate-900">MediLog</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/care" title="Care Team verwalten">
                <Button variant="ghost" size="sm" className="hidden sm:flex text-slate-500 hover:text-slate-900 cursor-pointer">
                    <Users className="h-5 w-5 mr-2" />
                    <span className="hidden lg:inline">Team</span>
                </Button>
            </Link>
             <span>
                <PushNotificationManager />
            </span>
            <span className="text-sm font-medium text-slate-600 hidden sm:inline-block">
              {user.email}
            </span>
            <form action={signOut}>
                <Button variant="outline" size="sm" className="bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-red-600 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="sr-only">Abmelden</span>
                </Button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  )
}
