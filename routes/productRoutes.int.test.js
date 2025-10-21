import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import productModel from '../models/productModel';
import categoryModel from "../models/categoryModel";

const categories = [];
const products = [];
let mongoServer, req, res;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Load 3 test categories into categoryModel
  for (let i = 1; i <= 3; i++) {
    categories.push(await categoryModel({
                      name: "Category " + i,
                      slug: "category" + i,
                    }).save());
  }

  // Prepare 5 products for testing (yet to be added)
  for (let i = 1; i <= 5; i++) {
    products.push(await productModel({
      name: "Product " + i,
      slug: "Product-" + i,
      description: "product " + i,
      price: 1,
      category: categories[0]._id,
      quantity: 2,
      shipping: true,
      photo: {
        data: Buffer.from("sample buffered photo"),
        contentType: "image/jpeg"
      }
    }).save());
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Test get-product route', () => {
  const API_CALL = '/api/v1/product/get-product';

  it('should return all 5 products', async () => {
    const res = await request(app).get(API_CALL);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products).toHaveLength(5);
  });
});

describe('Test get-product/:slug route', () => {
  const API_CALL = '/api/v1/product/get-product/';

  it('should return first product', async () => {
    const res = await request(app).get(API_CALL + products[0].slug);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.product._id.toString()).toEqual(products[0]._id.toString());
  });

  it('should return 404 if requested product not found', async () => {
    const res = await request(app).get(API_CALL + 'unknownSLUG');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toEqual("No matching product found");
  });
});

describe('Test product-filters route', () => {
  const API_CALL = '/api/v1/product/product-filters';

  it('should return all relevant fields', async () => {
    const res = await request(app).post(API_CALL).send({
      radio: [0,1],
      checked: [categories[0]._id]
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success");
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("page");
    expect(res.body).toHaveProperty("pages");
    expect(res.body).toHaveProperty("products");
  });

  it('should return filtered products', async () => {
    const res = await request(app).post(API_CALL).send({
      radio: [0,1],
      checked: [categories[0]._id],
      page: 1
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(5);
    expect(res.body.page).toBe(1);
    expect(res.body.pages).toBe(1);
    expect(res.body.products).toHaveLength(5);
  });

  it('should return 400 if invalid radio', async () => {
    const res = await request(app).post(API_CALL).send({
      radio: [0],
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid radio field");
  });

  it('should return 400 if invalid radio', async () => {
    const res = await request(app).post(API_CALL).send({
      radio: [0, 1, 2],
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid radio field");
  });
});

describe('Test product-count route', () => {
  const API_CALL = '/api/v1/product/product-count';

  it('should return the correct count', async () => {
    const res = await request(app).get(API_CALL);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(5);
  });
});

describe('Test product-list route', () => {
  const API_CALL = '/api/v1/product/product-list/';

  it('should return all 5 products', async () => {
    const res = await request(app).get(API_CALL + 1);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products).toHaveLength(5);
  });

  it('should not return any products', async () => {
    // ensure that the param is correctly passed
    const res = await request(app).get(API_CALL + 2);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products).toHaveLength(0);
  });
});

describe('Test product-category route', () => {
  const API_CALL = '/api/v1/product/product-category/';

  it('should return all 5 products', async () => {
    const res = await request(app).get(API_CALL + categories[0].slug);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products).toHaveLength(5);
    expect(res.body.category._id.toString()).toEqual(categories[0]._id.toString());
  });

  it('should return 404 if requested category not found', async () => {
    const res = await request(app).get(API_CALL + 'unknownSLUG');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Requested category not found");
  });
});