import { createClient } from '@/utils/supabase/server'
import { getInviteDetails } from '@/app/actions/care'
import InviteConfirmation from '@/components/InviteConfirmation'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { XCircle, ArrowRight } from 'lucide-react'

// WICHTIG: params ist ein Promise in Next.js 16!
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Wenn nicht eingeloggt -> Redirect zum Login (Link merken)
  if (!user) {
    redirect(`/login?next=/invite/${token}`)
  }

  // 2. Daten laden (Link prüfen, aber noch NICHT einlösen!)
  const details = await getInviteDetails(token)

  // 3. Fehler-Fall (Link kaputt/abgelaufen)
  if (details.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <Card className="max-w-md w-full text-center shadow-lg border-red-100">
            <CardHeader>
              <div className="mx-auto mb-4 bg-red-50 p-3 rounded-full w-fit">
                 <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <CardTitle className="text-red-900">Ungültiger Link</CardTitle>
              <CardDescription className="text-red-700/80">
                {details.error}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link href="/dashboard">
                  Zum Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
  }

  // 4. Erfolgs-Fall: Wir zeigen die Entscheidungs-Box
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 bg-[url('/grid.svg')]">
        <InviteConfirmation 
            token={token} 
            inviterName={details.inviterName!} 
            inviterEmail={details.inviterEmail!} 
        />
    </div>
  )
}