import mongoose from 'mongoose';
import categoryModel from './categoryModel';

describe('Category Model', () => {
    it('creates a category with name and slug', () => {
        const categoryData = {
            name: 'Electronics',
            slug: 'electronics',
        };

        const category = new categoryModel(categoryData);

        expect(category.name).toBe('Electronics');
        expect(category.slug).toBe('electronics');
    });

    it('converts slug to lowercase', () => {
        const categoryData = {
            name: 'Electronics',
            slug: 'ELECTRONICS',
        };

        const category = new categoryModel(categoryData);

        expect(category.slug).toBe('electronics');
    });

    it('creates a category without name field', () => {
        const categoryData = {
            slug: 'electronics',
        };

        const category = new categoryModel(categoryData);

        expect(category.name).toBeUndefined();
        expect(category.slug).toBe('electronics');
    });

    it('creates a category without slug field', () => {
        const categoryData = {
            name: 'Electronics',
        };

        const category = new categoryModel(categoryData);

        expect(category.name).toBe('Electronics');
        expect(category.slug).toBeUndefined();
    });

    it('has correct model name', () => {
        expect(categoryModel.modelName).toBe('Category');
    });

    it('defines name field as String type', () => {
        const nameField = categoryModel.schema.path('name');

        expect(nameField.instance).toBe('String');
    });

    it('defines slug field as String type', () => {
        const slugField = categoryModel.schema.path('slug');

        expect(slugField.instance).toBe('String');
    });

    it('applies lowercase option to slug field', () => {
        const slugField = categoryModel.schema.path('slug');

        expect(slugField.options.lowercase).toBe(true);
    });
});