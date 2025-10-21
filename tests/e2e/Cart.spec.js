// tests/cart.spec.js
import { test, expect } from "@playwright/test";

test("Add item to cart and verify it appears in cart", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.waitForSelector(".card");
  
  const firstProduct = page.locator(".card").first();
  const productName = await firstProduct.locator(".card-title").first().textContent();
  await firstProduct.getByRole("button", { name: "ADD TO CART" }).click();
  
  await expect(page.locator("text=Item Added to cart")).toBeVisible({ timeout: 3000 });
  
  await page.goto("http://localhost:3000/cart");
  await page.waitForSelector(".cart-page");
  
  const cartItem = page.locator(".cart-page").getByText(productName.trim(), { exact: true });
  await expect(cartItem).toBeVisible();
});

test.describe("Search and Add to Cart", () => {
  
  test("Search for product keyword and verify results", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card", { timeout: 5000 });
    
    const firstProduct = page.locator(".card").first();
    const productName = await firstProduct.locator(".card-title").first().textContent();
    
    const words = productName.trim().split(' ');
    const searchTerm = words.find(word => word.length >= 2) || words[0];
    
    const searchBar = page.locator('input[type="search"], input[placeholder*="Search"], input[name="search"]').first();
    
    if (await searchBar.isVisible()) {
      await searchBar.fill(searchTerm);
      await page.waitForTimeout(2000);
      
      const visibleProducts = page.locator(".card:visible");
      const count = await visibleProducts.count();
      
      if (count > 0) {
        // Store the product name BEFORE navigation
        const firstProductTitle = await visibleProducts.first().locator(".card-title").first().textContent();
        
        await visibleProducts.first().getByRole("button", { name: /ADD TO CART/i }).click();
        await expect(page.locator("text=Item Added to cart")).toBeVisible({ timeout: 3000 });
        
        await page.goto("http://localhost:3000/cart");
        await page.waitForSelector(".cart-page");
        
        // Use the stored product name
        const cartItem = page.locator(".cart-page").getByText(firstProductTitle.trim(), { exact: false });
        await expect(cartItem).toBeVisible();
      }
    }
  });

  test("Search for keyword and verify filtered results", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.waitForSelector(".card");
  
  // Get the first product's name and use it as search term
  const firstProduct = page.locator(".card").first();
  const productName = await firstProduct.locator(".card-title").first().textContent();
  const searchTerm = productName.trim();
  
  const searchBar = page.locator('input[type="search"], input[placeholder*="Search"], input[name="search"]').first();
  await searchBar.fill(searchTerm);
  
  await page.waitForTimeout(1000);
  
  // Verify the first product is still visible after search
  await expect(firstProduct).toBeVisible();
});

  test("Search, add multiple items, verify all in cart", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    const searchBar = page.locator('input[type="search"], input[placeholder*="Search"], input[name="search"]').first();
    await searchBar.fill("shirt");
    await page.waitForTimeout(1000);
    
    const shirtProducts = page.locator(".card").filter({ hasText: /shirt/i });
    const productCount = await shirtProducts.count();
    
    if (productCount > 0) {
      const itemsToAdd = Math.min(2, productCount);
      const addedProductNames = [];
      
      for (let i = 0; i < itemsToAdd; i++) {
        const product = shirtProducts.nth(i);
        const productName = await product.locator(".card-title").first().textContent();
        addedProductNames.push(productName.trim());
        
        await product.getByRole("button", { name: /ADD TO CART/i }).click();
        await page.waitForTimeout(500);
      }
      
      await page.goto("http://localhost:3000/cart");
      await page.waitForSelector(".cart-page");
      
      for (const productName of addedProductNames) {
        const cartItem = page.locator(".cart-page").getByText(productName, { exact: false });
        await expect(cartItem).toBeVisible();
      }
    }
  });

  test("Search, clear search, verify all products shown", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    const initialCount = await page.locator(".card:visible").count();
    
    const searchBar = page.locator('input[type="search"], input[placeholder*="Search"], input[name="search"]').first();
    await searchBar.fill("test");
    await page.waitForTimeout(1000);
    
    const filteredCount = await page.locator(".card:visible").count();
    
    await searchBar.clear();
    await page.waitForTimeout(1000);
    
    const finalCount = await page.locator(".card:visible").count();
    
    expect(finalCount).toBe(initialCount);
  });

});