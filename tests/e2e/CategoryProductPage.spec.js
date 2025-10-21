import { test, expect } from '@playwright/test';

test('Category Product Page', async ({ page }) => {
  await page.goto('/');

  // should be accessible from home page
  await page.getByRole('link', { name: 'Categories' }).click();
  await expect(page.getByRole('link', { name: 'testcategory' })).toBeVisible();
  await page.getByRole('link', { name: 'testcategory' }).click();

  // should only show 6 products at most on initial load
  await expect(page.getByRole('main')).toContainText('Product 1');
  await expect(page.getByRole('main')).toContainText('Product 2');
  await expect(page.getByRole('main')).toContainText('Product 3');
  await expect(page.getByRole('main')).toContainText('Product 4');
  await expect(page.getByRole('main')).toContainText('Product 5');
  await expect(page.getByRole('main')).toContainText('Product 6');

  await expect(page.getByRole('main')).not.toContainText('Product 7');
  await expect(page.getByRole('main')).not.toContainText('Product 8');
  await expect(page.getByRole('main')).not.toContainText('Product 9');

  // should see the "Load more" button
  await expect(page.getByRole('button', { name: 'Load more' })).toBeVisible();
  await page.getByRole('button', { name: 'Load more' }).click();

  // should show the remaining 3 products as well
  await expect(page.getByRole('main')).toContainText('Product 1');
  await expect(page.getByRole('main')).toContainText('Product 2');
  await expect(page.getByRole('main')).toContainText('Product 3');
  await expect(page.getByRole('main')).toContainText('Product 4');
  await expect(page.getByRole('main')).toContainText('Product 5');
  await expect(page.getByRole('main')).toContainText('Product 6');
  await expect(page.getByRole('main')).toContainText('Product 7');
  await expect(page.getByRole('main')).toContainText('Product 8');
  await expect(page.getByRole('main')).toContainText('Product 9');

  // should not have "Load more" button since fully loaded
  await expect(page.getByRole('button', { name: 'Load more' })).not.toBeVisible();
});