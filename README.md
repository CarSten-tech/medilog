💊 MediLog
MediLog ist eine moderne, webbasierte Anwendung zum Management von Medikamenten, Vorsorgeuntersuchungen und Pflege-Teams. Sie hilft Patienten und deren Angehörigen (Care-Teams), den Überblick über Medikamentenvorräte, Ablaufdaten und wichtige Arzttermine zu behalten.

Die App ist als PWA (Progressive Web App) konzipiert, voll responsive und setzt auf Supabase als Backend-as-a-Service für Echtzeit-Datenbanken, Authentifizierung und Edge Functions.

✨ Features
📦 Medikamenten-Management
Bestandsverfolgung: Automatische Berechnung der Restreichweite basierend auf Dosierung und Packungsgröße.

Ablauf-Warnungen: Frühzeitige Hinweise, bevor Medikamente ablaufen.

Smarte Ampel-Logik: Visuelle Indikatoren (Grün/Gelb/Rot) für den Status von Medikamenten.

📅 Vorsorge & Termine
Checkup-Tracker: Verwaltung von wiederkehrenden Arztterminen (z.B. Zahnarzt, Krebsvorsorge).

Erinnerungen: Automatische Berechnung des nächsten Fälligkeitsdatums basierend auf Intervallen (z.B. alle 6 Monate).

🤝 Care Team & Sharing
Betreuer einladen: Patienten können Familienmitglieder oder Pflegekräfte via sicherem Einladungs-Link oder E-Mail hinzufügen.

Rollen-basiert:

Patient: Verwaltet seine eigenen Daten.

Betreuer: Hat Lese- (und teilweise Schreib-)Zugriff auf die Daten des Patienten, um Unterstützung zu leisten.

Einladungs-Management: Übersicht über gesendete und erhaltene Einladungen.

🔔 Benachrichtigungen & PWA
Push Notifications: Browser-basierte Benachrichtigungen bei kritischem Bestand oder fälligen Terminen (Web Push API).

Offline-Support: Dank Service Worker auch bei schlechter Verbindung nutzbar.

Installierbar: Kann wie eine native App auf iOS und Android installiert werden.

⚙️ Einstellungen & Datenschutz
Personalisierung: Nutzer können individuelle Schwellenwerte für Warnungen festlegen (z.B. "Warne mich 10 Tage vorher").

DSGVO-Konform: Vollständige Kontrolle über die Daten, inkl. "Account löschen"-Funktion (Recht auf Vergessenwerden).

🛠 Tech Stack
Frontend: Next.js 14+ (App Router), React, TypeScript

Styling: Tailwind CSS, Shadcn/UI (Komponenten)

Icons: Lucide React

Backend / DB: Supabase (PostgreSQL, Auth, Realtime)

Serverless: Supabase Edge Functions (Deno) für Cron-Jobs und komplexe Logik.

Testing: Playwright (E2E Testing)

Deployment: Vercel (Frontend), Supabase (Backend)

🚀 Installation & Setup
Voraussetzungen
Node.js 18+

Ein Supabase-Account

Git

1. Repository klonen
Bash
git clone https://github.com/DEIN_USERNAME/medilog.git
cd medilog
2. Abhängigkeiten installieren
Bash
npm install
3. Umgebungsvariablen konfigurieren
Erstelle eine .env.local Datei im Hauptverzeichnis und fülle sie mit deinen Supabase- und VAPID-Daten:

Code-Snippet
# Supabase Konfiguration
NEXT_PUBLIC_SUPABASE_URL=https://dein-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
SUPABASE_SERVICE_ROLE_KEY=dein-service-role-key # Nur für Server-Side Admin Aufgaben

# Web Push Konfiguration (VAPID Keys generieren via: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=dein-public-key
VAPID_PRIVATE_KEY=dein-private-key
VAPID_SUBJECT=mailto:admin@deinedomain.de
4. Datenbank aufsetzen
Führe die SQL-Skripte im Supabase SQL Editor aus, um die Tabellen und Security Policies (RLS) zu erstellen. Die wichtigsten Dateien findest du unter:

supabase/schema.sql (Basis-Schema)

supabase/migrations/*.sql (Erweiterungen für Checkups, Push, etc.)

5. Entwicklungsserver starten
Bash
npm run dev
Die App ist nun unter http://localhost:3000 erreichbar.

🤖 Supabase Edge Functions (Cron Jobs)
MediLog nutzt Edge Functions für Hintergrundaufgaben (z.B. tägliche Prüfung auf niedrige Bestände).

Supabase CLI installieren:

Bash
npm install -g supabase
Einloggen:

Bash
supabase login
Funktionen deployen:

Bash
npx supabase functions deploy cron-stock-alert --no-verify-jwt
(Wiederhole dies für andere Funktionen wie siri-refill falls benötigt)

Cron-Job aktivieren: Dies geschieht meist automatisch über die pg_cron Extension in Supabase oder kann im Dashboard unter "Edge Functions" konfiguriert werden.

🧪 Testing
Das Projekt nutzt Playwright für End-to-End Tests.

Tests ausführen:

Bash
npx playwright test
Test-Report anzeigen:

Bash
npx playwright show-report
📱 PWA Assets generieren
Um Splash-Screens für iOS zu generieren, nutze das beiliegende Skript (benötigt pwa-asset-generator):

Bash
node scripts/generate-splash.mjs
🛡 Sicherheit
Row Level Security (RLS): Alle Datenbankabfragen sind durch RLS geschützt. Nutzer sehen nur ihre eigenen Daten oder die Daten, für die sie explizit als Caregiver autorisiert wurden.

Secure Tokens: Einladungen nutzen kryptografisch sichere Tokens.

Environment Variables: Sensible Keys (wie Private Keys) werden nur serverseitig verwendet.

📄 Lizenz
Dieses Projekt ist unter der MIT Lizenz veröffentlicht. Siehe LICENSE für Details.

Entwickelt mit ❤️ für bessere Gesundheit.
