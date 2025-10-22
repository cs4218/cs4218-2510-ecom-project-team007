import request from "supertest";
import app from "../../app.js"; // Assuming you have an app.js that exports the express app
import { connectTestDB, closeTestDB, clearTestDB } from "./setup.js";
import Category from "../../models/categoryModel.js";
import Product from "../../models/productModel.js";
import { Error } from "mongoose";

beforeAll(async () => {
    await connectTestDB();
});

afterAll(async () => {
    await closeTestDB();
});

beforeEach(async () => {
    await clearTestDB();
});

describe("Category Controller API", () => {
    describe("GET /api/v1/category/get-category", () => {
        it("should fetch all categories correctly", async () => {
            await Category.create([
                { name: "Electronics", slug: "electronics" },
                { name: "Books", slug: "books" },
            ]);

            const response = await request(app).get("/api/v1/category/get-category");

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.category)).toBe(true);
            expect(response.body.category).toHaveLength(2);
            expect(
                response.body.category[0].name === "Electronics" ||
                response.body.category[0].name === "Books"
            ).toBe(true);
            expect(response.body.category.map(cat => cat.name)).toEqual(
                expect.arrayContaining(['Electronics', 'Books'])
            );
        });

        it("should return an empty array if no categories exist", async () => {
            const response = await request(app).get("/api/v1/category/get-category");

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.category).toHaveLength(0);
        });
    });

    describe("GET /api/v1/category/single-category/:slug", () => {
        it("should fetch a single category by its slug", async () => {
            const category = await Category.create({ name: "Laptops", slug: "laptops" });

            const response = await request(app).get(`/api/v1/category/single-category/${category.slug}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.category.name).toBe("Laptops");
        });

        it("should correctly filter products by category", async () => {
            const electronicsCategory = await Category.create({ name: "Electronics", slug: "electronics" });
            const booksCategory = await Category.create({ name: "Books", slug: "books" });

            await Product.create([
                { name: "Princess Diana", slug: "fiction-books", description: "Embark on a journey with your childhood favourite", price: 19, category: booksCategory._id, quantity: 10, shipping: false },
                { name: "Princess Diana 2", slug: "fiction-book-2", description: "A sequel to your childhood favourite spinoff", price: 19, category: booksCategory._id, quantity: 10, shipping: false },
                { name: "Wireless Mouse", slug: "wireless-mouse", description: "Wireless mouse", price: 50, category: electronicsCategory._id, quantity: 15, shipping: false },
            ]);

            const response = await request(app).get(`/api/v1/product/product-category/books`);
            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.products).toHaveLength(2);
            expect(response.body.products[0].name === 'Princess Diana' || response.body.products[0].name === 'Princess Diana 2').toBe(true);

            const res = await request(app).get(`/api/v1/product/product-category/electronics`);
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.products).toHaveLength(1);
            expect(res.body.products[0].name).toBe("Wireless Mouse");
        });

        it('should return null for a non-existent category', async () => {
            const response = await request(app).get('/api/v1/category/single-category/does-not-exist-slug');

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.category).toBe(null)
        });
    });
});