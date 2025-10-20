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
  ]);
});

describe("Homepage API", () => {
    it("GET /api/v1/product/all → should return all products", async () => {
        const res = await request(app).get("/api/v1/product/product-list/1");
        expect(res.statusCode).toBe(200);

        const products = res.body.products || res.body;
        const names = products.map(p => p.name);
        expect(names).toContain("Laptop");
        expect(names).toContain("Mouse");
        expect(products.length).toBe(2);

    });

    it("GET /api/v1/product/get-product/:slug → should return a single product", async () => {
        // Fetch all products first
        const listRes = await request(app).get("/api/v1/product/product-list/1");
        const products = listRes.body.products || listRes.body;

        // Pick the first product to "click into"
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
});
