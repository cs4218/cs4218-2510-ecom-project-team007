import request from 'supertest';
import app from '../../app.js';
import User from '../../models/userModel.js';
import Order from '../../models/orderModel.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { connectTestDB, closeTestDB, clearTestDB } from './setup.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

// Mock Braintree
jest.mock('braintree', () => {
  const mockGateway = {
    clientToken: { generate: jest.fn() },
    transaction: { sale: jest.fn() },
  };

  return {
    BraintreeGateway: jest.fn(() => mockGateway),
    Environment: { Sandbox: 'sandbox', Production: 'production' },
    _mockGateway: mockGateway,
  };
});

const braintree = require('braintree');
const mockGateway = braintree._mockGateway;

// Connect DB
beforeAll(async () => await connectTestDB());
afterAll(async () => await closeTestDB());

beforeEach(async () => {
  await clearTestDB();
  jest.clearAllMocks();

  await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    answer: 'test answer',
    address: '123 Test St',
    phone: '12345678',
    role: 0,
  });

  // Default Braintree mock
  mockGateway.clientToken.generate.mockImplementation((opts, cb) => cb(null, { clientToken: 'fake_token' }));
  mockGateway.transaction.sale.mockImplementation((args, cb) =>
    cb(null, { success: true, transaction: { id: 'txn_123', amount: args.amount } })
  );
});

const getAuthToken = async () => {
  const user = await User.findOne({ email: 'test@example.com' });

  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return token;
};

describe('Braintree Payment API', () => {

  describe('Authentication', () => {
    it('generates JWT successfully', async () => {
      const token = await getAuthToken();
      expect(token).toBeDefined();
    });
  });

  describe('GET /api/v1/product/braintree/token', () => {
    it('returns client token', async () => {
      const res = await request(app).get('/api/v1/product/braintree/token');
      expect(res.status).toBe(200);
      expect(res.body.clientToken).toBe('fake_token');
      expect(mockGateway.clientToken.generate).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/v1/product/braintree/payment', () => {
    let cart;

    beforeEach(() => {
      cart = [
        { _id: new mongoose.Types.ObjectId(), name: 'Laptop', price: 1000 },
        { _id: new mongoose.Types.ObjectId(), name: 'Mouse', price: 50 },
      ];
    });

    it('creates order successfully', async () => {
      const token = await getAuthToken();
      const res = await request(app)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', token)
        .send({ nonce: 'fake_nonce', cart });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      const orders = await Order.find({});
      expect(orders.length).toBe(1);
      expect(orders[0].products.length).toBe(2);
      expect(orders[0].payment.transaction.id).toBe('txn_123');
    });

    it('returns 401 if unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/product/braintree/payment')
        .send({ nonce: 'fake_nonce', cart });
      expect(res.status).toBe(401);
    });

    it('returns 400 if cart empty', async () => {
      const token = await getAuthToken();
      const res = await request(app)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', token) 
        .send({ nonce: 'fake_nonce', cart: [] });
      expect(res.status).toBe(400);
    });

    it('returns 400 if cart missing', async () => {
      const token = await getAuthToken();
      const res = await request(app)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', token) 
        .send({ nonce: 'fake_nonce' });
      expect(res.status).toBe(400);
    });
  });
});