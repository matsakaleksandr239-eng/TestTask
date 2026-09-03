import { chromium } from '@playwright/test';
import { config as loadEnvFile } from 'dotenv';
import ENV, { assertEnv } from './env';

const authFile = '.auth/user.json';

async function globalSetup(): Promise<void> {
  loadEnvFile();
  assertEnv();

  // The app gates its routes on both a session cookie and a set of `auth.*` localStorage flags
  // set by its own login JS, so a raw API login isn't enough — log in once through the real UI
  // form and save the resulting storageState for reuse by every test.
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: ENV.BASE_URL });
  const page = await context.newPage();

  await page.goto('/login', { waitUntil: 'networkidle' });
  await page.getByRole('textbox', { name: 'email' }).fill(ENV.LOGIN_EMAIL);
  await page.getByRole('textbox', { name: 'password' }).fill(ENV.LOGIN_PASSWORD);
  await page.locator('form').getByRole('button', { name: 'Login' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'));

  await context.storageState({ path: authFile });
  await browser.close();
}

export default globalSetup;