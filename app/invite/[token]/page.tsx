import { createClient } from '@/utils/supabase/server'
import { acceptInviteLink } from '@/app/actions/care'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle } from 'lucide-react'

// WICHTIG für Next.js 16: params ist ein Promise!
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  
  // 1. Das Promise auflösen (await params)
  const { token } = await params
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Wenn nicht eingeloggt -> Zum Login schicken, aber Token merken!
  if (!user) {
    redirect(`/login?next=/invite/${token}`)
  }

  // 3. Wir versuchen direkt, den Invite anzunehmen
  const result = await acceptInviteLink(token)

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 bg-white p-3 rounded-full shadow-sm w-fit">
             {result.success ? (
                 <CheckCircle2 className="w-12 h-12 text-emerald-500" />
             ) : (
                 <XCircle className="w-12 h-12 text-red-500" />
             )}
          </div>
          <CardTitle>
            {result.success ? 'Verbindung hergestellt!' : 'Das hat leider nicht geklappt'}
          </CardTitle>
          <CardDescription>
            {result.success 
              ? 'Du bist jetzt als Betreuer eingetragen.' 
              : result.error || 'Der Link ist ungültig oder abgelaufen.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full" variant={result.success ? "default" : "secondary"}>
            <Link href="/dashboard/care">
              Zum Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}