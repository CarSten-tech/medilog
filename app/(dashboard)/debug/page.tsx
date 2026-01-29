"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { triggerStockCheck } from "@/app/actions/debug"
import { toast } from "sonner"
import { Bug, Play, CheckCircle, AlertTriangle, Loader2 } from "lucide-react"

export default function DebugPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function handleTrigger() {
    setIsLoading(true)
    setResult(null)
    try {
        const res = await triggerStockCheck()
        setResult(res)
        if (res.success) {
            toast.success("Cronjob erfolgreich ausgeführt!")
        } else {
            toast.error("Fehler beim Ausführen")
        }
    } catch (e: any) {
        toast.error("Unbekannter Fehler")
        setResult({ error: e.message })
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
         <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Bug className="h-8 w-8 text-slate-600" />
            System Status & Debug
         </h1>
         <p className="text-slate-500 text-lg">
            Diagnose-Tools für Admin und Entwickler.
         </p>
      </div>

      <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-blue-600" />
                    Manuelle Benachrichtigungs-Prüfung
                </CardTitle>
                <CardDescription>
                    Triggered den "Täglichen Check" manuell. Prüft Lagerbestand, Ablaufdatum und Vorsorge-Termine.
                    Sendet Push-Nachrichten an betroffene Nutzer.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleTrigger} disabled={isLoading} className="gap-2 cursor-pointer">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    Jetzt ausführen
                </Button>

                {result && (
                    <div className="mt-6 p-4 bg-slate-950 text-slate-50 rounded-md font-mono text-sm overflow-x-auto">
                        <pre>{JSON.stringify(result, null, 2)}</pre>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Placeholder for more debug tools later */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    System Gesundheit
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-md border border-green-200">
                    <CheckCircle className="h-4 w-4" />
                    <span>Alle Systeme operational.</span>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
