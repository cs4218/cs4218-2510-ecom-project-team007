import { test, expect } from '@playwright/test';

test('Complete payment for first item in cart', async ({ page }) => {
  // Go to homepage
  await page.goto('/');
  await page.waitForSelector('.card', { timeout: 10000 });

  // Add first product to cart
  const firstProduct = page.locator('.card').first();
  await firstProduct.getByRole('button', { name: /ADD TO CART/i }).click();

  // Wait for toast notification
  await expect(page.locator('text=Item Added to cart')).toBeVisible({ timeout: 5000 });

  // Go to cart page
  await page.goto('/cart');
  await page.waitForLoadState('networkidle');

  // Wait for Braintree Drop-in container to load
  await page.waitForSelector('.braintree-dropin', { timeout: 15000 });

  // Click "Card" payment option if multiple options exist
  const cardPaymentButton = page.locator('div[aria-label="Paying with Card"]').first();
  const isCardButtonVisible = await cardPaymentButton.isVisible().catch(() => false);
  if (isCardButtonVisible) {
    await cardPaymentButton.click();
    await page.waitForTimeout(500);
  }

  // Compute expiry date = today + 5 years
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear() + 5).slice(-2);
  const expiry = `${month}/${year}`;

  // Fill card number
  const numberFrame = page.frameLocator('iframe#braintree-hosted-field-number');
  await numberFrame.locator('input#credit-card-number').waitFor({ state: 'visible', timeout: 5000 });
  await numberFrame.locator('input#credit-card-number').fill('4111111111111111');

  // Fill expiration
  const expirationFrame = page.frameLocator('iframe#braintree-hosted-field-expirationDate');
  await expirationFrame.locator('input#expiration').waitFor({ state: 'visible', timeout: 5000 });
  await expirationFrame.locator('input#expiration').fill(expiry);

  // Fill CVV
  const cvvFrame = page.frameLocator('iframe#braintree-hosted-field-cvv');
  await cvvFrame.locator('input#cvv').waitFor({ state: 'visible', timeout: 5000 });
  await cvvFrame.locator('input#cvv').fill('123');

  // Click "Make Payment"
  const paymentButton = page.getByRole('button', { name: /Make Payment/i });

  // Verify button is enabled
  const isDisabled = await paymentButton.isDisabled();
  if (isDisabled) {
    throw new Error('Payment button is disabled - check if address is set');
  }

  await paymentButton.click();

  // Wait for redirect to orders page
  await page.waitForURL('/dashboard/user/orders', { timeout: 20000 });

  // Verify success toast
  await expect(page.locator('text=Payment Completed Successfully')).toBeVisible({ timeout: 5000 });
});
