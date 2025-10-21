import request from "supertest";
import app from "../../app.js";
import Product from "../../models/productModel.js";
import Category from "../../models/categoryModel.js";
import { connectTestDB, closeTestDB, clearTestDB } from "./setup.js";

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  // Create a test category first
  const category = await Category.create({
    name: "Electronics",
    slug: "electronics",
  });

  // Create products with category ObjectId
  await Product.create([
    {
      name: "Laptop",
      slug: "laptop",
      description: "High-end laptop",
      price: 1200,
      category: category._id,
      quantity: 5,
      shipping: true,
    },
    {
      name: "Mouse",
      slug: "mouse",
      description: "Wireless mouse",
      price: 50,
      category: category._id,
      quantity: 10,
      shipping: true,
    },
    {
      name: "Keyboard",
      slug: "keyboard", 
      description: "Mechanical keyboard",
      price: 80,
      category: category._id,
      quantity: 15,
      shipping: true,
    },
  ]);
});

describe("Homepage API", () => {
  it("GET /api/v1/product/product-list/1 → should return all products", async () => {
    const res = await request(app).get("/api/v1/product/product-list/1");
    expect(res.statusCode).toBe(200);

    const products = res.body.products || res.body;
    const names = products.map(p => p.name);
    expect(names).toContain("Laptop");
    expect(names).toContain("Mouse");
    expect(names).toContain("Keyboard");
    expect(products.length).toBe(3);
  });

  it("GET /api/v1/product/get-product/:slug → should return a single product", async () => {
    const listRes = await request(app).get("/api/v1/product/product-list/1");
    const products = listRes.body.products || listRes.body;

    const productSlug = products[0].slug;

    const singleRes = await request(app).get(`/api/v1/product/get-product/${productSlug}`);
    expect(singleRes.statusCode).toBe(200);

    const product = singleRes.body.product;
    expect(product).toHaveProperty("name", products[0].name);
    expect(product).toHaveProperty("description", products[0].description);
    expect(product).toHaveProperty("price", products[0].price);
    expect(product).toHaveProperty("category");
  });

  it("POST /api/v1/product/product-filters → should filter products by category", async () => {
    const categories = await Category.find({});
    const categoryId = categories[0]._id;

    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({ checked: [categoryId], radio: [] });

    expect(res.statusCode).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);

    const product = res.body.products[0];
    const catId = product.category._id ? product.category._id : product.category;
    expect(catId.toString()).toBe(categoryId.toString());
  });

  it("GET /api/v1/product/product-list/:page → should handle empty page gracefully", async () => {
    const res = await request(app).get("/api/v1/product/product-list/9999");
    expect(res.statusCode).toBe(200);
    const products = res.body.products || res.body;
    expect(products.length).toBe(0);
  });

  it("GET /api/v1/product/get-product/:slug → should return 404 for invalid slug", async () => {
    const res = await request(app).get("/api/v1/product/get-product/invalid-slug-that-does-not-exist");
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message");
  });

  it("POST /api/v1/product/product-filters → should handle empty filter (return all products)", async () => {
    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({ checked: [], radio: [] });

    expect(res.statusCode).toBe(200);
    expect(res.body.products.length).toBeGreaterThanOrEqual(3);
  });

  it("POST /api/v1/product/product-filters → should filter by price range", async () => {
    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({ checked: [], radio: [0, 100] });

    expect(res.statusCode).toBe(200);
    const products = res.body.products;
    
    expect(products.length).toBe(2);
    expect(products.every(p => p.price <= 100)).toBe(true);
    
    const names = products.map(p => p.name);
    expect(names).toContain("Mouse");
    expect(names).toContain("Keyboard");
    expect(names).not.toContain("Laptop");
  });

  it("GET /api/v1/product/product-count → should return total count of products", async () => {
    const res = await request(app).get("/api/v1/product/product-count");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("total");
    expect(res.body.total).toBe(3);
  });

  it("GET /api/v1/product/product-list/:page → should paginate products correctly", async () => {
    // Check the default pagination behavior first
    const resPage1 = await request(app).get("/api/v1/product/product-list/1");
    const resPage2 = await request(app).get("/api/v1/product/product-list/2");

    expect(resPage1.statusCode).toBe(200);
    expect(resPage2.statusCode).toBe(200);

    const productsPage1 = resPage1.body.products || resPage1.body;
    const productsPage2 = resPage2.body.products || resPage2.body;

    // If pagination is working, page 2 might be empty or have fewer products
    // Just check that we get a valid response and handle both cases
    expect(Array.isArray(productsPage1)).toBe(true);
    expect(Array.isArray(productsPage2)).toBe(true);
    
    // If page 2 has products, they should be different from page 1
    if (productsPage1.length > 0 && productsPage2.length > 0) {
      const page1Ids = productsPage1.map(p => p._id.toString());
      const page2Ids = productsPage2.map(p => p._id.toString());
      
      // Ensure no overlap between pages
      page1Ids.forEach(id => {
        expect(page2Ids).not.toContain(id);
      });
    }
  });

  it("GET /api/v1/product/search/:keyword → should search products by keyword", async () => {
    const res = await request(app).get("/api/v1/product/search/Laptop");

    expect(res.statusCode).toBe(200);
    
    // Handle different possible response structures
    const products = res.body.products || res.body;
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThanOrEqual(1);
    
    // Check if any product contains the keyword in name
    const matchingProducts = products.filter(p => 
      p.name && p.name.toLowerCase().includes("laptop")
    );
    expect(matchingProducts.length).toBeGreaterThan(0);
  });

  it("GET /api/v1/product/search/:keyword → should return empty for non-matching keyword", async () => {
    const res = await request(app).get("/api/v1/product/search/NonexistentProduct");

    expect(res.statusCode).toBe(200);
    
    // Handle different possible response structures
    const products = res.body.products || res.body;
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBe(0);
  });
});