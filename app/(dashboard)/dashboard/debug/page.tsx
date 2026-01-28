'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import PushManager from '@/components/PushManager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { sendNotificationToUser } from '@/app/actions/push'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client' // Use client-side auth check for ID

export default function DebugPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>('Bereit')

  async function handleTestPush() {
    setLoading(true)
    setStatus('Sende Anfrage...')

    try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
            setStatus('Nicht eingeloggt')
            return
        }

        const res = await sendNotificationToUser(
            user.id, 
            "Test-Alarm 🔔", 
            "Dies ist eine manuelle Test-Nachricht. Das System funktioniert!"
        )

        if (res.error) {
            setStatus('Fehler: ' + res.error)
            toast.error(res.error)
        } else {
            console.log("Push Result:", res)
            setStatus('Gesendet! Prüfe deine Mitteilungszentrale.')
            toast.success("Push gesendet")
        }
    } catch (e) {
        setStatus('Exception: ' + e)
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader>
            <CardTitle>Push Debugging 🐞</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="p-4 bg-gray-100 rounded text-sm font-mono break-all">
                Status: {status}
            </div>
            <Button onClick={handleTestPush} disabled={loading} className="w-full">
                {loading ? 'Sende...' : 'Sende Test-Push Jetzt'}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
                HINWEIS: Wenn dies funktioniert, aber der Automatik-Alarm nicht, liegt es daran, dass der "Silent Mode" (Tag 0-3) aktiv ist.
            </p>
            
            <hr className="my-4" />
            <div className="space-y-2">
                <h3 className="font-medium text-sm">Abo-Verwaltung:</h3>
                <PushManager />
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
