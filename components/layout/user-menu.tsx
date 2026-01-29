'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Menu, LogOut, Users, Bug, Calendar } from "lucide-react"
import { signOut } from "@/app/login/actions"
import Link from "next/link"

interface UserMenuProps {
    email: string
}

export function UserMenu({ email }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="sm:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menü öffnen</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Mein Account</p>
                <p className="text-xs leading-none text-muted-foreground">
                    {email}
                </p>
            </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
            <Link href="/dashboard/care" className="cursor-pointer w-full flex items-center">
                <Users className="mr-2 h-4 w-4" />
                <span>Care Team</span>
            </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
            <Link href="/dashboard/checkups" className="cursor-pointer w-full flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <span>Vorsorge</span>
            </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        

        <DropdownMenuItem asChild>
            <Link href="/dashboard/debug" className="cursor-pointer w-full flex items-center">
                <Bug className="mr-2 h-4 w-4" />
                <span>System Status</span>
            </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
            <form action={signOut} className="w-full">
                <button type="submit" className="w-full flex items-center text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Abmelden</span>
                </button>
            </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
