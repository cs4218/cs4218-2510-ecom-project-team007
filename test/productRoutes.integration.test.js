import path from 'path';
import request from 'supertest';
import app from '../app.js';
import categoryModel from '../models/categoryModel.js';
import productModel from '../models/productModel';
import { clearTestDB, closeTestDB, connectTestDB, createTestUser } from './setup.js';

describe('Product Routes Integration Tests', () => {
  const jpgPhotoPath = path.join(__dirname, 'fixtures', 'test-image.jpg');
  const gifPhotoPath = path.join(__dirname, 'fixtures', 'test-image.gif');

  const fakeId = '507f1f77bcf86cd799439011';

  const name = 'Laptop';
  const productData = {
    name,
    description: 'High-performance laptop',
    price: 999.99,
    quantity: 10,
    shipping: true,
  };

  const createProductRequest = (data = productData, token = adminToken) =>
    request(app)
      .post('/api/v1/product/create-product')
      .set('Authorization', token)
      .field('category', categoryId)
      .field(data);

  let adminToken;
  let categoryId;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    const { token } = await createTestUser();
    adminToken = token;

    const category = await categoryModel.create({
      name: 'Electronics',
      slug: 'electronics',
    });
    categoryId = category._id.toString();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe('POST /api/v1/product/create-product', () => {
    it('creates a new product with a photo successfully', async () => {
      const { body } = await createProductRequest()
        .attach('photo', jpgPhotoPath)
        .expect(201);

      expect(body.success).toBe(true);
      expect(body.message).toBe('Product created successfully');

      const product = await productModel.findOne({ name });
      expect(product).toBeTruthy();

      // Verify response matches database
      expect(body.product._id).toBe(product._id.toString());
      expect(body.product.name).toBe(product.name);
      expect(body.product.slug).toBe(product.slug);

      // Verify photo was saved
      expect(product.photo.data).toBeTruthy();
      expect(product.photo.contentType).toBe('image/jpeg');
    });

    it('creates a new product without a photo successfully', async () => {
      const { body } = await createProductRequest().expect(201);

      expect(body.success).toBe(true);
      expect(body.message).toBe('Product created successfully');

      const product = await productModel.findOne({ name });
      expect(product).toBeTruthy();

      // Verify response matches database
      expect(body.product._id).toBe(product._id.toString());
      expect(body.product.name).toBe(product.name);
      expect(body.product.slug).toBe(product.slug);
    });

    it('returns 400 error when required fields are missing', async () => {
      const { body } = await createProductRequest({}).expect(400);

      expect(body.success).toBe(false);
      expect(body.message).toContain('required');
    });

    it('returns 400 error when photo type is invalid', async () => {
      const { body } = await createProductRequest()
        .attach('photo', gifPhotoPath)
        .expect(400);

      expect(body.success).toBe(false);
      expect(body.message).toMatch(/jpeg|png|webp/i);
    });

    it('returns 409 error when the product name already exists', async () => {
      await createProductRequest().expect(201);

      const { body } = await createProductRequest({
        ...productData,
        name: name.toUpperCase(), // Also tests case insensitivity
      }).expect(409);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Product name already exists');
    });

    it('returns 401 error when user is not authenticated', async () => {
      jest.spyOn(console, 'log').mockImplementation(() => {});

      const { body } = await request(app)
        .post('/api/v1/product/create-product')
        .expect(401);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Invalid token');
    });

    it('returns 401 error when user is not admin', async () => {
      const { token } = await createTestUser(0, 'user@test.com');

      const { body } = await createProductRequest(productData, token).expect(401);

      expect(body.success).toBe(false);
      expect(body.message).toBe('UnAuthorized Access');
    });
  });

  describe('PUT /api/v1/product/update-product/:pid', () => {
    const updatedName = 'Gaming Laptop';
    const updatedProductData = {
      name: updatedName,
      description: 'High-performance gaming laptop',
      price: 1299.99,
      quantity: 5,
      shipping: true,
    };

    const updateProductRequest = (id, data = updatedProductData, token = adminToken) =>
      request(app)
        .put(`/api/v1/product/update-product/${id}`)
        .set('Authorization', token)
        .field('category', categoryId)
        .field(data);

    it('updates a product with a photo successfully', async () => {
      const response = await createProductRequest().expect(201);
      const id = response.body.product._id;

      const { body } = await updateProductRequest(id)
        .attach('photo', jpgPhotoPath)
        .expect(200);

      expect(body.success).toBe(true);
      expect(body.message).toBe('Product updated successfully');

      const product = await productModel.findById(id);
      expect(product).toBeTruthy();

      // Verify response matches database
      expect(body.product._id).toBe(product._id.toString());
      expect(body.product.name).toBe(product.name);
      expect(body.product.slug).toBe(product.slug);

      // Verify photo was saved
      expect(product.photo.data).toBeTruthy();
      expect(product.photo.contentType).toBe('image/jpeg');
    });

    it('updates a product without a photo successfully', async () => {
      const response = await createProductRequest().expect(201);
      const id = response.body.product._id;

      const { body } = await updateProductRequest(id).expect(200);

      expect(body.success).toBe(true);
      expect(body.message).toBe('Product updated successfully');

      const product = await productModel.findById(id);
      expect(product).toBeTruthy();

      // Verify response matches database
      expect(body.product._id).toBe(product._id.toString());
      expect(body.product.name).toBe(product.name);
      expect(body.product.slug).toBe(product.slug);
    });

    it('allows updating a product without changing the name', async () => {
      const response = await createProductRequest().expect(201);
      const id = response.body.product._id;

      const { body } = await updateProductRequest(id, {
        ...updatedProductData,
        name,
      }).expect(200);

      expect(body.success).toBe(true);
      expect(body.message).toBe('Product updated successfully');
    });

    it('returns 400 error when required fields are missing', async () => {
      const response = await createProductRequest().expect(201);
      const id = response.body.product._id;

      const { body } = await updateProductRequest(id, {}).expect(400);

      expect(body.success).toBe(false);
      expect(body.message).toContain('required');
    });

    it('returns 400 error when photo type is invalid', async () => {
      const response = await createProductRequest().expect(201);
      const id = response.body.product._id;

      const { body } = await updateProductRequest(id)
        .attach('photo', gifPhotoPath)
        .expect(400);

      expect(body.success).toBe(false);
      expect(body.message).toMatch(/jpeg|png|webp/i);
    });

    it('returns 404 error when the product does not exist', async () => {
      const { body } = await updateProductRequest(fakeId).expect(404);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Product not found');
    });

    it('returns 409 error when the new product name already exists', async () => {
      const response = await createProductRequest().expect(201);
      const id = response.body.product._id;

      await createProductRequest({ ...productData, name: updatedName }).expect(201);

      const { body } = await updateProductRequest(id, {
        ...productData,
        name: updatedName.toUpperCase(), // Also tests case insensitivity
      }).expect(409);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Product name already exists');
    });

    it('returns 401 error when user is not authenticated', async () => {
      jest.spyOn(console, 'log').mockImplementation(() => {});

      const { body } = await request(app)
        .put(`/api/v1/product/update-product/${fakeId}`)
        .expect(401);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Invalid token');
    });

    it('returns 401 error when user is not admin', async () => {
      const { token } = await createTestUser(0, 'user@test.com');

      const response = await createProductRequest().expect(201);
      const id = response.body.product._id;

      const { body } = await updateProductRequest(
        id,
        updatedProductData,
        token
      ).expect(401);

      expect(body.success).toBe(false);
      expect(body.message).toBe('UnAuthorized Access');
    });
  });

  describe('DELETE /api/v1/product/delete-product/:pid', () => {
    const deleteProductRequest = (id, token = adminToken) =>
      request(app)
        .delete(`/api/v1/product/delete-product/${id}`)
        .set('Authorization', token);

    it('deletes a product successfully', async () => {
      const response = await createProductRequest().expect(201);
      const id = response.body.product._id;

      const { body } = await deleteProductRequest(id).expect(200);

      expect(body.success).toBe(true);
      expect(body.message).toBe('Product deleted successfully');

      // Verify product is removed from the database
      const product = await productModel.findById(id);
      expect(product).toBeNull();
    });

    it('returns 404 error when the product does not exist', async () => {
      const { body } = await deleteProductRequest(fakeId).expect(404);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Product not found');
    });

    it('returns 401 error when user is not authenticated', async () => {
      jest.spyOn(console, 'log').mockImplementation(() => {});

      const { body } = await request(app)
        .delete(`/api/v1/product/delete-product/${fakeId}`)
        .expect(401);

      expect(body.success).toBe(false);
      expect(body.message).toBe('Invalid token');
    });

    it('returns 401 error when user is not admin', async () => {
      const { token } = await createTestUser(0, 'user@test.com');

      const response = await createProductRequest().expect(201);
      const id = response.body.product._id;

      const { body } = await deleteProductRequest(id, token).expect(401);

      expect(body.success).toBe(false);
      expect(body.message).toBe('UnAuthorized Access');
    });
  });
});
