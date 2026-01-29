'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { updateProfile, updateThresholds, deleteAccount } from '@/app/actions/settings';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loader2, User, Bell, ShieldAlert, Save, Trash2 } from 'lucide-react';
import PushSubscriptionManager from '@/components/PushSubscriptionManager';

interface SettingsProps {
    initialSettings: any;
}

export default function SettingsManager({ initialSettings }: SettingsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // State: Profil
  const [fullName, setFullName] = useState(initialSettings?.full_name || '');

  // State: Grenzwerte
  const [lowStock, setLowStock] = useState(initialSettings?.settings_low_stock_days || 10);
  const [expiry, setExpiry] = useState(initialSettings?.settings_expiry_warning_days || 30);
  const [checkup, setCheckup] = useState(initialSettings?.settings_checkup_lead_days || 30);

  // State: Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // --- HANDLER: Profil ---
  const handleSaveProfile = async () => {
      setLoading(true);
      const res = await updateProfile(fullName);
      setLoading(false);
      if(res.error) {
          toast.error(res.error);
      } else {
          toast.success("Profil aktualisiert!");
          router.refresh();
      }
  };

  // --- HANDLER: Grenzwerte ---
  const handleSaveThresholds = async () => {
      setLoading(true);
      const res = await updateThresholds(lowStock, expiry, checkup);
      setLoading(false);
      if(res.error) {
          toast.error(res.error);
      } else {
          toast.success("Einstellungen gespeichert!");
          router.refresh();
      }
  };

  // --- HANDLER: Account Löschen ---
  const handleDeleteAccount = async () => {
      setLoading(true);
      const res = await deleteAccount();
      
      if(res?.error) {
          setLoading(false);
          setShowDeleteModal(false);
          toast.error(res.error);
      } else {
          toast.success("Account gelöscht. Auf Wiedersehen!");
          router.push('/');
          router.refresh();
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="profile" className="cursor-pointer"><User className="w-4 h-4 mr-2"/> Profil</TabsTrigger>
                <TabsTrigger value="notifications" className="cursor-pointer"><Bell className="w-4 h-4 mr-2"/> Warnungen</TabsTrigger>
                <TabsTrigger value="danger" className="cursor-pointer text-red-600 data-[state=active]:text-red-700 data-[state=active]:bg-red-50"><ShieldAlert className="w-4 h-4 mr-2"/> Account</TabsTrigger>
            </TabsList>

            {/* TAB 1: PROFIL */}
            <TabsContent value="profile">
                <Card>
                    <CardHeader>
                        <CardTitle>Dein Profil</CardTitle>
                        <CardDescription>Wie möchtest du in der App und bei Betreuern heißen?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email-static">E-Mail Adresse</Label>
                            <Input 
                                id="email-static" 
                                value={initialSettings?.email} 
                                disabled 
                                className="bg-slate-100 text-slate-500" 
                                placeholder="deine@email.de"
                            />
                            <p className="text-xs text-muted-foreground">E-Mail kann nicht geändert werden.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="full-name">Angezeigter Name</Label>
                            <Input 
                                id="full-name"
                                value={fullName} 
                                onChange={(e) => setFullName(e.target.value)} 
                                placeholder="Max Mustermann" 
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50/50 flex justify-end">
                        <Button onClick={handleSaveProfile} disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                            Speichern
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            {/* TAB 2: BENACHRICHTIGUNGEN */}
            <TabsContent value="notifications" className="space-y-6">
                
                {/* 1. Push Buttons */}
                <Card>
                    <CardHeader>
                        <CardTitle>Geräte & Push</CardTitle>
                        <CardDescription>Aktiviere Benachrichtigungen auf diesem Gerät.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PushSubscriptionManager />
                    </CardContent>
                </Card>

                {/* 2. Regler */}
                <Card>
                    <CardHeader>
                        <CardTitle>Wann soll gewarnt werden?</CardTitle>
                        <CardDescription>Stelle ein, wie viele Tage im Voraus du erinnert werden willst.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 py-6">
                        
                        {/* Regel: Bestand */}
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label htmlFor="range-stock" className="font-semibold">Niedriger Bestand</Label>
                                <span className="text-sm font-mono bg-emerald-100 text-emerald-800 px-2 rounded">ab {lowStock} Tagen</span>
                            </div>
                            <input 
                                id="range-stock"
                                type="range" min="3" max="30" step="1" 
                                value={lowStock} onChange={(e) => setLowStock(parseInt(e.target.value))}
                                className="w-full accent-emerald-600 cursor-pointer"
                                aria-label="Schwellenwert für niedrigen Bestand einstellen"
                            />
                            <p className="text-xs text-muted-foreground">Wenn der Vorrat für weniger als {lowStock} Tage reicht.</p>
                        </div>

                        {/* Regel: Ablauf */}
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label htmlFor="range-expiry" className="font-semibold">Ablaufdatum</Label>
                                <span className="text-sm font-mono bg-amber-100 text-amber-800 px-2 rounded">ab {expiry} Tagen</span>
                            </div>
                            <input 
                                id="range-expiry"
                                type="range" min="7" max="90" step="1" 
                                value={expiry} onChange={(e) => setExpiry(parseInt(e.target.value))}
                                className="w-full accent-amber-500 cursor-pointer"
                                aria-label="Warnzeitraum vor Ablaufdatum einstellen"
                            />
                            <p className="text-xs text-muted-foreground">Bevor ein Medikament abläuft.</p>
                        </div>

                        {/* Regel: Vorsorge */}
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label htmlFor="range-checkup" className="font-semibold">Vorsorge-Termine</Label>
                                <span className="text-sm font-mono bg-blue-100 text-blue-800 px-2 rounded">ab {checkup} Tagen</span>
                            </div>
                            <input 
                                id="range-checkup"
                                type="range" min="7" max="60" step="1" 
                                value={checkup} onChange={(e) => setCheckup(parseInt(e.target.value))}
                                className="w-full accent-blue-500 cursor-pointer"
                                aria-label="Erinnerungszeitraum für Vorsorgetermine einstellen"
                            />
                            <p className="text-xs text-muted-foreground">Erinnerung vor dem Fälligkeitsdatum.</p>
                        </div>

                    </CardContent>
                    <CardFooter className="bg-slate-50/50 flex justify-end">
                        <Button onClick={handleSaveThresholds} disabled={loading} className="bg-slate-900 text-white">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                            Regeln speichern
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            {/* TAB 3: DANGER ZONE */}
            <TabsContent value="danger">
                <Card className="border-red-200 shadow-sm">
                    <CardHeader className="bg-red-50/50">
                        <CardTitle className="text-red-700 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5"/> Gefahrenzone
                        </CardTitle>
                        <CardDescription>
                            Diese Aktionen können nicht rückgängig gemacht werden.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between p-4 border border-red-100 rounded-lg bg-white">
                            <div>
                                <h4 className="font-semibold text-slate-900">Account löschen</h4>
                                <p className="text-sm text-slate-500">Löscht alle deine Daten, Medikamente und Verbindungen.</p>
                            </div>
                            <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Löschen
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        {/* DELETE MODAL */}
        <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-600">Bist du absolut sicher?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Diese Aktion löscht deinen Account **unwiderruflich**. 
                        Alle deine Medikamente, Protokolle und Verbindungen zu Betreuern werden sofort entfernt.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700 text-white">
                        {loading ? <Loader2 className="animate-spin"/> : 'Ja, Account unwiderruflich löschen'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </div>
  );
}