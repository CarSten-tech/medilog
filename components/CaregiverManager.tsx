'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { inviteCaregiverByEmail, removeCaregiver, respondToInvite, createInviteLink } from '@/app/actions/care';
import { toast } from 'sonner';
import { 
    Loader2, 
    Mail, 
    Link as LinkIcon, 
    Copy, 
    UserX, 
    Check, 
    X, 
    ShieldCheck, 
    CheckCircle2, 
    Clock, 
    Users
} from 'lucide-react';

interface CaregiverManagerProps {
  myCaregivers: any[];    // Leute, die ICH eingeladen habe (Mein Team)
  pendingInvites: any[];  // Leute, die MICH betreuen wollen
}

export default function CaregiverManager({ myCaregivers, pendingInvites }: CaregiverManagerProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  // --- LOGIK: Einladen per E-Mail ---
  const handleInvite = async () => {
    if (!email.includes('@')) { toast.error('Bitte gültige E-Mail eingeben.'); return; }
    setLoading(true);
    try {
      const res = await inviteCaregiverByEmail(email);
      if (res.error) toast.error(res.error);
      else {
        toast.success(res.message);
        setEmail('');
      }
    } catch { toast.error('Fehler aufgetreten.'); }
    finally { setLoading(false); }
  };

  // --- LOGIK: Link erstellen ---
  const handleCreateLink = async () => {
      setLoading(true);
      const res = await createInviteLink();
      setLoading(false);
      
      if (res.error) {
          toast.error(res.error);
      } else if (res.token) {
          const url = `${window.location.origin}/invite/${res.token}`;
          setInviteLink(url);
          toast.success("Link erstellt!");
      }
  };

  // --- LOGIK: Link kopieren ---
  const copyLink = () => {
      if(inviteLink) {
          navigator.clipboard.writeText(inviteLink);
          toast.success("In die Zwischenablage kopiert!");
      }
  }

  // --- LOGIK: Entfernen & Antworten ---
  const handleRemove = async (id: string) => { 
      const res = await removeCaregiver(id); 
      if (res.error) toast.error(res.error); else toast.success('Verbindung getrennt.'); 
  };
  
  const handleRespond = async (id: string, accept: boolean) => { 
      const res = await respondToInvite(id, accept); 
      if (res.error) toast.error(res.error); else toast.success(accept ? 'Angenommen!' : 'Abgelehnt.'); 
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. SEKTION: Einladen */}
      <Card className="border-emerald-100 shadow-sm">
        <CardHeader className="bg-emerald-50/50 pb-4">
          <CardTitle className="flex items-center gap-2 text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Betreuer hinzufügen
          </CardTitle>
          <CardDescription>
            Lade Partner, Kinder oder Pflegekräfte ein, damit sie deinen Medikamenten-Vorrat sehen können.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
            <Tabs defaultValue="link" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="link">🔗 Per Link (Einfach)</TabsTrigger>
                    <TabsTrigger value="email">📧 Per E-Mail</TabsTrigger>
                </TabsList>
                
                {/* TAB: LINK */}
                <TabsContent value="link" className="space-y-4">
                    <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 text-center">
                        {!inviteLink ? (
                            <div className="space-y-4">
                                <div className="mx-auto bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm">
                                    <LinkIcon className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-slate-900">Einladungs-Link erstellen</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Teile diesen Link einfach per WhatsApp, Signal oder E-Mail.
                                    </p>
                                </div>
                                <Button onClick={handleCreateLink} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <LinkIcon className="w-4 h-4 mr-2" />} 
                                    Link generieren
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in zoom-in duration-300">
                                <p className="text-sm font-medium text-emerald-700">Dein persönlicher Einladungs-Link:</p>
                                <div className="flex items-center gap-2 max-w-md mx-auto">
                                    <Input value={inviteLink} readOnly className="bg-white text-center font-mono text-xs sm:text-sm" />
                                    <Button size="icon" onClick={copyLink} variant="outline" className="shrink-0">
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground bg-amber-50 text-amber-800 py-1 px-3 rounded-full inline-block">
                                    ⏳ Link ist 7 Tage gültig
                                </p>
                                <div>
                                    <Button variant="link" size="sm" onClick={() => setInviteLink(null)} className="text-muted-foreground text-xs h-auto p-0">
                                        Neuen Link erstellen
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* TAB: E-MAIL */}
                <TabsContent value="email" className="space-y-4">
                     <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="E-Mail Adresse (z.B. max@muster.de)" 
                                className="pl-9"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                            />
                        </div>
                        <Button onClick={handleInvite} disabled={loading}>
                           {loading ? <Loader2 className="animate-spin" /> : 'Senden'}
                        </Button>
                     </div>
                     <p className="text-xs text-muted-foreground">
                        ℹ️ Aus Datenschutzgründen wird nicht angezeigt, ob die E-Mail existiert.
                     </p>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>

      {/* 2. SEKTION: Offene Anfragen (Eingehend) */}
      {pendingInvites.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 shadow-sm overflow-hidden">
            <div className="h-1 bg-amber-400 w-full" />
            <CardHeader className="pb-3">
                <CardTitle className="text-amber-900 flex items-center gap-2 text-lg">
                    <Mail className="w-5 h-5" /> Offene Anfragen
                </CardTitle>
                <CardDescription className="text-amber-800/80">
                    Diese Personen möchten dich betreuen. Kennst du sie?
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
                 {pendingInvites.map(invite => (
                     <div key={invite.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-amber-100">
                                <AvatarFallback className="bg-amber-100 text-amber-700 font-bold">
                                    {invite.patientName.substring(0,2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-slate-900">{invite.patientName}</p>
                                <p className="text-xs text-muted-foreground">{invite.patientEmail}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="hover:bg-red-50 hover:text-red-600 hover:border-red-200" onClick={() => handleRespond(invite.id, false)}>
                                Ablehnen
                            </Button>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" onClick={() => handleRespond(invite.id, true)}>
                                <Check className="w-4 h-4 mr-1" /> Annehmen
                            </Button>
                        </div>
                     </div>
                 ))}
            </CardContent>
        </Card>
      )}

      {/* 3. SEKTION: Mein Team (Liste) */}
      <Card className="shadow-sm">
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-500" />
                  Mein Betreuungs-Team
              </CardTitle>
              <CardDescription>
                  Diese Personen haben Zugriff.
              </CardDescription>
          </CardHeader>
          <CardContent>
              {myCaregivers.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/50">
                      <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">Noch niemanden eingeladen.</p>
                      <p className="text-sm text-slate-400">Nutze den Link oben, um zu starten.</p>
                  </div>
              ) : (
                  <div className="grid gap-3">
                      {myCaregivers.map(c => {
                          const isAccepted = c.status === 'accepted';
                          return (
                            <div key={c.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isAccepted ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="flex items-center gap-4">
                                    {/* STATUS ICON (Der gewünschte Haken) */}
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${isAccepted ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                                        {isAccepted ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                    </div>
                                    
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-slate-900">
                                                {c.full_name || 'Unbekannt'}
                                            </p>
                                            {/* Status Badge */}
                                            {isAccepted ? (
                                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 h-5 hover:bg-emerald-100">
                                                    Aktiv
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-amber-600 border-amber-200 text-[10px] px-1.5 h-5 bg-amber-50">
                                                    Wartet...
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500">{c.email}</p>
                                    </div>
                                </div>
                                
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleRemove(c.id)}
                                >
                                    <UserX className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">Entfernen</span>
                                </Button>
                            </div>
                          );
                      })}
                  </div>
              )}
          </CardContent>
      </Card>
    </div>
  );
}