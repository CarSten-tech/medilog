import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

/**
 * 🔥 WICHTIG: .env.local laden
 * Das muss VOR 'defineConfig' passieren, damit process.env gefüllt ist.
 */
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

export default defineConfig({
  testDir: './tests',
  /* Alle Tests parallel laufen lassen */
  fullyParallel: true,
  /* Kein "only" in CI erlauben */
  forbidOnly: !!process.env.CI,
  /* Retry im CI 2x, lokal 0x */
  retries: process.env.CI ? 2 : 0,
  /* Workers: Im CI 1, lokal alle Kerne nutzen */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter: HTML für schöne Übersicht */
  reporter: 'html',

  use: {
    /* * Basis-URL auf deinen Port 3001 setzen.
     * Das spart dir im Test 'await page.goto("http://localhost:3001/login")'
     * Du schreibst nur noch 'await page.goto("/login")'
     */
    baseURL: 'http://localhost:3001',

    /* Trace aufnehmen, wenn ein Test fehlschlägt (Gold wert beim Debuggen!) */
    trace: 'on-first-retry',
  },

  /* * WebServer Config:
   * Playwright startet deine App automatisch, falls sie noch nicht läuft.
   */
  webServer: {
    command: 'npm run dev -- -p 3001', // Startet Next.js auf Port 3001
    url: 'http://localhost:3001',
    reuseExistingServer: true, // Wenn du 'npm run dev' schon offen hast, nimmt er das!
    timeout: 120 * 1000, // 2 Minuten Zeit zum Hochfahren geben
  },

  projects: [
    /* Desktop Chrome */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    /* Mobile Safari (iPhone) - Wichtig für deine App! */
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});