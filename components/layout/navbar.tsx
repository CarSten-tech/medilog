'use client'

import { PushNotificationManager } from "@/components/dashboard/push-notification-manager"

// ... imports

          <div className="flex items-center space-x-4">
             <span className="hidden md:inline-block">
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
