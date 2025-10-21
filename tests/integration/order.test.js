// tests/integration/order.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import Order from '../../models/orderModel.js';
import Product from '../../models/productModel.js';
import { 
  connectTestDB, 
  closeTestDB, 
  clearTestDB, 
  createTestUser 
} from './setup.js';

jest.mock('../../middlewares/authMiddleware.js', () => {
  return {
    requireSignIn: jest.fn((req, res, next) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (token === 'user_token') {
        req.user = global.mockRegularUser;
      } else if (token === 'admin_token') {
        req.user = global.mockAdminUser;
      } else if (!token) {
        return res.status(401).send({ error: 'Unauthorized' });
      } else {
        return res.status(401).send({ error: 'Invalid token' });
      }
      next();
    }),
    isAdmin: jest.fn((req, res, next) => {
      if (req.user.role !== 1) {
        return res.status(403).send({ error: 'Admin access required' });
      }
      next();
    })
  };
});

describe('Order System Integration Tests', () => {
  let regularUser;
  let adminUser;
  let testProduct;
  let testOrder;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create real users
    regularUser = await createTestUser(0, 'user@test.com');
    adminUser = await createTestUser(1, 'admin@test.com');

    // Set global mock users that the middleware will use
    global.mockRegularUser = {
      _id: regularUser.user._id,
      role: 0
    };
    global.mockAdminUser = {
      _id: adminUser.user._id,
      role: 1
    };

    testProduct = await Product.create({
      name: 'Test Product',
      slug: 'test-product',
      price: 99.99,
      description: 'Test description',
      category: new mongoose.Types.ObjectId(),
      quantity: 10,
      shipping: true
    });

    // Create order with the actual user ID from the database
    testOrder = await Order.create({
      products: [testProduct._id],
      payment: { 
        success: true, 
        method: 'card',
        amount: 99.99
      },
      buyer: regularUser.user._id,
      status: 'Pending'
    });
  });

  afterEach(() => {
    // Clean up global variables
    delete global.mockRegularUser;
    delete global.mockAdminUser;
  });

  describe('Order Model', () => {
    it('should create order with valid data', async () => {
      const orderData = {
        products: [testProduct._id],
        payment: {
          method: 'card',
          success: true,
          amount: 99.99
        },
        buyer: regularUser.user._id,
        status: 'Pending'
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder._id).toBeDefined();
      expect(savedOrder.buyer.toString()).toBe(regularUser.user._id.toString());
      expect(savedOrder.products).toHaveLength(1);
      expect(savedOrder.payment.success).toBe(true);
      expect(savedOrder.status).toBe('Pending');
    });

    it('should set default status to Pending', async () => {
      const orderData = {
        products: [testProduct._id],
        payment: { success: true },
        buyer: regularUser.user._id
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.status).toBe('Pending');
    });

    it('should validate status enum values', async () => {
      const orderData = {
        products: [testProduct._id],
        payment: { success: true },
        buyer: regularUser.user._id,
        status: 'InvalidStatus'
      };

      const order = new Order(orderData);
      
      await expect(order.save()).rejects.toThrow();
    });

    it('should allow empty products array', async () => {
      const orderData = {
        products: [],
        payment: { success: true },
        buyer: regularUser.user._id
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();
      
      expect(savedOrder.products).toHaveLength(0);
    });
  });

  describe('GET /api/v1/auth/orders', () => {
    it('should get orders for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/auth/orders')
        .set('Authorization', 'Bearer user_token')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('_id');
      expect(response.body[0]).toHaveProperty('products');
      expect(response.body[0]).toHaveProperty('buyer');
      expect(response.body[0].status).toBe('Pending');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/auth/orders')
        .expect(401);
    });

    it('should only return orders for the logged-in user', async () => {
      const otherUser = await createTestUser(0, 'other@test.com');
      
      const otherProduct = await Product.create({
        name: 'Other Product',
        slug: 'other-product',
        price: 49.99,
        description: 'Other description',
        category: new mongoose.Types.ObjectId(),
        quantity: 5,
        shipping: true
      });
      
      await Order.create({
        products: [otherProduct._id],
        payment: { success: true },
        buyer: otherUser.user._id
      });

      const response = await request(app)
        .get('/api/v1/auth/orders')
        .set('Authorization', 'Bearer user_token')
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].buyer._id).toBe(regularUser.user._id.toString());
    });

    it('should populate product and buyer information', async () => {
      const response = await request(app)
        .get('/api/v1/auth/orders')
        .set('Authorization', 'Bearer user_token')
        .expect(200);

      expect(response.body[0].products[0]).toHaveProperty('name');
      expect(response.body[0].products[0].name).toBe('Test Product');
      expect(response.body[0].buyer).toHaveProperty('name');
      expect(response.body[0].buyer.name).toBe('Test User');
    });
  });

  describe('GET /api/v1/auth/all-orders', () => {
    it('should get all orders for admin', async () => {
      const response = await request(app)
        .get('/api/v1/auth/all-orders')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('_id');
      expect(response.body[0]).toHaveProperty('products');
      expect(response.body[0]).toHaveProperty('buyer');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/v1/auth/all-orders')
        .set('Authorization', 'Bearer user_token')
        .expect(403);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/auth/all-orders')
        .expect(401);
    });

    it('should return orders sorted by creation date', async () => {
      const olderProduct = await Product.create({
        name: 'Older Product',
        slug: 'older-product',
        price: 29.99,
        description: 'Older description',
        category: new mongoose.Types.ObjectId(),
        quantity: 3,
        shipping: true
      });

      await Order.create({
        products: [olderProduct._id],
        payment: { success: true },
        buyer: regularUser.user._id,
        status: 'Processing',
        createdAt: new Date('2023-01-01')
      });

      const response = await request(app)
        .get('/api/v1/auth/all-orders')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.length).toBe(2);
    });
  });

  describe('PUT /api/v1/auth/order-status/:orderId', () => {
    it('should update order status as admin', async () => {
      const response = await request(app)
        .put(`/api/v1/auth/order-status/${testOrder._id}`)
        .set('Authorization', 'Bearer admin_token')
        .send({ status: 'Shipped' })
        .expect(200);

      expect(response.body.status).toBe('Shipped');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .put(`/api/v1/auth/order-status/${testOrder._id}`)
        .set('Authorization', 'Bearer user_token')
        .send({ status: 'Shipped' })
        .expect(403);
    });

    it('should return 200 for non-existent order', async () => {
      const fakeOrderId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put(`/api/v1/auth/order-status/${fakeOrderId}`)
        .set('Authorization', 'Bearer admin_token')
        .send({ status: 'Shipped' })
        .expect(200);
    });

    it('should return 200 for invalid status', async () => {
      const response = await request(app)
        .put(`/api/v1/auth/order-status/${testOrder._id}`)
        .set('Authorization', 'Bearer admin_token')
        .send({ status: 'InvalidStatus' })
        .expect(200);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/auth/order-status/${testOrder._id}`)
        .send({ status: 'Shipped' })
        .expect(401);
    });
  });

  describe('Order Flow Integration', () => {
    it('should complete full order lifecycle', async () => {
      const newProduct = await Product.create({
        name: 'New Product',
        slug: 'new-product',
        price: 79.99,
        description: 'New description',
        category: new mongoose.Types.ObjectId(),
        quantity: 8,
        shipping: true
      });

      const newOrder = await Order.create({
        products: [newProduct._id],
        payment: { success: true, method: 'card' },
        buyer: regularUser.user._id,
        status: 'Pending'
      });

      const getUserOrdersResponse = await request(app)
        .get('/api/v1/auth/orders')
        .set('Authorization', 'Bearer user_token')
        .expect(200);

      expect(getUserOrdersResponse.body.length).toBe(2);

      const getAllOrdersResponse = await request(app)
        .get('/api/v1/auth/all-orders')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(getAllOrdersResponse.body.length).toBe(2);

      const updateStatusResponse = await request(app)
        .put(`/api/v1/auth/order-status/${newOrder._id}`)
        .set('Authorization', 'Bearer admin_token')
        .send({ status: 'Delivered' })
        .expect(200);

      expect(updateStatusResponse.body.status).toBe('Delivered');

      const finalUserOrders = await request(app)
        .get('/api/v1/auth/orders')
        .set('Authorization', 'Bearer user_token')
        .expect(200);

      const updatedOrder = finalUserOrders.body.find(order => order._id === newOrder._id.toString());
      expect(updatedOrder.status).toBe('Delivered');
    });
  });
});