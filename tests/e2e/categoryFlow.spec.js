import { test, expect } from '@playwright/test';

/**
 * Tests the full admin-to-public lifecycle.
 * - Admin Login
 * - Admin Dashboard
 * - Create Category
 * - Public Categories Page
 */
test.describe('Category CRUD Lifecycle', () => {
    const newCategoryName = "Specials";

    test('should allow admin to create, view, and delete a category', async ({ page }) => {
        await page.goto('http://localhost:3000/dashboard/admin/create-category');
        /**
         * / Verify category creation
         */
        await page.locator('input[placeholder="Enter new category"]').fill(newCategoryName);
        await page.locator('button[type="submit"]:text("Submit")').click();
        // Verify created in create categories page
        await expect(page.locator('table td', { hasText: newCategoryName })).toBeVisible();
        // Verify visible to all users
        await page.goto('http://localhost:3000/categories');
        await expect(page.getByRole('link', { name: newCategoryName })).toBeVisible();

        // Verify category deletion
        await page.goto('http://localhost:3000/dashboard/admin/create-category');
        const categoryRow = page.locator('li, tr', { hasText: newCategoryName });
        await categoryRow.locator('button:text("Delete")').click();
        // Verify confirmation modal shows
        const confirmModal = page.locator('.ant-modal-content');
        await expect(confirmModal).toBeVisible();
        await confirmModal.locator('button:has(span:text("Delete"))').click();
        await expect(confirmModal).not.toBeVisible();
        // Verify deleted in create categories page
        await expect(page.locator('table td', { hasText: newCategoryName })).not.toBeVisible();
        // Verify not visible to all users
        await page.goto('http://localhost:3000/categories');
        await expect(page.getByRole('link', { name: newCategoryName })).not.toBeVisible();
    });
});