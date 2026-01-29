import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {

  test('Ein echter User kann sich einloggen', async ({ page }) => {
    // 1. Daten aus der .env holen (Fail-Safe: Fehler werfen, wenn sie fehlen)
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      throw new Error('⚠️ Bitte TEST_USER_EMAIL und TEST_USER_PASSWORD in .env.local setzen!');
    }

    // 2. Auf die Login-Seite gehen
    await page.goto('/login');

    // 3. Formular ausfüllen
    // Wir suchen die Felder nach ihrem Label oder Placeholder
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    // 4. Absenden (Button klicken)
    // Suche nach dem Button, der "Anmelden" oder "Login" heißt
    await page.click('button[type="submit"]');

    // 5. WICHTIG: Warten & Prüfen
    // Nach dem Login sollte man auf dem Dashboard landen.
    // Wir warten, bis die URL "/dashboard" enthält.
    await expect(page).toHaveURL(/.*dashboard/);

    // Zusatz-Check: Ist der User-Name oder "Meine Medikamente" sichtbar?
    // Das beweist, dass die Datenbank-Daten geladen wurden.
    await expect(page.getByText('Meine Medikamente')).toBeVisible();
  });

});