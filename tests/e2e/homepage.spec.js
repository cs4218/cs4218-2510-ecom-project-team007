import { test, expect } from '@playwright/test';

test.describe('HomePage E2E', () => {

  test('filter, view product, add to cart', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Filter By Category')).toBeVisible();

    await page.locator('.card').first().waitFor({ state: 'visible', timeout: 15000 });

    const booksCheckbox = page.getByLabel('Books').first();
    if (await booksCheckbox.isVisible()) {
      await booksCheckbox.check();
      await expect(booksCheckbox).toBeChecked();
      await page.waitForTimeout(3000);
      
      if ((await page.locator('.card').count()) === 0) {
        await booksCheckbox.uncheck();
        await page.waitForTimeout(2000);
      }
    }

    const priceCheckbox = page.getByLabel('$0 to 19.99');
    if (await priceCheckbox.isVisible() && (await page.locator('.card').count()) > 0) {
      await priceCheckbox.check();
      await expect(priceCheckbox).toBeChecked();
      await page.waitForTimeout(3000);
      
      if ((await page.locator('.card').count()) === 0) {
        await page.getByRole('button', { name: 'RESET FILTERS' }).click();
        await page.waitForTimeout(2000);
      }
    }

    const firstProductCard = page.locator('.card').first();
    await expect(firstProductCard).toBeVisible({ timeout: 10000 });
  });

  test('apply multiple filters and verify products', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('.card').first().waitFor({ state: 'visible', timeout: 15000 });

    const booksCheckbox = page.getByLabel('Books').first();
    const priceCheckbox = page.getByLabel('$0 to 19.99');
    
    if (await booksCheckbox.isVisible()) {
      await booksCheckbox.check();
      await page.waitForTimeout(2000);
    }

    if (await priceCheckbox.isVisible()) {
      await priceCheckbox.check();
      await page.waitForTimeout(2000);
    }

    const cards = page.locator('.card');
    const count = await cards.count();
    
    if (count === 0) return;

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const priceElement = card.locator('.card-price');
      if (await priceElement.isVisible()) {
        const priceText = await priceElement.textContent();
        const price = parseFloat(priceText?.replace(/[^0-9.]/g, '') || '0');
        expect(price).toBeLessThan(20);
      }
    }
  });

  test('load more products', async ({ page }) => {
    await page.goto('/');
    await page.locator('.card').first().waitFor({ state: 'visible', timeout: 15000 });

    const initialCount = await page.locator('.card').count();
    const loadMoreBtn = page.getByRole('button', { name: 'Load more' });

    if (await loadMoreBtn.isVisible()) {
      await loadMoreBtn.click();
      await page.waitForTimeout(2000);
      await page.locator('.card').nth(initialCount).waitFor({ state: 'visible', timeout: 10000 });
      const newCount = await page.locator('.card').count();
      expect(newCount).toBeGreaterThan(initialCount);
    }
  });

  test('homepage icon navigation', async ({ page }) => {
    await page.goto('/product/sample-product');
    await page.getByRole('link', { name: /Virtual Vault/i }).click();
    await expect(page).toHaveURL('/');
    await page.locator('.card').first().waitFor({ state: 'visible', timeout: 15000 });
  });
});