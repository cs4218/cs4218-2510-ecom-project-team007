import { test, expect } from '@playwright/test';

test('User resets password, logs in, shops, and completes checkout', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  //logout
  await page.getByRole('button', { name: 'test' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
  // Go to homepage and navigate to Forgot Password

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('button', { name: 'Forgot Password' }).click();

  // Try with non-existent email — should show error
  await page.getByRole('textbox', { name: 'Enter Your Registered Email' }).fill('fake@fake.com');
  await page.getByRole('textbox', { name: 'Enter Security Answer' }).fill('fake');
  await page.getByRole('textbox', { name: 'Enter New Password' }).fill('newpass');
  await page.getByRole('button', { name: 'RESET PASSWORD' }).click();
  await expect(page.getByText('Something went wrong')).toBeVisible();

  // Try with correct email but wrong security answer — should still fail
  await page.getByRole('textbox', { name: 'Enter Your Registered Email' }).fill('test@test.com');
  await page.getByRole('textbox', { name: 'Enter Security Answer' }).fill('wronganswer');
  await page.getByRole('textbox', { name: 'Enter New Password' }).fill('test1');
  await page.getByRole('button', { name: 'RESET PASSWORD' }).click();
  await expect(page.getByText('Something went wrong')).toBeVisible();

  // Now enter correct credentials — should redirect to login page
  await page.getByRole('textbox', { name: 'Enter Your Registered Email' }).fill('test@test.com');
  await page.getByRole('textbox', { name: 'Enter Security Answer' }).fill('na');
  await page.getByRole('textbox', { name: 'Enter New Password' }).fill('test1');

  await page.getByRole('button', { name: 'RESET PASSWORD' }).click();

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

  // Add items to cart
  await page.locator('.card-name-price > button:nth-child(2)').first().click();
  await page.locator('div:nth-child(2) > .card-body > div:nth-child(3) > button:nth-child(2)').click();

  // Navigate to Cart and check items
  await page.getByRole('link', { name: 'Cart' }).click();
  await expect(page.getByText('NovelA bestselling novelPrice : 14.99Remove')).toBeVisible();
  await page.getByRole('heading', { name: 'Hello test You Have 2 items' }).click();

  // Perform checkout (mocked card details)
  await page.getByRole('button', { name: 'Paying with Card' }).click();

  const cardFrame = page.frameLocator('iframe[name="braintree-hosted-field-number"]');
  const expFrame = page.frameLocator('iframe[name="braintree-hosted-field-expirationDate"]');
  const cvvFrame = page.frameLocator('iframe[name="braintree-hosted-field-cvv"]');

  await cardFrame.getByRole('textbox', { name: 'Credit Card Number' }).fill('4242424242424242');
  await expFrame.getByRole('textbox', { name: 'Expiration Date' }).fill('1126');
  await cvvFrame.getByRole('textbox', { name: 'CVV' }).fill('123');

  await page.getByRole('button', { name: 'Make Payment' }).click();

  // Verify successful order summary
  await expect(page.getByText('All Orders#StatusBuyer')).toBeVisible();
});
