import { login, signup, signInWithGoogle } from './login/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pill } from 'lucide-react'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string, error?: string }> }) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 flex flex-col items-center text-center pb-2">
          <div className="bg-teal-50 p-3 rounded-xl mb-4">
            <Pill className="h-8 w-8 text-teal-600" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">MediLog</CardTitle>
          <CardDescription>
            Verwalten Sie Ihren Medikamentenbestand
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@beispiel.de"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Passwort</Label>
                <a href="#" className="text-xs text-teal-600 hover:text-teal-700 font-medium cursor-pointer">
                  Passwort vergessen?
                </a>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Passwort eingeben"
                required
                className="h-11"
              />
            </div>
            <div className="pt-2">
              <Button formAction={login} className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-medium cursor-pointer">
                Anmelden
              </Button>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Oder</span>
            </div>
          </div>

          <form action={signInWithGoogle}>
            <Button variant="outline" type="submit" className="w-full h-11 font-medium bg-white text-slate-700 border-slate-200 cursor-pointer">
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
              Mit Google fortfahren
            </Button>
          </form>
          
          {params?.error && (
            <p className="text-sm text-red-500 text-center">{params.error}</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-4 pt-2 pb-8">
            <p className="text-xs text-center text-muted-foreground">
                Powered by Open Source Security
            </p>
        </CardFooter>
      </Card>
      
      <div className="fixed bottom-6 flex space-x-6 text-xs text-slate-500 font-medium">
        <a href="#" className="hover:text-slate-800 cursor-pointer">Datenschutz</a>
        <a href="#" className="hover:text-slate-800 cursor-pointer">Nutzungsbedingungen</a>
        <a href="#" className="hover:text-slate-800 cursor-pointer">Hilfe</a>
      </div>
    </div>
  )
}
