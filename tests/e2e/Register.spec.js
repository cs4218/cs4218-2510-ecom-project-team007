import { test, expect } from '@playwright/test';

test('User registration, login, view products, dashboard, and logout flow UI test', async ({ page }) => {
  // Go to homepage
  await page.goto('http://localhost:3000/');
  await page.getByRole('button', { name: 'test' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();

  // Navigate to Register page
  await page.getByRole('link', { name: 'Register' }).click();

  // Fill registration form with invalid phone (to test validation)
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

  // Fix phone number and attempt registration again
  await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('1234567890');
  await page.getByRole('button', { name: 'REGISTER' }).click();

  // If email already exists, expect proper error message
    await expect(page.getByRole('status').filter({ hasText: 'Already Register please login' })).toBeVisible();

  // Change email and register successfully
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test2@gmail.com');
  await page.getByRole('button', { name: 'REGISTER' }).click();

  // Expect navigation to login page and verify ARIA structure
  await expect(page.getByRole('main')).toMatchAriaSnapshot(`
    - heading "LOGIN FORM" [level=4]
    - textbox "Enter Your Email"
    - textbox "Enter Your Password"
    - button "Forgot Password"
    - button "LOGIN"
  `);

  // Log in with valid credentials
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test2@gmail.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  // Verify successful login and navigation bar
  await expect(page.getByText('🙏login successfully')).toBeVisible();
  await expect(page.getByRole('navigation')).toMatchAriaSnapshot(`
    - navigation:
      - link "🛒 Virtual Vault"
      - list:
        - search:
          - searchbox "Search"
          - button "Search"
        - listitem:
          - link "Home"
        - listitem:
          - link "Categories"
        - listitem:
          - button "test"
        - listitem:
          - link "Cart"
          - superscript: "0"
  `);

  // Verify product list UI
  await expect(page.getByRole('main')).toMatchAriaSnapshot(`
    - main:
      - img "bannerimage"
      - heading "Filter By Category" [level=4]
      - checkbox "Electronics"
      - text: Electronics
      - checkbox "Book"
      - text: Book
      - checkbox "Clothing"
      - text: Clothing
      - heading "Filter By Price" [level=4]
      - radio /\\$0 to \\d+/
      - text: /\\$0 to \\d+/
      - radio /\\$\\d+ to \\d+/
      - text: /\\$\\d+ to \\d+/
      - radio /\\$\\d+ to \\d+/
      - text: /\\$\\d+ to \\d+/
      - radio /\\$\\d+ to \\d+/
      - text: /\\$\\d+ to \\d+/
      - radio /\\$\\d+ or more/
      - text: /\\$\\d+ or more/
      - button "RESET FILTERS"
      - heading "All Products" [level=1]
      - img "Novel"
      - heading "Novel" [level=5]
      - heading /\\$\\d+\\.\\d+/ [level=5]
      - paragraph: A bestselling novel...
      - button "More Details"
      - button "ADD TO CART"
  `);

  // Navigate to Dashboard and verify user info
  await page.getByRole('button', { name: 'test' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByRole('main')).toMatchAriaSnapshot(`
    - main:
      - heading "Dashboard" [level=4]
      - link "Profile"
      - link "Orders"
      - heading "test" [level=3]
      - heading "test2@gmail.com" [level=3]
      - heading /\\d+/ [level=3]
  `);

  // Logout
  await page.getByRole('button', { name: 'test' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
  await expect(page.locator('div').filter({ hasText: /^Logout Successfully$/ }).nth(1)).toBeVisible();

  // Try to access dashboard again after logout — should redirect to home
  await page.goto('http://localhost:3000/dashboard');
  await expect(page.locator('#navbarTogglerDemo01')).toMatchAriaSnapshot(`
    - link "🛒 Virtual Vault"
    - list:
      - search:
        - searchbox "Search"
        - button "Search"
      - listitem:
        - link "Home"
      - listitem:
        - link "Categories"
      - listitem:
        - link "Register"
      - listitem:
        - link "Login"
      - listitem:
        - link "Cart"
        - superscript: "0"
  `);
});
