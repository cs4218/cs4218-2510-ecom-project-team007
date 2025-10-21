import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/');
  // Logout if already logged in
  try {
    await page.getByRole('button', { name: 'TEST ADMIN' }).click();
    await page.getByRole('link', { name: 'Logout' }).click();
    // Wait for logout to complete
    await page.waitForTimeout(500);
  } catch (error) {
    // Continue if not logged in
  }
});

test('User registers, resets password, logs in and logout', async ({ page }) => {
  // Register a new user
  await page.getByRole('link', { name: 'Register' }).click();

  // Fill registration form
  await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('test');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('1234567890');
  await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('123 Street');
  await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).fill('football');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test123');
  await page.getByPlaceholder('Enter Your DOB').fill('2001-01-01');

  // Submit registration
  await page.getByRole('button', { name: 'REGISTER' }).click();
  await page.waitForTimeout(1000);

  // Verify registration success and navigate to login
  await expect(page.getByText('Register Successfully, please login')).toBeVisible();
  await page.getByRole('link', { name: 'Login' }).click();

  // Login initially with original password
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test123');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.waitForTimeout(1000);

  // Verify successful login with original password - check for user dropdown
  await expect(page.getByRole('button', { name: 'test' })).toBeVisible();

  // Logout to test password reset
  await page.getByRole('button', { name: 'test' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();

  // Navigate to Forgot Password
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('button', { name: 'Forgot Password' }).click();

  // Try with non-existent email — should show error
  await page.getByRole('textbox', { name: 'Enter Your Registered Email' }).fill('fake@fake.com');
  await page.getByRole('textbox', { name: 'Enter Security Answer' }).fill('fake');
  await page.getByRole('textbox', { name: 'Enter New Password' }).fill('newpass');
  await page.getByRole('button', { name: 'RESET PASSWORD' }).click();
  await expect(page.getByText('Something went wrong').first()).toBeVisible();

  // Try with correct email but wrong security answer — should still fail
  await page.getByRole('textbox', { name: 'Enter Your Registered Email' }).fill('test@test.com');
  await page.getByRole('textbox', { name: 'Enter Security Answer' }).fill('wronganswer');
  await page.getByRole('textbox', { name: 'Enter New Password' }).fill('test1');
  await page.getByRole('button', { name: 'RESET PASSWORD' }).click();
  await expect(page.getByText('Something went wrong').first()).toBeVisible();

  // Now enter correct credentials — should redirect to login page
  await page.getByRole('textbox', { name: 'Enter Your Registered Email' }).fill('test@test.com');
  await page.getByRole('textbox', { name: 'Enter Security Answer' }).fill('football');
  await page.getByRole('textbox', { name: 'Enter New Password' }).fill('test1');
  await page.getByRole('button', { name: 'RESET PASSWORD' }).click();
  await page.waitForTimeout(1000);

  // Confirm login form appears
  await expect(page.getByRole('main')).toMatchAriaSnapshot(`
    - heading "LOGIN FORM" [level=4]
    - textbox "Enter Your Email"
    - textbox "Enter Your Password"
    - button "Forgot Password"
    - button "LOGIN"
  `);

  // Log in with new password
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test1');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.waitForTimeout(1000);

  // VERIFY SUCCESSFUL LOGIN WITH NEW PASSWORD
  await expect(page.getByRole('button', { name: 'test' })).toBeVisible();
  
  // Click user dropdown to verify Dashboard and Logout are accessible
  await page.getByRole('button', { name: 'test' }).click();
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
  
  // Also verify Cart is visible in main navigation
  await expect(page.getByRole('link', { name: 'Cart' })).toBeVisible();

  await expect(page.getByText('All Products')).toBeVisible();

  // FINAL LOGOUT TO COMPLETE THE TEST 
  await page.getByRole('button', { name: 'test' }).click();
  await page.getByRole('link', { name: 'Logout' }).click({ force: true });

  // VERIFY SUCCESSFUL LOGOUT
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'test' })).not.toBeVisible();
});