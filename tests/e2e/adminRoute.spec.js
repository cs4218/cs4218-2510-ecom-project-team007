const { test, expect } = require('@playwright/test');

test.describe('Admin Route Authentication', () => {
    test('should allow admin to view the list of users', async ({ page }) => {
        await page.goto('http://localhost:3000/dashboard/admin/users');
        await expect(page).toHaveURL('http://localhost:3000/dashboard/admin/users');
        // Verify the list contains at least the admin user
        await expect(page.locator('text="admin@test.com"')).toBeVisible();
    });
})
