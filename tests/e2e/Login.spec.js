import { test, expect } from '@playwright/test';

test('Admin Dashboard - Login, Product Management, and Logout', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('button', { name: 'test' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();

  await page.getByRole('link', { name: 'Login' }).click();
  // wrong password should throw error
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@admin.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('fake');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await expect(page.getByText('Invalid Password')).toBeVisible();
  
  // Login with correct password
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test@admin.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await expect(page.getByText('🙏login successfully')).toBeVisible();
  
  await page.waitForTimeout(1000);
  
  await page.getByRole('button', { name: 'Test' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  
  // create a category for the product
  await page.getByRole('link', { name: 'Create Category' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('test created successfully')).toBeVisible();

  
  // create a product
  await page.getByRole('link', { name: 'Create Product' }).click();

  const categoryDropdown = page.locator('.ant-select-selector').first();
  await categoryDropdown.waitFor({ state: 'visible', timeout: 1000 });
  await categoryDropdown.click();
  await page.waitForTimeout(500);
  await page.locator('.ant-select-item-option-content:has-text("test")').click();

  await page.getByRole('textbox', { name: 'Enter product name' }).fill('test');
  await page.getByRole('textbox', { name: 'Enter product description' }).fill('test');
  await page.getByPlaceholder('Enter price').fill('2');
  await page.getByPlaceholder('Enter quantity').fill('2');
  await page.locator('.mb-3 > .ant-select').click();
  await page.getByText('No').click();
  await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
  await expect(page.getByText('Product Created Successfully')).toBeVisible();
  
  // Verify product appears in product list
  const productTitle = page.locator('h5.card-title', { hasText: 'test' });
  await expect(productTitle).toBeVisible();
  
  // Verify product appears on home page
  await page.getByRole('link', { name: '🛒 Virtual Vault' }).click();
  // Verify product card exists with name and price
  const productCard = page.locator('.card', {
    hasText: 'test'
  }).filter({
    hasText: '$2.00'
  });

  await expect(productCard.first()).toBeVisible();
  
  // can delete products
  await page.getByRole('button', { name: 'Test' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Products' }).click();
  await page.getByRole('link', { name: 'test' }).click();
  
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });

  await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();
  await page.locator('.ant-modal-confirm-btns button.ant-btn-dangerous', { hasText: 'Delete' }).click();
  await page.waitForTimeout(3000);
  
  await page.getByRole('link', { name: '🛒 Virtual Vault' }).click();
  const testProducts = page.locator('.card:has-text("test")');

  // Assert that there are zero such products
  await expect(testProducts).toHaveCount(0);
});