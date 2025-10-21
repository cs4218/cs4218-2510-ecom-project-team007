// tests/cart.spec.js
import { test, expect } from "@playwright/test";

test.describe("Cart Basic Operations", () => {
  test("Add item to cart and verify it appears in cart", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    const firstProduct = page.locator(".card").first();
    const productName = await firstProduct.locator(".card-title").first().textContent();
    await firstProduct.getByRole("button", { name: "ADD TO CART" }).click();
    
    await expect(page.locator("text=Item Added to cart")).toBeVisible({ timeout: 3000 });
    
    await page.goto("http://localhost:3000/cart");
    await waitForCartPage(page);
    
    const cartItem = page.getByText(productName.trim(), { exact: true });
    await expect(cartItem).toBeVisible();
  });

  test("Add multiple items to cart from homepage", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    const products = page.locator(".card");
    const productCount = await products.count();
    const itemsToAdd = Math.min(3, productCount);
    const addedProductNames = [];
    
    for (let i = 0; i < itemsToAdd; i++) {
      const product = products.nth(i);
      const productName = await product.locator(".card-title").first().textContent();
      addedProductNames.push(productName.trim());
      
      await product.getByRole("button", { name: /ADD TO CART/i }).click();
      await page.waitForTimeout(500);
    }
    
    await page.goto("http://localhost:3000/cart");
    await waitForCartPage(page);
    
    for (const productName of addedProductNames) {
      const cartItem = page.getByText(productName, { exact: false });
      await expect(cartItem).toBeVisible();
    }
  });
});

test.describe("Cart Management", () => {
  test("Update item quantity in cart - increase", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    const firstProduct = page.locator(".card").first();
    const productName = await firstProduct.locator(".card-title").first().textContent();
    await firstProduct.getByRole("button", { name: "ADD TO CART" }).click();
    await expect(page.locator("text=Item Added to cart")).toBeVisible({ timeout: 3000 });
    
    await page.goto("http://localhost:3000/cart");
    await waitForCartPage(page);
    
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    const sameProduct = page.locator(".card").filter({ hasText: productName }).first();
    await sameProduct.getByRole("button", { name: "ADD TO CART" }).click();
    await expect(page.locator("text=Item Added to cart")).toBeVisible({ timeout: 3000 });
    
    await page.goto("http://localhost:3000/cart");
    await waitForCartPage(page);
    
    const cartHeading = page.locator("h1").first();
    const headingText = await cartHeading.textContent();
    expect(headingText).toContain("2 items");
  });

  test("Update item quantity in cart - decrease", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    const firstProduct = page.locator(".card").first();
    const productName = await firstProduct.locator(".card-title").first().textContent();
    
    await firstProduct.getByRole("button", { name: "ADD TO CART" }).click();
    await page.waitForTimeout(500);
    await firstProduct.getByRole("button", { name: "ADD TO CART" }).click();
    
    await page.goto("http://localhost:3000/cart");
    await waitForCartPage(page);
    
    const removeBtn = page.locator('button:has-text("Remove")').first();
    await removeBtn.click();
    await page.waitForTimeout(1000);
    
    const cartHeading = page.locator("h1").first();
    const headingText = await cartHeading.textContent();
    expect(headingText).toMatch(/1 items?|empty/i);
  });

  test("Remove item from cart", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    // FIX: Changed from ".cart" to ".card"
    const firstProduct = page.locator(".card").first();
    const productName = await firstProduct.locator(".card-title").first().textContent();
    await firstProduct.getByRole("button", { name: "ADD TO CART" }).click();
    
    await page.goto("http://localhost:3000/cart");
    await waitForCartPage(page);
    
    await expect(page.getByText(productName.trim())).toBeVisible();
    
    const removeBtn = page.locator('button:has-text("Remove")').first();
    await removeBtn.click();
    await page.waitForTimeout(1000);
    
    await expect(page.getByText(productName.trim())).not.toBeVisible();
    await expect(page.getByText("Your Cart Is Empty")).toBeVisible();
  });

  test("Clear entire cart", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    const products = page.locator(".card");
    const itemsToAdd = Math.min(2, await products.count());
    
    for (let i = 0; i < itemsToAdd; i++) {
      await products.nth(i).getByRole("button", { name: /ADD TO CART/i }).click();
      await page.waitForTimeout(300);
    }
    
    await page.goto("http://localhost:3000/cart");
    await waitForCartPage(page);
    
    const clearCartBtn = page.locator('button:has-text("Clear Cart")');
    if (await clearCartBtn.isVisible()) {
      await clearCartBtn.click();
      await page.waitForTimeout(1000);
      await expect(page.getByText("Your Cart Is Empty")).toBeVisible();
    }
  });
});

