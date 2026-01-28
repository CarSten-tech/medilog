'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PushSubscriptionManager from '@/components/PushSubscriptionManager'
import { Button } from '@/components/ui/button'
import { sendNotificationToUser } from '@/app/actions/push'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Send, Smartphone } from 'lucide-react'

export default function DebugPage() {
    const [sending, setSending] = useState(false)

    async function handleTestSend() {
        setSending(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            
            if(!user) throw new Error("Nicht eingeloggt")

            const res = await sendNotificationToUser(
                user.id,
                "Test aus dem All 🛰️",
                "Wenn du das liest, funktioniert das Enterprise Push System!",
                "/dashboard/debug"
            )

            if (res.error) {
                toast.error(res.error)
            } else {
                // Type narrowing: if no error, we assume success object
                if ((res.sent || 0) > 0) {
                    toast.success(`${res.sent} Gerät(e) erreicht!`)
                } else {
                    toast.warning("Keine Geräte erreicht (aber kein Fehler).")
                }
            }
        } catch (e) {
            console.error(e)
            toast.error("Test fehlgeschlagen")
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="p-6 max-w-lg mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Push System Status 📡</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-teal-600" />
                        Geräte-Verwaltung
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <PushSubscriptionManager />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Send className="w-5 h-5 text-blue-600" />
                        Funktions-Test
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Button 
                        onClick={handleTestSend} 
                        disabled={sending} 
                        className="w-full"
                    >
                        {sending ? "Sende..." : "Test-Nachricht an MICH senden"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                        Sendet eine Nachricht an alle deine registrierten Geräte.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
