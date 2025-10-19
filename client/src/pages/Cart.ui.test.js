// tests/cart.spec.js
import { test, expect } from "@playwright/test";

test("Add item to cart and verify it appears in cart", async ({ page }) => {
  // Go to homepage
  await page.goto("http://localhost:3000/");

  // Wait for products to load
  await page.waitForSelector(".card");

  // Click the first "ADD TO CART" button
  const firstProduct = page.locator(".card").first();
  const productName = await firstProduct.locator(".card-title").first().textContent();
  await firstProduct.getByRole("button", { name: "ADD TO CART" }).click();

  // Wait for toast notification
  await expect(page.locator("text=Item Added to cart")).toBeVisible({ timeout: 3000 });

  // Navigate to Cart page
  await page.goto("http://localhost:3000/cart");

  // Wait for cart items
  await page.waitForSelector(".cart-page");

  // Check if the added product appears in the cart - be more specific
  const cartItem = page.locator(".cart-page").getByText(productName.trim(), { exact: true });
  await expect(cartItem).toBeVisible();
});

test.describe("Search and Add to Cart", () => {
  
  test("Search for NUS, add NUS shirt to cart, and verify in cart", async ({ page }) => {
    // Step 1: Go to homepage
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card", { timeout: 5000 });
    console.log("✓ Homepage loaded");
    
    // Step 2: Find and type in search bar
    const searchBar = page.locator('input[type="search"], input[placeholder*="Search"], input[name="search"]').first();
    await searchBar.fill("NUS");
    console.log("✓ Typed 'NUS' in search bar");
    
    // Wait for search results to load
    await page.waitForTimeout(1000); // Give time for search to filter results
    
    // Step 3: Find the NUS shirt product
    // Look for a card that contains "NUS" in its title
    const nusProduct = page.locator(".card").filter({ hasText: /NUS/i }).first();
    await expect(nusProduct).toBeVisible({ timeout: 3000 });
    
    const productName = await nusProduct.locator(".card-title").first().textContent();
    console.log(`✓ Found product: ${productName.trim()}`);
    
    // Step 4: Add to cart
    await nusProduct.getByRole("button", { name: /ADD TO CART/i }).click();
    
    // Wait for toast notification
    await expect(page.locator("text=Item Added to cart")).toBeVisible({ timeout: 3000 });
    console.log("✓ Item added to cart");
    
    // Step 5: Navigate to cart
    await page.goto("http://localhost:3000/cart");
    await page.waitForSelector(".cart-page");
    console.log("✓ Navigated to cart page");
    
    // Step 6: Verify NUS shirt is in cart using the exact product name
    const cartItem = page.locator(".cart-page").getByText(productName.trim(), { exact: true });
    await expect(cartItem).toBeVisible();
    console.log(`✓ NUS shirt found in cart: ${productName.trim()}`);
  });

  test("Search for NUS, verify search results contain NUS products", async ({ page }) => {
    // Go to homepage
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    // Type in search bar
    const searchBar = page.locator('input[type="search"], input[placeholder*="Search"], input[name="search"]').first();
    await searchBar.fill("NUS");
    
    // Wait for filtering
    await page.waitForTimeout(1000);
    
    // Verify that visible products contain "NUS"
    const visibleProducts = page.locator(".card:visible");
    const count = await visibleProducts.count();
    
    console.log(`Found ${count} product(s) matching 'NUS'`);
    expect(count).toBeGreaterThan(0);
    
    // Verify at least one product has NUS in the title
    const nusProduct = page.locator(".card").filter({ hasText: /NUS/i });
    await expect(nusProduct.first()).toBeVisible();
    console.log("✓ Search results contain NUS products");
  });

  test("Search, add multiple NUS items, verify all in cart", async ({ page }) => {
    // Go to homepage
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    // Search for NUS
    const searchBar = page.locator('input[type="search"], input[placeholder*="Search"], input[name="search"]').first();
    await searchBar.fill("NUS");
    await page.waitForTimeout(1000);
    
    // Get all NUS products
    const nusProducts = page.locator(".card").filter({ hasText: /NUS/i });
    const productCount = await nusProducts.count();
    
    if (productCount === 0) {
      throw new Error("No NUS products found");
    }
    
    // Add first two NUS products (or however many are available)
    const itemsToAdd = Math.min(2, productCount);
    const addedProductNames = [];
    
    for (let i = 0; i < itemsToAdd; i++) {
      const product = nusProducts.nth(i);
      const productName = await product.locator(".card-title").first().textContent();
      addedProductNames.push(productName.trim());
      
      await product.getByRole("button", { name: /ADD TO CART/i }).click();
      await page.waitForTimeout(500);
      console.log(`✓ Added: ${productName.trim()}`);
    }
    
    // Go to cart
    await page.goto("http://localhost:3000/cart");
    await page.waitForSelector(".cart-page");
    
    // Verify all added products are in cart
    for (const productName of addedProductNames) {
      const cartItem = page.locator(".cart-page").getByText(productName, { exact: true });
      await expect(cartItem).toBeVisible();
      console.log(`✓ Verified in cart: ${productName}`);
    }
  });

  test("Search for NUS, clear search, verify all products shown again", async ({ page }) => {
    // Go to homepage
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    // Count initial products
    const initialCount = await page.locator(".card:visible").count();
    console.log(`Initial products visible: ${initialCount}`);
    
    // Search for NUS
    const searchBar = page.locator('input[type="search"], input[placeholder*="Search"], input[name="search"]').first();
    await searchBar.fill("NUS");
    await page.waitForTimeout(1000);
    
    // Count filtered products
    const filteredCount = await page.locator(".card:visible").count();
    console.log(`Filtered products (NUS): ${filteredCount}`);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    
    // Clear search
    await searchBar.clear();
    await page.waitForTimeout(1000);
    
    // Count products after clearing
    const finalCount = await page.locator(".card:visible").count();
    console.log(`Products after clearing search: ${finalCount}`);
    
    // Should show all products again
    expect(finalCount).toBe(initialCount);
    console.log("✓ Search cleared, all products visible again");
  });

});