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

describe('Category Model Integration', () => {
    /**
     * (Create) Should successfully create a new category if data is valid.
     */
    it('should create and save a new category successfully', async () => {
        const categoryData = {
            name: 'Electronics',
            slug: 'electronics',
        };
        const newCategory = await Category.create(categoryData);
        expect(newCategory._id).toBeDefined();
        expect(newCategory.name).toBe(categoryData.name);
        expect(newCategory.slug).toBe(categoryData.slug);
    });

    /**
     * (Read) Should find a category by its slug.
     */
    it('should find a category correctly', async () => {
        const categoryData = { name: 'Books', slug: 'books' };
        await Category.create(categoryData);
        const foundCategory = await Category.findOne({ slug: 'books' });
        expect(foundCategory).not.toBeNull();
        expect(foundCategory.name).toBe(categoryData.name);
    });

    /**
     * (Validation): Should fail to create a category without a required 'name' field.
     */
    it('should fail if a required field (name) is missing', async () => {
        const categoryData = { slug: 'missing-name' }; // Missing the 'name' field
        let err;
        try {
            await Category.create(categoryData);
        } catch (error) {
            err = error;
        }
        expect(err).toBeInstanceOf(Error.ValidationError);
        expect(err.errors.name).toBeDefined();
    });

    /**
     * (Update): Should update a category's name.
     */
    it('should update a category successfully', async () => {
        const originalCategory = await Category.create({ name: 'Fashion', slug: 'fashion' });
        const updatedName = 'Apparel & Fashion';
        const updatedCategory = await Category.findByIdAndUpdate(
            originalCategory._id,
            { name: updatedName },
            { new: true } // This option returns the document after the update
        );
        expect(updatedCategory).not.toBeNull();
        expect(updatedCategory.name).toBe(updatedName);
    });

    /**
     * (Delete): Should delete a category successfully.
     */
    it('should delete a category successfully', async () => {
        const categoryToDelete = await Category.create({ name: 'Home Goods', slug: 'home-goods' });
        await Category.findByIdAndDelete(categoryToDelete._id);
        const foundCategory = await Category.findById(categoryToDelete._id);
        expect(foundCategory).toBeNull();
    });

    /**
     * (Uniqueness): Should fail if a category with a unique field (name/slug) already exists.
     */
    it('should fail to create a category with a non-unique name', async () => {
        const categoryData = { name: 'Gaming', slug: 'gaming' };
        await Category.create(categoryData);
        await expect(Category.create(categoryData)).rejects.toThrow(
            'E11000 duplicate key error'
        );
    });
});