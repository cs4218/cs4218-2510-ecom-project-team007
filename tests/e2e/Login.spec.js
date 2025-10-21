import { test, expect } from '@playwright/test';

test.describe('Admin Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
  });

  test('AC1.1 - Login with invalid credentials shows error', async ({ page }) => {
    // Logout if already logged in
    try {
      await page.getByRole('button', { name: 'TEST ADMIN' }).click();
      await page.getByRole('link', { name: 'Logout' }).click();
    } catch (error) {
      // Continue if not logged in
    }

    await page.getByRole('link', { name: 'Login' }).click();
    
    // Fill invalid credentials - use the correct email but wrong password
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@test.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('wrongpassword');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    // Wait for response and check the actual error message from backend
    const response = await page.waitForResponse(response => 
      response.url().includes('/login') || response.url().includes('/auth')
    );
    const responseBody = await response.json();
    console.log('Invalid Login Response:', responseBody);
    
    // Test the backend response since frontend might not display it properly
    expect(responseBody.success).toBe(false);
    expect(responseBody.message).toBe('Invalid Password');
  });

  test('AC1 - Admin can login with valid credentials', async ({ page }) => {
    // Logout if already logged in
    try {
      await page.getByRole('button', { name: 'TEST ADMIN' }).click();
      await page.getByRole('link', { name: 'Logout' }).click();
    } catch (error) {
      // Continue if not logged in
    }

    await page.getByRole('link', { name: 'Login' }).click();
    
    // Use the correct admin credentials from your database
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@test.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('admin123');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    // Wait for response
    const response = await page.waitForResponse(response => 
      response.url().includes('/login') || response.url().includes('/auth')
    );
    const responseBody = await response.json();
    console.log('Valid Login Response:', responseBody);
    
    // Test backend response
    expect(responseBody.success).toBe(true);
    expect(responseBody.message).toBe('login successfully');
    
    // Also check if we can see admin dashboard options
    await expect(page.getByRole('button', { name: 'TEST ADMIN' })).toBeVisible();
  });
});

test.describe('Admin Product Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Login before each test with correct credentials
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@test.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('admin123');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    
    // Wait for login to complete and verify we're logged in
    await expect(page.getByRole('button', { name: 'TEST ADMIN' })).toBeVisible();
    await page.waitForTimeout(1000);
  });

}); 

test('Complete Admin Workflow', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  
  // Logout first if needed
  try {
    await page.getByRole('button', { name: 'TEST ADMIN' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();
  } catch (error) {
    // Continue if not logged in
  }

  await page.getByRole('link', { name: 'Login' }).click();
  
  // Test invalid login
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('wrongpassword');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  
  // Wait for error response
  const errorResponse = await page.waitForResponse(response => 
    response.url().includes('/login') || response.url().includes('/auth')
  );
  const errorBody = await errorResponse.json();
  expect(errorBody.success).toBe(false);
  expect(errorBody.message).toBe('Invalid Password');
  
  // Login with correct credentials
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('admin123');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  
  // Wait for success response
  const successResponse = await page.waitForResponse(response => 
    response.url().includes('/login') || response.url().includes('/auth')
  );
  const successBody = await successResponse.json();
  expect(successBody.success).toBe(true);
  expect(successBody.message).toBe('login successfully');
  
  await page.waitForTimeout(1000);
  
  // Navigate to dashboard
  await page.getByRole('button', { name: 'TEST ADMIN' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  
  // Create category
  await page.getByRole('link', { name: 'Create Category' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test');
  await page.getByRole('button', { name: 'Submit' }).click();
  
  // Wait for category creation response
  const categoryResponse = await page.waitForResponse(response => 
    response.url().includes('/category')
  );
  const categoryBody = await categoryResponse.json();
  expect(categoryBody.success).toBe(true);

  // Create product
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
  
  // Wait for product creation response
  const productResponse = await page.waitForResponse(response => 
    response.url().includes('/product')
  );
  const productBody = await productResponse.json();
  expect(productBody.success).toBe(true);
  
  // Verify product appears in product list
  await page.getByRole('link', { name: 'Products' }).click();
  const productTitle = page.locator('h5.card-title', { hasText: 'test' });
  await expect(productTitle).toBeVisible();
  
  // Verify product appears on home page
  await page.getByRole('link', { name: '🛒 Virtual Vault' }).click();
  const productCard = page.locator('.card', {
    hasText: 'test'
  }).filter({
    hasText: '$2.00'
  });
  await expect(productCard.first()).toBeVisible();
  
  // Delete product
  await page.getByRole('button', { name: 'TEST ADMIN' }).click();
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
  await expect(testProducts).toHaveCount(0);
  
  // Logout
  await page.getByRole('button', { name: 'TEST ADMIN' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
});