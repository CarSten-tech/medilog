'use client'

import { Pill, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/login/actions"
import type { User } from "@supabase/supabase-js"
import { SettingsDialog } from "@/components/dashboard/settings-dialog"

interface NavbarProps {
  user: User
  telegramChatId?: string | null
}

export function Navbar({ user, telegramChatId }: NavbarProps) {
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
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-600 hidden sm:inline-block mr-2">
              {user.email}
            </span>
            <SettingsDialog initialChatId={telegramChatId} />
            <form action={signOut}>
                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-red-600 cursor-pointer">
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Abmelden</span>
                </Button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  )
}
