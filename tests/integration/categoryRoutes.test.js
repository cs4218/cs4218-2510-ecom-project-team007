import request from 'supertest';
import app from '../../app.js';
import categoryModel from '../../models/categoryModel.js';
import productModel from '../../models/productModel';
import { connectTestDB, closeTestDB, clearTestDB, createTestUser } from './setup.js';

describe('Category Routes Integration Tests', () => {
  const fakeId = '507f1f77bcf86cd799439011';

  const name = 'Electronics';

  const createCategoryRequest = (data = { name }, token = adminToken) =>
    request(app)
      .post('/api/v1/category/create-category')
      .set('Authorization', token)
      .send(data);

  let adminToken;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    const { token } = await createTestUser();
    adminToken = token;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe('POST /api/v1/category/create-category', () => {
    it('creates a new category successfully', async () => {
      const { body } = await createCategoryRequest().expect(201);

      expect(body.success).toBe(true);
      expect(body.message).toBe('Category created successfully');

      const category = await categoryModel.findOne({ name });
      expect(category).toBeTruthy();

      // Verify response matches database
      expect(body.category._id).toBe(category._id.toString());
      expect(body.category.name).toBe(category.name);
      expect(body.category.slug).toBe(category.slug);
    });

    it('returns 400 error when name is missing', async () => {
      const { body } = await createCategoryRequest({}).expect(400);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Name is required');
    });

    it('returns 409 error when the category name already exists', async () => {
      await createCategoryRequest().expect(201);

      const { body } = await createCategoryRequest({
        name: name.toUpperCase(), // Also tests case insensitivity
      }).expect(409);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Category already exists');
    });

    it('returns 401 error when user is not authenticated', async () => {
      jest.spyOn(console, 'log').mockImplementation(() => {});

      const { body } = await request(app)
        .post('/api/v1/category/create-category')
        .expect(401);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Invalid token');
    });

    it('returns 401 error when user is not admin', async () => {
      const { token } = await createTestUser(0, 'user@test.com');

      const { body } = await createCategoryRequest({ name }, token).expect(401);

      expect(body.success).toBe(false);
      expect(body.message).toBe('UnAuthorized Access');
    });
  });

  describe('PUT /api/v1/category/update-category/:id', () => {
    const updatedName = 'Electronics & Gadgets';

    const updateCategoryRequest = (id, data = { name: updatedName }, token = adminToken) =>
      request(app)
        .put(`/api/v1/category/update-category/${id}`)
        .set('Authorization', token)
        .send(data);

    it('updates a category successfully', async () => {
      const response = await createCategoryRequest().expect(201);
      const id = response.body.category._id;

      const { body } = await updateCategoryRequest(id).expect(200);

      expect(body.success).toBe(true);
      expect(body.message).toBe('Category updated successfully');

      const category = await categoryModel.findById(id);
      expect(category).toBeTruthy();

      // Verify response matches database
      expect(body.category._id).toBe(category._id.toString());
      expect(body.category.name).toBe(category.name);
      expect(body.category.slug).toBe(category.slug);
    });

    it('allows updating a category without changing the name', async () => {
      const response = await createCategoryRequest().expect(201);
      const id = response.body.category._id;

      const { body } = await updateCategoryRequest(id, { name }).expect(200);

      expect(body.success).toBe(true);
      expect(body.message).toBe('Category updated successfully');
    });

    it('returns 400 error when name is missing', async () => {
      const response = await createCategoryRequest().expect(201);
      const id = response.body.category._id;

      const { body } = await updateCategoryRequest(id, {}).expect(400);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Name is required');
    });

    it('returns 404 error when the category does not exist', async () => {
      const { body } = await updateCategoryRequest(fakeId).expect(404);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Category not found');
    });

    it('returns 409 error when the new category name already exists', async () => {
      const response = await createCategoryRequest().expect(201);
      const id = response.body.category._id;

      await createCategoryRequest({ name: updatedName }).expect(201);

      const { body } = await updateCategoryRequest(id, {
        name: updatedName.toUpperCase(), // Also tests case insensitivity
      }).expect(409);

      expect(body.success).toBe(false); 
      expect(body.message).toBe('Category already exists');
    });

    it('returns 401 error when user is not authenticated', async () => {
      jest.spyOn(console, 'log').mockImplementation(() => {});

      const { body } = await request(app)
        .put(`/api/v1/category/update-category/${fakeId}`)
        .expect(401);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Invalid token');
    });

    it('returns 401 error when user is not admin', async () => {
      const { token } = await createTestUser(0, 'user@test.com');

      const response = await createCategoryRequest().expect(201);
      const id = response.body.category._id;

      const { body } = await updateCategoryRequest(
        id,
        { name: updatedName },
        token
      ).expect(401);

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
      const response = await createCategoryRequest().expect(201);
      const id = response.body.category._id;

      const { body } = await deleteCategoryRequest(id).expect(200);

      expect(body.success).toBe(true);
      expect(body.message).toBe('Category deleted successfully');

      // Verify category is removed from the database
      const category = await categoryModel.findById(id);
      expect(category).toBeNull();
    });

    it('returns 404 error when the category does not exist', async () => {
      const { body } = await deleteCategoryRequest(fakeId).expect(404);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Category not found');
    });

    it('returns 409 error when the category still has products', async () => {
      const response = await createCategoryRequest().expect(201);
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

    it('returns 401 error when user is not authenticated', async () => {
      jest.spyOn(console, 'log').mockImplementation(() => {});

      const { body } = await request(app)
        .delete(`/api/v1/category/delete-category/${fakeId}`)
        .expect(401);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Invalid token');
    });

    it('returns 401 error when user is not admin', async () => {
      const { token } = await createTestUser(0, 'user@test.com');

      const response = await createCategoryRequest().expect(201);
      const id = response.body.category._id;

      const { body } = await deleteCategoryRequest(id, token).expect(401);

      expect(body.success).toBe(false);
      expect(body.message).toBe('UnAuthorized Access');
    });
  });
});
