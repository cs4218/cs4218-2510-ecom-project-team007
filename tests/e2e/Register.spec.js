import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    // Logout if already logged in
    try {
      await page.getByRole('button', { name: 'TEST ADMIN' }).click();
      await page.getByRole('link', { name: 'Logout' }).click();
    } catch (error) {
      // Continue if not logged in
    }
  });

  test('AC1 - User registration with invalid phone shows validation error', async ({ page }) => {
    await page.getByRole('link', { name: 'Register' }).click();

    // Fill registration form with invalid phone
    await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('test');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@test.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test');
    await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('abc123');
    await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('123 Street');
    await page.getByPlaceholder('Enter Your DOB').fill('2001-01-01');
    await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).fill('football');
    await page.getByRole('button', { name: 'REGISTER' }).click();

    // Expect validation error for invalid phone number
    await expect(page.getByRole('status').filter({ hasText: 'Phone must contain only numbers' })).toBeVisible();
  });

  test('AC2 - User registration with existing email shows error', async ({ page }) => {
    await page.getByRole('link', { name: 'Register' }).click();

    // Fill registration form with existing email
    await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('test');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@test.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test');
    await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('1234567890');
    await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('123 Street');
    await page.getByPlaceholder('Enter Your DOB').fill('2001-01-01');
    await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).fill('football');
    await page.getByRole('button', { name: 'REGISTER' }).click();

    // Expect error for existing email
    await expect(page.getByRole('status').filter({ hasText: 'Already Register please login' })).toBeVisible();
  });

  test('AC3 - User can register with valid information', async ({ page }) => {
    await page.getByRole('link', { name: 'Register' }).click();

    // Generate unique email for each test run
    const uniqueEmail = `test${Date.now()}@gmail.com`;
    
    // Fill registration form with valid data
    await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('testuser');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(uniqueEmail);
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test123');
    await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('1234567890');
    await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('123 Test Street');
    await page.getByPlaceholder('Enter Your DOB').fill('2001-01-01');
    await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).fill('football');
    await page.getByRole('button', { name: 'REGISTER' }).click();

    // Verify redirected to login page
    await expect(page.getByRole('heading', { name: 'LOGIN FORM' })).toBeVisible();
  });
});

test.describe('User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    // Logout if already logged in
    try {
      await page.getByRole('button', { name: 'TEST ADMIN' }).click();
      await page.getByRole('link', { name: 'Logout' }).click();
    } catch (error) {
      // Continue if not logged in
    }
  });

  test('AC4 - Login page has correct structure', async ({ page }) => {
    await page.getByRole('link', { name: 'Login' }).click();
    
    // Verify login form elements without AriaSnapshot
    await expect(page.getByRole('heading', { name: 'LOGIN FORM' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Your Email' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Your Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Forgot Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'LOGIN' })).toBeVisible();
  });

  test('AC5 - User can login with valid credentials', async ({ page }) => {
    await page.getByRole('link', { name: 'Login' }).click();
    
    // Use test credentials
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test2@gmail.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // Verify successful login
    await expect(page.getByText('🙏login successfully')).toBeVisible();
    await expect(page.getByRole('button', { name: 'test' })).toBeVisible();
  });
});

test('Complete User Registration and Authentication Workflow', async ({ page }) => {
  // Go to homepage and ensure logged out
  await page.goto('http://localhost:3000/');
  try {
    await page.getByRole('button', { name: 'TEST ADMIN' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();
  } catch (error) {
    // Continue if not logged in
  }

  // Navigate to Register page
  await page.getByRole('link', { name: 'Register' }).click();

  // Test 1: Registration with invalid phone
  await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('test');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test');
  await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('abc123');
  await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('123 Street');
  await page.getByPlaceholder('Enter Your DOB').fill('2001-01-01');
  await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).fill('football');
  await page.getByRole('button', { name: 'REGISTER' }).click();

  await expect(page.getByRole('status').filter({ hasText: 'Phone must contain only numbers' })).toBeVisible();

  // Test 2: Fix phone and test existing email
  await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('1234567890');
  await page.getByRole('button', { name: 'REGISTER' }).click();

  await expect(page.getByRole('status').filter({ hasText: 'Already Register please login' })).toBeVisible();

  // Test 3: Register with new email
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test2@gmail.com');
  await page.getByRole('button', { name: 'REGISTER' }).click();
  await page.waitForTimeout(1000);

  // Verify redirected to login page
  await expect(page.getByRole('heading', { name: 'LOGIN FORM' })).toBeVisible();

  // Test 4: Login with registered credentials
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test2@gmail.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  // Verify successful login
  await expect(page.getByText('🙏login successfully')).toBeVisible();
  await expect(page.getByRole('button', { name: 'test' })).toBeVisible();

  // Test 5: Verify basic product page elements (without AriaSnapshot)
  await expect(page.getByRole('img', { name: 'bannerimage' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Filter By Category' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Filter By Price' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

  // Test 6: Access dashboard
  await page.getByRole('button', { name: 'test' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  
  // Verify dashboard elements (without AriaSnapshot)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Profile' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible();
  await expect(page.getByText('test', { exact: true })).toBeVisible();
  await expect(page.getByText('test2@gmail.com', { exact: true })).toBeVisible();

  // Test 7: Logout
  await page.getByRole('button', { name: 'test' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
  await expect(page.locator('div').filter({ hasText: /^Logout Successfully$/ }).nth(1)).toBeVisible();

  // Test 8: Verify cannot access dashboard after logout
  await page.goto('http://localhost:3000/dashboard');
  
  // Should show public navigation elements
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
});