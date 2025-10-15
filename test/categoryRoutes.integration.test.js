import request from 'supertest';
import app from '../app.js';
import categoryModel from '../models/categoryModel.js';
import productModel from '../models/productModel';
import { connectTestDB, closeTestDB, clearTestDB, createTestUser } from './setup.js';

describe('Category Routes Integration Tests', () => {
  let adminToken;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    const { token } = await createTestUser();
    adminToken = token;
  });

  const name = 'Electronics';

  const createCategoryRequest = (token = adminToken) =>
    request(app)
      .post('/api/v1/category/create-category')
      .set('Authorization', token);

  describe('POST /api/v1/category/create-category', () => {
    it('creates a new category successfully', async () => {
      const { body } = await createCategoryRequest().send({ name }).expect(201);

      expect(body.success).toBe(true);
      expect(body.message).toBe('Category created successfully');

      // Verify response matches database
      const category = await categoryModel.findOne({ name });
      expect(category).toBeTruthy();
      expect(body.category._id).toBe(category._id.toString());
      expect(body.category.name).toBe(category.name);
      expect(body.category.slug).toBe(category.slug);
    });

    it('returns 400 error when name is missing', async () => {
      const { body } = await createCategoryRequest().send({}).expect(400);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Name is required');
    });

    it('returns 409 error when the category already exists', async () => {
      await createCategoryRequest().send({ name }).expect(201);

      const { body } = await createCategoryRequest()
        .send({ name: name.toUpperCase() }) // Also tests case insensitivity
        .expect(409);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Category already exists');
    });

    it('returns 401 error when user is not admin', async () => {
      const { token } = await createTestUser(0, 'user@test.com');

      const { body } = await createCategoryRequest(token).send({ name }).expect(401);

      expect(body.success).toBe(false);
      expect(body.message).toBe('UnAuthorized Access');
    });
  });

  describe('PUT /api/v1/category/update-category/:id', () => {
    const updatedName = 'Electronics & Gadgets';

    const updateCategoryRequest = (id, token = adminToken) =>
      request(app)
        .put(`/api/v1/category/update-category/${id}`)
        .set('Authorization', token);

    it('updates a category successfully', async () => {
      const response = await createCategoryRequest().send({ name }).expect(201);
      const id = response.body.category._id;

      const { body } = await updateCategoryRequest(id)
        .send({ name: updatedName })
        .expect(200);

      expect(body.success).toBe(true);
      expect(body.message).toBe('Category updated successfully');

      // Verify response matches database
      const category = await categoryModel.findById(id);
      expect(category).toBeTruthy();
      expect(body.category._id).toBe(category._id.toString());
      expect(body.category.name).toBe(category.name);
      expect(body.category.slug).toBe(category.slug);
    });

    it('allows updating a category to the same name', async () => {
      const response = await createCategoryRequest().send({ name }).expect(201);
      const id = response.body.category._id;

      const { body } = await updateCategoryRequest(id).send({ name }).expect(200);

      expect(body.success).toBe(true);
      expect(body.message).toBe('Category updated successfully');
    });

    it('returns 400 error when name is missing', async () => {
      const response = await createCategoryRequest().send({ name }).expect(201);
      const id = response.body.category._id;

      const { body } = await updateCategoryRequest(id).send({}).expect(400);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Name is required');
    });

    it('returns 404 error when the category does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const { body } = await updateCategoryRequest(fakeId)
        .send({ name: updatedName })
        .expect(404);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Category not found');
    });

    it('returns 409 error when the updated name already exists', async () => {
      const response = await createCategoryRequest().send({ name }).expect(201);
      const id = response.body.category._id;

      await createCategoryRequest().send({ name: updatedName }).expect(201);

      const { body } = await updateCategoryRequest(id)
        .send({ name: updatedName.toUpperCase() }) // Also tests case insensitivity
        .expect(409);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Category already exists');
    });

    it('returns 401 error when user is not admin', async () => {
      const { token } = await createTestUser(0, 'user@test.com');

      // Create category as admin
      const response = await createCategoryRequest().send({ name }).expect(201);
      const id = response.body.category._id;

      // Try to update as regular user
      const { body } = await updateCategoryRequest(id, token)
        .send({ name: updatedName })
        .expect(401);

      expect(body.success).toBe(false);
      expect(body.message).toBe('UnAuthorized Access');
    });
  });

  describe('DELETE /api/v1/category/delete-category/:id', () => {
    const deleteCategoryRequest = (id, token = adminToken) =>
      request(app)
        .delete(`/api/v1/category/delete-category/${id}`)
        .set('Authorization', token);

    it('deletes a category successfully', async () => {
      const response = await createCategoryRequest().send({ name }).expect(201);
      const id = response.body.category._id;

      const { body } = await deleteCategoryRequest(id).expect(200);

      expect(body.success).toBe(true);
      expect(body.message).toBe('Category deleted successfully');

      // Verify category is removed from the database
      const category = await categoryModel.findById(id);
      expect(category).toBeNull();
    });

    it('returns 404 error when the category does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const { body } = await deleteCategoryRequest(fakeId).expect(404);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Category not found');
    });

    it('returns 409 error when the category still has products', async () => {
      const response = await createCategoryRequest().send({ name }).expect(201);
      const categoryId = response.body.category._id;

      await productModel.create({
        name: 'Test Product',
        slug: 'test-product',
        description: 'Test description',
        price: 99.99,
        category: categoryId,
        quantity: 10,
        shipping: true,
      });

      const { body } = await deleteCategoryRequest(categoryId).expect(409);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Category still has products');

      // Verify category still exists
      const category = await categoryModel.findById(categoryId);
      expect(category).toBeTruthy();
    });

    it('returns 401 error when user is not admin', async () => {
      const { token } = await createTestUser(0, 'user@test.com');

      // Create category as admin
      const response = await createCategoryRequest().send({ name }).expect(201);
      const id = response.body.category._id;

      // Try to delete as regular user
      const { body } = await deleteCategoryRequest(id, token).expect(401);

      expect(body.success).toBe(false);
      expect(body.message).toBe('UnAuthorized Access');
    });
  });
});
