'use client'

import { useState, useEffect } from 'react'
import { inviteCaregiverById, removeCaregiver, searchUsers } from '@/app/actions/care'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Trash2, UserPlus, Check, ChevronsUpDown, ShieldAlert, Search } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Caregiver {
    id: string
    caregiver_id: string
    email: string
    full_name?: string
    status: 'pending' | 'accepted'
}

interface CaregiverManagerProps {
    caregivers: Caregiver[]
}

export function CaregiverManager({ caregivers }: CaregiverManagerProps) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<any[]>([])
    const [searching, setSearching] = useState(false)
    const [selectedUser, setSelectedUser] = useState<string | null>(null)
    const [isInviting, setIsInviting] = useState(false)
    const [isRemoving, setIsRemoving] = useState<string | null>(null)

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults([])
            return
        }
        
        const timer = setTimeout(async () => {
            setSearching(true)
            const users = await searchUsers(query)
            setResults(users)
            setSearching(false)
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    const handleInvite = async (userId: string) => {
        setIsInviting(true)
        try {
            const result = await inviteCaregiverById(userId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Einladung gesendet!')
                setOpen(false)
                setQuery("")
            }
        } finally {
            setIsInviting(false)
        }
    }

    const handleRemove = async (id: string) => {
        setIsRemoving(id)
        const result = await removeCaregiver(id)
        setIsRemoving(null)

        if (result.error) toast.error(result.error)
        else toast.success('Entfernt.')
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-teal-600" />
                    Betreuer Zugriff
                </CardTitle>
                <CardDescription>
                    Suche nach registrierten Benutzern, um ihnen Zugriff zu geben.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {/* Search / Invite Box */}
                <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-slate-700">Neuen Betreuer hinzufügen</label>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between"
                        >
                          {query ? query : "Name oder E-Mail suchen..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput 
                            placeholder="Tippe zum Suchen..." 
                            value={query}
                            onValueChange={setQuery}
                          />
                          <CommandList>
                            {searching && (
                                <div className="py-6 text-center text-sm text-slate-500">
                                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                    Suche läuft...
                                </div>
                            )}
                            {!searching && query.length >= 2 && results.length === 0 && (
                                <CommandEmpty>Keine Benutzer gefunden.</CommandEmpty>
                            )}
                            {!searching && query.length < 2 && (
                                <div className="py-4 text-center text-xs text-slate-400">
                                    Gib mindestens 2 Zeichen ein.
                                </div>
                            )}
                            
                            <CommandGroup heading="Gefundene Benutzer">
                                {results.map((user) => (
                                    <CommandItem
                                      key={user.id}
                                      value={user.id}
                                      onSelect={() => handleInvite(user.id)}
                                      disabled={isInviting}
                                    >
                                      <div className="flex flex-col">
                                          <span className="font-medium">{user.full_name || 'Unbekannt'}</span>
                                          <span className="text-xs text-slate-500">{user.email}</span>
                                      </div>
                                      {isInviting && selectedUser === user.id ? (
                                           <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                                      ) : (
                                           <UserPlus className="ml-auto h-4 w-4 opacity-50" />
                                      )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                </div>

                {/* List */}
                <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wider">
                        Berechtigte Personen
                    </h3>
                    
                    <div className="space-y-3">
                        {caregivers.length === 0 && (
                            <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-lg border border-dashed">
                                <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Niemand hat aktuell Zugriff.</p>
                            </div>
                        )}

                        {caregivers.map((c) => (
                            <div key={c.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-slate-900">{c.full_name || c.email}</span>
                                    {c.full_name && <span className="text-xs text-slate-500">{c.email}</span>}
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant={c.status === 'accepted' ? 'default' : 'secondary'} 
                                               className={c.status === 'accepted' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'}>
                                            {c.status === 'accepted' ? 'Aktiv' : 'Wartet auf Annahme'}
                                        </Badge>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleRemove(c.id)}
                                    disabled={!!isRemoving}
                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                >
                                    {isRemoving === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
