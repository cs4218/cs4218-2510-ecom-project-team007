const { test, expect } = require('@playwright/test');

/**
 * - Admin View Users Page
 * - Private Routes / Auth Middleware
 */
test.describe('Unauthenticated Route Protection', () => {
    test.use({ storageState: { cookies: [], origins: [] } }); // No auth

    test('should protect admin routes from unauthenticated users', async ({ page }) => {
        await page.goto('http://localhost:3000/dashboard/admin');
        await expect(page).toHaveURL(/.*login/);

        await page.goto('http://localhost:3000/dashboard/admin/users');
        await expect(page).toHaveURL(/.*login/);
    });
});
