import { test, expect } from '@playwright/test';

test.describe('Basis Checks', () => {
  
  test('Startseite soll laden', async ({ page }) => {
    // 1. Gehe zur Startseite
    await page.goto('/');

    // 2. Prüfe, ob der Titel stimmt (Passe 'MediLog' an deinen echten Titel an)
    await expect(page).toHaveTitle(/MediLog/);

    // 3. Prüfe, ob ein wichtiger Button da ist (z.B. "Login" oder "Los gehts")
    // Suche nach einem Link oder Button, der 'Login' oder 'Anmelden' heißt
    const loginButton = page.getByRole('link', { name: /Login|Anmelden/i });
    
    // Er muss sichtbar sein (falls du einen hast)
    // Falls nicht, checke einfach ob die H1 Überschrift da ist:
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Login Seite ist erreichbar', async ({ page }) => {
    await page.goto('/login');
    
    // Prüfe, ob das Email-Feld da ist
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    
    // Prüfe, ob der Submit Button da ist
    await expect(page.getByRole('button', { name: /Login|Anmelden/i })).toBeVisible();
  });

});