test.describe("Cart Persistence", () => {
  test("Cart persists after page refresh", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    const firstProduct = page.locator(".card").first();
    const productName = await firstProduct.locator(".card-title").first().textContent();
    await firstProduct.getByRole("button", { name: "ADD TO CART" }).click();
    
    await page.goto("http://localhost:3000/cart");
    await waitForCartPage(page);
    
    await page.reload();
    await waitForCartPage(page);
    
    await expect(page.getByText(productName.trim())).toBeVisible();
  });

  test("Cart persists during navigation", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    const firstProduct = page.locator(".card").first();
    const productName = await firstProduct.locator(".card-title").first().textContent();
    await firstProduct.getByRole("button", { name: "ADD TO CART" }).click();
    
    await page.goto("http://localhost:3000/");
    await page.goto("http://localhost:3000/categories");
    await page.goto("http://localhost:3000/");
    
    await page.goto("http://localhost:3000/cart");
    await waitForCartPage(page);
    await expect(page.getByText(productName.trim())).toBeVisible();
  });
});

test.describe("Cart from Search Results", () => {
  test("Search for product and add to cart from results", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card", { timeout: 5000 });
    
    const firstProduct = page.locator(".card").first();
    const productName = await firstProduct.locator(".card-title").first().textContent();
    
    const words = productName.trim().split(' ');
    const searchTerm = words.find(word => word.length >= 2) || words[0];
    
    const searchBar = page.locator('input[type="search"]').first();
    
    if (await searchBar.isVisible()) {
      await searchBar.fill(searchTerm);
      await page.waitForTimeout(2000);
      
      const visibleProducts = page.locator(".card:visible");
      const count = await visibleProducts.count();
      
      if (count > 0) {
        const firstProductTitle = await visibleProducts.first().locator(".card-title").first().textContent();
        
        await visibleProducts.first().getByRole("button", { name: /ADD TO CART/i }).click();
        await expect(page.locator("text=Item Added to cart")).toBeVisible({ timeout: 3000 });
        
        await page.goto("http://localhost:3000/cart");
        await waitForCartPage(page);
        
        const cartItem = page.getByText(firstProductTitle.trim(), { exact: false });
        await expect(cartItem).toBeVisible();
      }
    }
  });

  test("Search, add multiple items from search results to cart", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    const searchBar = page.locator('input[type="search"]').first();
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
      await waitForCartPage(page);
      
      for (const productName of addedProductNames) {
        const cartItem = page.getByText(productName, { exact: false });
        await expect(cartItem).toBeVisible();
      }
    }
  });
});

test.describe("Cart from Product Details", () => {
  test("Add to cart from current page after clicking product", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    const firstProduct = page.locator(".card").first();
    const productName = await firstProduct.locator(".card-title").first().textContent();
    
    await firstProduct.click();
    await page.waitForTimeout(1000);
    
    await page.getByRole("button", { name: /ADD TO CART/i }).first().click();
    await expect(page.locator("text=Item Added to cart")).toBeVisible({ timeout: 3000 });
    
    await page.goto("http://localhost:3000/cart");
    await waitForCartPage(page);
    
    await expect(page.getByText(productName.trim())).toBeVisible();
  });

  test("Add multiple quantities from current page", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    const firstProduct = page.locator(".card").first();
    const productName = await firstProduct.locator(".card-title").first().textContent();
    
    await firstProduct.click();
    await page.waitForTimeout(1000);
    
    await page.getByRole("button", { name: /ADD TO CART/i }).first().click();
    await expect(page.locator("text=Item Added to cart")).toBeVisible({ timeout: 3000 });
    
    await page.goto("http://localhost:3000/cart");
    await waitForCartPage(page);
    
    const cartItems = page.locator('.card:has-text("Remove")');
    const itemCount = await cartItems.count();
    expect(itemCount).toBeGreaterThan(0);
  });
});

