'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { inviteCaregiverByEmail, removeCaregiver, removePatient, respondToInvite, createInviteLink } from '@/app/actions/care';
import { toast } from 'sonner';
import { 
    Loader2, 
    Mail, 
    Link as LinkIcon, 
    Copy, 
    UserX, 
    Check, 
    ShieldCheck, 
    CheckCircle2, 
    Clock, 
    Users,
    ArrowRight,
    RefreshCw,
    HeartHandshake
} from 'lucide-react';

interface CaregiverManagerProps {
  myCaregivers: any[];    // Leute, die ICH eingeladen habe (Mein Team)
  pendingInvites: any[];  // Leute, die MICH betreuen wollen
  myPatients: any[];      // NEU: Leute, die ICH betreue
}

export default function CaregiverManager({ myCaregivers, pendingInvites, myPatients }: CaregiverManagerProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  // State für das Lösch-Modal (Wir speichern ID und TYP)
  const [deleteData, setDeleteData] = useState<{ id: string, type: 'caregiver' | 'patient' } | null>(null);

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
          if (inviteLink) {
              toast.success("Ein neuer Link wurde generiert!");
          } else {
              toast.success("Link erstellt! Du kannst ihn jetzt teilen.");
          }
      }
  };

  // --- LOGIK: Link kopieren ---
  const copyLink = () => {
      if(inviteLink) {
          navigator.clipboard.writeText(inviteLink);
          toast.success("Link erfolgreich in die Zwischenablage kopiert!");
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
      }
  }

  // --- LOGIK: Entfernen (Startet Modal) ---
  const confirmRemove = (id: string, type: 'caregiver' | 'patient') => {
      setDeleteData({ id, type });
  }

  // --- LOGIK: Entfernen (Ausgeführt) ---
  const executeRemove = async () => {
      if (!deleteData) return;
      
      let res;
      if (deleteData.type === 'caregiver') {
          res = await removeCaregiver(deleteData.id);
      } else {
          // NEU: Patient entfernen
          res = await removePatient(deleteData.id);
      }

      if (res.error) {
          toast.error(res.error);
      } else {
          toast.success('Verbindung erfolgreich getrennt.'); 
      }
      setDeleteData(null); // Modal schließen
  };
  
  const handleRespond = async (id: string, accept: boolean) => { 
      const res = await respondToInvite(id, accept); 
      if (res.error) toast.error(res.error); else toast.success(accept ? 'Angenommen!' : 'Abgelehnt.'); 
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. SEKTION: Einladen */}
      <Card className="border-emerald-100 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500 w-full" />
        <CardHeader className="bg-emerald-50/30 pb-4">
          <CardTitle className="flex items-center gap-2 text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Betreuer hinzufügen
          </CardTitle>
          <CardDescription>
            Gib vertrauten Personen (Partner, Familie, Pflege) Zugriff auf deinen Status.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
            <Tabs defaultValue="link" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="link" className="cursor-pointer data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-900">
                        🔗 Per Link (Einfach)
                    </TabsTrigger>
                    <TabsTrigger value="email" className="cursor-pointer data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-900">
                        📧 Per E-Mail
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="link" className="space-y-4">
                    <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 text-center transition-all hover:border-emerald-200">
                        {!inviteLink ? (
                            <div className="space-y-4">
                                <div className="mx-auto bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm border border-emerald-100">
                                    <LinkIcon className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-slate-900">Einladungs-Link erstellen</h3>
                                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                                        Der schnellste Weg. Sende den Link einfach per WhatsApp, Signal oder Mail an deine Vertrauensperson.
                                    </p>
                                </div>
                                <Button onClick={handleCreateLink} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <LinkIcon className="w-4 h-4 mr-2" />} 
                                    Link jetzt generieren
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in zoom-in duration-300">
                                <p className="text-sm font-medium text-emerald-800">Dein persönlicher Einladungs-Link:</p>
                                
                                <div className="flex items-center gap-2 max-w-md mx-auto relative group">
                                    <Input 
                                        value={inviteLink} 
                                        readOnly 
                                        className="bg-white text-center font-mono text-xs sm:text-sm pr-10 border-emerald-200 focus-visible:ring-emerald-500" 
                                    />
                                    <Button 
                                        size="icon" 
                                        onClick={copyLink} 
                                        variant={isCopied ? "default" : "outline"}
                                        className={`shrink-0 transition-all duration-300 ${isCopied ? 'bg-emerald-600 border-emerald-600 text-white scale-110' : 'hover:bg-emerald-50 hover:text-emerald-700'}`}
                                    >
                                        {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>

                                <div className="flex flex-col items-center gap-2">
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                        ⏳ Link ist 7 Tage gültig
                                    </Badge>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={handleCreateLink} 
                                        disabled={loading}
                                        className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 text-xs h-auto p-2"
                                    >
                                        {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <RefreshCw className="w-3 h-3 mr-1" />}
                                        Neuen Link generieren
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="email" className="space-y-4">
                     <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="E-Mail Adresse (z.B. anna@beispiel.de)" 
                                className="pl-9"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                            />
                        </div>
                        <Button onClick={handleInvite} disabled={loading} className="bg-slate-900 text-white hover:bg-slate-800">
                           {loading ? <Loader2 className="animate-spin" /> : <span className="flex items-center">Senden <ArrowRight className="ml-2 w-4 h-4"/></span>}
                        </Button>
                     </div>
                     <p className="text-xs text-slate-500 bg-slate-100 p-2 rounded border border-slate-200 inline-block">
                        🛡️ <strong>Datenschutz-Hinweis:</strong> Wir zeigen nicht an, ob die E-Mail bei uns registriert ist.
                     </p>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>

      {/* 2. SEKTION: Offene Anfragen (Eingehend) */}
      {pendingInvites.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 shadow-sm overflow-hidden animate-in slide-in-from-left-2">
            <div className="h-1 bg-amber-400 w-full" />
            <CardHeader className="pb-3">
                <CardTitle className="text-amber-900 flex items-center gap-2 text-lg">
                    <Mail className="w-5 h-5" /> Offene Anfragen
                </CardTitle>
                <CardDescription className="text-amber-800/80">
                    Diese Personen möchten Zugriff auf deine Daten. Kennst du sie?
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
                 {pendingInvites.map(invite => (
                     <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-xl border border-amber-100 shadow-sm gap-4">
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
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button size="sm" variant="outline" className="flex-1 sm:flex-none hover:bg-red-50 hover:text-red-600 hover:border-red-200" onClick={() => handleRespond(invite.id, false)}>
                                Ablehnen
                            </Button>
                            <Button size="sm" className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" onClick={() => handleRespond(invite.id, true)}>
                                <Check className="w-4 h-4 mr-1" /> Annehmen
                            </Button>
                        </div>
                     </div>
                 ))}
            </CardContent>
        </Card>
      )}

      {/* 3. SEKTION: Mein Team (Leute die MICH sehen) */}
      <Card className="shadow-sm border-slate-200">
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-500" />
                  Mein Team (Betreuer)
              </CardTitle>
              <CardDescription>
                  Diese Personen haben Zugriff auf **deine** Daten.
              </CardDescription>
          </CardHeader>
          <CardContent>
              {myCaregivers.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/30">
                      <p className="text-slate-500 font-medium text-sm">Niemand sieht deine Daten.</p>
                  </div>
              ) : (
                  <div className="grid gap-3">
                      {myCaregivers.map(c => {
                          const isAccepted = c.status === 'accepted';
                          return (
                            <div key={c.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isAccepted ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${isAccepted ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                                        {isAccepted ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-slate-900">{c.full_name || 'Unbekannt'}</p>
                                            {isAccepted ? (
                                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 h-5 hover:bg-emerald-100 border-0">Aktiv</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-amber-600 border-amber-200 text-[10px] px-1.5 h-5 bg-amber-50">Wartet...</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500">{c.email}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600 hover:bg-red-50 hover:shadow-sm"
                                    onClick={() => confirmRemove(c.id, 'caregiver')}>
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

      {/* 4. NEUE SEKTION: Wen betreue ICH? */}
      <Card className="shadow-sm border-indigo-100 bg-indigo-50/30">
          <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                  <HeartHandshake className="w-5 h-5 text-indigo-600" />
                  Betreute Personen
              </CardTitle>
              <CardDescription>
                  Du hast Zugriff auf die Daten dieser Personen.
              </CardDescription>
          </CardHeader>
          <CardContent>
              {myPatients.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-xl border-2 border-dashed border-indigo-100 bg-white/50">
                      <p className="text-slate-500 font-medium text-sm">Du betreust aktuell niemanden.</p>
                      <p className="text-xs text-slate-400 mt-1">Lass dich per Link einladen, um hier zu erscheinen.</p>
                  </div>
              ) : (
                  <div className="grid gap-3">
                      {myPatients.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-indigo-100 bg-white shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10 border-2 border-indigo-100">
                                        <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                                            {p.patientName.substring(0,2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-slate-900">{p.patientName}</p>
                                        <p className="text-sm text-slate-500">{p.patientEmail}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => confirmRemove(p.id, 'patient')}>
                                    <UserX className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">Beenden</span>
                                </Button>
                            </div>
                      ))}
                  </div>
              )}
          </CardContent>
      </Card>

      {/* LÖSCH-MODAL (Sicherheitsabfrage) */}
      <AlertDialog open={!!deleteData} onOpenChange={(open) => !open && setDeleteData(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Bist du sicher?</AlertDialogTitle>
                <AlertDialogDescription>
                    {deleteData?.type === 'caregiver' 
                        ? "Diese Person verliert sofort den Zugriff auf deine Daten." 
                        : "Du verlierst sofort den Zugriff auf die Daten dieser Person."}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={executeRemove} className="bg-red-600 hover:bg-red-700 text-white">
                    Ja, Verbindung trennen
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}