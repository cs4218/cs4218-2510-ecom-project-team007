import { test, expect } from '@playwright/test';

test('Admin Dashboard - Login, Product Management, and Logout', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  

  await page.getByRole('link', { name: 'Login' }).click();
  // wrong password should throw error
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@admin.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('fake');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await expect(page.locator('div').filter({ hasText: /^Invalid Password$/ }).nth(2)).toBeVisible();
  
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
  await expect(page.locator('div').filter({ hasText: /^test created successfully$/ }).nth(2)).toBeVisible();
  
  // create a product
  await page.getByRole('link', { name: 'Create Product' }).click();

  const categoryDropdown = page.locator('.ant-select-selector').first();
  await categoryDropdown.waitFor({ state: 'visible', timeout: 10000 });
  await categoryDropdown.click();
  await page.waitForTimeout(500);
  await page.locator('.ant-select-item-option-content:has-text("test")').click();

  await page.getByRole('textbox', { name: 'write a name' }).fill('test');
  await page.getByRole('textbox', { name: 'write a description' }).fill('test');
  await page.getByPlaceholder('write a Price').fill('2');
  await page.getByPlaceholder('write a quantity').fill('2');
  await page.locator('.mb-3 > .ant-select').click();
  await page.getByText('No').click();
  await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
  await expect(page.locator('div').filter({ hasText: /^Product Created Successfully$/ }).nth(1)).toBeVisible();
  
  // Verify product appears in product list
  await expect(page.getByRole('link', { name: 'test test test' })).toBeVisible();
  
  // Verify product appears on home page
  await page.getByRole('link', { name: '🛒 Virtual Vault' }).click();
  await expect(page.locator('div').filter({ hasText: /^test\$2\.00test\.\.\.More DetailsADD TO CART$/ }).first()).toBeVisible();
  
  // can delete products
  await page.getByRole('button', { name: 'Test' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Products' }).click();
  await page.getByRole('link', { name: 'test test test' }).click();
  
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();
  
  await page.getByRole('link', { name: '🛒 Virtual Vault' }).click();
  await expect(page.getByRole('main')).toMatchAriaSnapshot(`
    - img "test"
    - heading "test" [level=5]
    - heading /\\$\\d+\\.\\d+/ [level=5]
    - paragraph: test...
    - button "More Details"
    - button "ADD TO CART"
    - img "NUS T-shirt"
    - heading "NUS T-shirt" [level=5]
    - heading /\\$\\d+\\.\\d+/ [level=5]
    - paragraph: Plain NUS T-shirt for sale...
    - button "More Details"
    - button "ADD TO CART"
    - img "Novel"
    - heading "Novel" [level=5]
    - heading /\\$\\d+\\.\\d+/ [level=5]
    - paragraph: A bestselling novel...
    - button "More Details"
    - button "ADD TO CART"
    - img "The Law of Contract in Singapore"
    - heading "The Law of Contract in Singapore" [level=5]
    - heading /\\$\\d+\\.\\d+/ [level=5]
    - paragraph: A bestselling book in Singapore...
    - button "More Details"
    - button "ADD TO CART"
    - img "Smartphone"
    - heading "Smartphone" [level=5]
    - heading /\\$\\d+\\.\\d+/ [level=5]
    - paragraph: A high-end smartphone...
    - button "More Details"
    - button "ADD TO CART"
    - img "Laptop"
    - heading "Laptop" [level=5]
    - heading /\\$\\d+,\\d+\\.\\d+/ [level=5]
    - paragraph: A powerful laptop...
    - button "More Details"
    - button "ADD TO CART"
    `);
});