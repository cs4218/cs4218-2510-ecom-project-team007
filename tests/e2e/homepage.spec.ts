import { test, expect } from '@playwright/test';

test('HomePage: filter, view product, add to cart', async ({ page }) => {
    await page.goto('/');

    // Wait for products and filters
    await page.waitForSelector('.card');
    await page.waitForSelector('.filters');

    // Apply first category filter
    const firstCategory = page.locator('.filters input[type="checkbox"]').first();
    await firstCategory.check();
    await page.waitForTimeout(500);

    // Apply first price filter
    const firstPrice = page.locator('.filters input[type="radio"]').first();
    await firstPrice.check();
    await page.waitForTimeout(500);

    // Click first product to see details
    const firstProduct = page.locator('.card').first();
    const productName = await firstProduct.locator('h5.card-title:not(.card-price)').textContent();
    if (!productName) throw new Error('Product name missing');

    await firstProduct.locator('img').click();
    await expect(page).toHaveURL(/\/product\//);

    // Go back home
    await page.goBack();
    await page.waitForSelector('.card');

    // Add first product to cart
    const addBtn = page.locator('.card').first().locator('button', { hasText: 'ADD TO CART' });
    await addBtn.click();

    // Check cart in localStorage
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'));
    expect(cart.length).toBeGreaterThan(0);
    expect(cart[0].name).toBe(productName.trim());

    // Reset filters
    const resetBtn = page.locator('.btn-danger', { hasText: 'RESET FILTERS' });
    await resetBtn.click();
    expect(await firstCategory.isChecked()).toBe(false);
});
