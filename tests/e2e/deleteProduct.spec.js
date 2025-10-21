import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  // go to dashboard -> create category
  await page.getByRole('button', { name: 'test' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();

  // create a new category 
  await page.getByRole('link', { name: 'Create Category' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('Games');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Games created successfully')).toBeVisible();

  // create a new product
  await page.getByRole('link', { name: 'Create Product' }).click();
  await page.locator('#rc_select_0').click();
  await page.getByTitle('Games').locator('div').click();
  await page.getByRole('textbox', { name: 'Enter product name' }).click();
  await page.getByRole('textbox', { name: 'Enter product name' }).fill('Elden Ring - Nightreign');
  await page.getByRole('textbox', { name: 'Enter product description' }).click();
  await page.getByRole('textbox', { name: 'Enter product description' }).fill('Physical copy of the PC game "Elden Ring - Nightreign".');
  await page.getByPlaceholder('Enter price').click();
  await page.getByPlaceholder('Enter price').fill('58.99');
  await page.getByPlaceholder('Enter quantity').click();
  await page.getByPlaceholder('Enter quantity').fill('4');
  await page.locator('#rc_select_1').click();
  await page.getByText('Yes').click();
  await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
  await expect(page.getByText('Product created successfully')).toBeVisible();

  // verify that the new product is created
  await expect(page.getByRole('main')).toContainText('Elden Ring - Nightreign');
  
  // delete the product
  await page.locator('a', { hasText: 'Elden Ring - Nightreign' }).click();
  await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();

  // check that product is no longer visible at admin dashboard and homepage
  await expect(page.getByText("Elden Ring - Nightreign")).not.toBeVisible();
  await page.getByRole('link', { name: 'Home' }).click();
  await expect(page.getByText("Elden Ring - Nightreign")).not.toBeVisible();

  // check that other users cannot see the deleted product as well
  await page.getByRole('button', { name: 'test' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('link', { name: 'Home' }).click();
  await expect(page.getByText("Elden Ring - Nightreign")).not.toBeVisible();
});
