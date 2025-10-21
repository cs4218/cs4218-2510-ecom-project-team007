import { test, expect } from '@playwright/test';

test('Users can view the contact and policy page with relevant infomation', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  // ensure that logged in users can also view the contact and policy pages
  await page.getByRole('link', { name: 'Contact' }).click();
  await expect(page.getByText(': www.help@ecommerceapp.com')).toBeVisible();
  await expect(page.getByText(': 012-3456789')).toBeVisible();
  await expect(page.getByText(': 1800-0000-0000 (toll free)')).toBeVisible();

  await page.getByRole('link', { name: 'Privacy Policy' }).click();
  await expect(page.getByRole('heading', { name: 'PRIVACY POLICY' })).toBeVisible();
  await expect(page.getByText('Your privacy is important to us.')).toBeVisible();

  // ensure that users that have not logged in can still view the contact and policy pages
  await page.getByRole('button', { name: 'test' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();

  await page.getByRole('link', { name: 'Contact' }).click();
  await expect(page.getByText(': www.help@ecommerceapp.com')).toBeVisible();
  await expect(page.getByText(': 012-3456789')).toBeVisible();
  await expect(page.getByText(': 1800-0000-0000 (toll free)')).toBeVisible();

  await page.getByRole('link', { name: 'Privacy Policy' }).click();
  await expect(page.getByRole('heading', { name: 'PRIVACY POLICY' })).toBeVisible();
  await expect(page.getByText('Your privacy is important to us.')).toBeVisible();
});