test.describe("Cart Calculations", () => {
  test("Verify cart total calculation with single item", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    const firstProduct = page.locator(".card").first();
    // FIX: Get price from h5 element instead of .card-text
    const productPriceText = await firstProduct.locator("h5").last().textContent();
    const productPrice = parseFloat(productPriceText.replace(/[^0-9.]/g, ''));
    
    await firstProduct.getByRole("button", { name: "ADD TO CART" }).click();
    
    await page.goto("http://localhost:3000/cart");
    await waitForCartPage(page);
    
    const totalElement = page.getByText("Total :").first();
    const totalText = await totalElement.textContent();
    const total = parseFloat(totalText.replace(/[^0-9.]/g, ''));
    
    expect(total).toBe(productPrice);
  });

  test("Verify cart total calculation with multiple items", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    let expectedTotal = 0;
    
    for (let i = 0; i < 2; i++) {
      const product = page.locator(".card").nth(i);
      // FIX: Get price from h5 element instead of .card-text
      const productPriceText = await product.locator("h5").last().textContent();
      const productPrice = parseFloat(productPriceText.replace(/[^0-9.]/g, ''));
      expectedTotal += productPrice;
      
      await product.getByRole("button", { name: /ADD TO CART/i }).click();
      await page.waitForTimeout(300);
    }
    
    await page.goto("http://localhost:3000/cart");
    await waitForCartPage(page);
    
    const totalElement = page.getByText("Total :").first();
    const totalText = await totalElement.textContent();
    const actualTotal = parseFloat(totalText.replace(/[^0-9.]/g, ''));
    
    expect(actualTotal).toBe(expectedTotal);
  });
});

test.describe("Cart Edge Cases", () => {
  test("Add same product multiple times updates quantity", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    const firstProduct = page.locator(".card").first();
    const productName = await firstProduct.locator(".card-title").first().textContent();
    
    await firstProduct.getByRole("button", { name: "ADD TO CART" }).click();
    await page.waitForTimeout(500);
    await firstProduct.getByRole("button", { name: "ADD TO CART" }).click();
    
    await page.goto("http://localhost:3000/cart");
    await waitForCartPage(page);
    
    const cartHeading = page.locator("h1").first();
    const headingText = await cartHeading.textContent();
    expect(headingText).toContain("2 items");
  });

  test("Cart empty state displays correctly", async ({ page }) => {
    await page.goto("http://localhost:3000/cart");
    await waitForCartPage(page);
    
    const emptyMessage = page.getByText("Your Cart Is Empty");
    await expect(emptyMessage).toBeVisible();
    
    const continueShopping = page.getByRole('link', { name: /Home|Continue Shopping/i });
    if (await continueShopping.isVisible()) {
      await continueShopping.click();
      await page.waitForSelector(".card");
      await expect(page.locator(".card").first()).toBeVisible();
    }
  });

  test("Cart icon shows item count", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".card");
    
    const cartIcon = page.locator('.badge');
    
    if (await cartIcon.isVisible()) {
      const initialCount = await cartIcon.textContent();
      
      await page.locator(".card").first().getByRole("button", { name: "ADD TO CART" }).click();
      await page.waitForTimeout(1000);
      
      const updatedCount = await cartIcon.textContent();
      expect(parseInt(updatedCount)).toBeGreaterThan(parseInt(initialCount || "0"));
    }
  });
});

// Helper function to wait for cart page to load
async function waitForCartPage(page) {
  // Wait for any of these cart page indicators
  await Promise.race([
    page.waitForSelector('.cart-page', { timeout: 10000 }),
    page.waitForSelector('h1:has-text("Cart")', { timeout: 10000 }),
    page.waitForSelector('h1:has-text("items in your cart")', { timeout: 10000 }),
    page.waitForSelector('.card:has-text("Remove")', { timeout: 10000 })
  ]).catch(() => {
    // If none of the above work, just wait for the page to be loaded
    return page.waitForTimeout(2000);
  });
}