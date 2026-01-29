'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Tabs Import
import { inviteCaregiverByEmail, removeCaregiver, respondToInvite, createInviteLink } from '@/app/actions/care';
import { toast } from 'sonner';
import { Loader2, Mail, Link as LinkIcon, Copy, UserX, Check, X, ShieldCheck } from 'lucide-react';

interface CaregiverManagerProps {
  myCaregivers: any[];
  pendingInvites: any[];
}

export default function CaregiverManager({ myCaregivers, pendingInvites }: CaregiverManagerProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  // E-Mail Invite
  const handleInvite = async () => {
    if (!email.includes('@')) { toast.error('Ungültige E-Mail'); return; }
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

  // Link Generieren
  const handleCreateLink = async () => {
      setLoading(true);
      const res = await createInviteLink();
      setLoading(false);
      
      if (res.error) {
          toast.error(res.error);
      } else if (res.token) {
          // URL zusammenbauen
          const url = `${window.location.origin}/invite/${res.token}`;
          setInviteLink(url);
          toast.success("Link erstellt!");
      }
  };

  // Link Kopieren
  const copyLink = () => {
      if(inviteLink) {
          navigator.clipboard.writeText(inviteLink);
          toast.success("In Zwischenablage kopiert!");
      }
  }

  // Restliche Handler (Remove, Respond) wie gehabt...
  const handleRemove = async (id: string) => { /* ... wie vorher ... */ await removeCaregiver(id); toast.success('Entfernt'); };
  const handleRespond = async (id: string, accept: boolean) => { /* ... wie vorher ... */ await respondToInvite(id, accept); toast.success('Erledigt'); };

  return (
    <div className="space-y-8">
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Betreuer einladen
          </CardTitle>
          <CardDescription>Wer darf deinen Vorrat sehen?</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="link" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="link">Per Link (Empfohlen)</TabsTrigger>
                    <TabsTrigger value="email">Per E-Mail</TabsTrigger>
                </TabsList>
                
                {/* TAB 1: Link (Der Profi Weg) */}
                <TabsContent value="link" className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg border border-dashed text-center">
                        {!inviteLink ? (
                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">Erstelle einen Link und sende ihn per WhatsApp, Signal oder Mail.</p>
                                <Button onClick={handleCreateLink} disabled={loading} variant="outline" className="border-emerald-200 text-emerald-700">
                                    <LinkIcon className="w-4 h-4 mr-2" /> Link generieren
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3 animate-in fade-in zoom-in">
                                <p className="text-sm font-medium text-emerald-700">Dein Einladungs-Link:</p>
                                <div className="flex items-center gap-2">
                                    <Input value={inviteLink} readOnly className="bg-white" />
                                    <Button size="icon" onClick={copyLink}><Copy className="w-4 h-4" /></Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Dieser Link ist 7 Tage gültig und kann einmal verwendet werden.</p>
                                <Button variant="link" size="sm" onClick={() => setInviteLink(null)} className="text-muted-foreground">Neuen Link erstellen</Button>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* TAB 2: E-Mail (Alt, aber sicher) */}
                <TabsContent value="email" className="space-y-4">
                     <div className="flex flex-col sm:flex-row gap-3">
                        <Input 
                            placeholder="max@muster.de" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Button onClick={handleInvite} disabled={loading}>
                           {loading ? <Loader2 className="animate-spin" /> : <Mail className="w-4 h-4 mr-2" />} Senden
                        </Button>
                     </div>
                     <p className="text-xs text-muted-foreground">
                        Hinweis: Du kannst max. 5 Einladungen pro Stunde versenden.
                     </p>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>

      {/* ... Hier drunter folgen wieder deine Listen (Pending Invites & My Caregivers) ... */}
      {/* ... Kopiere den unteren Teil aus deiner alten Datei einfach hier rein ... */}
       {pendingInvites.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
            {/* ... */}
            <CardHeader><CardTitle>Offene Anfragen</CardTitle></CardHeader>
            <CardContent>
                 {pendingInvites.map(invite => (
                     <div key={invite.id} className="flex justify-between p-2 mb-2 bg-white rounded border">
                        <span>{invite.patientName}</span>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleRespond(invite.id, true)}><Check className="w-4 h-4"/></Button>
                            <Button size="sm" variant="ghost" onClick={() => handleRespond(invite.id, false)}><X className="w-4 h-4"/></Button>
                        </div>
                     </div>
                 ))}
            </CardContent>
        </Card>
      )}

      {/* Meine Betreuer Liste */}
      <Card>
          <CardHeader><CardTitle>Meine Betreuer</CardTitle></CardHeader>
          <CardContent>
              {myCaregivers.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-3 border-b last:border-0">
                      <div>
                          <p className="font-medium">{c.full_name || 'Unbekannt'}</p>
                          <p className="text-xs text-muted-foreground">{c.status}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemove(c.id)}><UserX className="w-4 h-4 text-red-500"/></Button>
                  </div>
              ))}
          </CardContent>
      </Card>

    </div>
  );
}