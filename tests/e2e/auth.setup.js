import { test as setup } from '@playwright/test';

const authFile = 'tests/e2e/.auth/user.json';

// https://playwright.dev/docs/auth#basic-shared-account-in-all-tests
setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('Enter your email').fill('test@admin.com');
  await page.getByPlaceholder('Enter your password').fill('test@admin.com');
  await page.getByRole('button', { name: /login/i }).click();

  // Wait for redirect
  await page.waitForURL('/');

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
