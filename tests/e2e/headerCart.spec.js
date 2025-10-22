const { test, expect } = require('@playwright/test');

const logout = async (page) => {
    // Locate and click the Admin dropdown toggle
    const adminDropdown = page.locator('a.nav-link.dropdown-toggle', { hasText: 'Admin' });
    await expect(adminDropdown).toBeVisible();
    await adminDropdown.click();
    // Wait for dropdown menu to be visible
    const dropdownMenu = page.locator('.dropdown-menu').filter({ has: page.locator('a[href="/login"]') });
    await expect(dropdownMenu).toBeVisible();
    // Click the Logout link
    const logoutLink = page.locator('a.dropdown-item[href="/login"]', { hasText: 'Logout' });
    await expect(logoutLink).toBeVisible();
    await logoutLink.click();
    // Verify navigation to login page
    await expect(page).toHaveURL('/login');
    await expect(page).toHaveURL(/.*login.*/);
}

const login = async (page) => {
    await page.goto('/login');
    await page.getByPlaceholder('Enter your email').fill('admin@test.com');
    await page.getByPlaceholder('Enter your password').fill('admin123');
    await page.getByRole('button', { name: /login/i }).click();
    // Wait for redirect
    await page.waitForURL('/');
}

/**
 * Tests cart context and local storage across sessions and auth states.
 * - Homepage / Product Card 
 * - Cart Context / Page 
 * - Login / Logout 
 * - Header Cart Count 
 */
test.describe('Cart Persistence', () => {

    let productName = ''; // To store the name of the product we add

    test.beforeEach(async ({ page }) => {
        // Clear cart from local storage before each test for a clean state
        await page.goto('http://localhost:3000/');
        await page.evaluate(() => localStorage.removeItem('cart'));
    });

    test('should persist cart contents on page refresh and after login/logout', async ({ page }) => {
        await logout(page)
        // --- 1. Add item to cart as GUEST ---
        await page.goto('http://localhost:3000/');

        // Click "Add to Cart"
        const firstProduct = page.locator('.card').first();
        await firstProduct.waitFor({ state: 'visible' });
        productName = await firstProduct.locator('.card-title').first().textContent();
        await firstProduct.locator('button:text("ADD TO CART")').click();

        // Verify Header cart count updates
        await expect(
            page.locator('.nav-link[href="/cart"]').locator('..').locator('.ant-badge-count')
        ).toHaveText('1');
        // Verify cart page matches header cart count
        await page.goto('http://localhost:3000/cart');
        await expect(
            page.locator('.card.flex-row').filter({ hasText: productName })
        ).toBeVisible();

        // Verify header cart value persists on refresh
        await page.reload();
        await expect(
            page.locator('.card.flex-row').filter({ hasText: productName })
        ).toBeVisible();
        await expect(
            page.locator('li.nav-item').filter({ hasText: 'Cart' }).locator('.ant-badge-count')
        ).toHaveText('1');

        // Verify header cart value persists on login
        await login(page);
        await page.goto('http://localhost:3000/cart');
        await expect(
            page.locator('.card.flex-row').filter({ hasText: productName })
        ).toBeVisible();
        await expect(
            page.locator('li.nav-item').filter({ hasText: 'Cart' }).locator('.ant-badge-count')
        ).toHaveText('1');

        // Verify header cart value persists on logout
        await logout(page);
        await page.goto('http://localhost:3000/cart');
        await expect(
            page.locator('.card.flex-row').filter({ hasText: productName })
        ).toBeVisible();
        await expect(
            page.locator('li.nav-item').filter({ hasText: 'Cart' }).locator('.ant-badge-count')
        ).toHaveText('1');
    });
});